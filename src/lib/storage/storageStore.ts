import { StorageUnavailableError } from "./localStorageAdapter";
import type {
    StorageAdapter,
    StorageEnvelope,
    StorageFailure,
    StorageFailureReason,
    StorageInspection,
    StorageListener,
    StorageResult,
    StorageStore,
    StorageStoreOptions,
} from "./storage.types";

function success<T>(value: T): StorageResult<T> {
    return { ok: true, value };
}

function failure(
    reason: StorageFailureReason,
    error?: unknown,
): StorageFailure {
    return { ok: false, reason, error };
}

function classifyStorageError(
    error: unknown,
    fallback: "read" | "write",
): StorageFailureReason {
    if (error instanceof StorageUnavailableError) {
        return "unavailable";
    }

    if (
        error instanceof DOMException &&
        (error.name === "QuotaExceededError" ||
            error.name === "NS_ERROR_DOM_QUOTA_REACHED")
    ) {
        return "quota";
    }

    return fallback;
}

function parseEnvelope(raw: string): StorageEnvelope | null {
    let parsed: unknown;

    try {
        parsed = JSON.parse(raw);
    } catch {
        return null;
    }

    if (!parsed || typeof parsed !== "object") {
        return null;
    }

    const candidate = parsed as Partial<StorageEnvelope>;

    if (
        typeof candidate.version !== "number" ||
        typeof candidate.updatedAt !== "string" ||
        !("value" in candidate)
    ) {
        return null;
    }

    return {
        version: candidate.version,
        updatedAt: candidate.updatedAt,
        value: candidate.value,
    };
}

export function createStorageStore<T>(
    adapter: StorageAdapter,
    storageKey: string,
    options: StorageStoreOptions<T>,
): StorageStore<T> {
    const listeners = new Set<StorageListener<T>>();

    function read(): StorageResult<T | null> {
        let raw: string | null;

        try {
            raw = adapter.getItem(storageKey);
        } catch (error) {
            return failure(classifyStorageError(error, "read"), error);
        }

        if (raw === null) {
            return success(null);
        }

        const envelope = parseEnvelope(raw);

        if (!envelope) {
            return failure("invalid");
        }

        let decoded: T | null;

        try {
            decoded = options.codec.decode(
                envelope.value,
                envelope.version,
            );
        } catch (error) {
            return failure("invalid", error);
        }

        if (decoded === null) {
            return failure("invalid");
        }

        return success(decoded);
    }

    function notify(value: T | null): void {
        for (const listener of listeners) {
            listener(value);
        }
    }

    function write(value: T): StorageResult<T> {
        let encoded: unknown;

        try {
            encoded = options.codec.encode
                ? options.codec.encode(value)
                : value;
        } catch (error) {
            return failure("serialization", error);
        }

        const envelope: StorageEnvelope = {
            version: options.version,
            updatedAt: new Date().toISOString(),
            value: encoded,
        };

        let serialized: string;

        try {
            serialized = JSON.stringify(envelope);
        } catch (error) {
            return failure("serialization", error);
        }

        try {
            adapter.setItem(storageKey, serialized);
        } catch (error) {
            return failure(classifyStorageError(error, "write"), error);
        }

        notify(value);
        return success(value);
    }

    function remove(): StorageResult<null> {
        try {
            adapter.removeItem(storageKey);
        } catch (error) {
            return failure(classifyStorageError(error, "write"), error);
        }

        notify(null);
        return success(null);
    }

    function readOr(fallbackValue: T): StorageResult<T> {
        const result = read();

        if (!result.ok) {
            return result;
        }

        return success(result.value ?? fallbackValue);
    }

    function update(
        updater: (current: T | null) => T,
    ): StorageResult<T> {
        const current = read();

        if (!current.ok) {
            return current;
        }

        let next: T;

        try {
            next = updater(current.value);
        } catch (error) {
            return failure("write", error);
        }

        return write(next);
    }

    function inspect(): StorageResult<StorageInspection> {
        let raw: string | null;

        try {
            raw = adapter.getItem(storageKey);
        } catch (error) {
            return failure(classifyStorageError(error, "read"), error);
        }

        return success({
            key: storageKey,
            configuredVersion: options.version,
            raw,
            envelope: raw === null ? null : parseEnvelope(raw),
        });
    }

    function subscribe(
        listener: StorageListener<T>,
        subscriptionOptions: { emitCurrent?: boolean } = {},
    ): () => void {
        listeners.add(listener);

        if (subscriptionOptions.emitCurrent) {
            const current = read();
            listener(current.ok ? current.value : null);
        }

        return () => {
            listeners.delete(listener);
        };
    }

    const unsubscribeExternal = adapter.subscribe?.(
        storageKey,
        () => {
            const current = read();
            notify(current.ok ? current.value : null);
        },
    );

    // The adapter subscription intentionally lives for the lifetime of the
    // store object. Stores are expected to be module-level singletons.
    void unsubscribeExternal;

    return {
        key: storageKey,
        version: options.version,
        read,
        readOr,
        write,
        update,
        remove,
        inspect,
        subscribe,
    };
}

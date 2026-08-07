export type StorageFailureReason =
    | "unavailable"
    | "serialization"
    | "quota"
    | "read"
    | "write"
    | "invalid";

export type StorageSuccess<T> = {
    ok: true;
    value: T;
};

export type StorageFailure = {
    ok: false;
    reason: StorageFailureReason;
    error?: unknown;
};

export type StorageResult<T> = StorageSuccess<T> | StorageFailure;

export type StorageCodec<T> = {
    /**
     * Convert unknown persisted data into the current domain value.
     * Return null when the value cannot be accepted or migrated.
     */
    decode(value: unknown, storedVersion: number): T | null;

    /**
     * Convert a domain value into a JSON-serializable representation.
     * Omit this when the value itself is already serializable.
     */
    encode?(value: T): unknown;
};

export type StorageEnvelope = {
    version: number;
    updatedAt: string;
    value: unknown;
};

export type StorageInspection = {
    key: string;
    configuredVersion: number;
    raw: string | null;
    envelope: StorageEnvelope | null;
};

export type StorageStoreOptions<T> = {
    key: string;
    version: number;
    codec: StorageCodec<T>;
};

export type StorageSubscriptionOptions = {
    /** Immediately invoke the listener with the current decoded value. */
    emitCurrent?: boolean;
};

export type StorageListener<T> = (value: T | null) => void;

export type StorageStore<T> = {
    readonly key: string;
    readonly version: number;

    read(): StorageResult<T | null>;
    readOr(fallback: T): StorageResult<T>;
    write(value: T): StorageResult<T>;
    update(updater: (current: T | null) => T): StorageResult<T>;
    remove(): StorageResult<null>;
    inspect(): StorageResult<StorageInspection>;
    subscribe(
        listener: StorageListener<T>,
        options?: StorageSubscriptionOptions,
    ): () => void;
};

export type StorageAdapter = {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;

    /**
     * Subscribe to changes produced outside the current store instance,
     * such as browser storage events from another tab.
     */
    subscribe?(key: string, listener: () => void): () => void;
};

export type StorageNamespace = {
    readonly prefix: string;
    createStore<T>(options: StorageStoreOptions<T>): StorageStore<T>;
};

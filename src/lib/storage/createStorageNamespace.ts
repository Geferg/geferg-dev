import { localStorageAdapter } from "./localStorageAdapter";
import { createStorageStore } from "./storageStore";
import type {
    StorageAdapter,
    StorageNamespace,
    StorageStoreOptions,
} from "./storage.types";

function normalizeSegment(value: string): string {
    return value.trim().replace(/^:+|:+$/g, "");
}

export function createStorageNamespace(
    prefix: string,
    adapter: StorageAdapter = localStorageAdapter,
): StorageNamespace {
    const normalizedPrefix = normalizeSegment(prefix);

    if (!normalizedPrefix) {
        throw new Error("Storage namespace prefix cannot be empty");
    }

    return {
        prefix: normalizedPrefix,

        createStore<T>(options: StorageStoreOptions<T>) {
            const normalizedKey = normalizeSegment(options.key);

            if (!normalizedKey) {
                throw new Error("Storage store key cannot be empty");
            }

            if (!Number.isInteger(options.version) || options.version < 1) {
                throw new Error("Storage store version must be a positive integer");
            }

            return createStorageStore(
                adapter,
                `${normalizedPrefix}:${normalizedKey}`,
                options,
            );
        },
    };
}

import type { StorageAdapter } from "./storage.types";

function getLocalStorage(): Storage | null {
    if (typeof window === "undefined") {
        return null;
    }

    try {
        return window.localStorage;
    } catch {
        return null;
    }
}

function requireLocalStorage(): Storage {
    const storage = getLocalStorage();

    if (!storage) {
        throw new StorageUnavailableError();
    }

    return storage;
}

export class StorageUnavailableError extends Error {
    constructor() {
        super("localStorage is unavailable");
        this.name = "StorageUnavailableError";
    }
}

export const localStorageAdapter: StorageAdapter = {
    getItem(key) {
        return requireLocalStorage().getItem(key);
    },

    setItem(key, value) {
        requireLocalStorage().setItem(key, value);
    },

    removeItem(key) {
        requireLocalStorage().removeItem(key);
    },

    subscribe(key, listener) {
        if (typeof window === "undefined") {
            return () => {};
        }

        const handleStorage = (event: StorageEvent) => {
            if (event.storageArea !== getLocalStorage()) {
                return;
            }

            if (event.key === key || event.key === null) {
                listener();
            }
        };

        window.addEventListener("storage", handleStorage);

        return () => {
            window.removeEventListener("storage", handleStorage);
        };
    },
};

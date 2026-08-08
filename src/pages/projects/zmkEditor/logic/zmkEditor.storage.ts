import { siteStorage } from "@/lib/storage/siteStorage";
import type { StorageResult } from "@/lib/storage";

import type {
    KeyCategory,
    ZmkEditorState,
    ZmkKey,
} from "../zmkEditor.types";
import {
    KEY_COUNT,
    createDefaultState,
    normalizeState,
} from "./zmkEditor.data";

const LEGACY_EDITOR_STATE_KEY = "geferg-zmk-layout-editor-v2";
const REGISTER_LAYOUT_ID = "corne-42";

const VALID_CATEGORIES = new Set<KeyCategory>([
    "default",
    "modifier",
    "layer",
    "system",
    "rgb",
    "nordic",
    "transparent",
    "none",
]);

export type ZmkRegisterOperation = "yank" | "delete";

export type ZmkKeyRegisterEntry = {
    kind: "zmk-key";
    operation: ZmkRegisterOperation;
    capturedAt: string;
    key: ZmkKey;
    source: {
        layoutId: typeof REGISTER_LAYOUT_ID;
        keyCount: typeof KEY_COUNT;
        layerIndex: number;
        layerName: string;
        layerConstant: string;
        keyIndex: number;
    };
};

export const zmkEditorStateStore = siteStorage.createStore<ZmkEditorState>({
    key: "zmk-editor:state",
    version: 3,
    codec: {
        decode(value, storedVersion) {
            if (
                (storedVersion !== 1 && storedVersion !== 2 && storedVersion !== 3) ||
                !isEditorStateCandidate(value)
            ) {
                return null;
            }

            return normalizeState(value);
        },
    },
});

export const zmkKeyRegisterStore = siteStorage.createStore<ZmkKeyRegisterEntry>({
    key: "zmk-editor:key-register",
    version: 1,
    codec: {
        decode(value, storedVersion) {
            if (storedVersion !== 1 || !isRegisterEntry(value)) {
                return null;
            }

            return {
                ...value,
                key: cloneKey(value.key),
                source: { ...value.source },
            };
        },
    },
});

export function loadEditorState(): ZmkEditorState {
    const stored = zmkEditorStateStore.read();

    if (stored.ok && stored.value) {
        return stored.value;
    }

    if (stored.ok && stored.value === null) {
        const migrated = readLegacyEditorState();

        if (migrated) {
            const writeResult = zmkEditorStateStore.write(migrated);

            if (writeResult.ok) {
                removeLegacyEditorState();
            }

            return migrated;
        }
    }

    return createDefaultState();
}

export function writeSelectedKeyToRegister(
    state: ZmkEditorState,
    operation: ZmkRegisterOperation,
): StorageResult<ZmkKeyRegisterEntry> {
    const layer = state.layers[state.currentLayer];
    const key = layer.keys[state.selectedKey];

    return zmkKeyRegisterStore.write({
        kind: "zmk-key",
        operation,
        capturedAt: new Date().toISOString(),
        key: cloneKey(key),
        source: {
            layoutId: REGISTER_LAYOUT_ID,
            keyCount: KEY_COUNT,
            layerIndex: state.currentLayer,
            layerName: layer.name,
            layerConstant: layer.constant,
            keyIndex: state.selectedKey,
        },
    });
}

export function readKeyRegister(): StorageResult<ZmkKeyRegisterEntry | null> {
    return zmkKeyRegisterStore.read();
}

export function cloneKey(key: ZmkKey): ZmkKey {
    return {
        binding: key.binding,
        ...(key.labelOverride !== undefined
            ? { labelOverride: key.labelOverride }
            : {}),
        ...(key.categoryOverride !== undefined
            ? { categoryOverride: key.categoryOverride }
            : {}),
    };
}

function readLegacyEditorState(): ZmkEditorState | null {
    if (typeof window === "undefined") {
        return null;
    }

    try {
        const raw = window.localStorage.getItem(LEGACY_EDITOR_STATE_KEY);

        if (!raw) {
            return null;
        }

        const parsed: unknown = JSON.parse(raw);

        return isEditorStateCandidate(parsed)
            ? normalizeState(parsed)
            : null;
    } catch {
        return null;
    }
}

function removeLegacyEditorState(): void {
    if (typeof window === "undefined") {
        return;
    }

    try {
        window.localStorage.removeItem(LEGACY_EDITOR_STATE_KEY);
    } catch {
        // The migrated value is already available in memory. Failure to remove
        // the old key should not block the editor.
    }
}

function isEditorStateCandidate(value: unknown): boolean {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as { layers?: unknown };

    return (
        Array.isArray(candidate.layers) &&
        candidate.layers.length > 0 &&
        candidate.layers.every((layer) => (
            !!layer &&
            typeof layer === "object" &&
            typeof layer.name === "string" &&
            typeof layer.constant === "string" &&
            typeof layer.color === "string" &&
            Array.isArray(layer.keys) &&
            layer.keys.every(isKey)
        ))
    );
}

function isRegisterEntry(value: unknown): value is ZmkKeyRegisterEntry {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as Partial<ZmkKeyRegisterEntry>;
    const source = candidate.source;

    return (
        candidate.kind === "zmk-key" &&
        (candidate.operation === "yank" || candidate.operation === "delete") &&
        typeof candidate.capturedAt === "string" &&
        isKey(candidate.key) &&
        !!source &&
        source.layoutId === REGISTER_LAYOUT_ID &&
        source.keyCount === KEY_COUNT &&
        Number.isInteger(source.layerIndex) &&
        typeof source.layerName === "string" &&
        typeof source.layerConstant === "string" &&
        Number.isInteger(source.keyIndex)
    );
}

function isKey(value: unknown): value is ZmkKey {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as Partial<ZmkKey>;

    return (
        typeof candidate.binding === "string" &&
        (
            candidate.labelOverride === undefined ||
            typeof candidate.labelOverride === "string"
        ) &&
        (
            candidate.categoryOverride === undefined ||
            VALID_CATEGORIES.has(candidate.categoryOverride)
        )
    );
}

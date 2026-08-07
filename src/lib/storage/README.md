# Storage

Typed, versioned browser persistence for feature code.

Use the shared `siteStorage` namespace. Features own their key, schema, validation, migration, defaults, and user-facing failure behavior.

```ts
import { siteStorage } from "@/lib/storage/siteStorage";
```

## Create a store

Keep the store beside the feature that owns the schema.

```ts
// example.storage.ts
import { siteStorage } from "@/lib/storage/siteStorage";

type Preferences = {
    compactMode: boolean;
    showHints: boolean;
};

function decodePreferences(
    value: unknown,
    storedVersion: number,
): Preferences | null {
    if (storedVersion !== 1 || !value || typeof value !== "object") {
        return null;
    }

    const candidate = value as Partial<Preferences>;

    if (
        typeof candidate.compactMode !== "boolean" ||
        typeof candidate.showHints !== "boolean"
    ) {
        return null;
    }

    return {
        compactMode: candidate.compactMode,
        showHints: candidate.showHints,
    };
}

export const preferencesStore = siteStorage.createStore({
    key: "example:preferences",
    version: 1,
    codec: { decode: decodePreferences },
});
```

Keys should be feature-scoped:

```text
<feature>:<purpose>
```

Examples: `zmk-editor:preferences`, `zmk-editor:key-register`.

A key is persistent API surface. Renaming it abandons existing data unless the feature explicitly migrates from the old key.

## Read and write

```ts
const result = preferencesStore.read();

if (result.ok && result.value) {
    applyPreferences(result.value);
}
```

```ts
const result = preferencesStore.readOr({
    compactMode: false,
    showHints: true,
});

if (result.ok) {
    applyPreferences(result.value);
}
```

`readOr()` returns the fallback without persisting it.

```ts
const result = preferencesStore.write({
    compactMode: true,
    showHints: false,
});

if (!result.ok) {
    showLocalSaveWarning(result.reason);
}
```

Do not report a successful save before `write()` returns `ok: true`.

## Update and remove

```ts
preferencesStore.update((current) => ({
    compactMode: !current?.compactMode,
    showHints: current?.showHints ?? true,
}));
```

`update()` is synchronous read-modify-write convenience, not a transaction across tabs.

```ts
preferencesStore.remove();
```

## Subscribe

```ts
const unsubscribe = preferencesStore.subscribe(
    (value) => {
        value ? applyPreferences(value) : resetPreferences();
    },
    { emitCurrent: true },
);

// Cleanup
unsubscribe();
```

Subscriptions include writes and removals in the current tab, plus matching changes from other tabs.

Create stores as module-level singletons. Multiple instances for the same key make ownership and subscriptions harder to reason about.

## Validation and migration

Stored data is untrusted. `decode()` must validate before returning a feature value.

```ts
codec: {
    decode(value, storedVersion) {
        if (storedVersion === 1) {
            return migrateV1(value);
        }

        if (storedVersion === 2) {
            return parseV2(value);
        }

        return null;
    },
}
```

Increment `version` only when the persisted representation changes incompatibly. Keep old decode branches while old saved data should remain supported.

Use `encode()` only when the stored representation differs from the in-memory model, such as for `Set`, `Map`, or `Date` values.

## Failures

Operations return discriminated results instead of throwing through feature code.

```ts
if (!result.ok) {
    console.error(result.reason, result.error);
}
```

Possible reasons:

```text
unavailable     storage cannot be accessed
serialization   encoding or JSON serialization failed
quota           browser storage capacity was exceeded
write           another write failure occurred
invalid         stored data could not be decoded
```

The feature decides whether a failure is silent, logged, shown as a warning, or blocking.

## Boundaries

Use this for small browser-persistent feature state. Do not store secrets, server-owned data, large binaries, or data requiring transactional synchronization.

The shared storage package handles persistence mechanics. Feature-specific semantics belong in feature-level stores or adapters.

Use `inspect()` only for debugging envelopes and migrations; normal feature logic should use `read()`.

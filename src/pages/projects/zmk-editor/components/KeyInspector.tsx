import type {
    KeyCategory,
    QuickBinding,
    ZmkEditorState,
    ZmkKey,
} from "../zmkEditor.types";

import {
    CATEGORY_LABELS,
    QUICK_BINDING_GROUPS,
    createKey,
    deriveLabel,
    getKeyCategory,
    getKeyLabel,
    sanitizeConstant,
} from "../logic/zmkEditor.data";

export default function KeyInspector({
    state,
    selectedKey,
    onBeginEdit,
    onEndEdit,
    onUpdateKey,
    onCommitKey,
    onReplaceKey,
    onApplyQuickBinding,
    onUpdateState,
}: {
    state: ZmkEditorState;
    selectedKey: ZmkKey;
    onBeginEdit: () => void;
    onEndEdit: () => void;
    onUpdateKey: (patch: Partial<ZmkKey>) => void;
    onCommitKey: (patch: Partial<ZmkKey>) => void;
    onReplaceKey: (key: ZmkKey) => void;
    onApplyQuickBinding: (binding: QuickBinding) => void;
    onUpdateState: (mutator: (draft: ZmkEditorState) => void) => void;
}) {
    const row = state.selectedKey < 36
        ? Math.floor(state.selectedKey / 12) + 1
        : 4;
    const column = state.selectedKey < 36
        ? (state.selectedKey % 12) + 1
        : state.selectedKey - 35;

    const derivedLabel = deriveLabel(selectedKey.binding);
    const displayedLabel = getKeyLabel(selectedKey);
    const effectiveCategory = getKeyCategory(selectedKey);
    const automaticCategory = getKeyCategory({
        ...selectedKey,
        categoryOverride: undefined,
    });
    const hasLabelOverride = selectedKey.labelOverride !== undefined;
    const hasCategoryOverride = selectedKey.categoryOverride !== undefined;

    return (
        <aside className="zmk-editor-inspector">
            <div className="zmk-editor-inspector__head">
                <div>
                    <span className="zmk-editor-kicker">
                        KEY {String(state.selectedKey + 1).padStart(2, "0")}
                    </span>
                    <h2>{displayedLabel || "Unnamed key"}</h2>
                </div>
                <div className="zmk-editor-inspector__identity">
                    <span className="font-mono text-[11px] text-muted-foreground">
                        row {row} · col {column}
                    </span>
                    <span className="zmk-editor-category-badge">
                        {CATEGORY_LABELS[effectiveCategory]}
                    </span>
                </div>
            </div>

            <div className="zmk-editor-field zmk-editor-field--primary">
                <label htmlFor="binding">ZMK binding</label>
                <input
                    id="binding"
                    className="font-mono"
                    type="text"
                    value={selectedKey.binding}
                    onFocus={onBeginEdit}
                    onBlur={onEndEdit}
                    onChange={(event) => {
                        onUpdateKey({ binding: event.target.value });
                    }}
                />
                <p>
                    The visible label and category are derived automatically unless an
                    override is set below.
                </p>
            </div>

            <div className="zmk-editor-override-panel">
                <div className="zmk-editor-inspector__subhead">
                    <div>
                        <h3>Presentation overrides</h3>
                        <span>Optional display-only adjustments</span>
                    </div>
                    {(hasLabelOverride || hasCategoryOverride) && (
                        <button
                            type="button"
                            className="zmk-editor-text-button"
                            onClick={() => onCommitKey({
                                labelOverride: undefined,
                                categoryOverride: undefined,
                            })}
                        >
                            Use automatic
                        </button>
                    )}
                </div>

                <div className="zmk-editor-field zmk-editor-field--secondary">
                    <label htmlFor="displayLabel">
                        Display label override
                        <span>optional</span>
                    </label>
                    <div className="zmk-editor-input-row">
                        <input
                            id="displayLabel"
                            type="text"
                            value={selectedKey.labelOverride ?? ""}
                            maxLength={18}
                            placeholder={`Automatic · ${derivedLabel}`}
                            onFocus={onBeginEdit}
                            onBlur={onEndEdit}
                            onChange={(event) => {
                                const value = event.target.value;
                                onUpdateKey({
                                    labelOverride: value === "" ? undefined : value,
                                });
                            }}
                        />
                        {hasLabelOverride && (
                            <button
                                type="button"
                                className="zmk-editor-icon-button"
                                title="Use the derived label"
                                aria-label="Clear display label override"
                                onClick={() => onCommitKey({ labelOverride: undefined })}
                            >
                                ↻
                            </button>
                        )}
                    </div>
                </div>

                <details className="zmk-editor-category-override">
                    <summary>
                        <span>Category override</span>
                        <span>
                            {hasCategoryOverride
                                ? CATEGORY_LABELS[selectedKey.categoryOverride!]
                                : `Automatic · ${CATEGORY_LABELS[effectiveCategory]}`}
                        </span>
                    </summary>
                    <div className="zmk-editor-field zmk-editor-field--secondary">
                        <select
                            id="categoryOverride"
                            aria-label="Category override"
                            value={selectedKey.categoryOverride ?? ""}
                            onChange={(event) => {
                                const value = event.target.value;
                                onCommitKey({
                                    categoryOverride: value === ""
                                        ? undefined
                                        : value as KeyCategory,
                                });
                            }}
                        >
                            <option value="">
                                Automatic — {CATEGORY_LABELS[automaticCategory]}
                            </option>
                            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                        <p>
                            Use this only when the binding semantics do not match the
                            visual category you want.
                        </p>
                    </div>
                </details>
            </div>

            <div className="zmk-editor-inspector__actions">
                <button
                    type="button"
                    onClick={() => onReplaceKey(createKey("&trans"))}
                >
                    Transparent
                </button>
                <button
                    type="button"
                    className="text-destructive"
                    onClick={() => onReplaceKey(createKey("&none"))}
                >
                    Disable
                </button>
            </div>

            <div className="zmk-editor-section-divider" />

            <div className="zmk-editor-quick-bindings">
                <div className="zmk-editor-inspector__subhead">
                    <h3>Quick bindings</h3>
                    <span>Apply to selected key</span>
                </div>

                {QUICK_BINDING_GROUPS.map((group, index) => (
                    <details key={group.name} open={index === 0}>
                        <summary>{group.name}</summary>
                        <div className="zmk-editor-quick-bindings__grid">
                            {group.bindings.map((binding) => {
                                const preview = createKey(
                                    binding.binding,
                                    binding.label,
                                    binding.category,
                                );

                                return (
                                    <button
                                        key={binding.name}
                                        type="button"
                                        title={binding.binding}
                                        onClick={() => onApplyQuickBinding(binding)}
                                    >
                                        <strong>{getKeyLabel(preview)}</strong>
                                        <span>{binding.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </details>
                ))}
            </div>

            <div className="zmk-editor-section-divider" />

            <details className="zmk-editor-layer-settings">
                <summary>Layer settings</summary>
                <div className="mt-4 grid gap-3">
                    <div className="zmk-editor-field">
                        <label htmlFor="layerName">Layer name</label>
                        <input
                            id="layerName"
                            type="text"
                            value={state.layers[state.currentLayer].name}
                            onFocus={onBeginEdit}
                            onBlur={onEndEdit}
                            onChange={(event) => onUpdateState((draft) => {
                                draft.layers[draft.currentLayer].name = event.target.value;
                            })}
                        />
                    </div>
                    <div className="grid grid-cols-[1fr_auto] gap-3">
                        <div className="zmk-editor-field">
                            <label htmlFor="layerConstant">Constant</label>
                            <input
                                id="layerConstant"
                                className="font-mono"
                                type="text"
                                value={state.layers[state.currentLayer].constant}
                                onFocus={onBeginEdit}
                                onBlur={onEndEdit}
                                onChange={(event) => onUpdateState((draft) => {
                                    draft.layers[draft.currentLayer].constant =
                                        sanitizeConstant(event.target.value);
                                })}
                            />
                        </div>
                        <div className="zmk-editor-field">
                            <label htmlFor="layerColor">Color</label>
                            <input
                                id="layerColor"
                                className="zmk-editor-color-input"
                                type="color"
                                value={state.layers[state.currentLayer].color}
                                onFocus={onBeginEdit}
                                onBlur={onEndEdit}
                                onChange={(event) => onUpdateState((draft) => {
                                    draft.layers[draft.currentLayer].color = event.target.value;
                                })}
                            />
                        </div>
                    </div>
                </div>
            </details>
        </aside>
    );
}

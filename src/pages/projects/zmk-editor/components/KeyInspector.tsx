import type {
    KeyCategory,
    QuickBinding,
    ZmkEditorState,
    ZmkKey,
} from "../zmkEditor.types";
import {
    CATEGORY_LABELS,
    QUICK_BINDING_GROUPS,
    deriveLabel,
    inferCategory,
    sanitizeConstant,
} from "../logic/zmkEditor.data";

export default function KeyInspector({
    state,
    selectedKey,
    onBeginEdit,
    onEndEdit,
    onUpdateKey,
    onCommitKey,
    onApplyQuickBinding,
    onUpdateState,
}: {
    state: ZmkEditorState;
    selectedKey: ZmkKey;
    onBeginEdit: () => void;
    onEndEdit: () => void;
    onUpdateKey: (patch: Partial<ZmkKey>) => void;
    onCommitKey: (patch: Partial<ZmkKey>) => void;
    onApplyQuickBinding: (binding: QuickBinding) => void;
    onUpdateState: (mutator: (draft: ZmkEditorState) => void) => void;
}) {
    const row = state.selectedKey < 36 ? Math.floor(state.selectedKey / 12) + 1 : 4;
    const column = state.selectedKey < 36 ? (state.selectedKey % 12) + 1 : state.selectedKey - 35;

    return (
        <aside className="zmk-editor-inspector">
            <div className="zmk-editor-inspector__head">
                <div>
                    <span className="zmk-editor-kicker">
                        KEY {String(state.selectedKey + 1).padStart(2, "0")}
                    </span>
                    <h2>{selectedKey.label || "Unnamed key"}</h2>
                </div>
                <span className="font-mono text-[11px] text-muted-foreground">
                    row {row} · col {column}
                </span>
            </div>

            <div className="zmk-editor-field">
                <label htmlFor="displayLabel">Display label</label>
                <div className="zmk-editor-input-row">
                    <input
                        id="displayLabel"
                        type="text"
                        value={selectedKey.label}
                        maxLength={18}
                        onFocus={onBeginEdit}
                        onBlur={onEndEdit}
                        onChange={(event) => {
                            const label = event.target.value;
                            onUpdateKey({
                                label,
                                category: inferCategory(selectedKey.binding, label),
                            });
                        }}
                    />
                    <button
                        type="button"
                        className="zmk-editor-icon-button"
                        title="Derive label from binding"
                        onClick={() => {
                            const label = deriveLabel(selectedKey.binding);
                            onCommitKey({
                                label,
                                category: inferCategory(selectedKey.binding, label),
                            });
                        }}
                    >
                        ↻
                    </button>
                </div>
            </div>

            <div className="zmk-editor-field">
                <label htmlFor="binding">ZMK binding</label>
                <input
                    id="binding"
                    className="font-mono"
                    type="text"
                    value={selectedKey.binding}
                    onFocus={onBeginEdit}
                    onBlur={onEndEdit}
                    onChange={(event) => {
                        const binding = event.target.value;
                        const label = deriveLabel(binding);
                        onUpdateKey({
                            binding,
                            label,
                            category: inferCategory(binding, label),
                        });
                    }}
                />
                <p>
                    Labels and categories follow the binding automatically.
                    Override the label above when needed.
                </p>
            </div>

            <div className="zmk-editor-field">
                <label htmlFor="category">Category</label>
                <select
                    id="category"
                    value={selectedKey.category}
                    onChange={(event) =>
                        onCommitKey({ category: event.target.value as KeyCategory })
                    }
                >
                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>
            </div>

            <div className="zmk-editor-inspector__actions">
                <button
                    type="button"
                    onClick={() => onCommitKey({
                        binding: "&trans", label: "_", category: "transparent",
                    })}
                >
                    Transparent
                </button>
                <button
                    type="button"
                    className="text-destructive"
                    onClick={() => onCommitKey({
                        binding: "&none", label: "×", category: "none",
                    })}
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
                            {group.bindings.map((binding) => (
                                <button
                                    key={binding.name}
                                    type="button"
                                    title={binding.binding}
                                    onClick={() => onApplyQuickBinding(binding)}
                                >
                                    <strong>{binding.label}</strong>
                                    <span>{binding.name}</span>
                                </button>
                            ))}
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

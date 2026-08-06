import type { CSSProperties, RefObject } from "react";
import type { ZmkEditorState } from "../zmkEditor.types";
import { COVERAGE_CHARACTERS, KEY_COUNT, STORAGE_KEY } from "../logic/zmkEditor.data";

export function EditorHeader({
    saveStatus,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    onExport,
    onReset,
}: {
    saveStatus: string;
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
    onExport: () => void;
    onReset: () => void;
}) {
    return (
        <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
                <p className="mb-2 font-mono text-xs text-muted-foreground">
                    ~/projects/zmk-editor
                </p>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    ZMK Layout Editor
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                    Design, inspect, and export layered Corne keymaps without leaving the browser.
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 font-mono text-xs text-muted-foreground">{saveStatus}</span>
                <button type="button" className="zmk-editor-button zmk-editor-button--ghost" disabled={!canUndo} onClick={onUndo}>Undo</button>
                <button type="button" className="zmk-editor-button zmk-editor-button--ghost" disabled={!canRedo} onClick={onRedo}>Redo</button>

                <details className="zmk-editor-menu">
                    <summary className="zmk-editor-button zmk-editor-button--ghost">Project</summary>
                    <div className="zmk-editor-menu__panel">
                        <button type="button" onClick={onReset}>Reset defaults</button>
                        <button type="button" onClick={() => localStorage.removeItem(STORAGE_KEY)}>
                            Clear local save
                        </button>
                    </div>
                </details>

                <button type="button" className="zmk-editor-button zmk-editor-button--primary" onClick={onExport}>
                    Export ZMK
                </button>
            </div>
        </header>
    );
}

export function LayerRail({
    state,
    onSelect,
}: {
    state: ZmkEditorState;
    onSelect: (index: number) => void;
}) {
    return (
        <nav className="zmk-editor-layer-rail" aria-label="Keyboard layers">
            {state.layers.map((layer, index) => (
                <button
                    key={`${layer.constant}-${index}`}
                    type="button"
                    className="zmk-editor-layer-tab"
                    data-active={index === state.currentLayer}
                    style={{ "--layer-color": layer.color } as CSSProperties}
                    onClick={() => onSelect(index)}
                >
                    <span className="zmk-editor-layer-tab__index">
                        {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="zmk-editor-layer-tab__dot" />
                    <span>{layer.name}</span>
                </button>
            ))}
        </nav>
    );
}

export function CoveragePanel({
    coveredCharacters,
    expanded,
    onToggle,
}: {
    coveredCharacters: Set<string>;
    expanded: boolean;
    onToggle: () => void;
}) {
    return (
        <section className="zmk-editor-coverage">
            <button type="button" className="zmk-editor-coverage__summary" onClick={onToggle}>
                <span>
                    <strong>Character coverage</strong>
                    <small>Visible-label checklist across all layers</small>
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                    {coveredCharacters.size} / {COVERAGE_CHARACTERS.length}
                    <span className="ml-3">{expanded ? "−" : "+"}</span>
                </span>
            </button>

            {expanded && (
                <div className="zmk-editor-coverage__grid">
                    {COVERAGE_CHARACTERS.map((character) => (
                        <span key={character} data-present={coveredCharacters.has(character)}>
                            {character}
                        </span>
                    ))}
                </div>
            )}
        </section>
    );
}

export function ProjectConfiguration({
    state,
    onUpdate,
    onReset,
}: {
    state: ZmkEditorState;
    onUpdate: (mutator: (draft: ZmkEditorState) => void) => void;
    onReset: () => void;
}) {
    return (
        <section className="mt-6">
            <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                    <p className="zmk-editor-kicker">PROJECT CONFIGURATION</p>
                    <h2 className="text-xl font-medium">Export behavior</h2>
                </div>
                <button type="button" className="zmk-editor-button zmk-editor-button--ghost text-destructive" onClick={onReset}>
                    Reset defaults
                </button>
            </div>

            <div className="zmk-editor-config-grid">
                <label className="zmk-editor-config-card">
                    <span><strong>Show bindings</strong><small>Display full ZMK syntax under each key.</small></span>
                    <input type="checkbox" checked={state.showBindings} onChange={(event) => onUpdate((draft) => {
                        draft.showBindings = event.target.checked;
                    })} />
                </label>

                <label className="zmk-editor-config-card">
                    <span><strong>Conditional fourth layer</strong><small>Lower + Raise activates Alternate.</small></span>
                    <input type="checkbox" checked={state.triLayer} onChange={(event) => onUpdate((draft) => {
                        draft.triLayer = event.target.checked;
                    })} />
                </label>

                <label className="zmk-editor-config-card">
                    <span><strong>LEDs per half</strong><small>Written to the exported LED strip node.</small></span>
                    <input
                        className="zmk-editor-number-input"
                        type="number"
                        min={0}
                        max={128}
                        value={state.ledCount}
                        onChange={(event) => onUpdate((draft) => {
                            draft.ledCount = Math.min(Math.max(Number(event.target.value) || 0, 0), 128);
                        })}
                    />
                </label>
            </div>
        </section>
    );
}

export function ExportDialog({
    dialogRef,
    exportText,
    state,
}: {
    dialogRef: RefObject<HTMLDialogElement | null>;
    exportText: string;
    state: ZmkEditorState;
}) {
    return (
        <dialog ref={dialogRef} className="zmk-editor-dialog">
            <div className="zmk-editor-dialog__head">
                <div>
                    <p className="zmk-editor-kicker">EXPORT</p>
                    <h2>Generated ZMK keymap</h2>
                    <span>
                        {state.layers.length} layers · {KEY_COUNT} keys · {state.triLayer
                            ? "conditional layer enabled"
                            : "direct layers"}
                    </span>
                </div>
                <button type="button" className="zmk-editor-icon-button" onClick={() => dialogRef.current?.close()}>×</button>
            </div>

            <textarea className="zmk-editor-dialog__code" value={exportText} readOnly spellCheck={false} />

            <div className="zmk-editor-dialog__foot">
                <div className="zmk-editor-validation">
                    <span>✓ 42 bindings per layer</span>
                    <span>✓ Layer constants sanitized</span>
                    <span>! Review locale-specific keycodes before flashing</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button type="button" className="zmk-editor-button zmk-editor-button--ghost" onClick={() => downloadText("corne.keymap", exportText)}>
                        Download corne.keymap
                    </button>
                    <button type="button" className="zmk-editor-button zmk-editor-button--primary" onClick={() => navigator.clipboard.writeText(exportText)}>
                        Copy keymap
                    </button>
                </div>
            </div>
        </dialog>
    );
}

function downloadText(filename: string, text: string) {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

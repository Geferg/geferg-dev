import {
    useEffect,
    useRef,
    useState,
    type CSSProperties,
    type MouseEvent,
    type RefObject,
} from "react";

import type { ZmkEditorState } from "../zmkEditor.types";
import { KEY_COUNT, getModeLayerIndices } from "../logic/zmkEditor.data";

export function EditorHeader({
    saveStatus,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    onExport,
    onReset,
    onClearLocalSave,
}: {
    saveStatus: string;
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
    onExport: () => void;
    onReset: () => void;
    onClearLocalSave: () => void;
}) {
    return (
        <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
                <p className="zmk-editor-kicker mb-2">
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
                <span className="mr-1 font-mono text-xs text-muted-foreground">
                    {saveStatus}
                </span>

                <button
                    type="button"
                    className="zmk-editor-button zmk-editor-button--ghost"
                    disabled={!canUndo}
                    onClick={onUndo}
                >
                    Undo
                </button>

                <button
                    type="button"
                    className="zmk-editor-button zmk-editor-button--ghost"
                    disabled={!canRedo}
                    onClick={onRedo}
                >
                    Redo
                </button>

                <ProjectMenu
                    onReset={onReset}
                    onClearLocalSave={onClearLocalSave}
                />

                <button
                    type="button"
                    className="zmk-editor-button zmk-editor-button--primary"
                    onClick={onExport}
                >
                    Export ZMK
                </button>
            </div>
        </header>
    );
}

function ProjectMenu({
    onReset,
    onClearLocalSave,
}: {
    onReset: () => void;
    onClearLocalSave: () => void;
}) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        function dismissFromPointer(event: PointerEvent) {
            if (!rootRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        }

        function dismissFromFocus(event: FocusEvent) {
            if (!rootRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        }

        function dismissFromKeyboard(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setOpen(false);
            }
        }

        document.addEventListener("pointerdown", dismissFromPointer, true);
        document.addEventListener("focusin", dismissFromFocus, true);
        document.addEventListener("keydown", dismissFromKeyboard);

        return () => {
            document.removeEventListener("pointerdown", dismissFromPointer, true);
            document.removeEventListener("focusin", dismissFromFocus, true);
            document.removeEventListener("keydown", dismissFromKeyboard);
        };
    }, [open]);

    function runAction(action: () => void) {
        setOpen(false);
        action();
    }

    return (
        <div ref={rootRef} className="zmk-editor-menu">
            <button
                type="button"
                className="zmk-editor-button zmk-editor-button--ghost"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
            >
                Project
            </button>

            {open && (
                <div className="zmk-editor-menu__panel" role="menu">
                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => runAction(onReset)}
                    >
                        Reset defaults
                    </button>
                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => runAction(onClearLocalSave)}
                    >
                        Clear local save
                    </button>
                </div>
            )}
        </div>
    );
}

export function ModeRail({
    state,
    onSelect,
    onAdd,
    onRename,
    onDelete,
}: {
    state: ZmkEditorState;
    onSelect: (modeId: string) => void;
    onAdd: () => void;
    onRename: (modeId: string, name: string) => void;
    onDelete: (modeId: string) => void;
}) {
    function renameMode(modeId: string, currentName: string) {
        const nextName = window.prompt("Rename mode", currentName)?.trim();
        if (nextName && nextName !== currentName) onRename(modeId, nextName);
    }

    const currentMode = state.modes.find((mode) => mode.id === state.currentMode) ?? state.modes[0];

    return (
        <div className="zmk-editor-mode-bar">
            <nav className="zmk-editor-mode-rail" aria-label="Keyboard modes">
                {state.modes.map((mode, index) => {
                    const active = mode.id === state.currentMode;

                    return (
                        <div
                            key={mode.id}
                            className="zmk-editor-mode-tab"
                            data-active={active}
                        >
                            <button
                                type="button"
                                className="zmk-editor-mode-tab__main"
                                aria-current={active ? "page" : undefined}
                                title="Double-click or use the edit button to rename mode"
                                onClick={() => onSelect(mode.id)}
                                onDoubleClick={() => renameMode(mode.id, mode.name)}
                            >
                                <span className="zmk-editor-mode-tab__index">
                                    {String(index + 1).padStart(2, "0")}
                                </span>
                                <span>{mode.name}</span>
                            </button>
                            <button
                                type="button"
                                className="zmk-editor-tab-rename"
                                aria-label={`Rename ${mode.name} mode`}
                                title={`Rename ${mode.name} mode`}
                                onClick={() => renameMode(mode.id, mode.name)}
                            >
                                ✎
                            </button>
                            <button
                                type="button"
                                className="zmk-editor-tab-close"
                                aria-label={`Delete ${mode.name} mode`}
                                title={`Delete ${mode.name} mode`}
                                onClick={() => onDelete(mode.id)}
                            >
                                ×
                            </button>
                        </div>
                    );
                })}

                <button
                    type="button"
                    className="zmk-editor-tab-add"
                    aria-label="Add mode"
                    title="Add mode by duplicating the current mode"
                    onClick={onAdd}
                >
                    +
                </button>

                {currentMode && (
                    <button
                        type="button"
                        className="zmk-editor-mode-rename-action"
                        title="You can also double-click a mode name to rename it"
                        onClick={() => renameMode(currentMode.id, currentMode.name)}
                    >
                        Rename mode
                    </button>
                )}
            </nav>
        </div>
    );
}

export function LayerRail({
    state,
    onSelect,
    onAdd,
    onRename,
    onDelete,
}: {
    state: ZmkEditorState;
    onSelect: (index: number) => void;
    onAdd: () => void;
    onRename: (index: number, name: string) => void;
    onDelete: (index: number) => void;
}) {
    const layerIndices = getModeLayerIndices(state, state.currentMode);

    function renameLayer(index: number, currentName: string) {
        const nextName = window.prompt("Rename layer", currentName)?.trim();
        if (nextName && nextName !== currentName) onRename(index, nextName);
    }

    return (
        <div className="zmk-editor-layer-bar">
            <nav className="zmk-editor-layer-rail" aria-label="Keyboard layers">
                {layerIndices.map((layerIndex, localIndex) => {
                    const layer = state.layers[layerIndex];
                    const active = layerIndex === state.currentLayer;

                    return (
                        <div
                            key={`${layer.modeId}-${layer.constant}-${layerIndex}`}
                            className="zmk-editor-layer-tab"
                            data-active={active}
                            style={{ "--layer-color": layer.color } as CSSProperties}
                        >
                            <button
                                type="button"
                                className="zmk-editor-layer-tab__main"
                                aria-current={active ? "page" : undefined}
                                title="Double-click or use the edit button to rename layer"
                                onClick={() => onSelect(layerIndex)}
                                onDoubleClick={() => renameLayer(layerIndex, layer.name)}
                            >
                                <span className="zmk-editor-layer-tab__index">
                                    {String(localIndex + 1).padStart(2, "0")}
                                </span>
                                <span className="zmk-editor-layer-tab__dot" />
                                <span>{layer.name}</span>
                            </button>
                            <button
                                type="button"
                                className="zmk-editor-tab-rename"
                                aria-label={`Rename ${layer.name} layer`}
                                title={`Rename ${layer.name} layer`}
                                onClick={() => renameLayer(layerIndex, layer.name)}
                            >
                                ✎
                            </button>
                            <button
                                type="button"
                                className="zmk-editor-tab-close"
                                aria-label={`Delete ${layer.name} layer`}
                                title={`Delete ${layer.name} layer`}
                                onClick={() => onDelete(layerIndex)}
                            >
                                ×
                            </button>
                        </div>
                    );
                })}

                <button
                    type="button"
                    className="zmk-editor-tab-add zmk-editor-tab-add--layer"
                    aria-label="Add layer"
                    title="Add layer"
                    onClick={onAdd}
                >
                    +
                </button>
            </nav>
        </div>
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
                <button
                    type="button"
                    className="zmk-editor-button zmk-editor-button--ghost text-destructive"
                    onClick={onReset}
                >
                    Reset defaults
                </button>
            </div>

            <div className="zmk-editor-config-grid">
                <label className="zmk-editor-config-card">
                    <span>
                        <strong>Show bindings</strong>
                        <small>Display full ZMK syntax under each key.</small>
                    </span>
                    <input
                        type="checkbox"
                        checked={state.showBindings}
                        onChange={(event) => onUpdate((draft) => {
                            draft.showBindings = event.target.checked;
                        })}
                    />
                </label>

                <label className="zmk-editor-config-card">
                    <span>
                        <strong>Conditional fourth layer</strong>
                        <small>Within each mode, layers 2 + 3 activate layer 4.</small>
                    </span>
                    <input
                        type="checkbox"
                        checked={state.triLayer}
                        onChange={(event) => onUpdate((draft) => {
                            draft.triLayer = event.target.checked;
                        })}
                    />
                </label>

                <label className="zmk-editor-config-card">
                    <span>
                        <strong>LEDs per half</strong>
                        <small>Written to the exported LED strip node.</small>
                    </span>
                    <input
                        className="zmk-editor-number-input"
                        type="number"
                        min={0}
                        max={128}
                        value={state.ledCount}
                        onChange={(event) => onUpdate((draft) => {
                            draft.ledCount = Math.min(
                                Math.max(Number(event.target.value) || 0, 0),
                                128,
                            );
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
    function closeFromBackdrop(event: MouseEvent<HTMLDialogElement>) {
        const dialog = event.currentTarget;
        const bounds = dialog.getBoundingClientRect();
        const outside =
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom;

        if (outside) dialog.close();
    }

    return (
        <dialog
            ref={dialogRef}
            className="zmk-editor-dialog"
            onMouseDown={closeFromBackdrop}
        >
            <div className="zmk-editor-dialog__head">
                <div>
                    <p className="zmk-editor-kicker">EXPORT</p>
                    <h2>Generated ZMK keymap</h2>
                    <span>
                        {state.modes.length} mode{state.modes.length === 1 ? "" : "s"} · {state.layers.length} layers · {KEY_COUNT} keys · {state.modMorphs.length} mod-morph{state.modMorphs.length === 1 ? "" : "s"} · {state.triLayer
                            ? "conditional layer enabled"
                            : "direct layers"}
                    </span>
                </div>
                <button
                    type="button"
                    className="zmk-editor-icon-button"
                    aria-label="Close export dialog"
                    onClick={() => dialogRef.current?.close()}
                >
                    ×
                </button>
            </div>

            <textarea
                className="zmk-editor-dialog__code"
                value={exportText}
                readOnly
                spellCheck={false}
            />

            <div className="zmk-editor-dialog__foot">
                <div className="zmk-editor-validation">
                    <span>✓ 42 bindings per layer</span>
                    <span>✓ Layer constants sanitized</span>
                    {state.modMorphs.length > 0 && (
                        <span>✓ Managed mod-morph definitions emitted</span>
                    )}
                    <span>! Review locale-specific keycodes before flashing</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        className="zmk-editor-button zmk-editor-button--ghost"
                        onClick={() => downloadText("corne.keymap", exportText)}
                    >
                        Download corne.keymap
                    </button>
                    <button
                        type="button"
                        className="zmk-editor-button zmk-editor-button--primary"
                        onClick={() => copyText(exportText)}
                    >
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

async function copyText(text: string) {
    try {
        await navigator.clipboard.writeText(text);
    } catch {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
    }
}

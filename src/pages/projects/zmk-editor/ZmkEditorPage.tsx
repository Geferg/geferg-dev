import { useEffect, useMemo, useRef, useState } from "react";

import type {
    QuickBinding,
    ZmkEditorState,
    ZmkKey,
} from "./zmkEditor.types";

import {
    COVERAGE_CHARACTERS,
    STORAGE_KEY,
    createDefaultState,
    createKey,
    getKeyLabel,
    normalizeState,
} from "./logic/zmkEditor.data";
import { generateKeymap } from "./logic/zmkEditor.keymap";

import KeyboardWorkspace from "./components/KeyboardWorkspace";
import KeyInspector from "./components/KeyInspector";
import {
    EditorHeader,
    ExportDialog,
    LayerRail,
    ProjectConfiguration,
} from "./components/EditorChrome";

import "./zmkEditor.css";

export default function ZmkEditorPage() {
    const [state, setState] = useState<ZmkEditorState>(() => loadState());
    const [history, setHistory] = useState<ZmkEditorState[]>([]);
    const [future, setFuture] = useState<ZmkEditorState[]>([]);
    const [saveStatus, setSaveStatus] = useState("Autosaves locally");
    const [coverageExpanded, setCoverageExpanded] = useState(false);

    const editSnapshotRef = useRef<ZmkEditorState | null>(null);
    const saveTimeoutRef = useRef<number | null>(null);
    const exportDialogRef = useRef<HTMLDialogElement>(null);

    const currentLayer = state.layers[state.currentLayer];
    const selectedKey = currentLayer.keys[state.selectedKey];
    const exportText = useMemo(() => generateKeymap(state), [state]);
    const coveredCharacters = useMemo(() => getCoverage(state), [state.layers]);

    useEffect(() => {
        setSaveStatus("Saving locally…");

        if (saveTimeoutRef.current !== null) {
            window.clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = window.setTimeout(() => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            saveTimeoutRef.current = null;
            setSaveStatus("Saved locally");
        }, 180);

        return () => {
            if (saveTimeoutRef.current !== null) {
                window.clearTimeout(saveTimeoutRef.current);
                saveTimeoutRef.current = null;
            }
        };
    }, [state]);

    function commit(mutator: (draft: ZmkEditorState) => void) {
        setState((previous) => {
            const next = cloneState(previous);
            mutator(next);
            setHistory((items) => [...items.slice(-99), previous]);
            setFuture([]);
            return next;
        });
    }

    function updateLive(mutator: (draft: ZmkEditorState) => void) {
        setState((previous) => {
            const next = cloneState(previous);
            mutator(next);
            return next;
        });
    }

    function beginEdit() {
        if (!editSnapshotRef.current) {
            editSnapshotRef.current = cloneState(state);
        }
    }

    function endEdit() {
        const snapshot = editSnapshotRef.current;
        editSnapshotRef.current = null;

        if (!snapshot || JSON.stringify(snapshot) === JSON.stringify(state)) {
            return;
        }

        setHistory((items) => [...items.slice(-99), snapshot]);
        setFuture([]);
    }

    function updateSelectedKey(patch: Partial<ZmkKey>, record = false) {
        const apply = (draft: ZmkEditorState) => {
            const key = draft.layers[draft.currentLayer].keys[draft.selectedKey];

            if (patch.binding !== undefined) {
                key.binding = patch.binding;
            }

            if ("labelOverride" in patch) {
                if (patch.labelOverride === undefined) {
                    delete key.labelOverride;
                } else {
                    key.labelOverride = patch.labelOverride;
                }
            }

            if ("categoryOverride" in patch) {
                if (patch.categoryOverride === undefined) {
                    delete key.categoryOverride;
                } else {
                    key.categoryOverride = patch.categoryOverride;
                }
            }
        };

        record ? commit(apply) : updateLive(apply);
    }

    function replaceSelectedKey(key: ZmkKey) {
        commit((draft) => {
            draft.layers[draft.currentLayer].keys[draft.selectedKey] = key;
        });
    }

    function applyQuickBinding(binding: QuickBinding) {
        replaceSelectedKey(createKey(
            binding.binding,
            binding.label,
            binding.category,
        ));
    }

    function undo() {
        const previous = history.at(-1);
        if (!previous) return;

        setHistory((items) => items.slice(0, -1));
        setFuture((items) => [state, ...items].slice(0, 100));
        setState(previous);
    }

    function redo() {
        const next = future[0];
        if (!next) return;

        setFuture((items) => items.slice(1));
        setHistory((items) => [...items.slice(-99), state]);
        setState(next);
    }

    function resetDefaults() {
        if (!window.confirm("Reset all layers to the built-in defaults?")) {
            return;
        }

        setHistory((items) => [...items.slice(-99), state]);
        setFuture([]);
        setState(createDefaultState());
    }

    function clearLocalSave() {
        if (saveTimeoutRef.current !== null) {
            window.clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = null;
        }

        localStorage.removeItem(STORAGE_KEY);
        setSaveStatus("Local save cleared");
    }

    return (
        <section className="zmk-editor-page bg-background text-foreground">
            <div className="zmk-editor-orbit zmk-editor-orbit--one" />
            <div className="zmk-editor-orbit zmk-editor-orbit--two" />

            <div className="relative mx-auto w-full max-w-[1440px] px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
                <EditorHeader
                    saveStatus={saveStatus}
                    canUndo={history.length > 0}
                    canRedo={future.length > 0}
                    onUndo={undo}
                    onRedo={redo}
                    onExport={() => exportDialogRef.current?.showModal()}
                    onReset={resetDefaults}
                    onClearLocalSave={clearLocalSave}
                />

                <LayerRail
                    state={state}
                    onSelect={(index) => setState((previous) => ({
                        ...previous,
                        currentLayer: index,
                    }))}
                />

                <div className="zmk-editor-shell">
                    <KeyboardWorkspace
                        state={state}
                        coveredCharacters={coveredCharacters}
                        coverageExpanded={coverageExpanded}
                        onSelectKey={(index) => setState((previous) => ({
                            ...previous,
                            selectedKey: index,
                        }))}
                        onToggleCoverage={() => setCoverageExpanded((value) => !value)}
                    />
                    <KeyInspector
                        state={state}
                        selectedKey={selectedKey}
                        onBeginEdit={beginEdit}
                        onEndEdit={endEdit}
                        onUpdateKey={(patch) => updateSelectedKey(patch)}
                        onCommitKey={(patch) => updateSelectedKey(patch, true)}
                        onReplaceKey={replaceSelectedKey}
                        onApplyQuickBinding={applyQuickBinding}
                        onUpdateState={updateLive}
                    />
                </div>

                <ProjectConfiguration
                    state={state}
                    onUpdate={commit}
                    onReset={resetDefaults}
                />
            </div>

            <ExportDialog
                dialogRef={exportDialogRef}
                exportText={exportText}
                state={state}
            />
        </section>
    );
}

function loadState(): ZmkEditorState {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved
            ? normalizeState(JSON.parse(saved))
            : createDefaultState();
    } catch {
        return createDefaultState();
    }
}

function cloneState(state: ZmkEditorState): ZmkEditorState {
    return structuredClone(state);
}

function getCoverage(state: ZmkEditorState): Set<string> {
    const labels = state.layers.flatMap((layer) =>
        layer.keys.map(getKeyLabel),
    );

    return new Set(COVERAGE_CHARACTERS.filter((character) => {
        const variants = [
            character,
            character.toUpperCase(),
            character.toLowerCase(),
        ];
        return labels.some((label) => variants.includes(label));
    }));
}

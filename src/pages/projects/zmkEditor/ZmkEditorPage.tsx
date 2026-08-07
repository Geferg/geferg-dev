import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
    QuickBinding,
    ZmkEditorState,
    ZmkKey,
    ZmkModMorph,
} from "./zmkEditor.types";

import {
    createDefaultState,
    createKey,
    deriveLabel,
    findModMorphForBinding,
    getCoverage,
    getKeyCategory,
    getKeyLabel,
    getModMorphBinding,
    inferCategory,
    sanitizeBehaviorReference,
} from "./logic/zmkEditor.data";
import { generateKeymap } from "./logic/zmkEditor.keymap";
import {
    cloneKey,
    loadEditorState,
    readKeyRegister,
    writeSelectedKeyToRegister,
    zmkEditorStateStore,
} from "./logic/zmkEditor.storage";

import KeyboardWorkspace from "./components/KeyboardWorkspace";
import KeyInspector from "./components/KeyInspector";
import {
    EditorHeader,
    ExportDialog,
    LayerRail,
    ProjectConfiguration,
} from "./components/EditorChrome";

import { useZmkEditorVimMotions } from "./useZmkEditorVimMotions";

import "./zmkEditor.css";

// Replace this constant with persisted page preferences when the visible toggle
// is introduced. The motion hook already accepts the final enabled shape.
const VIM_MOTIONS_ENABLED = true;

export default function ZmkEditorPage() {
    const [state, setState] = useState<ZmkEditorState>(() => loadEditorState());
    const [history, setHistory] = useState<ZmkEditorState[]>([]);
    const [future, setFuture] = useState<ZmkEditorState[]>([]);
    const [saveStatus, setSaveStatus] = useState("Autosaves locally");
    const [commandStatus, setCommandStatus] = useState<string | null>(null);
    const [coverageExpanded, setCoverageExpanded] = useState(false);

    const editSnapshotRef = useRef<ZmkEditorState | null>(null);
    const saveTimeoutRef = useRef<number | null>(null);
    const commandStatusTimeoutRef = useRef<number | null>(null);
    const exportDialogRef = useRef<HTMLDialogElement>(null);
    const editorRootRef = useRef<HTMLElement>(null);
    const bindingInputRef = useRef<HTMLInputElement>(null);
    const displayLabelInputRef = useRef<HTMLInputElement>(null);

    const currentLayer = state.layers[state.currentLayer];
    const selectedKey = currentLayer.keys[state.selectedKey];
    const exportText = useMemo(() => generateKeymap(state), [state]);
    const coveredCharacters = useMemo(
        () => getCoverage(state),
        [state.layers, state.modMorphs],
    );

    useEffect(() => {
        setSaveStatus("Saving locally…");

        if (saveTimeoutRef.current !== null) {
            window.clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = window.setTimeout(() => {
            const result = zmkEditorStateStore.write(state);
            saveTimeoutRef.current = null;
            setSaveStatus(result.ok ? "Saved locally" : "Local save unavailable");
        }, 180);

        return () => {
            if (saveTimeoutRef.current !== null) {
                window.clearTimeout(saveTimeoutRef.current);
                saveTimeoutRef.current = null;
            }
        };
    }, [state]);

    useEffect(() => () => {
        if (commandStatusTimeoutRef.current !== null) {
            window.clearTimeout(commandStatusTimeoutRef.current);
        }
    }, []);

    function showCommandStatus(message: string): void {
        setCommandStatus(message);

        if (commandStatusTimeoutRef.current !== null) {
            window.clearTimeout(commandStatusTimeoutRef.current);
        }

        commandStatusTimeoutRef.current = window.setTimeout(() => {
            commandStatusTimeoutRef.current = null;
            setCommandStatus(null);
        }, 1300);
    }

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
                const previousModMorph = findModMorphForBinding(draft, key.binding);
                key.binding = patch.binding;

                if (
                    previousModMorph &&
                    key.binding.trim() !== getModMorphBinding(previousModMorph.reference) &&
                    !isModMorphReferenced(draft, previousModMorph)
                ) {
                    draft.modMorphs = draft.modMorphs.filter(
                        (item) => item.id !== previousModMorph.id,
                    );
                }
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
            draft.layers[draft.currentLayer].keys[draft.selectedKey] = cloneKey(key);
        });
    }

    function applyQuickBinding(binding: QuickBinding) {
        replaceSelectedKey(createKey(
            binding.binding,
            binding.label,
            binding.category,
        ));
    }

    function createModMorphForSelectedKey() {
        commit((draft) => {
            const key = draft.layers[draft.currentLayer].keys[draft.selectedKey];
            const normalBinding = key.binding.trim() || "&none";
            const dotColonPreset = normalBinding === "&kp DOT";
            const morphedBinding = dotColonPreset ? "&kp COLON" : "&none";
            const referenceBase = dotColonPreset
                ? "dot_colon"
                : `${sanitizeBehaviorReference(deriveLabel(normalBinding))}_morph`;
            const reference = uniqueModMorphReference(draft, referenceBase);
            const id = uniqueModMorphId(draft);
            const displayedLabel = getKeyLabel(key);
            const category = getKeyCategory(key);

            draft.modMorphs.push({
                id,
                reference,
                normalBinding,
                morphedBinding,
                mods: ["MOD_LSFT", "MOD_RSFT"],
                keepMods: [],
            });

            draft.layers[draft.currentLayer].keys[draft.selectedKey] = createKey(
                getModMorphBinding(reference),
                displayedLabel,
                category,
            );
        });
    }

    function assignModMorphToSelectedKey(id: string) {
        commit((draft) => {
            const behavior = draft.modMorphs.find((item) => item.id === id);
            if (!behavior) return;

            const label = deriveLabel(behavior.normalBinding);
            const category = inferCategory(behavior.normalBinding, label);
            draft.layers[draft.currentLayer].keys[draft.selectedKey] = createKey(
                getModMorphBinding(behavior.reference),
                label,
                category,
            );
        });
    }

    function updateModMorph(
        id: string,
        patch: Partial<ZmkModMorph>,
        record = false,
    ) {
        const apply = (draft: ZmkEditorState) => {
            const behavior = draft.modMorphs.find((item) => item.id === id);
            if (!behavior) return;

            if (patch.reference !== undefined) {
                const oldBinding = getModMorphBinding(behavior.reference);
                const nextReference = uniqueModMorphReference(
                    draft,
                    patch.reference,
                    id,
                );
                const nextBinding = getModMorphBinding(nextReference);

                if (oldBinding !== nextBinding) {
                    replaceBehaviorReference(draft, oldBinding, nextBinding, id);
                }

                behavior.reference = nextReference;
            }

            if (patch.normalBinding !== undefined) {
                behavior.normalBinding = patch.normalBinding;
            }

            if (patch.morphedBinding !== undefined) {
                behavior.morphedBinding = patch.morphedBinding;
            }

            if (patch.mods !== undefined) {
                behavior.mods = [...new Set(patch.mods)];
                behavior.keepMods = behavior.keepMods.filter((modifier) =>
                    behavior.mods.includes(modifier),
                );
            }

            if (patch.keepMods !== undefined) {
                behavior.keepMods = [...new Set(patch.keepMods)]
                    .filter((modifier) => behavior.mods.includes(modifier));
            }
        };

        record ? commit(apply) : updateLive(apply);
    }

    function detachSelectedModMorph(id: string) {
        commit((draft) => {
            const behavior = draft.modMorphs.find((item) => item.id === id);
            if (!behavior) return;

            const key = draft.layers[draft.currentLayer].keys[draft.selectedKey];
            if (key.binding.trim() !== getModMorphBinding(behavior.reference)) return;

            const displayedLabel = getKeyLabel(key);
            const category = getKeyCategory(key);
            draft.layers[draft.currentLayer].keys[draft.selectedKey] = createKey(
                behavior.normalBinding.trim() || "&none",
                displayedLabel,
                category,
            );

            if (!isModMorphReferenced(draft, behavior)) {
                draft.modMorphs = draft.modMorphs.filter((item) => item.id !== id);
            }
        });
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

        const result = zmkEditorStateStore.remove();
        setSaveStatus(result.ok ? "Local save cleared" : "Could not clear local save");
    }

    const selectKey = useCallback((index: number) => {
        setState((previous) => ({
            ...previous,
            selectedKey: index,
        }));
    }, []);

    const selectLayer = useCallback((index: number) => {
        setState((previous) => ({
            ...previous,
            currentLayer: index,
        }));
    }, []);

    function startReplaceBinding() {
        beginEdit();
        updateSelectedKey({ binding: "&" });
    }

    function yankSelectedKey() {
        const result = writeSelectedKeyToRegister(state, "yank");

        if (!result.ok) {
            showCommandStatus("Could not update key register");
            return;
        }

        showCommandStatus(`Yanked ${getKeyLabel(result.value.key)}`);
    }

    function deleteSelectedKey() {
        const result = writeSelectedKeyToRegister(state, "delete");

        if (!result.ok) {
            showCommandStatus("Register unavailable · key unchanged");
            return;
        }

        const deletedLabel = getKeyLabel(result.value.key);
        replaceSelectedKey(createKey("&trans"));
        showCommandStatus(`Deleted ${deletedLabel} · register updated`);
    }

    function pasteSelectedKey() {
        const result = readKeyRegister();

        if (!result.ok) {
            showCommandStatus("Stored register is invalid or unavailable");
            return;
        }

        if (!result.value) {
            showCommandStatus("Key register is empty");
            return;
        }

        replaceSelectedKey(result.value.key);
        showCommandStatus(
            `Pasted ${getKeyLabel(result.value.key)} from ${result.value.source.layerName}`,
        );
    }

    useZmkEditorVimMotions({
        enabled: VIM_MOTIONS_ENABLED,
        selectedKey: state.selectedKey,
        currentLayer: state.currentLayer,
        layerCount: state.layers.length,
        editorRootRef,
        bindingInputRef,
        displayLabelInputRef,
        onSelectKey: selectKey,
        onSelectLayer: selectLayer,
        onStartReplaceBinding: startReplaceBinding,
        onYankKey: yankSelectedKey,
        onDeleteKey: deleteSelectedKey,
        onPasteKey: pasteSelectedKey,
        onUndo: undo,
        onRedo: redo,
    });

    return (
        <section
            ref={editorRootRef}
            tabIndex={-1}
            className="zmk-editor-page bg-background text-foreground"
        >
            <div className="zmk-editor-orbit zmk-editor-orbit--one" />
            <div className="zmk-editor-orbit zmk-editor-orbit--two" />

            <div className="relative mx-auto w-full max-w-[1440px] px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
                <EditorHeader
                    saveStatus={commandStatus ?? saveStatus}
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
                    onSelect={selectLayer}
                />

                <div className="zmk-editor-shell">
                    <KeyboardWorkspace
                        state={state}
                        coveredCharacters={coveredCharacters}
                        coverageExpanded={coverageExpanded}
                        onSelectKey={selectKey}
                        onToggleCoverage={() => setCoverageExpanded((value) => !value)}
                    />
                    <KeyInspector
                        state={state}
                        selectedKey={selectedKey}
                        bindingInputRef={bindingInputRef}
                        displayLabelInputRef={displayLabelInputRef}
                        onBeginEdit={beginEdit}
                        onEndEdit={endEdit}
                        onUpdateKey={(patch) => updateSelectedKey(patch)}
                        onCommitKey={(patch) => updateSelectedKey(patch, true)}
                        onReplaceKey={replaceSelectedKey}
                        onApplyQuickBinding={applyQuickBinding}
                        onCreateModMorph={createModMorphForSelectedKey}
                        onAssignModMorph={assignModMorphToSelectedKey}
                        onUpdateModMorph={updateModMorph}
                        onDetachModMorph={detachSelectedModMorph}
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

function cloneState(state: ZmkEditorState): ZmkEditorState {
    return structuredClone(state);
}

function uniqueModMorphId(state: ZmkEditorState): string {
    const used = new Set(state.modMorphs.map((behavior) => behavior.id));
    let index = 1;

    while (used.has(`mod-morph-${index}`)) index += 1;
    return `mod-morph-${index}`;
}

function uniqueModMorphReference(
    state: ZmkEditorState,
    desired: string,
    excludeId?: string,
): string {
    const base = sanitizeBehaviorReference(desired);
    const used = new Set(
        state.modMorphs
            .filter((behavior) => behavior.id !== excludeId)
            .map((behavior) => behavior.reference),
    );

    if (!used.has(base)) return base;

    let index = 2;
    while (used.has(`${base}_${index}`)) index += 1;
    return `${base}_${index}`;
}

function replaceBehaviorReference(
    state: ZmkEditorState,
    oldBinding: string,
    newBinding: string,
    renamedBehaviorId: string,
): void {
    for (const layer of state.layers) {
        for (const key of layer.keys) {
            if (key.binding.trim() === oldBinding) {
                key.binding = newBinding;
            }
        }
    }

    for (const behavior of state.modMorphs) {
        if (behavior.id === renamedBehaviorId) continue;

        if (behavior.normalBinding.trim() === oldBinding) {
            behavior.normalBinding = newBinding;
        }
        if (behavior.morphedBinding.trim() === oldBinding) {
            behavior.morphedBinding = newBinding;
        }
    }
}

function isModMorphReferenced(
    state: ZmkEditorState,
    target: ZmkModMorph,
): boolean {
    const binding = getModMorphBinding(target.reference);

    if (state.layers.some((layer) =>
        layer.keys.some((key) => key.binding.trim() === binding),
    )) {
        return true;
    }

    return state.modMorphs.some((behavior) =>
        behavior.id !== target.id && (
            behavior.normalBinding.trim() === binding ||
            behavior.morphedBinding.trim() === binding
        ),
    );
}


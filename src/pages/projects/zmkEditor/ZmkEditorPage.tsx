import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
    QuickBinding,
    ZmkEditorState,
    ZmkHoldTap,
    ZmkKey,
    ZmkModMorph,
} from "./zmkEditor.types";

import {
    createBlankLayer,
    createDefaultBaseLayer,
    createDefaultState,
    createKey,
    composeBehaviorBinding,
    deriveLabel,
    getCoverage,
    getHoldTapAssignment,
    getHoldTapBinding,
    getKeyCategory,
    getKeyLabel,
    getModeLayerIndices,
    getModeLayers,
    getModMorphBinding,
    getTapHoldSeed,
    inferCategory,
    isLeftHalfKeyPosition,
    LEFT_HALF_KEY_POSITIONS,
    RIGHT_HALF_KEY_POSITIONS,
    sanitizeBehaviorReference,
    sanitizeConstant,
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
import type { HomeRowModifier } from "./components/HoldTapEditor";
import KeyInspector from "./components/KeyInspector";
import {
    EditorHeader,
    ExportDialog,
    LayerRail,
    ModeRail,
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
    const currentModeLayerIndices = useMemo(
        () => getModeLayerIndices(state, state.currentMode),
        [state.currentMode, state.layers],
    );
    const currentModeLayerPosition = Math.max(
        0,
        currentModeLayerIndices.indexOf(state.currentLayer),
    );
    const exportText = useMemo(() => generateKeymap(state), [state]);
    const coveredCharacters = useMemo(
        () => getCoverage(state),
        [state.layers, state.modMorphs, state.holdTaps],
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
                key.binding = patch.binding;
                pruneUnusedManagedBehaviors(draft);
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
            pruneUnusedManagedBehaviors(draft);
        });
    }

    function applyQuickBinding(binding: QuickBinding) {
        replaceSelectedKey(createKey(
            binding.binding,
            binding.label,
            binding.category,
        ));
    }

    function createHoldTapForSelectedKey() {
        commit((draft) => {
            const key = draft.layers[draft.currentLayer].keys[draft.selectedKey];
            const seed = getTapHoldSeed(draft, key.binding);
            if (!seed) return;

            const tapLabel = deriveLabel(composeBehaviorBinding(
                seed.tapBehavior,
                seed.tapParameter,
            ));
            const id = uniqueHoldTapId(draft);
            const reference = uniqueManagedBehaviorReference(
                draft,
                `${sanitizeBehaviorReference(tapLabel)}_tap_hold`,
            );

            draft.holdTaps.push({
                id,
                reference,
                holdBehavior: seed.holdBehavior,
                tapBehavior: seed.tapBehavior,
                flavor: key.binding.trim().startsWith("&lt ")
                    ? "tap-preferred"
                    : "hold-preferred",
                tappingTermMs: 200,
                retroTap: false,
                holdWhileUndecided: false,
                holdWhileUndecidedLinger: false,
                holdTriggerKeyPositions: [],
                holdTriggerOnRelease: false,
            });

            key.binding = getHoldTapBinding(
                reference,
                seed.holdParameter,
                seed.tapParameter,
            );
        });
    }

    function applyHomeRowMod(modifier: HomeRowModifier) {
        commit((draft) => {
            const key = draft.layers[draft.currentLayer].keys[draft.selectedKey];
            const seed = getTapHoldSeed(draft, key.binding);
            if (!seed || seed.tapBehavior !== "&kp" || seed.tapParameter === "0") {
                return;
            }

            const pair = ensureHomeRowHoldTaps(draft);
            const leftHand = isLeftHalfKeyPosition(draft.selectedKey);
            const behavior = leftHand ? pair.left : pair.right;
            const modifierCode = homeRowModifierKeycode(modifier, leftHand);

            key.binding = getHoldTapBinding(
                behavior.reference,
                modifierCode,
                seed.tapParameter,
            );
            delete key.categoryOverride;
        });
    }

    function assignHoldTapToSelectedKey(id: string) {
        commit((draft) => {
            const behavior = draft.holdTaps.find((item) => item.id === id);
            if (!behavior) return;

            const key = draft.layers[draft.currentLayer].keys[draft.selectedKey];
            const seed = getTapHoldSeed(draft, key.binding);
            const tapParameter = seed?.tapBehavior === behavior.tapBehavior
                ? seed.tapParameter
                : behavior.tapBehavior === "&kp" && seed?.tapBehavior === "&kp"
                    ? seed.tapParameter
                    : "0";
            const holdParameter = defaultHoldTapParameter(draft, behavior);

            key.binding = getHoldTapBinding(
                behavior.reference,
                holdParameter,
                tapParameter,
            );
            delete key.categoryOverride;
        });
    }

    function updateHoldTap(
        id: string,
        patch: Partial<ZmkHoldTap>,
        record = false,
    ) {
        const apply = (draft: ZmkEditorState) => {
            const behavior = draft.holdTaps.find((item) => item.id === id);
            if (!behavior) return;

            if (patch.reference !== undefined) {
                const oldReference = `&${sanitizeBehaviorReference(behavior.reference)}`;
                const nextReference = uniqueManagedBehaviorReference(
                    draft,
                    patch.reference,
                    id,
                );
                const nextBindingReference = `&${nextReference}`;

                if (oldReference !== nextBindingReference) {
                    replaceBehaviorReference(
                        draft,
                        oldReference,
                        nextBindingReference,
                        id,
                    );
                }

                behavior.reference = nextReference;
            }

            if (patch.holdBehavior !== undefined) {
                behavior.holdBehavior = patch.holdBehavior;
            }
            if (patch.tapBehavior !== undefined) {
                behavior.tapBehavior = patch.tapBehavior;
            }
            if (patch.flavor !== undefined) behavior.flavor = patch.flavor;
            if (patch.tappingTermMs !== undefined) {
                behavior.tappingTermMs = patch.tappingTermMs;
            }
            if ("quickTapMs" in patch) {
                if (patch.quickTapMs === undefined) delete behavior.quickTapMs;
                else behavior.quickTapMs = patch.quickTapMs;
            }
            if ("requirePriorIdleMs" in patch) {
                if (patch.requirePriorIdleMs === undefined) {
                    delete behavior.requirePriorIdleMs;
                } else {
                    behavior.requirePriorIdleMs = patch.requirePriorIdleMs;
                }
            }
            if (patch.retroTap !== undefined) behavior.retroTap = patch.retroTap;
            if (patch.holdWhileUndecided !== undefined) {
                behavior.holdWhileUndecided = patch.holdWhileUndecided;
            }
            if (patch.holdWhileUndecidedLinger !== undefined) {
                behavior.holdWhileUndecidedLinger = patch.holdWhileUndecidedLinger;
            }
            if (patch.holdTriggerKeyPositions !== undefined) {
                behavior.holdTriggerKeyPositions = [...patch.holdTriggerKeyPositions];
            }
            if (patch.holdTriggerOnRelease !== undefined) {
                behavior.holdTriggerOnRelease = patch.holdTriggerOnRelease;
            }
            if ("preset" in patch) {
                if (patch.preset === undefined) delete behavior.preset;
                else behavior.preset = patch.preset;
            }
        };

        record ? commit(apply) : updateLive(apply);
    }

    function updateSelectedHoldTapAction(
        id: string,
        action: "tap" | "hold",
        binding: string,
    ) {
        const parsed = parseHoldTapAction(binding);
        if (!parsed) return;

        commit((draft) => {
            const key = draft.layers[draft.currentLayer].keys[draft.selectedKey];
            const assignment = getHoldTapAssignment(draft, key.binding);
            if (!assignment || assignment.behavior.id !== id) return;

            const behavior = assignment.behavior;
            let holdParameter = assignment.holdParameter;
            let tapParameter = assignment.tapParameter;

            if (action === "tap") {
                behavior.tapBehavior = parsed.behavior;
                tapParameter = parsed.parameter;
            } else {
                behavior.holdBehavior = parsed.behavior;
                holdParameter = parsed.parameter;
            }

            if (behavior.preset && (
                behavior.holdBehavior !== "&kp" ||
                behavior.tapBehavior !== "&kp"
            )) {
                delete behavior.preset;
            }

            key.binding = getHoldTapBinding(
                behavior.reference,
                holdParameter,
                tapParameter,
            );
            delete key.categoryOverride;
        });
    }

    function detachSelectedHoldTap(id: string) {
        commit((draft) => {
            const key = draft.layers[draft.currentLayer].keys[draft.selectedKey];
            const assignment = getHoldTapAssignment(draft, key.binding);
            if (!assignment || assignment.behavior.id !== id) return;

            key.binding = composeBehaviorBinding(
                assignment.behavior.tapBehavior,
                assignment.tapParameter,
            );
            delete key.categoryOverride;
            pruneUnusedManagedBehaviors(draft);
        });
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
            const displayedLabel = getKeyLabel(key, draft);
            const category = getKeyCategory(key, draft);

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

            const displayedLabel = getKeyLabel(key, draft);
            const category = getKeyCategory(key, draft);
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
        if (!window.confirm("Reset all modes, layers, and behaviors to the built-in defaults?")) {
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

    function addMode() {
        commit((draft) => {
            const sourceMode = draft.modes.find(
                (mode) => mode.id === draft.currentMode,
            ) ?? draft.modes[0];
            const sourceLayers = getModeLayers(draft, sourceMode.id);
            const modeNumber = nextModeNumber(draft);
            const modeName = `Mode ${modeNumber}`;
            const modeId = uniqueModeId(draft, `mode-${modeNumber}`);
            const constantMap = new Map<string, string>();
            const reserved = new Set(
                draft.layers.map((layer) => sanitizeConstant(layer.constant)),
            );

            const layers = sourceLayers.map((layer, index) => {
                const suffix = sanitizeConstant(layer.name || `LAYER_${index + 1}`);
                const desired = `${sanitizeConstant(modeName)}_${suffix}`;
                const constant = uniqueConstantFromSet(reserved, desired);
                reserved.add(constant);
                constantMap.set(sanitizeConstant(layer.constant), constant);

                return {
                    ...structuredClone(layer),
                    modeId,
                    constant,
                };
            });

            for (let layerIndex = 0; layerIndex < layers.length; layerIndex += 1) {
                const sourceLayer = sourceLayers[layerIndex];
                const layer = layers[layerIndex];

                layer.keys = layer.keys.map((key, keyIndex) => {
                    const sourceKey = sourceLayer.keys[keyIndex];
                    const displayedLabel = getKeyLabel(sourceKey, draft);
                    const remappedBinding = remapLayerConstants(
                        key.binding,
                        constantMap,
                    );
                    const nextKey = cloneKey(key);
                    nextKey.binding = remappedBinding;

                    if (
                        nextKey.labelOverride === undefined &&
                        deriveLabel(remappedBinding) !== displayedLabel
                    ) {
                        nextKey.labelOverride = displayedLabel;
                    }

                    return nextKey;
                });
            }

            draft.modes.push({ id: modeId, name: modeName });
            const firstLayerIndex = draft.layers.length;
            draft.layers.push(...layers);
            draft.currentMode = modeId;
            draft.currentLayer = firstLayerIndex;
        });
    }

    function renameMode(modeId: string, name: string) {
        commit((draft) => {
            const mode = draft.modes.find((item) => item.id === modeId);
            if (mode) mode.name = name.trim() || mode.name;
        });
    }

    function deleteMode(modeId: string) {
        const mode = state.modes.find((item) => item.id === modeId);
        if (!mode) return;

        if (state.modes.length === 1) {
            if (!window.confirm(
                `“${mode.name}” is the only mode. Deleting it will reset the editor to its default mode and layers. Continue?`,
            )) return;

            setHistory((items) => [...items.slice(-99), state]);
            setFuture([]);
            setState(createDefaultState());
            return;
        }

        if (!window.confirm(
            `Delete the “${mode.name}” mode and all of its layers? Bindings elsewhere that target those layers may need updating.`,
        )) return;

        commit((draft) => {
            const modeIndex = draft.modes.findIndex((item) => item.id === modeId);
            const activeModeId = draft.currentMode;
            const activeLayer = draft.layers[draft.currentLayer];

            draft.modes = draft.modes.filter((item) => item.id !== modeId);
            draft.layers = draft.layers.filter((layer) => layer.modeId !== modeId);

            if (activeModeId !== modeId) {
                draft.currentMode = activeModeId;
                draft.currentLayer = draft.layers.indexOf(activeLayer);
            } else {
                const nextMode = draft.modes[
                    Math.min(modeIndex, draft.modes.length - 1)
                ];
                draft.currentMode = nextMode.id;
                draft.currentLayer = draft.layers.findIndex(
                    (layer) => layer.modeId === nextMode.id,
                );
            }

            draft.selectedKey = Math.min(draft.selectedKey, 41);
            pruneUnusedManagedBehaviors(draft);
        });
    }

    function selectMode(modeId: string) {
        setState((previous) => {
            if (previous.currentMode === modeId) return previous;

            const firstLayer = previous.layers.findIndex(
                (layer) => layer.modeId === modeId,
            );
            if (firstLayer < 0) return previous;

            return {
                ...previous,
                currentMode: modeId,
                currentLayer: firstLayer,
            };
        });
    }

    function addLayer() {
        commit((draft) => {
            const mode = draft.modes.find((item) => item.id === draft.currentMode);
            if (!mode) return;

            const indices = getModeLayerIndices(draft, mode.id);
            const localNumber = indices.length + 1;
            const prefix = draft.modes.length > 1 || mode.id !== "default"
                ? `${sanitizeConstant(mode.name)}_`
                : "";
            const constant = uniqueLayerConstant(
                draft,
                `${prefix}LAYER_${localNumber}`,
            );
            const layer = createBlankLayer(
                mode.id,
                `Layer ${localNumber}`,
                constant,
                nextLayerColor(draft, mode.id),
            );
            const insertAt = indices.length > 0
                ? indices[indices.length - 1] + 1
                : draft.layers.length;

            draft.layers.splice(insertAt, 0, layer);
            draft.currentLayer = insertAt;
        });
    }

    function renameLayer(layerIndex: number, name: string) {
        commit((draft) => {
            const layer = draft.layers[layerIndex];
            if (layer) layer.name = name.trim() || layer.name;
        });
    }

    function deleteLayer(layerIndex: number) {
        const layer = state.layers[layerIndex];
        if (!layer) return;

        const mode = state.modes.find((item) => item.id === layer.modeId);
        const modeLayers = getModeLayers(state, layer.modeId);

        if (modeLayers.length === 1) {
            if (!window.confirm(
                `“${layer.name}” is the only layer in ${mode?.name ?? "this mode"}. Deleting it will reset that layer to a default Base layer. Continue?`,
            )) return;

            commit((draft) => {
                // Keep the base constant stable so existing &to/&tog bindings
                // that enter this mode continue to target it after reset.
                const constant = sanitizeConstant(layer.constant);
                draft.layers[layerIndex] = createDefaultBaseLayer(
                    layer.modeId,
                    constant,
                    true,
                );
                draft.currentMode = layer.modeId;
                draft.currentLayer = layerIndex;
                draft.selectedKey = 0;
                pruneUnusedManagedBehaviors(draft);
            });
            return;
        }

        if (!window.confirm(
            `Delete the “${layer.name}” layer? Bindings elsewhere that target ${layer.constant} may need updating.`,
        )) return;

        commit((draft) => {
            const activeLayer = draft.layers[draft.currentLayer];
            const localIndices = getModeLayerIndices(draft, layer.modeId);
            const localIndex = localIndices.indexOf(layerIndex);
            draft.layers.splice(layerIndex, 1);

            const activeIndex = draft.layers.indexOf(activeLayer);
            if (activeIndex >= 0) {
                draft.currentLayer = activeIndex;
            } else {
                const remaining = getModeLayerIndices(draft, layer.modeId);
                draft.currentLayer = remaining[
                    Math.min(Math.max(localIndex, 0), remaining.length - 1)
                ];
            }

            draft.currentMode = draft.layers[draft.currentLayer].modeId;
            pruneUnusedManagedBehaviors(draft);
        });
    }

    const selectKey = useCallback((index: number) => {
        setState((previous) => ({
            ...previous,
            selectedKey: index,
        }));
    }, []);

    const selectLayer = useCallback((index: number) => {
        setState((previous) => {
            const layer = previous.layers[index];
            if (!layer) return previous;

            return {
                ...previous,
                currentMode: layer.modeId,
                currentLayer: index,
            };
        });
    }, []);

    const selectModeLayer = useCallback((localIndex: number) => {
        setState((previous) => {
            const indices = getModeLayerIndices(previous, previous.currentMode);
            const layerIndex = indices[localIndex];
            if (layerIndex === undefined) return previous;

            return {
                ...previous,
                currentLayer: layerIndex,
            };
        });
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

        showCommandStatus(`Yanked ${getKeyLabel(result.value.key, state)}`);
    }

    function deleteSelectedKey() {
        const result = writeSelectedKeyToRegister(state, "delete");

        if (!result.ok) {
            showCommandStatus("Register unavailable · key unchanged");
            return;
        }

        const deletedLabel = getKeyLabel(result.value.key, state);
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
            `Pasted ${getKeyLabel(result.value.key, state)} from ${result.value.source.layerName}`,
        );
    }

    useZmkEditorVimMotions({
        enabled: VIM_MOTIONS_ENABLED,
        selectedKey: state.selectedKey,
        currentLayer: currentModeLayerPosition,
        layerCount: currentModeLayerIndices.length,
        editorRootRef,
        bindingInputRef,
        displayLabelInputRef,
        onSelectKey: selectKey,
        onSelectLayer: selectModeLayer,
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

                <ModeRail
                    state={state}
                    onSelect={selectMode}
                    onAdd={addMode}
                    onRename={renameMode}
                    onDelete={deleteMode}
                />

                <LayerRail
                    state={state}
                    onSelect={selectLayer}
                    onAdd={addLayer}
                    onRename={renameLayer}
                    onDelete={deleteLayer}
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
                        onCreateHoldTap={createHoldTapForSelectedKey}
                        onApplyHomeRowMod={applyHomeRowMod}
                        onAssignHoldTap={assignHoldTapToSelectedKey}
                        onUpdateHoldTap={updateHoldTap}
                        onUpdateHoldTapAction={updateSelectedHoldTapAction}
                        onDetachHoldTap={detachSelectedHoldTap}
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
    return uniqueManagedBehaviorReference(state, desired, excludeId);
}

function uniqueHoldTapId(state: ZmkEditorState): string {
    const used = new Set(state.holdTaps.map((behavior) => behavior.id));
    let index = 1;

    while (used.has(`hold-tap-${index}`)) index += 1;
    return `hold-tap-${index}`;
}

function uniqueManagedBehaviorReference(
    state: ZmkEditorState,
    desired: string,
    excludeId?: string,
): string {
    const base = sanitizeBehaviorReference(desired);
    const used = new Set([
        ...state.modMorphs
            .filter((behavior) => behavior.id !== excludeId)
            .map((behavior) => behavior.reference),
        ...state.holdTaps
            .filter((behavior) => behavior.id !== excludeId)
            .map((behavior) => behavior.reference),
    ]);

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
            key.binding = replaceLeadingBehaviorReference(
                key.binding,
                oldBinding,
                newBinding,
            );
        }
    }

    for (const behavior of state.modMorphs) {
        if (behavior.id === renamedBehaviorId) continue;

        behavior.normalBinding = replaceLeadingBehaviorReference(
            behavior.normalBinding,
            oldBinding,
            newBinding,
        );
        behavior.morphedBinding = replaceLeadingBehaviorReference(
            behavior.morphedBinding,
            oldBinding,
            newBinding,
        );
    }

    for (const behavior of state.holdTaps) {
        if (behavior.id === renamedBehaviorId) continue;

        if (behavior.holdBehavior === oldBinding) {
            behavior.holdBehavior = newBinding;
        }
        if (behavior.tapBehavior === oldBinding) {
            behavior.tapBehavior = newBinding;
        }
    }
}

function replaceLeadingBehaviorReference(
    binding: string,
    oldReference: string,
    newReference: string,
): string {
    const trimmed = binding.trim();
    if (trimmed === oldReference) return newReference;
    if (trimmed.startsWith(`${oldReference} `)) {
        return `${newReference}${trimmed.slice(oldReference.length)}`;
    }
    return binding;
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
            firstBehaviorReference(behavior.normalBinding) === binding ||
            firstBehaviorReference(behavior.morphedBinding) === binding
        ),
    ) || state.holdTaps.some((behavior) =>
        behavior.holdBehavior === binding || behavior.tapBehavior === binding,
    );
}

function nextModeNumber(state: ZmkEditorState): number {
    const usedNames = new Set(state.modes.map((mode) => mode.name.toLowerCase()));
    let index = 2;

    while (usedNames.has(`mode ${index}`)) index += 1;
    return index;
}

function uniqueModeId(state: ZmkEditorState, desired: string): string {
    const used = new Set(state.modes.map((mode) => mode.id));
    const base = desired
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "") || "mode";

    if (!used.has(base)) return base;

    let index = 2;
    while (used.has(`${base}-${index}`)) index += 1;
    return `${base}-${index}`;
}

function uniqueLayerConstant(
    state: ZmkEditorState,
    desired: string,
    excludeIndex?: number,
): string {
    const reserved = new Set(
        state.layers
            .filter((_, index) => index !== excludeIndex)
            .map((layer) => sanitizeConstant(layer.constant)),
    );

    return uniqueConstantFromSet(reserved, desired);
}

function uniqueConstantFromSet(reserved: Set<string>, desired: string): string {
    const base = sanitizeConstant(desired);
    if (!reserved.has(base)) return base;

    let index = 2;
    while (reserved.has(`${base}_${index}`)) index += 1;
    return `${base}_${index}`;
}

function remapLayerConstants(
    binding: string,
    constantMap: Map<string, string>,
): string {
    let result = binding;

    const entries = [...constantMap.entries()].sort(
        ([left], [right]) => right.length - left.length,
    );

    for (const [oldConstant, newConstant] of entries) {
        const escaped = oldConstant.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        result = result.replace(
            new RegExp(`\\b${escaped}\\b`, "g"),
            newConstant,
        );
    }

    return result;
}

function nextLayerColor(state: ZmkEditorState, modeId: string): string {
    const palette = [
        "#36d9ff",
        "#f0a13a",
        "#e86671",
        "#c678dd",
        "#7fd88f",
        "#75a7ff",
    ];
    const count = getModeLayers(state, modeId).length;
    return palette[count % palette.length];
}

function ensureHomeRowHoldTaps(state: ZmkEditorState): {
    left: ZmkHoldTap;
    right: ZmkHoldTap;
} {
    let left = state.holdTaps.find((behavior) => behavior.preset === "home-row-left");
    let right = state.holdTaps.find((behavior) => behavior.preset === "home-row-right");

    if (!left) {
        left = createHomeRowHoldTap(
            state,
            "home-row-left",
            "hml",
            [...RIGHT_HALF_KEY_POSITIONS],
        );
        state.holdTaps.push(left);
    }
    if (!right) {
        right = createHomeRowHoldTap(
            state,
            "home-row-right",
            "hmr",
            [...LEFT_HALF_KEY_POSITIONS],
        );
        state.holdTaps.push(right);
    }

    return { left, right };
}

function createHomeRowHoldTap(
    state: ZmkEditorState,
    preset: "home-row-left" | "home-row-right",
    desiredReference: string,
    holdTriggerKeyPositions: number[],
): ZmkHoldTap {
    return {
        id: uniqueHoldTapId(state),
        reference: uniqueManagedBehaviorReference(state, desiredReference),
        holdBehavior: "&kp",
        tapBehavior: "&kp",
        flavor: "balanced",
        tappingTermMs: 280,
        quickTapMs: 175,
        requirePriorIdleMs: 150,
        retroTap: false,
        holdWhileUndecided: false,
        holdWhileUndecidedLinger: false,
        holdTriggerKeyPositions,
        holdTriggerOnRelease: true,
        preset,
    };
}

function homeRowModifierKeycode(
    modifier: HomeRowModifier,
    leftHand: boolean,
): string {
    const side = leftHand ? "L" : "R";
    const names: Record<HomeRowModifier, string> = {
        ctrl: "CTRL",
        alt: "ALT",
        gui: "GUI",
        shift: "SHFT",
    };
    return `${side}${names[modifier]}`;
}

function parseHoldTapAction(binding: string): {
    behavior: string;
    parameter: string;
} | undefined {
    const match = binding.trim().match(/^(&[A-Za-z0-9_]+)(?:\s+(.+))?$/);
    if (!match) return undefined;

    return {
        behavior: match[1],
        parameter: match[2]?.trim() || "0",
    };
}

function defaultHoldTapParameter(
    state: ZmkEditorState,
    behavior: ZmkHoldTap,
): string {
    if (behavior.holdBehavior === "&kp") {
        if (behavior.preset === "home-row-right") return "RSHFT";
        return "LSHFT";
    }
    if (behavior.holdBehavior === "&mo") {
        return getModeLayers(state, state.currentMode)[1]?.constant ?? "0";
    }
    return "0";
}

function firstBehaviorReference(binding: string): string {
    return binding.trim().split(/\s+/)[0] ?? "";
}

function pruneUnusedManagedBehaviors(state: ZmkEditorState): void {
    const modMorphByBinding = new Map(
        state.modMorphs.map((behavior) => [
            getModMorphBinding(behavior.reference),
            behavior,
        ]),
    );
    const holdTapByBinding = new Map(
        state.holdTaps.map((behavior) => [
            `&${sanitizeBehaviorReference(behavior.reference)}`,
            behavior,
        ]),
    );
    const reachableModMorphs = new Set<string>();
    const reachableHoldTaps = new Set<string>();
    const queue = state.layers.flatMap((layer) =>
        layer.keys.map((key) => key.binding.trim()),
    );

    while (queue.length > 0) {
        const binding = queue.pop()!;
        const reference = firstBehaviorReference(binding);

        const modMorph = modMorphByBinding.get(reference);
        if (modMorph && !reachableModMorphs.has(modMorph.id)) {
            reachableModMorphs.add(modMorph.id);
            queue.push(
                modMorph.normalBinding.trim(),
                modMorph.morphedBinding.trim(),
            );
        }

        const holdTap = holdTapByBinding.get(reference);
        if (holdTap && !reachableHoldTaps.has(holdTap.id)) {
            reachableHoldTaps.add(holdTap.id);
            queue.push(holdTap.holdBehavior, holdTap.tapBehavior);
        }
    }

    state.modMorphs = state.modMorphs.filter((behavior) =>
        reachableModMorphs.has(behavior.id),
    );
    state.holdTaps = state.holdTaps.filter((behavior) =>
        reachableHoldTaps.has(behavior.id),
    );
}

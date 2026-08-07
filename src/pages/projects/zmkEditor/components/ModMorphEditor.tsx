import { useEffect, useState } from "react";
import type {
    ZmkEditorState,
    ZmkKey,
    ZmkModifier,
    ZmkModMorph,
} from "../zmkEditor.types";
import {
    ZMK_MODIFIER_OPTIONS,
    deriveLabel,
    findModMorphForBinding,
    getModMorphBinding,
} from "../logic/zmkEditor.data";

export default function ModMorphEditor({
    state,
    selectedKey,
    onBeginEdit,
    onEndEdit,
    onCreate,
    onAssign,
    onUpdate,
}: {
    state: ZmkEditorState;
    selectedKey: ZmkKey;
    onBeginEdit: () => void;
    onEndEdit: () => void;
    onCreate: () => void;
    onAssign: (id: string) => void;
    onUpdate: (
        id: string,
        patch: Partial<ZmkModMorph>,
        record?: boolean,
    ) => void;
}) {
    const behavior = findModMorphForBinding(state, selectedKey.binding);
    const isDotPreset = selectedKey.binding.trim() === "&kp DOT";

    return (
        <details className="zmk-editor-mod-morph" data-active={Boolean(behavior)}>
            <summary className="zmk-editor-mod-morph__summary">
                <span className="zmk-editor-mod-morph__summary-copy">
                    <strong>Mod-morph</strong>
                    <small>
                        {behavior
                            ? `${deriveLabel(behavior.normalBinding)} → ${deriveLabel(behavior.morphedBinding)}`
                            : "Optional modifier-dependent behavior"}
                    </small>
                </span>
                <span className="zmk-editor-mod-morph__summary-value">
                    {behavior
                        ? getModMorphBinding(behavior.reference)
                        : isDotPreset
                            ? "Shift . → :"
                            : "Optional"}
                </span>
            </summary>

            <div className="zmk-editor-mod-morph__content">
                {behavior ? (
                    <ManagedModMorph
                        behavior={behavior}
                        onBeginEdit={onBeginEdit}
                        onEndEdit={onEndEdit}
                        onUpdate={onUpdate}
                    />
                ) : (
                    <div className="zmk-editor-mod-morph__empty">
                        <p>
                            Switch to a second behavior whenever any selected modifier
                            is held.
                        </p>

                        {state.modMorphs.length > 0 && (
                            <div className="zmk-editor-mod-morph__existing">
                                <span>Use existing</span>
                                <div className="zmk-editor-mod-morph__existing-grid">
                                    {state.modMorphs.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            title={getModMorphBinding(item.reference)}
                                            onClick={() => onAssign(item.id)}
                                        >
                                            <strong>
                                                {deriveLabel(item.normalBinding)} → {deriveLabel(item.morphedBinding)}
                                            </strong>
                                            <span>{getModMorphBinding(item.reference)}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            type="button"
                            className="zmk-editor-button zmk-editor-button--ghost zmk-editor-mod-morph__create"
                            onClick={onCreate}
                        >
                            {isDotPreset ? "Create Shift . → :" : "Create mod-morph"}
                        </button>
                        <small>
                            {isDotPreset
                                ? "Prefills both Shift modifiers and &kp COLON."
                                : "Uses this key as the normal binding and Shift as the trigger."}
                        </small>
                    </div>
                )}
            </div>
        </details>
    );
}

function ManagedModMorph({
    behavior,
    onBeginEdit,
    onEndEdit,
    onUpdate,
}: {
    behavior: ZmkModMorph;
    onBeginEdit: () => void;
    onEndEdit: () => void;
    onUpdate: (
        id: string,
        patch: Partial<ZmkModMorph>,
        record?: boolean,
    ) => void;
}) {
    const [referenceDraft, setReferenceDraft] = useState(behavior.reference);

    useEffect(() => {
        setReferenceDraft(behavior.reference);
    }, [behavior.id, behavior.reference]);

    function commitReference() {
        onUpdate(behavior.id, { reference: referenceDraft }, true);
    }

    function setModifier(
        modifier: ZmkModifier,
        checked: boolean,
        target: "mods" | "keepMods",
    ) {
        const current = behavior[target];
        const next = checked
            ? [...new Set([...current, modifier])]
            : current.filter((item) => item !== modifier);

        if (target === "mods") {
            onUpdate(behavior.id, {
                mods: next,
                keepMods: behavior.keepMods.filter((item) => next.includes(item)),
            }, true);
            return;
        }

        onUpdate(behavior.id, { keepMods: next }, true);
    }

    return (
        <div className="zmk-editor-mod-morph__editor">
            <div className="zmk-editor-field zmk-editor-field--secondary">
                <label htmlFor={`modMorphReference-${behavior.id}`}>Reference</label>
                <div className="zmk-editor-mod-morph__reference-input">
                    <span>&amp;</span>
                    <input
                        id={`modMorphReference-${behavior.id}`}
                        className="font-mono"
                        type="text"
                        value={referenceDraft}
                        onChange={(event) => setReferenceDraft(event.target.value)}
                        onBlur={commitReference}
                    />
                </div>
            </div>

            <div className="zmk-editor-mod-morph__bindings">
                <div className="zmk-editor-field zmk-editor-field--secondary">
                    <label htmlFor={`modMorphNormal-${behavior.id}`}>
                        Normal
                        <span>{deriveLabel(behavior.normalBinding)}</span>
                    </label>
                    <input
                        id={`modMorphNormal-${behavior.id}`}
                        className="font-mono"
                        type="text"
                        value={behavior.normalBinding}
                        onFocus={onBeginEdit}
                        onBlur={onEndEdit}
                        onChange={(event) => onUpdate(behavior.id, {
                            normalBinding: event.target.value,
                        })}
                    />
                </div>

                <div className="zmk-editor-field zmk-editor-field--secondary">
                    <label htmlFor={`modMorphMorphed-${behavior.id}`}>
                        Modified
                        <span>{deriveLabel(behavior.morphedBinding)}</span>
                    </label>
                    <input
                        id={`modMorphMorphed-${behavior.id}`}
                        className="font-mono"
                        type="text"
                        value={behavior.morphedBinding}
                        onFocus={onBeginEdit}
                        onBlur={onEndEdit}
                        onChange={(event) => onUpdate(behavior.id, {
                            morphedBinding: event.target.value,
                        })}
                    />
                </div>
            </div>

            <ModifierGrid
                title="Trigger modifiers"
                description="Any selected modifier activates the modified binding."
                selected={behavior.mods}
                onChange={(modifier, checked) =>
                    setModifier(modifier, checked, "mods")}
            />

            <details className="zmk-editor-mod-morph__advanced">
                <summary>
                    <span>Keep modifiers</span>
                    <span>{behavior.keepMods.length || "none"}</span>
                </summary>
                <p>
                    Trigger modifiers are masked by default. Keep selected ones held
                    while the modified binding runs.
                </p>
                <ModifierGrid
                    title=""
                    description=""
                    selected={behavior.keepMods}
                    available={behavior.mods}
                    onChange={(modifier, checked) =>
                        setModifier(modifier, checked, "keepMods")}
                />
            </details>

            <p className="zmk-editor-mod-morph__export-note">
                Exported as <code>{getModMorphBinding(behavior.reference)}</code>
            </p>
        </div>
    );
}

function ModifierGrid({
    title,
    description,
    selected,
    available,
    onChange,
}: {
    title: string;
    description: string;
    selected: ZmkModifier[];
    available?: ZmkModifier[];
    onChange: (modifier: ZmkModifier, checked: boolean) => void;
}) {
    return (
        <div className="zmk-editor-mod-morph__modifier-section">
            {(title || description) && (
                <div className="zmk-editor-mod-morph__modifier-head">
                    {title && <strong>{title}</strong>}
                    {description && <span>{description}</span>}
                </div>
            )}
            <div className="zmk-editor-mod-morph__modifier-grid">
                {ZMK_MODIFIER_OPTIONS.map((option) => {
                    const enabled = available === undefined || available.includes(option.value);
                    return (
                        <label key={option.value} data-disabled={!enabled}>
                            <input
                                type="checkbox"
                                checked={selected.includes(option.value)}
                                disabled={!enabled}
                                onChange={(event) =>
                                    onChange(option.value, event.target.checked)}
                            />
                            <span>{option.label}</span>
                        </label>
                    );
                })}
            </div>
        </div>
    );
}

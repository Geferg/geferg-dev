import { useEffect, useMemo, useState } from "react";

import type {
    ZmkEditorState,
    ZmkHoldTap,
    ZmkHoldTapFlavor,
    ZmkKey,
} from "../zmkEditor.types";

import {
    HOLD_TAP_FLAVORS,
    composeBehaviorBinding,
    deriveLabel,
    getHoldTapAssignment,
    getKeyLabel,
    getTapHoldSeed,
    isLeftHalfKeyPosition,
} from "../logic/zmkEditor.data";

type HomeRowModifier = "ctrl" | "alt" | "gui" | "shift";

const HOME_ROW_MODIFIERS: ReadonlyArray<{
    value: HomeRowModifier;
    label: string;
    left: string;
    right: string;
}> = [
    { value: "ctrl", label: "Ctrl", left: "LCTRL", right: "RCTRL" },
    { value: "alt", label: "Alt", left: "LALT", right: "RALT" },
    { value: "gui", label: "GUI", left: "LGUI", right: "RGUI" },
    { value: "shift", label: "Shift", left: "LSHFT", right: "RSHFT" },
];

export default function HoldTapEditor({
    state,
    selectedKey,
    onBeginEdit,
    onEndEdit,
    onCreate,
    onApplyHomeRowMod,
    onAssign,
    onUpdate,
    onUpdateAction,
    onDetach,
}: {
    state: ZmkEditorState;
    selectedKey: ZmkKey;
    onBeginEdit: () => void;
    onEndEdit: () => void;
    onCreate: () => void;
    onApplyHomeRowMod: (modifier: HomeRowModifier) => void;
    onAssign: (id: string) => void;
    onUpdate: (
        id: string,
        patch: Partial<ZmkHoldTap>,
        record?: boolean,
    ) => void;
    onUpdateAction: (
        id: string,
        action: "tap" | "hold",
        binding: string,
    ) => void;
    onDetach: (id: string) => void;
}) {
    const assignment = getHoldTapAssignment(state, selectedKey.binding);
    const behavior = assignment?.behavior;
    const seed = getTapHoldSeed(state, selectedKey.binding);
    const isBuiltIn = !behavior && /^&(mt|lt)\s+\S+\s+\S+$/.test(selectedKey.binding.trim());
    const tapLabel = seed ? getKeyLabel(selectedKey, state) : undefined;
    const holdLabel = seed
        ? deriveLabel(composeBehaviorBinding(seed.holdBehavior, seed.holdParameter))
        : undefined;
    const homeRowAvailable =
        seed?.tapBehavior === "&kp" &&
        seed.tapParameter !== "0" &&
        state.selectedKey >= 12 &&
        state.selectedKey <= 23;
    const leftHand = isLeftHalfKeyPosition(state.selectedKey);

    return (
        <details
            className="zmk-editor-mod-morph zmk-editor-hold-tap"
            data-active={Boolean(behavior || isBuiltIn)}
        >
            <summary className="zmk-editor-mod-morph__summary">
                <span className="zmk-editor-mod-morph__summary-copy">
                    <strong>Tap / hold</strong>
                    <small>
                        {behavior || isBuiltIn
                            ? `${tapLabel ?? "tap"} tap · ${holdLabel ?? "hold"} hold`
                            : "Optional dual-role behavior"}
                    </small>
                </span>
                <span className="zmk-editor-mod-morph__summary-value">
                    {behavior
                        ? `&${behavior.reference}`
                        : isBuiltIn
                            ? selectedKey.binding.trim().split(/\s+/)[0]
                            : "Optional"}
                </span>
            </summary>

            <div className="zmk-editor-mod-morph__content">
                {behavior && assignment ? (
                    <ManagedHoldTap
                        behavior={behavior}
                        holdParameter={assignment.holdParameter}
                        tapParameter={assignment.tapParameter}
                        onBeginEdit={onBeginEdit}
                        onEndEdit={onEndEdit}
                        onUpdate={onUpdate}
                        onUpdateAction={onUpdateAction}
                        onDetach={() => onDetach(behavior.id)}
                    />
                ) : (
                    <div className="zmk-editor-mod-morph__empty">
                        <p>
                            Give one key separate tap and hold actions. ZMK forwards one
                            parameter to each underlying behavior.
                        </p>

                        {homeRowAvailable && (
                            <div className="zmk-editor-hold-tap__preset">
                                <div className="zmk-editor-hold-tap__preset-head">
                                    <span>
                                        <strong>Home-row mod</strong>
                                        <small>
                                            {leftHand ? "Left" : "Right"} half · tap {tapLabel}
                                        </small>
                                    </span>
                                    <span>Preset</span>
                                </div>
                                <div className="zmk-editor-hold-tap__preset-grid">
                                    {HOME_ROW_MODIFIERS.map((modifier) => {
                                        const keycode = leftHand
                                            ? modifier.left
                                            : modifier.right;
                                        return (
                                            <button
                                                key={modifier.value}
                                                type="button"
                                                title={`Tap ${tapLabel}; hold ${keycode}`}
                                                onClick={() => onApplyHomeRowMod(modifier.value)}
                                            >
                                                <strong>{modifier.label}</strong>
                                                <span>{keycode}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <small>
                                    Creates/reuses a balanced positional left/right pair.
                                    All timing and trigger settings remain editable below.
                                </small>
                            </div>
                        )}

                        {state.holdTaps.length > 0 && (
                            <div className="zmk-editor-mod-morph__existing">
                                <span>Use existing behavior</span>
                                <div className="zmk-editor-mod-morph__existing-grid">
                                    {state.holdTaps.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            title={`&${item.reference}`}
                                            onClick={() => onAssign(item.id)}
                                        >
                                            <strong>&amp;{item.reference}</strong>
                                            <span>
                                                {item.holdBehavior} / {item.tapBehavior}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            type="button"
                            className="zmk-editor-button zmk-editor-button--ghost zmk-editor-mod-morph__create"
                            disabled={!seed}
                            onClick={onCreate}
                        >
                            {isBuiltIn
                                ? "Manage as custom hold-tap"
                                : "Create custom tap-hold"}
                        </button>
                        <small>
                            {seed
                                ? "Starts from this key's current tap action and exposes the full behavior definition."
                                : "The current binding has more than one parameter, so ZMK cannot forward it directly through a hold-tap."}
                        </small>
                    </div>
                )}
            </div>
        </details>
    );
}

function ManagedHoldTap({
    behavior,
    holdParameter,
    tapParameter,
    onBeginEdit,
    onEndEdit,
    onUpdate,
    onUpdateAction,
    onDetach,
}: {
    behavior: ZmkHoldTap;
    holdParameter: string;
    tapParameter: string;
    onBeginEdit: () => void;
    onEndEdit: () => void;
    onUpdate: (
        id: string,
        patch: Partial<ZmkHoldTap>,
        record?: boolean,
    ) => void;
    onUpdateAction: (
        id: string,
        action: "tap" | "hold",
        binding: string,
    ) => void;
    onDetach: () => void;
}) {
    const [referenceDraft, setReferenceDraft] = useState(behavior.reference);
    const [positionsDraft, setPositionsDraft] = useState(
        behavior.holdTriggerKeyPositions.join(", "),
    );

    const tapAction = useMemo(
        () => composeBehaviorBinding(behavior.tapBehavior, tapParameter),
        [behavior.tapBehavior, tapParameter],
    );
    const holdAction = useMemo(
        () => composeBehaviorBinding(behavior.holdBehavior, holdParameter),
        [behavior.holdBehavior, holdParameter],
    );

    useEffect(() => {
        setReferenceDraft(behavior.reference);
    }, [behavior.id, behavior.reference]);

    useEffect(() => {
        setPositionsDraft(behavior.holdTriggerKeyPositions.join(", "));
    }, [behavior.id, behavior.holdTriggerKeyPositions]);

    function commitPositions() {
        const positions = [...new Set(
            positionsDraft
                .split(/[\s,]+/)
                .filter(Boolean)
                .map(Number)
                .filter((value) => Number.isInteger(value) && value >= 0 && value < 42),
        )].sort((left, right) => left - right);
        setPositionsDraft(positions.join(", "));
        onUpdate(behavior.id, {
            holdTriggerKeyPositions: positions,
            ...(positions.length === 0 ? { holdTriggerOnRelease: false } : {}),
        }, true);
    }

    return (
        <div className="zmk-editor-mod-morph__editor">
            <div className="zmk-editor-hold-tap__managed-head">
                <div>
                    <span>
                        {behavior.preset ? "Home-row preset" : "Managed tap / hold"}
                    </span>
                    <strong>
                        {behavior.preset
                            ? behavior.preset === "home-row-left"
                                ? "Left hand"
                                : "Right hand"
                            : `&${behavior.reference}`}
                    </strong>
                </div>
                <button
                    type="button"
                    className="zmk-editor-text-button zmk-editor-hold-tap__clear"
                    title="Remove tap / hold and keep the tap action"
                    onClick={onDetach}
                >
                    Clear tap / hold
                </button>
            </div>

            <div className="zmk-editor-field zmk-editor-field--secondary">
                <label htmlFor={`holdTapReference-${behavior.id}`}>Reference</label>
                <div className="zmk-editor-mod-morph__reference-input">
                    <span>&amp;</span>
                    <input
                        id={`holdTapReference-${behavior.id}`}
                        className="font-mono"
                        type="text"
                        value={referenceDraft}
                        onChange={(event) => setReferenceDraft(event.target.value)}
                        onBlur={() => onUpdate(
                            behavior.id,
                            { reference: referenceDraft },
                            true,
                        )}
                    />
                </div>
            </div>

            <div className="zmk-editor-hold-tap__actions">
                <ActionEditor
                    id={`holdTapTap-${behavior.id}`}
                    title="Tap action"
                    value={tapAction}
                    preview={deriveLabel(tapAction)}
                    onCommit={(value) => onUpdateAction(behavior.id, "tap", value)}
                />
                <ActionEditor
                    id={`holdTapHold-${behavior.id}`}
                    title="Hold action"
                    value={holdAction}
                    preview={deriveLabel(holdAction)}
                    onCommit={(value) => onUpdateAction(behavior.id, "hold", value)}
                />
            </div>

            <div className="zmk-editor-hold-tap__timing-grid">
                <div className="zmk-editor-field zmk-editor-field--secondary">
                    <label htmlFor={`holdTapFlavor-${behavior.id}`}>Flavor</label>
                    <select
                        id={`holdTapFlavor-${behavior.id}`}
                        value={behavior.flavor}
                        onChange={(event) => onUpdate(behavior.id, {
                            flavor: event.target.value as ZmkHoldTapFlavor,
                        }, true)}
                    >
                        {HOLD_TAP_FLAVORS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
                <NumberField
                    id={`holdTapTerm-${behavior.id}`}
                    label="Tapping term"
                    value={behavior.tappingTermMs}
                    suffix="ms"
                    onFocus={onBeginEdit}
                    onBlur={onEndEdit}
                    onChange={(value) => onUpdate(behavior.id, { tappingTermMs: value })}
                />
                <OptionalNumberField
                    id={`holdTapQuick-${behavior.id}`}
                    label="Quick tap"
                    value={behavior.quickTapMs}
                    onFocus={onBeginEdit}
                    onBlur={onEndEdit}
                    onChange={(value) => onUpdate(behavior.id, { quickTapMs: value })}
                />
                <OptionalNumberField
                    id={`holdTapIdle-${behavior.id}`}
                    label="Prior idle"
                    value={behavior.requirePriorIdleMs}
                    onFocus={onBeginEdit}
                    onBlur={onEndEdit}
                    onChange={(value) => onUpdate(
                        behavior.id,
                        { requirePriorIdleMs: value },
                    )}
                />
            </div>

            <div className="zmk-editor-hold-tap__nested">
                <details className="zmk-editor-hold-tap__advanced">
                    <summary>
                        <span>Advanced resolution</span>
                        <span>{behavior.holdTriggerKeyPositions.length > 0 ? "positional" : "timing"}</span>
                    </summary>

                    <div className="zmk-editor-field zmk-editor-field--secondary">
                        <label htmlFor={`holdTapPositions-${behavior.id}`}>
                            Hold-trigger positions
                            <span>0–41</span>
                        </label>
                        <input
                            id={`holdTapPositions-${behavior.id}`}
                            className="font-mono"
                            type="text"
                            value={positionsDraft}
                            placeholder="e.g. 6, 7, 8, 9"
                            onChange={(event) => setPositionsDraft(event.target.value)}
                            onBlur={commitPositions}
                        />
                        <p>
                            Leave empty for a non-positional hold-tap. Listed positions are
                            allowed to trigger the hold action.
                        </p>
                    </div>

                    <div className="zmk-editor-hold-tap__switches">
                        <BooleanOption
                            label="Trigger on release"
                            description="Delay positional evaluation until the interrupting key is released."
                            checked={behavior.holdTriggerOnRelease}
                            disabled={behavior.holdTriggerKeyPositions.length === 0}
                            onChange={(checked) => onUpdate(
                                behavior.id,
                                { holdTriggerOnRelease: checked },
                                true,
                            )}
                        />
                        <BooleanOption
                            label="Retro tap"
                            description="If held alone, resolve to the tap action when released."
                            checked={behavior.retroTap}
                            onChange={(checked) => onUpdate(
                                behavior.id,
                                { retroTap: checked },
                                true,
                            )}
                        />
                        <BooleanOption
                            label="Hold while undecided"
                            description="Press the hold action immediately while resolution is pending."
                            checked={behavior.holdWhileUndecided}
                            onChange={(checked) => onUpdate(
                                behavior.id,
                                {
                                    holdWhileUndecided: checked,
                                    ...(checked ? {} : { holdWhileUndecidedLinger: false }),
                                },
                                true,
                            )}
                        />
                        <BooleanOption
                            label="Linger"
                            description="Keep the undecided hold active until after the tap is released."
                            checked={behavior.holdWhileUndecidedLinger}
                            disabled={!behavior.holdWhileUndecided}
                            onChange={(checked) => onUpdate(
                                behavior.id,
                                { holdWhileUndecidedLinger: checked },
                                true,
                            )}
                        />
                    </div>
                </details>

                <p className="zmk-editor-hold-tap__export-note">
                    Exported as <code>&amp;{behavior.reference} {holdParameter} {tapParameter}</code>
                </p>
            </div>
        </div>
    );
}

function ActionEditor({
    id,
    title,
    value,
    preview,
    onCommit,
}: {
    id: string;
    title: string;
    value: string;
    preview: string;
    onCommit: (value: string) => void;
}) {
    const [draft, setDraft] = useState(value);

    useEffect(() => {
        setDraft(value);
    }, [value]);

    function commit() {
        const normalized = normalizeActionBinding(draft);
        if (!normalized) {
            setDraft(value);
            return;
        }

        setDraft(normalized);
        if (normalized !== value) onCommit(normalized);
    }

    return (
        <div className="zmk-editor-hold-tap__action">
            <label htmlFor={id}>
                <span>{title}</span>
                <span>{preview}</span>
            </label>
            <input
                id={id}
                className="font-mono"
                type="text"
                value={draft}
                spellCheck={false}
                onChange={(event) => setDraft(event.target.value)}
                onBlur={commit}
                onKeyDown={(event) => {
                    if (event.key === "Enter") event.currentTarget.blur();
                }}
            />
        </div>
    );
}

function NumberField({
    id,
    label,
    value,
    suffix,
    onFocus,
    onBlur,
    onChange,
}: {
    id: string;
    label: string;
    value: number;
    suffix?: string;
    onFocus: () => void;
    onBlur: () => void;
    onChange: (value: number) => void;
}) {
    return (
        <div className="zmk-editor-field zmk-editor-field--secondary">
            <label htmlFor={id}>{label}{suffix && <span>{suffix}</span>}</label>
            <input
                id={id}
                type="number"
                min={0}
                max={5000}
                value={value}
                onFocus={onFocus}
                onBlur={onBlur}
                onChange={(event) => onChange(clampTiming(event.target.value, 1))}
            />
        </div>
    );
}

function OptionalNumberField({
    id,
    label,
    value,
    onFocus,
    onBlur,
    onChange,
}: {
    id: string;
    label: string;
    value?: number;
    onFocus: () => void;
    onBlur: () => void;
    onChange: (value: number | undefined) => void;
}) {
    return (
        <div className="zmk-editor-field zmk-editor-field--secondary">
            <label htmlFor={id}>{label}<span>ms · optional</span></label>
            <input
                id={id}
                type="number"
                min={0}
                max={5000}
                value={value ?? ""}
                placeholder="off"
                onFocus={onFocus}
                onBlur={onBlur}
                onChange={(event) => onChange(
                    event.target.value === ""
                        ? undefined
                        : clampTiming(event.target.value, 0),
                )}
            />
        </div>
    );
}

function BooleanOption({
    label,
    description,
    checked,
    disabled = false,
    onChange,
}: {
    label: string;
    description: string;
    checked: boolean;
    disabled?: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <label className="zmk-editor-hold-tap__switch" data-disabled={disabled}>
            <span>
                <strong>{label}</strong>
                <small>{description}</small>
            </span>
            <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={(event) => onChange(event.target.checked)}
            />
        </label>
    );
}

function normalizeActionBinding(value: string): string | undefined {
    const match = value.trim().match(/^(&[A-Za-z0-9_]+)(?:\s+(.+))?$/);
    if (!match) return undefined;

    const behavior = match[1];
    const parameter = match[2]?.trim() || "0";
    return composeBehaviorBinding(behavior, parameter);
}

function clampTiming(value: string, minimum: number): number {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return minimum;
    return Math.min(Math.max(Math.trunc(numeric), minimum), 5000);
}

export type { HomeRowModifier };

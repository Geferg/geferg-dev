import {
    useCallback,
    useEffect,
    useRef,
    type CSSProperties,
} from "react";

import "./zmkGraphic.css";

import type {
    KeyElements,
    KeySpec,
    RenderedKeyState,
    SequenceKey,
    TypingEvent,
    ZmkGraphicProps,
} from "./types";

const KEY_WIDTH = 34;
const KEY_HEIGHT = 22;

const RELEASE_DURATION_MS = 90;

/*
 * delayMs is relative to interaction activation and includes the
 * 60 ms visual lead-in.
 */
const TYPING_SEQUENCE: readonly TypingEvent[] = [
    { keyId: "g", delayMs: 60, holdMs: 107 },
    { keyId: "e", delayMs: 170, holdMs: 123 },
    { keyId: "f", delayMs: 263, holdMs: 99 },
    { keyId: "e", delayMs: 386, holdMs: 129 },
    { keyId: "r", delayMs: 493, holdMs: 55 },
    { keyId: "g", delayMs: 657, holdMs: 58 },
];

const SEQUENCE_KEYS: readonly SequenceKey[] = [
    "g",
    "e",
    "f",
    "r",
];

const keys: readonly KeySpec[] = [
    // Top row
    {
        id: "tab",
        label: "TAB",
        x: 0,
        y: 14,
        width: 38,
        accent: "blue",
    },
    {
        id: "q",
        label: "Q",
        x: 42,
        y: 12,
    },
    {
        id: "w",
        label: "W",
        x: 80,
        y: 7,
    },
    {
        id: "e",
        label: "E",
        x: 118,
        y: 0,
    },
    {
        id: "r",
        label: "R",
        x: 156,
        y: 8,
    },
    {
        id: "t",
        label: "T",
        x: 194,
        y: 16,
    },

    // Home row
    {
        id: "ctrl",
        label: "CTRL",
        x: 0,
        y: 42,
        width: 38,
        accent: "red",
    },
    {
        id: "a",
        label: "A",
        x: 42,
        y: 40,
    },
    {
        id: "s",
        label: "S",
        x: 80,
        y: 35,
    },
    {
        id: "d",
        label: "D",
        x: 118,
        y: 28,
    },
    {
        id: "f",
        label: "F",
        x: 156,
        y: 36,
    },
    {
        id: "g",
        label: "G",
        x: 194,
        y: 44,
    },

    // Bottom row
    {
        id: "shift",
        label: "SHFT",
        x: 0,
        y: 70,
        width: 38,
        accent: "green",
    },
    {
        id: "z",
        label: "Z",
        x: 42,
        y: 68,
    },
    {
        id: "x",
        label: "X",
        x: 80,
        y: 63,
    },
    {
        id: "c",
        label: "C",
        x: 118,
        y: 56,
    },
    {
        id: "v",
        label: "V",
        x: 156,
        y: 64,
    },
    {
        id: "b",
        label: "B",
        x: 194,
        y: 72,
    },
];

export default function ZmkGraphic({
    active,
}: ZmkGraphicProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const wasActiveRef = useRef(false);

    const typingAnimationsRef = useRef<Animation[]>([]);
    const releaseAnimationsRef = useRef<Animation[]>([]);

    const cancelAnimations = useCallback(
        (animations: Animation[]) => {
            for (const animation of animations) {
                animation.cancel();
            }

            animations.length = 0;
        },
        [],
    );

    const getKeyElements = useCallback(
        (keyId: SequenceKey): KeyElements | null => {
            const root = rootRef.current;

            if (!root) {
                return null;
            }

            const key = root.querySelector<HTMLElement>(
                `[data-key-id="${keyId}"]`,
            );

            const cap =
                key?.querySelector<HTMLElement>(
                    ".zmk-key__cap",
                ) ?? null;

            const pressSurface =
                key?.querySelector<HTMLElement>(
                    ".zmk-key__press-surface",
                ) ?? null;

            const label =
                key?.querySelector<HTMLElement>(
                    ".zmk-key__label",
                ) ?? null;

            if (!cap || !pressSurface || !label) {
                return null;
            }

            return {
                cap,
                pressSurface,
                label,
            };
        },
        [],
    );

    const playTypingSequence = useCallback(() => {
        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;

        if (!rootRef.current || prefersReducedMotion) {
            return;
        }

        cancelAnimations(releaseAnimationsRef.current);
        cancelAnimations(typingAnimationsRef.current);

        const animations: Animation[] = [];

        for (const typingEvent of TYPING_SEQUENCE) {
            const elements = getKeyElements(
                typingEvent.keyId,
            );

            if (!elements) {
                continue;
            }

            const { cap, pressSurface, label } = elements;

            const attackMs = Math.min(
                18,
                typingEvent.holdMs * 0.25,
            );

            const releaseMs = Math.min(
                22,
                typingEvent.holdMs * 0.3,
            );

            const pressedAt =
                attackMs / typingEvent.holdMs;

            const releasedAt =
                1 - releaseMs / typingEvent.holdMs;

            const timing: KeyframeAnimationOptions = {
                delay: typingEvent.delayMs,
                duration: typingEvent.holdMs,
                easing: "linear",
                fill: "none",
            };

            animations.push(
                cap.animate(
                    [
                        {
                            inset: "0px",
                            offset: 0,
                        },
                        {
                            inset: "1px 1px 0px 1px",
                            offset: pressedAt,
                            easing:
                                "cubic-bezier(0.2, 0.8, 0.2, 1)",
                        },
                        {
                            inset: "1px 1px 0px 1px",
                            offset: releasedAt,
                        },
                        {
                            inset: "0px",
                            offset: 1,
                            easing:
                                "cubic-bezier(0.4, 0, 0.2, 1)",
                        },
                    ],
                    timing,
                ),

                pressSurface.animate(
                    [
                        {
                            opacity: 0,
                            offset: 0,
                        },
                        {
                            opacity: 1,
                            offset: pressedAt,
                        },
                        {
                            opacity: 1,
                            offset: releasedAt,
                        },
                        {
                            opacity: 0,
                            offset: 1,
                        },
                    ],
                    timing,
                ),

                label.animate(
                    [
                        {
                            transform: "translateY(0)",
                            filter: "brightness(1)",
                            offset: 0,
                        },
                        {
                            transform: "translateY(1px)",
                            filter: "brightness(1.65)",
                            offset: pressedAt,
                            easing:
                                "cubic-bezier(0.2, 0.8, 0.2, 1)",
                        },
                        {
                            transform: "translateY(1px)",
                            filter: "brightness(1.65)",
                            offset: releasedAt,
                        },
                        {
                            transform: "translateY(0)",
                            filter: "brightness(1)",
                            offset: 1,
                            easing:
                                "cubic-bezier(0.4, 0, 0.2, 1)",
                        },
                    ],
                    timing,
                ),
            );
        }

        typingAnimationsRef.current = animations;
    }, [
        cancelAnimations,
        getKeyElements,
    ]);

    const captureRenderedStates =
        useCallback((): RenderedKeyState[] => {
            return SEQUENCE_KEYS.flatMap((keyId) => {
                const elements = getKeyElements(keyId);

                if (!elements) {
                    return [];
                }

                const capStyle = getComputedStyle(
                    elements.cap,
                );

                const surfaceStyle = getComputedStyle(
                    elements.pressSurface,
                );

                const labelStyle = getComputedStyle(
                    elements.label,
                );

                return [
                    {
                        elements,
                        cap: {
                            top: capStyle.top,
                            right: capStyle.right,
                            bottom: capStyle.bottom,
                            left: capStyle.left,
                        },
                        surfaceOpacity: Number.parseFloat(
                            surfaceStyle.opacity,
                        ),
                        labelTransform:
                            labelStyle.transform,
                        labelFilter: labelStyle.filter,
                    },
                ];
            });
        }, [getKeyElements]);

    const releaseRenderedKey = useCallback(
        (
            state: RenderedKeyState,
        ): Animation[] => {
            const {
                elements,
                cap,
                surfaceOpacity,
                labelTransform,
                labelFilter,
            } = state;

            const capIsPressed =
                cap.top !== "0px" ||
                cap.right !== "0px" ||
                cap.bottom !== "0px" ||
                cap.left !== "0px";

            const surfaceIsVisible =
                surfaceOpacity > 0.001;

            const labelIsPressed =
                labelTransform !== "none" ||
                labelFilter !== "none";

            if (
                !capIsPressed &&
                !surfaceIsVisible &&
                !labelIsPressed
            ) {
                return [];
            }

            const timing: KeyframeAnimationOptions = {
                duration: RELEASE_DURATION_MS,
                easing:
                    "cubic-bezier(0.4, 0, 0.2, 1)",
                fill: "none",
            };

            return [
                elements.cap.animate(
                    [
                        {
                            top: cap.top,
                            right: cap.right,
                            bottom: cap.bottom,
                            left: cap.left,
                        },
                        {
                            top: "0px",
                            right: "0px",
                            bottom: "0px",
                            left: "0px",
                        },
                    ],
                    timing,
                ),

                elements.pressSurface.animate(
                    [
                        {
                            opacity: surfaceOpacity,
                        },
                        {
                            opacity: 0,
                        },
                    ],
                    timing,
                ),

                elements.label.animate(
                    [
                        {
                            transform:
                                labelTransform === "none"
                                    ? "translateY(0)"
                                    : labelTransform,
                            filter:
                                labelFilter === "none"
                                    ? "brightness(1)"
                                    : labelFilter,
                        },
                        {
                            transform: "translateY(0)",
                            filter: "brightness(1)",
                        },
                    ],
                    timing,
                ),
            ];
        },
        [],
    );

    const stopTypingSequence = useCallback(() => {
        /*
         * Capture before cancellation because cancelling removes
         * the animation's currently rendered values.
         */
        const renderedStates =
            captureRenderedStates();

        /*
         * This cancels both active presses and future delayed
         * presses that have not started.
         */
        cancelAnimations(typingAnimationsRef.current);
        cancelAnimations(releaseAnimationsRef.current);

        releaseAnimationsRef.current =
            renderedStates.flatMap(releaseRenderedKey);
    }, [
        cancelAnimations,
        captureRenderedStates,
        releaseRenderedKey,
    ]);

    useEffect(() => {
        const wasActive = wasActiveRef.current;

        wasActiveRef.current = active;

        if (active && !wasActive) {
            playTypingSequence();
            return;
        }

        if (!active && wasActive) {
            stopTypingSequence();
        }
    }, [
        active,
        playTypingSequence,
        stopTypingSequence,
    ]);

    useEffect(() => {
        return () => {
            cancelAnimations(
                typingAnimationsRef.current,
            );

            cancelAnimations(
                releaseAnimationsRef.current,
            );
        };
    }, [cancelAnimations]);

    return (
        <div
            ref={rootRef}
            data-active={active ? "true" : "false"}
            className="zmk-graphic relative mb-5 h-[96px] shrink-0 overflow-visible"
            aria-hidden="true"
        >
            <div className="relative h-[94px] w-[228px]">
                {keys.map((key) => (
                    <KeyboardKey
                        key={key.id}
                        {...key}
                    />
                ))}
            </div>
        </div>
    );
}

function KeyboardKey({
    id,
    label,
    x,
    y,
    width = KEY_WIDTH,
    accent = "neutral",
}: KeySpec) {
    const isLongLabel = label.length > 2;

    return (
        <span
            data-key-id={id}
            data-key-accent={accent}
            className="zmk-key absolute"
            style={
                {
                    left: x,
                    top: y,
                    width,
                    height: KEY_HEIGHT,
                } as CSSProperties
            }
        >
            <span className="zmk-key__cap">
                <span className="zmk-key__press-surface" />
            </span>

            <span
                className={[
                    "zmk-key__label",
                    "font-mono font-bold leading-none",
                    isLongLabel
                        ? "text-[7px] tracking-[0.01em]"
                        : "text-[8px] tracking-[0.015em]",
                ].join(" ")}
            >
                {label}
            </span>
        </span>
    );
}

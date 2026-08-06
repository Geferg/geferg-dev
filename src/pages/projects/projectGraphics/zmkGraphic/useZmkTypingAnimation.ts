import {
    useEffect,
    useRef,
    type RefObject,
} from "react";

import {
    RELEASE_DURATION_MS,
    SEQUENCE_KEYS,
    TYPING_SEQUENCE,
} from "./zmkGraphic.data";

import type {
    KeyElements,
    RenderedKeyState,
    SequenceKey,
    TypingEvent,
} from "./zmkGraphic.types";

const PRESS_ATTACK_LIMIT_MS = 18;
const PRESS_RELEASE_LIMIT_MS = 22;

const PRESS_ATTACK_FRACTION = 0.25;
const PRESS_RELEASE_FRACTION = 0.3;

const PRESS_INSET = "1px 1px 0px 1px";
const REST_INSET = "0px";

const PRESS_EASING =
    "cubic-bezier(0.2, 0.8, 0.2, 1)";

const RELEASE_EASING =
    "cubic-bezier(0.4, 0, 0.2, 1)";

export function useZmkTypingAnimation(
    rootRef: RefObject<HTMLDivElement | null>,
    active: boolean,
): void {
    const wasActiveRef = useRef(false);

    const typingAnimationsRef =
        useRef<Animation[]>([]);

    const releaseAnimationsRef =
        useRef<Animation[]>([]);

    useEffect(() => {
        const root = rootRef.current;
        const wasActive = wasActiveRef.current;

        wasActiveRef.current = active;

        if (!root || active === wasActive) {
            return;
        }

        if (active) {
            startTypingSequence(
                root,
                typingAnimationsRef.current,
                releaseAnimationsRef.current,
            );

            return;
        }

        stopTypingSequence(
            root,
            typingAnimationsRef.current,
            releaseAnimationsRef.current,
        );
    }, [active, rootRef]);

    useEffect(() => {
        return () => {
            cancelAnimations(
                typingAnimationsRef.current,
            );

            cancelAnimations(
                releaseAnimationsRef.current,
            );
        };
    }, []);
}

function startTypingSequence(
    root: HTMLElement,
    typingAnimations: Animation[],
    releaseAnimations: Animation[],
): void {
    cancelAnimations(releaseAnimations);
    cancelAnimations(typingAnimations);

    if (prefersReducedMotion()) {
        return;
    }

    for (const event of TYPING_SEQUENCE) {
        const elements = getKeyElements(
            root,
            event.keyId,
        );

        if (!elements) {
            continue;
        }

        typingAnimations.push(
            ...createPressAnimations(
                elements,
                event,
            ),
        );
    }
}

function stopTypingSequence(
    root: HTMLElement,
    typingAnimations: Animation[],
    releaseAnimations: Animation[],
): void {
    /*
     * Animated values disappear when their source animations are
     * cancelled, so capture the rendered states first.
     */
    const renderedStates = SEQUENCE_KEYS
        .map((keyId) =>
            captureRenderedState(root, keyId),
        )
        .filter(
            (
                state,
            ): state is RenderedKeyState =>
                state !== null,
        );

    /*
     * This removes both active presses and presses whose delays
     * have not yet elapsed.
     */
    cancelAnimations(typingAnimations);
    cancelAnimations(releaseAnimations);

    for (const state of renderedStates) {
        if (!isVisiblyPressed(state)) {
            continue;
        }

        releaseAnimations.push(
            ...createReleaseAnimations(state),
        );
    }
}

function createPressAnimations(
    elements: KeyElements,
    event: TypingEvent,
): Animation[] {
    const attackMs = Math.min(
        PRESS_ATTACK_LIMIT_MS,
        event.holdMs * PRESS_ATTACK_FRACTION,
    );

    const releaseMs = Math.min(
        PRESS_RELEASE_LIMIT_MS,
        event.holdMs * PRESS_RELEASE_FRACTION,
    );

    const pressedAt = attackMs / event.holdMs;

    const releasedAt =
        1 - releaseMs / event.holdMs;

    const timing: KeyframeAnimationOptions = {
        delay: event.delayMs,
        duration: event.holdMs,
        easing: "linear",
        fill: "none",
    };

    return [
        elements.cap.animate(
            createCapKeyframes(
                pressedAt,
                releasedAt,
            ),
            timing,
        ),

        elements.pressSurface.animate(
            createPressSurfaceKeyframes(
                pressedAt,
                releasedAt,
            ),
            timing,
        ),

        elements.label.animate(
            createLabelKeyframes(
                pressedAt,
                releasedAt,
            ),
            timing,
        ),
    ];
}

function createCapKeyframes(
    pressedAt: number,
    releasedAt: number,
): Keyframe[] {
    return [
        {
            inset: REST_INSET,
            offset: 0,
        },
        {
            inset: PRESS_INSET,
            offset: pressedAt,
            easing: PRESS_EASING,
        },
        {
            inset: PRESS_INSET,
            offset: releasedAt,
        },
        {
            inset: REST_INSET,
            offset: 1,
            easing: RELEASE_EASING,
        },
    ];
}

function createPressSurfaceKeyframes(
    pressedAt: number,
    releasedAt: number,
): Keyframe[] {
    return [
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
    ];
}

function createLabelKeyframes(
    pressedAt: number,
    releasedAt: number,
): Keyframe[] {
    return [
        {
            transform: "translateY(0)",
            filter: "brightness(1)",
            offset: 0,
        },
        {
            transform: "translateY(1px)",
            filter: "brightness(1.65)",
            offset: pressedAt,
            easing: PRESS_EASING,
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
            easing: RELEASE_EASING,
        },
    ];
}

function captureRenderedState(
    root: HTMLElement,
    keyId: SequenceKey,
): RenderedKeyState | null {
    const elements = getKeyElements(root, keyId);

    if (!elements) {
        return null;
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

    return {
        elements,

        cap: {
            top: capStyle.top,
            right: capStyle.right,
            bottom: capStyle.bottom,
            left: capStyle.left,
        },

        surfaceOpacity: parseOpacity(
            surfaceStyle.opacity,
        ),

        labelTransform: labelStyle.transform,
        labelFilter: labelStyle.filter,
    };
}

function isVisiblyPressed(
    state: RenderedKeyState,
): boolean {
    return (
        state.cap.top !== "0px" ||
        state.cap.right !== "0px" ||
        state.cap.bottom !== "0px" ||
        state.cap.left !== "0px" ||
        state.surfaceOpacity > 0.001
    );
}

function createReleaseAnimations(
    state: RenderedKeyState,
): Animation[] {
    const timing: KeyframeAnimationOptions = {
        duration: RELEASE_DURATION_MS,
        easing: RELEASE_EASING,
        fill: "none",
    };

    return [
        state.elements.cap.animate(
            [
                {
                    top: state.cap.top,
                    right: state.cap.right,
                    bottom: state.cap.bottom,
                    left: state.cap.left,
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

        state.elements.pressSurface.animate(
            [
                {
                    opacity:
                        state.surfaceOpacity,
                },
                {
                    opacity: 0,
                },
            ],
            timing,
        ),

        state.elements.label.animate(
            [
                {
                    transform:
                        normalizeTransform(
                            state.labelTransform,
                        ),

                    filter:
                        normalizeFilter(
                            state.labelFilter,
                        ),
                },
                {
                    transform: "translateY(0)",
                    filter: "brightness(1)",
                },
            ],
            timing,
        ),
    ];
}

function getKeyElements(
    root: HTMLElement,
    keyId: SequenceKey,
): KeyElements | null {
    const key = root.querySelector<HTMLElement>(
        `[data-key-id="${keyId}"]`,
    );

    if (!key) {
        return null;
    }

    const cap = key.querySelector<HTMLElement>(
        ".zmk-key__cap",
    );

    const pressSurface =
        key.querySelector<HTMLElement>(
            ".zmk-key__press-surface",
        );

    const label = key.querySelector<HTMLElement>(
        ".zmk-key__label",
    );

    if (!cap || !pressSurface || !label) {
        return null;
    }

    return {
        cap,
        pressSurface,
        label,
    };
}

function cancelAnimations(
    animations: Animation[],
): void {
    for (const animation of animations) {
        animation.cancel();
    }

    animations.length = 0;
}

function prefersReducedMotion(): boolean {
    return window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;
}

function parseOpacity(value: string): number {
    const opacity = Number.parseFloat(value);

    return Number.isFinite(opacity)
        ? opacity
        : 0;
}

function normalizeTransform(
    transform: string,
): string {
    return transform === "none"
        ? "translateY(0)"
        : transform;
}

function normalizeFilter(
    filter: string,
): string {
    return filter === "none"
        ? "brightness(1)"
        : filter;
}

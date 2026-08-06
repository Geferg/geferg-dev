import {
    useRef,
    type CSSProperties,
} from "react";

import {
    GRAPHIC_HEIGHT,
    KEYBOARD_HEIGHT,
    KEYBOARD_WIDTH,
    KEYS,
    KEY_HEIGHT,
    KEY_WIDTH,
} from "./zmkGraphic.data";

import type {
    KeySpec,
    ZmkGraphicProps,
} from "./zmkGraphic.types";

import { useZmkTypingAnimation } from "./useZmkTypingAnimation";

import "./zmkGraphic.css";

export default function ZmkGraphic({
    active,
}: ZmkGraphicProps) {
    const rootRef = useRef<HTMLDivElement>(null);

    useZmkTypingAnimation(rootRef, active);

    return (
        <div
            ref={rootRef}
            data-active={active}
            className="zmk-graphic relative mb-5 shrink-0 overflow-visible"
            style={{
                height: GRAPHIC_HEIGHT,
            }}
            aria-hidden="true"
        >
            <div
                className="relative"
                style={{
                    width: KEYBOARD_WIDTH,
                    height: KEYBOARD_HEIGHT,
                }}
            >
                {KEYS.map((key) => (
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
    const hasCompactLabel =
        label.length > 2;

    const style: CSSProperties = {
        left: x,
        top: y,
        width,
        height: KEY_HEIGHT,
    };

    return (
        <span
            data-key-id={id}
            data-key-accent={accent}
            className="zmk-key absolute"
            style={style}
        >
            <span className="zmk-key__cap">
                <span className="zmk-key__press-surface" />
            </span>

            <span
                className={[
                    "zmk-key__label",
                    "font-mono font-bold leading-none",
                    hasCompactLabel
                        ? "text-[7px] tracking-[0.01em]"
                        : "text-[8px] tracking-[0.015em]",
                ].join(" ")}
            >
                {label}
            </span>
        </span>
    );
}

import type {
    KeySpec,
    SequenceKey,
    TypingEvent,
} from "./zmkGraphic.types";

export const KEY_WIDTH = 34;
export const KEY_HEIGHT = 22;

export const KEYBOARD_WIDTH = 228;
export const KEYBOARD_HEIGHT = 94;
export const GRAPHIC_HEIGHT = 96;

export const RELEASE_DURATION_MS = 90;

/*
 * Timings include a 60 ms lead-in.
 *
 * Measured input:
 *
 * G1 down:   0 ms, hold 107 ms
 * E1 down: 110 ms, hold 123 ms
 * F down:  203 ms, hold  99 ms
 * E2 down: 326 ms, hold 129 ms
 * R down:  433 ms, hold  55 ms
 * G2 down: 597 ms, hold  58 ms
 */
export const TYPING_SEQUENCE = [
    {
        keyId: "g",
        delayMs: 60,
        holdMs: 107,
    },
    {
        keyId: "e",
        delayMs: 170,
        holdMs: 123,
    },
    {
        keyId: "f",
        delayMs: 263,
        holdMs: 99,
    },
    {
        keyId: "e",
        delayMs: 386,
        holdMs: 129,
    },
    {
        keyId: "r",
        delayMs: 493,
        holdMs: 55,
    },
    {
        keyId: "g",
        delayMs: 657,
        holdMs: 58,
    },
] satisfies readonly TypingEvent[];

export const SEQUENCE_KEYS = [
    "g",
    "e",
    "f",
    "r",
] satisfies readonly SequenceKey[];

export const KEYS = [
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
] satisfies readonly KeySpec[];

export type KeyAccent = "neutral" | "blue" | "red" | "green";

export type SequenceKey = "g" | "e" | "f" | "r";

export type KeySpec = {
    id: string;
    label: string;
    x: number;
    y: number;
    width?: number;
    accent?: KeyAccent;
};

export type TypingEvent = {
    keyId: SequenceKey;
    delayMs: number;
    holdMs: number;
};

export type ZmkGraphicProps = {
    active: boolean;
};

export type KeyElements = {
    cap: HTMLElement;
    pressSurface: HTMLElement;
    label: HTMLElement;
};

export type RenderedKeyState = {
    elements: KeyElements;
    cap: {
        top: string;
        right: string;
        bottom: string;
        left: string;
    };
    surfaceOpacity: number;
    labelTransform: string;
    labelFilter: string;
};

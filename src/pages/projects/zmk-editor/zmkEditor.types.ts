export type KeyCategory =
    | "default"
    | "modifier"
    | "layer"
    | "system"
    | "rgb"
    | "nordic"
    | "transparent"
    | "none";

export type ZmkKey = {
    binding: string;
    label: string;
    category: KeyCategory;
};

export type ZmkLayer = {
    name: string;
    constant: string;
    color: string;
    keys: ZmkKey[];
};

export type ZmkEditorState = {
    currentLayer: number;
    selectedKey: number;
    showBindings: boolean;
    triLayer: boolean;
    ledCount: number;
    layers: ZmkLayer[];
};

export type QuickBinding = {
    name: string;
    binding: string;
    label: string;
    category: KeyCategory;
};

export type QuickBindingGroup = {
    name: string;
    bindings: QuickBinding[];
};

export type KeyPosition = {
    x: number;
    y: number;
    width: number;
    height: number;
};

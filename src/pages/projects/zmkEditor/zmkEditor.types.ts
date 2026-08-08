export type KeyCategory =
    | "default"
    | "modifier"
    | "layer"
    | "system"
    | "rgb"
    | "nordic"
    | "transparent"
    | "none";

export type ZmkModifier =
    | "MOD_LSFT"
    | "MOD_RSFT"
    | "MOD_LCTL"
    | "MOD_RCTL"
    | "MOD_LALT"
    | "MOD_RALT"
    | "MOD_LGUI"
    | "MOD_RGUI";

/**
 * Binding is the source of truth. Presentation fields are explicit overrides
 * and are omitted when automatic derivation is sufficient.
 */
export type ZmkKey = {
    binding: string;
    labelOverride?: string;
    categoryOverride?: KeyCategory;
};

/**
 * Modes are an editor-side grouping of layers. ZMK still receives one global
 * flattened layer list at export time.
 */
export type ZmkMode = {
    id: string;
    name: string;
};

export type ZmkLayer = {
    name: string;
    constant: string;
    color: string;
    modeId: string;
    keys: ZmkKey[];
};

/**
 * A managed zero-parameter ZMK mod-morph behavior. `id` is editor-only and
 * remains stable if the devicetree reference is renamed.
 */
export type ZmkModMorph = {
    id: string;
    reference: string;
    normalBinding: string;
    morphedBinding: string;
    mods: ZmkModifier[];
    keepMods: ZmkModifier[];
};

export type ZmkEditorState = {
    currentMode: string;
    currentLayer: number;
    selectedKey: number;
    showBindings: boolean;
    triLayer: boolean;
    ledCount: number;
    modMorphs: ZmkModMorph[];
    modes: ZmkMode[];
    layers: ZmkLayer[];
};

export type QuickBinding = {
    name: string;
    binding: string;
    label?: string;
    category?: KeyCategory;
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

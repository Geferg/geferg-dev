import type {
    KeyCategory,
    KeyPosition,
    QuickBindingGroup,
    ZmkEditorState,
    ZmkHoldTap,
    ZmkHoldTapFlavor,
    ZmkKey,
    ZmkLayer,
    ZmkMode,
    ZmkModifier,
    ZmkModMorph,
} from "../zmkEditor.types";

export const KEY_COUNT = 42;

export const LEFT_HALF_KEY_POSITIONS = [
    0, 1, 2, 3, 4, 5,
    12, 13, 14, 15, 16, 17,
    24, 25, 26, 27, 28, 29,
    36, 37, 38,
] as const;

export const RIGHT_HALF_KEY_POSITIONS = [
    6, 7, 8, 9, 10, 11,
    18, 19, 20, 21, 22, 23,
    30, 31, 32, 33, 34, 35,
    39, 40, 41,
] as const;

export const HOLD_TAP_FLAVORS: ReadonlyArray<{
    value: ZmkHoldTapFlavor;
    label: string;
}> = [
    { value: "hold-preferred", label: "Hold preferred" },
    { value: "balanced", label: "Balanced" },
    { value: "tap-preferred", label: "Tap preferred" },
    { value: "tap-unless-interrupted", label: "Tap unless interrupted" },
];

const VALID_HOLD_TAP_FLAVORS = new Set<ZmkHoldTapFlavor>(
    HOLD_TAP_FLAVORS.map((option) => option.value),
);

export const ZMK_MODIFIER_OPTIONS: ReadonlyArray<{
    value: ZmkModifier;
    label: string;
}> = [
    { value: "MOD_LSFT", label: "L Shift" },
    { value: "MOD_RSFT", label: "R Shift" },
    { value: "MOD_LCTL", label: "L Ctrl" },
    { value: "MOD_RCTL", label: "R Ctrl" },
    { value: "MOD_LALT", label: "L Alt" },
    { value: "MOD_RALT", label: "R Alt" },
    { value: "MOD_LGUI", label: "L GUI" },
    { value: "MOD_RGUI", label: "R GUI" },
];

const VALID_MODIFIERS = new Set<ZmkModifier>(
    ZMK_MODIFIER_OPTIONS.map((option) => option.value),
);

export const CATEGORY_LABELS: Record<KeyCategory, string> = {
    default: "Default",
    modifier: "Modifier",
    layer: "Layer",
    system: "System / Bluetooth",
    rgb: "RGB",
    nordic: "Nordic",
    transparent: "Transparent",
    none: "Disabled",
};

export const COVERAGE_CHARACTERS = [
    "æ", "ø", "å",
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
    ".", ",", ":", ";", "!", "?", '"', "'", "`",
    "+", "-", "*", "/", "%", "=", "_", "&", "|", "^", "~",
    "(", ")", "[", "]", "{", "}", "<", ">", "@", "#", "$", "\\",
] as const;

export const QUICK_BINDING_GROUPS: QuickBindingGroup[] = [
    {
        name: "Common",
        bindings: [
            { name: "Transparent", binding: "&trans" },
            {
                name: "Alternate pass-through",
                binding: "&trans",
                label: "ALTR",
                category: "layer",
            },
            { name: "Disabled", binding: "&none" },
        ],
    },
    {
        name: "Layers",
        bindings: [
            { name: "Lower hold", binding: "&mo LOWER" },
            { name: "Raise hold", binding: "&mo RAISE" },
            {
                name: "Adjust hold",
                binding: "&mo ADJUST",
                label: "ADJ",
            },
        ],
    },
    {
        name: "Connectivity",
        bindings: [
            { name: "Clear Bluetooth", binding: "&bt BT_CLR" },
            { name: "Bluetooth profile 1", binding: "&bt BT_SEL 0" },
            { name: "BLE output", binding: "&out OUT_BLE" },
            { name: "USB output", binding: "&out OUT_USB" },
        ],
    },
    {
        name: "RGB",
        bindings: [
            { name: "Toggle", binding: "&rgb_ug RGB_TOG" },
            { name: "Brighter", binding: "&rgb_ug RGB_BRI" },
            { name: "Dimmer", binding: "&rgb_ug RGB_BRD" },
            { name: "Next effect", binding: "&rgb_ug RGB_EFF" },
        ],
    },
];

const LABEL_MAP: Record<string, string> = {
    TAB: "TAB", BSPC: "BCK", ESC: "ESC", RET: "ENT", ENTER: "ENT",
    SPACE: "SPC", LCTRL: "CTRL", RCTRL: "RCTRL", LSHFT: "SHFT",
    RSHFT: "RSHFT", LALT: "ALT", RALT: "ALTGR", LGUI: "GUI", RGUI: "RGUI",
    COMMA: ",", DOT: ".", COLON: ":", FSLH: "/", BSLH: "\\", SEMI: ";", SQT: "'",
    LBKT: "[", RBKT: "]", LBRC: "{", RBRC: "}", LPAR: "(", RPAR: ")",
    MINUS: "-", EQUAL: "=", UNDER: "_", PLUS: "+", PIPE: "|", GRAVE: "`",
    TILDE: "~", EXCL: "!", AT: "@", HASH: "#", DLLR: "$", PRCNT: "%",
    CARET: "^", AMPS: "&", ASTRK: "*", LEFT: "←", RIGHT: "→", UP: "↑",
    DOWN: "↓", DEL: "DEL", HOME: "HOME", END: "END", PG_UP: "PG↑", PG_DN: "PG↓",
};

const VALID_CATEGORIES = new Set<KeyCategory>(
    Object.keys(CATEGORY_LABELS) as KeyCategory[],
);

const NORDIC_LABELS = new Set(["Å", "å", "Æ", "æ", "Ø", "ø"]);
const SYSTEM_KEYCODES = new Set([
    "TAB",
    "BSPC",
    "ESC",
    "RET",
    "ENTER",
    "DEL",
    "HOME",
    "END",
    "PG_UP",
    "PG_DN",
]);

export function createKey(
    binding: string,
    desiredLabel?: string,
    desiredCategory?: KeyCategory,
): ZmkKey {
    const derivedLabel = deriveLabel(binding);
    const label = desiredLabel ?? derivedLabel;
    const inferredCategory = inferCategory(binding, label);

    return {
        binding,
        ...(desiredLabel !== undefined && desiredLabel !== derivedLabel
            ? { labelOverride: desiredLabel }
            : {}),
        ...(desiredCategory !== undefined && desiredCategory !== inferredCategory
            ? { categoryOverride: desiredCategory }
            : {}),
    };
}

export function getKeyLabel(
    key: ZmkKey,
    state?: Pick<ZmkEditorState, "holdTaps">,
): string {
    if (key.labelOverride !== undefined) return key.labelOverride;

    const assignment = state
        ? getHoldTapAssignment(state, key.binding)
        : undefined;
    if (assignment) {
        return deriveLabel(composeBehaviorBinding(
            assignment.behavior.tapBehavior,
            assignment.tapParameter,
        ));
    }

    if (/^&(mt|lt)\s+\S+\s+\S+$/.test(key.binding.trim())) {
        const seed = getTapHoldSeed(state ?? { holdTaps: [] }, key.binding);
        if (seed) {
            return deriveLabel(composeBehaviorBinding(
                seed.tapBehavior,
                seed.tapParameter,
            ));
        }
    }

    return deriveLabel(key.binding);
}

export function getKeyCategory(
    key: ZmkKey,
    state?: Pick<ZmkEditorState, "holdTaps">,
): KeyCategory {
    if (key.categoryOverride !== undefined) return key.categoryOverride;

    const assignment = state
        ? getHoldTapAssignment(state, key.binding)
        : undefined;
    if (assignment) {
        const holdBinding = composeBehaviorBinding(
            assignment.behavior.holdBehavior,
            assignment.holdParameter,
        );
        const tapBinding = composeBehaviorBinding(
            assignment.behavior.tapBehavior,
            assignment.tapParameter,
        );
        const label = getKeyLabel(key, state);
        return inferCategory(`${holdBinding} ${tapBinding}`, label);
    }

    return inferCategory(key.binding, getKeyLabel(key, state));
}

/**
 * Characters reachable from the physical keymap. Managed mod-morph bindings
 * contribute both branches, including recursively referenced mod-morphs.
 */
export function getCoverage(state: ZmkEditorState): Set<string> {
    const labels = state.layers.flatMap((layer) =>
        layer.keys.flatMap((key) => [
            // Preserve explicit presentation overrides as coverage hints.
            getKeyLabel(key, state),
            ...resolveCoverageLabels(state, key.binding),
        ]),
    );

    return new Set(COVERAGE_CHARACTERS.filter((character) => {
        const variants = [
            character,
            character.toUpperCase(),
            character.toLowerCase(),
        ];
        return labels.some((label) => variants.includes(label));
    }));
}

function resolveCoverageLabels(
    state: ZmkEditorState,
    binding: string,
    visited = new Set<string>(),
): string[] {
    const holdTap = getHoldTapAssignment(state, binding);
    if (holdTap) {
        if (visited.has(holdTap.behavior.id)) return [];

        const nextVisited = new Set(visited);
        nextVisited.add(holdTap.behavior.id);
        return [
            ...resolveCoverageLabels(
                state,
                composeBehaviorBinding(
                    holdTap.behavior.holdBehavior,
                    holdTap.holdParameter,
                ),
                nextVisited,
            ),
            ...resolveCoverageLabels(
                state,
                composeBehaviorBinding(
                    holdTap.behavior.tapBehavior,
                    holdTap.tapParameter,
                ),
                nextVisited,
            ),
        ];
    }


    if (/^&(mt|lt)\s+\S+\s+\S+$/.test(binding.trim())) {
        const seed = getTapHoldSeed(state, binding);
        if (seed) {
            return [
                ...resolveCoverageLabels(
                    state,
                    composeBehaviorBinding(seed.holdBehavior, seed.holdParameter),
                    visited,
                ),
                ...resolveCoverageLabels(
                    state,
                    composeBehaviorBinding(seed.tapBehavior, seed.tapParameter),
                    visited,
                ),
            ];
        }
    }

    const behavior = findModMorphForBinding(state, binding);

    if (!behavior) {
        return [deriveLabel(binding)];
    }

    // A cycle can exist temporarily while editing nested managed behaviors.
    // Coverage should degrade safely rather than recurse forever.
    if (visited.has(behavior.id)) {
        return [];
    }

    const nextVisited = new Set(visited);
    nextVisited.add(behavior.id);

    return [
        ...resolveCoverageLabels(state, behavior.normalBinding, nextVisited),
        ...resolveCoverageLabels(state, behavior.morphedBinding, nextVisited),
    ];
}

function transparentLayer(): ZmkKey[] {
    return Array.from({ length: KEY_COUNT }, () => createKey("&trans"));
}

function baseLayer(): ZmkKey[] {
    return [
        createKey("&kp TAB"), createKey("&kp Q"), createKey("&kp W"),
        createKey("&kp E"), createKey("&kp R"), createKey("&kp T"),
        createKey("&kp Y"), createKey("&kp U"), createKey("&kp I"),
        createKey("&kp O"), createKey("&kp P"), createKey("&kp BSPC"),

        createKey("&kp LCTRL"), createKey("&kp A"), createKey("&kp S"),
        createKey("&kp D"), createKey("&kp F"), createKey("&kp G"),
        createKey("&kp H"), createKey("&kp J"), createKey("&kp K"),
        createKey("&kp L"), createKey("&kp SEMI", "Ø"),
        createKey("&kp SQT", "Æ"),

        createKey("&kp LSHFT"), createKey("&kp Z"), createKey("&kp X"),
        createKey("&kp C"), createKey("&kp V"), createKey("&kp B"),
        createKey("&kp N"), createKey("&kp M"), createKey("&kp COMMA"),
        createKey("&kp DOT"), createKey("&kp FSLH"), createKey("&kp ESC"),

        createKey("&kp LGUI"), createKey("&mo LOWER"), createKey("&kp SPACE"),
        createKey("&kp RET"), createKey("&mo RAISE"), createKey("&kp RALT"),
    ];
}

function lowerLayer(): ZmkKey[] {
    const keys = transparentLayer();
    const set = (
        index: number,
        binding: string,
        label?: string,
        category?: KeyCategory,
    ) => {
        keys[index] = createKey(binding, label, category);
    };

    set(6, "&kp FSLH");
    set(7, "&kp N7");
    set(8, "&kp N8");
    set(9, "&kp N9");
    set(10, "&kp BSLH");
    set(18, "&kp QMARK", "?");
    set(19, "&kp N4");
    set(20, "&kp N5");
    set(21, "&kp N6");
    set(22, "&kp MINUS");
    set(30, "&kp EXCL");
    set(31, "&kp N1");
    set(32, "&kp N2");
    set(33, "&kp N3");
    set(34, "&kp DOT");
    set(40, "&trans", "ALTR", "layer");
    set(41, "&kp N0");
    return keys;
}

function raiseLayer(): ZmkKey[] {
    const keys = transparentLayer();
    const set = (
        index: number,
        binding: string,
        label?: string,
        category?: KeyCategory,
    ) => {
        keys[index] = createKey(binding, label, category);
    };

    set(3, "&kp GRAVE");
    set(4, "&kp LBKT");
    set(5, "&kp RBKT");
    set(10, "&kp SQT", "Æ");
    set(15, "&kp DQT", '"');
    set(16, "&kp LBRC");
    set(17, "&kp RBRC");
    set(22, "&kp SEMI", "Ø");
    set(27, "&kp SQT");
    set(28, "&kp LPAR");
    set(29, "&kp RPAR");
    set(34, "&kp LBKT", "Å");
    set(37, "&trans", "ALTR", "layer");
    return keys;
}

function adjustLayer(): ZmkKey[] {
    const keys = transparentLayer();
    const set = (
        index: number,
        binding: string,
        label?: string,
        category?: KeyCategory,
    ) => {
        keys[index] = createKey(binding, label, category);
    };

    set(0, "&bt BT_CLR");
    set(1, "&bt BT_SEL 0");
    set(2, "&bt BT_SEL 1");
    set(3, "&bt BT_SEL 2");
    set(4, "&bt BT_SEL 3");
    set(5, "&bt BT_SEL 4");
    set(13, "&rgb_ug RGB_TOG", "LED");
    set(14, "&rgb_ug RGB_HUI");
    set(15, "&rgb_ug RGB_BRI");
    set(25, "&rgb_ug RGB_EFF");
    set(26, "&rgb_ug RGB_HUD");
    set(27, "&rgb_ug RGB_BRD");
    return keys;
}

const DEFAULT_MODE_ID = "default";
const MAX_MODES = 12;
const MAX_LAYERS = 48;

export function createDefaultState(): ZmkEditorState {
    return {
        currentMode: DEFAULT_MODE_ID,
        currentLayer: 0,
        selectedKey: 0,
        showBindings: true,
        triLayer: true,
        ledCount: 27,
        modMorphs: [],
        holdTaps: [],
        modes: [
            { id: DEFAULT_MODE_ID, name: "Default" },
        ],
        layers: [
            createLayer(DEFAULT_MODE_ID, "Base", "BASE", "#36d9ff", baseLayer()),
            createLayer(DEFAULT_MODE_ID, "Lower", "LOWER", "#f0a13a", lowerLayer()),
            createLayer(DEFAULT_MODE_ID, "Raise", "RAISE", "#e86671", raiseLayer()),
            createLayer(DEFAULT_MODE_ID, "Alternate", "ADJUST", "#c678dd", adjustLayer()),
        ],
    };
}

export function createBlankLayer(
    modeId: string,
    name = "Layer",
    constant = "LAYER",
    color = "#36d9ff",
): ZmkLayer {
    return createLayer(modeId, name, constant, color, transparentLayer());
}

export function createDefaultBaseLayer(
    modeId: string,
    constant = "BASE",
    standalone = false,
): ZmkLayer {
    const keys = baseLayer();

    if (standalone) {
        // A one-layer mode cannot safely keep the default LOWER/RAISE holds.
        keys[37] = createKey("&trans");
        keys[40] = createKey("&trans");
    }

    return createLayer(modeId, "Base", constant, "#36d9ff", keys);
}

export function getModeLayers(
    state: Pick<ZmkEditorState, "layers">,
    modeId: string,
): ZmkLayer[] {
    return state.layers.filter((layer) => layer.modeId === modeId);
}

export function getModeLayerIndices(
    state: Pick<ZmkEditorState, "layers">,
    modeId: string,
): number[] {
    const indices: number[] = [];

    state.layers.forEach((layer, index) => {
        if (layer.modeId === modeId) indices.push(index);
    });

    return indices;
}

export function getCurrentMode(
    state: Pick<ZmkEditorState, "modes" | "currentMode">,
): ZmkMode {
    return state.modes.find((mode) => mode.id === state.currentMode) ?? state.modes[0];
}

export function normalizeState(raw: unknown): ZmkEditorState {
    const fallback = createDefaultState();

    if (!isRecord(raw) || !Array.isArray(raw.layers) || raw.layers.length === 0) {
        return fallback;
    }

    const modes = normalizeModes(raw.modes);
    const fallbackModeId = modes[0].id;
    const knownModeIds = new Set(modes.map((mode) => mode.id));

    const layers = raw.layers.slice(0, MAX_LAYERS).map((candidate, layerIndex) => {
        const fallbackLayer = fallback.layers[layerIndex] ?? fallback.layers[0];
        const layer = isRecord(candidate) ? candidate : {};
        const rawKeys = Array.isArray(layer.keys) ? layer.keys : [];
        const modeId = typeof layer.modeId === "string" && knownModeIds.has(layer.modeId)
            ? layer.modeId
            : fallbackModeId;

        return {
            name: typeof layer.name === "string" && layer.name.trim()
                ? layer.name
                : `Layer ${layerIndex + 1}`,
            constant: sanitizeConstant(
                typeof layer.constant === "string"
                    ? layer.constant
                    : `LAYER_${layerIndex}`,
            ),
            color: typeof layer.color === "string"
                ? layer.color
                : fallbackLayer.color,
            modeId,
            keys: Array.from({ length: KEY_COUNT }, (_, keyIndex) =>
                normalizeKey(rawKeys[keyIndex], fallbackLayer.keys[keyIndex]),
            ),
        };
    });

    // A saved mode must never become an empty, unselectable tab. If data was
    // partially edited or imported, give it one transparent layer instead.
    for (const mode of modes) {
        if (!layers.some((layer) => layer.modeId === mode.id)) {
            layers.push(createBlankLayer(
                mode.id,
                "Base",
                uniqueConstantForLayers(layers, `${sanitizeConstant(mode.name)}_BASE`),
            ));
        }
    }

    const requestedMode = typeof raw.currentMode === "string"
        ? raw.currentMode
        : fallbackModeId;
    const currentMode = knownModeIds.has(requestedMode)
        ? requestedMode
        : fallbackModeId;
    const modeLayerIndices = layers
        .map((layer, index) => layer.modeId === currentMode ? index : -1)
        .filter((index) => index >= 0);
    const requestedLayer = clampInteger(raw.currentLayer, 0, layers.length - 1);
    const currentLayer = modeLayerIndices.includes(requestedLayer)
        ? requestedLayer
        : modeLayerIndices[0] ?? 0;

    const modMorphs = normalizeModMorphs(raw.modMorphs);
    const holdTaps = normalizeHoldTaps(
        raw.holdTaps,
        new Set(modMorphs.map((behavior) => behavior.reference)),
    );

    return {
        currentMode,
        currentLayer,
        selectedKey: clampInteger(raw.selectedKey, 0, KEY_COUNT - 1),
        showBindings: raw.showBindings !== false,
        triLayer: raw.triLayer !== false,
        ledCount: clampInteger(raw.ledCount, 0, 128),
        modMorphs,
        holdTaps,
        modes,
        layers,
    };
}

function createLayer(
    modeId: string,
    name: string,
    constant: string,
    color: string,
    keys: ZmkKey[],
): ZmkLayer {
    return { modeId, name, constant, color, keys };
}

function normalizeModes(candidate: unknown): ZmkMode[] {
    if (!Array.isArray(candidate) || candidate.length === 0) {
        return [{ id: DEFAULT_MODE_ID, name: "Default" }];
    }

    const result: ZmkMode[] = [];
    const usedIds = new Set<string>();

    for (const [index, rawMode] of candidate.slice(0, MAX_MODES).entries()) {
        if (!isRecord(rawMode)) continue;

        let id = typeof rawMode.id === "string" && rawMode.id.trim()
            ? sanitizeModeId(rawMode.id)
            : `mode-${index + 1}`;
        let suffix = 2;
        const baseId = id;
        while (usedIds.has(id)) id = `${baseId}-${suffix++}`;

        result.push({
            id,
            name: typeof rawMode.name === "string" && rawMode.name.trim()
                ? rawMode.name.trim()
                : `Mode ${index + 1}`,
        });
        usedIds.add(id);
    }

    return result.length > 0
        ? result
        : [{ id: DEFAULT_MODE_ID, name: "Default" }];
}

function sanitizeModeId(value: string): string {
    const result = value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return result || "mode";
}

function uniqueConstantForLayers(layers: ZmkLayer[], desired: string): string {
    const base = sanitizeConstant(desired);
    const used = new Set(layers.map((layer) => sanitizeConstant(layer.constant)));

    if (!used.has(base)) return base;

    let index = 2;
    while (used.has(`${base}_${index}`)) index += 1;
    return `${base}_${index}`;
}

export function sanitizeBehaviorReference(value: string): string {
    let result = value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, "_")
        .replace(/^_+|_+$/g, "");

    if (!result) result = "mod_morph";
    if (/^\d/.test(result)) result = `mm_${result}`;
    return result;
}

export function getModMorphBinding(reference: string): string {
    return `&${sanitizeBehaviorReference(reference)}`;
}

export function getHoldTapBinding(
    reference: string,
    holdParameter = "0",
    tapParameter = "0",
): string {
    return `&${sanitizeBehaviorReference(reference)} ${holdParameter.trim() || "0"} ${tapParameter.trim() || "0"}`;
}

export function findHoldTapForBinding(
    state: Pick<ZmkEditorState, "holdTaps">,
    binding: string,
): ZmkHoldTap | undefined {
    const reference = binding.trim().split(/\s+/)[0];
    if (!reference?.startsWith("&")) return undefined;

    return state.holdTaps.find(
        (behavior) => `&${sanitizeBehaviorReference(behavior.reference)}` === reference,
    );
}

export function getHoldTapAssignment(
    state: Pick<ZmkEditorState, "holdTaps">,
    binding: string,
): {
    behavior: ZmkHoldTap;
    holdParameter: string;
    tapParameter: string;
} | undefined {
    const behavior = findHoldTapForBinding(state, binding);
    if (!behavior) return undefined;

    const [, holdParameter = "0", tapParameter = "0"] = binding
        .trim()
        .split(/\s+/);

    return { behavior, holdParameter, tapParameter };
}

export function parseSingleParameterBinding(binding: string): {
    behavior: string;
    parameter: string;
} | undefined {
    const parts = binding.trim().split(/\s+/).filter(Boolean);
    if (parts.length < 1 || parts.length > 2 || !parts[0].startsWith("&")) {
        return undefined;
    }

    return {
        behavior: parts[0],
        parameter: parts[1] ?? "0",
    };
}

export function composeBehaviorBinding(behavior: string, parameter: string): string {
    const normalizedBehavior = behavior.trim() || "&none";
    const normalizedParameter = parameter.trim() || "0";
    return normalizedParameter === "0"
        ? normalizedBehavior
        : `${normalizedBehavior} ${normalizedParameter}`;
}

export function getTapHoldSeed(
    state: Pick<ZmkEditorState, "holdTaps">,
    binding: string,
): {
    holdBehavior: string;
    holdParameter: string;
    tapBehavior: string;
    tapParameter: string;
} | undefined {
    const assignment = getHoldTapAssignment(state, binding);
    if (assignment) {
        return {
            holdBehavior: assignment.behavior.holdBehavior,
            holdParameter: assignment.holdParameter,
            tapBehavior: assignment.behavior.tapBehavior,
            tapParameter: assignment.tapParameter,
        };
    }

    const parts = binding.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 3 && parts[0] === "&mt") {
        return {
            holdBehavior: "&kp",
            holdParameter: parts[1],
            tapBehavior: "&kp",
            tapParameter: parts[2],
        };
    }
    if (parts.length === 3 && parts[0] === "&lt") {
        return {
            holdBehavior: "&mo",
            holdParameter: parts[1],
            tapBehavior: "&kp",
            tapParameter: parts[2],
        };
    }

    const tap = parseSingleParameterBinding(binding);
    if (!tap) return undefined;
    return {
        holdBehavior: "&kp",
        holdParameter: "LSHFT",
        tapBehavior: tap.behavior,
        tapParameter: tap.parameter,
    };
}

export function isLeftHalfKeyPosition(index: number): boolean {
    return LEFT_HALF_KEY_POSITIONS.includes(index as typeof LEFT_HALF_KEY_POSITIONS[number]);
}

export function findModMorphForBinding(
    state: Pick<ZmkEditorState, "modMorphs">,
    binding: string,
): ZmkModMorph | undefined {
    const trimmed = binding.trim();
    return state.modMorphs.find(
        (behavior) => getModMorphBinding(behavior.reference) === trimmed,
    );
}

export function isZmkModifier(value: unknown): value is ZmkModifier {
    return typeof value === "string" && VALID_MODIFIERS.has(value as ZmkModifier);
}

export function inferCategory(binding = "", label = ""): KeyCategory {
    const trimmedBinding = binding.trim();
    const source = `${trimmedBinding} ${label}`.toUpperCase();

    if (trimmedBinding === "&trans") return "transparent";
    if (trimmedBinding === "&none") return "none";
    if (source.includes("RGB_UG")) return "rgb";
    if (
        source.includes("&BT ") ||
        source.includes("&OUT ") ||
        source.includes("BOOT") ||
        source.includes("RESET")
    ) {
        return "system";
    }
    if (
        source.includes("&MO ") ||
        source.includes("&TOG ") ||
        source.includes("&TO ") ||
        source.includes("&LT ")
    ) {
        return "layer";
    }
    if (/(LCTRL|RCTRL|LSHFT|RSHFT|LALT|RALT|LGUI|RGUI|ALTGR)/.test(source)) {
        return "modifier";
    }

    const keyPress = trimmedBinding.match(/^&kp\s+(.+)$/i);
    if (keyPress && SYSTEM_KEYCODES.has(keyPress[1].trim().toUpperCase())) {
        return "system";
    }

    if (NORDIC_LABELS.has(label)) return "nordic";
    return "default";
}

export function deriveLabel(binding: string): string {
    const value = binding.trim();
    if (value === "&trans") return "_";
    if (value === "&none") return "×";

    const keyPress = value.match(/^&kp\s+(.+)$/);
    if (keyPress) {
        const token = keyPress[1].trim();
        if (LABEL_MAP[token]) return LABEL_MAP[token];
        if (/^N\d$/.test(token)) return token.slice(1);
        if (/^[A-Z]$/.test(token)) return token;
        if (/^(LS|RS|LC|RC|LA|RA|LG|RG)\((.+)\)$/.test(token)) {
            const inner = token.replace(/^[A-Z]{2}\((.+)\)$/, "$1");
            return LABEL_MAP[inner] ?? inner;
        }
        return token.replace(/^C_/, "");
    }

    const layer = value.match(/^&mo\s+(.+)$/);
    if (layer) return layer[1].trim();

    const profile = value.match(/^&bt\s+BT_SEL\s+(\d+)/);
    if (profile) return `BT${Number(profile[1]) + 1}`;
    if (/^&bt\s+BT_CLR_ALL/.test(value)) return "BT ALL";
    if (/^&bt\s+BT_CLR/.test(value)) return "BTCLR";
    if (/^&out\s+OUT_BLE/.test(value)) return "BLE";
    if (/^&out\s+OUT_USB/.test(value)) return "USB";
    if (/RGB_TOG/.test(value)) return "RGB";
    if (/RGB_BRI/.test(value)) return "LED+";
    if (/RGB_BRD/.test(value)) return "LED-";
    if (/RGB_HUI/.test(value)) return "HUE+";
    if (/RGB_HUD/.test(value)) return "HUE-";
    if (/RGB_EFF/.test(value)) return "EFF";
    return value.replace(/^&/, "").slice(0, 12).toUpperCase();
}

export function getKeyPosition(index: number): KeyPosition {
    const width = 72;
    const height = 68;
    const leftX = [20, 100, 180, 260, 340, 420];
    const rightX = [508, 588, 668, 748, 828, 908];
    const leftY = [70, 52, 34, 44, 60, 78];
    const rightY = [78, 60, 44, 34, 52, 70];

    if (index < 36) {
        const row = Math.floor(index / 12);
        const column = index % 12;
        const left = column < 6;
        const splitColumn = left ? column : column - 6;
        return {
            x: left ? leftX[splitColumn] : rightX[splitColumn],
            y: (left ? leftY[splitColumn] : rightY[splitColumn]) + row * 76,
            width,
            height,
        };
    }

    const thumbs = [
        { x: 255, y: 307 }, { x: 335, y: 322 }, { x: 415, y: 337 },
        { x: 515, y: 337 }, { x: 595, y: 322 }, { x: 675, y: 307 },
    ];
    return { ...thumbs[index - 36], width, height };
}

export function sanitizeConstant(value: string): string {
    let result = value.trim().toUpperCase().replace(/[^A-Z0-9_]+/g, "_");
    if (!result) result = "LAYER";
    if (/^\d/.test(result)) result = `_${result}`;
    return result;
}

function normalizeModMorphs(candidate: unknown): ZmkModMorph[] {
    if (!Array.isArray(candidate)) return [];

    const usedIds = new Set<string>();
    const usedReferences = new Set<string>();
    const result: ZmkModMorph[] = [];

    for (const [index, rawBehavior] of candidate.slice(0, 64).entries()) {
        if (!isRecord(rawBehavior)) continue;

        let id = typeof rawBehavior.id === "string" && rawBehavior.id.trim()
            ? rawBehavior.id.trim()
            : `mod-morph-${index + 1}`;
        while (usedIds.has(id)) id = `${id}-${index + 1}`;

        const reference = sanitizeBehaviorReference(
            typeof rawBehavior.reference === "string"
                ? rawBehavior.reference
                : `mod_morph_${index + 1}`,
        );

        if (usedReferences.has(reference)) continue;

        const mods = normalizeModifiers(rawBehavior.mods);
        const keepMods = normalizeModifiers(rawBehavior.keepMods)
            .filter((modifier) => mods.includes(modifier));

        result.push({
            id,
            reference,
            normalBinding: typeof rawBehavior.normalBinding === "string"
                ? rawBehavior.normalBinding
                : "&none",
            morphedBinding: typeof rawBehavior.morphedBinding === "string"
                ? rawBehavior.morphedBinding
                : "&none",
            mods: mods.length > 0 ? mods : ["MOD_LSFT", "MOD_RSFT"],
            keepMods,
        });

        usedIds.add(id);
        usedReferences.add(reference);
    }

    return result;
}

function normalizeHoldTaps(
    candidate: unknown,
    reservedReferences: Set<string>,
): ZmkHoldTap[] {
    if (!Array.isArray(candidate)) return [];

    const usedIds = new Set<string>();
    const usedReferences = new Set(reservedReferences);
    const result: ZmkHoldTap[] = [];

    for (const [index, rawBehavior] of candidate.slice(0, 64).entries()) {
        if (!isRecord(rawBehavior)) continue;

        let id = typeof rawBehavior.id === "string" && rawBehavior.id.trim()
            ? rawBehavior.id.trim()
            : `hold-tap-${index + 1}`;
        while (usedIds.has(id)) id = `${id}-${index + 1}`;

        const reference = sanitizeBehaviorReference(
            typeof rawBehavior.reference === "string"
                ? rawBehavior.reference
                : `hold_tap_${index + 1}`,
        );
        if (usedReferences.has(reference)) continue;

        const flavor = isHoldTapFlavor(rawBehavior.flavor)
            ? rawBehavior.flavor
            : "balanced";
        const holdTriggerKeyPositions = Array.isArray(rawBehavior.holdTriggerKeyPositions)
            ? [...new Set(rawBehavior.holdTriggerKeyPositions
                .map((value) => Number(value))
                .filter((value) => Number.isInteger(value) && value >= 0 && value < KEY_COUNT))]
            : [];
        const preset = rawBehavior.preset === "home-row-left" || rawBehavior.preset === "home-row-right"
            ? rawBehavior.preset
            : undefined;

        result.push({
            id,
            reference,
            holdBehavior: normalizeBehaviorNodeReference(rawBehavior.holdBehavior, "&kp"),
            tapBehavior: normalizeBehaviorNodeReference(rawBehavior.tapBehavior, "&kp"),
            flavor,
            tappingTermMs: rawBehavior.tappingTermMs === undefined
                ? 200
                : clampInteger(rawBehavior.tappingTermMs, 1, 5000),
            ...(rawBehavior.quickTapMs === undefined
                ? {}
                : { quickTapMs: clampInteger(rawBehavior.quickTapMs, 0, 5000) }),
            ...(rawBehavior.requirePriorIdleMs === undefined
                ? {}
                : {
                    requirePriorIdleMs: clampInteger(
                        rawBehavior.requirePriorIdleMs,
                        0,
                        5000,
                    ),
                }),
            retroTap: rawBehavior.retroTap === true,
            holdWhileUndecided: rawBehavior.holdWhileUndecided === true,
            holdWhileUndecidedLinger: rawBehavior.holdWhileUndecidedLinger === true,
            holdTriggerKeyPositions,
            holdTriggerOnRelease: rawBehavior.holdTriggerOnRelease === true,
            ...(preset ? { preset } : {}),
        });

        usedIds.add(id);
        usedReferences.add(reference);
    }

    return result;
}

function normalizeBehaviorNodeReference(candidate: unknown, fallback: string): string {
    if (typeof candidate !== "string") return fallback;
    const trimmed = candidate.trim();
    if (!/^&[A-Za-z0-9_]+$/.test(trimmed)) return fallback;
    return trimmed;
}

function isHoldTapFlavor(value: unknown): value is ZmkHoldTapFlavor {
    return typeof value === "string" && VALID_HOLD_TAP_FLAVORS.has(value as ZmkHoldTapFlavor);
}

function normalizeModifiers(candidate: unknown): ZmkModifier[] {
    if (!Array.isArray(candidate)) return [];

    return [...new Set(candidate.filter(isZmkModifier))];
}

function normalizeKey(candidate: unknown, fallback: ZmkKey): ZmkKey {
    if (!isRecord(candidate)) return structuredClone(fallback);

    const binding = typeof candidate.binding === "string"
        ? candidate.binding
        : fallback.binding;

    const derivedLabel = deriveLabel(binding);
    const legacyLabel = typeof candidate.label === "string"
        ? candidate.label
        : undefined;

    const explicitLabel = typeof candidate.labelOverride === "string"
        ? candidate.labelOverride
        : legacyLabel !== undefined && legacyLabel !== derivedLabel
            ? legacyLabel
            : undefined;

    const effectiveLabel = explicitLabel ?? derivedLabel;
    const inferredCategory = inferCategory(binding, effectiveLabel);

    const explicitCategory = isKeyCategory(candidate.categoryOverride)
        ? candidate.categoryOverride
        : isKeyCategory(candidate.category) && candidate.category !== inferredCategory
            ? candidate.category
            : undefined;

    return {
        binding,
        ...(explicitLabel !== undefined ? { labelOverride: explicitLabel } : {}),
        ...(explicitCategory !== undefined
            ? { categoryOverride: explicitCategory }
            : {}),
    };
}

function isKeyCategory(value: unknown): value is KeyCategory {
    return typeof value === "string" && VALID_CATEGORIES.has(value as KeyCategory);
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function clampInteger(value: unknown, minimum: number, maximum: number): number {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return minimum;
    return Math.min(Math.max(Math.trunc(numeric), minimum), maximum);
}

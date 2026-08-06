import type {
    KeyCategory,
    KeyPosition,
    QuickBindingGroup,
    ZmkEditorState,
    ZmkKey,
} from "../zmkEditor.types";

export const STORAGE_KEY = "geferg-zmk-layout-editor-v2";
export const KEY_COUNT = 42;

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
            { name: "Transparent", binding: "&trans", label: "_", category: "transparent" },
            { name: "Alternate pass-through", binding: "&trans", label: "ALTR", category: "layer" },
            { name: "Disabled", binding: "&none", label: "×", category: "none" },
        ],
    },
    {
        name: "Layers",
        bindings: [
            { name: "Lower hold", binding: "&mo LOWER", label: "LOWER", category: "layer" },
            { name: "Raise hold", binding: "&mo RAISE", label: "RAISE", category: "layer" },
            { name: "Adjust hold", binding: "&mo ADJUST", label: "ADJ", category: "layer" },
        ],
    },
    {
        name: "Connectivity",
        bindings: [
            { name: "Clear Bluetooth", binding: "&bt BT_CLR", label: "BTCLR", category: "system" },
            { name: "Bluetooth profile 1", binding: "&bt BT_SEL 0", label: "BT1", category: "system" },
            { name: "BLE output", binding: "&out OUT_BLE", label: "BLE", category: "system" },
            { name: "USB output", binding: "&out OUT_USB", label: "USB", category: "system" },
        ],
    },
    {
        name: "RGB",
        bindings: [
            { name: "Toggle", binding: "&rgb_ug RGB_TOG", label: "RGB", category: "rgb" },
            { name: "Brighter", binding: "&rgb_ug RGB_BRI", label: "LED+", category: "rgb" },
            { name: "Dimmer", binding: "&rgb_ug RGB_BRD", label: "LED-", category: "rgb" },
            { name: "Next effect", binding: "&rgb_ug RGB_EFF", label: "EFF", category: "rgb" },
        ],
    },
];

const LABEL_MAP: Record<string, string> = {
    TAB: "TAB", BSPC: "BCK", ESC: "ESC", RET: "ENT", ENTER: "ENT",
    SPACE: "SPC", LCTRL: "CTRL", RCTRL: "RCTRL", LSHFT: "SHFT",
    RSHFT: "RSHFT", LALT: "ALT", RALT: "ALTGR", LGUI: "GUI", RGUI: "RGUI",
    COMMA: ",", DOT: ".", FSLH: "/", BSLH: "\\", SEMI: ";", SQT: "'",
    LBKT: "[", RBKT: "]", LBRC: "{", RBRC: "}", LPAR: "(", RPAR: ")",
    MINUS: "-", EQUAL: "=", UNDER: "_", PLUS: "+", PIPE: "|", GRAVE: "`",
    TILDE: "~", EXCL: "!", AT: "@", HASH: "#", DLLR: "$", PRCNT: "%",
    CARET: "^", AMPS: "&", ASTRK: "*", LEFT: "←", RIGHT: "→", UP: "↑",
    DOWN: "↓", DEL: "DEL", HOME: "HOME", END: "END", PG_UP: "PG↑", PG_DN: "PG↓",
};

const NORDIC_LABELS = new Set(["Å", "å", "Æ", "æ", "Ø", "ø"]);

export function createKey(binding: string, label: string, category?: KeyCategory): ZmkKey {
    return { binding, label, category: category ?? inferCategory(binding, label) };
}

function transparentLayer(): ZmkKey[] {
    return Array.from({ length: KEY_COUNT }, () => createKey("&trans", "_", "transparent"));
}

function baseLayer(): ZmkKey[] {
    return [
        createKey("&kp TAB", "TAB", "system"), createKey("&kp Q", "Q"),
        createKey("&kp W", "W"), createKey("&kp E", "E"), createKey("&kp R", "R"),
        createKey("&kp T", "T"), createKey("&kp Y", "Y"), createKey("&kp U", "U"),
        createKey("&kp I", "I"), createKey("&kp O", "O"), createKey("&kp P", "P"),
        createKey("&kp BSPC", "BCK", "system"),

        createKey("&kp LCTRL", "CTRL", "modifier"), createKey("&kp A", "A"),
        createKey("&kp S", "S"), createKey("&kp D", "D"), createKey("&kp F", "F"),
        createKey("&kp G", "G"), createKey("&kp H", "H"), createKey("&kp J", "J"),
        createKey("&kp K", "K"), createKey("&kp L", "L"),
        createKey("&kp SEMI", "Ø", "nordic"), createKey("&kp SQT", "Æ", "nordic"),

        createKey("&kp LSHFT", "SHFT", "modifier"), createKey("&kp Z", "Z"),
        createKey("&kp X", "X"), createKey("&kp C", "C"), createKey("&kp V", "V"),
        createKey("&kp B", "B"), createKey("&kp N", "N"), createKey("&kp M", "M"),
        createKey("&kp COMMA", ","), createKey("&kp DOT", "."), createKey("&kp FSLH", "/"),
        createKey("&kp ESC", "ESC", "system"),

        createKey("&kp LGUI", "GUI", "modifier"), createKey("&mo LOWER", "LOWER", "layer"),
        createKey("&kp SPACE", "SPC"), createKey("&kp RET", "ENT", "system"),
        createKey("&mo RAISE", "RAISE", "layer"), createKey("&kp RALT", "ALTGR", "modifier"),
    ];
}

function lowerLayer(): ZmkKey[] {
    const keys = transparentLayer();
    const set = (i: number, binding: string, label: string, category?: KeyCategory) => {
        keys[i] = createKey(binding, label, category);
    };

    set(6, "&kp FSLH", "/"); set(7, "&kp N7", "7"); set(8, "&kp N8", "8");
    set(9, "&kp N9", "9"); set(10, "&kp BSLH", "\\"); set(18, "&kp QMARK", "?");
    set(19, "&kp N4", "4"); set(20, "&kp N5", "5"); set(21, "&kp N6", "6");
    set(22, "&kp MINUS", "-"); set(30, "&kp EXCL", "!"); set(31, "&kp N1", "1");
    set(32, "&kp N2", "2"); set(33, "&kp N3", "3"); set(34, "&kp DOT", ".");
    set(40, "&trans", "ALTR", "layer"); set(41, "&kp N0", "0");
    return keys;
}

function raiseLayer(): ZmkKey[] {
    const keys = transparentLayer();
    const set = (i: number, binding: string, label: string, category?: KeyCategory) => {
        keys[i] = createKey(binding, label, category);
    };

    set(3, "&kp GRAVE", "`"); set(4, "&kp LBKT", "["); set(5, "&kp RBKT", "]");
    set(10, "&kp SQT", "Æ", "nordic"); set(15, "&kp DQT", '"');
    set(16, "&kp LBRC", "{"); set(17, "&kp RBRC", "}");
    set(22, "&kp SEMI", "Ø", "nordic"); set(27, "&kp SQT", "'");
    set(28, "&kp LPAR", "("); set(29, "&kp RPAR", ")");
    set(34, "&kp LBKT", "Å", "nordic"); set(37, "&trans", "ALTR", "layer");
    return keys;
}

function adjustLayer(): ZmkKey[] {
    const keys = transparentLayer();
    const set = (i: number, binding: string, label: string, category?: KeyCategory) => {
        keys[i] = createKey(binding, label, category);
    };

    set(0, "&bt BT_CLR", "BTCLR", "system"); set(1, "&bt BT_SEL 0", "BT1", "system");
    set(2, "&bt BT_SEL 1", "BT2", "system"); set(3, "&bt BT_SEL 2", "BT3", "system");
    set(4, "&bt BT_SEL 3", "BT4", "system"); set(5, "&bt BT_SEL 4", "BT5", "system");
    set(13, "&rgb_ug RGB_TOG", "LED", "rgb"); set(14, "&rgb_ug RGB_HUI", "HUE+", "rgb");
    set(15, "&rgb_ug RGB_BRI", "LED+", "rgb"); set(25, "&rgb_ug RGB_EFF", "EFF", "rgb");
    set(26, "&rgb_ug RGB_HUD", "HUE-", "rgb"); set(27, "&rgb_ug RGB_BRD", "LED-", "rgb");
    return keys;
}

export function createDefaultState(): ZmkEditorState {
    return {
        currentLayer: 0,
        selectedKey: 0,
        showBindings: true,
        triLayer: true,
        ledCount: 27,
        layers: [
            { name: "Base", constant: "BASE", color: "#36d9ff", keys: baseLayer() },
            { name: "Lower", constant: "LOWER", color: "#f0a13a", keys: lowerLayer() },
            { name: "Raise", constant: "RAISE", color: "#e86671", keys: raiseLayer() },
            { name: "Alternate", constant: "ADJUST", color: "#c678dd", keys: adjustLayer() },
        ],
    };
}

export function inferCategory(binding = "", label = ""): KeyCategory {
    const source = `${binding} ${label}`.toUpperCase();
    if (binding.trim() === "&trans") return "transparent";
    if (binding.trim() === "&none") return "none";
    if (source.includes("RGB_UG")) return "rgb";
    if (source.includes("&BT ") || source.includes("&OUT ") || source.includes("BOOT") || source.includes("RESET")) return "system";
    if (source.includes("&MO ") || source.includes("&TOG ") || source.includes("&TO ") || source.includes("&LT ")) return "layer";
    if (/(LCTRL|RCTRL|LSHFT|RSHFT|LALT|RALT|LGUI|RGUI|ALTGR)/.test(source)) return "modifier";
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

import type { ZmkEditorState, ZmkModMorph } from "../zmkEditor.types";
import {
    sanitizeBehaviorReference,
    sanitizeConstant,
} from "./zmkEditor.data";

const ROW_LENGTHS = [12, 12, 12, 6] as const;

export function generateKeymap(state: ZmkEditorState): string {
    const includeLines = [
        "#include <behaviors.dtsi>",
        "#include <dt-bindings/zmk/keys.h>",
        "#include <dt-bindings/zmk/bt.h>",
        "#include <dt-bindings/zmk/outputs.h>",
        "#include <dt-bindings/zmk/rgb.h>",
    ];

    if (state.modMorphs.length > 0) {
        includeLines.push("#include <dt-bindings/zmk/modifiers.h>");
    }

    const includes = `${includeLines.join("\n")}\n\n`;

    const definitions = state.layers
        .map((layer, index) => `#define ${sanitizeConstant(layer.constant)} ${index}`)
        .join("\n");

    const layers = state.layers
        .map((_, index) => generateLayerBlock(state, index))
        .join("\n\n");

    const behaviors = generateBehaviors(state);
    const conditional = generateConditionalLayer(state);
    const ledStrip = state.ledCount > 0
        ? `\n\n&led_strip {\n    chain-length = <${state.ledCount}>;\n};\n`
        : "\n";

    return `${includes}${definitions}\n\n/ {${behaviors}${conditional}\n    keymap {\n        compatible = "zmk,keymap";\n\n${indent(layers, 8)}\n    };\n};${ledStrip}`;
}

function generateBehaviors(state: ZmkEditorState): string {
    if (state.modMorphs.length === 0) return "";

    const definitions = state.modMorphs
        .map(generateModMorph)
        .join("\n\n");

    return `\n    behaviors {\n${indent(definitions, 8)}\n    };\n`;
}

function generateModMorph(behavior: ZmkModMorph): string {
    const reference = sanitizeBehaviorReference(behavior.reference);
    const normalBinding = behavior.normalBinding.trim() || "&none";
    const morphedBinding = behavior.morphedBinding.trim() || "&none";
    const mods = behavior.mods.length > 0 ? behavior.mods.join("|") : "0";
    const keepMods = behavior.keepMods.filter((modifier) =>
        behavior.mods.includes(modifier),
    );
    const keepModsLine = keepMods.length > 0
        ? `\n    keep-mods = <(${keepMods.join("|")})>;`
        : "";

    return `${reference}: ${reference} {\n    compatible = "zmk,behavior-mod-morph";\n    #binding-cells = <0>;\n    bindings = <${normalBinding}>, <${morphedBinding}>;\n    mods = <(${mods})>;${keepModsLine}\n};`;
}

function generateConditionalLayer(state: ZmkEditorState): string {
    if (!state.triLayer || state.layers.length < 4) return "";

    const lower = sanitizeConstant(state.layers[1].constant);
    const raise = sanitizeConstant(state.layers[2].constant);
    const alternate = sanitizeConstant(state.layers[3].constant);

    return `
    conditional_layers {
        compatible = "zmk,conditional-layers";

        lower_raise_adjust {
            if-layers = <${lower} ${raise}>;
            then-layer = <${alternate}>;
        };
    };
`;
}

function generateLayerBlock(state: ZmkEditorState, index: number): string {
    const layer = state.layers[index];
    const lines: string[] = [];
    let offset = 0;

    for (const length of ROW_LENGTHS) {
        const bindings = layer.keys
            .slice(offset, offset + length)
            .map((key) => key.binding.trim() || "&none");
        lines.push(`            ${bindings.join("  ")}`);
        offset += length;
    }

    return `${sanitizeNodeName(layer.name, index)} {\n        bindings = <\n${lines.join("\n")}\n        >;\n    };`;
}

function sanitizeNodeName(value: string, index: number): string {
    const result = value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, "_")
        .replace(/^_+|_+$/g, "");
    return result || `layer_${index}`;
}

function indent(text: string, spaces: number): string {
    const prefix = " ".repeat(spaces);
    return text
        .split("\n")
        .map((line) => (line ? `${prefix}${line}` : line))
        .join("\n");
}

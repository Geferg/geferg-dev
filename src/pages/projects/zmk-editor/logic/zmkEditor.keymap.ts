import type { ZmkEditorState } from "../zmkEditor.types";
import { sanitizeConstant } from "./zmkEditor.data";

const ROW_LENGTHS = [12, 12, 12, 6] as const;

export function generateKeymap(state: ZmkEditorState): string {
    const includes = [
        "#include <behaviors.dtsi>",
        "#include <dt-bindings/zmk/keys.h>",
        "#include <dt-bindings/zmk/bt.h>",
        "#include <dt-bindings/zmk/outputs.h>",
        "#include <dt-bindings/zmk/rgb.h>",
        "",
    ].join("\n");

    const definitions = state.layers
        .map((layer, index) => `#define ${sanitizeConstant(layer.constant)} ${index}`)
        .join("\n");

    const layers = state.layers
        .map((_, index) => generateLayerBlock(state, index))
        .join("\n\n");

    const conditional = generateConditionalLayer(state);
    const ledStrip = state.ledCount > 0
        ? `\n\n&led_strip {\n    chain-length = <${state.ledCount}>;\n};\n`
        : "\n";

    return `${includes}${definitions}\n\n/ {${conditional}\n    keymap {\n        compatible = "zmk,keymap";\n\n${indent(layers, 8)}\n    };\n};${ledStrip}`;
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

import type {
    ZmkEditorState,
    ZmkHoldTap,
    ZmkLayer,
    ZmkModMorph,
} from "../zmkEditor.types";
import {
    getModeLayers,
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

    // Modes are an editor abstraction. ZMK receives one global layer index
    // space in the same deterministic order as state.layers.
    const definitions = state.layers
        .map((layer, index) => `#define ${sanitizeConstant(layer.constant)} ${index}`)
        .join("\n");

    const layers = state.layers
        .map((layer, index) => generateLayerBlock(state, layer, index))
        .join("\n\n");

    const behaviors = generateBehaviors(state);
    const conditional = generateConditionalLayers(state);
    const ledStrip = state.ledCount > 0
        ? `\n\n&led_strip {\n    chain-length = <${state.ledCount}>;\n};\n`
        : "\n";

    return `${includes}${definitions}\n\n/ {${behaviors}${conditional}\n    keymap {\n        compatible = "zmk,keymap";\n\n${indent(layers, 8)}\n    };\n};${ledStrip}`;
}

function generateBehaviors(state: ZmkEditorState): string {
    if (state.modMorphs.length === 0 && state.holdTaps.length === 0) return "";

    const definitions = [
        ...state.holdTaps.map(generateHoldTap),
        ...state.modMorphs.map(generateModMorph),
    ].join("\n\n");

    return `\n    behaviors {\n${indent(definitions, 8)}\n    };\n`;
}

function generateHoldTap(behavior: ZmkHoldTap): string {
    const reference = sanitizeBehaviorReference(behavior.reference);
    const lines = [
        `${reference}: ${reference} {`,
        `    compatible = "zmk,behavior-hold-tap";`,
        `    #binding-cells = <2>;`,
        `    flavor = "${behavior.flavor}";`,
        `    tapping-term-ms = <${behavior.tappingTermMs}>;`,
    ];

    if (behavior.quickTapMs !== undefined) {
        lines.push(`    quick-tap-ms = <${behavior.quickTapMs}>;`);
    }
    if (behavior.requirePriorIdleMs !== undefined) {
        lines.push(`    require-prior-idle-ms = <${behavior.requirePriorIdleMs}>;`);
    }

    lines.push(`    bindings = <${behavior.holdBehavior}>, <${behavior.tapBehavior}>;`);

    if (behavior.retroTap) lines.push("    retro-tap;");
    if (behavior.holdWhileUndecided) lines.push("    hold-while-undecided;");
    if (behavior.holdWhileUndecidedLinger) {
        lines.push("    hold-while-undecided-linger;");
    }
    if (behavior.holdTriggerKeyPositions.length > 0) {
        lines.push(
            `    hold-trigger-key-positions = <${behavior.holdTriggerKeyPositions.join(" ")}>;`,
        );
    }
    if (behavior.holdTriggerKeyPositions.length > 0 && behavior.holdTriggerOnRelease) {
        lines.push("    hold-trigger-on-release;");
    }

    lines.push("};");
    return lines.join("\n");
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

function generateConditionalLayers(state: ZmkEditorState): string {
    if (!state.triLayer) return "";

    const definitions = state.modes.flatMap((mode) => {
        const layers = getModeLayers(state, mode.id);
        if (layers.length < 4) return [];

        const lower = sanitizeConstant(layers[1].constant);
        const raise = sanitizeConstant(layers[2].constant);
        const alternate = sanitizeConstant(layers[3].constant);
        const nodeName = `lower_raise_adjust_${sanitizeNodeName(mode.id, 0)}`;

        return [`        ${nodeName} {\n            if-layers = <${lower} ${raise}>;\n            then-layer = <${alternate}>;\n        };`];
    });

    if (definitions.length === 0) return "";

    return `\n    conditional_layers {\n        compatible = "zmk,conditional-layers";\n\n${definitions.join("\n\n")}\n    };\n`;
}

function generateLayerBlock(
    state: ZmkEditorState,
    layer: ZmkLayer,
    index: number,
): string {
    const lines: string[] = [];
    let offset = 0;

    for (const length of ROW_LENGTHS) {
        const bindings = layer.keys
            .slice(offset, offset + length)
            .map((key) => key.binding.trim() || "&none");
        lines.push(`            ${bindings.join("  ")}`);
        offset += length;
    }

    const modePrefix = state.modes.length > 1 && layer.modeId !== "default"
        ? `${sanitizeNodeName(layer.modeId, index)}_`
        : "";
    const nodeName = `${modePrefix}${sanitizeNodeName(layer.name, index)}`;

    return `${nodeName} {\n        bindings = <\n${lines.join("\n")}\n        >;\n    };`;
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

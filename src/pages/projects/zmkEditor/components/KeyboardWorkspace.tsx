import type { KeyCategory, ZmkEditorState } from "../zmkEditor.types";
import {
    CATEGORY_LABELS,
    COVERAGE_CHARACTERS,
    KEY_COUNT,
    getKeyCategory,
    getKeyLabel,
    getKeyPosition,
    getModeLayerIndices,
} from "../logic/zmkEditor.data";

import "./keyboardWorkspace.css";

const categoryClasses: Record<KeyCategory, string> = {
    default: "zmk-editor-key--default",
    modifier: "zmk-editor-key--modifier",
    layer: "zmk-editor-key--layer",
    system: "zmk-editor-key--system",
    rgb: "zmk-editor-key--rgb",
    nordic: "zmk-editor-key--nordic",
    transparent: "zmk-editor-key--transparent",
    none: "zmk-editor-key--none",
};

export default function KeyboardWorkspace({
    state,
    coveredCharacters,
    coverageExpanded,
    onSelectKey,
    onToggleCoverage,
}: {
    state: ZmkEditorState;
    coveredCharacters: Set<string>;
    coverageExpanded: boolean;
    onSelectKey: (index: number) => void;
    onToggleCoverage: () => void;
}) {
    const layer = state.layers[state.currentLayer];
    const mode = state.modes.find((item) => item.id === state.currentMode);
    const modeLayerIndices = getModeLayerIndices(state, state.currentMode);
    const localLayerIndex = Math.max(0, modeLayerIndices.indexOf(state.currentLayer));

    return (
        <section className="zmk-editor-workspace">
            <div className="zmk-editor-workspace__meta">
                <div>
                    <span className="zmk-editor-kicker">
                        {state.modes.length > 1 && mode
                            ? `${mode.name.toUpperCase()} · `
                            : ""}
                        LAYER {String(localLayerIndex + 1).padStart(2, "0")}
                    </span>
                    <strong>{layer.name}</strong>
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                    {KEY_COUNT} keys
                    {state.triLayer && localLayerIndex === 3
                        ? " · conditional layer"
                        : ""}
                </span>
            </div>

            <div className="zmk-editor-keyboard-scroll">
                <div className="zmk-editor-keyboard-wrap">
                    <svg
                        className="zmk-editor-keyboard-orbits"
                        viewBox="0 0 1000 410"
                        aria-hidden="true"
                    >
                        <ellipse cx="500" cy="205" rx="440" ry="150" />
                        <ellipse cx="500" cy="205" rx="340" ry="112" />
                        <ellipse cx="500" cy="205" rx="245" ry="78" />
                        <line x1="500" y1="24" x2="500" y2="382" />
                    </svg>

                    <div className="zmk-editor-keyboard">
                        {layer.keys.map((key, index) => {
                            const position = getKeyPosition(index);
                            const label = getKeyLabel(key);
                            const category = getKeyCategory(key);

                            return (
                                <button
                                    key={index}
                                    type="button"
                                    className={`zmk-editor-key ${categoryClasses[category]}`}
                                    data-selected={index === state.selectedKey}
                                    style={{
                                        left: `${position.x / 10}%`,
                                        top: `${position.y / 4.1}%`,
                                        width: `${position.width / 10}%`,
                                        height: `${position.height / 4.1}%`,
                                    }}
                                    title={`Key ${index + 1}: ${key.binding}`}
                                    onClick={() => onSelectKey(index)}
                                >
                                    <span className="zmk-editor-key__label">
                                        {label}
                                    </span>
                                    {state.showBindings && (
                                        <span className="zmk-editor-key__binding">
                                            {key.binding}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="zmk-editor-legend" aria-label="Key category legend">
                {(["modifier", "layer", "system", "rgb", "nordic"] as KeyCategory[])
                    .map((category) => (
                        <span key={category} data-category={category}>
                            {CATEGORY_LABELS[category]}
                        </span>
                    ))}
            </div>

            <CoveragePanel
                coveredCharacters={coveredCharacters}
                expanded={coverageExpanded}
                onToggle={onToggleCoverage}
            />
        </section>
    );
}

function CoveragePanel({
    coveredCharacters,
    expanded,
    onToggle,
}: {
    coveredCharacters: Set<string>;
    expanded: boolean;
    onToggle: () => void;
}) {
    return (
        <section className="zmk-editor-workspace__coverage">
            <button
                type="button"
                className="zmk-editor-workspace__coverage-summary"
                aria-expanded={expanded}
                onClick={onToggle}
            >
                <span>
                    <strong>Character coverage</strong>
                    <small>Visible-label checklist across all modes and layers</small>
                </span>

                <span className="font-mono text-xs text-muted-foreground">
                    {coveredCharacters.size}/{COVERAGE_CHARACTERS.length}
                    <span aria-hidden="true" className="ml-3">
                        {expanded ? "−" : "+"}
                    </span>
                </span>
            </button>

            {expanded && (
                <div className="zmk-editor-workspace__coverage-grid">
                    {COVERAGE_CHARACTERS.map((character) => (
                        <span
                            key={character}
                            data-present={coveredCharacters.has(character)}
                        >
                            {character}
                        </span>
                    ))}
                </div>
            )}
        </section>
    );
}

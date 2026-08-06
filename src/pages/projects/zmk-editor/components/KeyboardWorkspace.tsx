import type { KeyCategory, ZmkEditorState } from "../zmkEditor.types";
import {
    CATEGORY_LABELS,
    KEY_COUNT,
    deriveLabel,
    getKeyPosition,
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
    onSelectKey,
}: {
    state: ZmkEditorState;
    onSelectKey: (index: number) => void;
}) {
    const layer = state.layers[state.currentLayer];

    return (
        <section className="zmk-editor-workspace">
            <div className="zmk-editor-workspace__meta">
                <div>
                    <span className="zmk-editor-kicker">
                        LAYER {String(state.currentLayer + 1).padStart(2, "0")}
                    </span>
                    <strong>{layer.name}</strong>
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                    {KEY_COUNT} keys
                    {state.triLayer && state.currentLayer === 3
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
                            return (
                                <button
                                    key={index}
                                    type="button"
                                    className={`zmk-editor-key ${categoryClasses[key.category]}`}
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
                                        {key.label || deriveLabel(key.binding)}
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

            <div className="zmk-editor-legend">
                {(["modifier", "layer", "system", "rgb", "nordic"] as KeyCategory[])
                    .map((category) => (
                        <span key={category} data-category={category}>
                            {CATEGORY_LABELS[category]}
                        </span>
                    ))}
            </div>
        </section>
    );
}

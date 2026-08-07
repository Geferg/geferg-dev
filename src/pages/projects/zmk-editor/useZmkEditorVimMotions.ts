import { useEffect, type RefObject } from "react";

import { getKeyPosition } from "./logic/zmkEditor.data";

const KEY_ROWS = [
    Array.from({ length: 12 }, (_, index) => index),
    Array.from({ length: 12 }, (_, index) => index + 12),
    Array.from({ length: 12 }, (_, index) => index + 24),
    Array.from({ length: 6 }, (_, index) => index + 36),
] as const;

type UseZmkEditorVimMotionsOptions = {
    enabled: boolean;
    selectedKey: number;
    currentLayer: number;
    layerCount: number;
    bindingInputRef: RefObject<HTMLInputElement | null>;
    onSelectKey: (index: number) => void;
    onSelectLayer: (index: number) => void;
};

export function useZmkEditorVimMotions({
    enabled,
    selectedKey,
    currentLayer,
    layerCount,
    bindingInputRef,
    onSelectKey,
    onSelectLayer,
}: UseZmkEditorVimMotionsOptions): void {
    useEffect(() => {
        if (!enabled) {
            return;
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.defaultPrevented || event.altKey || event.metaKey) {
                return;
            }

            if (isEditableTarget(event.target)) {
                return;
            }

            if (event.ctrlKey) {
                if (event.key.toLowerCase() === "n") {
                    event.preventDefault();
                    onSelectLayer(wrapIndex(currentLayer + 1, layerCount));
                } else if (event.key.toLowerCase() === "p") {
                    event.preventDefault();
                    onSelectLayer(wrapIndex(currentLayer - 1, layerCount));
                }

                return;
            }

            const key = event.key;
            let nextKey: number | null = null;

            switch (key) {
                case "h":
                case "ArrowLeft":
                    nextKey = moveWithinRow(selectedKey, -1);
                    break;

                case "l":
                case "ArrowRight":
                    nextKey = moveWithinRow(selectedKey, 1);
                    break;

                case "k":
                case "ArrowUp":
                    nextKey = moveVertically(selectedKey, -1);
                    break;

                case "j":
                case "ArrowDown":
                    nextKey = moveVertically(selectedKey, 1);
                    break;

                case "0":
                case "_":
                    nextKey = getCurrentRow(selectedKey)[0];
                    break;

                case "$": {
                    const row = getCurrentRow(selectedKey);
                    nextKey = row[row.length - 1];
                    break;
                }

                case "u":
                    nextKey = findNearestKey(selectedKey, KEY_ROWS[0]);
                    break;

                case "d":
                    nextKey = findNearestKey(selectedKey, KEY_ROWS[3]);
                    break;

                case "i":
                    event.preventDefault();
                    bindingInputRef.current?.focus();
                    bindingInputRef.current?.select();
                    return;

                default:
                    return;
            }

            event.preventDefault();

            if (nextKey !== null && nextKey !== selectedKey) {
                onSelectKey(nextKey);
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [
        bindingInputRef,
        currentLayer,
        enabled,
        layerCount,
        onSelectKey,
        onSelectLayer,
        selectedKey,
    ]);
}

function moveWithinRow(selectedKey: number, delta: -1 | 1): number {
    const row = getCurrentRow(selectedKey);
    const column = row.indexOf(selectedKey);
    const nextColumn = Math.min(Math.max(column + delta, 0), row.length - 1);

    return row[nextColumn];
}

function moveVertically(selectedKey: number, delta: -1 | 1): number {
    const rowIndex = getRowIndex(selectedKey);
    const nextRowIndex = Math.min(
        Math.max(rowIndex + delta, 0),
        KEY_ROWS.length - 1,
    );

    if (nextRowIndex === rowIndex) {
        return selectedKey;
    }

    return findNearestKey(selectedKey, KEY_ROWS[nextRowIndex]);
}

function findNearestKey(
    selectedKey: number,
    candidates: readonly number[],
): number {
    const selectedCenter = getKeyCenterX(selectedKey);

    return candidates.reduce((nearest, candidate) => {
        const nearestDistance = Math.abs(getKeyCenterX(nearest) - selectedCenter);
        const candidateDistance = Math.abs(getKeyCenterX(candidate) - selectedCenter);

        return candidateDistance < nearestDistance ? candidate : nearest;
    });
}

function getKeyCenterX(index: number): number {
    const position = getKeyPosition(index);
    return position.x + position.width / 2;
}

function getCurrentRow(selectedKey: number): readonly number[] {
    return KEY_ROWS[getRowIndex(selectedKey)];
}

function getRowIndex(selectedKey: number): number {
    if (selectedKey < 12) return 0;
    if (selectedKey < 24) return 1;
    if (selectedKey < 36) return 2;
    return 3;
}

function wrapIndex(index: number, length: number): number {
    if (length <= 0) {
        return 0;
    }

    return ((index % length) + length) % length;
}

function isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    return (
        target.isContentEditable ||
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
    );
}

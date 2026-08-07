import { useEffect, type RefObject } from "react";

import { getKeyPosition, KEY_COUNT } from "./logic/zmkEditor.data";

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
    editorRootRef: RefObject<HTMLElement | null>;
    bindingInputRef: RefObject<HTMLInputElement | null>;
    displayLabelInputRef: RefObject<HTMLInputElement | null>;
    onSelectKey: (index: number) => void;
    onSelectLayer: (index: number) => void;
    onStartReplaceBinding: () => void;
    onYankKey: () => void;
    onDeleteKey: () => void;
    onPasteKey: () => void;
    onUndo: () => void;
    onRedo: () => void;
};

export function useZmkEditorVimMotions({
    enabled,
    selectedKey,
    currentLayer,
    layerCount,
    editorRootRef,
    bindingInputRef,
    displayLabelInputRef,
    onSelectKey,
    onSelectLayer,
    onStartReplaceBinding,
    onYankKey,
    onDeleteKey,
    onPasteKey,
    onUndo,
    onRedo,
}: UseZmkEditorVimMotionsOptions): void {
    useEffect(() => {
        if (!enabled) {
            return;
        }

        function focusBinding(selectContents: boolean): void {
            const input = bindingInputRef.current;

            if (!input) {
                return;
            }

            input.focus();

            if (selectContents) {
                input.select();
            }
        }

        function focusDisplayOverride(): void {
            const input = displayLabelInputRef.current;

            if (!input) {
                return;
            }

            input.focus();
            input.select();
        }

        function handleKeyDown(event: KeyboardEvent): void {
            if (event.defaultPrevented || event.altKey || event.metaKey || event.ctrlKey) {
                return;
            }

            const editableTarget = getEditableTarget(event.target);

            if (editableTarget) {
                if (!editorRootRef.current?.contains(editableTarget)) {
                    return;
                }

                if (event.key === "Escape") {
                    event.preventDefault();
                    editableTarget.blur();
                    editorRootRef.current?.focus({ preventScroll: true });
                    return;
                }

                if (
                    event.key === "Enter" &&
                    editableTarget === bindingInputRef.current
                ) {
                    event.preventDefault();

                    // Blurring commits the current edit. Refocusing after the key
                    // selection changes starts a fresh edit snapshot for the next key.
                    editableTarget.blur();
                    onSelectKey(wrapIndex(selectedKey + 1, KEY_COUNT));

                    window.requestAnimationFrame(() => {
                        focusBinding(true);
                    });
                }

                return;
            }

            let nextKey: number | null = null;

            switch (event.key) {
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

                case "n":
                    event.preventDefault();
                    onSelectLayer(wrapIndex(currentLayer + 1, layerCount));
                    return;

                case "N":
                    event.preventDefault();
                    onSelectLayer(wrapIndex(currentLayer - 1, layerCount));
                    return;

                case "i":
                    event.preventDefault();
                    focusBinding(true);
                    return;

                case "a":
                    event.preventDefault();
                    focusDisplayOverride();
                    return;

                case "r":
                    event.preventDefault();
                    onStartReplaceBinding();
                    window.requestAnimationFrame(() => {
                        const input = bindingInputRef.current;
                        input?.focus();
                        input?.setSelectionRange(1, 1);
                    });
                    return;

                case "y":
                    event.preventDefault();
                    onYankKey();
                    return;

                case "x":
                case "d":
                    event.preventDefault();
                    onDeleteKey();
                    return;

                case "p":
                    event.preventDefault();
                    onPasteKey();
                    return;

                case "u":
                    event.preventDefault();
                    onUndo();
                    return;

                case "U":
                    event.preventDefault();
                    onRedo();
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
        displayLabelInputRef,
        editorRootRef,
        enabled,
        layerCount,
        onDeleteKey,
        onPasteKey,
        onRedo,
        onSelectKey,
        onSelectLayer,
        onStartReplaceBinding,
        onUndo,
        onYankKey,
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

function getEditableTarget(target: EventTarget | null): HTMLElement | null {
    if (!(target instanceof HTMLElement)) {
        return null;
    }

    if (
        target.isContentEditable ||
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
    ) {
        return target;
    }

    return null;
}

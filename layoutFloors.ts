import type { FloorLayout, Layout } from './types';

/** Maximum floor index supported in the app (floors 1..MAX_FLOORS). */
export const MAX_FLOORS = 10;

/**
 * Keeps only floors 1..MAX_FLOORS. Ensures at least floor 1 exists.
 * Returns which floor indices were removed (typically > MAX_FLOORS).
 */
export function clampLayoutFloors(layout: Layout): {
    layout: Layout;
    droppedFloorIndices: number[];
} {
    const dropped: number[] = [];
    const newFloors: { [floor: number]: FloorLayout } = {};

    for (const key of Object.keys(layout.floors || {})) {
        const n = Number(key);
        if (Number.isNaN(n)) continue;
        const floor = layout.floors[n];
        if (!floor) continue;
        if (n >= 1 && n <= MAX_FLOORS) {
            newFloors[n] = floor;
        } else {
            dropped.push(n);
        }
    }

    dropped.sort((a, b) => a - b);

    if (Object.keys(newFloors).length === 0) {
        newFloors[1] = { rooms: [] };
    }

    return {
        layout: {
            ...layout,
            floors: newFloors,
            sectors: layout.sectors || {},
        },
        droppedFloorIndices: dropped,
    };
}

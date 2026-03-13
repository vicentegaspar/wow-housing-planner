/**
 * Template Diagnostic Suite
 *
 * Validates all 21 TEMPLATES to ensure they render correctly in both the 2D
 * canvas and the 3D view (ThreeDView.tsx).
 *
 * Checks performed per template:
 *  1. Floor indices are inside the valid range 1..MAX_FLOORS
 *     → ThreeDView skips floors outside this range; clampLayoutFloors drops them.
 *  2. At least one room is visible to the 3D renderer (after floor filtering).
 *  3. Every room shape maps to a known entry in ROOM_DEFINITIONS.
 *  4. Every room has valid, finite coordinates (x, y, rotation).
 *  5. Every sectorId referenced by a room exists in the template's sector map.
 *  6. Room IDs are unique within each template.
 *  7. Sector hex colours are well-formed (#RRGGBB).
 *  8. Three.js geometry validity: ≥3 vertices, non-zero bounding box, all
 *     vertex coordinates are finite — mirrors the ShapeGeometry call in ThreeDView.
 *
 * Global checks:
 *  9. Template names are unique.
 * 10. Room IDs are globally unique across every template (no cross-template
 *     collisions that could cause React key or state bugs).
 */

import { describe, it, expect } from 'vitest';
import { TEMPLATES } from '../templates';
import { ROOM_DEFINITIONS } from '../constants';
import { MAX_FLOORS } from '../layoutFloors';
import { RoomShape } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const VALID_SHAPES = new Set<string>(Object.values(RoomShape));

/** Mirrors ThreeDView line 259: skip floors outside the valid range. */
function getVisibleFloors(layout: { floors: Record<string | number, { rooms: unknown[] }> }) {
    return Object.entries(layout.floors).filter(([key]) => {
        const n = parseInt(key, 10);
        return n >= 1 && n <= MAX_FLOORS;
    });
}

function getAllRooms(layout: { floors: Record<string | number, { rooms: Array<{
    id: string; shape: string; x: number; y: number; rotation: number; sectorId?: string
}> }> }) {
    return Object.values(layout.floors).flatMap(f => f.rooms);
}

function getVisible3DRooms(layout: { floors: Record<string | number, { rooms: Array<{
    id: string; shape: string; x: number; y: number; rotation: number; sectorId?: string
}> }> }) {
    return getVisibleFloors(layout).flatMap(([, floor]) => floor.rooms as Array<{
        id: string; shape: string; x: number; y: number; rotation: number; sectorId?: string
    }>);
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-template checks
// ─────────────────────────────────────────────────────────────────────────────

describe('Template Diagnostic Suite', () => {
    TEMPLATES.forEach(template => {
        describe(`"${template.name}"`, () => {
            const { layout } = template;
            const allFloorKeys = Object.keys(layout.floors).map(k => parseInt(k, 10));
            const outsideRange = allFloorKeys.filter(n => n < 1 || n > MAX_FLOORS);
            const visible3DRooms = getVisible3DRooms(layout as Parameters<typeof getVisible3DRooms>[0]);
            const allRooms = getAllRooms(layout as Parameters<typeof getAllRooms>[0]);

            // ── 1. Floor index validity ───────────────────────────────────────
            it('has no floor indices outside 1..MAX_FLOORS (would be silently dropped by 3D renderer and clampLayoutFloors)', () => {
                if (outsideRange.length > 0) {
                    // Produce a meaningful failure message
                    const bad = outsideRange.join(', ');
                    expect.fail(
                        `Floor(s) [${bad}] are outside the valid range 1..${MAX_FLOORS}. ` +
                        `ThreeDView.tsx (line 259) silently skips them and clampLayoutFloors() drops them, ` +
                        `making those rooms invisible. Renumber to floors 1..${MAX_FLOORS}.`
                    );
                }
                expect(outsideRange).toHaveLength(0);
            });

            // ── 2. At least one visible room ──────────────────────────────────
            it('has at least one room visible to the 3D renderer', () => {
                expect(visible3DRooms.length).toBeGreaterThan(0);
            });

            // ── 3. All room shapes are known ──────────────────────────────────
            it('all room shapes exist in ROOM_DEFINITIONS', () => {
                for (const room of visible3DRooms) {
                    expect(
                        VALID_SHAPES.has(room.shape),
                        `Room "${room.id}" uses unknown shape "${room.shape}"`
                    ).toBe(true);

                    expect(
                        ROOM_DEFINITIONS[room.shape as RoomShape],
                        `Room "${room.id}" shape "${room.shape}" has no entry in ROOM_DEFINITIONS`
                    ).toBeDefined();
                }
            });

            // ── 4. Valid numeric coordinates ──────────────────────────────────
            it('all rooms have finite numeric coordinates (x, y, rotation)', () => {
                for (const room of allRooms) {
                    expect(Number.isFinite(room.x),    `Room "${room.id}" x=${room.x} is not finite`).toBe(true);
                    expect(Number.isFinite(room.y),    `Room "${room.id}" y=${room.y} is not finite`).toBe(true);
                    expect(Number.isFinite(room.rotation), `Room "${room.id}" rotation=${room.rotation} is not finite`).toBe(true);
                }
            });

            // ── 5. SectorId references are resolved ───────────────────────────
            it('all room sectorIds reference an existing sector', () => {
                for (const room of allRooms) {
                    if (room.sectorId !== undefined && room.sectorId !== '') {
                        expect(
                            layout.sectors[room.sectorId],
                            `Room "${room.id}" references sectorId "${room.sectorId}" which is not defined in sectors`
                        ).toBeDefined();
                    }
                }
            });

            // ── 6. Unique room IDs within the template ────────────────────────
            it('all room IDs are unique within this template', () => {
                const ids = allRooms.map(r => r.id);
                const seen = new Set<string>();
                const duplicates: string[] = [];
                for (const id of ids) {
                    if (seen.has(id)) duplicates.push(id);
                    seen.add(id);
                }
                expect(duplicates, `Duplicate room IDs: ${duplicates.join(', ')}`).toHaveLength(0);
            });

            // ── 7. Sector hex colours ─────────────────────────────────────────
            it('all sector colours are valid #RRGGBB hex strings', () => {
                for (const sector of Object.values(layout.sectors)) {
                    expect(
                        HEX_COLOR.test(sector.color),
                        `Sector "${sector.id}" has invalid color "${sector.color}"`
                    ).toBe(true);
                }
            });

            // ── 8. Three.js geometry validity ─────────────────────────────────
            // Mirrors: new THREE.Shape(definition.vertices.map(p => new THREE.Vector2(p.x, p.y)))
            // A ShapeGeometry requires ≥ 3 non-collinear vertices and finite coordinates.
            it('room definitions have valid geometry for Three.js ShapeGeometry', () => {
                for (const room of visible3DRooms) {
                    const def = ROOM_DEFINITIONS[room.shape as RoomShape];
                    if (!def) continue; // shape validity caught above

                    // Minimum vertex count
                    expect(
                        def.vertices.length,
                        `Shape "${room.shape}" has fewer than 3 vertices (got ${def.vertices.length})`
                    ).toBeGreaterThanOrEqual(3);

                    // Finite vertex coordinates
                    for (const [i, v] of def.vertices.entries()) {
                        expect(
                            Number.isFinite(v.x) && Number.isFinite(v.y),
                            `Shape "${room.shape}" vertex[${i}] has non-finite coords (${v.x}, ${v.y})`
                        ).toBe(true);
                    }

                    // Non-zero bounding box (width × height > 0) — needed for ExtrudeGeometry walls
                    expect(def.width,  `Shape "${room.shape}" has zero width`).toBeGreaterThan(0);
                    expect(def.height, `Shape "${room.shape}" has zero height`).toBeGreaterThan(0);
                }
            });
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Global checks
    // ─────────────────────────────────────────────────────────────────────────

    it('all template names are unique', () => {
        const names = TEMPLATES.map(t => t.name);
        const seen = new Set<string>();
        const dups: string[] = [];
        for (const n of names) {
            if (seen.has(n)) dups.push(n);
            seen.add(n);
        }
        expect(dups, `Duplicate template names: ${dups.join(', ')}`).toHaveLength(0);
    });

    it('room IDs are globally unique across ALL templates (no cross-template collisions)', () => {
        const globalIds: string[] = [];
        for (const template of TEMPLATES) {
            const rooms = Object.values(template.layout.floors).flatMap(f => f.rooms);
            globalIds.push(...rooms.map(r => r.id));
        }
        const seen = new Set<string>();
        const dups: string[] = [];
        for (const id of globalIds) {
            if (seen.has(id)) dups.push(id);
            seen.add(id);
        }
        expect(dups, `Globally duplicate room IDs: ${dups.join(', ')}`).toHaveLength(0);
    });

    it('TEMPLATES array contains the expected 21 templates', () => {
        expect(TEMPLATES).toHaveLength(21);
    });
});

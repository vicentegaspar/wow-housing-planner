import React, { useMemo } from 'react';
import type { Layout } from '../types';
import { Room } from './Room';
import { ROOM_DEFINITIONS } from '../constants';

interface LayoutPreviewProps {
    layout: Layout;
    /** Max width of the preview in pixels */
    maxWidth?: number;
    /** Max height of the preview in pixels */
    maxHeight?: number;
    /** Whether to show all floors or just the first */
    showAllFloors?: boolean;
    className?: string;
}

/**
 * Renders a compact SVG preview of a layout's room structure.
 * Used in template tooltips and selection previews.
 */
export const LayoutPreview: React.FC<LayoutPreviewProps> = ({
    layout,
    maxWidth = 200,
    maxHeight = 140,
    showAllFloors = true,
    className = '',
}) => {
    const floorEntries = useMemo(() => {
        return Object.entries(layout.floors)
            .map(([num, data]) => ({ floorNumber: parseInt(num, 10), rooms: data.rooms || [] }))
            .filter((f) => f.floorNumber >= 1 && f.rooms.length > 0)
            .sort((a, b) => a.floorNumber - b.floorNumber);
    }, [layout.floors]);

    const previews = useMemo(() => {
        const floorsToShow = showAllFloors ? floorEntries : floorEntries.slice(0, 1);

        return floorsToShow.map(({ floorNumber, rooms }) => {
            let minX = Infinity,
                minY = Infinity,
                maxX = -Infinity,
                maxY = -Infinity;

            rooms.forEach((room) => {
                const def = ROOM_DEFINITIONS[room.shape];
                if (!def) return;
                const centerX = room.x + def.width / 2;
                const centerY = room.y + def.height / 2;
                const corners = [
                    { x: room.x, y: room.y },
                    { x: room.x + def.width, y: room.y },
                    { x: room.x, y: room.y + def.height },
                    { x: room.x + def.width, y: room.y + def.height },
                ];
                corners.forEach((corner) => {
                    const rad = (room.rotation * Math.PI) / 180;
                    const cos = Math.cos(rad);
                    const sin = Math.sin(rad);
                    const tx = corner.x - centerX;
                    const ty = corner.y - centerY;
                    const rx = tx * cos - ty * sin + centerX;
                    const ry = tx * sin + ty * cos + centerY;
                    minX = Math.min(minX, rx);
                    minY = Math.min(minY, ry);
                    maxX = Math.max(maxX, rx);
                    maxY = Math.max(maxY, ry);
                });
            });

            const padding = 20;
            const w = Math.max(maxX - minX + padding * 2, 1);
            const h = Math.max(maxY - minY + padding * 2, 1);

            return {
                floorNumber,
                viewBox: `${minX - padding} ${minY - padding} ${w} ${h}`,
                width: w,
                height: h,
                rooms,
            };
        });
    }, [floorEntries, showAllFloors]);

    if (previews.length === 0) {
        return (
            <div
                className={`flex items-center justify-center bg-gray-800/80 rounded border border-gray-600 ${className}`}
                style={{ width: maxWidth, height: maxHeight }}
            >
                <span className="text-gray-500 text-sm">No rooms</span>
            </div>
        );
    }

    const totalW = previews.reduce((s, p) => s + p.width, 0);
    const maxH = Math.max(...previews.map((p) => p.height));
    const scale = Math.min(maxWidth / totalW, maxHeight / maxH, 1);
    const displayW = totalW * scale;
    const displayH = maxH * scale;

    return (
        <div
            className={`flex items-center gap-1 bg-gray-800/90 rounded border border-gray-600 overflow-hidden ${className}`}
            style={{ width: displayW, height: displayH }}
        >
            {previews.map((p) => {
                const sw = p.width * scale;
                const sh = p.height * scale;
                return (
                    <div key={p.floorNumber} className="flex-shrink-0 flex flex-col items-center">
                        {previews.length > 1 && (
                            <span className="text-[10px] text-gray-400 mb-0.5">
                                Floor {p.floorNumber}
                            </span>
                        )}
                        <svg
                            width={sw}
                            height={sh}
                            viewBox={p.viewBox}
                            preserveAspectRatio="xMidYMid meet"
                            className="block"
                        >
                            {p.rooms.map((room) => (
                                <Room
                                    key={room.id}
                                    room={room}
                                    sectors={layout.sectors}
                                    isExporting={true}
                                    isGhost={false}
                                    className="fill-cyan-900/50 stroke-cyan-400 stroke-[1px]"
                                />
                            ))}
                        </svg>
                    </div>
                );
            })}
        </div>
    );
};

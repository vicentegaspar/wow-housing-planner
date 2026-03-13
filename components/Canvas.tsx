
import React, { forwardRef, useMemo } from 'react';
import type { Layout, Point, RoomInstance, DraggedRoom, Sector } from '../types';
import { Room } from './Room';
import { ROOM_DEFINITIONS } from '../constants';

interface CanvasProps {
    layout: Layout;
    currentFloor: number;
    lowerFloorRooms: RoomInstance[];
    zoom: number;
    pan: Point;
    isPanning: boolean;
    draggedRoom: DraggedRoom | null;
    selectedRoomId: string | null;
    isExporting: boolean;
    onWheel: (e: React.WheelEvent) => void;
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onExistingRoomDragStart: (room: RoomInstance, e: React.PointerEvent) => void;
    onRoomClick: (id: string) => void;
    assigningSectorId: string | null;
}

export const Canvas = forwardRef<HTMLDivElement, CanvasProps>(
    ({ layout, currentFloor, lowerFloorRooms, zoom, pan, isPanning, draggedRoom, selectedRoomId, isExporting, onWheel, onPointerDown, onPointerMove, onPointerUp, onExistingRoomDragStart, onRoomClick, assigningSectorId }, ref) => {
        const rooms = layout.floors[currentFloor]?.rooms || [];
        const sectors = layout.sectors || {};
        
        const assigningColor = useMemo(() => {
            if (!assigningSectorId || !sectors[assigningSectorId]) return null;
            return sectors[assigningSectorId].color;
        }, [assigningSectorId, sectors]);

        return (
            <div
                ref={ref}
                className="flex-1 min-h-0 bg-gray-800 overflow-hidden canvas-bg"
                style={{
                    backgroundSize: `${25 * zoom}px ${25 * zoom}px`,
                    backgroundPosition: `${pan.x}px ${pan.y}px`,
                    cursor: isPanning ? 'grabbing' : 'grab',
                    touchAction: 'none',
                }}
                onWheel={onWheel}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
            >
                <div
                    className="w-full h-full"
                    style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        transformOrigin: 'top left',
                    }}
                >
                    <svg id="floor-plan-svg" width="100%" height="100%" style={{ overflow: 'visible', pointerEvents: 'none' }}>
                        {/* Render ghost rooms for floor below */}
                        {lowerFloorRooms.map(room => (
                            <Room
                                key={`ghost-${room.id}`}
                                room={room}
                                sectors={sectors}
                                isGhost={true}
                            />
                        ))}

                        {/* Render existing rooms, filtering out the one being moved */}
                        {rooms
                            .filter(room => !(draggedRoom && !draggedRoom.isNew && room.id === draggedRoom.id))
                            .map(room => (
                            <Room
                                key={room.id}
                                room={room}
                                sectors={sectors}
                                isSelected={room.id === selectedRoomId}
                                isExporting={isExporting}
                                onPointerDown={(e) => {
                                    if (e.button === 1) return;
                                    e.stopPropagation();
                                    onExistingRoomDragStart(room, e);
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRoomClick(room.id);
                                }}
                                className="stroke-cyan-400 stroke-2"
                                isAssigning={!!assigningSectorId}
                                assigningColor={assigningColor}
                            />
                        ))}

                        {/* Render dragged room ghost */}
                        {draggedRoom && (
                            <Room
                                room={{
                                    id: 'dragged-ghost',
                                    shape: draggedRoom.shape,
                                    x: draggedRoom.x,
                                    y: draggedRoom.y,
                                    rotation: draggedRoom.rotation,
                                    sectorId: (draggedRoom as any).sectorId,
                                }}
                                sectors={sectors}
                                className="stroke-yellow-300 stroke-2 pointer-events-none"
                                data-id="dragged-ghost"
                            />
                        )}
                    </svg>
                </div>
            </div>
        );
    }
);

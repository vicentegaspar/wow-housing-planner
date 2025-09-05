import React from 'react';
import { RoomShape } from '../types';
import { ROOM_DEFINITIONS } from '../constants';
import { Room } from './Room';
import { Tooltip } from './Tooltip';

interface SidebarProps {
    onRoomDragStart: (shape: RoomShape, e: React.MouseEvent) => void;
}

const RoomPreview: React.FC<{
    shape: RoomShape;
    name: string;
    onMouseDown: (e: React.MouseEvent) => void;
}> = ({ shape, name, onMouseDown }) => {
    const { width, height, component: RoomComponent } = ROOM_DEFINITIONS[shape];
    return (
        <Tooltip text={`${name} (${width}x${height})`}>
            <div 
                className="p-2 cursor-grab bg-gray-800 hover:bg-gray-700/70 rounded-md transition-colors border border-transparent hover:border-yellow-400"
                onMouseDown={onMouseDown}
            >
                <svg viewBox={`-5 -5 ${width + 10} ${height + 10}`} className="w-full h-auto">
                    <RoomComponent className="fill-cyan-800 stroke-cyan-400 stroke-2" />
                </svg>
                <p className="text-center text-xs mt-1 text-gray-400 truncate">{name}</p>
            </div>
        </Tooltip>
    );
};


export const Sidebar: React.FC<SidebarProps> = ({ onRoomDragStart }) => {
    return (
        <aside className="w-64 wow-panel p-4 flex-shrink-0 overflow-y-auto border-r">
            <h2 className="text-xl font-title text-center text-yellow-400 border-b border-gray-600 pb-2 mb-4">Add Room</h2>
            <div className="grid grid-cols-2 gap-3">
                <RoomPreview name="Sm. Square" shape={RoomShape.SQUARE_SMALL} onMouseDown={(e) => onRoomDragStart(RoomShape.SQUARE_SMALL, e)} />
                <RoomPreview name="Square" shape={RoomShape.SQUARE} onMouseDown={(e) => onRoomDragStart(RoomShape.SQUARE, e)} />
                <RoomPreview name="Lg. Square" shape={RoomShape.LARGE_SQUARE} onMouseDown={(e) => onRoomDragStart(RoomShape.LARGE_SQUARE, e)} />
                <RoomPreview name="Rectangle" shape={RoomShape.RECTANGLE} onMouseDown={(e) => onRoomDragStart(RoomShape.RECTANGLE, e)} />
                <RoomPreview name="Wide Rect" shape={RoomShape.RECTANGLE_WIDE} onMouseDown={(e) => onRoomDragStart(RoomShape.RECTANGLE_WIDE, e)} />
                <RoomPreview name="Long Rect" shape={RoomShape.RECTANGLE_LONG} onMouseDown={(e) => onRoomDragStart(RoomShape.RECTANGLE_LONG, e)} />
                <RoomPreview name="Hallway" shape={RoomShape.HALLWAY} onMouseDown={(e) => onRoomDragStart(RoomShape.HALLWAY, e)} />
                <RoomPreview name="L-Shape" shape={RoomShape.L_SHAPED} onMouseDown={(e) => onRoomDragStart(RoomShape.L_SHAPED, e)} />
                <RoomPreview name="U-Shape" shape={RoomShape.U_SHAPED} onMouseDown={(e) => onRoomDragStart(RoomShape.U_SHAPED, e)} />
                <RoomPreview name="T-Shape" shape={RoomShape.T_SHAPED} onMouseDown={(e) => onRoomDragStart(RoomShape.T_SHAPED, e)} />
                <RoomPreview name="Cross" shape={RoomShape.CROSS_SHAPED} onMouseDown={(e) => onRoomDragStart(RoomShape.CROSS_SHAPED, e)} />
                <RoomPreview name="Octagon" shape={RoomShape.OCTAGONAL} onMouseDown={(e) => onRoomDragStart(RoomShape.OCTAGONAL, e)} />
                <RoomPreview name="Round" shape={RoomShape.ROUND_ROOM} onMouseDown={(e) => onRoomDragStart(RoomShape.ROUND_ROOM, e)} />
                <RoomPreview name="Stairs Up" shape={RoomShape.STAIRS_UP} onMouseDown={(e) => onRoomDragStart(RoomShape.STAIRS_UP, e)} />
                <RoomPreview name="Stairs Down" shape={RoomShape.STAIRS_DOWN} onMouseDown={(e) => onRoomDragStart(RoomShape.STAIRS_DOWN, e)} />
            </div>
        </aside>
    );
};
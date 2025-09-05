import React from 'react';
import { RoomShape, type RoomDefinition } from './types';

// GEOMETRIC SHAPES
const SquareRoom: React.FC<{ className?: string, style?: React.CSSProperties }> = ({ className, style }) => (
    <rect x="0" y="0" width="100" height="100" className={className} style={style}/>
);
const SquareRoomSmall: React.FC<{ className?: string, style?: React.CSSProperties }> = ({ className, style }) => (
    <rect x="0" y="0" width="50" height="50" className={className} style={style}/>
);
const LargeSquareRoom: React.FC<{ className?: string, style?: React.CSSProperties }> = ({ className, style }) => (
    <rect x="0" y="0" width="200" height="200" className={className} style={style}/>
);
const RectangleRoom: React.FC<{ className?: string, style?: React.CSSProperties }> = ({ className, style }) => (
    <rect x="0" y="0" width="150" height="75" className={className} style={style}/>
);
const RectangleRoomLong: React.FC<{ className?: string, style?: React.CSSProperties }> = ({ className, style }) => (
    <rect x="0" y="0" width="250" height="75" className={className} style={style}/>
);
const RectangleRoomWide: React.FC<{ className?: string, style?: React.CSSProperties }> = ({ className, style }) => (
    <rect x="0" y="0" width="150" height="125" className={className} style={style}/>
);
const HallwayRoom: React.FC<{ className?: string, style?: React.CSSProperties }> = ({ className, style }) => (
    <rect x="0" y="0" width="200" height="50" className={className} style={style}/>
);
const OctagonalRoom: React.FC<{ className?: string, style?: React.CSSProperties }> = ({ className, style }) => (
    <polygon points="30,0 70,0 100,30 100,70 70,100 30,100 0,70 0,30" className={className} style={style}/>
);
const RoundRoom: React.FC<{ className?: string, style?: React.CSSProperties }> = ({ className, style }) => (
    <circle cx="50" cy="50" r="50" className={className} style={style}/>
);

// COMPLEX SHAPES
const LShapedRoom: React.FC<{ className?: string, style?: React.CSSProperties }> = ({ className, style }) => (
    <polygon points="0,0 100,0 100,50 50,50 50,100 0,100" className={className} style={style}/>
);
const TRoom: React.FC<{ className?: string, style?: React.CSSProperties }> = ({ className, style }) => (
    <polygon points="0,0 150,0 150,50 100,50 100,150 50,150 50,50 0,50" className={className} style={style}/>
);
const CrossRoom: React.FC<{ className?: string, style?: React.CSSProperties }> = ({ className, style }) => (
    <polygon points="50,0 100,0 100,50 150,50 150,100 100,100 100,150 50,150 50,100 0,100 0,50 50,50" className={className} style={style}/>
);
const URoom: React.FC<{ className?: string, style?: React.CSSProperties }> = ({ className, style }) => (
    <polygon points="0,0 150,0 150,50 100,50 100,100 50,100 50,50 0,50" className={className} style={style}/>
);

// UTILITY SHAPES
const StairsUpRoom: React.FC<{ className?: string, style?: React.CSSProperties }> = ({ className, style }) => (
    <g className={className}>
        <rect x="0" y="0" width="50" height="100" style={style}/>
        <path d="M25 75 L25 25 M15 35 L25 20 L35 35"
            fill="none"
            strokeWidth="5" strokeOpacity="0.8" strokeLinecap="round" strokeLinejoin="round" />
    </g>
);

const StairsDownRoom: React.FC<{ className?: string, style?: React.CSSProperties }> = ({ className, style }) => (
    <g className={className}>
        <rect x="0" y="0" width="50" height="100" style={style}/>
        <path d="M25 25 L25 75 M15 65 L25 80 L35 65"
            fill="none"
            strokeWidth="5" strokeOpacity="0.8" strokeLinecap="round" strokeLinejoin="round" />
    </g>
);

const roundRoomVertices = Array.from({ length: 32 }, (_, i) => {
    const angle = (i / 32) * Math.PI * 2;
    return { x: 50 + 50 * Math.cos(angle), y: 50 + 50 * Math.sin(angle) };
});

export const ROOM_DEFINITIONS: Record<RoomShape, RoomDefinition> = {
    [RoomShape.SQUARE]: {
        width: 100, height: 100, component: SquareRoom, area: 10000,
        nodes: [{ x: 50, y: 0 }, { x: 100, y: 50 }, { x: 50, y: 100 }, { x: 0, y: 50 }],
        vertices: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }],
    },
    [RoomShape.SQUARE_SMALL]: {
        width: 50, height: 50, component: SquareRoomSmall, area: 2500,
        nodes: [{ x: 25, y: 0 }, { x: 50, y: 25 }, { x: 25, y: 50 }, { x: 0, y: 25 }],
        vertices: [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 50, y: 50 }, { x: 0, y: 50 }],
    },
    [RoomShape.LARGE_SQUARE]: {
        width: 200, height: 200, component: LargeSquareRoom, area: 40000,
        nodes: [{ x: 100, y: 0 }, { x: 200, y: 100 }, { x: 100, y: 200 }, { x: 0, y: 100 }],
        vertices: [{ x: 0, y: 0 }, { x: 200, y: 0 }, { x: 200, y: 200 }, { x: 0, y: 200 }],
    },
    [RoomShape.RECTANGLE]: {
        width: 150, height: 75, component: RectangleRoom, area: 11250,
        nodes: [{ x: 75, y: 0 }, { x: 150, y: 37.5 }, { x: 75, y: 75 }, { x: 0, y: 37.5 }],
        vertices: [{ x: 0, y: 0 }, { x: 150, y: 0 }, { x: 150, y: 75 }, { x: 0, y: 75 }],
    },
     [RoomShape.RECTANGLE_LONG]: {
        width: 250, height: 75, component: RectangleRoomLong, area: 18750,
        nodes: [{ x: 125, y: 0 }, { x: 250, y: 37.5 }, { x: 125, y: 75 }, { x: 0, y: 37.5 }],
        vertices: [{ x: 0, y: 0 }, { x: 250, y: 0 }, { x: 250, y: 75 }, { x: 0, y: 75 }],
    },
     [RoomShape.RECTANGLE_WIDE]: {
        width: 150, height: 125, component: RectangleRoomWide, area: 18750,
        nodes: [{ x: 75, y: 0 }, { x: 150, y: 62.5 }, { x: 75, y: 125 }, { x: 0, y: 62.5 }],
        vertices: [{ x: 0, y: 0 }, { x: 150, y: 0 }, { x: 150, y: 125 }, { x: 0, y: 125 }],
    },
    [RoomShape.HALLWAY]: {
        width: 200, height: 50, component: HallwayRoom, area: 10000,
        nodes: [{ x: 100, y: 0 }, { x: 200, y: 25 }, { x: 100, y: 50 }, { x: 0, y: 25 }],
        vertices: [{ x: 0, y: 0 }, { x: 200, y: 0 }, { x: 200, y: 50 }, { x: 0, y: 50 }],
    },
    [RoomShape.OCTAGONAL]: {
        width: 100, height: 100, component: OctagonalRoom, area: 8284,
        nodes: [
            { x: 50, y: 0 }, { x: 85.35, y: 14.65 }, { x: 100, y: 50 }, { x: 85.35, y: 85.35 },
            { x: 50, y: 100 }, { x: 14.65, y: 85.35 }, { x: 0, y: 50 }, { x: 14.65, y: 14.65 }
        ],
        vertices: [ { x: 30, y: 0 }, { x: 70, y: 0 }, { x: 100, y: 30 }, { x: 100, y: 70 }, { x: 70, y: 100 }, { x: 30, y: 100 }, { x: 0, y: 70 }, { x: 0, y: 30 } ],
    },
    [RoomShape.ROUND_ROOM]: {
        width: 100, height: 100, component: RoundRoom, area: 7854,
        nodes: [
             { x: 50, y: 0 }, { x: 100, y: 50 }, { x: 50, y: 100 }, { x: 0, y: 50 }
        ],
        vertices: roundRoomVertices,
    },
    [RoomShape.L_SHAPED]: {
        width: 100, height: 100, component: LShapedRoom, area: 7500,
        nodes: [ { x: 50, y: 0 }, { x: 100, y: 25 }, { x: 75, y: 50 }, { x: 50, y: 75 }, { x: 25, y: 100 }, { x: 0, y: 50 } ],
        vertices: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 50 }, { x: 50, y: 50 }, { x: 50, y: 100 }, { x: 0, y: 100 }],
    },
    [RoomShape.T_SHAPED]: {
        width: 150, height: 150, component: TRoom, area: 12500,
        nodes: [ { x: 75, y: 0 }, { x: 150, y: 25 }, { x: 125, y: 50 }, { x: 75, y: 150 }, { x: 25, y: 50 }, { x: 0, y: 25 } ],
        vertices: [{ x: 0, y: 0 }, { x: 150, y: 0 }, { x: 150, y: 50 }, { x: 100, y: 50 }, { x: 100, y: 150 }, { x: 50, y: 150 }, { x: 50, y: 50 }, { x: 0, y: 50 }],
    },
    [RoomShape.CROSS_SHAPED]: {
        width: 150, height: 150, component: CrossRoom, area: 12500,
        nodes: [ { x: 75, y: 0 }, { x: 125, y: 50 }, { x: 150, y: 75 }, { x: 125, y: 100 }, { x: 75, y: 150 }, { x: 25, y: 100 }, { x: 0, y: 75 }, { x: 25, y: 50 } ],
        vertices: [ { x: 50, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 50 }, { x: 150, y: 50 }, { x: 150, y: 100 }, { x: 100, y: 100 }, { x: 100, y: 150 }, { x: 50, y: 150 }, { x: 50, y: 100 }, { x: 0, y: 100 }, { x: 0, y: 50 }, { x: 50, y: 50 } ],
    },
    [RoomShape.U_SHAPED]: {
        width: 150, height: 100, component: URoom, area: 10000,
        nodes: [ { x: 75, y: 0 }, { x: 150, y: 25 }, { x: 125, y: 50 }, { x: 75, y: 100 }, { x: 25, y: 50 }, { x: 0, y: 25 } ],
        vertices: [{ x: 0, y: 0 }, { x: 150, y: 0 }, { x: 150, y: 50 }, { x: 100, y: 50 }, { x: 100, y: 100 }, { x: 50, y: 100 }, { x: 50, y: 50 }, { x: 0, y: 50 }],
    },
    [RoomShape.STAIRS_UP]: {
        width: 50, height: 100, component: StairsUpRoom, area: 5000,
        nodes: [{ x: 25, y: 0 }, { x: 50, y: 50 }, { x: 25, y: 100 }, { x: 0, y: 50 }],
        vertices: [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 50, y: 100 }, { x: 0, y: 100 }],
    },
    [RoomShape.STAIRS_DOWN]: {
        width: 50, height: 100, component: StairsDownRoom, area: 5000,
        nodes: [{ x: 25, y: 0 }, { x: 50, y: 50 }, { x: 25, y: 100 }, { x: 0, y: 50 }],
        vertices: [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 50, y: 100 }, { x: 0, y: 100 }],
    },
};

export const SNAP_DISTANCE = 20;

export const SECTOR_COLORS = [
    { name: "Stormwind Blue", hex: "#1a3c8c" },
    { name: "Orgrimmar Red", hex: "#8c1a1a" },
    { name: "Verdant Forest", hex: "#266d3a" },
    { name: "Dalaran Violet", hex: "#5a2d91" },
    { name: "Stonemason Grey", hex: "#555555" },
    { name: "Sunwell Gold", hex: "#b08b00" },
    { name: "Gnomish Pink", hex: "#de55a4" },
    { name: "Scholarly Purple", hex: "#4b0082" },
    { name: "Earthen Brown", hex: "#8b4513" },
    { name: "Tidal Turquoise", hex: "#1e828c" },
];
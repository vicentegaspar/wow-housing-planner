
import React from 'react';

export interface Point {
    x: number;
    y: number;
}

export enum RoomShape {
    SQUARE = 'SQUARE',
    SQUARE_SMALL = 'SQUARE_SMALL',
    LARGE_SQUARE = 'LARGE_SQUARE',
    RECTANGLE = 'RECTANGLE',
    RECTANGLE_LONG = 'RECTANGLE_LONG',
    RECTANGLE_WIDE = 'RECTANGLE_WIDE',
    OCTAGONAL = 'OCTAGONAL',
    L_SHAPED = 'L_SHAPED',
    STAIRS_UP = 'STAIRS_UP',
    STAIRS_DOWN = 'STAIRS_DOWN',
    HALLWAY = 'HALLWAY',
    T_SHAPED = 'T_SHAPED',
    CROSS_SHAPED = 'CROSS_SHAPED',
    U_SHAPED = 'U_SHAPED',
    ROUND_ROOM = 'ROUND_ROOM',
}

export interface RoomDefinition {
    width: number;
    height: number;
    component: React.FC<{className?: string, style?: React.CSSProperties}>;
    nodes: Point[];
    vertices: Point[];
    area: number; // Area in square units
}

export interface RoomInstance {
    id: string;
    shape: RoomShape;
    x: number;
    y: number;
    rotation: number;
    sectorId?: string;
    isExporting?: boolean;
}

export interface FloorLayout {
    rooms: RoomInstance[];
    name?: string;
}

export interface Sector {
    id: string;
    name: string;
    color: string;
    description: string;
    /** Base64 data URL (e.g. data:image/png;base64,...) for 3D wall/floor texture */
    textureData?: string;
}

export interface Asset3D {
    id: string;
    name: string;
    url?: string; // Optional URL to a .glb/.gltf file
    x: number;
    y: number;
    z: number;
    rotationX: number;
    rotationY: number;
    rotationZ: number;
    scale: number;
    floorIndex: number;
}

export interface Layout {
    floors: { [floor: number]: FloorLayout };
    sectors: Record<string, Sector>;
    assets3D?: Asset3D[];
}

export interface DraggedRoom {
    isNew: boolean;
    id?: string;
    shape: RoomShape;
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
    rotation: number;
    sectorId?: string;
    isExporting?: boolean;
}
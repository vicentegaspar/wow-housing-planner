import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomShape, RoomInstance, FloorLayout, Layout, Sector } from '../../types';
import { ROOM_DEFINITIONS } from '../../constants';

const WALL_HEIGHT = 40;
const WALL_THICKNESS = 2;
const FLOOR_SEPARATION = 60;

const ROOM_SHAPE_NAMES: Record<RoomShape, string> = {
    [RoomShape.SQUARE]: 'Square',
    [RoomShape.SQUARE_SMALL]: 'Sm. Square',
    [RoomShape.LARGE_SQUARE]: 'Lg. Square',
    [RoomShape.RECTANGLE]: 'Rectangle',
    [RoomShape.RECTANGLE_LONG]: 'Long Rect',
    [RoomShape.RECTANGLE_WIDE]: 'Wide Rect',
    [RoomShape.OCTAGONAL]: 'Octagon',
    [RoomShape.L_SHAPED]: 'L-Shape',
    [RoomShape.STAIRS_UP]: 'Stairs Up',
    [RoomShape.STAIRS_DOWN]: 'Stairs Down',
    [RoomShape.HALLWAY]: 'Hallway',
    [RoomShape.T_SHAPED]: 'T-Shape',
    [RoomShape.CROSS_SHAPED]: 'Cross',
    [RoomShape.U_SHAPED]: 'U-Shape',
    [RoomShape.ROUND_ROOM]: 'Round',
};

/** Create texture from base64 data URL; configures for PBR map use. */
function textureFromDataUrl(dataUrl: string): THREE.Texture {
    const tex = new THREE.TextureLoader().load(dataUrl);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    tex.anisotropy = 4;
    return tex;
}

/** Builds a billboard sprite with text drawn on a canvas texture. */
function makeRoomLabel(text: string, accentColor: string): THREE.Sprite {
    const W = 256, H = 64;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'rgba(10, 14, 22, 0.82)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = accentColor;
    ctx.fillRect(0, 0, 8, H);
    ctx.fillStyle = '#e8dfc0';
    ctx.font = 'bold 24px system-ui, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, (W + 8) / 2, H / 2, W - 24);

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        sizeAttenuation: true,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.userData.isLabel = true;
    return sprite;
}

export class HouseBuilder {
    private wallCache = new Map<string, THREE.MeshStandardMaterial>();
    private floorCache = new Map<string, THREE.MeshStandardMaterial>();
    private roofCache = new Map<string, THREE.MeshStandardMaterial>();

    public getWallMaterial(sectorColor?: string, textureData?: string): THREE.MeshStandardMaterial {
        const key = `${sectorColor ?? 'default'}_${textureData ? 'tex' : 'col'}`;
        if (this.wallCache.has(key)) return this.wallCache.get(key)!;

        const mat = new THREE.MeshStandardMaterial({
            color: sectorColor ?? 0xcccccc,
            roughness: 0.75,
            metalness: 0.15,
            side: THREE.DoubleSide,
        });
        if (textureData) {
            try {
                const tex = textureFromDataUrl(textureData);
                mat.map = tex;
                mat.color.set(0xffffff);
            } catch {
                /* fallback to color */
            }
        }
        this.wallCache.set(key, mat);
        return mat;
    }

    public getFloorMaterial(sectorColor?: string, textureData?: string): THREE.MeshStandardMaterial {
        const key = `floor_${sectorColor ?? 'default'}_${textureData ? 'tex' : 'col'}`;
        if (this.floorCache.has(key)) return this.floorCache.get(key)!;

        const mat = new THREE.MeshStandardMaterial({
            color: sectorColor ?? 0x888888,
            roughness: 0.9,
            metalness: 0.05,
            side: THREE.DoubleSide,
        });
        if (textureData) {
            try {
                const tex = textureFromDataUrl(textureData);
                mat.map = tex;
                mat.color.set(0xffffff);
            } catch {
                /* fallback */
            }
        }
        this.floorCache.set(key, mat);
        return mat;
    }

    public getRoofMaterial(sectorColor?: string): THREE.MeshStandardMaterial {
        const key = `roof_${sectorColor ?? 'default'}`;
        if (this.roofCache.has(key)) return this.roofCache.get(key)!;

        const mat = new THREE.MeshStandardMaterial({
            color: sectorColor ?? 0x4a4a52,
            roughness: 0.7,
            metalness: 0.2,
            side: THREE.DoubleSide,
        });
        this.roofCache.set(key, mat);
        return mat;
    }

    public cleanup() {
        [this.wallCache, this.floorCache, this.roofCache].forEach((cache) => {
            cache.forEach((m) => {
                if (m.map) m.map.dispose();
                m.dispose();
            });
            cache.clear();
        });
    }

    public buildFloorLayout(scene: THREE.Scene, layout: Layout, MAX_FLOORS: number): boolean {
        let hasAnyRooms = false;

        for (const [floorNum, floorData] of Object.entries(layout.floors) as [string, FloorLayout][]) {
            const floorIndex = parseInt(floorNum, 10);
            if (floorIndex < 1 || floorIndex > MAX_FLOORS) continue;
            const yPos = (floorIndex - 1) * FLOOR_SEPARATION;

            for (const room of floorData.rooms || []) {
                hasAnyRooms = true;
                const def = ROOM_DEFINITIONS[room.shape];
                if (!def) continue;

                const sector = room.sectorId ? layout.sectors[room.sectorId] : undefined;
                const roomColor = sector?.color;
                const textureData = sector?.textureData;

                const wallMat = this.getWallMaterial(roomColor, textureData);
                const floorMat = this.getFloorMaterial(roomColor, textureData);
                const roofMat = this.getRoofMaterial(roomColor);

                const geometryGroup = new THREE.Group();

                const shape = new THREE.Shape(def.vertices.map((p) => new THREE.Vector2(p.x, p.y)));

                const floorGeom = new THREE.ShapeGeometry(shape);
                const floorMesh = new THREE.Mesh(floorGeom, floorMat);
                floorMesh.rotation.x = -Math.PI / 2;
                floorMesh.receiveShadow = true;
                geometryGroup.add(floorMesh);

                for (let i = 0; i < def.vertices.length; i++) {
                    const p1 = def.vertices[i];
                    const p2 = def.vertices[(i + 1) % def.vertices.length];
                    const length = Math.hypot(p2.x - p1.x, p2.y - p1.y);
                    if (length < 0.1) continue;

                    const wallGeom = new RoundedBoxGeometry(length, WALL_HEIGHT, WALL_THICKNESS, 2, 0.4);
                    const wallMesh = new THREE.Mesh(wallGeom, wallMat);

                    wallMesh.position.set(
                        p1.x + (p2.x - p1.x) / 2,
                        WALL_HEIGHT / 2,
                        p1.y + (p2.y - p1.y) / 2
                    );
                    wallMesh.rotation.y = Math.atan2(p2.y - p1.y, p2.x - p1.x);
                    wallMesh.castShadow = true;
                    wallMesh.receiveShadow = true;
                    geometryGroup.add(wallMesh);
                }

                const roofGeom = new THREE.ShapeGeometry(shape);
                const roofMesh = new THREE.Mesh(roofGeom, roofMat);
                roofMesh.rotation.x = -Math.PI / 2;
                roofMesh.position.y = WALL_HEIGHT;
                roofMesh.receiveShadow = true;
                geometryGroup.add(roofMesh);

                const pivotGroup = new THREE.Group();
                pivotGroup.userData.isLayoutGeometry = true;
                pivotGroup.userData.floorIndex = floorIndex;
                scene.add(pivotGroup);
                pivotGroup.add(geometryGroup);

                const roomCenterX = def.width / 2;
                const roomCenterZ = def.height / 2;

                geometryGroup.position.set(-roomCenterX, 0, -roomCenterZ);
                pivotGroup.rotation.y = THREE.MathUtils.degToRad(room.rotation);
                pivotGroup.position.set(room.x + roomCenterX, yPos, room.y + roomCenterZ);

                const labelText = sector?.name ?? ROOM_SHAPE_NAMES[room.shape] ?? room.shape;
                const labelColor = roomColor ?? '#888888';
                const sprite = makeRoomLabel(labelText, labelColor);
                const labelWidth = Math.max(def.width, def.height) * 0.75;
                sprite.scale.set(labelWidth, labelWidth / 4, 1);
                sprite.position.set(0, WALL_HEIGHT + labelWidth / 8 + 6, 0);
                sprite.userData.floorIndex = floorIndex;
                pivotGroup.add(sprite);
            }
        }
        
        return hasAnyRooms;
    }
}


import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Layout, RoomShape } from '../types';
import { MAX_FLOORS } from '../layoutFloors';
import { ROOM_DEFINITIONS } from '../constants';
import { motion } from 'framer-motion';

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

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

/** Create texture from base64 data URL; configures for PBR map use. */
function textureFromDataUrl(dataUrl: string): THREE.Texture {
    const tex = new THREE.TextureLoader().load(dataUrl);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    tex.anisotropy = 4;
    return tex;
}

interface ThreeDViewProps {
    layout: Layout;
    onClose: () => void;
}

const MAX_PIXEL_RATIO = 2;

const ThreeDView: React.FC<ThreeDViewProps> = ({ layout, onClose }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hiddenFloors, setHiddenFloors] = useState<Set<number>>(new Set());
    const [showLabels, setShowLabels] = useState(true);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const pmremRef = useRef<THREE.PMREMGenerator | null>(null);

    const wallCache = useRef<Map<string, THREE.MeshStandardMaterial>>(new Map());
    const floorCache = useRef<Map<string, THREE.MeshStandardMaterial>>(new Map());
    const roofCache = useRef<Map<string, THREE.MeshStandardMaterial>>(new Map());

    const getWallMaterial = useCallback((sectorColor?: string, textureData?: string): THREE.MeshStandardMaterial => {
        const key = `${sectorColor ?? 'default'}_${textureData ? 'tex' : 'col'}`;
        if (wallCache.current.has(key)) return wallCache.current.get(key)!;

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
        wallCache.current.set(key, mat);
        return mat;
    }, []);

    const getFloorMaterial = useCallback((sectorColor?: string, textureData?: string): THREE.MeshStandardMaterial => {
        const key = `floor_${sectorColor ?? 'default'}_${textureData ? 'tex' : 'col'}`;
        if (floorCache.current.has(key)) return floorCache.current.get(key)!;

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
        floorCache.current.set(key, mat);
        return mat;
    }, []);

    const getRoofMaterial = useCallback((sectorColor?: string): THREE.MeshStandardMaterial => {
        const key = `roof_${sectorColor ?? 'default'}`;
        if (roofCache.current.has(key)) return roofCache.current.get(key)!;

        const mat = new THREE.MeshStandardMaterial({
            color: sectorColor ?? 0x4a4a52,
            roughness: 0.7,
            metalness: 0.2,
            side: THREE.DoubleSide,
        });
        roofCache.current.set(key, mat);
        return mat;
    }, []);

    useEffect(() => {
        if (!mountRef.current) return;

        let animationFrameId: number;
        let isMounted = true;
        const currentMount = mountRef.current;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0d1017);
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(60, currentMount.clientWidth / currentMount.clientHeight, 1, 10000);
        camera.position.set(0, 200, 300);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
        });
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;

        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        rendererRef.current = renderer;
        currentMount.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.06;
        controls.screenSpacePanning = true;
        controls.minDistance = 20;
        controls.maxDistance = 8000;
        controls.maxPolarAngle = Math.PI * 0.495;
        controls.zoomSpeed = 0.85;
        controls.rotateSpeed = 0.65;
        controls.mouseButtons = {
            LEFT: THREE.MOUSE.PAN,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.ROTATE,
        };
        controls.touches = {
            ONE: THREE.TOUCH.PAN,
            TWO: THREE.TOUCH.DOLLY_ROTATE,
        };
        controlsRef.current = controls;

        const hemi = new THREE.HemisphereLight(0xb8c4e8, 0x1a1d24, 0.55);
        scene.add(hemi);

        const dirLight = new THREE.DirectionalLight(0xfff5e6, 1.25);
        dirLight.position.set(120, 280, 180);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 1;
        dirLight.shadow.camera.far = 2000;
        dirLight.shadow.camera.left = -400;
        dirLight.shadow.camera.right = 400;
        dirLight.shadow.camera.top = 400;
        dirLight.shadow.camera.bottom = -400;
        dirLight.shadow.bias = -0.0001;
        scene.add(dirLight);

        const fill = new THREE.DirectionalLight(0xaaccff, 0.35);
        fill.position.set(-80, 120, -100);
        scene.add(fill);

        const pmrem = new THREE.PMREMGenerator(renderer);
        pmrem.compileEquirectangularShader();
        pmremRef.current = pmrem;

        new RGBELoader().load(
            'https://threejs.org/examples/textures/equirectangular/venice_sunset_1k.hdr',
            (tex) => {
                if (!isMounted) return;
                tex.mapping = THREE.EquirectangularReflectionMapping;
                const env = pmrem.fromEquirectangular(tex).texture;
                scene.environment = env;
                tex.dispose();
            },
            undefined,
            () => {
                const canvas = document.createElement('canvas');
                canvas.width = 2;
                canvas.height = 2;
                const ctx = canvas.getContext('2d')!;
                ctx.fillStyle = '#1a1d24';
                ctx.fillRect(0, 0, 2, 2);
                const fallback = new THREE.CanvasTexture(canvas);
                fallback.mapping = THREE.EquirectangularReflectionMapping;
                scene.environment = pmrem.fromEquirectangular(fallback).texture;
                fallback.dispose();
            }
        );

        const animate = () => {
            if (!isMounted) return;
            animationFrameId = requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        const onResize = () => {
            if (!isMounted || !currentMount) return;
            const w = currentMount.clientWidth;
            const h = currentMount.clientHeight;
            if (w < 1 || h < 1) return;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener('resize', onResize);
        const ro = new ResizeObserver(onResize);
        ro.observe(currentMount);

        setTimeout(() => setIsLoading(false), 500);

        return () => {
            isMounted = false;
            cancelAnimationFrame(animationFrameId);
            ro.disconnect();
            window.removeEventListener('resize', onResize);
            if (currentMount && renderer.domElement.parentNode === currentMount) {
                currentMount.removeChild(renderer.domElement);
            }
            controls.dispose();
            renderer.dispose();
            pmrem.dispose();
            pmremRef.current = null;
            cameraRef.current = null;
            controlsRef.current = null;
            rendererRef.current = null;

            [wallCache, floorCache, roofCache].forEach((cacheRef) => {
                cacheRef.current.forEach((m) => {
                    if (m.map) m.map.dispose();
                    m.dispose();
                });
                cacheRef.current.clear();
            });
        };
    }, []);

    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene) return;

        const toRemove = scene.children.filter((c) => c.userData.isLayoutGeometry);
        toRemove.forEach((obj) => {
            if (obj instanceof THREE.Group) {
                obj.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.geometry.dispose();
                    }
                    if (child instanceof THREE.Sprite) {
                        (child.material as THREE.SpriteMaterial).map?.dispose();
                        child.material.dispose();
                    }
                });
            }
        });
        scene.remove(...toRemove);

        let hasAnyRooms = false;

        for (const [floorNum, floorData] of Object.entries(layout.floors)) {
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

                const wallMat = getWallMaterial(roomColor, textureData);
                const floorMat = getFloorMaterial(roomColor, textureData);
                const roofMat = getRoofMaterial(roomColor);

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

                    const wallGeom = new THREE.BoxGeometry(length, WALL_HEIGHT, WALL_THICKNESS);
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

                const labelText =
                    sector?.name ?? ROOM_SHAPE_NAMES[room.shape] ?? room.shape;
                const labelColor = roomColor ?? '#888888';
                const sprite = makeRoomLabel(labelText, labelColor);
                const labelWidth = Math.max(def.width, def.height) * 0.75;
                sprite.scale.set(labelWidth, labelWidth / 4, 1);
                sprite.position.set(0, WALL_HEIGHT + labelWidth / 8 + 6, 0);
                sprite.userData.floorIndex = floorIndex;
                pivotGroup.add(sprite);
            }
        }

        if (hasAnyRooms) {
            const box = new THREE.Box3();
            scene.traverse((obj) => {
                if (obj.userData.isLayoutGeometry && obj instanceof THREE.Group) {
                    box.union(new THREE.Box3().setFromObject(obj));
                }
            });
            const camera = cameraRef.current;
            const controls = controlsRef.current;
            if (camera && controls && !box.isEmpty()) {
                const center = new THREE.Vector3();
                const size = new THREE.Vector3();
                box.getCenter(center);
                box.getSize(size);
                const maxDim = Math.max(size.x, size.y, size.z, 1);
                const fov = camera.fov * (Math.PI / 180);
                const dist = (maxDim / 2 / Math.tan(fov / 2)) * 1.45;
                camera.position.set(center.x + dist * 0.35, center.y + size.y * 0.5 + dist * 0.25, center.z + dist);
                controls.target.copy(center);
                controls.update();
            }
        }
    }, [layout, getWallMaterial, getFloorMaterial, getRoofMaterial]);

    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene) return;
        scene.traverse((obj) => {
            if (obj instanceof THREE.Sprite) obj.visible = showLabels;
        });
    }, [showLabels, layout]);

    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene) return;
        scene.children.forEach((child) => {
            if (child.userData.isLayoutGeometry) {
                child.visible = !hiddenFloors.has(child.userData.floorIndex as number);
            }
        });
    }, [hiddenFloors]);

    const floorsWithRooms = useMemo(
        () =>
            Object.entries(layout.floors)
                .filter(([, f]) => f.rooms?.length)
                .map(([n]) => parseInt(n, 10))
                .sort((a, b) => a - b),
        [layout.floors]
    );

    const toggleFloor = (floorIndex: number) => {
        setHiddenFloors((prev) => {
            const next = new Set(prev);
            if (next.has(floorIndex)) next.delete(floorIndex);
            else next.add(floorIndex);
            return next;
        });
    };

    const soloFloor = (floorIndex: number) => {
        setHiddenFloors((prev) => {
            const isSoloed =
                prev.size === floorsWithRooms.length - 1 && !prev.has(floorIndex);
            if (isSoloed) return new Set();
            return new Set(floorsWithRooms.filter((f) => f !== floorIndex));
        });
    };

    return (
        <motion.div
            className="absolute inset-0 bg-black/70 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-50">
                    <div className="text-center">
                        <svg
                            className="animate-spin h-10 w-10 text-yellow-400 mx-auto"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        <p className="font-title text-xl text-yellow-400 mt-4">Rendering 3D View...</p>
                    </div>
                </div>
            )}
            <div ref={mountRef} className="w-full h-full" />
            <div className="absolute top-4 left-4 flex flex-col gap-3 z-50">
                <div className="wow-panel p-3 border-l text-sm max-w-xs">
                    <h3 className="font-title text-lg text-yellow-400 mb-2">3D Controls</h3>
                    <ul className="list-disc list-inside text-gray-300 mb-3">
                        <li><span className="font-bold">Left-Click + Drag:</span> Pan</li>
                        <li><span className="font-bold">Right-Click + Drag:</span> Rotate</li>
                        <li><span className="font-bold">Scroll Wheel:</span> Zoom</li>
                    </ul>
                    <button
                        onClick={() => setShowLabels((v) => !v)}
                        className={`flex items-center gap-2 w-full px-2 py-1 rounded transition-colors text-left ${
                            showLabels ? 'text-gray-200 hover:bg-gray-700/50' : 'text-gray-500 hover:bg-gray-700/30'
                        }`}
                        title={showLabels ? 'Hide room labels' : 'Show room labels'}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                            className={`flex-shrink-0 ${showLabels ? 'text-yellow-400' : 'text-gray-600'}`}
                        >
                            <path d="M0 4a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V4zm1 0v8h14V4H1zm1 1h4v1H2V5zm0 2h4v1H2V7zm0 2h4v1H2V9zm5-4h6v1H7V5zm0 2h6v1H7V7zm0 2h6v1H7V9z" />
                        </svg>
                        <span>Room Labels</span>
                    </button>
                </div>

                {floorsWithRooms.length > 1 && (
                    <div className="wow-panel p-3 border-l text-sm max-w-xs">
                        <h3 className="font-title text-base text-yellow-400 mb-2">Floor Visibility</h3>
                        <div className="flex flex-col gap-1">
                            {floorsWithRooms.map((floorIndex) => {
                                const isVisible = !hiddenFloors.has(floorIndex);
                                const isSoloed =
                                    hiddenFloors.size === floorsWithRooms.length - 1 &&
                                    !hiddenFloors.has(floorIndex);
                                return (
                                    <div key={floorIndex} className="flex items-center gap-1">
                                        <button
                                            onClick={() => toggleFloor(floorIndex)}
                                            className={`flex items-center gap-2 flex-1 px-2 py-1 rounded transition-colors text-left ${
                                                isVisible
                                                    ? 'text-gray-200 hover:bg-gray-700/50'
                                                    : 'text-gray-500 hover:bg-gray-700/30'
                                            }`}
                                            title={isVisible ? `Hide Floor ${floorIndex}` : `Show Floor ${floorIndex}`}
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="14"
                                                height="14"
                                                fill="currentColor"
                                                viewBox="0 0 16 16"
                                                className={`flex-shrink-0 ${isVisible ? 'text-yellow-400' : 'text-gray-600'}`}
                                            >
                                                {isVisible ? (
                                                    <>
                                                        <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z" />
                                                        <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z" />
                                                    </>
                                                ) : (
                                                    <>
                                                        <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z" />
                                                        <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z" />
                                                        <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z" />
                                                    </>
                                                )}
                                            </svg>
                                            <span>Floor {floorIndex}</span>
                                        </button>
                                        <button
                                            onClick={() => soloFloor(floorIndex)}
                                            title={isSoloed ? 'Restore all floors' : `Solo Floor ${floorIndex}`}
                                            className={`px-1.5 py-0.5 rounded text-xs font-bold transition-colors border ${
                                                isSoloed
                                                    ? 'border-yellow-400 text-yellow-400 bg-yellow-400/10'
                                                    : 'border-gray-600 text-gray-500 hover:border-gray-400 hover:text-gray-300'
                                            }`}
                                        >
                                            S
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                        {hiddenFloors.size > 0 && (
                            <button
                                onClick={() => setHiddenFloors(new Set())}
                                className="mt-2 w-full text-xs text-gray-400 hover:text-yellow-400 transition-colors text-center"
                            >
                                Show all floors
                            </button>
                        )}
                    </div>
                )}
            </div>

            <button
                onClick={onClose}
                className="absolute top-4 right-4 wow-button px-4 py-2 z-50"
                aria-label="Close 3D View"
            >
                Close 3D View
            </button>
        </motion.div>
    );
};

export { ThreeDView };
export default ThreeDView;

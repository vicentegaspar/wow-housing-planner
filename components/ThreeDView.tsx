
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Layout, RoomShape } from '../types';
import { MAX_FLOORS } from '../layoutFloors';
import { ROOM_DEFINITIONS } from '../constants';
import { motion } from 'framer-motion';

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

const WALL_HEIGHT = 40;
const WALL_THICKNESS = 2;
const FLOOR_SEPARATION = 60;

const ASSET_PRESETS = [
    { name: 'Custom URL...', url: '' },
    { name: 'Robot (Test)', url: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/RobotExpressive/RobotExpressive.glb' },
    { name: 'Parrot (Test)', url: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/Parrot.glb' },
    { name: 'Primary Ion Drive (Test)', url: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/PrimaryIonDrive.glb' }
];

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
    setLayout: (newState: Layout | ((prevState: Layout) => Layout)) => void;
    onClose: () => void;
}

const MAX_PIXEL_RATIO = 2;

const ThreeDView: React.FC<ThreeDViewProps> = ({ layout, setLayout, onClose }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hiddenFloors, setHiddenFloors] = useState<Set<number>>(new Set());
    const [showLabels, setShowLabels] = useState(true);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const transformControlsRef = useRef<TransformControls | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const pmremRef = useRef<THREE.PMREMGenerator | null>(null);
    
    // UI states
    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
    const [newAssetUrl, setNewAssetUrl] = useState('');
    const [newAssetName, setNewAssetName] = useState('');
    const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
    
    // Track loaded assets slightly outside react state to avoid constant remounting
    const loadedAssetsCache = useRef<Map<string, THREE.Group>>(new Map());

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

        const transformControls = new TransformControls(camera, renderer.domElement);
        transformControls.addEventListener('dragging-changed', function (event) {
            controls.enabled = !event.value;
        });
        
        // When drag finishes, update the actual layout state via setLayout
        transformControls.addEventListener('mouseUp', function () {
            if (transformControls.object && transformControls.object.userData.assetId) {
                const assetId = transformControls.object.userData.assetId;
                const pos = transformControls.object.position;
                const rot = transformControls.object.rotation;
                const scale = transformControls.object.scale.x; // assuming uniform scale
                
                setLayout((prev) => {
                    const assets = prev.assets3D || [];
                    const index = assets.findIndex(a => a.id === assetId);
                    if (index === -1) return prev;
                    
                    const newAssets = [...assets];
                    newAssets[index] = {
                        ...newAssets[index],
                        x: pos.x,
                        y: pos.y,
                        z: pos.z,
                        rotationX: rot.x,
                        rotationY: rot.y,
                        rotationZ: rot.z,
                        scale: scale
                    };
                    return { ...prev, assets3D: newAssets };
                });
            }
        });
        scene.add(transformControls.getHelper());
        transformControlsRef.current = transformControls;

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
            transformControls.dispose();
            renderer.dispose();
            pmrem.dispose();
            pmremRef.current = null;
            cameraRef.current = null;
            controlsRef.current = null;
            transformControlsRef.current = null;
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

        for (const [floorNum, floorData] of Object.entries(layout.floors) as [string, import('../types').FloorLayout][]) {
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

                    // Use RoundedBoxGeometry instead of BoxGeometry
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
    }, [layout.floors, layout.sectors, getWallMaterial, getFloorMaterial, getRoofMaterial]);

    // Handle Asset3D spawning and loading
    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene) return;

        // Cleanup old assets that might no longer exist
        const currentAssetIds = new Set((layout.assets3D || []).map(a => a.id));
        const toRemove = scene.children.filter(c => c.userData.isAsset && !currentAssetIds.has(c.userData.assetId));
        toRemove.forEach(obj => {
            if (transformControlsRef.current?.object === obj) {
                transformControlsRef.current.detach();
            }
            scene.remove(obj);
        });

        // Add or update assets
        const assets = layout.assets3D || [];
        assets.forEach(asset => {
            const isVisible = !hiddenFloors.has(asset.floorIndex);
            
            // Check if it already exists in scene
            let assetGroup = scene.children.find(c => c.userData.isAsset && c.userData.assetId === asset.id) as THREE.Group;
            
            if (!assetGroup) {
                assetGroup = new THREE.Group();
                assetGroup.userData.isAsset = true;
                assetGroup.userData.assetId = asset.id;
                assetGroup.userData.floorIndex = asset.floorIndex;
                scene.add(assetGroup);

                if (asset.url) {
                    // Try to load GLTF
                    const loader = new GLTFLoader();
                    loader.load(asset.url, (gltf) => {
                        gltf.scene.traverse((child) => {
                            if ((child as THREE.Mesh).isMesh) {
                                child.castShadow = true;
                                child.receiveShadow = true;
                            }
                        });
                        // Center bounds
                        const box = new THREE.Box3().setFromObject(gltf.scene);
                        const center = box.getCenter(new THREE.Vector3());
                        gltf.scene.position.sub(center);
                        // Bottom align it
                        gltf.scene.position.y += (box.max.y - box.min.y) / 2;
                        
                        assetGroup.add(gltf.scene);
                    }, undefined, (e) => {
                        console.error('Failed to load asset URL', e);
                        addPlaceholder(assetGroup);
                    });
                } else {
                    addPlaceholder(assetGroup);
                }
            }

            // Sync visual transform representation
            assetGroup.position.set(asset.x, asset.y, asset.z);
            assetGroup.rotation.set(asset.x, asset.rotationY, asset.rotationZ);
            assetGroup.scale.set(asset.scale, asset.scale, asset.scale);
            assetGroup.visible = isVisible;
        });

        function addPlaceholder(group: THREE.Group) {
            const geom = new THREE.BoxGeometry(20, 20, 20);
            const mat = new THREE.MeshStandardMaterial({ color: 0xaa22ff });
            const mesh = new THREE.Mesh(geom, mat);
            mesh.position.y = 10; // Half height so origins sit on floor
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            group.add(mesh);
        }
    }, [layout.assets3D, hiddenFloors]);
    
    // Raycaster for selecting assets
    useEffect(() => {
        const mount = mountRef.current;
        const camera = cameraRef.current;
        const scene = sceneRef.current;
        if (!mount || !camera || !scene) return;

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const onPointerDown = (event: PointerEvent) => {
             // Only select if it's a left click and we aren't clicking UI
            if (event.button !== 0) return;
            const target = event.target as HTMLElement;
            if (target !== mount.querySelector('canvas')) return;

            const rect = mount.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);

            // Find all asset groups
            const assetGroups = scene.children.filter(c => c.userData.isAsset && c.visible);
            
            // Check intersection deeply through the groups
            const intersects = raycaster.intersectObjects(assetGroups, true);

            if (intersects.length > 0) {
                // Find nearest parent group
                let object: THREE.Object3D | null = intersects[0].object;
                while (object && !object.userData.isAsset) {
                    object = object.parent;
                }
                
                if (object && object.userData.assetId) {
                    setSelectedAssetId(object.userData.assetId);
                    transformControlsRef.current?.attach(object);
                }
            } else {
                // Deselect if we clicked empty space AND aren't hovering over transform manipulators
                if (transformControlsRef.current && !transformControlsRef.current.dragging) {
                     // Check if hovered over transform control itself mapping
                    const tcIntersects = raycaster.intersectObjects([transformControlsRef.current], true);
                    if (tcIntersects.length === 0) {
                         setSelectedAssetId(null);
                         transformControlsRef.current.detach();
                    }
                }
            }
        };

        mount.addEventListener('pointerdown', onPointerDown);
        return () => mount.removeEventListener('pointerdown', onPointerDown);
    }, []);

    // Change transform control mode
    useEffect(() => {
        if (transformControlsRef.current) {
            transformControlsRef.current.setMode(transformMode);
        }
    }, [transformMode]);

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
            (Object.entries(layout.floors) as [string, import('../types').FloorLayout][])
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

    const handleAddAsset = (e: React.FormEvent) => {
        e.preventDefault();
        const baseFloorY = (floorsWithRooms[0] ? floorsWithRooms[0] - 1 : 0) * FLOOR_SEPARATION;
        const newAsset = {
            id: crypto.randomUUID(),
            name: newAssetName || 'New Asset',
            url: newAssetUrl.trim() || undefined,
            x: 0,
            y: baseFloorY,
            z: 0,
            rotationX: 0,
            rotationY: 0,
            rotationZ: 0,
            scale: 1,
            floorIndex: floorsWithRooms[0] || 1
        };
        setLayout(prev => ({
            ...prev,
            assets3D: [...(prev.assets3D || []), newAsset]
        }));
        setNewAssetName('');
        setNewAssetUrl('');
        setSelectedAssetId(newAsset.id);
        
        // Wait for next tick so effect adds to scene, then attach
        setTimeout(() => {
            const scene = sceneRef.current;
            if (!scene) return;
            const group = scene.children.find(c => c.userData.assetId === newAsset.id);
            if (group && transformControlsRef.current) {
                transformControlsRef.current.attach(group);
            }
        }, 50);
    };

    const handleDeleteAsset = (id: string) => {
        if (selectedAssetId === id) {
             setSelectedAssetId(null);
             transformControlsRef.current?.detach();
        }
        setLayout(prev => ({
            ...prev,
            assets3D: (prev.assets3D || []).filter(a => a.id !== id)
        }));
    };

    const handleExportAssetsJSON = () => {
        const assets = layout.assets3D || [];
        const jsonString = JSON.stringify(assets, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "wow-housing-assets.json";
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImportAssetsJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedAssets = JSON.parse(event.target?.result as string);
                if (!Array.isArray(importedAssets)) throw new Error("File must contain array of assets");
                
                // Add unique ids to newly imported ones
                const sanitized = importedAssets.map(a => ({
                    ...a,
                    id: crypto.randomUUID()
                }));

                setLayout(prev => ({
                    ...prev,
                    assets3D: [...(prev.assets3D || []), ...sanitized]
                }));
                alert(`Successfully imported ${sanitized.length} assets.`);
            } catch (err) {
                alert("Invalid JSON file uploaded.");
            }
            e.target.value = ''; // Reset file input
        };
        reader.readAsText(file);
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

            {/* Asset Manager Panel */}
            <div className="absolute top-4 right-4 flex flex-col gap-3 z-50 w-72 pointer-events-none">
                <button
                    onClick={onClose}
                    className="wow-button px-4 py-2 pointer-events-auto self-end"
                    aria-label="Close 3D View"
                >
                    Close 3D View
                </button>
                
                <div className="wow-panel p-3 border-l text-sm pointer-events-auto max-h-[80vh] flex flex-col">
                    <h3 className="font-title text-base text-yellow-400 mb-2">3D Asset Manager</h3>
                    
                    <form onSubmit={handleAddAsset} className="flex flex-col gap-2 mb-4 bg-gray-800/50 p-2 rounded">
                        <input
                            type="text"
                            placeholder="Asset Name (e.g. Table)"
                            value={newAssetName}
                            onChange={(e) => setNewAssetName(e.target.value)}
                            className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs w-full"
                        />
                        <select 
                            className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs w-full text-gray-200"
                            onChange={(e) => {
                                const url = e.target.value;
                                setNewAssetUrl(url);
                                if (url && !newAssetName) {
                                    const preset = ASSET_PRESETS.find(p => p.url === url);
                                    if (preset) setNewAssetName(preset.name.replace(' (Test)', ''));
                                }
                            }}
                            value={ASSET_PRESETS.find(p => p.url === newAssetUrl) ? newAssetUrl : ''}
                        >
                            {ASSET_PRESETS.map((preset, i) => (
                                <option key={i} value={preset.url}>{preset.name}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            placeholder=".glb/.gltf URL (optional)"
                            value={newAssetUrl}
                            onChange={(e) => setNewAssetUrl(e.target.value)}
                            className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs w-full"
                        />
                        <button type="submit" className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-1 px-2 rounded text-xs">
                            Add Asset to Floor
                        </button>
                    </form>

                    {selectedAssetId && (
                        <div className="flex gap-1 mb-3 bg-gray-900 p-1 rounded justify-center">
                            <button onClick={() => setTransformMode('translate')} className={`px-2 py-1 text-xs rounded ${transformMode === 'translate' ? 'bg-yellow-500/20 text-yellow-400' : 'text-gray-400 hover:bg-gray-800'}`}>Move</button>
                            <button onClick={() => setTransformMode('rotate')} className={`px-2 py-1 text-xs rounded ${transformMode === 'rotate' ? 'bg-yellow-500/20 text-yellow-400' : 'text-gray-400 hover:bg-gray-800'}`}>Rotate</button>
                            <button onClick={() => setTransformMode('scale')} className={`px-2 py-1 text-xs rounded ${transformMode === 'scale' ? 'bg-yellow-500/20 text-yellow-400' : 'text-gray-400 hover:bg-gray-800'}`}>Scale</button>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto mb-3 min-h-[100px] border border-gray-700 rounded bg-gray-900/50 p-1">
                        {!(layout.assets3D?.length) && <p className="text-gray-500 italic text-center text-xs p-2">No assets added.</p>}
                        {layout.assets3D?.map(asset => (
                            <div key={asset.id} className={`flex items-center justify-between p-1.5 rounded text-xs mb-1 ${selectedAssetId === asset.id ? 'bg-yellow-600/30 border border-yellow-600/50' : 'hover:bg-gray-800'}`}>
                                <button 
                                    className="text-left flex-1 truncate pr-2 text-gray-200" 
                                    onClick={() => {
                                        setSelectedAssetId(asset.id);
                                        const scene = sceneRef.current;
                                        if (scene && transformControlsRef.current) {
                                            const group = scene.children.find(c => c.userData.assetId === asset.id);
                                            if (group) transformControlsRef.current.attach(group);
                                        }
                                    }}
                                >
                                    {asset.name}
                                </button>
                                <button onClick={() => handleDeleteAsset(asset.id)} className="text-red-400 hover:text-red-300 w-5 h-5 flex items-center justify-center rounded hover:bg-red-400/20">×</button>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <button onClick={handleExportAssetsJSON} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-1 px-2 rounded text-xs">
                            Export JSON
                        </button>
                        
                        <label className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-1 px-2 rounded text-xs cursor-pointer text-center">
                            Import JSON
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleImportAssetsJSON}
                                className="hidden"
                            />
                        </label>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export { ThreeDView };
export default ThreeDView;

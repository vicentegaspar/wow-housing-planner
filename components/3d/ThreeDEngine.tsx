
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Layout } from '../../types';
import { MAX_FLOORS } from '../../layoutFloors';
import { motion } from 'framer-motion';

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

import { HouseBuilder } from './HouseBuilder';
import { AssetManagerUI, ASSET_PRESETS } from './AssetManagerUI';

const FLOOR_SEPARATION = 60;
const MAX_PIXEL_RATIO = 2;

interface ThreeDEngineProps {
    layout: Layout;
    setLayout: (newState: Layout | ((prevState: Layout) => Layout)) => void;
    onClose: () => void;
}

const ThreeDEngine: React.FC<ThreeDEngineProps> = ({ layout, setLayout, onClose }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hiddenFloors, setHiddenFloors] = useState<Set<number>>(new Set());
    const [showLabels, setShowLabels] = useState(true);
    
    // Core Three.js Refs
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
    
    // Persistent Builder Instance
    const builder = useMemo(() => new HouseBuilder(), []);

    // 1. Initialization
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

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
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
        controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
        controlsRef.current = controls;

        const transformControls = new TransformControls(camera, renderer.domElement);
        transformControls.addEventListener('dragging-changed', (e) => controls.enabled = !e.value);
        transformControls.addEventListener('mouseUp', () => {
            if (transformControls.object && transformControls.object.userData.assetId) {
                const id = transformControls.object.userData.assetId;
                const pos = transformControls.object.position;
                const rot = transformControls.object.rotation;
                const scale = transformControls.object.scale.x;
                setLayout((prev) => {
                    const assets = [...(prev.assets3D || [])];
                    const idx = assets.findIndex(a => a.id === id);
                    if (idx === -1) return prev;
                    assets[idx] = { ...assets[idx], x: pos.x, y: pos.y, z: pos.z, rotationX: rot.x, rotationY: rot.y, rotationZ: rot.z, scale };
                    return { ...prev, assets3D: assets };
                });
            }
        });
        scene.add(transformControls.getHelper());
        transformControlsRef.current = transformControls;

        // Environment & Lights
        scene.add(new THREE.HemisphereLight(0xb8c4e8, 0x1a1d24, 0.55));
        const dirLight = new THREE.DirectionalLight(0xfff5e6, 1.25);
        dirLight.position.set(120, 280, 180);
        dirLight.castShadow = true;
        scene.add(dirLight);

        const pmrem = new THREE.PMREMGenerator(renderer);
        pmremRef.current = pmrem;
        new RGBELoader().load('https://threejs.org/examples/textures/equirectangular/venice_sunset_1k.hdr', (tex) => {
            if (!isMounted) return;
            tex.mapping = THREE.EquirectangularReflectionMapping;
            scene.environment = pmrem.fromEquirectangular(tex).texture;
            tex.dispose();
        });

        const animate = () => {
            if (!isMounted) return;
            animationFrameId = requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        const onResize = () => {
            if (!isMounted || !currentMount) return;
            camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        };
        window.addEventListener('resize', onResize);

        setTimeout(() => setIsLoading(false), 500);

        return () => {
            isMounted = false;
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', onResize);
            currentMount.removeChild(renderer.domElement);
            controls.dispose();
            transformControls.dispose();
            renderer.dispose();
            pmrem.dispose();
            builder.cleanup();
        };
    }, []);

    // 2. House Rendering Layer
    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene) return;

        const toRemove = scene.children.filter((c) => c.userData.isLayoutGeometry);
        toRemove.forEach((obj) => {
            scene.remove(obj);
            if (obj instanceof THREE.Group) {
                obj.traverse((child) => {
                    if (child instanceof THREE.Mesh) child.geometry.dispose();
                });
            }
        });

        const hasAnyRooms = builder.buildFloorLayout(scene, layout, MAX_FLOORS);

        if (hasAnyRooms) {
            const box = new THREE.Box3();
            scene.traverse((obj) => { if (obj.userData.isLayoutGeometry) box.union(new THREE.Box3().setFromObject(obj)); });
            if (cameraRef.current && controlsRef.current && !box.isEmpty()) {
                const center = new THREE.Vector3();
                const size = new THREE.Vector3();
                box.getCenter(center);
                box.getSize(size);
                const dist = (Math.max(size.x, size.y, size.z) / 2 / Math.tan(cameraRef.current.fov * Math.PI / 360)) * 1.45;
                cameraRef.current.position.set(center.x + dist * 0.35, center.y + size.y * 0.5 + dist * 0.25, center.z + dist);
                controlsRef.current.target.copy(center);
                controlsRef.current.update();
            }
        }
    }, [layout.floors, layout.sectors, builder]);

    // 3. Asset3D Sync Layer
    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene) return;

        const currentAssetIds = new Set((layout.assets3D || []).map(a => a.id));
        scene.children.filter(c => c.userData.isAsset && !currentAssetIds.has(c.userData.assetId)).forEach(obj => {
            if (transformControlsRef.current?.object === obj) transformControlsRef.current.detach();
            scene.remove(obj);
        });

        (layout.assets3D || []).forEach(asset => {
            let assetGroup = scene.children.find(c => c.userData.isAsset && c.userData.assetId === asset.id) as THREE.Group;
            if (!assetGroup) {
                assetGroup = new THREE.Group();
                assetGroup.userData = { isAsset: true, assetId: asset.id, floorIndex: asset.floorIndex };
                scene.add(assetGroup);
                if (asset.url) {
                    new GLTFLoader().load(asset.url, (gltf) => {
                        gltf.scene.traverse(c => { if ((c as THREE.Mesh).isMesh) { c.castShadow = c.receiveShadow = true; } });
                        const b = new THREE.Box3().setFromObject(gltf.scene);
                        gltf.scene.position.sub(b.getCenter(new THREE.Vector3()));
                        gltf.scene.position.y += (b.max.y - b.min.y) / 2;
                        assetGroup.add(gltf.scene);
                    }, undefined, () => addPlaceholder(assetGroup));
                } else addPlaceholder(assetGroup);
            }
            assetGroup.position.set(asset.x, asset.y, asset.z);
            assetGroup.rotation.set(asset.rotationX || 0, asset.rotationY || 0, asset.rotationZ || 0);
            assetGroup.scale.set(asset.scale, asset.scale, asset.scale);
            assetGroup.visible = !hiddenFloors.has(asset.floorIndex);
        });

        function addPlaceholder(group: THREE.Group) {
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(20, 20, 20), new THREE.MeshStandardMaterial({ color: 0xaa22ff }));
            mesh.position.y = 10;
            mesh.castShadow = mesh.receiveShadow = true;
            group.add(mesh);
        }
    }, [layout.assets3D, hiddenFloors]);

    // 4. Interaction (Selection)
    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;
        const onDown = (e: PointerEvent) => {
            if (e.button !== 0 || e.target !== mount.querySelector('canvas')) return;
            const r = mount.getBoundingClientRect();
            const mouse = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
            const ray = new THREE.Raycaster();
            ray.setFromCamera(mouse, cameraRef.current!);
            const hits = ray.intersectObjects(sceneRef.current!.children.filter(c => c.userData.isAsset && c.visible), true);
            if (hits.length > 0) {
                let obj: THREE.Object3D | null = hits[0].object;
                while (obj && !obj.userData.isAsset) obj = obj.parent;
                if (obj) {
                    setSelectedAssetId(obj.userData.assetId);
                    transformControlsRef.current?.attach(obj);
                }
            } else if (transformControlsRef.current && !transformControlsRef.current.dragging) {
                if (ray.intersectObjects([transformControlsRef.current], true).length === 0) {
                    setSelectedAssetId(null);
                    transformControlsRef.current.detach();
                }
            }
        };
        mount.addEventListener('pointerdown', onDown);
        return () => mount.removeEventListener('pointerdown', onDown);
    }, []);

    useEffect(() => { transformControlsRef.current?.setMode(transformMode); }, [transformMode]);

    // UI Helpers
    const floorsWithRooms = useMemo(() => 
        (Object.entries(layout.floors) as [string, import('../../types').FloorLayout][])
            .filter(([, f]) => f.rooms?.length)
            .map(([n]) => parseInt(n,10))
            .sort((a,b)=>a-b), 
    [layout.floors]);

    const handleAddAsset = (e: React.FormEvent) => {
        e.preventDefault();
        const baseFloorY = (floorsWithRooms[0] ? floorsWithRooms[0] - 1 : 0) * FLOOR_SEPARATION;
        const id = crypto.randomUUID();
        setLayout(prev => ({
            ...prev,
            assets3D: [...(prev.assets3D || []), { id, name: newAssetName || 'Asset', url: newAssetUrl.trim() || undefined, x: 0, y: baseFloorY, z: 0, rotationX:0, rotationY: 0, rotationZ: 0, scale: 1, floorIndex: floorsWithRooms[0] || 1 }]
        }));
        setNewAssetName(''); setNewAssetUrl(''); setSelectedAssetId(id);
        setTimeout(() => {
            const group = sceneRef.current?.children.find(c => c.userData.assetId === id);
            if (group) transformControlsRef.current?.attach(group);
        }, 50);
    };

    return (
        <motion.div className="absolute inset-0 bg-black/70 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {isLoading && <div className="absolute inset-0 flex items-center justify-center z-50">Loading...</div>}
            <div ref={mountRef} className="w-full h-full" />
            
            <AssetManagerUI 
                layout={layout}
                onClose={onClose}
                newAssetName={newAssetName}
                setNewAssetName={setNewAssetName}
                newAssetUrl={newAssetUrl}
                setNewAssetUrl={setNewAssetUrl}
                handleAddAsset={handleAddAsset}
                selectedAssetId={selectedAssetId}
                setSelectedAssetId={setSelectedAssetId}
                transformMode={transformMode}
                setTransformMode={setTransformMode}
                handleDeleteAsset={(id) => setLayout(prev => ({ ...prev, assets3D: (prev.assets3D || []).filter(a => a.id !== id) }))}
                handleExportAssetsJSON={() => {
                    const assets = layout.assets3D || [];
                    const jsonString = JSON.stringify(assets, null, 2);
                    const blob = new Blob([jsonString], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "wow-housing-assets.json";
                    a.click();
                    URL.revokeObjectURL(url);
                }}
                handleImportAssetsJSON={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        try {
                            const importedAssets = JSON.parse(event.target?.result as string);
                            if (!Array.isArray(importedAssets)) throw new Error("File must contain array of assets");
                            const sanitized = importedAssets.map(a => ({ ...a, id: crypto.randomUUID() }));
                            setLayout(prev => ({ ...prev, assets3D: [...(prev.assets3D || []), ...sanitized] }));
                        } catch (err) { alert("Invalid JSON file uploaded."); }
                        e.target.value = '';
                    };
                    reader.readAsText(file);
                }}
                onAssetSelectIn3DMenu={(id) => {
                    setSelectedAssetId(id);
                    const g = sceneRef.current?.children.find(c => c.userData.assetId === id);
                    if (g) transformControlsRef.current?.attach(g);
                }}
            />
        </motion.div>
    );
};

export default ThreeDEngine;

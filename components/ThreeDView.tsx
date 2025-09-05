
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Layout } from '../types';
import { ROOM_DEFINITIONS } from '../constants';
import { motion } from 'framer-motion';

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const WALL_HEIGHT = 40;
const FLOOR_SEPARATION = 60; // Increased separation for better visibility between floors

interface ThreeDViewProps {
    layout: Layout;
    onClose: () => void;
}

export const ThreeDView: React.FC<ThreeDViewProps> = ({ layout, onClose }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const sceneRef = useRef<THREE.Scene | null>(null);

    // Memoize materials for performance
    const materials = useMemo(() => ({
        wall: new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            roughness: 0.8,
            metalness: 0.2
        }),
        floor: new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.9,
            metalness: 0.1
        }),
        roof: new THREE.MeshStandardMaterial({
            color: 0x4a4a52, // Default roof color
            roughness: 0.7,
            metalness: 0.2
        }),
    }), []);

    const roofSectorMaterialCache = useRef<Record<string, THREE.MeshStandardMaterial>>({});
    const getRoofMaterial = (color?: string) => {
        if (!color) return materials.roof;
        if (!roofSectorMaterialCache.current[color]) {
            roofSectorMaterialCache.current[color] = materials.roof.clone();
            roofSectorMaterialCache.current[color].color.set(color);
        }
        return roofSectorMaterialCache.current[color];
    };
    
    const wallSectorMaterialCache = useRef<Record<string, THREE.MeshStandardMaterial>>({});
    const getWallMaterial = (color?: string) => {
        if (!color) return materials.wall;
        if (!wallSectorMaterialCache.current[color]) {
            wallSectorMaterialCache.current[color] = materials.wall.clone();
            wallSectorMaterialCache.current[color].color.set(color);
        }
        return wallSectorMaterialCache.current[color];
    };

    // Effect for ONE-TIME scene setup
    useEffect(() => {
        if (!mountRef.current) return;
        
        let animationFrameId: number;
        let isMounted = true;
        const currentMount = mountRef.current;

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0d1017);
        sceneRef.current = scene;
        
        const camera = new THREE.PerspectiveCamera(60, currentMount.clientWidth / currentMount.clientHeight, 1, 10000);
        camera.position.set(0, 200, 300);
        
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        currentMount.appendChild(renderer.domElement);
        
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        camera.userData.controls = controls; // Attach for later access

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
        dirLight.position.set(100, 200, 150);
        scene.add(dirLight);

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
        
        // Hide loader after a short delay to allow initial render
        setTimeout(() => setIsLoading(false), 500);

        return () => {
            isMounted = false;
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', onResize);
            if (currentMount && renderer.domElement) {
                currentMount.removeChild(renderer.domElement);
            }
            controls.dispose();
            renderer.dispose();
            Object.values(roofSectorMaterialCache.current).forEach(m => m.dispose());
            roofSectorMaterialCache.current = {};
            Object.values(wallSectorMaterialCache.current).forEach(m => m.dispose());
            wallSectorMaterialCache.current = {};
        };
    }, []);

    // Effect for rebuilding geometry when layout changes
    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene) return;

        // Clear existing layout geometry
        const objectsToRemove = scene.children.filter(child => child.userData.isLayoutGeometry);
        objectsToRemove.forEach(obj => {
            if (obj instanceof THREE.Group) {
                obj.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.geometry.dispose();
                    }
                });
            }
        });
        scene.remove(...objectsToRemove);

        let hasAnyRooms = false;

        // Rebuild geometry
        for (const [floorNum, floorData] of Object.entries(layout.floors)) {
            const yPos = (parseInt(floorNum, 10) -1) * FLOOR_SEPARATION;
            for (const room of (floorData.rooms || [])) {
                hasAnyRooms = true;
                const definition = ROOM_DEFINITIONS[room.shape];
                if (!definition) continue;

                const roomColor = layout.sectors[room.sectorId]?.color;
                const wallMaterial = getWallMaterial(roomColor);

                // This group contains the geometry, centered on its local origin
                const geometryGroup = new THREE.Group();
                
                // Floor
                const shape = new THREE.Shape(definition.vertices.map(p => new THREE.Vector2(p.x, p.y)));
                const floorGeom = new THREE.ShapeGeometry(shape);
                const floorMesh = new THREE.Mesh(floorGeom, materials.floor);
                floorMesh.rotation.x = -Math.PI / 2; // Lay flat
                geometryGroup.add(floorMesh);

                // Walls
                for (let i = 0; i < definition.vertices.length; i++) {
                    const p1 = definition.vertices[i];
                    const p2 = definition.vertices[(i + 1) % definition.vertices.length];
                    const length = Math.hypot(p2.x - p1.x, p2.y - p1.y);
                    if (length < 0.1) continue;

                    const wallGeom = new THREE.BoxGeometry(length, WALL_HEIGHT, 2); // Use a thin box for walls
                    const wallMesh = new THREE.Mesh(wallGeom, wallMaterial);
                    
                    wallMesh.position.set(
                        p1.x + (p2.x - p1.x) / 2,
                        WALL_HEIGHT / 2,
                        p1.y + (p2.y - p1.y) / 2
                    );
                    wallMesh.rotation.y = Math.atan2(p2.y - p1.y, p2.x - p1.x);
                    geometryGroup.add(wallMesh);
                }
                
                // Roof
                const roofMesh = floorMesh.clone();
                roofMesh.position.y = WALL_HEIGHT;
                roofMesh.material = getRoofMaterial(roomColor);
                geometryGroup.add(roofMesh);

                // This pivot group handles rotation and final positioning
                const pivotGroup = new THREE.Group();
                pivotGroup.userData.isLayoutGeometry = true;
                scene.add(pivotGroup);
                pivotGroup.add(geometryGroup);

                const roomCenterX = definition.width / 2;
                const roomCenterZ = definition.height / 2;

                // 1. Move the geometry so its center is at the pivot's origin
                geometryGroup.position.set(-roomCenterX, 0, -roomCenterZ);
                // 2. Rotate the pivot
                pivotGroup.rotation.y = THREE.MathUtils.degToRad(room.rotation);
                // 3. Position the pivot in the world
                pivotGroup.position.set(room.x + roomCenterX, yPos, room.y + roomCenterZ);
            }
        }
        
        // Auto-frame the view
        if (hasAnyRooms) {
            const box = new THREE.Box3();
            const layoutContainer = new THREE.Object3D();
            scene.children.forEach(child => {
                if(child.userData.isLayoutGeometry) {
                    layoutContainer.add(child.clone());
                }
            })

            if(layoutContainer.children.length > 0) {
                box.setFromObject(layoutContainer);
                const center = new THREE.Vector3();
                const size = new THREE.Vector3();
                box.getCenter(center);
                box.getSize(size);
    
                const camera = scene.getObjectByProperty('isPerspectiveCamera', true) as THREE.PerspectiveCamera;
                if (camera && camera.userData.controls) {
                    const maxDim = Math.max(size.x, size.y, size.z);
                    const fov = camera.fov * (Math.PI / 180);
                    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
                    cameraZ *= 1.5; // Add some padding
    
                    camera.position.set(center.x, center.y + size.y, center.z + cameraZ);
    
                    const controls = camera.userData.controls;
                    controls.target.copy(center);
                    controls.update();
                }
            }
        }
    }, [layout, materials]);

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
                        <svg className="animate-spin h-10 w-10 text-yellow-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="font-title text-xl text-yellow-400 mt-4">Rendering 3D View...</p>
                    </div>
                </div>
            )}
            <div ref={mountRef} className="w-full h-full" />
            <div className="absolute top-4 left-4 wow-panel p-3 border-l z-50 text-sm max-w-xs">
                <h3 className="font-title text-lg text-yellow-400 mb-2">3D Controls</h3>
                <ul className="list-disc list-inside text-gray-300">
                    <li><span className="font-bold">Left-Click + Drag:</span> Rotate</li>
                    <li><span className="font-bold">Right-Click + Drag:</span> Pan</li>
                    <li><span className="font-bold">Scroll Wheel:</span> Zoom</li>
                </ul>
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

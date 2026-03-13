
import { useState, useEffect, useCallback, useRef } from 'react';
import type { Layout, RoomInstance, RoomShape, Point, DraggedRoom, Sector } from '../types';
import { ROOM_DEFINITIONS, SNAP_DISTANCE } from '../constants';
import { clampLayoutFloors, MAX_FLOORS } from '../layoutFloors';
import { rotatePoint } from '../utils';

const initialLayout: Layout = { floors: { 1: { rooms: [] } }, sectors: {} };

// A new hook for state history management
export const useHistory = <T,>(initialState: T) => {
    const [state, setState] = useState({
        past: [] as T[],
        present: initialState,
        future: [] as T[],
    });

    const canUndo = state.past.length > 0;
    const canRedo = state.future.length > 0;

    const set = useCallback((newState: T | ((prevState: T) => T)) => {
        setState(currentState => {
            const newPresent = newState instanceof Function ? newState(currentState.present) : newState;
            
            if (JSON.stringify(newPresent) === JSON.stringify(currentState.present)) {
                return currentState; // Don't add to history if state is identical
            }

            return {
                past: [...currentState.past, currentState.present],
                present: newPresent,
                future: [],
            };
        });
    }, []);

    const undo = useCallback(() => {
        if (!canUndo) return;
        setState(currentState => {
            const previous = currentState.past[currentState.past.length - 1];
            const newPast = currentState.past.slice(0, currentState.past.length - 1);
            return {
                past: newPast,
                present: previous,
                future: [currentState.present, ...currentState.future],
            };
        });
    }, [canUndo]);

    const redo = useCallback(() => {
        if (!canRedo) return;
        setState(currentState => {
            const next = currentState.future[0];
            const newFuture = currentState.future.slice(1);
            return {
                past: [...currentState.past, currentState.present],
                present: next,
                future: newFuture,
            };
        });
    }, [canRedo]);
    
    const reset = useCallback((newState: T) => {
        setState({
            past: [],
            present: newState,
            future: [],
        });
    }, []);

    return { state: state.present, set, reset, undo, redo, canUndo, canRedo };
};

// ===================================================================================
// Modal and UI State Management
// ===================================================================================
export const useModalManager = () => {
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [is3DViewOpen, setIs3DViewOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isSectorPanelOpen, setIsSectorPanelOpen] = useState(false);
    const [showStartupModal, setShowStartupModal] = useState(false);
    return {
        isImportModalOpen, setIsImportModalOpen,
        isExportModalOpen, setIsExportModalOpen,
        is3DViewOpen, setIs3DViewOpen,
        isExporting, setIsExporting,
        isSectorPanelOpen, setIsSectorPanelOpen,
        showStartupModal, setShowStartupModal,
    };
};

// ===================================================================================
// Layout and Data Management
// ===================================================================================
export const useLayoutManager = (showStartupModal: boolean, setShowStartupModal: React.Dispatch<React.SetStateAction<boolean>>) => {
    const { 
        state: layout, 
        set: setLayout, 
        reset: resetLayout, 
        undo, 
        redo, 
        canUndo, 
        canRedo 
    } = useHistory<Layout>(initialLayout);
    const [currentFloor, setCurrentFloor] = useState(1);

    useEffect(() => {
        try {
            const savedLayout = localStorage.getItem('wow-house-layout');
            if (savedLayout) {
                const parsed = JSON.parse(savedLayout);
                const hasAnyRooms = Object.values(parsed.floors || {}).some((f: any) => f.rooms && f.rooms.length > 0);
                if (parsed.floors && hasAnyRooms) {
                    const merged = { sectors: parsed.sectors || {}, floors: parsed.floors || {} } as Layout;
                    const { layout: clamped } = clampLayoutFloors(merged);
                    resetLayout(clamped);
                } else {
                    localStorage.removeItem('wow-house-layout');
                    setShowStartupModal(true);
                }
            } else {
                setShowStartupModal(true);
            }
        } catch (error) {
            console.error("Failed to load layout from local storage", error);
            localStorage.removeItem('wow-house-layout');
            resetLayout(initialLayout);
            setShowStartupModal(true);
        }
    }, [setShowStartupModal, resetLayout]);

    useEffect(() => {
        try {
            const hasAnyRooms = Object.values(layout.floors).some(f => f.rooms.length > 0);
            if (!hasAnyRooms && showStartupModal) return;
            localStorage.setItem('wow-house-layout', JSON.stringify(layout));
        } catch(error) {
            console.error("Failed to save layout to local storage", error);
        }
    }, [layout, showStartupModal]);

    const handleFloorChange = useCallback((direction: 'up' | 'down') => {
        setCurrentFloor(newFloor => {
            const updatedFloor = direction === 'up' ? newFloor + 1 : newFloor - 1;
            if (updatedFloor >= 1 && updatedFloor <= MAX_FLOORS) {
                return updatedFloor;
            }
            return newFloor;
        });
    }, []);

    const handleSaveSector = (sector: Sector) => {
        setLayout(prev => ({
            ...prev,
            sectors: { ...prev.sectors, [sector.id]: sector }
        }));
    };
    
    const handleDeleteSector = (sectorId: string) => {
        setLayout(prev => {
            const newSectors = { ...prev.sectors };
            delete newSectors[sectorId];

            const newFloors = { ...prev.floors };
            Object.keys(newFloors).forEach(floorNum => {
                newFloors[Number(floorNum)].rooms = newFloors[Number(floorNum)].rooms.map(r => 
                    r.sectorId === sectorId ? { ...r, sectorId: undefined } : r
                );
            });
            
            return { sectors: newSectors, floors: newFloors };
        });
    };

    const handleImportLayout = useCallback((importString: string) => {
         if (!importString.trim()) {
            alert("Import data cannot be empty.");
            return false;
        }
        if (!window.confirm("Are you sure you want to import? This will overwrite your current project.")) {
            return false;
        }
        let jsonString: string;
        try {
            JSON.parse(importString);
            jsonString = importString;
        } catch (jsonError) {
            try {
                jsonString = decodeURIComponent(escape(atob(importString)));
            } catch (base64Error) {
                console.error("Failed to decode Base64 string:", base64Error);
                alert("Failed to import project. The data is not a valid JSON format or a valid shareable code.");
                return false;
            }
        }
        try {
            const parsedLayout = JSON.parse(jsonString);
            if (parsedLayout && typeof parsedLayout === 'object' && parsedLayout.floors && parsedLayout.sectors) {
                const raw: Layout = {
                    sectors: parsedLayout.sectors || {},
                    floors: parsedLayout.floors || {},
                };
                const { layout: clamped, droppedFloorIndices } = clampLayoutFloors(raw);
                resetLayout(clamped);
                const firstFloor = Math.min(
                    MAX_FLOORS,
                    Object.keys(clamped.floors).map(Number).sort((a, b) => a - b)[0] || 1
                );
                setCurrentFloor(firstFloor);
                alert(
                    droppedFloorIndices.length > 0
                        ? `Project imported. Warning: floors beyond ${MAX_FLOORS} are not supported. ` +
                              `Removed floor(s): ${droppedFloorIndices.join(', ')}. Only floors 1–${MAX_FLOORS} were kept.`
                        : 'Project imported successfully!'
                );
                return true;
            } else {
                throw new Error("Invalid layout format.");
            }
        } catch (error) {
            console.error("Failed to parse final JSON:", error);
            alert("Failed to import project. The data may be corrupted or in an invalid format.");
            return false;
        }
    }, [resetLayout]);

    const handleSelectTemplate = (templateLayout: Layout) => {
        const newLayout = JSON.parse(JSON.stringify(templateLayout)) as Layout;
        const { layout: clamped } = clampLayoutFloors(newLayout);
        resetLayout(clamped);
        const firstFloor = Math.min(
            MAX_FLOORS,
            Object.keys(clamped.floors).map(Number).sort((a, b) => a - b)[0] || 1
        );
        setCurrentFloor(firstFloor);
    };

    const handleNewBlankProject = useCallback(() => {
        localStorage.removeItem('wow-house-layout');
        resetLayout(initialLayout);
        setCurrentFloor(1);
    }, [resetLayout]);

    return {
        layout, setLayout,
        currentFloor, setCurrentFloor, handleFloorChange,
        handleSaveSector, handleDeleteSector,
        handleImportLayout, handleSelectTemplate, handleNewBlankProject,
        undo, redo, canUndo, canRedo
    };
};

// ===================================================================================
// Canvas Viewport Controls
// ===================================================================================

/** localStorage key for pan/zoom; also written immediately on “Reset view”. */
export const VIEWPORT_STORAGE_KEY = 'wow-housing-viewport';

function loadStoredViewport(): { zoom: number; pan: Point } {
    try {
        const raw = localStorage.getItem(VIEWPORT_STORAGE_KEY);
        if (!raw) return { zoom: 1, pan: { x: 0, y: 0 } };
        const o = JSON.parse(raw) as { zoom?: unknown; pan?: { x?: unknown; y?: unknown } };
        const zoom =
            typeof o.zoom === 'number' && Number.isFinite(o.zoom)
                ? Math.max(0.2, Math.min(3, o.zoom))
                : 1;
        const pan =
            o.pan &&
            typeof o.pan.x === 'number' &&
            typeof o.pan.y === 'number' &&
            Number.isFinite(o.pan.x) &&
            Number.isFinite(o.pan.y)
                ? { x: o.pan.x, y: o.pan.y }
                : { x: 0, y: 0 };
        return { zoom, pan };
    } catch {
        return { zoom: 1, pan: { x: 0, y: 0 } };
    }
}

export const useCanvasControls = (assigningSectorId: string | null) => {
    const initial = loadStoredViewport();
    const [zoom, setZoom] = useState(initial.zoom);
    const [pan, setPan] = useState<Point>(initial.pan);
    const [isPanning, setIsPanning] = useState(false);
    const panStartRef = useRef<Point>({ x: 0, y: 0 });
    /** Sync with isPanning so window listeners react on the same frame as mousedown (no effect delay). */
    const isPanningRef = useRef(false);

    const handleZoom = useCallback((delta: number) => {
        setZoom(prevZoom => Math.max(0.2, Math.min(3, prevZoom + delta)));
    }, []);

    const handleWheel = (e: React.WheelEvent) => {
        if (assigningSectorId) return;
        handleZoom(-e.deltaY * 0.001);
    };
    
    /**
     * Pan: attach move/up only after mousedown on the canvas (empty area).
     * Using document + capture ensures we still receive events if something
     * stops propagation on the canvas tree, and avoids relying on a single
     * permanent window listener that can get out of sync with App’s own
     * mousemove/mouseup subscriptions.
     */
    const handlePanMouseDown = (e: React.MouseEvent | React.PointerEvent) => {
        if (assigningSectorId) return;
        if (e.button !== undefined && e.button !== 0 && e.button !== 1) return;
        e.preventDefault();
        e.stopPropagation();
        isPanningRef.current = true;
        setIsPanning(true);
        panStartRef.current = { x: e.clientX, y: e.clientY };

        const onMove = (ev: MouseEvent | PointerEvent) => {
            if (!isPanningRef.current) return;
            setPan(prevPan => ({
                x: prevPan.x + ev.clientX - panStartRef.current.x,
                y: prevPan.y + ev.clientY - panStartRef.current.y,
            }));
            panStartRef.current = { x: ev.clientX, y: ev.clientY };
        };

        const onUp = () => {
            isPanningRef.current = false;
            setIsPanning(false);
            document.removeEventListener('mousemove', onMove, true);
            document.removeEventListener('pointermove', onMove, true);
            document.removeEventListener('mouseup', onUp, true);
            document.removeEventListener('pointerup', onUp, true);
            document.removeEventListener('pointercancel', onUp, true);
        };

        document.addEventListener('mousemove', onMove, { capture: true });
        document.addEventListener('pointermove', onMove, { capture: true });
        document.addEventListener('mouseup', onUp, { capture: true });
        document.addEventListener('pointerup', onUp, { capture: true });
        document.addEventListener('pointercancel', onUp, { capture: true });
    };

    /** Debounced so pan drags don’t write localStorage on every mousemove (~60+ Hz). */
    const viewportSaveDelayMs = 220;
    useEffect(() => {
        const t = window.setTimeout(() => {
            try {
                localStorage.setItem(
                    VIEWPORT_STORAGE_KEY,
                    JSON.stringify({ zoom, pan })
                );
            } catch {
                /* quota / private mode */
            }
        }, viewportSaveDelayMs);
        return () => clearTimeout(t);
    }, [zoom, pan]);

    return { zoom, setZoom, pan, setPan, isPanning, handleZoom, handleWheel, handlePanMouseDown };
};


// ===================================================================================
// User Interaction Logic (Dragging, Selecting, etc.)
// ===================================================================================
interface UseRoomInteractionProps {
    layout: Layout;
    setLayout: (newState: Layout | ((prevState: Layout) => Layout)) => void;
    currentFloor: number;
    zoom: number;
    pan: Point;
    isPanning: boolean;
    assigningSectorId: string | null;
    setAssigningSectorId: React.Dispatch<React.SetStateAction<string | null>>;
}

export const useRoomInteraction = (
    {
        layout, setLayout, currentFloor, zoom, pan, isPanning,
        assigningSectorId, setAssigningSectorId
    }: UseRoomInteractionProps
) => {
    const [draggedRoom, setDraggedRoom] = useState<DraggedRoom | null>(null);
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const canvasRef = useRef<HTMLDivElement>(null);

    // Effect for cursor style management
    useEffect(() => {
        let cursor = 'default';
        let userSelect = 'auto';
        if (isPanning) {
            cursor = 'grabbing'; userSelect = 'none';
        } else if (draggedRoom) {
            cursor = 'grabbing'; userSelect = 'none';
        } else if (assigningSectorId) {
            cursor = 'url("data:image/svg+xml;charset=utf8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 24 24\' fill=\'%23ffd700\'%3E%3Cpath d=\'M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37c-.39-.39-1.02-.39-1.41 0L14 10.01V3h-2v11.59l-5.71-5.71a.996.996 0 10-1.41 1.41L11.59 17H23v-2H16.01l4.7-4.7c.39-.39.39-1.02 0-1.41l-2-2z\'/%3E%3C/svg%3E") 8 24, auto';
        }
        document.body.style.cursor = cursor;
        document.body.style.userSelect = userSelect;
        return () => { document.body.style.cursor = 'default'; document.body.style.userSelect = 'auto'; };
    }, [draggedRoom, isPanning, assigningSectorId]);

    const handleRoomDragStart = (shape: RoomShape, e: React.MouseEvent) => {
        if (!canvasRef.current || assigningSectorId) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - pan.x) / zoom;
        const y = (e.clientY - rect.top - pan.y) / zoom;
        setSelectedRoomId(null);
        setDraggedRoom({
            isNew: true, shape, x, y,
            offsetX: ROOM_DEFINITIONS[shape].width / 2,
            offsetY: ROOM_DEFINITIONS[shape].height / 2,
            rotation: 0,
        });
    };

    const handleExistingRoomDragStart = (room: RoomInstance, e: React.MouseEvent) => {
        if (!canvasRef.current || assigningSectorId) return;
        if (e.button === 1) return; // middle-button pan — not room drag
        setSelectedRoomId(null);
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left - pan.x) / zoom;
        const mouseY = (e.clientY - rect.top - pan.y) / zoom;

        if (e.altKey) {
            setDraggedRoom({
                isNew: true, shape: room.shape,
                x: mouseX - ROOM_DEFINITIONS[room.shape].width / 2,
                y: mouseY - ROOM_DEFINITIONS[room.shape].height / 2,
                offsetX: ROOM_DEFINITIONS[room.shape].width / 2,
                offsetY: ROOM_DEFINITIONS[room.shape].height / 2,
                rotation: room.rotation, sectorId: room.sectorId,
            });
            return;
        }
        
        setDraggedRoom({
            isNew: false, id: room.id, shape: room.shape,
            x: room.x, y: room.y,
            offsetX: mouseX - room.x, offsetY: mouseY - room.y,
            rotation: room.rotation,
            sectorId: room.sectorId,
        });
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isPanning || !draggedRoom || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        let mouseX = (e.clientX - rect.left - pan.x) / zoom;
        let mouseY = (e.clientY - rect.top - pan.y) / zoom;
        let newX = mouseX - draggedRoom.offsetX;
        let newY = mouseY - draggedRoom.offsetY;
        let snapped = false;

        const draggedRoomDef = ROOM_DEFINITIONS[draggedRoom.shape];
        const draggedRoomCenter = { x: draggedRoomDef.width / 2, y: draggedRoomDef.height / 2 };
        
        // Exclude the currently dragged room from the list of rooms to snap to
        const roomsForCurrentFloor = (layout.floors[currentFloor]?.rooms || []).filter(r => r.id !== draggedRoom.id);

        for (const room of roomsForCurrentFloor) {
            if (snapped) break;
            const roomDef = ROOM_DEFINITIONS[room.shape];
            const roomCenter = { x: roomDef.width / 2, y: roomDef.height / 2 };

            for (const roomNode of roomDef.nodes) {
                if (snapped) break;
                const rotatedStaticNode = rotatePoint(roomNode, roomCenter, room.rotation);
                const staticNodeAbs = { x: rotatedStaticNode.x + room.x, y: rotatedStaticNode.y + room.y };
                
                for (const draggedNode of draggedRoomDef.nodes) {
                    const rotatedDraggedNode = rotatePoint(draggedNode, draggedRoomCenter, draggedRoom.rotation);
                    const dist = Math.sqrt(Math.pow((rotatedDraggedNode.x + newX) - staticNodeAbs.x, 2) + Math.pow((rotatedDraggedNode.y + newY) - staticNodeAbs.y, 2));
                    
                    if (dist < SNAP_DISTANCE / zoom) {
                         newX = staticNodeAbs.x - rotatedDraggedNode.x;
                         newY = staticNodeAbs.y - rotatedDraggedNode.y;
                         snapped = true;
                         break;
                    }
                }
            }
        }
        setDraggedRoom(prev => prev ? { ...prev, x: newX, y: newY } : null);
    }, [draggedRoom, pan, zoom, isPanning, layout, currentFloor]);

    const handleMouseUp = useCallback(() => {
        if (draggedRoom) {
            setLayout(prevLayout => {
                const newLayout = JSON.parse(JSON.stringify(prevLayout)); // Deep copy
                const newFloors = newLayout.floors;
                
                // Ensure floor exists
                if (!newFloors[currentFloor]) {
                    newFloors[currentFloor] = { rooms: [] };
                }
                
                let floorRooms = newFloors[currentFloor].rooms;

                if (draggedRoom.isNew) {
                    floorRooms.push({
                        id: crypto.randomUUID(),
                        shape: draggedRoom.shape,
                        x: draggedRoom.x,
                        y: draggedRoom.y,
                        rotation: draggedRoom.rotation,
                        sectorId: draggedRoom.sectorId,
                    });
                } else {
                    const roomIndex = floorRooms.findIndex((r: RoomInstance) => r.id === draggedRoom.id);
                    if (roomIndex > -1) {
                        floorRooms[roomIndex] = {
                            ...floorRooms[roomIndex],
                            x: draggedRoom.x,
                            y: draggedRoom.y,
                            rotation: draggedRoom.rotation,
                        };
                    }
                }
                return newLayout;
            });
            setDraggedRoom(null);
        }
    }, [draggedRoom, currentFloor, setLayout]);

    const handleRoomClick = (roomId: string) => {
        if (assigningSectorId) {
            setLayout(prev => {
                const newFloors = { ...prev.floors };
                const floorRooms = (newFloors[currentFloor]?.rooms || []).map(r => {
                    if (r.id === roomId) {
                        return { ...r, sectorId: r.sectorId === assigningSectorId ? undefined : assigningSectorId };
                    }
                    return r;
                });
                 newFloors[currentFloor] = { ...newFloors[currentFloor], rooms: floorRooms };
                return { ...prev, floors: newFloors };
            });
        } else {
             setSelectedRoomId(roomId);
        }
    };
    
    const handleCanvasClick = (e: React.MouseEvent) => {
        if (e.button === 0 && !assigningSectorId) {
            setSelectedRoomId(null);
        }
    };
    
    return {
        draggedRoom, setDraggedRoom,
        selectedRoomId, setSelectedRoomId,
        canvasRef,
        handleRoomDragStart, handleExistingRoomDragStart,
        handleMouseMove, handleMouseUp,
        handleRoomClick, handleCanvasClick
    };
};
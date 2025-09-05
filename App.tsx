
import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { ExportPreview } from './components/ExportPreview';
import { SectorPanel } from './components/SectorPanel';
import { ThreeDView } from './components/ThreeDView';
import { ImportModal } from './components/ImportModal';
import { ExportModal } from './components/ExportModal';
import { StartupModal } from './components/StartupModal';
import { CanvasOverlays } from './components/CanvasOverlays';
import { useLayoutManager, useCanvasControls, useRoomInteraction } from './components/hooks';
import type { Layout, RoomInstance, RoomShape } from './types';
import { ROOM_DEFINITIONS } from './constants';
import { AnimatePresence, motion } from 'framer-motion';

const TOTAL_AREA_LIMIT = 100000; // Increased limit for larger projects

interface ErrorDisplayProps {
    message: string | null;
    onClose: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onClose }) => {
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                onClose();
            }, 15000); // 15 seconds

            return () => clearTimeout(timer);
        }
    }, [message, onClose]);

    return (
        <AnimatePresence>
            {message && (
                <motion.div
                    className="fixed bottom-5 right-5 w-full max-w-sm wow-panel border-2 border-red-500/50 p-4 rounded-lg shadow-2xl text-white flex items-start gap-4 z-[200]"
                    initial={{ opacity: 0, y: 50, scale: 0.3 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                    role="alert"
                >
                    <div className="flex-shrink-0 text-red-400 mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.378-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold font-title text-red-300">An Error Occurred</h4>
                        <p className="text-sm text-gray-300">{message}</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700/50 -mt-1 -mr-1" aria-label="Close error message">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};


const App: React.FC = () => {
    const [error, setError] = useState<string | null>(null);

    // Modals and UI State
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [is3DViewOpen, setIs3DViewOpen] = useState(false);
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const [isSectorPanelOpen, setIsSectorPanelOpen] = useState(false);
    const [showStartupModal, setShowStartupModal] = useState(false);
    const [exportString, setExportString] = useState("");
    const [assigningSectorId, setAssigningSectorId] = useState<string | null>(null);

    // Core Hooks
    const { layout, setLayout, currentFloor, setCurrentFloor, handleFloorChange, handleSaveSector, handleDeleteSector, handleImportLayout, handleSelectTemplate, undo, redo, canUndo, canRedo } = useLayoutManager(showStartupModal, setShowStartupModal);
    const { zoom, pan, setPan, isPanning, handleZoom, handleWheel, handlePanMouseDown } = useCanvasControls(assigningSectorId);
    const { draggedRoom, setDraggedRoom, selectedRoomId, setSelectedRoomId, canvasRef, handleRoomDragStart, handleExistingRoomDragStart, handleMouseMove, handleMouseUp, handleRoomClick, handleCanvasClick } = useRoomInteraction({ layout, setLayout, currentFloor, zoom, pan, isPanning, assigningSectorId, setAssigningSectorId });

    const totalArea = useMemo(() => {
        return Object.values(layout.floors).reduce((acc, floor) => {
            return acc + (floor.rooms || []).reduce((floorAcc, room) => floorAcc + (ROOM_DEFINITIONS[room.shape]?.area || 0), 0);
        }, 0) / 100; // Convert to m²
    }, [layout]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
            if (e.key === 'Escape') (document.activeElement as HTMLElement).blur();
            return;
        }

        switch (e.key) {
            case 'Delete':
            case 'Backspace':
                if (selectedRoomId) {
                    setLayout(prev => {
                        const newFloors = { ...prev.floors };
                        newFloors[currentFloor] = {
                            ...newFloors[currentFloor],
                            rooms: (newFloors[currentFloor]?.rooms || []).filter(r => r.id !== selectedRoomId)
                        };
                        return { ...prev, floors: newFloors };
                    });
                    setSelectedRoomId(null);
                }
                break;
            case 'r':
                if (draggedRoom) {
                    const rotationAmount = e.shiftKey ? -90 : 90;
                    setDraggedRoom(prev => prev ? { ...prev, rotation: (prev.rotation + rotationAmount) % 360 } : null);
                }
                break;
            case 'PageUp':
                e.preventDefault();
                handleFloorChange('up');
                break;
            case 'PageDown':
                e.preventDefault();
                handleFloorChange('down');
                break;
            case 'Escape':
                setSelectedRoomId(null);
                if (assigningSectorId) setAssigningSectorId(null);
                if (isSectorPanelOpen) setIsSectorPanelOpen(false);
                break;
            case 'z':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    undo();
                }
                break;
             case 'y':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    redo();
                }
                break;
        }
    }, [selectedRoomId, draggedRoom, setLayout, currentFloor, handleFloorChange, assigningSectorId, isSectorPanelOpen, undo, redo]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleKeyDown, handleMouseMove, handleMouseUp]);
    
     const handleOpenExportModal = () => {
        try {
            const jsonString = JSON.stringify(layout);
            const base64String = btoa(unescape(encodeURIComponent(jsonString)));
            setExportString(base64String);
            setIsExportModalOpen(true);
        } catch (e) {
            setError("Could not generate the export code. Your project might be too large or corrupted.");
        }
    };
    
    const handleDoImport = (data: string) => {
        if(handleImportLayout(data)) {
            setIsImportModalOpen(false);
        }
    }

    const handleFloorNameChange = (name: string) => {
        setLayout(prev => {
            const newFloors = { ...prev.floors };
            if (!newFloors[currentFloor]) {
                newFloors[currentFloor] = { rooms: [], name: name };
            } else {
                 newFloors[currentFloor] = { ...newFloors[currentFloor], name: name };
            }
            return { ...prev, floors: newFloors };
        });
    }

    const lowerFloorRooms = useMemo(() => {
        const lowerFloor = currentFloor - 1;
        return layout.floors[lowerFloor]?.rooms || [];
    }, [currentFloor, layout.floors]);

    return (
        <div className="h-screen w-screen flex flex-col bg-gray-900 text-white select-none">
            <Toolbar
                currentFloor={currentFloor}
                onFloorChange={handleFloorChange}
                onZoom={handleZoom}
                layout={layout}
                isSectorPanelOpen={isSectorPanelOpen}
                onToggleSectorPanel={() => setIsSectorPanelOpen(!isSectorPanelOpen)}
                onToggle3DView={() => setIs3DViewOpen(true)}
                onOpenImportModal={() => setIsImportModalOpen(true)}
                onOpenExportModal={handleOpenExportModal}
                onFloorNameChange={handleFloorNameChange}
                onUndo={undo}
                onRedo={redo}
                canUndo={canUndo}
                canRedo={canRedo}
            />
            <main className="flex-1 flex overflow-hidden">
                <Sidebar onRoomDragStart={handleRoomDragStart} />
                <div className="flex-1 flex flex-col relative" onClick={handleCanvasClick}>
                    <CanvasOverlays 
                        totalArea={totalArea} 
                        areaLimit={TOTAL_AREA_LIMIT} 
                        floorName={layout.floors[currentFloor]?.name || `Floor ${currentFloor}`}
                    />
                    <Canvas
                        ref={canvasRef}
                        layout={layout}
                        currentFloor={currentFloor}
                        lowerFloorRooms={lowerFloorRooms}
                        zoom={zoom}
                        pan={pan}
                        draggedRoom={draggedRoom}
                        selectedRoomId={selectedRoomId}
                        isExporting={isExportingPDF}
                        onWheel={handleWheel}
                        onMouseDown={handlePanMouseDown}
                        onExistingRoomDragStart={handleExistingRoomDragStart}
                        onRoomClick={handleRoomClick}
                        assigningSectorId={assigningSectorId}
                    />
                </div>
                <SectorPanel 
                    sectors={layout.sectors}
                    assigningSectorId={assigningSectorId}
                    onSetAssigningSector={setAssigningSectorId}
                    onSaveSector={handleSaveSector}
                    onDeleteSector={handleDeleteSector}
                    isOpen={isSectorPanelOpen}
                    onClose={() => setIsSectorPanelOpen(false)}
                />
            </main>

            <AnimatePresence>
                {showStartupModal && <StartupModal onClose={() => setShowStartupModal(false)} onOpenImportModal={() => setIsImportModalOpen(true)} onSelectTemplate={(l) => { handleSelectTemplate(l); setShowStartupModal(false);}} />}
                {isImportModalOpen && <ImportModal onClose={() => setIsImportModalOpen(false)} onImport={handleDoImport} />}
                {isExportModalOpen && <ExportModal onClose={() => setIsExportModalOpen(false)} exportString={exportString} layout={layout} onExportPDF={() => setIsExportingPDF(true)} isExportingPDF={isExportingPDF} />}
                {is3DViewOpen && <ThreeDView layout={layout} onClose={() => setIs3DViewOpen(false)} />}
            </AnimatePresence>

            <ExportPreview
                isExporting={isExportingPDF}
                layout={layout}
                onExportComplete={() => setIsExportingPDF(false)}
                onError={setError}
            />
            
            <ErrorDisplay message={error} onClose={() => setError(null)} />
            
            {isExportingPDF && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[150]">
                    <div className="text-center">
                        <svg className="animate-spin h-10 w-10 text-yellow-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="font-title text-xl text-yellow-400 mt-4">Exporting Project...</p>
                        <p className="text-gray-300">Generating multi-page PDF, please wait.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;

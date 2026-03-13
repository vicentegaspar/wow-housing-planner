
import React, { useEffect, useCallback, useState, useMemo, lazy, Suspense } from 'react';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { ExportPreview } from './components/ExportPreview';
import { SectorPanel } from './components/SectorPanel';
const ThreeDViewLazy = lazy(() => import('./components/ThreeDView'));
import { ImportModal } from './components/ImportModal';
import { ExportModal } from './components/ExportModal';
import { StartupModal } from './components/StartupModal';
import { ConfirmModal } from './components/ConfirmModal';
import { TemplateModal } from './components/TemplateModal';
import { CanvasOverlays } from './components/CanvasOverlays';
import { useLayoutManager, useCanvasControls, useRoomInteraction, VIEWPORT_STORAGE_KEY } from './components/hooks';
import type { Layout, RoomInstance, RoomShape } from './types';
import { ROOM_DEFINITIONS } from './constants';
import { MAX_FLOORS } from './layoutFloors';
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
    const [showConfirmNewProject, setShowConfirmNewProject] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [showConfirmTemplate, setShowConfirmTemplate] = useState(false);
    const [pendingTemplateLayout, setPendingTemplateLayout] = useState<import('./types').Layout | null>(null);
    const [assigningSectorId, setAssigningSectorId] = useState<string | null>(null);

    // Core Hooks
    const { layout, setLayout, currentFloor, setCurrentFloor, handleFloorChange, handleSaveSector, handleDeleteSector, handleImportLayout, handleSelectTemplate, handleNewBlankProject, undo, redo, canUndo, canRedo } = useLayoutManager(showStartupModal, setShowStartupModal);
    const { zoom, setZoom, pan, setPan, isPanning, handleZoom, handleWheel, handlePanPointerDown, handlePanPointerMove, handlePanPointerUp } = useCanvasControls(assigningSectorId);
    const { draggedRoom, setDraggedRoom, selectedRoomId, setSelectedRoomId, canvasRef, handleRoomDragStart, handleExistingRoomDragStart, handleMouseMove, handleMouseUp, handleRoomClick, handleCanvasClick } = useRoomInteraction({ layout, setLayout, currentFloor, zoom, pan, isPanning, assigningSectorId, setAssigningSectorId });

    const totalArea = useMemo(() => {
        let sum = 0;
        for (let n = 1; n <= MAX_FLOORS; n++) {
            const floor = layout.floors[n];
            if (!floor?.rooms?.length) continue;
            for (const room of floor.rooms) {
                sum += ROOM_DEFINITIONS[room.shape]?.area || 0;
            }
        }
        return sum / 100; // Convert to m² (only floors 1–MAX_FLOORS)
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
        setIsExportModalOpen(true);
    };

    const hasAnyRooms = useMemo(() =>
        Object.values(layout.floors).some(f => f.rooms.length > 0),
    [layout.floors]);

    /** Neutral canvas view + flush stored viewport so reload doesn’t restore old pan/zoom. */
    const resetViewport = useCallback(() => {
        setPan({ x: 0, y: 0 });
        setZoom(1);
        try {
            localStorage.setItem(
                VIEWPORT_STORAGE_KEY,
                JSON.stringify({ zoom: 1, pan: { x: 0, y: 0 } })
            );
        } catch {
            /* ignore */
        }
    }, [setPan, setZoom]);

    const startNewBlankProject = useCallback(() => {
        resetViewport();
        handleNewBlankProject();
    }, [resetViewport, handleNewBlankProject]);

    const handleNewProjectRequest = () => {
        if (hasAnyRooms) {
            setShowConfirmNewProject(true);
        } else {
            startNewBlankProject();
        }
    };

    /** Reset pan/zoom so the new template is framed from a neutral viewport. */
    const applyTemplateLayout = useCallback(
        (templateLayout: import('./types').Layout) => {
            resetViewport();
            handleSelectTemplate(templateLayout);
        },
        [handleSelectTemplate, resetViewport]
    );

    const handleTemplateRequest = (templateLayout: import('./types').Layout) => {
        if (hasAnyRooms) {
            setPendingTemplateLayout(templateLayout);
            setIsTemplateModalOpen(false);
            setShowConfirmTemplate(true);
        } else {
            applyTemplateLayout(templateLayout);
            setIsTemplateModalOpen(false);
        }
    };

    const handleConfirmTemplate = () => {
        if (pendingTemplateLayout) {
            applyTemplateLayout(pendingTemplateLayout);
            setPendingTemplateLayout(null);
        }
        setShowConfirmTemplate(false);
    };
    
    const handleDoImport = (data: string) => {
        if (handleImportLayout(data)) {
            resetViewport();
            setIsImportModalOpen(false);
        }
    };

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
                onResetView={resetViewport}
                layout={layout}
                isSectorPanelOpen={isSectorPanelOpen}
                onToggleSectorPanel={() => setIsSectorPanelOpen(!isSectorPanelOpen)}
                onToggle3DView={() => setIs3DViewOpen(true)}
                onNewProject={handleNewProjectRequest}
                onOpenTemplateModal={() => setIsTemplateModalOpen(true)}
                onOpenImportModal={() => setIsImportModalOpen(true)}
                onOpenExportModal={handleOpenExportModal}
                onUndo={undo}
                onRedo={redo}
                canUndo={canUndo}
                canRedo={canRedo}
            />
            <main className="flex-1 flex overflow-hidden">
                <Sidebar onRoomDragStart={handleRoomDragStart} />
                <div
                    className="flex-1 flex flex-col relative min-h-0"
                    onClick={handleCanvasClick}
                >
                    <CanvasOverlays 
                        totalArea={totalArea} 
                        areaLimit={TOTAL_AREA_LIMIT} 
                        floorName={`Floor ${currentFloor}`}
                    />
                    <Canvas
                        ref={canvasRef}
                        layout={layout}
                        currentFloor={currentFloor}
                        lowerFloorRooms={lowerFloorRooms}
                        zoom={zoom}
                        pan={pan}
                        isPanning={isPanning}
                        draggedRoom={draggedRoom}
                        selectedRoomId={selectedRoomId}
                        isExporting={isExportingPDF}
                        onWheel={handleWheel}
                        onPointerDown={handlePanPointerDown}
                        onPointerMove={handlePanPointerMove}
                        onPointerUp={handlePanPointerUp}
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
                {showStartupModal && <StartupModal onClose={() => setShowStartupModal(false)} onNewBlankProject={() => { startNewBlankProject(); setShowStartupModal(false); }} onOpenImportModal={() => { setShowStartupModal(false); setIsImportModalOpen(true); }} onSelectTemplate={(l) => { applyTemplateLayout(l); setShowStartupModal(false); }} onOpenTemplateModal={() => { setShowStartupModal(false); setIsTemplateModalOpen(true); }} />}
                {isTemplateModalOpen && (
                    <TemplateModal
                        onClose={() => setIsTemplateModalOpen(false)}
                        onSelectTemplate={handleTemplateRequest}
                    />
                )}
                {showConfirmTemplate && (
                    <ConfirmModal
                        title="Load Template"
                        message="This will overwrite your current project with the selected template. Any unsaved work will be lost."
                        confirmLabel="Yes, Load Template"
                        cancelLabel="Keep Working"
                        dangerous
                        onConfirm={handleConfirmTemplate}
                        onCancel={() => { setShowConfirmTemplate(false); setPendingTemplateLayout(null); }}
                    />
                )}
                {showConfirmNewProject && (
                    <ConfirmModal
                        title="New Blank Project"
                        message="This will permanently clear your current project and all unsaved changes. Are you sure?"
                        confirmLabel="Yes, Start Fresh"
                        cancelLabel="Keep Working"
                        dangerous
                        onConfirm={() => { startNewBlankProject(); setShowConfirmNewProject(false); }}
                        onCancel={() => setShowConfirmNewProject(false)}
                    />
                )}
                {isImportModalOpen && <ImportModal onClose={() => setIsImportModalOpen(false)} onImport={handleDoImport} />}
                {isExportModalOpen && <ExportModal onClose={() => setIsExportModalOpen(false)} layout={layout} onExportPDF={() => setIsExportingPDF(true)} isExportingPDF={isExportingPDF} />}
                {is3DViewOpen && (
                    <Suspense
                        fallback={
                            <div className="absolute inset-0 bg-black/70 z-40 flex items-center justify-center">
                                <div className="text-center">
                                    <svg className="animate-spin h-10 w-10 text-yellow-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <p className="font-title text-xl text-yellow-400 mt-4">Loading 3D engine…</p>
                                </div>
                            </div>
                        }
                    >
                        <ThreeDViewLazy layout={layout} onClose={() => setIs3DViewOpen(false)} />
                    </Suspense>
                )}
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

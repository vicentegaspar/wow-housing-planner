

import React, { useMemo } from 'react';
import { Tooltip } from './Tooltip';
import type { FloorLayout, Layout } from '../types';
import { ROOM_DEFINITIONS } from '../constants';
import { MAX_FLOORS } from '../layoutFloors';

interface ToolbarProps {
    currentFloor: number;
    onFloorChange: (direction: 'up' | 'down') => void;
    onZoom: (delta: number) => void;
    /** Pan (0,0), zoom 100%, update stored viewport */
    onResetView: () => void;
    layout: Layout;
    isSectorPanelOpen: boolean;
    onToggleSectorPanel: () => void;
    onToggle3DView: () => void;
    onNewProject: () => void;
    onOpenTemplateModal: () => void;
    onOpenImportModal: () => void;
    onOpenExportModal: () => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
}

const ToolbarButton: React.FC<{ onClick: () => void, children: React.ReactNode, disabled?: boolean, tooltip: string, isActive?: boolean }> =
    ({ onClick, children, disabled, tooltip, isActive }) => (
        <Tooltip text={tooltip}>
            <button
                onClick={onClick}
                disabled={disabled}
                className={`px-3 py-1.5 wow-button rounded-md text-sm transition-colors ${isActive ? '!border-yellow-400 !text-yellow-400' : ''}`}
            >
                {children}
            </button>
        </Tooltip>
    );


export const Toolbar: React.FC<ToolbarProps> = ({
    currentFloor,
    onFloorChange,
    onZoom,
    onResetView,
    layout,
    isSectorPanelOpen,
    onToggleSectorPanel,
    onToggle3DView,
    onNewProject,
    onOpenTemplateModal,
    onOpenImportModal,
    onOpenExportModal,
    onUndo,
    onRedo,
    canUndo,
    canRedo
}) => {

    const hasAnyRooms = useMemo(() => {
        return Object.values(layout.floors).some((f: FloorLayout) => f.rooms.length > 0);
    }, [layout]);

    return (
        <header className="h-16 wow-panel flex items-center justify-between px-4 border-b flex-shrink-0 text-xs z-30 relative">
            <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
                <img
                    src="/logo.png"
                    alt="WoW Housing Planner"
                    width={44}
                    height={44}
                    className="h-11 w-11 rounded-lg object-cover ring-1 ring-yellow-500/30 shadow-md flex-shrink-0"
                    decoding="async"
                />
                <h1 className="text-[10px] uppercase leading-none font-title text-yellow-400">
                    WoW<br />Housing<br />Planner
                </h1>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-gray-300">
                    <span className="font-bold text-gray-400">Controls:</span>
                    <span><kbd className="px-2 py-1 bg-gray-900 rounded border border-gray-600">Alt+Drag</kbd> Duplicate</span>
                    <span><kbd className="px-2 py-1 bg-gray-900 rounded border border-gray-600">R</kbd>/<kbd className="px-2 py-1 bg-gray-900 rounded border border-gray-600">Shift+R</kbd> Rotate</span>
                    <span><kbd className="px-2 py-1 bg-gray-900 rounded border border-gray-600">Drag</kbd> Pan</span>
                </div>

                <div className="w-px h-8 bg-gray-600"></div>

                <div className="flex items-center gap-2">
                    <ToolbarButton onClick={onNewProject} disabled={!hasAnyRooms} tooltip="Start a new blank project (clears the canvas)">
                        New
                    </ToolbarButton>
                    <ToolbarButton onClick={onOpenTemplateModal} tooltip="Load a pre-built template onto the canvas">
                        Templates
                    </ToolbarButton>
                    <ToolbarButton onClick={onOpenImportModal} tooltip="Import project from text code">
                        Import
                    </ToolbarButton>
                    <ToolbarButton onClick={onOpenExportModal} disabled={!hasAnyRooms} tooltip="Export project to shareable text code or PDF">
                        Export
                    </ToolbarButton>
                </div>

                <div className="w-px h-8 bg-gray-600"></div>

                <div className="flex items-center gap-2">
                    <ToolbarButton onClick={onToggleSectorPanel} isActive={isSectorPanelOpen} tooltip={isSectorPanelOpen ? "Hide Sectors" : "Show Sectors"}>
                        Sectors
                    </ToolbarButton>
                    <ToolbarButton onClick={onToggle3DView} tooltip="Explore the current floor in 3D">
                        3D View
                    </ToolbarButton>
                </div>

                <div className="w-px h-8 bg-gray-600"></div>

                <div className="flex items-center gap-2">
                    <ToolbarButton onClick={() => onZoom(-0.15)} tooltip="Zoom Out">
                        Zoom -
                    </ToolbarButton>
                    <ToolbarButton onClick={() => onZoom(0.15)} tooltip="Zoom In">
                        Zoom +
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={onResetView}
                        tooltip="Reset view: center canvas, 100% zoom, save as default for reload"
                    >
                        <span className="inline-flex items-center gap-1.5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" aria-hidden>
                                <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z" />
                                <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z" />
                            </svg>
                            Reset view
                        </span>
                    </ToolbarButton>
                </div>

                <div className="w-px h-8 bg-gray-600"></div>

                <div className="flex items-center gap-2">
                    <ToolbarButton onClick={onUndo} disabled={!canUndo} tooltip="Undo (Ctrl+Z)">
                        Undo
                    </ToolbarButton>
                    <ToolbarButton onClick={onRedo} disabled={!canRedo} tooltip="Redo (Ctrl+Y)">
                        Redo
                    </ToolbarButton>
                </div>

                <div className="w-px h-8 bg-gray-600"></div>

                <div className="flex items-center gap-1 bg-gray-900/50 border border-gray-700 rounded-md px-1 py-0.5">
                    <Tooltip text={currentFloor <= 1 ? 'Already on ground floor' : 'Previous floor (Page Down)'}>
                        <button
                            type="button"
                            onClick={() => onFloorChange('down')}
                            disabled={currentFloor <= 1}
                            aria-label="Previous floor"
                            className="p-2 rounded-md text-yellow-400 hover:bg-gray-700/80 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" aria-hidden>
                                <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z" />
                            </svg>
                        </button>
                    </Tooltip>
                    <span
                        className="min-w-[5.5rem] text-center text-sm font-title text-white tabular-nums px-1"
                        title={`Floor ${currentFloor} of ${MAX_FLOORS}. Canvas shows only this floor’s rooms.`}
                    >
                        Floor {currentFloor}/{MAX_FLOORS}
                    </span>
                    <Tooltip text={currentFloor >= MAX_FLOORS ? `Maximum ${MAX_FLOORS} floors` : 'Next floor (Page Up); new floors start empty'}>
                        <button
                            type="button"
                            onClick={() => onFloorChange('up')}
                            disabled={currentFloor >= MAX_FLOORS}
                            aria-label="Next floor"
                            className="p-2 rounded-md text-yellow-400 hover:bg-gray-700/80 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" aria-hidden>
                                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                            </svg>
                        </button>
                    </Tooltip>
                </div>

            </div>
        </header>
    );
};
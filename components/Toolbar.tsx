

import React, { useMemo } from 'react';
import { Tooltip } from './Tooltip';
import type { Layout } from '../types';
import { ROOM_DEFINITIONS } from '../constants';

interface ToolbarProps {
    currentFloor: number;
    onFloorChange: (direction: 'up' | 'down') => void;
    onZoom: (delta: number) => void;
    layout: Layout;
    isSectorPanelOpen: boolean;
    onToggleSectorPanel: () => void;
    onToggle3DView: () => void;
    onOpenImportModal: () => void;
    onOpenExportModal: () => void;
    onFloorNameChange: (name: string) => void;
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
    layout, 
    isSectorPanelOpen, 
    onToggleSectorPanel, 
    onToggle3DView, 
    onOpenImportModal, 
    onOpenExportModal, 
    onFloorNameChange,
    onUndo,
    onRedo,
    canUndo,
    canRedo
}) => {
    
    const hasAnyRooms = useMemo(() => {
        return Object.values(layout.floors).some(f => f.rooms.length > 0);
    }, [layout]);
    
    const currentFloorName = layout.floors[currentFloor]?.name || '';
    
    return (
        <header className="h-16 wow-panel flex items-center justify-between px-4 border-b flex-shrink-0 text-xs z-30 relative">
            <h1 className="text-xl font-title text-yellow-400">WoW Housing Planner</h1>
            
            <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2 text-gray-300">
                    <span className="font-bold text-gray-400">Controls:</span>
                    <span><kbd className="px-2 py-1 bg-gray-900 rounded border border-gray-600">Alt+Drag</kbd> Duplicate</span>
                    <span><kbd className="px-2 py-1 bg-gray-900 rounded border border-gray-600">R</kbd>/<kbd className="px-2 py-1 bg-gray-900 rounded border border-gray-600">Shift+R</kbd> Rotate</span>
                    <span><kbd className="px-2 py-1 bg-gray-900 rounded border border-gray-600">Shift+Drag</kbd> Pan</span>
                </div>
                
                <div className="w-px h-8 bg-gray-600"></div>

                <div className="flex items-center gap-2">
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

                <div className="flex items-center gap-2">
                    <ToolbarButton onClick={() => onFloorChange('down')} disabled={currentFloor <= 1} tooltip="Go down one floor (Page Down)">
                        Floor Down
                    </ToolbarButton>
                    <div className="flex items-baseline gap-2 bg-gray-900/50 border border-gray-700 rounded-md px-3 py-1.5 w-48">
                        <span className="text-gray-400 font-bold">F{currentFloor}:</span>
                        <input
                            type="text"
                            value={currentFloorName}
                            onChange={(e) => onFloorNameChange(e.target.value)}
                            placeholder={`Floor ${currentFloor}`}
                            className="bg-transparent text-white focus:outline-none w-full text-sm"
                            maxLength={30}
                        />
                    </div>
                    <ToolbarButton onClick={() => onFloorChange('up')} disabled={currentFloor >= 99} tooltip="Go up one floor (Page Up)">
                        Floor Up
                    </ToolbarButton>
                </div>

            </div>
        </header>
    );
};
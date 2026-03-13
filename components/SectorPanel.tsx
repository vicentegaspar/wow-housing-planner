




import React, { useState, useEffect } from 'react';
import type { Sector } from '../types';
import { SECTOR_COLORS } from '../constants';
import { Tooltip } from './Tooltip';
import { motion } from 'framer-motion';

interface SectorPanelProps {
    sectors: Record<string, Sector>;
    assigningSectorId: string | null;
    onSetAssigningSector: (id: string | null) => void;
    onSaveSector: (sector: Sector) => void;
    onDeleteSector: (id: string) => void;
    isOpen: boolean;
    onClose: () => void;
}

const SectorForm: React.FC<{
    sector: Sector | null;
    onSave: (sector: Sector) => void;
    onCancel: () => void;
    assigningSectorId: string | null;
    onSetAssigningSector: (id: string | null) => void;
}> = ({ sector, onSave, onCancel, assigningSectorId, onSetAssigningSector }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState(SECTOR_COLORS[0].hex);
    const [textureData, setTextureData] = useState<string | undefined>(undefined);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (sector) {
            setName(sector.name);
            setDescription(sector.description);
            setColor(sector.color);
            setTextureData(sector.textureData);
        } else {
            setName('');
            setDescription('');
            setColor(SECTOR_COLORS[0].hex);
            setTextureData(undefined);
        }
    }, [sector]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            alert("Sector name cannot be empty.");
            return;
        }
        onSave({
            id: sector?.id || crypto.randomUUID(),
            name: name.trim(),
            description: description.trim(),
            color,
            textureData: textureData || undefined,
        });
    };

    const handleTextureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = () => setTextureData(reader.result as string);
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleRemoveTexture = () => setTextureData(undefined);
    
    const isAssigningThisSector = sector && assigningSectorId === sector.id;

    const handleAssignClick = () => {
        if (!sector) return; // Cannot assign for a new, unsaved sector
        if (isAssigningThisSector) {
            onSetAssigningSector(null);
        } else {
            onSetAssigningSector(sector.id);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-3 bg-gray-900/50 rounded-lg border border-gray-700">
            <h3 className="text-lg font-title text-yellow-400 mb-3">{sector ? 'Edit Sector' : 'Create Sector'}</h3>
            <div className="space-y-4">
                <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Sector Name (e.g. Living Quarters)"
                    className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-yellow-400"
                    maxLength={50}
                />
                 <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Description..."
                    className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm h-20 resize-none focus:outline-none focus:border-yellow-400"
                    maxLength={200}
                />
                
                <div className="space-y-1">
                    <label className="text-sm text-gray-400 font-bold">Roof Color</label>
                    <div className="grid grid-cols-5 gap-2">
                        {SECTOR_COLORS.map(c => (
                            <Tooltip key={c.hex} text={c.name}>
                                <button
                                    type="button"
                                    onClick={() => setColor(c.hex)}
                                    className={`w-full h-8 rounded border-2 transition-transform transform hover:scale-110 ${color === c.hex ? 'border-yellow-300' : 'border-transparent'}`}
                                    style={{ backgroundColor: c.hex }}
                                />
                            </Tooltip>
                        ))}
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-sm text-gray-400 font-bold">3D Texture (walls/floors)</label>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleTextureUpload}
                        className="hidden"
                    />
                    <div className="flex items-center gap-2">
                        {textureData ? (
                            <>
                                <div className="w-12 h-12 rounded border border-gray-600 overflow-hidden flex-shrink-0 bg-gray-800">
                                    <img src={textureData} alt="Texture" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-400 truncate">Texture loaded</p>
                                    <button type="button" onClick={handleRemoveTexture} className="text-xs text-red-400 hover:text-red-300 mt-0.5">
                                        Remove
                                    </button>
                                </div>
                            </>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full wow-button !py-2 text-sm !border-dashed"
                            >
                                Import texture (JPG, PNG, WebP)
                            </button>
                        )}
                    </div>
                    <p className="text-[10px] text-gray-500">Used in 3D view for walls and floors</p>
                </div>
            </div>
            {sector && (
                <div className="mt-4">
                     <button type="button" onClick={handleAssignClick} className={`w-full wow-button py-2 text-sm ${isAssigningThisSector ? '!border-yellow-400 !text-yellow-400' : ''}`}>
                       {isAssigningThisSector ? 'Finish Assigning' : 'Assign Rooms'}
                    </button>
                </div>
            )}
            <div className="flex gap-2 mt-4">
                 <button type="submit" className="flex-1 wow-button text-sm py-1.5">
                    {sector ? 'Save Changes' : 'Create & Edit'}
                </button>
                <button type="button" onClick={onCancel} className="flex-1 wow-button !text-gray-400 !border-gray-600 hover:!border-gray-400 hover:!text-white text-sm py-1.5">
                    Cancel
                </button>
            </div>
        </form>
    )
};

export const SectorPanel: React.FC<SectorPanelProps> = ({ sectors, assigningSectorId, onSetAssigningSector, onSaveSector, onDeleteSector, isOpen, onClose }) => {
    const [editingSector, setEditingSector] = useState<Sector | null>(null);
    const [showForm, setShowForm] = useState(false);

    const handleEdit = (sector: Sector) => {
        setEditingSector(sector);
        setShowForm(true);
    };

    const handleAddNew = () => {
        setEditingSector(null);
        setShowForm(true);
    };

    const handleSave = (sector: Sector) => {
        const isNew = !editingSector;
        onSaveSector(sector);
        setEditingSector(sector); // Keep form open to allow assigning rooms
        if(isNew) {
            setShowForm(true);
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingSector(null);
        onSetAssigningSector(null);
    }
    
    // Close form if panel is closed
    useEffect(() => {
        if (!isOpen) {
            handleCancel();
        }
    }, [isOpen]);

    return (
        <motion.aside
            className="w-80 wow-panel p-4 border-l flex flex-col absolute top-0 right-0 h-full z-20"
            initial={{ x: "100%" }}
            animate={{ x: isOpen ? "0%" : "100%" }}
            transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
        >
            <div className="flex items-center justify-between border-b border-gray-600 pb-2 mb-4 flex-shrink-0">
                <h2 className="text-xl font-title text-yellow-400">Sectors</h2>
                <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors" aria-label="Close Sectors Panel">
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                    </svg>
                </button>
            </div>
            
            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                {Object.values(sectors).map(sector => (
                    <div key={sector.id} className={`w-full text-left p-2 rounded-md transition-colors border-2 group relative bg-gray-800 border-transparent hover:bg-gray-700/50`}>
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full flex-shrink-0" style={{ backgroundColor: sector.color }}></div>
                            <div className="flex-1 overflow-hidden">
                                <p className="font-bold truncate text-white">{sector.name}</p>
                                <p className="text-xs text-gray-400 truncate">{sector.description || 'No description'}</p>
                            </div>
                        </div>
                        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(sector)} className="p-1 rounded bg-gray-900/50 hover:bg-gray-900"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/><path fillRule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/></svg></button>
                            <button onClick={() => onDeleteSector(sector.id)} className="p-1 rounded bg-gray-900/50 hover:bg-gray-900"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg></button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-600 flex-shrink-0">
                {showForm ? (
                    <SectorForm
                        sector={editingSector}
                        onSave={handleSave}
                        onCancel={handleCancel}
                        assigningSectorId={assigningSectorId}
                        onSetAssigningSector={onSetAssigningSector}
                    />
                ) : (
                    <button onClick={handleAddNew} className="w-full wow-button py-2 text-sm">
                        Create New Sector
                    </button>
                )}
            </div>
        </motion.aside>
    );
};
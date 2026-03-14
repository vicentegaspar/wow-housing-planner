import React from 'react';
import type { Layout, Asset3D } from '../../types';

export const ASSET_PRESETS = [
    { name: 'Custom URL...', url: '' },
    { name: 'Robot (Test)', url: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/RobotExpressive/RobotExpressive.glb' },
    { name: 'Parrot (Test)', url: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/Parrot.glb' },
    { name: 'Primary Ion Drive (Test)', url: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/PrimaryIonDrive.glb' }
];

interface AssetManagerUIProps {
    layout: Layout;
    onClose: () => void;
    newAssetName: string;
    setNewAssetName: (name: string) => void;
    newAssetUrl: string;
    setNewAssetUrl: (url: string) => void;
    handleAddAsset: (e: React.FormEvent) => void;
    selectedAssetId: string | null;
    setSelectedAssetId: (id: string | null) => void;
    transformMode: 'translate' | 'rotate' | 'scale';
    setTransformMode: (mode: 'translate' | 'rotate' | 'scale') => void;
    handleDeleteAsset: (id: string) => void;
    handleExportAssetsJSON: () => void;
    handleImportAssetsJSON: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onAssetSelectIn3DMenu: (id: string) => void;
}

export const AssetManagerUI: React.FC<AssetManagerUIProps> = ({
    layout,
    onClose,
    newAssetName,
    setNewAssetName,
    newAssetUrl,
    setNewAssetUrl,
    handleAddAsset,
    selectedAssetId,
    transformMode,
    setTransformMode,
    handleDeleteAsset,
    handleExportAssetsJSON,
    handleImportAssetsJSON,
    onAssetSelectIn3DMenu
}) => {
    return (
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
                    {layout.assets3D?.map((asset: Asset3D) => (
                        <div key={asset.id} className={`flex items-center justify-between p-1.5 rounded text-xs mb-1 ${selectedAssetId === asset.id ? 'bg-yellow-600/30 border border-yellow-600/50' : 'hover:bg-gray-800'}`}>
                            <button 
                                className="text-left flex-1 truncate pr-2 text-gray-200" 
                                onClick={() => onAssetSelectIn3DMenu(asset.id)}
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
    );
};

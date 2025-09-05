

import React, { useState, useRef } from 'react';
import { Modal } from './Modal';

interface ImportModalProps {
    onClose: () => void;
    onImport: (data: string) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ onClose, onImport }) => {
    const [importData, setImportData] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImportClick = () => {
        onImport(importData);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result;
                if (typeof text === 'string') {
                    setImportData(text);
                } else {
                    alert("Could not read the file content.");
                }
            };
            reader.onerror = () => {
                alert("Error reading file.");
            };
            reader.readAsText(file);
        }
    };
    
    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <Modal
            title="Import Project"
            onClose={onClose}
            footer={
                <>
                    <button onClick={onClose} className="px-4 py-2 wow-button !text-gray-400 !border-gray-600 hover:!border-gray-400 hover:!text-white">
                        Cancel
                    </button>
                    <button onClick={handleImportClick} disabled={!importData.trim()} className="px-4 py-2 wow-button">
                        Import Project
                    </button>
                </>
            }
        >
            <p className="mb-1">You can either upload a <code className="bg-gray-900 px-1 rounded text-sm">.json</code> project file or paste a shareable code below.</p>
            <p className="mb-4"><strong className="text-red-400">Warning:</strong> Importing will overwrite your current project.</p>

            <div className="mb-4">
                <button onClick={handleUploadClick} className="w-full wow-button py-2 text-sm">
                    Upload Project File (.json)
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json,application/json"
                    className="hidden"
                    aria-label="Upload project file"
                />
            </div>
            
            <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 h-px bg-gray-600"></div>
                <span className="text-gray-400 text-xs font-bold">OR</span>
                <div className="flex-1 h-px bg-gray-600"></div>
            </div>

            <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="Paste shareable code here..."
                className="w-full h-40 bg-gray-900 border border-gray-600 rounded p-2 text-sm font-mono focus:outline-none focus:border-yellow-400 resize-none"
                aria-label="Project code input"
            />
        </Modal>
    );
};

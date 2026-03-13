import React, { useState, useRef, useMemo } from 'react';
import { Modal } from './Modal';
import type { Layout } from '../types';
import { clampLayoutFloors, MAX_FLOORS } from '../layoutFloors';

interface ExportModalProps {
    onClose: () => void;
    layout: Layout;
    onExportPDF: () => void;
    isExportingPDF: boolean;
}

export const ExportModal: React.FC<ExportModalProps> = ({ onClose, layout, onExportPDF, isExportingPDF }) => {
    const [format, setFormat] = useState<'base64' | 'json'>('base64');
    const [copyButtonText, setCopyButtonText] = useState('Copy to Clipboard');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    /** Export always uses floors 1–MAX_FLOORS so JSON and shareable code match the app. */
    const { layout: exportLayout } = useMemo(() => clampLayoutFloors(layout), [layout]);

    const hasAnyRooms = useMemo(() => {
        return Object.values(exportLayout.floors).some((f) => f.rooms.length > 0);
    }, [exportLayout]);

    const exportContent = useMemo(() => {
        const json = JSON.stringify(exportLayout, null, 2);
        if (format === 'json') return json;
        try {
            return btoa(unescape(encodeURIComponent(json)));
        } catch {
            return '';
        }
    }, [format, exportLayout]);

    const handleCopy = () => {
        if (textareaRef.current) {
            textareaRef.current.select();
            navigator.clipboard.writeText(exportContent)
                .then(() => {
                    setCopyButtonText('Copied!');
                    setTimeout(() => setCopyButtonText('Copy to Clipboard'), 2000);
                })
                .catch(err => {
                    console.error('Failed to copy text: ', err);
                    setCopyButtonText('Copy Failed!');
                     setTimeout(() => setCopyButtonText('Copy to Clipboard'), 2000);
                });
        }
    };

    const handleDownload = () => {
        const blob = new Blob([exportContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'wow-housing-project.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <Modal
            title="Export Project"
            onClose={onClose}
            footer={
                <>
                    <button onClick={handleCopy} disabled={isExportingPDF} className="px-4 py-2 wow-button">
                        {copyButtonText}
                    </button>
                    {format === 'json' && (
                        <button onClick={handleDownload} disabled={isExportingPDF} className="px-4 py-2 wow-button">
                            Download .json File
                        </button>
                    )}
                    <button onClick={onExportPDF} disabled={!hasAnyRooms || isExportingPDF} className="px-4 py-2 wow-button">
                        {isExportingPDF ? 'Exporting PDF...' : 'Download PDF'}
                    </button>
                </>
            }
        >
            <div className="mb-4">
                <p className="mb-2 text-sm">
                    Choose an export format. Shareable Code and JSON include only <strong>floors 1–{MAX_FLOORS}</strong> (same as the app). Use Shareable Code to paste into Import, or JSON for backups.
                </p>
                 <div className="flex gap-4 p-1 bg-gray-900/50 rounded-md">
                    <button 
                        onClick={() => setFormat('base64')} 
                        className={`flex-1 py-1 rounded transition-colors text-sm ${format === 'base64' ? 'bg-yellow-600 text-white shadow-inner' : 'hover:bg-gray-700'}`}
                    >
                        Shareable Code
                    </button>
                    <button 
                        onClick={() => setFormat('json')} 
                        className={`flex-1 py-1 rounded transition-colors text-sm ${format === 'json' ? 'bg-yellow-600 text-white shadow-inner' : 'hover:bg-gray-700'}`}
                    >
                        JSON File
                    </button>
                </div>
            </div>
            
            <textarea
                ref={textareaRef}
                value={exportContent}
                readOnly
                className="w-full h-48 bg-gray-900 border border-gray-600 rounded p-2 text-sm font-mono focus:outline-none focus:border-yellow-400 resize-none"
                aria-label="Exported project code"
                onFocus={(e) => e.target.select()}
                autoFocus
            />
        </Modal>
    );
};
import React, { useState } from 'react';
import type { Layout } from '../types';
import { TEMPLATES } from '../templates';
import { Modal } from './Modal';

interface TemplateModalProps {
    onClose: () => void;
    onSelectTemplate: (layout: Layout) => void;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({ onClose, onSelectTemplate }) => {
    const [selectedIndex, setSelectedIndex] = useState<string>('');

    const selectedTemplate = selectedIndex !== '' ? TEMPLATES[parseInt(selectedIndex, 10)] : null;

    const handleApply = () => {
        if (selectedTemplate) {
            onSelectTemplate(selectedTemplate.layout);
        }
    };

    return (
        <Modal
            title="Load Template"
            onClose={onClose}
            footer={
                <>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 wow-button !text-gray-400 !border-gray-600 hover:!border-gray-400 hover:!text-white"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleApply}
                        disabled={!selectedTemplate}
                        className="px-4 py-2 wow-button"
                    >
                        Load Template
                    </button>
                </>
            }
        >
            <p className="mb-4 text-gray-400 text-sm">
                Choose a template to load onto the canvas.{' '}
                <strong className="text-red-400">This will overwrite your current project.</strong>
            </p>

            <select
                value={selectedIndex}
                onChange={(e) => setSelectedIndex(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-base focus:outline-none focus:border-yellow-400 text-white mb-4"
                aria-label="Select a project template"
            >
                <option value="" disabled>Select a template...</option>
                {TEMPLATES.map((template, index) => (
                    <option key={index} value={index}>
                        {template.name}
                    </option>
                ))}
            </select>

            <div className="bg-gray-900/50 p-3 rounded-md border border-gray-700 min-h-[5rem]">
                {selectedTemplate ? (
                    <p className="text-sm text-gray-400">{selectedTemplate.description}</p>
                ) : (
                    <p className="text-sm text-gray-500">Select a template to see its description.</p>
                )}
            </div>
        </Modal>
    );
};

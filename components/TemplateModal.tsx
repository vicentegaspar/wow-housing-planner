import React, { useState } from 'react';
import type { Layout } from '../types';
import { TEMPLATES } from '../templates';
import { Modal } from './Modal';
import { LayoutPreview } from './LayoutPreview';

interface TemplateModalProps {
    onClose: () => void;
    onSelectTemplate: (layout: Layout) => void;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({ onClose, onSelectTemplate }) => {
    const [selectedIndex, setSelectedIndex] = useState<string>('');
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

    const selectedTemplate = selectedIndex !== '' ? TEMPLATES[parseInt(selectedIndex, 10)] : null;
    const hoveredTemplate = hoveredIndex !== null ? TEMPLATES[hoveredIndex] : null;

    const handleApply = () => {
        if (selectedTemplate) {
            onSelectTemplate(selectedTemplate.layout);
        }
    };

    const handleMouseEnter = (index: number, e: React.MouseEvent<HTMLButtonElement>) => {
        setHoveredIndex(index);
        const rect = e.currentTarget.getBoundingClientRect();
        const gap = 8;
        const tooltipW = 220;
        const tooltipH = 180;
        let x = rect.right + gap;
        let y = rect.top;
        if (x + tooltipW > window.innerWidth) x = rect.left - tooltipW - gap;
        if (y + tooltipH > window.innerHeight) y = window.innerHeight - tooltipH - 8;
        if (y < 8) y = 8;
        setTooltipPos({ x, y });
    };

    const handleMouseLeave = () => {
        setHoveredIndex(null);
        setTooltipPos(null);
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

            <div className="flex flex-col gap-2">
                <div className="relative max-h-64 overflow-y-auto space-y-1 pr-1 border border-gray-600 rounded bg-gray-800/50 p-1">
                    {TEMPLATES.map((template, index) => (
                        <button
                            key={index}
                            type="button"
                            value={index}
                            onClick={() => setSelectedIndex(String(index))}
                            onMouseEnter={(e) => handleMouseEnter(index, e)}
                            onMouseLeave={handleMouseLeave}
                            className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                                selectedIndex === String(index)
                                    ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50'
                                    : 'text-gray-300 hover:bg-gray-700/80 border border-transparent'
                            }`}
                        >
                            {template.name}
                        </button>
                    ))}
                </div>

                <div className="bg-gray-900/50 p-3 rounded-md border border-gray-700 min-h-[3.5rem]">
                    {(hoveredTemplate ?? selectedTemplate) ? (
                        <p className="text-sm text-gray-400">
                            {(hoveredTemplate ?? selectedTemplate)!.description}
                        </p>
                    ) : (
                        <p className="text-sm text-gray-500">
                            Hover or select a template to see its description and preview.
                        </p>
                    )}
                </div>
            </div>

            {hoveredTemplate && tooltipPos && (
                <div
                    className="fixed z-[60] pointer-events-none"
                    style={{
                        left: tooltipPos.x,
                        top: tooltipPos.y,
                    }}
                >
                    <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-2">
                        <div className="text-xs text-gray-400 mb-1.5 font-medium">
                            {hoveredTemplate.name}
                        </div>
                        <LayoutPreview
                            layout={hoveredTemplate.layout}
                            maxWidth={200}
                            maxHeight={140}
                            showAllFloors={true}
                        />
                    </div>
                </div>
            )}
        </Modal>
    );
};

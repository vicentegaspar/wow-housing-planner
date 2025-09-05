import React, { useState } from 'react';
import type { Layout } from '../types';
import { TEMPLATES } from '../templates';
import { motion } from 'framer-motion';

interface StartupModalProps {
    onClose: () => void;
    onOpenImportModal: () => void;
    onSelectTemplate: (layout: Layout) => void;
}

const OptionCard: React.FC<{ title: string, description: string, icon: React.ReactNode, onClick: () => void }> = ({ title, description, icon, onClick }) => (
    <button
        onClick={onClick}
        className="wow-panel border-2 border-transparent hover:border-yellow-400 flex flex-col items-center justify-center text-center p-6 rounded-lg transition-all transform hover:scale-105"
    >
        <div className="text-yellow-400 text-5xl mb-4">{icon}</div>
        <h3 className="font-title text-2xl text-yellow-300 mb-2">{title}</h3>
        <p className="text-gray-400">{description}</p>
    </button>
);

export const StartupModal: React.FC<StartupModalProps> = ({ onClose, onOpenImportModal, onSelectTemplate }) => {
    const [selectedIndex, setSelectedIndex] = useState<string>('');

    const selectedTemplate = selectedIndex !== '' ? TEMPLATES[parseInt(selectedIndex, 10)] : null;

    const handleSelectTemplate = () => {
        if (selectedTemplate) {
            onSelectTemplate(selectedTemplate.layout);
        }
    };

    return (
        <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-8 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="w-full max-w-5xl">
                <header className="text-center mb-10">
                    <h1 className="text-5xl font-title text-yellow-400 mb-2">WoW Housing Planner</h1>
                    <p className="text-xl text-gray-300">Welcome! How would you like to begin your project?</p>
                </header>

                <main className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Main Options */}
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <OptionCard
                            title="New Blank Project"
                            description="Start fresh with a clean, empty canvas."
                            icon={<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path d="M8 2a.5.5 a 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z"/></svg>}
                            onClick={onClose}
                        />
                        <OptionCard
                            title="Import Project"
                            description="Load a project from a file or shareable code."
                            icon={<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/></svg>}
                            onClick={() => {
                                onClose();
                                onOpenImportModal();
                            }}
                        />
                    </div>

                    {/* Templates */}
                    <div className="wow-panel p-6 rounded-lg flex flex-col">
                        <h3 className="font-title text-2xl text-yellow-300 mb-4 border-b border-gray-600 pb-2">Start from a Template</h3>
                        <div className="flex-1 flex flex-col gap-4">
                            <select
                                value={selectedIndex}
                                onChange={(e) => setSelectedIndex(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-base focus:outline-none focus:border-yellow-400 text-white"
                                aria-label="Select a project template"
                            >
                                <option value="" disabled>Select a template...</option>
                                {TEMPLATES.map((template, index) => (
                                    <option key={index} value={index}>
                                        {template.name}
                                    </option>
                                ))}
                            </select>
                            
                            <div className="bg-gray-900/50 p-3 rounded-md border border-gray-700 min-h-[6rem] flex-grow">
                                {selectedTemplate ? (
                                    <p className="text-sm text-gray-400">{selectedTemplate.description}</p>
                                ): (
                                     <p className="text-sm text-gray-500">Select a template to see its description.</p>
                                )}
                            </div>
                            
                            <div className="mt-auto">
                                <button
                                    onClick={handleSelectTemplate}
                                    disabled={!selectedTemplate}
                                    className="w-full wow-button py-2 text-base"
                                >
                                    Use Template
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </motion.div>
    );
};

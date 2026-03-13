import React from 'react';
import type { Layout } from '../types';
import { motion } from 'framer-motion';

interface StartupModalProps {
    onClose: () => void;
    onNewBlankProject: () => void;
    onOpenImportModal: () => void;
    onSelectTemplate: (layout: Layout) => void;
    onOpenTemplateModal: () => void;
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

export const StartupModal: React.FC<StartupModalProps> = ({ onClose, onNewBlankProject, onOpenImportModal, onSelectTemplate: _onSelectTemplate, onOpenTemplateModal }) => {
    return (
        <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-8 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="w-full max-w-3xl">
                <header className="text-center mb-10">
                    <h1 className="text-5xl font-title text-yellow-400 mb-2">WoW Housing Planner</h1>
                    <p className="text-xl text-gray-300">Welcome! How would you like to begin your project?</p>
                </header>

                <main className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                    <OptionCard
                        title="New Blank Project"
                        description="Start fresh with a clean, empty canvas."
                        icon={<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z"/></svg>}
                        onClick={onNewBlankProject}
                    />
                    <OptionCard
                        title="Load a Template"
                        description="Start from a pre-built WoW house design."
                        icon={<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm8 0A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3z"/></svg>}
                        onClick={() => { onClose(); onOpenTemplateModal(); }}
                    />
                    <OptionCard
                        title="Import Project"
                        description="Load a project from a file or shareable code."
                        icon={<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/></svg>}
                        onClick={() => { onClose(); onOpenImportModal(); }}
                    />
                </main>
            </div>
        </motion.div>
    );
};

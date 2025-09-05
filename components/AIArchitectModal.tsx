import React, { useState } from 'react';
import { Modal } from './Modal';

interface AIArchitectModalProps {
    onClose: () => void;
    onGenerate: (prompt: string) => Promise<void>;
}

const samplePrompts = [
    "A cozy two-story cottage with a living room and kitchen downstairs, and two bedrooms upstairs.",
    "A formidable dwarven blacksmith with a large, open forge area and a small storefront.",
    "A single-floor orcish barracks with a long mess hall and an armory.",
    "A tall, slender elven mage tower with multiple floors, each a single round room.",
    "A sprawling, single-story tavern with a T-shaped common room, a big kitchen, and a cellar.",
];

export const AIArchitectModal: React.FC<AIArchitectModalProps> = ({ onClose, onGenerate }) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerateClick = async () => {
        if (!prompt.trim()) {
            alert("Please enter a description for the layout.");
            return;
        }
        if (!window.confirm("Are you sure? This will generate a new layout and overwrite your current project.")) {
            return;
        }
        setIsLoading(true);
        await onGenerate(prompt);
        setIsLoading(false);
    };
    
    const handleSampleClick = () => {
        const randomPrompt = samplePrompts[Math.floor(Math.random() * samplePrompts.length)];
        setPrompt(randomPrompt);
    };

    return (
        <Modal
            title="AI Layout Architect"
            onClose={onClose}
            footer={
                <>
                    <button onClick={onClose} disabled={isLoading} className="px-4 py-2 wow-button !text-gray-400 !border-gray-600 hover:!border-gray-400 hover:!text-white">
                        Cancel
                    </button>
                    <button onClick={handleGenerateClick} disabled={isLoading || !prompt.trim()} className="px-4 py-2 wow-button">
                        {isLoading ? 'Generating...' : 'Generate Layout'}
                    </button>
                </>
            }
        >
            {isLoading ? (
                <div className="h-64 flex flex-col items-center justify-center">
                     <svg className="animate-spin h-10 w-10 text-yellow-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="font-title text-xl text-yellow-400 mt-4">The Architect is thinking...</p>
                    <p className="text-gray-300">This may take a moment.</p>
                </div>
            ) : (
                <>
                    <p className="mb-2">Describe the building you want to create. Be as descriptive as you like! Mention the style, number of floors, and types of rooms.</p>
                    <p className="mb-4 text-sm"><strong className="text-red-400">Warning:</strong> Generating a new layout will overwrite your current project.</p>
                    
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g. A grand two-story library with a large reading room and several small study rooms..."
                        className="w-full h-40 bg-gray-900 border border-gray-600 rounded p-2 text-base font-body focus:outline-none focus:border-yellow-400 resize-y"
                        aria-label="Layout description prompt"
                        autoFocus
                    />
                     <div className="text-right mt-2">
                        <button onClick={handleSampleClick} className="text-sm text-yellow-400 hover:text-yellow-200 transition-colors">
                           Try a sample prompt
                        </button>
                    </div>
                </>
            )}
        </Modal>
    );
};
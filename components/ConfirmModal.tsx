import React from 'react';
import { Modal } from './Modal';

interface ConfirmModalProps {
    title: string;
    message: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    dangerous?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
    dangerous = false,
}) => (
    <Modal
        title={title}
        onClose={onCancel}
        footer={
            <>
                <button
                    onClick={onCancel}
                    className="px-4 py-2 wow-button !text-gray-400 !border-gray-600 hover:!border-gray-400 hover:!text-white"
                >
                    {cancelLabel}
                </button>
                <button
                    onClick={onConfirm}
                    className={`px-4 py-2 wow-button ${dangerous ? '!border-red-500 !text-red-400 hover:!border-red-400 hover:!text-red-300' : ''}`}
                >
                    {confirmLabel}
                </button>
            </>
        }
    >
        <div className="flex items-start gap-4">
            {dangerous && (
                <div className="flex-shrink-0 mt-0.5 text-red-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.378-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                    </svg>
                </div>
            )}
            <p>{message}</p>
        </div>
    </Modal>
);

import React from 'react';
import { Trash2, AlertTriangle, Info, HelpCircle } from 'lucide-react';

export const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "danger"
    
}) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'danger':
                return (
                    <div className="mx-auto w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-5">
                        <Trash2 className="w-7 h-7 text-red-500" strokeWidth={1.5} />
                    </div>
                );
            case 'warning':
                return (
                    <div className="mx-auto w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mb-5">
                        <AlertTriangle className="w-7 h-7 text-amber-500" strokeWidth={1.5} />
                    </div>
                );
            case 'info':
                return (
                    <div className="mx-auto w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-5">
                        <Info className="w-7 h-7 text-blue-500" strokeWidth={1.5} />
                    </div>
                );
            default:
                return (
                    <div className="mx-auto w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mb-5">
                        <HelpCircle className="w-7 h-7 text-gray-500" strokeWidth={1.5} />
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden transform transition-all scale-100">
                <div className="p-6 text-center">
                    {getIcon()}
                    <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">{title}</h3>
                    <p className="text-sm text-[var(--color-text-secondary)] mb-7 leading-relaxed">{message}</p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 text-[var(--color-primary)] bg-transparent border-2 border-[var(--color-primary)] rounded-xl hover:bg-[var(--color-primary-lightest)] transition-colors font-semibold flex-1"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className="px-6 py-2.5 text-white bg-[var(--color-primary)] border-2 border-[var(--color-primary)] rounded-xl hover:opacity-90 transition-opacity font-semibold flex-1 shadow-md shadow-[var(--color-primary-lighter)]"
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
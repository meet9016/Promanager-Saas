import { useEffect } from 'react';
import { CheckCircle, AlertCircle, XCircle, X } from 'lucide-react';

export const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const getToastStyles = () => {
        switch (type) {
            case 'success':
                return 'bg-[var(--color-success-light)] border-[var(--color-success-medium)] text-[var(--color-text-success)]';
            case 'error':
                return 'bg-[var(--color-error-light)] border-[var(--color-error)] text-[var(--color-text-error)]';
            case 'warning':
                return 'bg-[var(--color-warning-light)] border-[var(--color-warning)] text-[var(--color-warning-dark)]';
            default:
                return 'bg-[var(--color-primary-lightest)] border-[var(--color-primary-light)] text-[var(--color-primary-dark)]';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle className="w-5 h-5 text-[var(--color-success-dark)]" />;
            case 'error':
                return <XCircle className="w-5 h-5 text-[var(--color-text-error)]" />;
            case 'warning':
                return <AlertCircle className="w-5 h-5 text-[var(--color-warning-dark)]" />;
            default:
                return <AlertCircle className="w-5 h-5 text-[var(--color-primary-dark)]" />;
        }
    };

    return (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg border shadow-lg transition-all duration-300 ${getToastStyles()}`}>
            <div className="flex items-center space-x-3">
                {getIcon()}
                <span className="font-medium">{message}</span>
                <button
                    onClick={onClose}
                    className="ml-auto p-1 hover:bg-[var(--color-bg-hover)] rounded"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
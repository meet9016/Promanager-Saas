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

    const getButtonStyles = () => {
        switch (type) {
            case 'danger':
                return 'bg-[var(--color-error)] hover:bg-[var(--color-error)] text-[var(--color-text-white)]';
            case 'warning':
                return 'bg-yellow-600 hover:bg-yellow-700 text-[var(--color-text-white)]';
            case 'info':
                return 'bg-[var(--color-primary-dark)] hover:bg-[var(--color-primary-darker)] text-[var(--color-text-white)]';
            default:
                return 'bg-gray-600 hover:bg-gray-700 text-[var(--color-text-white)]';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-[var(--color-bg-secondary)] rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="p-8">
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">{title}</h3>
                    <p className="text-[var(--color-text-secondary)] mb-6">{message}</p>
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-[var(--color-text-secondary)] bg-[var(--color-bg-gradient-start)] hover:bg-[var(--color-bg-gray-light)] rounded-lg transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`px-4 py-2 rounded-lg transition-colors ${getButtonStyles()}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
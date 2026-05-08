import { X, AlertTriangle, Crown, CreditCard, Calendar } from 'lucide-react';
const SubscriptionWarningModal = ({ isOpen, onClose, daysLeft }) => {
    if (!isOpen) return null;

    const handleClose = () => {
        onClose();
    };

    const handleRenew = () => {
        window.location.href = '/renew';
    };

    const getUrgencyColor = () => {
        if (daysLeft <= 3) return 'from-[var(--color-error)] to-[var(--color-error-dark)]';
        if (daysLeft <= 7) return 'from-[var(--color-warning)] to-[var(--color-warning-dark)]';
        return 'from-[var(--color-yellow)] to-[var(--color-yellow-dark)]';
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--color-bg-card)] rounded-2xl shadow-custom-hover max-w-md w-full border border-[var(--color-border-primary)] animate-fadeIn">
                {/* Header */}
                <div className="flex items-center justify-between p-8 border-b border-[var(--color-border-primary)]">
                    <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 bg-gradient-to-br ${getUrgencyColor()} rounded-full flex items-center justify-center shadow-custom`}>
                            <AlertTriangle className="w-5 h-5 text-[var(--color-text-white)]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                                Subscription Expiring
                            </h2>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-custom"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8">
                    {/* Days Left Display */}
                    <div className="text-center mb-6">
                        <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${getUrgencyColor()} rounded-full mb-4 shadow-custom`}>
                            <span className="text-2xl font-bold text-[var(--color-text-white)]">{daysLeft}</span>
                        </div>
                        <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
                            {daysLeft === 1 ? '1 Day Left' : `${daysLeft} Days Left`}
                        </h3>
                        <p className="text-[var(--color-text-secondary)] leading-relaxed">
                            Your subscription will expire in {daysLeft === 1 ? '1 day' : `${daysLeft} days`}.
                            Don't lose access to your important data and features.
                        </p>
                    </div>

                    {/* Features at Risk */}
                    <div className="bg-[var(--color-bg-hover)] rounded-lg p-4 mb-6 border border-[var(--color-border-primary)]">
                        <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 flex items-center">
                            <Crown className="w-4 h-4 mr-2 text-[var(--color-warning)]" />
                            Data at Risk:
                        </h4>
                        <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
                            <li className="flex items-center">
                                <div className="w-2 h-2 bg-[var(--color-error)] rounded-full mr-3"></div>
                                Employee Management
                            </li>
                            <li className="flex items-center">
                                <div className="w-2 h-2 bg-[var(--color-error)] rounded-full mr-3"></div>
                                Payroll Processing
                            </li>
                            <li className="flex items-center">
                                <div className="w-2 h-2 bg-[var(--color-error)] rounded-full mr-3"></div>
                                Reports & Analytics
                            </li>
                        </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <button
                            onClick={handleRenew}
                            className="w-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-[var(--color-text-white)] py-3 px-4 rounded-lg font-semibold hover:from-[var(--color-primary-dark)] hover:to-[var(--color-primary-darker)] transition-custom flex items-center justify-center space-x-2 shadow-custom"
                        >
                            <CreditCard className="w-5 h-5" />
                            <span>Renew Now</span>
                        </button>

                        <button
                            onClick={handleClose}
                            className="w-full border border-[var(--color-border-secondary)] text-[var(--color-text-primary)] py-3 px-4 rounded-lg font-semibold hover:bg-[var(--color-bg-hover)] transition-custom flex items-center justify-center space-x-2"
                        >
                            <Calendar className="w-5 h-5" />
                            <span>Remind Me Later</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionWarningModal;
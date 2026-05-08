import { useState } from 'react';
import { X, FileText, CheckCircle, Clock, Calendar, DollarSign, TrendingUp } from 'lucide-react';

export const LoanDetailsModal = ({ isOpen, onClose, loanDetails, loading, onMarkAsPaid }) => {
    const [processingId, setProcessingId] = useState(null);

    if (!isOpen) return null;

    const summary = loanDetails?.summary || {};
    const installments = loanDetails?.installments || [];

    const getStatusBadgeClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'done':
            case 'paid':
                return 'bg-green-100 text-green-800 border border-green-200';
            case 'pending':
                return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
            case 'overdue':
                return 'bg-[var(--color-error-light)] text-[var(--color-text-error)] border border-red-200';
            default:
                return 'bg-[var(--color-bg-gray-light)] text-[var(--color-text-secondary)] border border-[var(--color-border-primary)]';
        }
    };

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'done':
            case 'paid':
                return <CheckCircle className="w-3.5 h-3.5" />;
            case 'pending':
                return <Clock className="w-3.5 h-3.5" />;
            default:
                return <Calendar className="w-3.5 h-3.5" />;
        }
    };




    const calculateTotalAmount = () => {
        if (!loanDetails || loanDetails.length === 0) return 0;
        return loanDetails.reduce((total, installment) => {
            return total + parseFloat(installment.installment_amount || 0);
        }, 0);
    };

    const getPaidInstallments = () => {
        if (!loanDetails || loanDetails.length === 0) return 0;
        return loanDetails.filter(installment =>
            installment.payment_status?.toLowerCase() === 'paid'
        ).length;
    };

    const getPendingInstallments = () => {
        if (!loanDetails || loanDetails.length === 0) return 0;
        return loanDetails.filter(installment =>
            installment.payment_status?.toLowerCase() === 'pending'
        ).length;
    };

    const getNextPendingInstallment = () => {
        if (!installments || installments.length === 0) return null;

        const pendingInstallments = installments.filter(
            installment => installment.payment_status?.toLowerCase() === 'pending'
        );

        if (pendingInstallments.length === 0) return null;

        pendingInstallments.sort((a, b) => {
            const dateA = new Date(a.payment_date.split('-').reverse().join('-'));
            const dateB = new Date(b.payment_date.split('-').reverse().join('-'));
            return dateA - dateB;
        });

        return pendingInstallments[0];
    };


    const canPayInstallment = (installment) => {
        const status = installment.payment_status?.toLowerCase();
        if (status === 'done' || status === 'paid') {
            return false;
        }

        const nextPending = getNextPendingInstallment();
        if (!nextPending) return false;

        return installment.loan_items_id === nextPending.loan_items_id;
    };

    const handleMarkAsPaid = async (installment) => {
        setProcessingId(installment.loan_items_id);
        try {
            await onMarkAsPaid(installment.loan_items_id);
        } catch (error) {
            console.error('Error marking installment as paid:', error);
        } finally {
            setProcessingId(null);
        }
    };

    const paidCount = parseInt(summary.total_paid_installment || 0);
    const pendingCount = parseInt(summary.total_unpaid_installment || 0);
    const totalCount = parseInt(summary.total_installment || 0);
    const progressPercentage = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-2xl  w-full max-h-[90vh] overflow-hidden border border-[var(--color-primary-dark)]">
                {/* Modal Header */}
                <div className="relative bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] px-8 py-6">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 text-[var(--color-text-white)] hover:text-[var(--color-text-white)] transition-colors p-1 hover:bg-white/10 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <TrendingUp className="w-6 h-6 text-[var(--color-text-white)]" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-[var(--color-text-white)]">
                                Loan Installment Details
                            </h2>
                            <p className="text-[var(--color-text-white)] text-sm mt-1">
                                Track and manage your loan payments
                            </p>
                        </div>
                    </div>
                </div>

                {/* Modal Content */}
                <div className="p-8 overflow-y-auto max-h-[calc(90vh-140px)] bg-[var(--color-bg-primary)]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="w-12 h-12 border-4 border-[var(--color-primary-dark)] border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-[var(--color-text-secondary)] font-medium">Loading installment details...</p>
                        </div>
                    ) : installments && installments.length > 0 ? (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                <div className="bg-[var(--color-bg-secondary)] rounded-xl p-5 shadow-sm border border-[var(--color-border-primary)] hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">Total Installments</h3>
                                        <div className="w-10 h-10 bg-[var(--color-primary-lighter)] rounded-lg flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-[var(--color-primary-dark)]" />
                                        </div>
                                    </div>
                                    <p className="text-3xl font-bold text-[var(--color-text-primary)]">{totalCount}</p>
                                </div>

                                <div className="bg-[var(--color-bg-secondary)] rounded-xl p-5 shadow-sm border border-[var(--color-border-primary)] hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">Paid Installments</h3>
                                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                            <CheckCircle className="w-5 h-5 text-green-700" />
                                        </div>
                                    </div>
                                    <p className="text-3xl font-bold text-green-700">{paidCount}</p>
                                </div>

                                <div className="bg-[var(--color-bg-secondary)] rounded-xl p-5 shadow-sm border border-[var(--color-border-primary)] hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">Pending Installments</h3>
                                        <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                                            <Clock className="w-5 h-5 text-yellow-600" />
                                        </div>
                                    </div>
                                    <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
                                </div>

                                <div className="bg-[var(--color-bg-secondary)] rounded-xl p-5 shadow-sm border border-[var(--color-border-primary)] hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">Remaining Amount</h3>
                                        <div className="w-10 h-10 bg-[var(--color-primary-lighter)] rounded-lg flex items-center justify-center">
                                            <DollarSign className="w-5 h-5 text-[var(--color-primary-dark)]" />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                                        ₹{parseFloat(summary.remaining_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="bg-[var(--color-bg-secondary)] rounded-xl p-8 shadow-sm border border-[var(--color-border-primary)] mb-6">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Payment Progress</h3>
                                    <span className="text-sm font-medium text-[var(--color-text-secondary)]">{progressPercentage.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-[var(--color-bg-gray-light)] rounded-full h-3 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] h-3 rounded-full transition-all duration-500 ease-out"
                                        style={{ width: `${progressPercentage}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between mt-2 text-xs text-[var(--color-text-secondary)]">
                                    <span>Paid: ₹{parseFloat(summary.paid_amount || 0).toLocaleString('en-IN')}</span>
                                    <span>Total: ₹{parseFloat(summary.total_amount || 0).toLocaleString('en-IN')}</span>
                                </div>
                            </div>

                            {/* Installments Table */}
                            <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-sm border border-[var(--color-border-primary)] overflow-hidden">
                                <div className="px-6 py-4 bg-[var(--color-primary-lighter)] border-b border-[var(--color-border-primary)]">
                                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Installment Schedule</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-[var(--color-primary-lightest)] border-b border-[var(--color-border-primary)]">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                                                    No.
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                                                    Payment Date
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                                                    Installment Amount
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--color-border-divider)]">
                                            {installments.map((installment, index) => {
                                                const canPay = canPayInstallment(installment);
                                                const isPaid = installment.payment_status?.toLowerCase() === 'done' || installment.payment_status?.toLowerCase() === 'paid';
                                                const isProcessing = processingId === installment.loan_items_id;
                                                return (
                                                    <tr key={installment.loan_items_id || index} className="hover:bg-[var(--color-bg-primary)] transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--color-bg-gray-light)] text-sm font-semibold text-[var(--color-text-primary)]">
                                                                {index + 1}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
                                                                <Calendar className="w-4 h-4 text-[var(--color-text-muted)]" />
                                                                {installment.payment_date}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                                                                ₹{parseFloat(installment.installment_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full ${getStatusBadgeClass(installment.payment_status)}`}>
                                                                {getStatusIcon(installment.payment_status)}
                                                                {installment.payment_status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {!isPaid && (
                                                                <button
                                                                    onClick={() => handleMarkAsPaid(installment)}
                                                                    disabled={!canPay || isProcessing}
                                                                    className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${canPay && !isProcessing
                                                                        ? 'bg-[var(--color-primary-dark)] text-[var(--color-text-white)] hover:bg-[var(--color-primary-darker)] hover:shadow-md active:scale-95'
                                                                        : 'bg-[var(--color-bg-gray-light)] text-[var(--color-text-muted)] cursor-not-allowed'
                                                                        }`}
                                                                    title={!canPay ? 'You can only pay the next pending installment' : 'Mark as paid'}
                                                                >
                                                                    {isProcessing ? (
                                                                        <>
                                                                            <div className="w-4 h-4 border-2 border-[var(--color-text-white)] border-t-transparent rounded-full animate-spin"></div>
                                                                            Processing...
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <CheckCircle className="w-4 h-4" />
                                                                            Mark as Paid
                                                                        </>
                                                                    )}
                                                                </button>
                                                            )}
                                                            {isPaid && (
                                                                <div className="inline-flex items-center gap-2 text-sm font-medium text-green-700">
                                                                    <CheckCircle className="w-4 h-4" />
                                                                    Completed
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                            }
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 bg-[var(--color-bg-gray-light)] rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-10 h-10 text-[var(--color-text-muted)]" />
                            </div>
                            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">No installment details found</h3>
                            <p className="text-[var(--color-text-secondary)]">There are no installment records for this loan.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
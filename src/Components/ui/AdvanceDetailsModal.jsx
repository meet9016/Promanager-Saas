import { useState } from 'react';
import { X, FileText, Plus, DollarSign, TrendingUp, CheckCircle, Clock, Calendar } from 'lucide-react';

export const AdvanceDetailsModal = ({ isOpen, onClose, advanceDetails, loading, onAddPayment }) => {
    const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentError, setPaymentError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleAddPaymentClick = () => {
        setIsAddPaymentOpen(true);
        setPaymentAmount('');
        setPaymentError('');
    };

    const handleCancelPayment = () => {
        setIsAddPaymentOpen(false);
        setPaymentAmount('');
        setPaymentError('');
    };

    const handleSubmitPayment = async () => {
        const amount = parseFloat(paymentAmount);

        if (!paymentAmount || amount <= 0) {
            setPaymentError('Please enter a valid amount');
            return;
        }

        const remainingAmount = parseFloat(advanceDetails?.remaining_amount || 0);
        if (amount > remainingAmount) {
            setPaymentError(`Amount cannot exceed remaining amount of ₹${remainingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
            return;
        }

        setIsSubmitting(true);
        setPaymentError('');

        try {
            await onAddPayment(amount);
            setIsAddPaymentOpen(false);
            setPaymentAmount('');
        } catch (error) {
            setPaymentError(error.message || 'Failed to add payment');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatCurrency = (amount) => {
        return `₹${parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    };

    const getPaymentTypeBadge = (paymentType) => {
        const isManual = paymentType === 'Manually';
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border ${isManual
                ? 'bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)] border-[var(--color-primary-light)]'
                : 'bg-green-100 text-green-800 border-green-200'
                }`}>
                {isManual ? <Clock className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                {paymentType}
            </span>
        );
    };

    const totalAmount = parseFloat(advanceDetails?.total_amount || 0);
    const paidAmount = parseFloat(advanceDetails?.paid_amount || 0);
    const remainingAmount = parseFloat(advanceDetails?.remaining_amount || 0);
    const progressPercentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

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
                                Advance Payment Details
                            </h2>
                            <p className="text-[var(--color-text-white)] text-sm mt-1">
                                Manage and track advance payments
                            </p>
                        </div>
                    </div>
                </div>

                {/* Modal Content */}
                <div className="p-8 overflow-y-auto max-h-[calc(90vh-140px)] bg-[var(--color-bg-primary)]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="w-12 h-12 border-4 border-[var(--color-primary-dark)] border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-[var(--color-text-secondary)] font-medium">Loading advance details...</p>
                        </div>
                    ) : advanceDetails ? (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-[var(--color-bg-secondary)] rounded-xl p-8 shadow-sm border border-[var(--color-border-primary)] hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">Total Amount</h3>
                                        <div className="w-10 h-10 bg-[var(--color-primary-lighter)] rounded-lg flex items-center justify-center">
                                            <DollarSign className="w-5 h-5 text-[var(--color-primary-dark)]" />
                                        </div>
                                    </div>
                                    <p className="text-3xl font-bold text-[var(--color-text-primary)]">
                                        {formatCurrency(totalAmount)}
                                    </p>
                                </div>

                                <div className="bg-[var(--color-bg-secondary)] rounded-xl p-8 shadow-sm border border-[var(--color-border-primary)] hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">Paid Amount</h3>
                                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                            <CheckCircle className="w-5 h-5 text-green-700" />
                                        </div>
                                    </div>
                                    <p className="text-3xl font-bold text-green-700">
                                        {formatCurrency(paidAmount)}
                                    </p>
                                </div>

                                <div className="bg-[var(--color-bg-secondary)] rounded-xl p-8 shadow-sm border border-[var(--color-border-primary)] hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">Remaining Amount</h3>
                                        <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                                            <Clock className="w-5 h-5 text-yellow-600" />
                                        </div>
                                    </div>
                                    <p className="text-3xl font-bold text-yellow-600">
                                        {formatCurrency(remainingAmount)}
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
                            </div>

                            {/* Add Payment Button */}
                            {remainingAmount > 0 && (
                                <div className="mb-6 flex justify-end">
                                    <button
                                        onClick={handleAddPaymentClick}
                                        className="inline-flex items-center gap-2 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] px-5 py-2.5 rounded-lg hover:bg-[var(--color-primary-darker)] hover:shadow-md transition-all font-medium active:scale-95"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Advance Payment
                                    </button>
                                </div>
                            )}

                            {/* Add Payment Form */}
                            {isAddPaymentOpen && (
                                <div className="mb-6 bg-[var(--color-bg-secondary)] border border-[var(--color-primary-light)] rounded-xl p-8 shadow-sm">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-10 h-10 bg-[var(--color-primary-lighter)] rounded-lg flex items-center justify-center">
                                            <Plus className="w-5 h-5 text-[var(--color-primary-dark)]" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Add New Payment</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block flex text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                Payment Amount
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-3 text-[var(--color-text-muted)] font-medium">₹</span>
                                                <input
                                                    type="number"
                                                    value={paymentAmount}
                                                    onChange={(e) => {
                                                        setPaymentAmount(e.target.value);
                                                        setPaymentError('');
                                                    }}
                                                    placeholder={`Enter amount (Maximum: ${formatCurrency(remainingAmount)})`}
                                                    className="w-full pl-10 pr-4 py-2.5 border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-dark)] focus:border-transparent text-[var(--color-text-primary)] bg-[var(--color-bg-secondary)]"
                                                    min="0"
                                                    step="0.01"
                                                />
                                            </div>
                                            {paymentError && (
                                                <div className="mt-2 flex items-center gap-2 text-sm text-[var(--color-text-error)] bg-[var(--color-error-light)] px-3 py-2 rounded-lg">
                                                    <X className="w-4 h-4" />
                                                    {paymentError}
                                                </div>
                                            )}

                                        </div>
                                        <div className="flex gap-3 justify-end pt-2">
                                            <button
                                                onClick={handleCancelPayment}
                                                disabled={isSubmitting}
                                                className="px-5 py-2.5 border border-[var(--color-border-secondary)] rounded-lg hover:bg-[var(--color-bg-primary)] transition-colors font-medium text-[var(--color-text-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSubmitPayment}
                                                disabled={isSubmitting}
                                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] rounded-lg hover:bg-[var(--color-primary-darker)] disabled:bg-[var(--color-bg-gray-light)] disabled:cursor-not-allowed transition-all font-medium active:scale-95"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-[var(--color-text-white)] border-t-transparent rounded-full animate-spin"></div>
                                                        Adding...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle className="w-4 h-4" />
                                                        Add Payment
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Payment History Table */}
                            <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-sm border border-[var(--color-border-primary)] overflow-hidden">
                                <div className="px-6 py-4 bg-[var(--color-primary-lighter)] border-b border-[var(--color-border-primary)]">
                                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Payment History</h3>
                                </div>
                                {advanceDetails.advance_list && advanceDetails.advance_list.length > 0 ? (
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
                                                        Amount
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                                                        Payment Type
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[var(--color-border-divider)]">
                                                {advanceDetails.advance_list.map((payment, index) => (
                                                    <tr key={payment.employee_salary_id || index} className="hover:bg-[var(--color-bg-primary)] transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--color-bg-gray-light)] text-sm font-semibold text-[var(--color-text-primary)]">
                                                                {index + 1}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
                                                                <Calendar className="w-4 h-4 text-[var(--color-text-muted)]" />
                                                                {payment.advance_payment_date}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                                                                {formatCurrency(payment.amount)}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {getPaymentTypeBadge(payment.payment_type_text)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-16">
                                        <div className="w-20 h-20 bg-[var(--color-bg-gray-light)] rounded-full flex items-center justify-center mx-auto mb-4">
                                            <FileText className="w-10 h-10 text-[var(--color-text-muted)]" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">No payment history found</h3>
                                        <p className="text-[var(--color-text-secondary)]">No payments have been made for this advance yet.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 bg-[var(--color-bg-gray-light)] rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-10 h-10 text-[var(--color-text-muted)]" />
                            </div>
                            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">No advance details found</h3>
                            <p className="text-[var(--color-text-secondary)]">Unable to load advance details.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
import { useState } from 'react';
import { X, FileText, Plus, DollarSign, TrendingUp, CheckCircle, Clock, Calendar, AlertCircle, Wallet, Receipt, ShieldCheck } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHeaderRow, Th, Td } from './Table';

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
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border shadow-2xs transition-all ${isManual
                    ? 'bg-purple-50 text-purple-700 border-purple-200/80'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                }`}>
                {isManual ? <Clock className="w-3 h-3 text-purple-600" /> : <CheckCircle className="w-3 h-3 text-emerald-600" />}
                {paymentType}
            </span>
        );
    };

    const totalAmount = parseFloat(advanceDetails?.total_amount || 0);
    const paidAmount = parseFloat(advanceDetails?.paid_amount || 0);
    const remainingAmount = parseFloat(advanceDetails?.remaining_amount || 0);
    const progressPercentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

    return (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-5 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[88vh] overflow-hidden border border-slate-200/80 flex flex-col transition-all">
                
                {/* Modern Brand Header */}
                <div className="relative bg-gradient-to-r from-[var(--color-primary-dark)] via-[#4c1d95] to-[var(--color-primary-darker)] px-6 py-5 shadow-lg overflow-hidden shrink-0">
                    {/* Background Soft Glow Circles */}
                    <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-purple-400/20 rounded-full blur-2xl pointer-events-none"></div>

                    <div className="relative flex items-center justify-between z-10">
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 text-white shadow-inner shrink-0">
                                <Wallet className="w-5.5 h-5.5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-bold text-white tracking-tight">
                                        Advance Payment Overview
                                    </h2>
                                    <span className="bg-white/20 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full backdrop-blur-md border border-white/20">
                                        Live Track
                                    </span>
                                </div>
                                <p className="text-purple-100/90 text-xs mt-0.5 font-medium flex items-center gap-1.5">
                                    <ShieldCheck className="w-3.5 h-3.5 text-purple-200" />
                                    Real-time repayment tracking & ledger
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 transition-all p-2 rounded-full cursor-pointer backdrop-blur-sm active:scale-95"
                            title="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Main Scrollable Body */}
                <div className="p-5 sm:p-6 overflow-y-auto max-h-[calc(88vh-80px)] bg-slate-50/50 custom-scrollbar flex-1 space-y-5">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <div className="w-12 h-12 border-4 border-[var(--color-primary-dark)] border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-slate-600 font-semibold text-sm">Loading financial data...</p>
                        </div>
                    ) : advanceDetails ? (
                        <>
                            {/* Unified Financial Metrics Hub Banner */}
                            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/90">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:divide-x md:divide-slate-100">
                                    
                                    {/* Metric 1: Total Advance */}
                                    <div className="flex items-center gap-3.5 md:pr-4">
                                        <div className="w-11 h-11 bg-purple-50 text-purple-700 rounded-2xl flex items-center justify-center border border-purple-100 shrink-0">
                                            <DollarSign className="w-5.5 h-5.5" />
                                        </div>
                                        <div>
                                            <span className="text-sm font-semibold text-slate-600">Total Advance</span>
                                            <p className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                                                {formatCurrency(totalAmount)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Metric 2: Paid Amount */}
                                    <div className="flex items-center gap-3.5 md:px-4">
                                        <div className="w-11 h-11 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center border border-emerald-100 shrink-0">
                                            <CheckCircle className="w-5.5 h-5.5" />
                                        </div>
                                        <div>
                                            <span className="text-sm font-semibold text-emerald-600">Paid Amount</span>
                                            <p className="text-xl font-black text-emerald-600 tracking-tight mt-0.5">
                                                {formatCurrency(paidAmount)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Metric 3: Remaining Balance */}
                                    <div className="flex items-center gap-3.5 md:pl-4">
                                        <div className="w-11 h-11 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center border border-amber-100 shrink-0">
                                            <Clock className="w-5.5 h-5.5" />
                                        </div>
                                        <div>
                                            <span className="text-sm font-semibold text-amber-600">Remaining Balance</span>
                                            <p className="text-xl font-black text-amber-600 tracking-tight mt-0.5">
                                                {formatCurrency(remainingAmount)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Integrated Progress Bar Below Banner */}
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <div className="flex items-center justify-between text-sm font-bold mb-1.5">
                                        <span className="text-slate-600 flex items-center gap-1.5">
                                            <TrendingUp className="w-5 h-5 text-[var(--color-primary-dark)]" />
                                            Repayment Progress
                                        </span>
                                        <span className="text-[var(--color-primary-dark)] bg-purple-50 border border-purple-100 px-2.5 py-0.5 rounded-full">
                                            {progressPercentage.toFixed(1)}% Completed
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-200/60">
                                        <div
                                            className="bg-gradient-to-r from-[var(--color-primary-dark)] via-purple-600 to-emerald-500 h-1.5 rounded-full transition-all duration-700 ease-out shadow-xs"
                                            style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* Section Header & Add Payment Trigger Button */}
                            <div className="flex items-center justify-between pt-1">
                                <div className="flex items-center gap-2">
                                    <Receipt className="w-4.5 h-4.5 text-[var(--color-primary-dark)]" />
                                    <h3 className="text-base font-bold text-slate-800 tracking-tight">Payment Ledger</h3>
                                </div>

                                {remainingAmount > 0 && !isAddPaymentOpen && (
                                    <button
                                        onClick={handleAddPaymentClick}
                                        className="inline-flex items-center gap-2 bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] text-white px-4 py-2 rounded-xl hover:shadow-lg hover:shadow-purple-900/20 hover:-translate-y-0.5 transition-all duration-200 font-semibold text-xs sm:text-sm cursor-pointer active:translate-y-0"
                                    >
                                        <Plus className="w-4 h-4 stroke-[2.5]" />
                                        Add Payment
                                    </button>
                                )}
                            </div>

                            {/* Add Payment Form Container */}
                            {isAddPaymentOpen && (
                                <div className="bg-gradient-to-br from-purple-50/60 via-white to-slate-50 border border-purple-200/90 rounded-2xl p-5 shadow-md animate-fadeIn">
                                    <div className="flex items-center gap-2.5 mb-3.5 pb-2.5 border-b border-purple-100">
                                        <div className="w-8 h-8 bg-[var(--color-primary-dark)] text-white rounded-xl flex items-center justify-center shadow-xs">
                                            <Plus className="w-4 h-4 stroke-[2.5]" />
                                        </div>
                                        <div>
                                            <h4 className="text-md font-semibold text-slate-900">Record New Advance Payment</h4>
                                            <p className="text-[13px] text-slate-500 font-medium">Enter payment amount to deduct from remaining balance</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                                Payment Amount
                                            </label>
                                            <div className="relative flex items-center">
                                                <span className="absolute left-3.5 text-slate-400 font-bold text-base pointer-events-none">₹</span>
                                                <input
                                                    type="number"
                                                    value={paymentAmount}
                                                    onChange={(e) => {
                                                        setPaymentAmount(e.target.value);
                                                        setPaymentError('');
                                                    }}
                                                    placeholder={`Enter amount (Maximum: ${formatCurrency(remainingAmount)})`}
                                                    className="w-full pl-8 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-dark)] focus:border-transparent text-slate-900 font-bold bg-white text-sm shadow-2xs transition-all placeholder:font-normal placeholder:text-slate-400"
                                                    min="0"
                                                    step="0.01"
                                                />
                                            </div>
                                            {paymentError && (
                                                <div className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-3.5 py-2 rounded-xl">
                                                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                                                    <span>{paymentError}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-2.5 justify-end pt-1">
                                            <button
                                                onClick={handleCancelPayment}
                                                disabled={isSubmitting}
                                                className="px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors font-semibold text-slate-700 text-xs sm:text-sm disabled:opacity-50 cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSubmitPayment}
                                                disabled={isSubmitting}
                                                className="inline-flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] text-white rounded-xl hover:shadow-md transition-all font-semibold text-xs sm:text-sm disabled:opacity-50 active:scale-95 cursor-pointer"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                        Add Payment
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Payment History Table Card */}
                            <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-sm border border-[var(--color-border-primary)] overflow-hidden">
                                {advanceDetails.advance_list && advanceDetails.advance_list.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <Table className="min-w-full divide-y divide-[var(--color-border-divider)]">
                                            <TableHeader>
                                                <TableHeaderRow>
                                                    <Th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-white">
                                                        Payment Date
                                                    </Th>
                                                    <Th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-white">
                                                        Amount
                                                    </Th>
                                                    <Th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-white">
                                                        Payment Type
                                                    </Th>
                                                </TableHeaderRow>
                                            </TableHeader>
                                            <TableBody className="bg-[var(--color-bg-secondary)] divide-y divide-[var(--color-border-divider)]">
                                                {advanceDetails.advance_list.map((payment, index) => (
                                                    <TableRow key={payment.employee_salary_id || index} className="border-b border-[var(--color-border-divider)] hover:bg-[var(--color-bg-primary)] transition-colors">
                                                        <Td className="px-6 py-4 text-left whitespace-nowrap border-b border-[var(--color-border-divider)]">
                                                            <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)]">
                                                                <Calendar className="w-4 h-4 text-[var(--color-text-muted)]" />
                                                                {payment.advance_payment_date}
                                                            </div>
                                                        </Td>
                                                        <Td className="px-6 py-4 text-left whitespace-nowrap border-b border-[var(--color-border-divider)]">
                                                            <span className="text-sm font-bold text-[var(--color-text-primary)]">
                                                                {formatCurrency(payment.amount)}
                                                            </span>
                                                        </Td>
                                                        <Td className="px-6 py-4 text-left whitespace-nowrap border-b border-[var(--color-border-divider)]">
                                                            {getPaymentTypeBadge(payment.payment_type_text)}
                                                        </Td>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 px-4">
                                        <div className="w-14 h-14 bg-[var(--color-bg-gray-light)] rounded-full flex items-center justify-center mx-auto mb-3 text-[var(--color-text-muted)]">
                                            <FileText className="w-7 h-7" />
                                        </div>
                                        <h4 className="text-sm font-bold text-[var(--color-text-primary)] mb-1">No payment history found</h4>
                                        <p className="text-xs text-[var(--color-text-secondary)]">No payments have been recorded for this advance yet.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12 px-4">
                            <div className="w-14 h-14 bg-[var(--color-bg-gray-light)] rounded-full flex items-center justify-center mx-auto mb-3 text-[var(--color-text-muted)]">
                                <FileText className="w-7 h-7" />
                            </div>
                            <h4 className="text-sm font-bold text-[var(--color-text-primary)] mb-1">No advance details found</h4>
                            <p className="text-xs text-[var(--color-text-secondary)]">Unable to load advance details.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
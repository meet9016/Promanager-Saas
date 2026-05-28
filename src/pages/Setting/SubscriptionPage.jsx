import React, { useState, useEffect } from 'react';
import {
    Gift,
    AlertTriangle,
    Users as UsersIcon,
    ArrowLeft,
    CalendarDays,
    BadgeCheck,
    Clock3,
    FileText,
    Sparkles
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import { Toast } from '../../Components/ui/Toast';
import { useNavigate } from 'react-router-dom';

import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHeaderRow,
    Th,
    Td
} from '../../Components/ui/Table';

const SubscriptionPage = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();

    const [toast, setToast] = useState(null);
    const [subscriptions, setSubscriptions] = useState([]);

    useEffect(() => {
        const fetchSubscriptionList = async () => {
            try {
                if (!isAuthenticated() || !user?.user_id) {
                    setToast({
                        message: 'Please login again.',
                        type: 'error'
                    });
                    return;
                }

                const formData = new FormData();

                const response = await api.post(
                    '/subscription_list',
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                );

                if (response.data.success) {
                    setSubscriptions(response.data.data || []);
                } else {
                    setToast({
                        message: response.data.message || 'Unable to load data.',
                        type: 'error'
                    });
                }
            } catch (error) {
                console.error(error);

                setToast({
                    message: 'Failed to load subscription data.',
                    type: 'error'
                });
            }
        };

        fetchSubscriptionList();
    }, [user, isAuthenticated]);

    const subscriptionDays = parseInt(user?.subscriptions_days) || 0;
    const subscriptionStatus = parseInt(user?.subscriptions_status) || 0;

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + subscriptionDays);

    const getStatusInfo = (status, days) => {
        if (status === 1) {
            if (days <= 0) {
                return {
                    text: 'Expired',
                    color: 'red',
                    isExpired: true,
                    isExpiringSoon: false,
                    isActive: false
                };
            }

            if (days <= 7) {
                return {
                    text: 'Expiring Soon',
                    color: 'yellow',
                    isExpired: false,
                    isExpiringSoon: true,
                    isActive: true
                };
            }

            return {
                text: 'Active',
                color: 'green',
                isExpired: false,
                isExpiringSoon: false,
                isActive: true
            };
        }

        return {
            text: 'Inactive',
            color: 'gray',
            isExpired: false,
            isExpiringSoon: false,
            isActive: false
        };
    };

    const statusInfo = getStatusInfo(
        subscriptionStatus,
        subscriptionDays
    );

    const getStatusClasses = () => {
        switch (statusInfo.color) {
            case 'green':
                return 'bg-green-100 text-green-700 border border-green-200';

            case 'yellow':
                return 'bg-yellow-100 text-yellow-700 border border-yellow-200';

            case 'red':
                return 'bg-red-100 text-red-700 border border-red-200';

            default:
                return 'bg-gray-100 text-gray-700 border border-gray-200';
        }
    };

    const getBannerStyle = () => {
        if (statusInfo.isExpired) {
            return 'from-red-600 to-rose-700';
        }

        if (statusInfo.isExpiringSoon) {
            return 'from-yellow-500 to-orange-600';
        }

        if (statusInfo.isActive) {
            return 'from-emerald-500 to-green-700';
        }

        return 'from-gray-600 to-gray-800';
    };

    const getUserInitials = (name) => {
        if (!name) return 'U';

        return name
            .split(' ')
            .map((word) => word[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] p-6 lg:p-8">
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Header */}
            <div className="bg-[var(--color-bg-secondary)] rounded-3xl shadow-sm border border-[var(--color-border-primary)] overflow-hidden mb-6">
                <div className="bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] p-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center text-white backdrop-blur-sm"
                            >
                                <ArrowLeft size={20} />
                            </button>

                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <Gift className="w-7 h-7 text-white" />

                                    <h1 className="text-2xl lg:text-3xl font-bold text-white">
                                        Subscription Management
                                    </h1>
                                </div>

                                <p className="text-white/80 text-sm">
                                    Manage your current plan and billing history
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/renew')}
                            className="bg-white text-[var(--color-primary-dark)] hover:bg-gray-100 transition-all px-5 py-3 rounded-xl font-semibold shadow-lg"
                        >
                            Renew Plan
                        </button>
                    </div>
                </div>
            </div>

            {/* Banner */}
            <div
                className={`bg-gradient-to-r ${getBannerStyle()} rounded-3xl p-6 lg:p-8 text-white shadow-xl mb-6 relative overflow-hidden`}
            >
                <div className="absolute top-0 right-0 opacity-10">
                    <Sparkles className="w-40 h-40" />
                </div>

                <div className="relative z-10 flex items-center justify-between flex-wrap gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            {statusInfo.isExpired ? (
                                <AlertTriangle className="w-8 h-8" />
                            ) : (
                                <BadgeCheck className="w-8 h-8" />
                            )}

                            <h2 className="text-2xl font-bold">
                                {statusInfo.text} Subscription
                            </h2>
                        </div>

                        <p className="text-white/90 max-w-xl">
                            {statusInfo.isExpired
                                ? 'Your subscription has expired. Renew now to continue using premium features.'
                                : statusInfo.isExpiringSoon
                                ? 'Your subscription will expire soon. Renew before interruption.'
                                : 'Your subscription is active and working properly.'}
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-5 min-w-[220px]">
                        <p className="text-sm text-white/70 mb-1">
                            Days Remaining
                        </p>

                        <h3 className="text-4xl font-bold">
                            {subscriptionDays}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Main Card */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
                {/* Profile */}
                <div className="xl:col-span-2 bg-[var(--color-bg-secondary)] rounded-3xl shadow-sm border border-[var(--color-border-primary)] p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
                        <div className="flex items-center gap-5">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                {getUserInitials(user?.full_name)}
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
                                    {user?.full_name ||
                                        user?.name ||
                                        'User'}
                                </h2>

                                <p className="text-[var(--color-text-secondary)] mt-1">
                                    {user?.email ||
                                        user?.username ||
                                        '--'}
                                </p>

                                <div
                                    className={`inline-flex mt-3 px-4 py-1.5 rounded-full text-sm font-semibold ${getStatusClasses()}`}
                                >
                                    {statusInfo.text}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 flex-wrap">
                            <button className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white px-5 py-3 rounded-xl font-semibold transition-all shadow-md">
                                Manage Plan
                            </button>

                            <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-3 rounded-xl font-semibold transition-all">
                                Usage Details
                            </button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <InfoCard
                            icon={<Clock3 className="w-5 h-5" />}
                            title="Days Remaining"
                            value={`${subscriptionDays} Days`}
                        />

                        <InfoCard
                            icon={<CalendarDays className="w-5 h-5" />}
                            title="Expiry Date"
                            value={expirationDate.toLocaleDateString(
                                'en-GB'
                            )}
                        />

                        <InfoCard
                            icon={<BadgeCheck className="w-5 h-5" />}
                            title="Plan Status"
                            value={statusInfo.text}
                        />
                    </div>
                </div>

                {/* Side Summary */}
                <div className="bg-[var(--color-bg-secondary)] rounded-3xl shadow-sm border border-[var(--color-border-primary)] p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-lightest)] flex items-center justify-center">
                            <FileText className="w-6 h-6 text-[var(--color-primary-dark)]" />
                        </div>

                        <div>
                            <h3 className="font-bold text-lg text-[var(--color-text-primary)]">
                                Plan Summary
                            </h3>

                            <p className="text-sm text-[var(--color-text-secondary)]">
                                Current subscription overview
                            </p>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <SummaryRow
                            label="Current Plan"
                            value={subscriptions[0]?.plan_name}
                        />

                        <SummaryRow
                            label="Subscription"
                            value={statusInfo.text}
                        />

                        <SummaryRow
                            label="Employees"
                            value={
                                subscriptions[0]?.total_employee || '0'
                            }
                        />

                        <SummaryRow
                            label="Renewal"
                            value={
                                statusInfo.isExpired
                                    ? 'Required'
                                    : 'Available'
                            }
                        />
                    </div>

                    <button
                        onClick={() => navigate('/renew')}
                        className="w-full mt-8 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white py-3 rounded-2xl font-semibold hover:opacity-95 transition-all shadow-lg"
                    >
                        Renew Subscription
                    </button>
                </div>
            </div>

            {/* History Table */}
            <div className="bg-[var(--color-primary-lighter)] rounded-3xl shadow-sm border border-[var(--color-border-primary)] overflow-hidden ">
                <div className="flex items-center justify-between p-6 border-b border-[var(--color-border-primary)]">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center">
                            <UsersIcon className="w-6 h-6 text-[var(--color-primary-dark)]" />
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-[var(--color-primary-dark)]">
                                Subscription History
                            </h2>

                            <p className="text-sm text-[var(--color-primary-dark)]">
                                View all your invoices and plans
                            </p>
                        </div>
                    </div>
                </div>

                {subscriptions.length === 0 ? (
                    <div className="py-20 text-center">
                        <UsersIcon className="w-14 h-14 mx-auto text-gray-300 mb-4" />

                        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                            No Subscription History
                        </h3>

                        <p className="text-[var(--color-text-secondary)] mt-1">
                            Your subscription records will appear here
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableHeaderRow>
                                    {[
                                        'Invoice',
                                        'Plan',
                                        'Price',
                                        'Employees',
                                        'Amount',
                                        'Start Date',
                                        'End Date',
                                        'Status',
                                        'PDF'
                                    ].map((label) => (
                                        <Th
                                            key={label}
                                            className=" text-white font-bold text-center whitespace-nowrap"
                                        >
                                            {label}
                                        </Th>
                                    ))}
                                </TableHeaderRow>
                            </TableHeader>

                            <TableBody>
                                {subscriptions.map((item, index) => (
                                    <TableRow
                                        key={index}
                                        className="hover:bg-[var(--color-primary-lightest)] bg-white transition-all"
                                    >
                                        <Td className="font-semibold text-center">
                                            {item.invoice_no}
                                        </Td>

                                        <Td className="text-center">
                                            {item.plan_name}
                                        </Td>

                                        <Td className="text-center">
                                            ₹{item.plan_price}
                                        </Td>

                                        <Td className="text-center">
                                            {item.total_employee}
                                        </Td>

                                        <Td className="font-bold text-center text-[var(--color-primary-dark)]">
                                            ₹{item.amount}
                                        </Td>

                                        <Td className="text-center whitespace-nowrap">
                                            {item.starting_date}
                                        </Td>

                                        <Td className="text-center whitespace-nowrap">
                                            {item.ending_date}
                                        </Td>

                                        <Td className="text-center">
                                            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                                                {item.status_label}
                                            </span>
                                        </Td>

                                        <Td className="text-center">
                                            <a
                                                href={item.pdf_link}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-2 text-[var(--color-primary-dark)] font-semibold hover:underline"
                                            >
                                                <FileText size={16} />
                                                View
                                            </a>
                                        </Td>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </div>
    );
};

const InfoCard = ({ icon, title, value }) => {
    return (
        <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-2xl p-5 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-lightest)] flex items-center justify-center text-[var(--color-primary-dark)]">
                    {icon}
                </div>

                <p className="text-sm text-[var(--color-text-secondary)]">
                    {title}
                </p>
            </div>

            <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
                {value}
            </h3>
        </div>
    );
};

const SummaryRow = ({ label, value }) => {
    return (
        <div className="flex items-center justify-between border-b border-[var(--color-border-primary)] pb-3">
            <span className="text-[var(--color-text-secondary)]">
                {label}
            </span>

            <span className="font-semibold text-[var(--color-text-primary)]">
                {value}
            </span>
        </div>
    );
};

export default SubscriptionPage;
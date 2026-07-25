import React from 'react';
import { ArrowLeft, User, Mail, Phone, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

/* ===========
   SMALL UI
   =========== */
const SectionCard = ({ title, titleIcon, children, tight = false }) => (
    <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-[var(--color-primary-lighter)] p-5">
            <div className="flex items-center gap-3">
                <div className="rounded-lg text-[var(--color-primary-darker)]">{titleIcon}</div>
                <h2 className="text-xl font-bold text-[var(--color-primary-darker)]">{title}</h2>
            </div>
        </div>
        <div className={`p-8 ${tight ? 'pt-5' : ''}`}>{children}</div>
    </div>
);

const InfoTile = ({ label, children }) => (
    <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-4">
        <div className="text-xs uppercase tracking-wide text-[var(--color-text-secondary)] mb-1">{label}</div>
        <div className="text-[var(--color-text-primary)] font-medium">{children}</div>
    </div>
);

const getInitials = (name) =>
    name
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

const ProfilePage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const pretty = (val, fallback = '--') => (val === undefined || val === null || val === '' ? fallback : val);

    return (
        <div className="h-full bg-[var(--color-bg-primary)]">
            <div className="p-8 mx-auto space-y-6">
                {/* Header */}
                <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => navigate(-1)}
                                    className="flex items-center gap-2 text-[var(--color-text-white)] hover:opacity-90 transition-colors bg-[var(--color-bg-secondary-20)] px-2 py-2 rounded-lg backdrop-blur-sm"
                                >
                                    <ArrowLeft size={18} />
                                </button>
                                <div className="flex items-center gap-3">
                                    <User className="w-7 h-7 text-[var(--color-text-white)]" />
                                    <h1 className="text-2xl font-bold text-[var(--color-text-white)]">Profile</h1>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profile Content */}
                <div className="grid grid-cols-1 gap-6">
                    <SectionCard titleIcon={<User className="w-6 h-6 text-[var(--color-text-white)]" />} title="User Profile">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-[var(--color-primary)] rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                                {getInitials(user?.full_name || user?.name || user?.username || 'User')}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
                                    {pretty(user?.full_name || user?.name || user?.username, 'User')}
                                </h3>
                                <p className="text-[var(--color-text-secondary)]">
                                    {pretty(user?.email || user?.username || user?.number)}
                                </p>
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <InfoTile label="Full Name">
                                {pretty(user?.full_name || user?.name || user?.username)}
                            </InfoTile>
                            <InfoTile label="Email">
                                <span className="inline-flex items-center gap-2"><Mail size={14} /> {pretty(user?.email)}</span>
                            </InfoTile>
                            <InfoTile label="Phone">
                                <span className="inline-flex items-center gap-2"><Phone size={14} /> {pretty(user?.number)}</span>
                            </InfoTile>
                            <InfoTile label="Username">
                                {pretty(user?.username)}
                            </InfoTile>
                            <InfoTile label="Company">
                                <span className="inline-flex items-center gap-2"><Building2 size={14} /> {pretty(user?.company_name || user?.company || '—')}</span>
                            </InfoTile>
                            <InfoTile label="Subscription Days Left">
                                {pretty(user?.subscriptions_days, '0')} days
                            </InfoTile>
                        </div>
                    </SectionCard>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;

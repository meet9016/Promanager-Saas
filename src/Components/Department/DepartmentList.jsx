import React, { useState, useMemo, useRef, useEffect } from "react";
import { Users, X, Search, Settings2, ChevronDown, ChevronUp, Save, Trash2 } from "lucide-react";
import { useSelector } from 'react-redux';
import DepartmentForm from "./DepartmentForm";
import useDepartments from "../../hooks/useDepartments";
import LoadingSpinner from "../Loader/LoadingSpinner";
import { Toast } from "../ui/Toast";
import DeleteModal from "../comman/DeleteModal";
import CustomSelect from "../comman/CustomSelect";
import NoDataFound from "../comman/NoDataFound";

const SectionDivider = ({ label }) => (
    <div className="col-span-2 flex items-center gap-2 pt-2">
        <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider whitespace-nowrap">
            {label}
        </span>
        <div className="flex-1 h-px bg-[var(--color-border-secondary)]" />
    </div>
);

const OTRow = ({ otFormula, onFormulaChange, minValue, onMinChange, disabled }) => {
    const isApplied = otFormula === "2";
    return (
        <>
            <div className="flex items-center gap-3 pr-4">
                <span className="text-sm text-[var(--color-text-primary)] whitespace-nowrap">OT Formula</span>
                <CustomSelect
                    value={otFormula}
                    onChange={(e) => onFormulaChange(e.target.value)}
                    disabled={disabled}
                    searchable={false}
                    options={[
                        {
                            value: '1',
                            label: 'OT Not Applicable',
                        },
                        {
                            value: '2',
                            label: 'OT Applied',
                        },
                    ]}
                    className="flex-1 text-sm"
                />
            </div>
            <div className="flex items-center justify-end gap-2">
                {isApplied ? (
                    <>
                        <span className="text-xs text-[var(--color-text-secondary)] whitespace-nowrap">Min OT</span>
                        <input
                            type="number"
                            min="0"
                            value={minValue}
                            onChange={(e) => onMinChange(e.target.value)}
                            disabled={disabled}
                            className="w-20 px-2 py-1.5 text-sm text-right border border-[var(--color-border-secondary)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] disabled:opacity-40 transition-opacity"
                        />
                        <span className="text-xs text-[var(--color-text-secondary)] w-8 shrink-0">Mins</span>
                    </>
                ) : (
                    <span className="text-xs text-[var(--color-text-muted)] italic">Not applicable</span>
                )}
            </div>
        </>
    );
};

const AlwaysRow = ({ label, value, onChange, disabled }) => (
    <>
        <span className="text-sm text-[var(--color-text-primary)] pr-4 leading-snug">{label}</span>
        <div className="flex items-center justify-end gap-2">
            <input
                type="number"
                min="0"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="w-20 px-2 py-1.5 text-sm text-right border border-[var(--color-border-secondary)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] disabled:opacity-40 transition-opacity"
            />
            <span className="text-xs text-[var(--color-text-secondary)] w-8 shrink-0">Mins</span>
        </div>
    </>
);

// ─── Inline Accordion Settings Panel ─────────────────────────────────────────

const DepartmentAccordion = ({ department, onSave, saving }) => {
    const [d, setD] = useState({ ...department });

    const set = (key, value) => setD((prev) => ({ ...prev, [key]: value }));
    
    const handleOTChange = (value) => {
        setD((prev) => ({
            ...prev,
            ot_formula: value,
            overtime: value === "2"
                ? (prev.overtime === "0" || prev.overtime === 0 ? "30" : prev.overtime)
                : "0",
        }));
    };

    return (
        <div className="border-t border-[var(--color-border-secondary)] mt-3 pt-3">
            <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-3 items-center">
                <div className="col-span-2 space-y-1 mb-2">
                    <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                        Edit Department Name <span className="text-[var(--color-error)]">*</span>
                    </label>
                    <input
                        type="text"
                        value={d.name || ""}
                        onChange={(e) => setD((prev) => ({
                            ...prev,
                            name: e.target.value,
                        }))}
                        className="w-full px-4 py-3 border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]"
                        disabled={saving}
                    />
                </div>

                <SectionDivider label="Overtime" />
                <OTRow
                    otFormula={d.ot_formula}
                    onFormulaChange={handleOTChange}
                    minValue={d.overtime}
                    onMinChange={(v) => set("overtime", v)}
                    disabled={saving}
                />

                <SectionDivider label="Late Coming & Early Going" />
                <AlwaysRow
                    label="Grace Time for Late Coming"
                    value={d.late_coming}
                    onChange={(v) => set("late_coming", v)}
                    disabled={saving}
                />
                <AlwaysRow
                    label="Grace Time for Early Going"
                    value={d.early_going}
                    onChange={(v) => set("early_going", v)}
                    disabled={saving}
                />
            </div>

            {/* Save button */}
            <div className="flex justify-end mt-4">
                <button
                    onClick={() => onSave(d)}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium bg-[var(--color-primary-dark)] text-white rounded-lg hover:bg-[var(--color-primary-darker)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving
                        ? <><div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />Saving...</>
                        : <><Save className="w-3.5 h-3.5" />Save Changes</>}
                </button>
            </div>
        </div>
    );
};

const AccordionPanel = ({ isOpen, children }) => {
    const ref = useRef(null);
    const [height, setHeight] = useState(0);

    useEffect(() => {
        if (!ref.current) return;
        if (isOpen) {
            // measure and set exact height so transition ends precisely
            setHeight(ref.current.scrollHeight);
        } else {
            // first snap to current scrollHeight so collapsing animates from real height
            setHeight(ref.current.scrollHeight);
            // then in next frame set to 0 to trigger the transition
            requestAnimationFrame(() => {
                requestAnimationFrame(() => setHeight(0));
            });
        }
    }, [isOpen]);

    return (
        <div
            style={{
                maxHeight: isOpen ? height : 0,
                overflow: "visible",
                transition: "max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
        >
            <div ref={ref}>{children}</div>
        </div>
    );
};

// ─── DepartmentList ───────────────────────────────────────────────────────────

const DepartmentList = () => {
    const [searchTerm, setSearchTerm] = useState("");
    // tracks which department id accordion is open — only one at a time
    const [openId, setOpenId] = useState(null);
    const [savingId, setSavingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    const permissions = useSelector((state) => state.permissions) || {};
    const { departments, loading, initialLoad, addDepartment, updateDepartment, deleteDepartment } = useDepartments();

    const [toast, setToast] = useState(null);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        type: null,
        data: null
    });

    const showToast = (message, type) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    const handleAddDepartment = async (payload) => await addDepartment(payload);

    const handleDeleteClick = (department) => {
        setConfirmModal({
            isOpen: true,
            type: 'delete',
            data: department
        });
    };

    const confirmDeleteDepartment = async () => {
        const department = confirmModal.data;
        if (!department) return;
        const departmentId = department.department_id || department.id;
        setDeletingId(departmentId);
        try {
            await handleDeleteDepartment(departmentId);
        } catch (error) {
            showToast("An error occurred while deleting the Department.", error);
        } finally {
            setDeletingId(null);
            closeModal();
        }
    };

    const closeModal = () => {
        if (!deletingId) {
            setConfirmModal({ isOpen: false, type: null, data: null });
        }
    };

    const handleDeleteDepartment = async (departmentId) => {
        try {
            const result = await deleteDepartment(departmentId);

            if (result?.success) {
                setToast({
                    message: "Department deleted successfully!",
                    type: 'error'
                });

            } else {
                showToast(result?.message || "Failed to delete department.", "error");
            }
        } catch {
            showToast("An error occurred while deleting.", "error");
        }
    };


    const handleToggleAccordion = (departmentId) => {
        // if already open — close it, otherwise close current and open new
        setOpenId((prev) => (prev === departmentId ? null : departmentId));
    };

    const handleSave = async (updatedData) => {
        const departmentId = updatedData.department_id || updatedData.id;
        setSavingId(departmentId);
        try {
            const result = await updateDepartment(updatedData);
            if (result?.success) {
                showToast("Department updated successfully!", "success");
                setOpenId(null); // close accordion on success
            } else {
                showToast(result?.message || "Failed to update department.", "error");
            }
        } catch {
            showToast("An error occurred while saving.", "error");
        } finally {
            setSavingId(null);
        }
    };

    const filteredDepartments = useMemo(() => {
        if (!departments || !searchTerm.trim()) return departments || [];
        return departments.filter((d) =>
            d.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [departments, searchTerm]);

    if (initialLoad) return <div><LoadingSpinner /></div>;

    const totalDepartments = departments?.length ?? 0;
    const filteredCount = filteredDepartments.length;

    return (
        <div className="bg-[var(--color-bg-secondary)] flex-1 rounded-xl shadow-sm border border-[var(--color-primary-dark)] overflow-hidden flex flex-col min-h-0">
            {/* Header */}
            <div className="relative shrink-0">
                <div className="bg-[var(--color-primary-dark)] px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-[var(--color-bg-secondary-20)] rounded-lg">
                                <Users className="w-5 h-5 text-[var(--color-text-white)]" />
                            </div>
                            <h3 className="text-lg font-semibold text-[var(--color-text-white)]">Departments</h3>
                        </div>

                    </div>
                </div>
            </div>

            <div className="p-8 bg-[#FBF9FD] flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto">
                {/* Add Form */}
                {permissions['department_create'] && (
                    <div className="shrink-0">
                        <DepartmentForm onSubmit={handleAddDepartment} loading={loading} showToast={showToast} />
                    </div>
                )}

                {/* Search */}
                {totalDepartments > 0 && (
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                        <input
                            type="text"
                            placeholder="Search departments..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-9 py-2.5 border border-[var(--color-border-secondary)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] placeholder-gray-400"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                )}

                {/* Empty states */}
                {totalDepartments === 0 ? (
                    <div className="flex-1 flex items-center justify-center bg-[#FBF9FD]">
                        <NoDataFound
                            title="No Departments Found"
                            subtitle="Get started by adding your first department."
                        />
                    </div>
                ) : filteredCount === 0 ? (
                    <NoDataFound
                        title="No Departments Match Your Search"
                        subtitle="Try adjusting your search terms."
                    />
                ) : (

                    <div className="grid gap-3 shrink-0">
                        {filteredDepartments.map((department) => {
                            const departmentId = department.department_id || department.id;
                            const isOpen = openId === departmentId;
                            const isSaving = savingId === departmentId;

                            return (
                                <div
                                    key={departmentId}
                                    className={`border rounded-lg transition-all duration-200 ${isOpen ? "overflow-visible" : "overflow-hidden"} min-h-[65px] flex flex-col justify-center ${isOpen
                                        ? "border-[var(--color-primary-dark)] shadow-md bg-[var(--color-bg-secondary)]"
                                        : "border-[var(--color-border-primary)] hover:border-primary-300 hover:shadow-sm bg-gradient-to-r from-primary-50/20 to-indigo-50/20 hover:from-primary-50/40 hover:to-indigo-50/40"
                                        }`}
                                >
                                    {/* Card header row — always visible */}
                                    <div className="flex items-center justify-between p-4">

                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="p-1.5 bg-[var(--color-primary-lighter)] rounded-md shrink-0">
                                                <Users className="w-4 h-4 text-[var(--color-primary-dark)]" />
                                            </div>
                                            <h4 className="text-base font-semibold text-[var(--color-text-primary)] truncate">
                                                {department.name}
                                            </h4>
                                        </div>
                                        {/* } */}
                                        <div className="flex items-center gap-2">
                                            {/* Settings toggle button */}
                                            {permissions['department_edit'] && (
                                                <button
                                                    onClick={() => handleToggleAccordion(departmentId)}
                                                    className={`ml-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 shrink-0 ${isOpen
                                                        ? "bg-[var(--color-primary-dark)] text-white"
                                                        : "text-[var(--color-primary-dark)] hover:bg-[var(--color-primary-lightest)] border border-[var(--color-border-secondary)]"
                                                        }`}
                                                    title={isOpen ? "Close settings" : "Open settings"}
                                                >
                                                    <Settings2 className="w-3.5 h-3.5" />
                                                    Settings
                                                    {isOpen
                                                        ? <ChevronUp className="w-3.5 h-3.5" />
                                                        : <ChevronDown className="w-3.5 h-3.5" />}
                                                </button>
                                            )}
                                            {permissions['department_delete'] && (
                                                <button
                                                    onClick={() => handleDeleteClick(department)}
                                                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 hover:scale-110 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                                    title="Delete department"
                                                >
                                                    <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Accordion body — smooth animated height */}
                                    <AccordionPanel isOpen={isOpen}>
                                        <div className="px-4 pb-4">
                                            <DepartmentAccordion
                                                key={departmentId}
                                                department={department}
                                                onSave={handleSave}
                                                saving={isSaving}
                                            />
                                        </div>
                                    </AccordionPanel>
                                </div>
                            );
                        })}
                    </div>

                )}
            </div>
            <DeleteModal
                isOpen={confirmModal.isOpen && confirmModal.type === 'delete'}
                onClose={closeModal}
                onDelete={confirmDeleteDepartment}
                title="Delete Department"
                message={`Are you sure you want to delete "${confirmModal.data?.name || 'this Department'}"? This action cannot be undone.`}
            />
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default DepartmentList;
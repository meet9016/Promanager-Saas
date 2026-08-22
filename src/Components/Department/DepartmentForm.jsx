import React, { useState } from "react";
import { Plus, Settings2, ChevronDown, ChevronUp, Clock, AlarmClock } from "lucide-react";
import CustomInput from "../comman/CustomInput";
import CustomSelect from "../comman/CustomSelect";

// ─── Defaults ──────────────────────────────────────────────────────────────────
const defaultFormulas = () => ({
    ot_formula: "1",
    overtime: "30",
    late_coming: "15",
    early_going: "15",
    half_day_work_formula: "1",
    half_day_work_min: "240",
    absent_formula: "1",
    absent_min: "120",
    par_half_day_work_formula: "1",
    par_half_day_work_min: "240",
    par_absent_formula: "1",
    par_absent_min: "120",
});

// ─── Mini number input ──────────────────────────────────────────────────────────
const MinInput = ({ value, onChange, disabled }) => (
    <div className="flex items-center gap-1.5 shrink-0">
        <input
            type="number"
            min="0"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-16 px-2 py-1 text-xs text-right font-medium border border-[var(--color-border-secondary)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        />
        <span className="text-[12.5px] font-medium text-[var(--color-text-secondary)] ">Min</span>
    </div>
);

// ─── Section Card ───────────────────────────────────────────────────────────────
const SectionCard = ({ icon: Icon, label, accentColor = "primary", children }) => {
    const headerStyles = {
        primary: "bg-[var(--color-primary-lightest)] text-[var(--color-primary-dark)] border-[var(--color-primary-light)]",
        amber: "bg-amber-50 text-amber-700 border-amber-200",
        blue: "bg-blue-50 text-blue-700 border-blue-200",
        rose: "bg-rose-50 text-rose-700 border-rose-200",
        violet: "bg-violet-50 text-violet-700 border-violet-200",
    };
    return (
        <div className="rounded-xl border border-[var(--color-border-secondary)] overflow-visible bg-[var(--color-bg-secondary)] shadow-sm">
            <div className={`flex items-center gap-2 px-3 py-2 border-b rounded-[10px] ${headerStyles[accentColor] || headerStyles.primary}`}>
                {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                <span className="text-[14px] font-bold ">{label}</span>
            </div>
            <div className="p-3 space-y-2.5">{children}</div>
        </div>
    );
};

// ─── Simple field row ───────────────────────────────────────────────────────────
const FieldRow = ({ label, children }) => (
    <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-[var(--color-text-secondary)] leading-snug flex-1">{label}</span>
        <div className="flex items-center gap-2 shrink-0">{children}</div>
    </div>
);

// ─── DepartmentForm ────────────────────────────────────────────────────────────
const DepartmentForm = ({ onSubmit, loading = false, showToast }) => {
    const [name, setName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [f, setF] = useState(defaultFormulas());

    const set = (key, value) => setF((prev) => ({ ...prev, [key]: value }));

    const handleOTChange = (value) => {
        setF((prev) => ({
            ...prev,
            ot_formula: value,
            overtime: value === "2" ? (prev.overtime === "0" ? "30" : prev.overtime) : "0",
        }));
    };

    const handleSubmit = async (e) => {
        e?.preventDefault();
        if (!name.trim()) { showToast("Please enter a department name", "error"); return; }
        setIsSubmitting(true);
        try {
            const result = await onSubmit({ name: name.trim(), ...f });
            if (result && Object.prototype.hasOwnProperty.call(result, "success")) {
                if (result.success === true) {
                    setName(""); setF(defaultFormulas()); setShowAdvanced(false);
                    showToast("Department added successfully!", "success");
                } else {
                    showToast(result.message || "Failed to add department.", "error");
                }
            } else {
                showToast("Failed to add department. Please try again.", "error");
            }
        } catch (err) {
            console.error(err);
            showToast("An error occurred while adding the department.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-sm border border-[var(--color-primary-dark)] overflow-visible">
            <div className="p-5">
                {/* ── Name + Submit ── */}
                <div className="flex w-full flex-col sm:flex-row items-end gap-3 mb-4">
                    <div className="flex-1 space-y-1 w-full">
                        <label htmlFor="departmentName" className="text-sm font-medium text-[var(--color-text-secondary)]">
                            Add New Department <span className="text-[var(--color-error)]">*</span>
                        </label>
                        <div className="w-[500px]">
                            <CustomInput
                                type="text"
                                name="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                // onBlur={handleFieldBlur}
                                placeholder="Enter department name"
                                required
                                clearable={true}
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || loading || !name.trim()}
                        className="w-full sm:w-[200px] inline-flex items-center justify-center px-6 py-3 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] font-medium rounded-lg hover:bg-[var(--color-primary-darker)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                        {isSubmitting
                            ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Adding...</>
                            : <><Plus className="w-4 h-4 mr-2" />Add Department</>}
                    </button>
                </div>

                {/* ── Advanced toggle button ── */}
                <button
                    type="button"
                    onClick={() => setShowAdvanced((v) => !v)}
                    className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border ${showAdvanced
                        ? "bg-[var(--color-primary-dark)] text-white border-[var(--color-primary-dark)] shadow-sm"
                        : "text-[var(--color-primary-dark)] border-[var(--color-primary-light)] hover:bg-[var(--color-primary-lightest)]"
                        }`}
                >
                    <Settings2 className="w-3.5 h-3.5" />
                    Advanced Settings
                    {showAdvanced ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
                </button>

                {/* ── Advanced panel ── */}
                {showAdvanced && (
                    <div className="mt-3 rounded-xl border border-[var(--color-border-secondary)] overflow-visible bg-[var(--color-bg-primary)]">

                        {/* Panel header strip */}
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-primary-dark)] rounded-t-[7px]">
                            <Settings2 className="w-3.5 h-3.5 text-white/70" />
                            <span className="text-[15px] font-md text-white ">
                                Attendance &amp; Payroll Rules
                            </span>
                            {/* <span className="ml-auto text-[10px] text-white/50 italic hidden sm:block">Applied to all employees in this department</span> */}
                        </div>

                        {/* Cards grid */}
                        <div className="p-3 grid grid-cols-2 gap-3">

                            {/* Overtime Card */}
                            <SectionCard icon={Clock} label="Overtime" accentColor="amber">
                                <FieldRow label="OT Formula">
                                    <div className="w-80">
                                        <CustomSelect
                                            value={f.ot_formula}
                                            onChange={(e) => handleOTChange(e.target.value)}
                                            disabled={isSubmitting}
                                            searchable={false}
                                            options={[
                                                { value: "1", label: "Not Applicable" },
                                                { value: "2", label: "OT Applied" },
                                            ]}
                                        />
                                    </div>
                                </FieldRow>
                                {f.ot_formula === "2" && (
                                    <FieldRow label="Minimum OT Duration">
                                        <MinInput value={f.overtime} onChange={(v) => set("overtime", v)} disabled={isSubmitting} />
                                    </FieldRow>
                                )}
                            </SectionCard>

                            {/* Late / Early Card */}
                            <SectionCard icon={AlarmClock} label="Late Coming &amp; Early Going" accentColor="blue">
                                <FieldRow label="Grace Time — Late Coming">
                                    <MinInput value={f.late_coming} onChange={(v) => set("late_coming", v)} disabled={isSubmitting} />
                                </FieldRow>
                                <FieldRow label="Grace Time — Early Going">
                                    <MinInput value={f.early_going} onChange={(v) => set("early_going", v)} disabled={isSubmitting} />
                                </FieldRow>
                            </SectionCard>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DepartmentForm;
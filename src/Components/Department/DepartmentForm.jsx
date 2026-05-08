import React, { useState } from "react";
import { Plus, Settings2, ChevronDown, ChevronUp } from "lucide-react";

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

// ─── Section divider spanning both columns ─────────────────────────────────────
const SectionDivider = ({ label }) => (
    <div className="col-span-2 flex items-center gap-2 pt-2">
        <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider whitespace-nowrap">
            {label}
        </span>
        <div className="flex-1 h-px bg-[var(--color-border-secondary)]" />
    </div>
);

// ─── OT Row: label | dropdown | "Min OT" input Mins ───────────────────────────
const OTRow = ({ otFormula, onFormulaChange, minValue, onMinChange, disabled }) => {
    const isApplied = otFormula === "2";
    return (
        <>
            {/* Left: label + dropdown */}
            <div className="flex items-center gap-3 pr-4">
                <span className="text-sm text-[var(--color-text-primary)] whitespace-nowrap">OT Formula</span>
                <select
                    value={otFormula}
                    onChange={(e) => onFormulaChange(e.target.value)}
                    disabled={disabled}
                    className="flex-1 px-3 py-1.5 text-sm border border-[var(--color-border-secondary)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] disabled:opacity-50 cursor-pointer"
                >
                    <option value="1">OT Not Applicable</option>
                    <option value="2">OT Applied</option>
                </select>
            </div>

            {/* Right: Min OT input — only visible when applied */}
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
                    // placeholder to keep layout stable
                    <span className="text-xs text-[var(--color-text-muted)] italic">Not applicable</span>
                )}
            </div>
        </>
    );
};

// ─── Checkbox row ──────────────────────────────────────────────────────────────
const CheckboxRow = ({ checked, onCheck, label, value, onChange, disabled }) => (
    <>
        <label className="flex items-center gap-2 cursor-pointer select-none pr-4">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onCheck(e.target.checked)}
                disabled={disabled}
                className="w-4 h-4 rounded border-gray-300 accent-[var(--color-primary-dark)] cursor-pointer disabled:cursor-not-allowed flex-shrink-0"
            />
            <span className={`text-sm leading-snug ${checked ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"}`}>
                {label}
            </span>
        </label>
        <div className="flex items-center justify-end gap-2">
            <input
                type="number"
                min="0"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={!checked || disabled}
                className="w-20 px-2 py-1.5 text-sm text-right border border-[var(--color-border-secondary)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            />
            <span className="text-xs text-[var(--color-text-secondary)] w-8 shrink-0">Mins</span>
        </div>
    </>
);

// ─── Always-visible row (Grace Time fields) ────────────────────────────────────
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

// ─── DepartmentForm ────────────────────────────────────────────────────────────
const DepartmentForm = ({ onSubmit, loading = false, showToast }) => {
    const [name, setName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [f, setF] = useState(defaultFormulas());

    const set = (key, value) => setF((prev) => ({ ...prev, [key]: value }));
    const isChecked = (formulaKey) => f[formulaKey] === "2";

    const handleCheck = (formulaKey, minKey, defaultMin, checked) => {
        setF((prev) => ({
            ...prev,
            [formulaKey]: checked ? "2" : "1",
            [minKey]: checked
                ? (prev[minKey] === "0" || prev[minKey] === 0 ? defaultMin : prev[minKey])
                : "0",
        }));
    };

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
        <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-sm border border-[var(--color-primary-dark)] overflow-hidden">
            <div className="p-8">
                {/* ── Name + Submit ── */}
                <div className="flex w-full flex-col sm:flex-row items-end gap-3 mb-4">
                    <div className="flex-1 space-y-1 w-full">
                        <label htmlFor="departmentName" className="text-sm font-medium text-[var(--color-text-secondary)]">
                            Add New Department <span className="text-[var(--color-error)]">*</span>
                        </label>
                        <input
                            id="departmentName"
                            type="text"
                            placeholder="Enter department name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all duration-200 placeholder-gray-400 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]"
                            disabled={isSubmitting || loading}
                            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(e); }}
                        />
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || loading || !name.trim()}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] font-medium rounded-lg hover:bg-[var(--color-primary-darker)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                        {isSubmitting
                            ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Adding...</>
                            : <><Plus className="w-4 h-4 mr-2" />Add Department</>}
                    </button>
                </div>

                {/* ── Advanced toggle ── */}
                <button
                    type="button"
                    onClick={() => setShowAdvanced((v) => !v)}
                    className="flex items-center gap-2 text-sm font-medium text-[var(--color-primary-dark)] hover:text-[var(--color-primary-darker)] transition-colors"
                >
                    <Settings2 className="w-4 h-4" />
                    Advanced Settings
                    {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {/* ── Advanced panel ── */}
                {showAdvanced && (
                    <div className="mt-4 border border-[var(--color-border-secondary)] rounded-lg overflow-hidden">
                        <div className="bg-[var(--color-primary-dark)] px-4 py-2.5">
                            <span className="text-xs font-semibold text-white uppercase tracking-wider">
                                Category Details
                            </span>
                        </div>

                        <div className="px-5 py-4 grid grid-cols-[1fr_auto] gap-x-4 gap-y-3 items-center bg-[var(--color-bg-secondary)]">

                            {/* ── Overtime ── */}
                            <SectionDivider label="Overtime" />
                            <OTRow
                                otFormula={f.ot_formula}
                                onFormulaChange={handleOTChange}
                                minValue={f.overtime}
                                onMinChange={(v) => set("overtime", v)}
                                disabled={isSubmitting}
                            />

                            {/* ── Late / Early ── */}
                            <SectionDivider label="Late Coming & Early Going" />
                            <AlwaysRow
                                label="Grace Time for Late Coming"
                                value={f.late_coming}
                                onChange={(v) => set("late_coming", v)}
                                disabled={isSubmitting}
                            />
                            <AlwaysRow
                                label="Grace Time for Early Going"
                                value={f.early_going}
                                onChange={(v) => set("early_going", v)}
                                disabled={isSubmitting}
                            />

                            {/* ── Half Day ── */}
                            <SectionDivider label="Half Day" />
                            <CheckboxRow
                                checked={isChecked("half_day_work_formula")}
                                onCheck={(v) => handleCheck("half_day_work_formula", "half_day_work_min", "240", v)}
                                label="Calculate Half Day if Work Duration is less than"
                                value={f.half_day_work_min}
                                onChange={(v) => set("half_day_work_min", v)}
                                disabled={isSubmitting}
                            />

                            {/* ── Absent ── */}
                            <SectionDivider label="Absent" />
                            <CheckboxRow
                                checked={isChecked("absent_formula")}
                                onCheck={(v) => handleCheck("absent_formula", "absent_min", "120", v)}
                                label="Calculate Absent if Work Duration is less than"
                                value={f.absent_min}
                                onChange={(v) => set("absent_min", v)}
                                disabled={isSubmitting}
                            />

                            {/* ── Partial Day ── */}
                            <SectionDivider label="On Partial Day" />
                            <CheckboxRow
                                checked={isChecked("par_half_day_work_formula")}
                                onCheck={(v) => handleCheck("par_half_day_work_formula", "par_half_day_work_min", "240", v)}
                                label="Calculate Half Day if Work Duration is less than"
                                value={f.par_half_day_work_min}
                                onChange={(v) => set("par_half_day_work_min", v)}
                                disabled={isSubmitting}
                            />
                            <CheckboxRow
                                checked={isChecked("par_absent_formula")}
                                onCheck={(v) => handleCheck("par_absent_formula", "par_absent_min", "120", v)}
                                label="Calculate Absent if Work Duration is less than"
                                value={f.par_absent_min}
                                onChange={(v) => set("par_absent_min", v)}
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DepartmentForm;
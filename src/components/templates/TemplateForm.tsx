// In src/components/templates/TemplateForm.tsx

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useForm, Controller, Control } from 'react-hook-form';
import { Button } from '../ui/Button';
import { PasswordModal } from '../common/PasswordModal';
import { evaluate } from 'mathjs';
import toast from 'react-hot-toast';
import { FormulaBuilder } from './FormulaBuilder';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import { generateTemplatePdf } from '../../utils/reportGenerator';
import { useAppSelector } from '../../store/hooks';
import { useHasPrivilege } from '../../hooks/useHasPrivilege';
import { ReportSectionsModal } from '../common/ReportSectionsModal';
import { Template } from '../../types/models';
import { User } from '../../types/User';

interface ValidationRules {
  type: 'Any' | 'Whole Number' | 'Decimal' | 'List' | 'Custom';
  options?: string;
}
interface DataInputField { id: string; label: string; validation: ValidationRules; }
interface DataInputSection { id: string; title: string; fields: DataInputField[]; }
interface KeyValueField { id: string; label: string; value: string; }

const EditableFieldWithCellID = ({ field, index, onUpdate, onRemove, cellId, readOnly }: { field: DataInputField, index: number, onUpdate: (index: number, key: string, value: any) => void, onRemove: (index: number) => void, cellId: string, readOnly: boolean }) => {
    const validationTypes = ["Any", "Whole Number", "Decimal", "List", "Custom"];
    const validation = field.validation || { type: 'Any' };

    return (
        <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-2"><input value={cellId} className="input-style bg-slate-200 text-center font-medium" readOnly /></div>
            <div className="col-span-5"><input value={field.label} onChange={(e) => onUpdate(index, 'label', e.target.value)} className="input-style" placeholder="Field Label" readOnly={readOnly}/></div>
            <div className="col-span-4">
                <select value={validation.type} onChange={(e) => onUpdate(index, 'validation', { ...validation, type: e.target.value })} className="input-style" disabled={readOnly}>
                    {validationTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
            <div className="col-span-1">{!readOnly && <Button type="button" variant="danger" onClick={() => onRemove(index)}>X</Button>}</div>
            {(validation.type === 'List' || validation.type === 'Custom') && (
                 <div className="col-start-8 col-span-4 mt-1">
                     <input value={validation.options || ''} onChange={(e) => onUpdate(index, 'validation', { ...validation, options: e.target.value })} className="input-style text-sm" placeholder="e.g., Pass,Fail,N/A" readOnly={readOnly}/>
                 </div>
            )}
        </div>
    );
};

const EditableField = ({ field, index, onUpdate, onRemove, isHeader, readOnly, isFormula = false, onFocus }: { field: KeyValueField, index: number, onUpdate: (index: number, key: string, value: string) => void, onRemove: (index: number) => void, isHeader: boolean, readOnly: boolean, isFormula?: boolean, onFocus: () => void }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isFormula && textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [field.value, isFormula]);

    return (
        <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-6">
                <input
                    value={field.label}
                    onChange={(e) => onUpdate(index, 'label', e.target.value)}
                    className="input-style"
                    placeholder="Field Label"
                    readOnly={readOnly}
                />
            </div>
            <div className="col-span-5">
                {isFormula ? (
                    <textarea
                        ref={textareaRef}
                        value={field.value}
                        onChange={(e) => onUpdate(index, 'value', e.target.value)}
                        className="input-style resize-y min-h-[40px]"
                        placeholder="Formula (e.g., = (A3/A2)*A1)"
                        readOnly={readOnly}
                        onFocus={onFocus}
                        rows={1}
                    />
                ) : (
                    <input
                        value={field.value}
                        onChange={(e) => onUpdate(index, 'value', e.target.value)}
                        className="input-style"
                        placeholder={isHeader ? "Default Value" : "Default Value / Placeholder"}
                        readOnly={readOnly}
                    />
                )}
            </div>
            <div className="col-span-1">{!readOnly && <Button type="button" variant="danger" onClick={() => onRemove(index)}>X</Button>}</div>
        </div>
    );
};


const VerificationField = ({ field, control, defaultValue }: { field: { id: string, label: string }, control: Control<any>, defaultValue: any }) => (
    <div className="mb-2">
        <label className="block text-sm font-medium text-slate-700">{field.label}</label>
        <Controller name={field.id} control={control} defaultValue={defaultValue} render={({ field: { onChange, onBlur, value } }) => (<input onChange={onChange} onBlur={onBlur} value={value || ''} className="input-style"/>)} />
    </div>
);

export function TemplateForm({ template, onSave, onCancel, onVerify }: { template: Template | null, onSave: (data: any) => void, onCancel: () => void, onVerify: (data: any) => void }) {
    const { register, reset: resetMainForm, getValues } = useForm();
    const { control: verificationControl, watch: watchVerification, getValues: getVerificationValues, reset: resetVerificationForm } = useForm();
    const watchedFields = watchVerification();
    const formatDate = useDateFormatter();
    const user = useAppSelector((state) => state.auth.user as User | null);
    const canGenerateReport = useHasPrivilege(['GENERATE_REPORTS_FOR_RECORDS']);

    const [activeTab, setActiveTab] = useState('info');
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [activeFormulaIndex, setActiveFormulaIndex] = useState<number | null>(null);
    const [headerFields, setHeaderFields] = useState<KeyValueField[]>([]);
    const [sampleInfoFields, setSampleInfoFields] = useState<KeyValueField[]>([]);
    const [dataInputSections, setDataInputSections] = useState<DataInputSection[]>([]);
    const [formulas, setFormulas] = useState<KeyValueField[]>([]);

    useEffect(() => {
        if (template) {
            const data = template.document_data || {};
            resetMainForm({
                template_id: template.template_id,
                name: template.name,
                major_version: template.major_version,
                minor_version: template.minor_version
            });
            setHeaderFields(data.header?.fields || []);
            setSampleInfoFields(data.sampleInfo?.fields || []);
            setDataInputSections(data.dataInputs?.sections || []);
            setFormulas(data.calculation?.formulas || []);
            setIsReadOnly(template.status !== 'DRAFT' && template.status !== 'REJECTED');

            if (data.verification_data) {
                resetVerificationForm(data.verification_data);
            }
        }
    }, [template, resetMainForm, resetVerificationForm]);

    const handleSaveClick = () => {
        if (!getValues('name')) {
            toast.error("Template Name is required.");
            setActiveTab('info');
            return;
        }
        // --- NEW: Check for Template ID ---
        if (!getValues('template_id')) {
            toast.error("Template ID is required.");
            setActiveTab('info');
            return;
        }
        setIsSaveModalOpen(true);
    };

    const handleConfirmSave = ({ password, reason }: { password: string, reason: string }) => {
        setIsSaveModalOpen(false);
        const document_data = {
            header: { fields: headerFields },
            sampleInfo: { fields: sampleInfoFields },
            dataInputs: { sections: dataInputSections },
            calculation: { formulas: formulas },
            verification_data: getVerificationValues(),
        };
        onSave({ ...getValues(), id: template?.id, document_data, reason_for_change: reason, admin_password: password });
    };

    const handleVerifyClick = () => setIsVerifyModalOpen(true);
    const handleConfirmVerify = ({ password, reason, meaning }: { password: string, reason: string, meaning: string }) => {
        setIsVerifyModalOpen(false);
        const verification_data = getVerificationValues();
        onVerify({ id: template?.id, verification_data, password, reason, meaning });
    };

    const handleConfirmReport = (selectedSections: string[]) => {
        setIsReportModalOpen(false);
        if (template) {
            generateTemplatePdf(template, user, selectedSections);
        }
    };

    const handleFieldUpdate = (setter: React.Dispatch<React.SetStateAction<any[]>>) => (index: number, key: string, value: any) => setter(prev => prev.map((item, i) => i === index ? { ...item, [key]: value } : item));
    const handleAddField = (setter: React.Dispatch<React.SetStateAction<any[]>>) => () => setter(prev => [...prev, { id: `field_${Date.now()}`, label: '', value: '' }]);
    const handleRemoveField = (setter: React.Dispatch<React.SetStateAction<any[]>>) => (index: number) => setter(prev => prev.filter((_, i) => i !== index));
    const handleAddDataInputSection = () => setDataInputSections(prev => [...prev, { id: `section_${Date.now()}`, title: 'New Section', fields: [] }]);
    const handleRemoveDataInputSection = (sectionIndex: number) => {
        setDataInputSections(prev => prev.filter((_, i) => i !== sectionIndex));
    };
    const handleUpdateSectionTitle = (sIdx: number, title: string) => setDataInputSections(prev => prev.map((s, i) => i === sIdx ? { ...s, title } : s));

    const handleAddFieldToSection = (sectionIndex: number) => {
        setDataInputSections(prev => prev.map((section, i) => {
            if (i === sectionIndex) {
                const newField: DataInputField = { id: `field_${Date.now()}`, label: '', validation: { type: 'Any' } };
                return { ...section, fields: [...section.fields, newField] };
            }
            return section;
        }));
    };

    const handleUpdateFieldInSection = (sectionIndex: number, fieldIndex: number, key: string, value: any) => {
        setDataInputSections(prev => prev.map((section, i) => {
            if (i === sectionIndex) {
                const updatedFields = section.fields.map((field, j) => j === fieldIndex ? { ...field, [key]: value } : field);
                return { ...section, fields: updatedFields };
            }
            return section;
        }));
    };

    const handleRemoveFieldFromSection = (sectionIndex: number, fieldIndex: number) => {
        setDataInputSections(prev => prev.map((section, i) => (i === sectionIndex) ? { ...section, fields: section.fields.filter((_, j) => j !== fieldIndex) } : section));
    };

    const getGlobalFieldIndex = (sIdx: number, fIdx: number) => {
        let count = 0;
        for (let i = 0; i < sIdx; i++) { count += dataInputSections[i].fields.length; }
        return count + fIdx;
    };

    const calculateResult = (formula: KeyValueField) => {
        let expression = formula.value.startsWith('=') ? formula.value.substring(1) : formula.value;
        const variables = new Set([...(expression.match(/A\d+/g) || [])]);
        let allInputsProvided = true;
        variables.forEach(variable => {
            const value = watchedFields[variable];
            if (value === undefined || value === null || value === '') { allInputsProvided = false; }
            expression = expression.replace(new RegExp(`\\b${variable}\\b`, 'g'), value);
        });
        if (!allInputsProvided) return "Calculation pending...";
        try {
            const result = evaluate(expression);
            if (typeof result === 'number') {
                return (Math.round(result * 100) / 100).toFixed(2);
            }
            return result;
        } catch (e) { return "Invalid formula or data"; }
    };

    const allInputFields = dataInputSections.flatMap((section, sIdx) =>
        section.fields.map((field, fIdx) => ({
            id: `A${getGlobalFieldIndex(sIdx, fIdx) + 1}`,
            label: field.label,
        }))
    );

    const handleFormulaInsert = (textToInsert: string) => {
        if (activeFormulaIndex === null) return;
        setFormulas(prevFormulas =>
            prevFormulas.map((formula, index) => {
                if (index === activeFormulaIndex) {
                    return { ...formula, value: formula.value + textToInsert };
                }
                return formula;
            })
        );
    };

    const availableReportSections = useMemo(() => {
        if (!template) return [];
        const sections = ['Template Details'];
        const docData = template.document_data || {};

        if (docData.sampleInfo?.fields?.length > 0) {
            sections.push('Analysis Information');
        }
        if (docData.dataInputs?.sections?.length > 0) {
            docData.dataInputs.sections.forEach((section: DataInputSection) => sections.push(section.title));
        }
        if (docData.calculation?.formulas?.length > 0) {
            sections.push('Formula Design');
        }
        if (docData.verification_data && Object.keys(docData.verification_data).length > 0) {
            sections.push('Verification Data');
        }
        if (template.signatures?.length > 0) {
            sections.push('Signatures');
        }
        if (template.audit_trail?.length > 0) {
            sections.push('Template History');
        }
        return sections;
    }, [template]);

    return (
        <div className="bg-white p-6 rounded-lg shadow max-w-6xl mx-auto">
             <ReportSectionsModal
                isOpen={isReportModalOpen}
                onConfirm={handleConfirmReport}
                onCancel={() => setIsReportModalOpen(false)}
                title="Generate Template Report"
                availableSections={availableReportSections}
            />
            <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold text-slate-800 mb-4">{template ? `Template: ${template.name}` : 'Create New Template'}</h3>
                {template && canGenerateReport &&
                    <Button variant="secondary" onClick={() => setIsReportModalOpen(true)}>Generate PDF Report</Button>
                }
            </div>
            <div className="border-b border-slate-300 mb-6">
                 <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button onClick={() => setActiveTab('info')} type="button" className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}>1. Template & Analysis Info</button>
                    <button onClick={() => setActiveTab('data')} type="button" className={`tab-btn ${activeTab === 'data' ? 'active' : ''}`}>2. Data & Calculations</button>
                    <button onClick={() => setActiveTab('verify')} type="button" className={`tab-btn ${activeTab === 'verify' ? 'active' : ''}`}>3. Template Verification</button>
                    <button onClick={() => setActiveTab('history')} type="button" className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}>4. Approvals & History</button>
                </nav>
            </div>
            <div className="space-y-6">
                {activeTab === 'info' && (
                    <div className="space-y-6">
                        <div className="designer-section space-y-3">
                            <h4 className="font-bold text-lg">Template Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {/* --- NEW: Template ID field --- */}
                                <div><label>Template ID <span className="text-red-500">*</span></label><input {...register('template_id')} className="input-style" readOnly={isReadOnly}/></div>
                                <div><label>Template Name <span className="text-red-500">*</span></label><input {...register('name')} className="input-style" readOnly={isReadOnly}/></div>
                                <div><label>Major Version</label><input type="number" {...register('major_version')} className="input-style" readOnly={isReadOnly}/></div>
                                <div><label>Minor Version</label><input type="number" {...register('minor_version')} className="input-style" readOnly={isReadOnly}/></div>
                            </div>
                            <hr className="my-4"/>
                            <div className="grid grid-cols-12 gap-2 items-center text-sm font-medium text-slate-600 px-1">
                                <div className="col-span-6">Field Label</div>
                                <div className="col-span-5">Default Value</div>
                            </div>
                            {headerFields.map((f, i) => <EditableField key={f.id} field={f} index={i} onUpdate={handleFieldUpdate(setHeaderFields) as any} onRemove={handleRemoveField(setHeaderFields)} isHeader={true} readOnly={isReadOnly} onFocus={() => {}}/>)}
                            {!isReadOnly && <Button type="button" variant="secondary" onClick={handleAddField(setHeaderFields)}>Add Template Info Field</Button>}
                        </div>
                        <div className="designer-section space-y-3">
                            <h4 className="font-bold text-lg">Analysis Information</h4>
                            <p className="text-sm text-slate-600">Define the labels for fields that will be filled in during each analysis.</p>
                             <div className="grid grid-cols-12 gap-2 items-center text-sm font-medium text-slate-600 px-1">
                                <div className="col-span-6">Field Label</div>
                                <div className="col-span-5">Default Value / Placeholder</div>
                            </div>
                            {sampleInfoFields.map((f, i) => <EditableField key={f.id} field={f} index={i} onUpdate={handleFieldUpdate(setSampleInfoFields) as any} onRemove={handleRemoveField(setSampleInfoFields)} isHeader={true} readOnly={isReadOnly} onFocus={() => {}}/>)}
                            {!isReadOnly && <Button type="button" variant="secondary" onClick={handleAddField(setSampleInfoFields)}>Add Analysis Info Field</Button>}
                        </div>
                    </div>
                )}

                {activeTab === 'data' && (
                    <div className="space-y-6">
                        <div className="designer-section space-y-3">
                            <h4 className="font-bold text-lg">Data Inputs & Variables</h4>
                            <p className="text-sm text-slate-600">Group related inputs. Each field gets a unique Cell ID and a specific Data Type for validation.</p>
                            {dataInputSections.map((section, sectionIndex) => (
                                <div key={section.id} className="p-3 border rounded-md bg-white space-y-2">
                                    <div className="flex justify-between items-center">
                                        <input value={section.title} onChange={(e) => handleUpdateSectionTitle(sectionIndex, e.target.value)} className="input-style font-semibold" readOnly={isReadOnly}/>
                                        {!isReadOnly && <Button type="button" variant="danger" onClick={() => handleRemoveDataInputSection(sectionIndex)} className="ml-2">Remove Section</Button>}
                                    </div>
                                    <div className="grid grid-cols-12 gap-2 items-center text-sm font-medium text-slate-600 px-1"><div className="col-span-2">Cell ID</div><div className="col-span-5">Field Label</div><div className="col-span-4">Data Type</div></div>
                                    {section.fields.map((field, fieldIndex) => (<EditableFieldWithCellID key={field.id} field={field} index={fieldIndex} onUpdate={(...args: [number, string, any]) => handleUpdateFieldInSection(sectionIndex, ...args)} onRemove={() => handleRemoveFieldFromSection(sectionIndex, fieldIndex)} cellId={`A${getGlobalFieldIndex(sectionIndex, fieldIndex) + 1}`} readOnly={isReadOnly}/>))}
                                    {!isReadOnly && <Button type="button" variant="secondary" onClick={() => handleAddFieldToSection(sectionIndex)}>Add Data Input</Button>}
                                </div>
                            ))}
                            {!isReadOnly && <Button type="button" variant="secondary" onClick={handleAddDataInputSection}>Add Section</Button>}
                        </div>
                        <div className="designer-section space-y-3">
                            <h4 className="font-bold text-lg">Results Section</h4>
                            <p className="text-sm text-slate-600">Define formulas using the Cell IDs from the section above (e.g., = (A3 / A2) * A1).</p>
                            <div className="grid grid-cols-12 gap-2 items-center text-sm font-medium text-slate-600 px-1"><div className="col-span-6">Result Label</div><div className="col-span-5">Formula</div></div>
                            {formulas.map((field, index) => <EditableField key={field.id} field={field} index={index} onUpdate={handleFieldUpdate(setFormulas) as any} onRemove={handleRemoveField(setFormulas)} isHeader={true} readOnly={isReadOnly} isFormula={true} onFocus={() => setActiveFormulaIndex(index)}/>)}
                            {!isReadOnly && <Button type="button" variant="secondary" onClick={handleAddField(setFormulas)}>Add Formula</Button>}

                            {activeFormulaIndex !== null && !isReadOnly && (
                                <FormulaBuilder
                                    onInsert={handleFormulaInsert}
                                    availableFields={allInputFields}
                                />
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'verify' && (
                    <div className="designer-section space-y-4">
                        <h4 className="font-bold text-lg">Template Verification (OQ/PQ)</h4>
                        <p className="text-sm text-slate-600">Enter a complete set of test data to verify the template's calculations. When you save, this data will be stored as a permanent qualification record for this template version.</p>
                        {headerFields.length > 0 && (
                            <div>
                                <h5 className="font-semibold text-md text-slate-800 mb-2">Template Information</h5>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {headerFields.map(field => (
                                        <div key={field.id}>
                                            <label className="block text-sm font-medium text-slate-700">{field.label}</label>
                                            <input value={field.value} readOnly className="input-style bg-slate-100"/>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {sampleInfoFields.length > 0 && (
                            <div><h5 className="font-semibold text-md text-slate-800 mb-2">Analysis Information</h5><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{sampleInfoFields.map(f => <VerificationField key={f.id} field={f} control={verificationControl} defaultValue={template?.document_data?.verification_data?.[f.id] ?? f.value} />)}</div></div>
                        )}
                        {dataInputSections.map((s, sIdx) => (
                            <div key={s.id}><h5 className="font-semibold text-md text-slate-800 mb-2">{s.title}</h5><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{s.fields.map((f, fIdx) => { const cellId = `A${getGlobalFieldIndex(sIdx, fIdx) + 1}`; return <VerificationField key={f.id} field={{...f, id: cellId }} control={verificationControl} defaultValue={template?.document_data?.verification_data?.[cellId]} />})}</div></div>
                        ))}
                        {formulas.length > 0 && (
                            <div><h5 className="font-semibold text-md text-slate-800 mb-2">Results</h5><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{formulas.map(f => (<div className="mb-2" key={f.id}><label className="block text-sm font-medium text-slate-700">{f.label}</label><input value={calculateResult(f)} readOnly className="input-style bg-slate-100"/></div>))}</div></div>
                        )}
                        {!isReadOnly && <div className="pt-4 border-t"><Button type="button" onClick={handleVerifyClick} className="bg-teal-600 hover:bg-teal-700">Save Verification & Proceed</Button></div>}
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-6">
                        <div className="designer-section space-y-3"><h4 className="font-bold text-lg">Approvals History</h4><div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200"><thead className="bg-slate-200"><tr><th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase">Action</th><th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase">Signed By</th><th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase">Date & Time</th></tr></thead><tbody className="bg-white divide-y divide-slate-200">{template?.signatures?.length > 0 ? template.signatures.map((s: any) => (<tr key={s.signed_at}><td className="px-4 py-2 text-sm">{s.meaning}</td><td className="px-4 py-2 text-sm">{s.signed_by.username}</td><td className="px-4 py-2 text-sm">{formatDate(s.signed_at)}</td></tr>)) : (<tr><td colSpan={3} className="px-4 py-4 text-center text-slate-500">No signatures recorded.</td></tr>)}</tbody></table></div></div>
                        <div className="designer-section space-y-3">
                            <h4 className="font-bold text-lg">Template History</h4>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-200">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase">Date & Time</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase">User</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase">Action</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase">Reason</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase">Previous Value</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase">New Value</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-200">
                                        {template?.audit_trail?.length > 0 ? template.audit_trail.map((log: any) => (
                                            <tr key={log.id}>
                                                <td className="px-4 py-2 text-sm">{formatDate(log.timestamp)}</td>
                                                <td className="px-4 py-2 text-sm">{log.user.username}</td>
                                                <td className="px-4 py-2 text-sm">{log.details}</td>
                                                <td className="px-4 py-2 text-sm">{log.reason_for_change}</td>
                                                <td className="px-4 py-2 text-sm">{log.previous_value}</td>
                                                <td className="px-4 py-2 text-sm">{log.new_value}</td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={6} className="px-4 py-4 text-center text-slate-500">No history recorded.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                    {(template?.status === 'DRAFT' || !template) && <Button type="button" onClick={handleSaveClick}>Save Draft</Button>}
                </div>

                <PasswordModal isOpen={isSaveModalOpen} onConfirm={handleConfirmSave} onCancel={() => setIsSaveModalOpen(false)} title="Confirm Template Save" actionText="Confirm & Save" isReasonRequired={true}/>
                <PasswordModal isOpen={isVerifyModalOpen} onConfirm={handleConfirmVerify as any} onCancel={() => setIsVerifyModalOpen(false)} title="Confirm Template Verification" actionText="Confirm with E-Signature" isReasonRequired={true} showMeaningField={true} meaningOptions={["Verified"]}/>
            </div>
        </div>
    );
}
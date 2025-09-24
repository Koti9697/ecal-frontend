// In src/screens/TemplateVerificationScreen.tsx

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import type { Control } from 'react-hook-form';
import { evaluate } from 'mathjs';
import toast from 'react-hot-toast';
import { useApi } from '../hooks/useApi';
import { Button } from '../components/ui/Button';
import { PasswordModal } from '../components/common/PasswordModal';
import type { Template } from '../types/models';

const VerificationField = ({ field, control, defaultValue }: { field: { id: string, label: string }, control: Control<any>, defaultValue: any }) => (
    <div className="mb-2">
        <label className="block text-sm font-medium text-slate-700">{field.label}</label>
        <Controller
            name={field.id}
            control={control}
            defaultValue={defaultValue}
            render={({ field: { onChange, onBlur, value } }) => (
                <input
                    onChange={onChange}
                    onBlur={onBlur}
                    value={value || ''}
                    className="input-style"
                />
            )}
        />
    </div>
);

export function TemplateVerificationScreen({ template, onBack }: { template: Template, onBack: () => void }) {
    const { control, watch, getValues } = useForm({
        defaultValues: template?.document_data?.verification_data || {}
    });
    const watchedFields = watch();
    const docData = template?.document_data || {};
    const api = useApi();

    // --- THIS IS THE NEW CODE ---
    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

    const handleVerifyClick = () => {
        setIsVerifyModalOpen(true);
    };

    const handleConfirmVerify = async ({ password, reason, meaning }: { password: string; reason: string; meaning?: string; }) => {
        setIsVerifyModalOpen(false);
        const verification_data = getValues();
        try {
            await api(`/templates/${template.id}/verify/`, {
                method: 'POST',
                data: { verification_data, password, reason, meaning }
            });
            toast.success("Template successfully verified.");
            onBack(); // Go back to the admin screen after success
        } catch (err: any) {
            toast.error(`Verification failed: ${err.data?.detail || 'An error occurred.'}`);
        }
    };
    // --- END OF NEW CODE ---

    const getGlobalFieldIndex = (dataInputSections: any[], sIdx: number, fIdx: number) => {
        let count = 0;
        for (let i = 0; i < sIdx; i++) { count += dataInputSections[i].fields.length; }
        return count + fIdx;
    };

    const calculateResult = (formula: { value: string }) => {
        let expression = formula.value.startsWith('=') ? formula.value.substring(1) : formula.value;
        const variables = new Set([...(expression.match(/A\d+/g) || [])]);
        
        let allInputsProvided = true;
        variables.forEach(variable => {
            const value = watchedFields[variable];
            if (value === undefined || value === null || value === '') {
                allInputsProvided = false;
            }
            expression = expression.replace(new RegExp(`\\b${variable}\\b`, 'g'), value);
        });

        if (!allInputsProvided) return "Calculation pending...";
        
        try {
            const result = evaluate(expression);
            if (typeof result === 'number') {
                return (Math.round(result * 100) / 100).toFixed(2);
            }
            return result;
        } catch (e) {
            return "Invalid formula or data";
        }
    };

    return (
        <div>
            {/* --- THIS IS THE NEW CODE --- */}
            <PasswordModal
                isOpen={isVerifyModalOpen}
                onConfirm={handleConfirmVerify}
                onCancel={() => setIsVerifyModalOpen(false)}
                title="Confirm Template Verification"
                actionText="Confirm with E-Signature"
                isReasonRequired={true}
                showMeaningField={true}
                meaningOptions={["Verified"]}
            />
            {/* --- END OF NEW CODE --- */}

            <div className="flex justify-between items-center mb-4">
                <div>
                    <button onClick={onBack} className="text-blue-600 hover:underline">&larr; Back to Template Admin</button>
                    <h3 className="text-2xl font-bold text-slate-800">Verifying Template: {template?.name} {template?.version}</h3>
                    <p className="text-sm text-slate-500">Enter a complete set of test data to verify the template's calculations. When you save, this data will be stored as a permanent qualification record for this template version.</p>
                </div>
            </div>

            <div className="space-y-6">
                {docData.header?.fields?.length > 0 && (
                    <div className="designer-section">
                        <h4 className="font-bold text-lg mb-2">Template Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {docData.header.fields.map((field: any) => (
                                <div key={field.id}>
                                    <label className="block text-sm font-medium text-slate-700">{field.label}</label>
                                    <input value={field.value} readOnly className="input-style bg-slate-100"/>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {docData.sampleInfo?.fields?.length > 0 && (
                    <div className="designer-section">
                        <h4 className="font-bold text-lg mb-2">Analysis Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {docData.sampleInfo.fields.map((field: any) => <VerificationField key={field.id} field={{...field, id: field.id}} control={control} defaultValue={template?.document_data?.verification_data?.[field.id]} />)}
                        </div>
                    </div>
                )}
                
                {docData.dataInputs?.sections?.length > 0 && (
                     <div className="designer-section">
                         <h4 className="font-bold text-lg mb-2">Data Inputs for Calculation</h4>
                         {docData.dataInputs.sections.map((section: any, sIdx: number) => (
                            <div key={section.id} className="mb-4">
                                <h5 className="font-semibold text-md text-slate-800 mb-2">{section.title}</h5>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {section.fields.map((field: any, fIdx: number) => {
                                        const cellId = `A${getGlobalFieldIndex(docData.dataInputs.sections, sIdx, fIdx) + 1}`;
                                        return <VerificationField key={field.id} field={{...field, id: cellId }} control={control} defaultValue={template?.document_data?.verification_data?.[cellId]} />;
                                    })}
                                </div>
                            </div>
                         ))}
                    </div>
                )}

                 {docData.calculation?.formulas?.length > 0 && (
                    <div className="designer-section">
                        <h4 className="font-bold text-lg mb-2">Results</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {docData.calculation.formulas.map((field: any) => (
                                 <div className="mb-2" key={field.id}>
                                    <label className="block text-sm font-medium text-slate-700">{field.label}</label>
                                    <input
                                        value={calculateResult(field)}
                                        readOnly
                                        className="input-style bg-slate-100"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- THIS IS THE NEW CODE --- */}
                <div className="pt-4 mt-4 border-t flex justify-end space-x-4">
                    <Button type="button" variant="secondary" onClick={onBack}>Cancel</Button>
                    <Button type="button" onClick={handleVerifyClick} className="bg-teal-600 hover:bg-teal-700">
                        Save Verification & Proceed
                    </Button>
                </div>
                {/* --- END OF NEW CODE --- */}
            </div>
        </div>
    );
}
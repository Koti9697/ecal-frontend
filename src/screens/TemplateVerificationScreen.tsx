import React, { useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { evaluate } from 'mathjs';

const VerificationField = ({ field, control, defaultValue }) => (
    <div className="mb-2">
        <label className="block text-sm font-medium text-slate-700">{field.label}</label>
        <Controller
            name={field.value}
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

export function TemplateVerificationScreen({ template, onBack }) {
    const { control, watch } = useForm();
    const watchedFields = watch();
    const docData = template?.document_data || {};

    const getGlobalFieldIndex = (dataInputSections, sIdx, fIdx) => {
        let count = 0;
        for (let i = 0; i < sIdx; i++) { count += dataInputSections[i].fields.length; }
        return count + fIdx;
    };

    const calculateResult = (formula) => {
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
            <div className="flex justify-between items-center mb-4">
                <div>
                    <button onClick={onBack} className="text-blue-600 hover:underline">&larr; Back to Template Admin</button>
                    <h3 className="text-2xl font-bold text-slate-800">Verifying Template: {template?.name} v{template?.version}</h3>
                    <p className="text-sm text-slate-500">Enter a complete set of test data to verify the template's calculations. When you save, this data will be stored as a permanent qualification record for this template version.</p>
                </div>
            </div>

            <div className="space-y-6">
                {docData.header?.fields?.length > 0 && (
                    <div className="designer-section">
                        <h4 className="font-bold text-lg mb-2">Template Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {docData.header.fields.map(field => (
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
                            {docData.sampleInfo.fields.map(field => <VerificationField key={field.id} field={field} control={control} defaultValue={template?.document_data?.verification_data?.[field.value]} />)}
                        </div>
                    </div>
                )}
                
                {docData.dataInputs?.sections?.length > 0 && (
                     <div className="designer-section">
                         <h4 className="font-bold text-lg mb-2">Data Inputs for Calculation</h4>
                         {docData.dataInputs.sections.map((section, sIdx) => (
                            <div key={section.id} className="mb-4">
                                <h5 className="font-semibold text-md text-slate-800 mb-2">{section.title}</h5>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {section.fields.map((field, fIdx) => {
                                        const cellId = `A${getGlobalFieldIndex(docData.dataInputs.sections, sIdx, fIdx) + 1}`;
                                        return <VerificationField key={field.id} field={{...field, value: cellId }} control={control} defaultValue={template?.document_data?.verification_data?.[cellId]} />;
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
                            {docData.calculation.formulas.map(field => (
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
            </div>
        </div>
    );
}
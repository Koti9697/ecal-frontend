// In src/screens/RecordScreen.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useApi } from '../hooks/useApi';
import { PasswordModal } from '../components/common/PasswordModal';
import { Button } from '../components/ui/Button';
import { useHasPrivilege } from '../hooks/useHasPrivilege';
import { evaluate } from 'mathjs';
import toast from 'react-hot-toast';
import { useDateFormatter } from '../hooks/useDateFormatter';
import { generateRecordPdf } from '../utils/reportGenerator';
import { useAppSelector } from '../store/hooks';
import { ReportSectionsModal } from '../components/common/ReportSectionsModal';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';

const RecordField = ({ field, control, recordStatus }) => {
    const isReadOnly = recordStatus !== 'DRAFT';
    return (
        <div className="mb-2">
            <label className="block text-sm font-medium text-slate-700">{field.label}</label>
            <Controller
                name={field.id}
                control={control}
                defaultValue={field.value}
                render={({ field: { onChange, onBlur, value } }) => (
                    <input onChange={onChange} onBlur={onBlur} value={value || ''} readOnly={isReadOnly} className={`input-style ${isReadOnly ? 'bg-slate-100' : ''}`} />
                )}
            />
        </div>
    );
};

const DataInputField = ({ field, control, recordStatus, cellId }) => {
    const isReadOnly = recordStatus !== 'DRAFT';
    return (
        <div className="mb-2">
            <label className="block text-sm font-medium text-slate-700">{field.label}</label>
            <Controller
                name={cellId}
                control={control}
                defaultValue=""
                render={({ field: { onChange, onBlur, value } }) => (
                    <input onChange={onChange} onBlur={onBlur} value={value || ''} readOnly={isReadOnly} className={`input-style ${isReadOnly ? 'bg-slate-100' : ''}`} />
                )}
            />
        </div>
    );
};

export function RecordScreen({ recordId, template, onBack }) {
    const [record, setRecord] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [workflowDetails, setWorkflowDetails] = useState({ action: '', meaning: '' });
    const [activeTab, setActiveTab] = useState('data');

    const api = useApi();
    const { control, reset, getValues, watch, formState: { isDirty } } = useForm();
    const formatDate = useDateFormatter();
    const user = useAppSelector((state) => state.auth.user);

    const canSaveChanges = useHasPrivilege(['CREATE_EDIT_DRAFT_RECORDS']);
    const canGenerateReport = useHasPrivilege(['GENERATE_REPORTS_FOR_RECORDS']);
    const canSubmit = useHasPrivilege(['SUBMIT_RECORD_FOR_REVIEW']);
    const canReview = useHasPrivilege(['PERFORM_REVIEW']);
    const canApprove = useHasPrivilege(['PERFORM_APPROVAL']);
    const canCancel = useHasPrivilege(['CREATE_EDIT_DRAFT_RECORDS']);
    const canAcknowledge = useHasPrivilege(['CREATE_EDIT_DRAFT_RECORDS']);

    useEffect(() => {
        const loadRecord = async () => {
            setIsLoading(true);
            try {
                if (recordId) {
                    const data = await api(`/records/${recordId}/`);
                    setRecord(data);
                    const initialData = {};
                    data.data_entries.forEach(entry => { initialData[entry.cell_id] = entry.cell_value; });
                    data.template.document_data.sampleInfo?.fields.forEach(field => {
                        if (initialData[field.id] === undefined) {
                            initialData[field.id] = field.value;
                        }
                    });
                    reset(initialData);
                } else if (template) {
                    setRecord({ template: template, status: 'DRAFT', data_entries: [] });
                    const initialData = {};
                     template.document_data.sampleInfo?.fields.forEach(field => {
                        initialData[field.id] = field.value;
                    });
                    reset(initialData);
                }
            } catch (err) {
                toast.error('Failed to load data.');
            } finally {
                setIsLoading(false);
            }
        };
        loadRecord();
    }, [recordId, template, api, reset]);

    const handleSaveData = () => setIsSaveModalOpen(true);

    const handleConfirmSave = async ({ reason, password }) => {
        setIsSaveModalOpen(false);
        const formData = getValues();
        const data_entries = Object.keys(formData).map(key => ({ cell_id: key, cell_value: formData[key] }));

        try {
            let updatedRecord;
            if (record && record.id) {
                await api(`/records/${record.id}/save-data/`, { method: 'PATCH', data: { data_entries, reason_for_change: reason, password } });
                toast.success("Data saved successfully!");
                updatedRecord = await api(`/records/${record.id}/`);
            } else {
                const newRecord = await api('/records/', {
                    method: 'POST',
                    data: { template_id: template.id }
                });
                await api(`/records/${newRecord.id}/save-data/`, { method: 'PATCH', data: { data_entries, reason_for_change: reason, password } });
                toast.success("Record created and data saved successfully!");
                updatedRecord = await api(`/records/${newRecord.id}/`);
            }
            
            setRecord(updatedRecord);

            // --- THIS IS THE FIX ---
            // After saving, we reset the form with the latest data from the server.
            // This tells react-hook-form that the current state is now the "saved" state.
            const newInitialData = {};
            updatedRecord.data_entries.forEach(entry => { newInitialData[entry.cell_id] = entry.cell_value; });
            updatedRecord.template.document_data.sampleInfo?.fields.forEach(field => {
                if (newInitialData[field.id] === undefined) {
                    newInitialData[field.id] = field.value;
                }
            });
            reset(newInitialData);

        } catch (err: any) {
            toast.error(`Failed to save data: ${err.data?.detail || 'An error occurred.'}`);
        }
    };


    const handleWorkflowClick = (action: string, meaning: string) => {
        if (isDirty) {
            toast.error("You have unsaved changes. Please save the data before proceeding.");
            return;
        }
        if (!record || !record.id) {
            toast.error("Please save the record before performing workflow actions.");
            return;
        }
        setWorkflowDetails({ action, meaning });
        setIsWorkflowModalOpen(true);
    };

    const handleConfirmWorkflow = async ({ password, reason, meaning }) => {
        const { action } = workflowDetails;
        if (!action || !record || !record.id) return;
        setIsWorkflowModalOpen(false);
        try {
            const updatedRecord = await api(`/records/${record.id}/${action}/`, { method: 'POST', data: { password, reason, meaning } });
            toast.success(`Record successfully ${action.replace('-', ' ')}ed!`);
            setRecord(updatedRecord);
        } catch (err: any) {
            toast.error(`Action failed: ${err.data?.detail || 'An error occurred.'}`);
        }
    };

    const handleConfirmReport = (selectedSections: string[]) => {
        setIsReportModalOpen(false);
        if (record) {
            generateRecordPdf(record, user, getValues(), selectedSections);
        }
    };

    const renderWorkflowButtons = () => {
        if (!record || !record.id) return null;
        const buttons = [];
        switch (record.status) {
            case 'DRAFT':
                if (canSubmit) buttons.push(<Button key="submit" onClick={() => handleWorkflowClick('submit', 'Submitted for Review')}>Submit for Review</Button>);
                break;
            case 'SUBMITTED_FOR_REVIEW':
                if (canReview) {
                    buttons.push(<Button key="reject" variant="danger" onClick={() => handleWorkflowClick('reject', 'Rejected')}>Reject</Button>);
                    buttons.push(<Button key="review" onClick={() => handleWorkflowClick('review', 'Reviewed')}>Review</Button>);
                }
                if (canCancel) {
                    buttons.push(<Button key="cancel" variant="secondary" onClick={() => handleWorkflowClick('cancel', 'Cancelled')}>Cancel</Button>);
                }
                break;
            case 'REVIEWED':
                if (canApprove) {
                    buttons.push(<Button key="reject-approve" variant="danger" onClick={() => handleWorkflowClick('reject', 'Rejected')}>Reject</Button>);
                    buttons.push(<Button key="approve" onClick={() => handleWorkflowClick('approve', 'Approved')}>Approve</Button>);
                }
                break;
            case 'REJECTED':
                if (canAcknowledge) buttons.push(<Button key="ack" onClick={() => handleWorkflowClick('acknowledge-rejection', 'Rejection Acknowledged')}>Acknowledge Rejection</Button>);
                break;
        }
        return buttons;
    };

    const watchedFields = watch();
    const calculateResult = (formula) => {
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

    const getGlobalFieldIndex = (dataInputSections, sIdx, fIdx) => {
        let count = 0;
        for (let i = 0; i < sIdx; i++) { count += dataInputSections[i].fields.length; }
        return count + fIdx;
    };

    const availableReportSections = useMemo(() => {
        if (!record) return [];
        const sections = ['Record Details', 'Data & Results'];
        if (record.signatures?.length > 0) {
            sections.push('Signatures');
        }
        if (record.audit_trail?.length > 0) {
            sections.push('Audit Trail');
        }
        return sections;
    }, [record]);

    if (isLoading) return <div className="p-6"><SkeletonLoader rows={10} cols={3}/></div>;

    const docData = record?.template?.document_data || {};

    return (
        <div>
            <ReportSectionsModal
                isOpen={isReportModalOpen}
                onConfirm={handleConfirmReport}
                onCancel={() => setIsReportModalOpen(false)}
                title="Generate Record Report"
                availableSections={availableReportSections}
            />
            <PasswordModal isOpen={isSaveModalOpen} onConfirm={handleConfirmSave} onCancel={() => setIsSaveModalOpen(false)} title={`Save Data for ${record?.record_id_display || 'New Record'}`} actionText="Confirm & Save" isReasonRequired={true} />
            <PasswordModal isOpen={isWorkflowModalOpen} onConfirm={handleConfirmWorkflow} onCancel={() => setIsWorkflowModalOpen(false)} title={`Confirm Action: ${workflowDetails.meaning}`} actionText="Confirm with E-Signature" isReasonRequired={true} showMeaningField={true} meaningOptions={[workflowDetails.meaning]}/>
            <div className="flex justify-between items-center mb-4">
                <div><button onClick={onBack} className="text-blue-600 hover:underline">&larr; Back to Record List</button><h3 className="text-2xl font-bold text-slate-800">{record?.record_id_display || 'New Record'}</h3><p className="text-sm text-slate-500">Using Template: {record?.template.name} v{record?.template.version}</p></div>
                <div className="flex items-center space-x-2">
                    {record?.id && canGenerateReport &&
                        <Button variant="secondary" onClick={() => setIsReportModalOpen(true)}>Generate PDF Report</Button>
                    }
                    {record?.status === 'DRAFT' && canSaveChanges &&
                        <Button onClick={handleSaveData} className="bg-green-600 hover:bg-green-700">Save Data</Button>
                    }
                    {renderWorkflowButtons()}
                </div>
            </div>

            <div className="border-b border-slate-300 mb-6">
                 <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button onClick={() => setActiveTab('data')} type="button" className={`tab-btn ${activeTab === 'data' ? 'active' : ''}`}>Data Entry & Results</button>
                    <button onClick={() => setActiveTab('history')} type="button" className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}>History & Approvals</button>
                </nav>
            </div>

            {activeTab === 'data' && (
                <div className="space-y-6">
                    {docData.header?.fields?.length > 0 && (<div className="designer-section"><h4 className="font-bold text-lg mb-2">Template Information</h4><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{docData.header.fields.map(field => (<div key={field.id}><label className="block text-sm font-medium text-slate-700">{field.label}</label><input value={field.value} readOnly className="input-style bg-slate-100"/></div>))}</div></div>)}
                    {docData.sampleInfo?.fields?.length > 0 && (<div className="designer-section"><h4 className="font-bold text-lg mb-2">Analysis Information</h4><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{docData.sampleInfo.fields.map(field => <RecordField key={field.id} field={field} control={control} recordStatus={record.status} />)}</div></div>)}
                    {docData.dataInputs?.sections?.length > 0 && (<div className="designer-section"><h4 className="font-bold text-lg mb-2">Data Inputs & Variables</h4>{docData.dataInputs.sections.map((section, sIdx) => (<div key={section.id} className="mb-4"><h5 className="font-semibold text-md text-slate-800 mb-2">{section.title}</h5><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{section.fields.map((field, fIdx) => <DataInputField key={field.id} field={field} control={control} recordStatus={record.status} cellId={`A${getGlobalFieldIndex(docData.dataInputs.sections, sIdx, fIdx) + 1}`} />)}</div></div>))}</div>)}
                    {docData.calculation?.formulas?.length > 0 && (<div className="designer-section"><h4 className="font-bold text-lg mb-2">Results</h4><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{docData.calculation.formulas.map(field => (<div className="mb-2" key={field.id}><label className="block text-sm font-medium text-slate-700">{field.label}</label><input value={calculateResult(field)} readOnly className="input-style bg-slate-100"/></div>))}</div></div>)}
                </div>
            )}

            {activeTab === 'history' && (
                <div className="space-y-6">
                    <div className="designer-section space-y-3"><h4 className="font-bold text-lg">Approvals History</h4><div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200"><thead className="bg-slate-200"><tr><th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase">Action</th><th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase">Signed By</th><th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase">Date & Time</th></tr></thead><tbody className="bg-white divide-y divide-slate-200">{record?.signatures?.length > 0 ? record.signatures.map(s => (<tr key={s.signed_at}><td className="px-4 py-2 text-sm">{s.meaning}</td><td className="px-4 py-2 text-sm">{s.signed_by.username}</td><td className="px-4 py-2 text-sm">{formatDate(s.signed_at)}</td></tr>)) : (<tr><td colSpan={3} className="px-4 py-4 text-center text-slate-500">No signatures recorded.</td></tr>)}</tbody></table></div></div>
                    <div className="designer-section space-y-3"><h4 className="font-bold text-lg">Record History</h4><div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200"><thead className="bg-slate-200"><tr><th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase">Date & Time</th><th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase">User</th><th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase">Action</th><th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase">Reason</th><th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase">Previous Value</th><th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase">New Value</th></tr></thead><tbody className="bg-white divide-y divide-slate-200">{record?.audit_trail?.length > 0 ? record.audit_trail.map(log => (<tr key={log.id}><td className="px-4 py-2 text-sm">{formatDate(log.timestamp)}</td><td className="px-4 py-2 text-sm">{log.user.username}</td><td className="px-4 py-2 text-sm">{log.details}</td><td className="px-4 py-2 text-sm">{log.reason_for_change}</td><td className="px-4 py-2 text-sm">{log.previous_value}</td><td className="px-4 py-2 text-sm">{log.new_value}</td></tr>)) : (<tr><td colSpan={6} className="px-4 py-4 text-center text-slate-500">No history recorded.</td></tr>)}</tbody></table></div></div>
                </div>
            )}
        </div>
    );
}
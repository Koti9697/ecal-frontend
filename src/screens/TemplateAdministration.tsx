// In src/screens/TemplateAdministration.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApi } from '../hooks/useApi';
import { TemplateForm } from '../components/templates/TemplateForm';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PasswordModal } from '../components/common/PasswordModal';
import { useHasPrivilege } from '../hooks/useHasPrivilege';
import toast from 'react-hot-toast';
import { useDateFormatter } from '../hooks/useDateFormatter';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';
import type { Template } from '../types/models';

export function TemplateAdministration({ onNavigateToVerify }: { onNavigateToVerify: (template: Template) => void }) {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
    const [workflowDetails, setWorkflowDetails] = useState<{ action: string; templateId: number | null; meaning: string }>({ action: '', templateId: null, meaning: '' });
    const [activeTab, setActiveTab] = useState('DRAFT');
    const [filters, setFilters] = useState({
        name: '',
        created_by: '',
        updated_by: '',
        updated_after: '',
        updated_before: '',
    });

    const api = useApi();
    const formatDate = useDateFormatter();

    const canCreate = useHasPrivilege(['MANAGE_TEMPLATES']);
    const canSubmit = useHasPrivilege(['MANAGE_TEMPLATES']);
    const canReview = useHasPrivilege(['PERFORM_REVIEW']);
    const canApprove = useHasPrivilege(['PERFORM_APPROVAL']);
    const canRevise = useHasPrivilege(['MANAGE_TEMPLATES']);
    const canAcknowledge = useHasPrivilege(['MANAGE_TEMPLATES']);
    const canVerify = useHasPrivilege(['MANAGE_TEMPLATES']);

    const fetchTemplates = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams(filters as any);
            const data = await api(`/templates/?${params.toString()}`);
            setTemplates(data);
        } catch (error) {
            toast.error("Failed to fetch templates.");
        } finally {
            setIsLoading(false);
        }
    }, [api, filters]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const clearFilters = () => {
        setFilters({ name: '', created_by: '', updated_by: '', updated_after: '', updated_before: '' });
    };

    const handleCreate = () => { setSelectedTemplate(null); setIsFormVisible(true); };
    const handleEdit = async (template: Template) => {
        try {
            const fullTemplate = await api(`/templates/${template.id}/`);
            setSelectedTemplate(fullTemplate);
            setIsFormVisible(true);
        } catch (error) { toast.error("Failed to load template details."); }
    };

    const handleVerifyClick = async (template: Template) => {
        try {
            const fullTemplate = await api(`/templates/${template.id}/`);
            onNavigateToVerify(fullTemplate);
        } catch (error) {
            toast.error("Failed to load template details for verification.");
        }
    };

    const handleCancel = () => { setIsFormVisible(false); setSelectedTemplate(null); };

    const handleSave = async (templateData: any) => {
        const isEditing = !!templateData.id;
        const method = isEditing ? 'PUT' : 'POST';
        const endpoint = isEditing ? `/templates/${templateData.id}/` : '/templates/';
        try {
            await api(endpoint, { method, data: templateData });
            toast.success(`Template successfully ${isEditing ? 'updated' : 'created'}.`);
            setIsFormVisible(false);
            fetchTemplates();
        } catch (err: any) {
            let errorMessage = 'An error occurred.';
            if (err.data && typeof err.data === 'object') {
                const errorMessages = Object.values(err.data).flat();
                if (errorMessages.length > 0) { errorMessage = errorMessages.join(' '); }
            } else if (err.data?.detail) {
                errorMessage = err.data.detail;
            }
            toast.error(`Save failed: ${errorMessage}`);
        }
    };

    const handleVerify = async (verificationData: any) => {
        try {
            await api(`/templates/${verificationData.id}/verify/`, {
                method: 'POST',
                data: verificationData
            });
            toast.success("Template successfully verified.");
            setIsFormVisible(false);
            fetchTemplates();
        } catch (err: any) {
            toast.error(`Verification failed: ${err.data?.detail || 'An error occurred.'}`);
        }
    };

    const handleWorkflowClick = (action: string, templateId: number, meaning: string) => {
        setWorkflowDetails({ action, templateId, meaning });
        setIsWorkflowModalOpen(true);
    };

    const handleConfirmWorkflow = async ({ password, reason, meaning }: { password: string; reason: string; meaning?: string; }) => {
        const { action, templateId } = workflowDetails;
        if (!action || !templateId) return;
        setIsWorkflowModalOpen(false);
        try {
            await api(`/templates/${templateId}/${action}/`, { method: 'POST', data: { password, reason, meaning } });
            toast.success(`Template successfully ${action}ed!`);
            fetchTemplates();
        } catch (err: any) {
            toast.error(`Action failed: ${err.data?.detail || 'An error occurred.'}`);
        }
    };

    const filteredTemplates = useMemo(() => {
        return templates.filter(template => template.status === activeTab);
    }, [templates, activeTab]);

    const renderWorkflowButtons = (template: Template) => {
        const buttonBaseClass = "font-medium ml-4";
        const editButtonText = (template.status === 'DRAFT' || template.status === 'REJECTED') ? 'Edit' : 'View';

        return (
            <>
                <button onClick={() => handleEdit(template)} className="text-blue-600 hover:text-blue-900">{editButtonText}</button>
                {template.status === 'DRAFT' && canVerify &&
                    <button onClick={() => handleVerifyClick(template)} className={`${buttonBaseClass} text-teal-600 hover:text-teal-900`}>Verify</button>}
                {template.status === 'VERIFIED' && canSubmit &&
                    <button onClick={() => handleWorkflowClick('submit', template.id, 'Submitted')} className={`${buttonBaseClass} text-green-600 hover:text-green-900`}>Submit for Review</button>}
                {template.status === 'SUBMITTED_FOR_REVIEW' && canReview &&
                    <><button onClick={() => handleWorkflowClick('reject', template.id, 'Rejected')} className={`${buttonBaseClass} text-red-600 hover:text-red-900`}>Reject</button><button onClick={() => handleWorkflowClick('review', template.id, 'Reviewed')} className={`${buttonBaseClass} text-yellow-600 hover:text-yellow-900`}>Review</button></>}
                {template.status === 'REVIEWED' && canApprove &&
                     <><button onClick={() => handleWorkflowClick('reject', template.id, 'Rejected')} className={`${buttonBaseClass} text-red-600 hover:text-red-900`}>Reject</button><button onClick={() => handleWorkflowClick('approve', template.id, 'Approved')} className={`${buttonBaseClass} text-purple-600 hover:text-purple-900`}>Approve</button></>}
                {template.status === 'APPROVED' && canRevise &&
                    <button onClick={() => handleWorkflowClick('revise', template.id, 'Revised')} className={`${buttonBaseClass} text-blue-600 hover:text-blue-900`}>Revise</button>}
                {template.status === 'REJECTED' && canAcknowledge &&
                    <button onClick={() => handleWorkflowClick('acknowledge_rejection', template.id, 'Rejection Acknowledged')} className={`${buttonBaseClass} text-orange-600 hover:text-orange-900`}>Acknowledge Rejection</button>}
            </>
        );
    };

    const TABS = ['DRAFT', 'VERIFIED', 'SUBMITTED_FOR_REVIEW', 'REVIEWED', 'APPROVED', 'REJECTED', 'RETIRED'];

    if (isFormVisible) {
        return <TemplateForm template={selectedTemplate} onSave={handleSave} onCancel={handleCancel} onVerify={handleVerify} />;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-slate-800">Template Administration</h3>
                {canCreate && (
                    <Button onClick={handleCreate}>
                        Create New Template
                    </Button>
                )}
            </div>

            <Card title="Filter Templates">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
                    <div><label className="block text-sm font-medium">Name Contains</label><input name="name" value={filters.name} onChange={handleFilterChange} className="input-style"/></div>
                    <div><label className="block text-sm font-medium">Created By</label><input name="created_by" value={filters.created_by} onChange={handleFilterChange} className="input-style"/></div>
                    <div><label className="block text-sm font-medium">Updated By</label><input name="updated_by" value={filters.updated_by} onChange={handleFilterChange} className="input-style"/></div>
                    <div><label className="block text-sm font-medium">Updated After</label><input type="date" name="updated_after" value={filters.updated_after} onChange={handleFilterChange} className="input-style"/></div>
                    <div><label className="block text-sm font-medium">Updated Before</label><input type="date" name="updated_before" value={filters.updated_before} onChange={handleFilterChange} className="input-style"/></div>
                </div>
                <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
                    <Button variant="secondary" onClick={clearFilters}>Clear Filters</Button>
                    <Button onClick={fetchTemplates}>Apply Filters</Button>
                </div>
            </Card>

            <div className="mt-6">
                <div className="border-b border-slate-200">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        {TABS.map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-btn ${activeTab === tab ? 'active' : ''}`}>
                                {tab.replace('_', ' ')} ({templates.filter(t => t.status === tab).length})
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="bg-white rounded-b-lg shadow overflow-hidden">
                    {isLoading ? (
                        <div className="p-6"><SkeletonLoader rows={5} cols={6} /></div>
                    ) : (
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Template ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Template Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Version</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Created By</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Last Updated</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Updated By</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {filteredTemplates.map((template: any) => (
                                    <tr key={template.id}>
                                        <td className="px-6 py-4 text-sm font-medium">{template.template_id}</td>
                                        <td className="px-6 py-4 text-sm font-medium">{template.name}</td>
                                        <td className="px-6 py-4 text-sm">{template.version}</td>
                                        <td className="px-6 py-4 text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${template.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{template.status}</span></td>
                                        <td className="px-6 py-4 text-sm">{template.created_by}</td>
                                        <td className="px-6 py-4 text-sm">{formatDate(template.updated_at)}</td>
                                        <td className="px-6 py-4 text-sm">{template.updated_by || 'N/A'}</td>
                                        <td className="px-6 py-4 text-sm font-medium">{renderWorkflowButtons(template)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <PasswordModal
                isOpen={isWorkflowModalOpen}
                onConfirm={handleConfirmWorkflow}
                onCancel={() => setIsWorkflowModalOpen(false)}
                title={`Confirm: ${workflowDetails.action.charAt(0).toUpperCase() + workflowDetails.action.slice(1)} Template`}
                actionText="Confirm with E-Signature"
                isReasonRequired={true}
                showMeaningField={true}
                meaningOptions={[workflowDetails.meaning]}
            />
        </div>
    );
}
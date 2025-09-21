// In src/screens/RecordListScreen.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApi } from '../hooks/useApi';
import { Card } from '../components/ui/Card';
import toast from 'react-hot-toast';
import { useAppSelector } from '../store/hooks';
import { Button } from '../components/ui/Button';
import { PasswordModal } from '../components/common/PasswordModal';
import { useHasPrivilege } from '../hooks/useHasPrivilege';
import { SkeletonLoader } from '../components/ui/SkeletonLoader'; // IMPORT a skeleton loader

export function RecordListScreen({ onNavigateToRecord }) {
    const [records, setRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(true); // NEW loading state
    const [activeTab, setActiveTab] = useState('DRAFT');
    const [filterText, setFilterText] = useState('');
    const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
    const [workflowDetails, setWorkflowDetails] = useState({ action: '', recordId: null, meaning: '' });
    const api = useApi();
    const user = useAppSelector((state) => state.auth.user);

    const canCancel = useHasPrivilege(['CREATE_EDIT_DRAFT_RECORDS']);
    const canReview = useHasPrivilege(['PERFORM_REVIEW']);
    const canApprove = useHasPrivilege(['PERFORM_APPROVAL']);
    const canAcknowledge = useHasPrivilege(['CREATE_EDIT_DRAFT_RECORDS']);
    const isAnalyst = user?.roles.includes('Analyst');
    const isApprover = user?.roles.includes('Approver');

    const fetchRecords = useCallback(async () => {
        setIsLoading(true); // Set loading to true
        try {
            const data = await api('/records/');
            setRecords(data);
        } catch (error) {
            toast.error("Failed to fetch records.");
        } finally {
            setIsLoading(false); // Set loading to false
        }
    }, [api]);

    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    const handleWorkflowClick = (action: string, recordId: number, meaning: string) => {
        setWorkflowDetails({ action, recordId, meaning });
        setIsWorkflowModalOpen(true);
    };

    const handleConfirmWorkflow = async ({ password, reason, meaning }) => {
        const { action, recordId } = workflowDetails;
        if (!action || !recordId) return;
        setIsWorkflowModalOpen(false);
        try {
            await api(`/records/${recordId}/${action}/`, { method: 'POST', data: { password, reason, meaning } });
            toast.success(`Record successfully ${action.replace('_', ' ')}ed!`);
            fetchRecords(); // Refresh the list
        } catch (err: any) {
            toast.error(`Action failed: ${err.data?.detail || 'An error occurred.'}`);
        }
    };

    const filteredRecords = useMemo(() => {
        return records
            .filter(record => {
                if (activeTab === 'IN_REVIEW') return record.status === 'SUBMITTED_FOR_REVIEW';
                if (activeTab === 'IN_APPROVAL') return record.status === 'REVIEWED';
                return record.status === activeTab;
            })
            .filter(record => {
                const searchText = filterText.toLowerCase();
                return (
                    record.record_id_display.toLowerCase().includes(searchText) ||
                    record.template.name.toLowerCase().includes(searchText) ||
                    record.created_by.username.toLowerCase().includes(searchText)
                );
            });
    }, [records, activeTab, filterText]);

    const getVisibleTabs = () => {
        const roles = user?.roles || [];
        if (roles.includes('Administrator')) {
            return ['DRAFT', 'IN_REVIEW', 'IN_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED'];
        }
        const visible = new Set<string>();
        if (roles.includes('Analyst')) {
            ['DRAFT', 'IN_REVIEW', 'IN_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED'].forEach(t => visible.add(t));
        }
        if (roles.includes('Reviewer')) {
            ['IN_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED'].forEach(t => visible.add(t));
        }
        if (roles.includes('Approver')) {
            ['IN_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED'].forEach(t => visible.add(t));
        }
        return Array.from(visible);
    };

    const visibleTabs = getVisibleTabs();

    const getTabName = (tab: string) => {
        if (isApprover && tab === 'IN_REVIEW') return 'In Approval';
        return tab.replace('_', ' ');
    }

    const getTabRecordCount = (tab: string) => {
        if (tab === 'IN_REVIEW') return records.filter(r => r.status === 'SUBMITTED_FOR_REVIEW').length;
        if (tab === 'IN_APPROVAL') return records.filter(r => r.status === 'REVIEWED').length;
        return records.filter(r => r.status === tab).length;
    }

    return (
        <div>
            <h3 className="text-2xl font-bold text-slate-800 mb-4">View Records</h3>
            <Card title="All Records">
                <div className="p-4 bg-slate-50 border-b">
                    <input
                        type="text"
                        placeholder="Filter by Record ID, Template, or User..."
                        className="input-style w-full"
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                    />
                </div>
                <div className="border-b border-slate-200">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        {visibleTabs.map(tab => {
                            const tabKey = isApprover && tab === 'IN_REVIEW' ? 'IN_APPROVAL' : tab;
                            return (
                                <button key={tabKey} onClick={() => setActiveTab(tabKey)} className={`tab-btn ${activeTab === tabKey ? 'active' : ''}`}>
                                    {getTabName(tabKey)} ({getTabRecordCount(tabKey)})
                                </button>
                            )
                        })}
                    </nav>
                </div>
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-6">
                            <SkeletonLoader />
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Record ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Template</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Created By</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {filteredRecords.map(record => (
                                    <tr key={record.id}>
                                        <td className="px-6 py-4 text-sm font-medium">{record.record_id_display}</td>
                                        <td className="px-6 py-4 text-sm">{record.template.name} {record.template.version}</td>
                                        <td className="px-6 py-4 text-sm">{record.status}</td>
                                        <td className="px-6 py-4 text-sm">{record.created_by.username}</td>
                                        <td className="px-6 py-4 text-sm space-x-4">
                                            <button onClick={() => onNavigateToRecord(record.id)} className="text-blue-600 hover:text-blue-900">
                                                {isAnalyst && record.status === 'DRAFT' ? 'Edit' : 'View'}
                                            </button>

                                            {canCancel && ['SUBMITTED_FOR_REVIEW', 'REVIEWED'].includes(record.status) && (
                                                <button onClick={() => handleWorkflowClick('cancel', record.id, 'Cancelled')} className="text-orange-600 hover:text-orange-900">Cancel</button>
                                            )}
                                            {canReview && record.status === 'SUBMITTED_FOR_REVIEW' && (<>
                                                <button onClick={() => handleWorkflowClick('review', record.id, 'Reviewed')} className="text-green-600 hover:text-green-900">Review</button>
                                                <button onClick={() => handleWorkflowClick('reject', record.id, 'Rejected')} className="text-red-600 hover:text-red-900">Reject</button>
                                            </>)}
                                            {canApprove && record.status === 'REVIEWED' && (<>
                                                <button onClick={() => handleWorkflowClick('approve', record.id, 'Approved')} className="text-purple-600 hover:text-purple-900">Approve</button>
                                                <button onClick={() => handleWorkflowClick('reject', record.id, 'Rejected')} className="text-red-600 hover:text-red-900">Reject</button>
                                            </>)}
                                            {canAcknowledge && record.status === 'REJECTED' && (
                                                <button onClick={() => handleWorkflowClick('acknowledge-rejection', record.id, 'Rejection Acknowledged')} className="text-yellow-600 hover:text-yellow-900">Acknowledge</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </Card>
            <PasswordModal
                isOpen={isWorkflowModalOpen}
                onConfirm={handleConfirmWorkflow}
                onCancel={() => setIsWorkflowModalOpen(false)}
                title={`Confirm Action: ${workflowDetails.meaning}`}
                actionText="Confirm with E-Signature"
                isReasonRequired={true}
                showMeaningField={true}
                meaningOptions={[workflowDetails.meaning]}
            />
        </div>
    );
}
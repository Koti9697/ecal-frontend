// In src/components/admin/RoleManagement.tsx

import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../../hooks/useApi';
import { RoleForm } from './RoleForm';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';
import { PasswordModal } from '../common/PasswordModal';
import { Privilege, Role } from '../../types/models';

export function RoleManagement() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [privileges, setPrivileges] = useState<Privilege[]>([]);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const api = useApi();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pendingRoleData, setPendingRoleData] = useState<any | null>(null);

    const fetchRoles = useCallback(async () => {
        try {
            const data = await api('/groups/');
            setRoles(data);
        } catch (error) {
            toast.error("Failed to fetch roles.");
        }
    }, [api]);

    const fetchPrivileges = useCallback(async () => {
        try {
            const data = await api('/privileges/');
            setPrivileges(data);
        } catch (error) {
            toast.error("Failed to fetch privileges.");
        }
    }, [api]);

    useEffect(() => {
        fetchRoles();
        fetchPrivileges();
    }, [fetchRoles, fetchPrivileges]);

    const handleCreate = () => {
        setSelectedRole(null);
        setIsFormVisible(true);
    };

    const handleEdit = (role: Role) => {
        const roleWithPrivileges = { ...role, privileges: role.privileges || [] };
        setSelectedRole(roleWithPrivileges);
        setIsFormVisible(true);
    };

    const handleCancel = () => {
        setIsFormVisible(false);
        setSelectedRole(null);
        setPendingRoleData(null);
        setIsModalOpen(false);
    };

    const handleSave = (roleData: any) => {
        setPendingRoleData(roleData);
        setIsModalOpen(true);
    };

    const handleConfirmSave = async ({ password, reason }: { password: string; reason: string; }) => {
        if (!pendingRoleData) return;

        const isEditing = !!pendingRoleData.id;
        const method = isEditing ? 'PUT' : 'POST';
        const endpoint = isEditing ? `/groups/${pendingRoleData.id}/` : '/groups/';

        const dataToSubmit = {
            ...pendingRoleData,
            admin_password: password,
            reason_for_change: reason,
        };

        try {
            await api(endpoint, { method, data: dataToSubmit });
            toast.success(`Role successfully ${isEditing ? 'updated' : 'created'}.`);
            setIsFormVisible(false);
            fetchRoles();
        } catch (err: any) {
            toast.error(`Save failed: ${err.data?.detail || 'An error occurred.'}`);
        } finally {
            handleCancel();
        }
    };

    return (
        <div>
            {isFormVisible ? (
                <RoleForm role={selectedRole} allPrivileges={privileges} onSave={handleSave} onCancel={handleCancel} />
            ) : (
                <>
                    <div className="flex justify-end mb-4">
                        <Button onClick={handleCreate}>Create New Role</Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Role Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Assigned Privileges</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {roles.map(role => (
                                    <tr key={role.id}>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{role.name}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {(role.privileges || []).map(p => p.name).join(', ')}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium">
                                            <button onClick={() => handleEdit(role)} className="text-blue-600 hover:text-blue-900">Edit</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            <PasswordModal
                isOpen={isModalOpen}
                onConfirm={handleConfirmSave}
                onCancel={handleCancel}
                title="Confirm Role Modification"
                actionText="Confirm & Save"
                isReasonRequired={true}
            />
        </div>
    );
}
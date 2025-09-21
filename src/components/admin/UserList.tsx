import { useState, useCallback, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { UserForm } from './UserForm';
import { PasswordModal } from '../common/PasswordModal';
import { type User } from '../../types/User';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';

export function UserList() {
    const [users, setUsers] = useState<User[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const api = useApi();
    
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [pendingUserData, setPendingUserData] = useState<any | null>(null);

    const fetchUsers = useCallback(async () => {
        try {
            const data = await api('/users/');
            setUsers(data);
        } catch (error) {
            toast.error("Failed to fetch users.");
        }
    }, [api]);

    const fetchGroups = useCallback(async () => {
        try {
            const data = await api('/groups/');
            setGroups(data);
        } catch (error) {
            toast.error("Failed to fetch groups.");
        }
    }, [api]);


    useEffect(() => {
        fetchUsers();
        fetchGroups();
    }, [fetchUsers, fetchGroups]);

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setIsFormVisible(true);
    };
    
    const handleCreate = () => {
        setSelectedUser(null);
        setIsFormVisible(true);
    };

    const handleChangeStatusClick = (user: User) => {
        setPendingUserData(user);
        setIsPasswordModalOpen(true);
    };

    const handlePasswordModalConfirm = async ({ password, reason }: { password: string, reason: string }) => {
        setIsPasswordModalOpen(false);
        if (!pendingUserData) return;

        try {
            // --- THIS IS THE FIX ---
            // The endpoint is updated to match the new backend route.
            const endpoint = `/users/${pendingUserData.id}/set-status/`;
            await api(endpoint, {
                method: 'POST',
                data: {
                    is_active: !pendingUserData.is_active, // Toggle the status
                    password,
                    reason_for_change: reason,
                },
            });
            toast.success(`User status for ${pendingUserData.username} updated.`);
            fetchUsers();
        } catch (err: any) {
            toast.error(`Failed to update status: ${err.data?.detail || 'An error occurred.'}`);
        } finally {
            setPendingUserData(null);
        }
    };
    
    const saveUser = async (userData: any) => {
        const isEditing = !!userData.id;
        const method = isEditing ? 'PUT' : 'POST';
        const endpoint = isEditing ? `/users/${userData.id}/` : '/users/';

        try {
            await api(endpoint, { method, data: userData });
            toast.success(`User successfully ${isEditing ? 'updated' : 'created'}.`);
            setIsFormVisible(false);
            fetchUsers();
        } catch (err: any) {
            let errorMessage = 'An error occurred.';
            if (err.data) {
                const errorMessages = Object.values(err.data).flat();
                if (errorMessages.length > 0) {
                    errorMessage = errorMessages.join(' ');
                } else if (err.data.detail) {
                    errorMessage = err.data.detail;
                }
            }
            toast.error(`Save failed: ${errorMessage}`);
        }
    };

    const handleCancel = () => {
        setIsFormVisible(false);
        setSelectedUser(null);
        setPendingUserData(null);
        setIsPasswordModalOpen(false);
    };

    if (isFormVisible) {
        return <UserForm user={selectedUser} allGroups={groups} onSave={saveUser} onCancel={handleCancel} />;
    }

    return (
        <div>
            <div className="flex justify-end mb-4">
                <Button onClick={handleCreate}>
                    Create New User
                </Button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Username</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Full Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Roles</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {users.map(user => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 text-sm font-medium text-slate-900">{user.username}</td>
                                <td className="px-6 py-4 text-sm text-slate-500">{`${user.first_name} ${user.last_name}`}</td>
                                <td className="px-6 py-4 text-sm text-slate-500">{user.groups.map(g => g.name).join(', ')}</td>
                                <td className="px-6 py-4 text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {user.is_active ? 'Active' : 'Disabled'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm font-medium space-x-4">
                                    <button onClick={() => handleEdit(user)} className="text-blue-600 hover:text-blue-900">Edit</button>
                                    <button onClick={() => handleChangeStatusClick(user)} className="text-yellow-600 hover:text-yellow-900">Change Status</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* --- THIS IS THE FIX --- */}
            {/* The UserStatusModal is no longer needed here. */}
            <PasswordModal 
                isOpen={isPasswordModalOpen}
                onConfirm={handlePasswordModalConfirm}
                onCancel={handleCancel}
                title={`Confirm Status Change for ${pendingUserData?.username}`}
                actionText="Confirm & Save"
                isReasonRequired={true}
            />
        </div>
    );
}
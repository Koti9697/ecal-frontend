// In src/components/admin/RoleForm.tsx

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../ui/Button';
import { FormError } from '../ui/FormError';
import type { Privilege, Role } from '../../types/models';

interface RoleFormProps {
  role: Role | null;
  allPrivileges: Privilege[];
  onSave: (data: any) => void;
  onCancel: () => void;
}

interface PrivilegeListProps {
  privileges: Privilege[];
  onAction: (privilege: Privilege) => void;
  actionSymbol: string;
  actionText: string;
  actionVariant: 'primary' | 'secondary' | 'danger';
}

export function RoleForm({ role, allPrivileges, onSave, onCancel }: RoleFormProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { name: role?.name || '' },
  });

  const [assignedPrivileges, setAssignedPrivileges] = useState<Privilege[]>([]);
  const [availablePrivileges, setAvailablePrivileges] = useState<Privilege[]>([]);

  useEffect(() => {
    reset({ name: role?.name || '' });

    const assignedIds = new Set((role?.privileges || []).map(p => p.id));
    const sortedPrivileges = [...allPrivileges].sort((a, b) => a.name.localeCompare(b.name));
    const assigned = role?.privileges ? [...role.privileges].sort((a,b) => a.name.localeCompare(b.name)) : [];

    setAssignedPrivileges(assigned);
    setAvailablePrivileges(sortedPrivileges.filter(p => !assignedIds.has(p.id)));
  }, [role, allPrivileges, reset]);

  const addPrivilege = (privilege: Privilege) => {
    setAssignedPrivileges([...assignedPrivileges, privilege].sort((a, b) => a.name.localeCompare(b.name)));
    setAvailablePrivileges(availablePrivileges.filter(p => p.id !== privilege.id));
  };

  const removePrivilege = (privilege: Privilege) => {
    setAvailablePrivileges([...availablePrivileges, privilege].sort((a, b) => a.name.localeCompare(b.name)));
    setAssignedPrivileges(assignedPrivileges.filter(p => p.id !== privilege.id));
  };

  const onSubmit = (data: { name: string }) => {
    const roleData = {
      name: data.name,
      privileges: assignedPrivileges.map(p => p.id),
      id: role?.id,
    };
    onSave(roleData);
  };

  const PrivilegeList = ({ privileges, onAction, actionSymbol, actionText, actionVariant }: PrivilegeListProps) => (
    <div className="border rounded-md h-64 overflow-y-auto bg-white p-2 space-y-2">
      {privileges.length === 0 && <p className="text-slate-400 text-sm p-2">No privileges in this list.</p>}
      {privileges.map((p: Privilege) => (
        <div key={p.id} className="flex items-center justify-between p-2 rounded-md hover:bg-slate-100">
          <div>
            <p className="font-medium text-sm text-slate-800">{p.name}</p>
            <p className="text-xs text-slate-500">{p.description}</p>
          </div>
          <Button type="button" variant={actionVariant} onClick={() => onAction(p)} title={actionText} className="px-2 py-1 text-xs">
            {actionSymbol}
          </Button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow max-w-4xl mx-auto">
      <h3 className="text-xl font-bold text-slate-800 mb-4">{role ? `Edit Role: ${role.name}` : 'Create New Role'}</h3>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Role Name <span className="text-red-500">*</span></label>
            <input
              {...register('name', { required: 'Role name is required' })}
              className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm"
            />
            <FormError>{errors.name?.message}</FormError>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Manage Privileges</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-center text-sm font-semibold mb-2">Available Privileges</p>
                <PrivilegeList privileges={availablePrivileges} onAction={addPrivilege} actionSymbol="&rarr;" actionText="Add" actionVariant="secondary"/>
              </div>
              <div>
                <p className="text-center text-sm font-semibold mb-2">Assigned Privileges</p>
                <PrivilegeList privileges={assignedPrivileges} onAction={removePrivilege} actionSymbol="&larr;" actionText="Remove" actionVariant="danger"/>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-2 pt-4 mt-4 border-t">
          <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button type="submit">Save Role</Button>
        </div>
      </form>
    </div>
  );
}
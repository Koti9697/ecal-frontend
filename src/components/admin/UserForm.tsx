// In src/components/admin/UserForm.tsx

import React, { useEffect } from 'react';
import { useForm, Controller, FieldError, Merge, FieldErrorsImpl } from 'react-hook-form';
import { type User, type Group } from '../../types/User';
import { Button } from '../ui/Button';
import { FormError } from '../ui/FormError';

interface UserFormProps {
  user: User | null;
  allGroups: Group[];
  onSave: (data: any) => void;
  onCancel: () => void;
}

export function UserForm({ user, allGroups, onSave, onCancel }: UserFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    // MODIFIED: Added mode for better UX
    mode: 'onTouched',
    defaultValues: {
      username: user?.username || '',
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      password: '',
      confirmPassword: '',
      groups: user?.groups?.map(g => g.id) || [],
      reason_for_change: '',
      admin_password: '', // Add default value for the new field
    },
  });

  const password = watch('password');

  useEffect(() => {
    reset({
        username: user?.username || '',
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        email: user?.email || '',
        password: '',
        confirmPassword: '',
        groups: user?.groups?.map(g => g.id) || [],
        reason_for_change: '',
        admin_password: '',
    });
  }, [user, reset]);

  const onSubmit = (data: any) => {
    const dataToSubmit = { ...data, id: user?.id };
    if (!dataToSubmit.password) {
      delete dataToSubmit.password;
    }
    delete dataToSubmit.confirmPassword;
    onSave(dataToSubmit);
  };

  const Label = ({ children }: { children: React.ReactNode }) => <label className="block text-sm font-medium text-slate-700">{children}<span className="text-red-500 ml-1">*</span></label>;
  const OptionalLabel = ({ children }: { children: React.ReactNode }) => <label className="block text-sm font-medium text-slate-700">{children}</label>;

  return (
    <div className="bg-white p-6 rounded-lg shadow max-w-2xl mx-auto">
      <h3 className="text-xl font-bold text-slate-800 mb-4">{user ? `Edit User: ${user.username}` : 'Create New User'}</h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Username</Label>
            <input {...register('username', { required: 'Username is required' })} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm" disabled={!!user} />
            <FormError>{errors.username?.message as React.ReactNode}</FormError>
          </div>
          <div>
            <OptionalLabel>Email</OptionalLabel>
            <input type="email" {...register('email')} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm" />
            <FormError>{errors.email?.message as React.ReactNode}</FormError>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <OptionalLabel>First Name</OptionalLabel>
            <input {...register('first_name')} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm" />
          </div>
          <div>
            <OptionalLabel>Last Name</OptionalLabel>
            <input {...register('last_name')} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Password</Label>
            <input type="password" {...register('password', { required: !user })} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm" placeholder={user ? "Leave blank to keep current" : ""} />
            <FormError>{errors.password?.message as React.ReactNode}</FormError>
          </div>
          <div>
            <Label>Confirm Password</Label>
            <input type="password" {...register('confirmPassword', { required: !user || !!password, validate: value => value === password || 'Passwords do not match' })} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm" placeholder={user ? "Leave blank to keep current" : ""} />
            <FormError>{errors.confirmPassword?.message as React.ReactNode}</FormError>
          </div>
        </div>

        <div>
          <Label>Roles / Groups</Label>
          <Controller name="groups" control={control} rules={{ required: "At least one role must be selected." }} render={({ field }) => ( <select {...field} multiple className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm h-32" onChange={e => { const selectedOptions = Array.from(e.target.selectedOptions, option => parseInt(option.value)); field.onChange(selectedOptions); }} > {allGroups.map(group => (<option key={group.id} value={group.id}>{group.name}</option>))} </select> )}/>
          <p className="text-xs text-slate-500 mt-1">Hold Ctrl (or Cmd on Mac) to select multiple roles.</p>
          <FormError>{errors.groups?.message as React.ReactNode}</FormError>
        </div>

        <div>
          <Label>Reason for Change</Label>
          <input {...register('reason_for_change', { required: 'A reason for this change is mandatory.' })} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm" />
          <FormError>{errors.reason_for_change?.message as React.ReactNode}</FormError>
        </div>

        <div>
          <Label>Confirm with Your Password</Label>
          <input type="password" {...register('admin_password', { required: 'Your password is required to confirm this change.' })} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm" />
          <FormError>{errors.admin_password?.message as React.ReactNode}</FormError>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save User'}
          </Button>
        </div>
      </form>
    </div>
  );
}
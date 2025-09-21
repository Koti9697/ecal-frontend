// In src/screens/SystemSettingsScreen.tsx

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useApi } from '../hooks/useApi';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FormError } from '../components/ui/FormError';
import toast from 'react-hot-toast';

import { UserPolicies } from '../components/Settings/UserPolicies';
import { PasswordPolicy } from '../components/Settings/PasswordPolicy';
import { SessionManagement } from '../components/Settings/SessionManagement';
import { Localization } from '../components/Settings/Localization';
import type { SystemSettings } from '../types/models';

type SettingsTab = 'userPolicies' | 'passwordPolicy' | 'session' | 'localization';

interface SettingsFormInputs extends SystemSettings {
  admin_password?: string;
  reason?: string;
}

export function SystemSettingsScreen() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('userPolicies');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormInputs>();
  const api = useApi();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api('/system-settings/');
        reset(data);
      } catch (error) {
        toast.error('Failed to load system settings.');
      }
    };
    fetchSettings();
  }, [api, reset]);

  const onSubmit = async (data: SettingsFormInputs) => {
    try {
      await api('/system-settings/update-settings/', { method: 'PUT', data });
      toast.success('System settings updated successfully!');
      setValue('admin_password', '');
      setValue('reason', '');
    } catch (err: any) {
      toast.error(`Update failed: ${err.data?.detail || 'An error occurred.'}`);
    }
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'userPolicies':
        return <UserPolicies register={register} />;
      case 'passwordPolicy':
        return <PasswordPolicy register={register} setValue={setValue} watch={watch} />;
      case 'session':
        return <SessionManagement register={register} />;
      case 'localization':
        return <Localization register={register} />;
      default:
        return null;
    }
  };

  return (
    <div>
      <h3 className="text-2xl font-bold text-slate-800 mb-2">System Settings</h3>
      <div className="border-b border-slate-300 mb-6">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <button onClick={() => setActiveTab('userPolicies')} className={`tab-btn ${activeTab === 'userPolicies' ? 'active' : ''}`}>User Policies</button>
          <button onClick={() => setActiveTab('passwordPolicy')} className={`tab-btn ${activeTab === 'passwordPolicy' ? 'active' : ''}`}>Password Policy</button>
          <button onClick={() => setActiveTab('session')} className={`tab-btn ${activeTab === 'session' ? 'active' : ''}`}>Session Management</button>
          <button onClick={() => setActiveTab('localization')} className={`tab-btn ${activeTab === 'localization' ? 'active' : ''}`}>Localization</button>
        </nav>
      </div>

      <form onSubmit={handleSubmit(onSubmit as any)}>
        <Card title="Configure System-Wide Policies">
            {renderActiveTab()}

            <div className="pt-8 mt-8 border-t border-slate-200 space-y-4">
              <h4 className="text-lg font-semibold text-slate-800">Confirm Changes</h4>
              <p className="text-sm text-slate-600">To save changes, confirm with your password and provide a reason. This action will be recorded in the system-wide audit trail.</p>
              <div>
                <label className="block text-sm font-medium text-slate-700">Confirm with Your Password <span className="text-red-500">*</span></label>
                <input type="password" {...register('admin_password', { required: "Your password is required." })} className="mt-1 block w-full md:w-1/2 px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm"/>
                <FormError>{errors.admin_password?.message}</FormError>
              </div>
               <div>
                <label className="block text-sm font-medium text-slate-700">Reason for Change <span className="text-red-500">*</span></label>
                <input type="text" {...register('reason', { required: "A reason is mandatory." })} className="mt-1 block w-full md:w-1/2 px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm"/>
                <FormError>{errors.reason?.message}</FormError>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save All Settings'}</Button>
            </div>
        </Card>
      </form>
    </div>
  );
}
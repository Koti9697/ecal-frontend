import React from 'react';
import type { UseFormRegister } from 'react-hook-form';
import { ToggleSwitch } from '../ui/ToggleSwitch';

// (Helper components are unchanged)
const FieldWrapper = ({ children }: { children: React.ReactNode }) => <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 py-4">{children}</div>;
const NumberField = ({ label, name, unit, register }: { label: string; name: any; unit: string; register: UseFormRegister<any> }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="mt-1 flex items-center">
        <input type="number" {...register(name, { required: true, valueAsNumber: true, min: 1 })} className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
        <span className="ml-3 text-sm text-slate-500">{unit}</span>
      </div>
    </div>
);

interface SessionManagementProps {
  register: UseFormRegister<any>;
}

// --- THIS IS THE FIX: Added the 'export' keyword ---
export function SessionManagement({ register }: SessionManagementProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">Control user session duration and authentication requirements.</p>
      <FieldWrapper>
          <NumberField label="Session Timeout" name="session_timeout_minutes" unit="minutes" register={register} />
          <ToggleSwitch label="Enforce Single User Session" registration={register('enforce_single_user_session')} />
          <ToggleSwitch label="Require Re-authentication After Timeout" registration={register('session_require_relogin')} />
      </FieldWrapper>
    </div>
  );
}
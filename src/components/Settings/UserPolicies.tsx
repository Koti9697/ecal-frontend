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

interface UserPoliciesProps {
  register: UseFormRegister<any>;
}

// --- THIS IS THE FIX: Added the 'export' keyword ---
export function UserPolicies({ register }: UserPoliciesProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">Define the rules and constraints for usernames across the application.</p>
      <FieldWrapper>
        <ToggleSwitch label="Enforce Unique Usernames" registration={register('enforce_unique_username')} />
        <ToggleSwitch label="Force Usernames to Lowercase" registration={register('username_force_lowercase')} />
        <NumberField label="Minimum Username Length" name="username_min_length" unit="characters" register={register} />
        <NumberField label="Maximum Username Length" name="username_max_length" unit="characters" register={register} />
        <ToggleSwitch label="Allow Capital Letters" registration={register('username_allow_capitals')} />
        <ToggleSwitch label="Allow Numbers" registration={register('username_allow_numbers')} />
        <ToggleSwitch label="Allow Users to Close Own Account" registration={register('allow_user_account_closure')} />
      </FieldWrapper>
    </div>
  );
}
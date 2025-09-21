// In src/components/Settings/PasswordPolicy.tsx

import React, { useEffect, useState, useRef } from 'react';
import type { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { ToggleSwitch } from '../ui/ToggleSwitch';

// Helper components
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

interface PasswordPolicyProps {
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
}

export function PasswordPolicy({ register, setValue, watch }: PasswordPolicyProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // --- THIS IS THE FIX ---
  // The logic has been re-engineered to prevent an infinite loop.

  // 1. Use local state for the toggles, which are the primary user interface.
  const [reqLower, setReqLower] = useState(true);
  const [reqUpper, setReqUpper] = useState(true);
  const [reqNumber, setReqNumber] = useState(true);
  const [reqSpecial, setReqSpecial] = useState(true);

  // 2. Watch the regex field from the form data.
  const currentRegex = watch('password_complexity_regex');
  const hasInitialized = useRef(false);

  // 3. This effect runs ONLY ONCE when the form data first arrives.
  // It parses the regex from the server to set the initial state of our toggles.
  useEffect(() => {
    if (currentRegex && !hasInitialized.current) {
      setReqLower(currentRegex.includes("(?=.*[a-z])"));
      setReqUpper(currentRegex.includes("(?=.*[A-Z])"));
      setReqNumber(currentRegex.includes("(?=.*\\d)"));
      setReqSpecial(currentRegex.includes("(?=.*[\\W_])"));
      hasInitialized.current = true;
    }
  }, [currentRegex]);

  // 4. This effect watches for changes in our local toggle states.
  // When a toggle changes, it rebuilds the regex and updates the form data.
  // This does NOT create a loop because it's not dependent on `currentRegex`.
  useEffect(() => {
    // We only run this logic after the initial state has been set from the server data.
    if (hasInitialized.current) {
      const parts = [
        reqLower ? "(?=.*[a-z])" : "",
        reqUpper ? "(?=.*[A-Z])" : "",
        reqNumber ? "(?=.*\\d)" : "",
        reqSpecial ? "(?=.*[\\W_])" : "",
      ].filter(Boolean);

      // A simple regex to ensure the string is not empty.
      const newRegex = `^${parts.join("")}.+$`;
      setValue('password_complexity_regex', newRegex, { shouldDirty: true });
    }
  }, [reqLower, reqUpper, reqNumber, reqSpecial, setValue]);


  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">Configure password complexity, expiry, and lockout rules to enforce security.</p>

      <div className="py-4 space-y-4">
        <h4 className="text-md font-semibold text-slate-800">Password Complexity</h4>
        <ToggleSwitch label="Require Lowercase Letter" isChecked={reqLower} onToggle={() => setReqLower(prev => !prev)} />
        <ToggleSwitch label="Require Uppercase Letter" isChecked={reqUpper} onToggle={() => setReqUpper(prev => !prev)} />
        <ToggleSwitch label="Require Number" isChecked={reqNumber} onToggle={() => setReqNumber(prev => !prev)} />
        <ToggleSwitch label="Require Special Character" isChecked={reqSpecial} onToggle={() => setReqSpecial(prev => !prev)} />
      </div>

      <div className="py-2">
        <a href="#" onClick={(e) => { e.preventDefault(); setShowAdvanced(!showAdvanced); }} className="text-sm text-blue-600 hover:underline">
          {showAdvanced ? 'Hide' : 'Show'} Advanced Regex Editor
        </a>
        {showAdvanced && (
          <div className="mt-2">
            <label className="block text-sm font-medium text-slate-700">Password Complexity Regex</label>
            <input
              type="text"
              {...register('password_complexity_regex')}
              className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm font-mono"
              readOnly
            />
            <p className="mt-2 text-xs text-slate-500">
              This field is automatically updated by the toggles above.
            </p>
          </div>
        )}
      </div>

      <FieldWrapper>
          <NumberField label="Minimum Password Length" name="password_min_length" unit="characters" register={register} />
          <NumberField label="Maximum Password Length" name="password_max_length" unit="characters" register={register} />
          <ToggleSwitch label="Block Password if it Contains Username" registration={register('password_prevent_username_sequence')} />
          <NumberField label="Enforce Password History" name="password_history_count" unit="previous passwords" register={register}/>
          <NumberField label="Password Expiry" name="password_expiry_days" unit="days" register={register}/>
          <NumberField label="Max Invalid Login Attempts" name="password_lockout_attempts" unit="attempts" register={register}/>
          <ToggleSwitch label="Administrator Only Can Unlock Users" registration={register('admin_only_unlock')} />
          <NumberField label="Deactivate Idle Users After" name="deactivate_idle_user_days" unit="days" register={register}/>
      </FieldWrapper>
    </div>
  );
}
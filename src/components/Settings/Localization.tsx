import React from 'react';
import type { UseFormRegister } from 'react-hook-form';

// (Helper components are unchanged)
const FieldWrapper = ({ children }: { children: React.ReactNode }) => <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 py-4">{children}</div>;
const SelectField = ({ label, name, options, register }: {label: string; name: any; options: {value: string; label: string}[], register: UseFormRegister<any>}) => (
     <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <select {...register(name)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
);

interface LocalizationProps {
  register: UseFormRegister<any>;
}

// --- THIS IS THE FIX: Added the 'export' keyword ---
export function Localization({ register }: LocalizationProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">Set default formats and language for the entire application.</p>
      <FieldWrapper>
          <SelectField label="Time Zone" name="time_zone" register={register} options={[{value: 'UTC', label: 'UTC'}, {value: 'America/New_York', label: 'America/New_York (EST)'}, {value: 'Europe/London', label: 'Europe/London (GMT)'}, {value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)'}]} />
          <SelectField label="Date Format" name="date_format" register={register} options={[{value: 'YYYY-MM-DD', label: 'YYYY-MM-DD'}, {value: 'DD-MMM-YYYY', label: 'DD-MMM-YYYY'}, {value: 'MM/DD/YYYY', label: 'MM/DD/YYYY'}]} />
          <SelectField label="Time Format" name="time_format" register={register} options={[{value: '24_HOUR', label: '24-Hour (HH:mm)'}, {value: '12_HOUR', label: '12-Hour (hh:mm A)'}]} />
          <SelectField label="Default Language" name="language_default" register={register} options={[{value: 'en', label: 'English'}, {value: 'de', label: 'German'}, {value: 'fr', label: 'French'}]} />
      </FieldWrapper>
    </div>
  );
}
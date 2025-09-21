// In src/components/ui/ToggleSwitch.tsx

import React from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

interface ToggleSwitchProps {
  label: string;
  registration?: UseFormRegisterReturn;
  isChecked?: boolean;
  onToggle?: () => void;
}

export function ToggleSwitch({ label, registration, isChecked, onToggle }: ToggleSwitchProps) {
  const isControlled = isChecked !== undefined && onToggle !== undefined;

  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="relative">
        <input 
          type="checkbox" 
          className="sr-only" 
          {...(isControlled ? {} : registration)}
          checked={isControlled ? isChecked : undefined}
          onChange={isControlled ? onToggle : undefined}
        />
        <div className="block bg-slate-200 w-14 h-8 rounded-full"></div>
        <div className="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform"></div>
      </div>
      <style>{`
        input:checked ~ .dot {
          transform: translateX(100%);
        }
        input:checked ~ .block {
            background-color: #2563eb; /* blue-600 */
        }
      `}</style>
    </label>
  );
}
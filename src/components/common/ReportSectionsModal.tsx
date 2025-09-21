// In src/components/common/ReportSectionsModal.tsx

import React, { useState } from 'react';
import { Button } from '../ui/Button';

interface ReportSectionsModalProps {
  isOpen: boolean;
  onConfirm: (selectedSections: string[]) => void;
  onCancel: () => void;
  title: string;
  availableSections: string[];
}

export function ReportSectionsModal({
  isOpen,
  onConfirm,
  onCancel,
  title,
  availableSections,
}: ReportSectionsModalProps) {
  if (!isOpen) return null;

  // By default, all sections are selected
  const [selected, setSelected] = useState<string[]>(availableSections);

  const handleCheckboxChange = (section: string) => {
    setSelected(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleConfirm = () => {
    onConfirm(selected);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">{title}</h3>
        <p className="text-sm text-slate-600 mb-4">Select the sections you want to include in the PDF report.</p>
        <div className="space-y-2">
          {availableSections.map(section => (
            <label key={section} className="flex items-center space-x-3 p-2 rounded-md hover:bg-slate-50">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={selected.includes(section)}
                onChange={() => handleCheckboxChange(section)}
              />
              <span className="text-sm font-medium text-slate-700">{section}</span>
            </label>
          ))}
        </div>
        <div className="mt-6 flex justify-end space-x-2">
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleConfirm}>Generate Report</Button>
        </div>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';

interface PasswordModalProps {
  isOpen: boolean;
  onConfirm: (data: { password: string; reason: string; meaning?: string }) => void;
  onCancel: () => void;
  title: string;
  actionText: string;
  isReasonRequired?: boolean;
  hidePasswordField?: boolean;
  // --- NEW: Props for the 'Meaning' dropdown ---
  showMeaningField?: boolean;
  meaningOptions?: string[];
}

export function PasswordModal({ 
    isOpen, 
    onConfirm, 
    onCancel, 
    title, 
    actionText,
    isReasonRequired = false,
    hidePasswordField = false,
    showMeaningField = false,
    meaningOptions = []
}: PasswordModalProps) {
    if (!isOpen) return null;

    const [password, setPassword] = useState('');
    const [reason, setReason] = useState('');
    const [meaning, setMeaning] = useState(meaningOptions[0] || '');

    const handleConfirm = () => {
        if (!hidePasswordField && !password) {
            toast.error('Your password is required to confirm this action.');
            return;
        }
        if (isReasonRequired && !reason) {
            toast.error('A reason is required to confirm this action.');
            return;
        }
        if (showMeaningField && !meaning) {
            toast.error('A meaning for the signature is required.');
            return;
        }
        onConfirm({ password, reason, meaning });
        setPassword('');
        setReason('');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-bold mb-4">{title}</h3>
                <div className="space-y-4">
                    {showMeaningField && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Meaning of Signature <span className="text-red-500">*</span></label>
                            <select value={meaning} onChange={e => setMeaning(e.target.value)} className="mt-1 block w-full input-style">
                                {meaningOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                    )}
                    {!hidePasswordField && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Confirm with Password <span className="text-red-500">*</span></label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full input-style" autoFocus />
                        </div>
                    )}
                    {isReasonRequired && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Reason for Action <span className="text-red-500">*</span></label>
                            <textarea value={reason} onChange={e => setReason(e.target.value)} className="mt-1 block w-full input-style h-24" />
                        </div>
                    )}
                </div>
                <div className="mt-6 flex justify-end space-x-2">
                    <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                    <Button onClick={handleConfirm}>{actionText}</Button>
                </div>
            </div>
        </div>
    );
}
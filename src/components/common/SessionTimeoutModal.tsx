// In src/components/common/SessionTimeoutModal.tsx

import { Button } from '../ui/Button';

interface SessionTimeoutModalProps {
  isOpen: boolean;
  onExtend: () => void;
  onLogout: () => void;
}

export function SessionTimeoutModal({ isOpen, onExtend, onLogout }: SessionTimeoutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md text-center">
        <h3 className="text-xl font-bold mb-4">Session Timeout Warning</h3>
        <p className="text-slate-600 mb-6">
          Your session is about to expire due to inactivity. Would you like to extend your session?
        </p>
        <div className="flex justify-center space-x-4">
          <Button variant="secondary" onClick={onLogout}>
            Logout
          </Button>
          <Button onClick={onExtend}>
            Extend Session
          </Button>
        </div>
      </div>
    </div>
  );
}
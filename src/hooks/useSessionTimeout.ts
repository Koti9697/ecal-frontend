// In src/hooks/useSessionTimeout.ts

import { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logOut } from '../store/authSlice';
import { type RootState } from '../store/store';

const WARNING_MINUTES = 2;   // Show warning modal 2 minutes before timeout

let timeoutId: NodeJS.Timeout;
let warningTimeoutId: NodeJS.Timeout;

export function useSessionTimeout() {
  const dispatch = useAppDispatch();
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  
  // --- MODIFIED: Get the timeout from Redux store ---
  const sessionTimeoutMinutes = useAppSelector((state: RootState) => state.auth.settings?.session_timeout_minutes || 15);

  const handleLogout = useCallback(() => {
    dispatch(logOut());
    setIsWarningModalOpen(false);
  }, [dispatch]);

  const resetTimers = useCallback(() => {
    clearTimeout(timeoutId);
    clearTimeout(warningTimeoutId);

    const sessionTimeoutMs = sessionTimeoutMinutes * 60 * 1000;
    const warningTimeMs = WARNING_MINUTES * 60 * 1000;

    if (sessionTimeoutMs > warningTimeMs) {
        warningTimeoutId = setTimeout(() => {
          setIsWarningModalOpen(true);
        }, sessionTimeoutMs - warningTimeMs);
    }

    timeoutId = setTimeout(handleLogout, sessionTimeoutMs);
  }, [handleLogout, sessionTimeoutMinutes]);

  const extendSession = () => {
    setIsWarningModalOpen(false);
    resetTimers();
  };

  useEffect(() => {
    const events = ['load', 'mousemove', 'mousedown', 'click', 'scroll', 'keypress'];

    const eventListener = () => {
      resetTimers();
    };

    events.forEach(event => {
      window.addEventListener(event, eventListener);
    });

    resetTimers(); // Initial setup

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, eventListener);
      });
      clearTimeout(timeoutId);
      clearTimeout(warningTimeoutId);
    };
  }, [resetTimers]);

  return { isWarningModalOpen, extendSession, handleLogout };
}
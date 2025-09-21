// In src/screens/MainApp.tsx

import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Sidebar } from '../components/common/Sidebar';
import { Dashboard } from './Dashboard';
import { SystemAdministration } from './SystemAdministration';
import { TemplateScreen } from './TemplateScreen';
import { TemplateAdministration } from './TemplateAdministration';
import { RecordScreen } from './RecordScreen';
import { AuditTrailScreen } from './AuditTrailScreen';
import { SessionTimeoutModal } from '../components/common/SessionTimeoutModal';
import { useSessionTimeout } from '../hooks/useSessionTimeout';
import { SystemSettingsScreen } from './SystemSettingsScreen';
import { RecordListScreen } from './RecordListScreen';
import { TemplateVerificationScreen } from './TemplateVerificationScreen';
import { MyProfileScreen } from './MyProfileScreen';
import { useApi } from '../hooks/useApi';
import { useAppDispatch } from '../store/hooks';
import { setSettings } from '../store/authSlice';
import { ReportingScreen } from './ReportingScreen';

type ViewState =
  | { view: 'dashboard' } | { view: 'templates' } | { view: 'template-admin' }
  | { view: 'admin' } | { view: 'audit-trail' } | { view: 'system-settings' }
  | { view: 'records' }
  | { view: 'reporting' }
  | { view: 'record', recordId?: number, template?: any }
  | { view: 'my-profile' }
  | { view: 'template-verification', template: any };

export function MainApp() {
    const [currentView, setCurrentView] = useState<ViewState>({ view: 'dashboard' });
    const { isWarningModalOpen, extendSession, handleLogout } = useSessionTimeout();
    const api = useApi();
    const dispatch = useAppDispatch();

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const settingsData = await api('/system-settings/');
                dispatch(setSettings(settingsData));
            } catch (error) {
                console.error("Failed to fetch system settings:", error);
            }
        };
        fetchSettings();
    }, [api, dispatch]);

    const renderView = () => {
        switch (currentView.view) {
            case 'dashboard': return <Dashboard />;
            case 'templates': return <TemplateScreen onNavigateToRecord={(template) => setCurrentView({ view: 'record', template })} />;
            case 'template-admin': return <TemplateAdministration onNavigateToVerify={(template) => setCurrentView({ view: 'template-verification', template })} />;
            case 'admin': return <SystemAdministration />;
            case 'audit-trail': return <AuditTrailScreen />;
            case 'system-settings': return <SystemSettingsScreen />;
            case 'records': return <RecordListScreen onNavigateToRecord={(recordId) => setCurrentView({ view: 'record', recordId })} />;
            case 'reporting': return <ReportingScreen />;
            case 'record': return <RecordScreen recordId={currentView.recordId} template={currentView.template} onBack={() => setCurrentView({ view: 'records' })} />;
            case 'template-verification': return <TemplateVerificationScreen template={currentView.template} onBack={() => setCurrentView({ view: 'template-admin' })} />;
            case 'my-profile': return <MyProfileScreen />;
            default: return <Dashboard />;
        }
    };

    return (
        <div className="flex h-screen bg-slate-100">
            <Toaster position="top-right" reverseOrder={false} />
            <SessionTimeoutModal isOpen={isWarningModalOpen} onExtend={extendSession} onLogout={handleLogout} />
            <Sidebar activeItem={currentView.view} onViewChange={(viewKey) => setCurrentView({ view: viewKey } as ViewState)} />
            <main className="flex-1 p-6 overflow-y-auto">{renderView()}</main>
        </div>
    );
}
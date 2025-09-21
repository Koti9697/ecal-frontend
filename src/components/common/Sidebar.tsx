// In src/components/common/Sidebar.tsx

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logOut } from '../../store/authSlice';
import { useHasPrivilege } from '../../hooks/useHasPrivilege';

interface SidebarProps {
  activeItem: string;
  onViewChange: (view: string) => void;
}

const navConfig = {
    'dashboard': ['VIEW_ALL_RECORDS_TEMPLATES'],
    'templates': ['CREATE_EDIT_DRAFT_RECORDS'],
    'records': ['VIEW_ALL_RECORDS_TEMPLATES'], 
    'reporting': ['GENERATE_REPORTS_FOR_RECORDS'],
    'template-admin': ['MANAGE_TEMPLATES', 'PERFORM_REVIEW', 'PERFORM_APPROVAL'],
    'audit-trail': ['VIEW_SYSTEM_WIDE_AUDIT_TRAIL'],
    'admin': ['MANAGE_USERS_AND_ROLES'],
    'system-settings': ['MANAGE_SYSTEM_SETTINGS'],
};

const navItems = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'templates', label: 'Create Record' },
    { key: 'records', label: 'View Records' },
    { key: 'reporting', label: 'Reporting' },
    { key: 'template-admin', label: 'Template Admin' },
    { key: 'system-settings', label: 'System Settings' },
    { key: 'admin', label: 'User Administration' },
    { key: 'audit-trail', label: 'Audit Trail' },
];

export function Sidebar({ activeItem, onViewChange }: SidebarProps) {
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);
    
    const visibleNavItems = navItems.filter(item => {
        const requiredPrivileges = navConfig[item.key];
        if (!requiredPrivileges) return true;
        if (!user || !Array.isArray(user.privileges)) return false;
        return user.privileges.some(userPriv => requiredPrivileges.includes(userPriv));
    });
    
    const handleLogout = () => {
        dispatch(logOut());
    };

    return (
        <div className="w-64 bg-slate-800 text-slate-100 flex flex-col">
            <div className="p-4 border-b border-slate-700">
                <h2 className="text-2xl font-bold">CalJar</h2>
            </div>
            <nav className="flex-1 p-2 space-y-2">
                {visibleNavItems.map(item => (
                    <a href="#" key={item.key} onClick={(e) => { e.preventDefault(); onViewChange(item.key); }} className={`block px-4 py-2 rounded-md ${activeItem === item.key ? 'active' : ''}`}>
                        {item.label}
                    </a>
                ))}
            </nav>
            <div className="p-4 border-t border-slate-700">
                <a href="#" onClick={(e) => { e.preventDefault(); onViewChange('my-profile'); }} className="text-sm text-blue-400 hover:underline">My Profile</a>
                <p className="text-sm mt-2">Logged in as:</p>
                <p className="font-bold">{user?.username}</p>
                <button onClick={handleLogout} className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                    Logout
                </button>
            </div>
        </div>
    );
}
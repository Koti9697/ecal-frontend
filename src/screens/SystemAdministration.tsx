import { useState } from 'react';
import { UserList } from '../components/admin/UserList';
import { RoleManagement } from '../components/admin/RoleManagement';
import { Card } from '../components/ui/Card';

export function SystemAdministration() {
    const [activeTab, setActiveTab] = useState('users');

    const cardTitle = activeTab === 'users' ? 'User Accounts' : 'Roles & Privileges';

    return (
        <div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">System Administration</h3>
            <div className="border-b border-slate-300 mb-6">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button onClick={() => setActiveTab('users')} className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}>Users</button>
                    <button onClick={() => setActiveTab('roles')} className={`tab-btn ${activeTab === 'roles' ? 'active' : ''}`}>Roles & Privileges</button>
                </nav>
            </div>
            
            <Card title={cardTitle}>
                {activeTab === 'users' && <UserList />}
                {activeTab === 'roles' && <RoleManagement />}
            </Card>
        </div>
    );
}
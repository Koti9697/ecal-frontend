// --- 1. IMPORT THE NEW CARD COMPONENT ---
import { Card } from '../components/ui/Card';

export function Dashboard() {
    return (
        <div>
            <h3 className="text-2xl font-bold text-slate-800 mb-4">Dashboard</h3>
            
            {/* --- 2. USE THE CARD TO WRAP THE CONTENT --- */}
            <Card title="Welcome to CalJar">
                <p className="text-slate-600">
                    This is the central management system for all your GxP-regulated analytical calculations.
                    Use the navigation menu on the left to create new records, manage templates, or administer the system.
                </p>
            </Card>
        </div>
    );
}


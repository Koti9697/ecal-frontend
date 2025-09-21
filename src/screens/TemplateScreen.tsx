// In src/screens/TemplateScreen.tsx

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { Card } from '../components/ui/Card';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';
import { useDateFormatter } from '../hooks/useDateFormatter';
import toast from 'react-hot-toast';

interface Template {
  id: number;
  template_id: string;
  name: string;
  version: string;
  status: string;
  approved_at: string | null;
  document_data?: any; // Add this optional property
}

interface TemplateScreenProps {
  onNavigateToRecord: (template: Template) => void;
}

export function TemplateScreen({ onNavigateToRecord }: TemplateScreenProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState<number | null>(null); // To show loading state on button
  const [filterText, setFilterText] = useState('');
  const api = useApi();
  const formatDate = useDateFormatter();

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api('/templates/');
      const approvedTemplates = data.filter(
        (template: Template) => template.status === 'APPROVED'
      );
      setTemplates(approvedTemplates);
    } catch (err) {
      toast.error('Failed to load templates.');
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const filteredTemplates = useMemo(() => {
    const searchText = filterText.toLowerCase();
    if (!searchText) {
      return templates;
    }
    return templates.filter(template =>
      template.name.toLowerCase().includes(searchText) ||
      template.template_id.toLowerCase().includes(searchText) ||
      template.version.toLowerCase().includes(searchText)
    );
  }, [templates, filterText]);

  // --- THIS IS THE FIX ---
  // This function now fetches the full template details before navigating.
  const handleCreateRecord = async (templateId: number) => {
    setIsNavigating(templateId);
    try {
      // Fetch the full template object which includes document_data
      const fullTemplate = await api(`/templates/${templateId}/`);
      onNavigateToRecord(fullTemplate);
    } catch (err) {
      toast.error("Failed to load template details for record creation.");
    } finally {
      setIsNavigating(null);
    }
  };

  if (isLoading) {
    return <div className="p-6"><SkeletonLoader rows={10} cols={5}/></div>;
  }

  return (
    <div>
      <h3 className="text-2xl font-bold text-slate-800 mb-4">Create a New Record</h3>
      <p className="text-slate-600 mb-6">Select an approved template to begin data entry.</p>

      <Card title="Available Templates">
        <div className="p-4 bg-slate-50 border-b">
          <input
            type="text"
            placeholder="Filter by Template ID, Name, or Version..."
            className="input-style w-full"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Template ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Template Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Version</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Approval Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredTemplates.length > 0 ? (
                filteredTemplates.map(template => (
                  <tr key={template.id}>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{template.template_id}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{template.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{template.version}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{template.approved_at ? formatDate(template.approved_at) : 'N/A'}</td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <button
                        onClick={() => handleCreateRecord(template.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-75"
                        disabled={isNavigating === template.id}
                      >
                        {isNavigating === template.id ? 'Loading...' : 'Create Record'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-slate-500">No approved templates found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
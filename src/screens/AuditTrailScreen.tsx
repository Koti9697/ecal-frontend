import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useApi } from '../hooks/useApi';
import { useDateFormatter } from '../hooks/useDateFormatter';

interface AuditLog {
  id: number;
  timestamp: string;
  user: {
    username: string;
  };
  action: string;
  details: string;
  reason_for_change: string;
  previous_value: string;
  new_value: string;
}

type FilterFormInputs = {
  user: string;
  action: string;
  details: string;
  start_date: string;
  end_date: string;
};

export function AuditTrailScreen() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const api = useApi();
  const { register, handleSubmit, reset } = useForm<FilterFormInputs>();
  const formatDate = useDateFormatter();

  const fetchLogs = async (filters: Partial<FilterFormInputs> = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filters.user) params.append('user', filters.user);
      if (filters.action) params.append('action', filters.action);
      if (filters.details) params.append('details', filters.details);
      if (filters.start_date) params.append('timestamp_after', filters.start_date);
      if (filters.end_date) params.append('timestamp_before', filters.end_date);
      
      const data = await api(`/auditlogs/?${params.toString()}`);
      setLogs(data);
    } catch (err) {
      setError('Failed to load audit trail.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const onFilterSubmit = (data: FilterFormInputs) => {
    fetchLogs(data);
  };

  const clearFilters = () => {
    reset({ user: '', action: '', details: '', start_date: '', end_date: '' });
    fetchLogs();
  }

  return (
    <div>
      <h3 className="text-2xl font-bold text-slate-800 mb-4">System-Wide Audit Trail</h3>
      
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <form onSubmit={handleSubmit(onFilterSubmit)} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
          <div className="col-span-1"><label className="text-sm font-medium">Username</label><input {...register('user')} className="mt-1 w-full border border-slate-300 rounded-md p-2" /></div>
          <div className="col-span-1"><label className="text-sm font-medium">Action</label><input {...register('action')} className="mt-1 w-full border border-slate-300 rounded-md p-2" /></div>
          <div className="col-span-2"><label className="text-sm font-medium">Details Contain</label><input {...register('details')} className="mt-1 w-full border border-slate-300 rounded-md p-2" /></div>
          <div className="col-span-1"><label className="text-sm font-medium">Date From</label><input type="date" {...register('start_date')} className="mt-1 w-full border border-slate-300 rounded-md p-2" /></div>
          <div className="col-span-1"><label className="text-sm font-medium">Date To</label><input type="date" {...register('end_date')} className="mt-1 w-full border border-slate-300 rounded-md p-2" /></div>
          <div className="col-span-full flex justify-end space-x-2">
            <button type="button" onClick={clearFilters} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-4 rounded">Clear</button>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Apply Filters</button>
          </div>
        </form>
      </div>

      {isLoading && <div>Loading Audit Trail...</div>}
      {error && <div className="text-red-500">{error}</div>}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Timestamp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Reason for Change</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Previous Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">New Value</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {logs.map(log => (
              <tr key={log.id}>
                <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">{formatDate(log.timestamp)}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{log.user.username}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{log.action}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{log.details}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{log.reason_for_change}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{log.previous_value}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{log.new_value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
// src/screens/ReportingScreen.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AgGridReact } from 'ag-grid-react';
import { type ColDef } from 'ag-grid-community';
import { useDateFormatter } from '../hooks/useDateFormatter';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ReportRow {
  id: number;
  record_id_display: string;
  status: string;
  created_at: string;
  template_name: string;
  template_version: string;
  created_by_username: string;
}

export function ReportingScreen() {
  const [rowData, setRowData] = useState<ReportRow[]>([]);
  const [filters, setFilters] = useState({
    status: '',
    template: '',
    created_after: '',
    created_before: '',
  });
  const api = useApi();
  const gridRef = useRef<AgGridReact>(null);
  const formatDate = useDateFormatter();

  const fetchReportData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.template) params.append('template', filters.template);
      if (filters.created_after) params.append('created_after', filters.created_after);
      if (filters.created_before) params.append('created_before', filters.created_before);
      
      const data = await api(`/reports/records/?${params.toString()}`);
      setRowData(data);
    } catch (error) {
      toast.error('Failed to fetch report data.');
    }
  }, [api, filters]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };
  
  const clearFilters = () => {
    setFilters({ status: '', template: '', created_after: '', created_before: '' });
  };

  const columnDefs: ColDef[] = [
    { field: 'record_id_display', headerName: 'Record ID', sortable: true, filter: true },
    { field: 'template_name', headerName: 'Template', sortable: true, filter: true },
    { field: 'template_version', headerName: 'Version', sortable: true, filter: true },
    { field: 'status', headerName: 'Status', sortable: true, filter: true },
    { field: 'created_by_username', headerName: 'Created By', sortable: true, filter: true },
    { field: 'created_at', headerName: 'Created Date', valueFormatter: p => formatDate(p.value), sortable: true, filter: 'agDateColumnFilter' },
  ];

  const exportToCsv = () => {
    gridRef.current?.api.exportDataAsCsv();
  };
  
  const exportToPdf = () => {
    const doc = new jsPDF();
    const tableData = rowData.map(row => [
        row.record_id_display,
        row.template_name,
        row.template_version,
        row.status,
        row.created_by_username,
        formatDate(row.created_at)
    ]);

    (doc as any).autoTable({
        head: [['Record ID', 'Template', 'Version', 'Status', 'Created By', 'Created Date']],
        body: tableData,
    });
    doc.save('caljar_report.pdf');
  };

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-slate-800">Interactive Reports</h3>
      <Card title="Filter Records">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
                <label className="block text-sm font-medium">Template Name Contains</label>
                <input name="template" value={filters.template} onChange={handleFilterChange} className="input-style"/>
            </div>
            <div>
                <label className="block text-sm font-medium">Status</label>
                <select name="status" value={filters.status} onChange={handleFilterChange} className="input-style">
                    <option value="">All</option>
                    <option value="DRAFT">Draft</option>
                    <option value="SUBMITTED_FOR_REVIEW">In Review</option>
                    <option value="REVIEWED">Reviewed</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="CANCELLED">Cancelled</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium">Created After</label>
                <input type="date" name="created_after" value={filters.created_after} onChange={handleFilterChange} className="input-style"/>
            </div>
             <div>
                <label className="block text-sm font-medium">Created Before</label>
                <input type="date" name="created_before" value={filters.created_before} onChange={handleFilterChange} className="input-style"/>
            </div>
        </div>
        <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
            <Button variant="secondary" onClick={clearFilters}>Clear Filters</Button>
            <Button onClick={fetchReportData}>Apply Filters</Button>
        </div>
      </Card>
      
      <Card title="Report Data">
        <div className="flex justify-end space-x-2 mb-4">
            <Button variant="secondary" onClick={exportToCsv}>Export to CSV</Button>
            <Button variant="secondary" onClick={exportToPdf}>Export to PDF</Button>
        </div>
        <div className="ag-theme-alpine" style={{ height: '600px', width: '100%' }}>
            <AgGridReact
                ref={gridRef}
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={{
                    resizable: true,
                    floatingFilter: true,
                }}
            />
        </div>
      </Card>
    </div>
  );
}
import React, { useState, useMemo } from 'react';
import { useCRM } from '../../../context/CRMContext';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Drawer } from '../../ui/Drawer';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import {
  Search,
  Plus,
  Filter,
  Columns,
  Download,
  RotateCw,
  Trash2,
  UserCheck,
  MoreVertical,
  Check,
  X,
  ChevronDown,
  ArrowUpDown,
  Eye,
  Edit2
} from 'lucide-react';

export const LeadsView = () => {
  const {
    leads,
    leadsLoading,
    leadsError,
    reloadLeads,
    updatingLeadIds,
    deletingLeadIds,
    setEditingLeadId,
    users,
    viewLead360,
    setIsAddLeadOpen,
    deleteLead,
    bulkUpdateLeads,
    bulkDeleteLeads,
    visibleColumns,
    setVisibleColumns,
    activeSavedView,
    setActiveSavedView,
    addToast
  } = useCRM();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterSource, setFilterSource] = useState('All');
  const [filterOwner, setFilterOwner] = useState('All');
  const [sortBy, setSortBy] = useState('createdAt'); // createdAt, score, expectedValue, name
  const [sortOrder, setSortOrder] = useState('desc');

  // Modals & Drawers
  const [isColumnDrawerOpen, setIsColumnDrawerOpen] = useState(false);
  const [deleteConfirmLeadId, setDeleteConfirmLeadId] = useState(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    return {
      total: leads.length,
      newCount: leads.filter(l => l.status === 'New').length,
      workingCount: leads.filter(l => l.status === 'Working').length,
      qualifiedCount: leads.filter(l => l.status === 'Qualified').length,
      convertedCount: leads.filter(l => l.status === 'Converted').length,
      lostCount: leads.filter(l => l.status === 'Lost').length,
    };
  }, [leads]);

  // Saved View Preset Filters
  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      // Saved view logic
      if (activeSavedView === 'my' && l.ownerName !== 'Arjun Kapoor') return false;
      if (activeSavedView === 'new' && l.status !== 'New') return false;
      if (activeSavedView === 'high_priority' && l.priority !== 'High') return false;
      if (activeSavedView === 'qualified' && l.status !== 'Qualified') return false;
      if (activeSavedView === 'converted' && l.status !== 'Converted') return false;
      if (activeSavedView === 'lost' && l.status !== 'Lost') return false;

      // Filter chips logic
      if (filterStatus !== 'All' && l.status !== filterStatus) return false;
      if (filterPriority !== 'All' && l.priority !== filterPriority) return false;
      if (filterSource !== 'All' && l.source !== filterSource) return false;
      if (filterOwner !== 'All' && l.ownerName !== filterOwner) return false;

      // Search term
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const fullName = `${l.firstName} ${l.lastName}`.toLowerCase();
        const matchName = fullName.includes(q);
        const matchComp = l.company.toLowerCase().includes(q);
        const matchEmail = l.email.toLowerCase().includes(q);
        const matchPhone = l.phone.includes(q);
        if (!matchName && !matchComp && !matchEmail && !matchPhone) return false;
      }

      return true;
    }).sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (sortBy === 'name') {
        valA = `${a.firstName} ${a.lastName}`;
        valB = `${b.firstName} ${b.lastName}`;
      }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [leads, activeSavedView, filterStatus, filterPriority, filterSource, filterOwner, searchTerm, sortBy, sortOrder]);

  // Select all handler
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(filteredLeads.map(l => l.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleRowSelect = (id) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // CSV Export
  const exportCSV = () => {
    const headers = ['ID', 'First Name', 'Last Name', 'Company', 'Email', 'Phone', 'Source', 'Status', 'Priority', 'Expected Value'];
    const rows = filteredLeads.map(l => [
      l.id, l.firstName, l.lastName, `"${l.company}"`, l.email, l.phone, l.source, l.status, l.priority, l.expectedValue
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Leadwise_Leads_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Leads exported as CSV file.');
  };

  return (
    <div className="space-y-4 pb-10">
      
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-400" />
            Leads Management Workspace
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Capture, manage, qualify and convert potential customers.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="md" icon={Download} onClick={exportCSV}>
            Export CSV
          </Button>
          <Button variant="primary" size="md" icon={Plus} onClick={() => {
            setEditingLeadId(null);
            setIsAddLeadOpen(true);
          }}>
            + Add Lead
          </Button>
        </div>
      </div>

      {leadsError && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800" role="alert">
          <span>Unable to load leads from Supabase: {leadsError}</span>
          <Button variant="outline" size="sm" onClick={reloadLeads} loading={leadsLoading}>
            Retry
          </Button>
        </div>
      )}
      {leadsLoading && (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs font-medium text-slate-600" role="status">
          Loading leads...
        </div>
      )}

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3 bg-[#161c28] border border-[#283347] rounded-md">
          <span className="text-[10px] text-slate-400 font-medium uppercase">Total</span>
          <p className="text-base font-bold text-slate-100 mt-0.5">{summaryMetrics.total}</p>
        </div>
        <div className="p-3 bg-[#161c28] border border-blue-800/40 rounded-md">
          <span className="text-[10px] text-blue-400 font-medium uppercase">New</span>
          <p className="text-base font-bold text-blue-300 mt-0.5">{summaryMetrics.newCount}</p>
        </div>
        <div className="p-3 bg-[#161c28] border border-amber-800/40 rounded-md">
          <span className="text-[10px] text-amber-400 font-medium uppercase">Working</span>
          <p className="text-base font-bold text-amber-300 mt-0.5">{summaryMetrics.workingCount}</p>
        </div>
        <div className="p-3 bg-[#161c28] border border-emerald-800/40 rounded-md">
          <span className="text-[10px] text-emerald-400 font-medium uppercase">Qualified</span>
          <p className="text-base font-bold text-emerald-300 mt-0.5">{summaryMetrics.qualifiedCount}</p>
        </div>
        <div className="p-3 bg-[#161c28] border border-indigo-800/40 rounded-md">
          <span className="text-[10px] text-indigo-400 font-medium uppercase">Converted</span>
          <p className="text-base font-bold text-indigo-300 mt-0.5">{summaryMetrics.convertedCount}</p>
        </div>
        <div className="p-3 bg-[#161c28] border border-rose-800/40 rounded-md">
          <span className="text-[10px] text-rose-400 font-medium uppercase">Lost</span>
          <p className="text-base font-bold text-rose-300 mt-0.5">{summaryMetrics.lostCount}</p>
        </div>
      </div>

      {/* Saved Views Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#283347] text-xs">
        {[
          { id: 'all', label: 'All Leads' },
          { id: 'my', label: 'My Leads' },
          { id: 'new', label: 'New Leads' },
          { id: 'high_priority', label: 'High Priority' },
          { id: 'qualified', label: 'Qualified' },
          { id: 'converted', label: 'Converted' },
          { id: 'lost', label: 'Lost' },
        ].map(view => (
          <button
            key={view.id}
            onClick={() => setActiveSavedView(view.id)}
            className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
              activeSavedView === view.id
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-[#121722] text-slate-400 hover:text-slate-200 border border-[#283347]'
            }`}
          >
            {view.label}
          </button>
        ))}
      </div>

      {/* Toolbar (Search, Filter, Column customization, Sort) */}
      <div className="bg-[#161c28] border border-[#283347] p-3 rounded-lg flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        
        {/* Search Input */}
        <div className="w-full md:w-72">
          <Input
            placeholder="Search by name, company, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={Search}
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={['All', 'New', 'Contacted', 'Working', 'Qualified', 'Converted', 'Lost'].map(s => ({ value: s, label: `Status: ${s}` }))}
          />
          <Select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            options={['All', 'High', 'Medium', 'Low'].map(p => ({ value: p, label: `Priority: ${p}` }))}
          />
          <Select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            options={['All', 'LinkedIn', 'Website', 'Referral', 'Email', 'Campaign', 'Phone'].map(s => ({ value: s, label: `Source: ${s}` }))}
          />
          
          <Button variant="secondary" size="sm" icon={Columns} onClick={() => setIsColumnDrawerOpen(true)}>
            Columns
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={RotateCw}
            onClick={() => {
              setFilterStatus('All');
              setFilterPriority('All');
              setFilterSource('All');
              setFilterOwner('All');
              setSearchTerm('');
              setActiveSavedView('all');
            }}
            title="Reset Filters"
          >
            Reset
          </Button>
        </div>

      </div>

      {/* Bulk Actions Banner when rows selected */}
      {selectedRows.length > 0 && (
        <div className="p-3 bg-blue-950/70 border border-blue-800/60 rounded-lg flex items-center justify-between text-xs text-blue-200">
          <span className="font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-blue-400" />
            {selectedRows.length} lead(s) selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              loading={selectedRows.some(id => updatingLeadIds.includes(id))}
              onClick={() => bulkUpdateLeads(selectedRows, { status: 'Working' })}
            >
              Mark Working
            </Button>
            <Button
              variant="secondary"
              size="sm"
              loading={selectedRows.some(id => updatingLeadIds.includes(id))}
              onClick={() => bulkUpdateLeads(selectedRows, { priority: 'High' })}
            >
              Set High Priority
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={() => setBulkDeleteConfirmOpen(true)}
            >
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Dense CRM Table */}
      <div className="bg-[#161c28] border border-[#283347] rounded-lg overflow-hidden shadow-md">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0f141e] border-b border-[#283347] text-[11px] font-semibold text-slate-400 uppercase tracking-wider select-none">
                {visibleColumns.checkbox && (
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedRows.length === filteredLeads.length && filteredLeads.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-[#283347] bg-[#121722] text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                )}
                {visibleColumns.lead && <th className="py-3 px-3">Lead Name</th>}
                {visibleColumns.company && <th className="py-3 px-3">Company</th>}
                {visibleColumns.source && <th className="py-3 px-3">Source</th>}
                {visibleColumns.owner && <th className="py-3 px-3">Owner</th>}
                {visibleColumns.status && <th className="py-3 px-3">Status</th>}
                {visibleColumns.stage && <th className="py-3 px-3">Stage</th>}
                {visibleColumns.priority && <th className="py-3 px-3">Priority</th>}
                {visibleColumns.score && <th className="py-3 px-3">Score</th>}
                {visibleColumns.expectedValue && <th className="py-3 px-3">Expected Value</th>}
                {visibleColumns.nextFollowUp && <th className="py-3 px-3">Next Follow-up</th>}
                {visibleColumns.actions && <th className="py-3 px-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#283347]/60 text-xs">
              {filteredLeads.map((lead) => {
                const isSelected = selectedRows.includes(lead.id);

                return (
                  <tr
                    key={lead.id}
                    onClick={() => viewLead360(lead.id)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-950/40 hover:bg-blue-950/60'
                        : 'hover:bg-[#1c2433]'
                    }`}
                  >
                    {visibleColumns.checkbox && (
                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleRowSelect(lead.id)}
                          className="rounded border-[#283347] bg-[#121722] text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                    )}
                    {visibleColumns.lead && (
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-100 hover:text-blue-400 transition-colors">
                          {lead.firstName} {lead.lastName}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">{lead.title}</p>
                      </td>
                    )}
                    {visibleColumns.company && (
                      <td className="py-2.5 px-3">
                        <span className="font-medium text-slate-200">{lead.company}</span>
                        <p className="text-[11px] text-slate-400">{lead.industry}</p>
                      </td>
                    )}
                    {visibleColumns.source && (
                      <td className="py-2.5 px-3">
                        <span className="inline-block px-2 py-0.5 rounded bg-[#121722] text-slate-300 border border-[#283347] text-[11px]">
                          {lead.source}
                        </span>
                      </td>
                    )}
                    {visibleColumns.owner && (
                      <td className="py-2.5 px-3 text-slate-300 font-medium">
                        {lead.ownerName}
                      </td>
                    )}
                    {visibleColumns.status && (
                      <td className="py-2.5 px-3">
                        <Badge variant={lead.status.toLowerCase()}>{lead.status}</Badge>
                      </td>
                    )}
                    {visibleColumns.stage && (
                      <td className="py-2.5 px-3 text-slate-300 font-medium">
                        {lead.stage}
                      </td>
                    )}
                    {visibleColumns.priority && (
                      <td className="py-2.5 px-3">
                        <Badge variant={lead.priority.toLowerCase()}>{lead.priority}</Badge>
                      </td>
                    )}
                    {visibleColumns.score && (
                      <td className="py-2.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded font-bold text-[11px] ${
                          lead.score >= 80 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-blue-950 text-blue-400 border border-blue-800'
                        }`}>
                          {lead.score}
                        </span>
                      </td>
                    )}
                    {visibleColumns.expectedValue && (
                      <td className="py-2.5 px-3 font-semibold text-emerald-400">
                        ₹{lead.expectedValue?.toLocaleString('en-IN')}
                      </td>
                    )}
                    {visibleColumns.nextFollowUp && (
                      <td className="py-2.5 px-3 text-slate-300 text-[11px]">
                        {lead.nextFollowUpDate || 'None'}
                      </td>
                    )}
                    {visibleColumns.actions && (
                      <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                              onClick={() => {
                                setEditingLeadId(lead.id);
                                setIsAddLeadOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                              title="Edit Lead"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                            onClick={() => viewLead360(lead.id)}
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-[#1c2433] rounded transition-colors"
                            title="View Lead 360"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmLeadId(lead.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-[#1c2433] rounded transition-colors"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!leadsLoading && !leadsError && filteredLeads.length === 0 && (
          <div className="p-10 text-center text-slate-400 space-y-2">
            <p className="text-sm font-semibold">No leads found</p>
            <p className="text-xs text-slate-400">Try clearing active filters or adding a new lead record.</p>
          </div>
        )}
      </div>

      {/* Column Customization Drawer */}
      <Drawer
        isOpen={isColumnDrawerOpen}
        onClose={() => setIsColumnDrawerOpen(false)}
        title="Customize Table Columns"
        subtitle="Choose which columns to display in your Leads workspace"
        width="max-w-sm"
      >
        <div className="space-y-3">
          {Object.keys(visibleColumns).map(colKey => (
            <label key={colKey} className="flex items-center justify-between p-2.5 bg-[#121722] border border-[#283347] rounded-md cursor-pointer hover:bg-[#161c28]">
              <span className="text-xs font-semibold text-slate-200 capitalize">
                {colKey.replace(/([A-Z])/g, ' $1')}
              </span>
              <input
                type="checkbox"
                checked={visibleColumns[colKey]}
                onChange={(e) => setVisibleColumns({ ...visibleColumns, [colKey]: e.target.checked })}
                className="rounded border-[#283347] bg-[#0b0f17] text-blue-600 focus:ring-blue-500"
              />
            </label>
          ))}
        </div>
      </Drawer>

      {/* Delete Confirm Modal */}
      <ConfirmDialog
        isOpen={!!deleteConfirmLeadId}
        onClose={() => setDeleteConfirmLeadId(null)}
        onConfirm={async () => {
          const deleted = await deleteLead(deleteConfirmLeadId);
          if (deleted) setDeleteConfirmLeadId(null);
        }}
        loading={deletingLeadIds.includes(deleteConfirmLeadId)}
        title="Delete Lead Record?"
        message="Are you sure you want to delete this lead? All associated history will be removed."
      />

      {/* Bulk Delete Confirm Modal */}
      <ConfirmDialog
        isOpen={bulkDeleteConfirmOpen}
        onClose={() => setBulkDeleteConfirmOpen(false)}
        onConfirm={async () => {
          const deleted = await bulkDeleteLeads(selectedRows);
          if (deleted) {
            setSelectedRows([]);
            setBulkDeleteConfirmOpen(false);
          }
        }}
        loading={selectedRows.some(id => deletingLeadIds.includes(id))}
        title="Delete Selected Leads?"
        message={`Are you sure you want to delete ${selectedRows.length} selected lead records?`}
      />

    </div>
  );
};

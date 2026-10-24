import React, { useEffect, useState } from 'react';
import { useCRM } from '../../../context/CRMContext';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Modal } from '../../ui/Modal';
import { Select } from '../../ui/Select';
import { Clock, Plus } from 'lucide-react';

export const ActivitiesView = () => {
  const { activities, leads, addActivity, viewLead360, addToast, quickCreateRequest, clearQuickCreateRequest } = useCRM();
  const [filterType, setFilterType] = useState('All');
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ leadId: '', type: 'Call', subject: '', description: '', duration: '', outcome: '' });
  const filteredActivities = activities.filter(activity => filterType === 'All' || activity.type === filterType);

  useEffect(() => {
    if (quickCreateRequest?.module !== 'activities') return;
    setForm({ leadId: '', type: 'Call', subject: '', description: '', duration: '', outcome: '' });
    setIsOpen(true);
    clearQuickCreateRequest();
  }, [clearQuickCreateRequest, quickCreateRequest]);

  const handleSave = async (event) => {
    event.preventDefault();
    if (!form.description.trim()) {
      addToast('Activity notes are required.', 'warning');
      return;
    }
    setSaving(true);
    try {
      const result = await addActivity({ ...form, duration: form.duration || null });
      if (result) {
        setIsOpen(false);
        setForm({ leadId: '', type: 'Call', subject: '', description: '', duration: '', outcome: '' });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-xl font-bold text-slate-100 flex items-center gap-2"><Clock className="w-5 h-5 text-blue-400" />Activities & Communication History</h1><p className="text-xs text-slate-400 mt-0.5">Track persisted calls, emails, meetings, notes, and customer interactions.</p></div>
        <div className="flex items-center gap-2">
          <Select value={filterType} onChange={event => setFilterType(event.target.value)} options={['All', 'Call', 'Email', 'Meeting', 'Note', 'WhatsApp', 'Other', 'LinkedIn', 'Demo'].map(type => ({ value: type, label: `Channel: ${type}` }))} />
          <Button variant="primary" icon={Plus} onClick={() => setIsOpen(true)}>Log Activity</Button>
        </div>
      </div>

      <div className="bg-[#161c28] border border-[#283347] rounded-lg p-6 space-y-6">
        {filteredActivities.length === 0 && <p className="text-center text-sm text-slate-400">No activities have been logged.</p>}
        <div className="relative pl-6 space-y-6 border-l border-[#283347]">
          {filteredActivities.map(activity => (
            <div key={activity.id} className="relative">
              <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-blue-600 border-2 border-[#161c28]" />
              <div className="p-4 bg-[#121722] border border-[#283347] rounded-lg space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2"><span className="font-bold text-xs text-slate-100">{activity.leadName || activity.subject || 'CRM Activity'}</span><Badge variant="blue">{activity.type}</Badge></div>
                  <span className="text-[11px] text-slate-400">{activity.timestamp}</span>
                </div>
                {activity.company && <p className="text-[11px] text-slate-400">{activity.company}</p>}
                <p className="text-xs text-slate-200 leading-relaxed">{activity.description}</p>
                <div className="flex justify-between pt-1 text-[11px] text-slate-400"><span>Logged by: <strong>{activity.performedBy || 'Current user'}</strong></span>{activity.leadId && <button onClick={() => viewLead360(activity.leadId)} className="text-blue-400 hover:underline">View Lead 360 →</button>}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Log Activity">
        <form className="space-y-4" onSubmit={handleSave}>
          <Select label="Related lead" value={form.leadId} onChange={event => setForm({ ...form, leadId: event.target.value })} options={[{ value: '', label: 'No lead selected' }, ...leads.map(lead => ({ value: lead.id, label: `${lead.firstName} ${lead.lastName} — ${lead.company}` }))]} />
          <Select label="Activity type" value={form.type} onChange={event => setForm({ ...form, type: event.target.value })} options={['Call', 'Email', 'Meeting', 'Note', 'WhatsApp', 'Other']} />
          <Input label="Subject" value={form.subject} onChange={event => setForm({ ...form, subject: event.target.value })} />
          <label className="block text-xs font-medium text-slate-300">Description<textarea required value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} rows={4} className="mt-1 w-full rounded-md border border-[#283347] bg-[#121722] p-3 text-xs text-slate-100" /></label>
          <div className="grid grid-cols-2 gap-3"><Input label="Duration (minutes)" type="number" min="0" value={form.duration} onChange={event => setForm({ ...form, duration: event.target.value })} /><Input label="Outcome" value={form.outcome} onChange={event => setForm({ ...form, outcome: event.target.value })} /></div>
          <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button><Button type="submit" variant="primary" loading={saving}>Save Activity</Button></div>
        </form>
      </Modal>
    </div>
  );
};

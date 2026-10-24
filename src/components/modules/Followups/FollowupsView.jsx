import React, { useEffect, useState } from 'react';
import { useCRM } from '../../../context/CRMContext';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Modal } from '../../ui/Modal';
import { Select } from '../../ui/Select';
import { Calendar, CheckCircle2, AlertTriangle, PhoneCall, Mail, Plus } from 'lucide-react';

const dateNow = () => new Date().toISOString().slice(0, 10);

export const FollowupsView = () => {
  const { followUps, leads, users, activeUser, completeFollowUp, scheduleFollowUp, viewLead360, addToast, quickCreateRequest, clearQuickCreateRequest } = useCRM();
  const [activeCategory, setActiveCategory] = useState('all');
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ leadId: '', title: '', type: 'Call', date: dateNow(), time: '10:00 AM', assignedTo: '', notes: '' });
  const today = dateNow();
  const overdue = followUps.filter(item => item.status === 'Overdue' || (item.status === 'Upcoming' && item.date < today));
  const upcoming = followUps.filter(item => ['Upcoming', 'Today'].includes(item.status) && item.date >= today);
  const completed = followUps.filter(item => item.status === 'Completed');
  const displayedList = activeCategory === 'overdue' ? overdue
    : activeCategory === 'upcoming' ? upcoming
      : activeCategory === 'completed' ? completed : followUps;

  useEffect(() => {
    if (quickCreateRequest?.module !== 'followups') return;
    setForm({ leadId: '', title: '', type: 'Call', date: dateNow(), time: '10:00 AM', assignedTo: activeUser?.id || '', notes: '' });
    setIsOpen(true);
    clearQuickCreateRequest();
  }, [activeUser, clearQuickCreateRequest, quickCreateRequest]);

  const handleSave = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.date) {
      addToast('Follow-up title and date are required.', 'warning');
      return;
    }
    setSaving(true);
    try {
      const saved = await scheduleFollowUp({ ...form, title: form.title.trim(), assignedTo: form.assignedTo || activeUser?.id });
      if (saved) {
        setIsOpen(false);
        setForm({ leadId: '', title: '', type: 'Call', date: dateNow(), time: '10:00 AM', assignedTo: '', notes: '' });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-xl font-bold text-slate-100 flex items-center gap-2"><Calendar className="w-5 h-5 text-amber-400" />Follow-ups & Task Schedule</h1><p className="text-xs text-slate-400 mt-0.5">Review upcoming, overdue, and completed customer touchpoints.</p></div>
        <Button variant="primary" icon={Plus} onClick={() => setIsOpen(true)}>Schedule Follow-up</Button>
      </div>
      <div className="flex items-center gap-2 border-b border-[#283347] pb-2 text-xs">
        {[['all', 'All Tasks', followUps.length], ['overdue', 'Overdue', overdue.length], ['upcoming', 'Upcoming', upcoming.length], ['completed', 'Completed', completed.length]].map(([id, label, count]) => (
          <button key={id} onClick={() => setActiveCategory(id)} className={`px-3 py-1.5 rounded-md font-semibold ${activeCategory === id ? 'bg-blue-600 text-white' : 'bg-[#161c28] text-slate-400 border border-[#283347]'}`}>{id === 'overdue' && <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />}{label} ({count})</button>
        ))}
      </div>

      <div className="space-y-3">
        {displayedList.map(item => {
          const isOverdue = item.status === 'Overdue' || (item.status === 'Upcoming' && item.date < today);
          const lead = leads.find(candidate => candidate.id === item.leadId);
          return (
            <article key={item.id} className={`p-4 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-4 ${isOverdue ? 'bg-[#1e1418] border-rose-800/60' : item.status === 'Completed' ? 'bg-[#121722] border-[#283347] opacity-75' : 'bg-[#161c28] border-[#283347]'}`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5"><h3 className="text-sm font-bold text-slate-100">{item.title}</h3><Badge variant={isOverdue ? 'rose' : item.status.toLowerCase()}>{isOverdue ? 'OVERDUE' : item.status}</Badge><Badge variant={(item.priority || 'medium').toLowerCase()}>{item.priority || 'Medium'}</Badge></div>
                <p className="text-xs text-slate-300">Lead: {item.leadId ? <strong className="text-blue-400 cursor-pointer hover:underline" onClick={() => viewLead360(item.leadId)}>{item.leadName}</strong> : <strong>{item.leadName || 'No linked lead'}</strong>} {item.company && `(${item.company})`}</p>
                <p className="text-xs text-slate-400">Due: <strong>{item.date}</strong> at <strong>{item.time}</strong> • Owner: {item.ownerName || 'Unassigned'}</p>
                {item.notes && <p className="text-xs text-slate-300 italic pt-1">{item.notes}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {lead?.phone && <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1.5 rounded-md border border-[#283347] bg-[#121722] px-2.5 py-1.5 text-xs text-slate-200"><PhoneCall className="h-3.5 w-3.5" />Call</a>}
                <button type="button" onClick={() => lead?.email
                  ? window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(lead.email)}`, '_blank', 'noopener,noreferrer')
                  : addToast('This lead has no email address.', 'warning')} className="inline-flex items-center gap-1.5 rounded-md border border-[#283347] bg-[#121722] px-2.5 py-1.5 text-xs text-slate-200"><Mail className="h-3.5 w-3.5" />Email</button>
                {item.status !== 'Completed' && item.status !== 'Cancelled' && <Button variant="primary" size="sm" icon={CheckCircle2} onClick={() => completeFollowUp(item.id)}>Complete</Button>}
              </div>
            </article>
          );
        })}
        {!displayedList.length && <p className="rounded-lg border border-[#283347] bg-[#161c28] p-8 text-center text-sm text-slate-400">No follow-ups in this view.</p>}
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Schedule Follow-up">
        <form className="space-y-4" onSubmit={handleSave}>
          <Input label="Task title" value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} required />
          <Select label="Related lead" value={form.leadId} onChange={event => setForm({ ...form, leadId: event.target.value })} options={[{ value: '', label: 'No lead selected' }, ...leads.map(lead => ({ value: lead.id, label: `${lead.firstName} ${lead.lastName} — ${lead.company}` }))]} />
          <div className="grid grid-cols-2 gap-3"><Select label="Type" value={form.type} onChange={event => setForm({ ...form, type: event.target.value })} options={['Call', 'Email', 'Meeting', 'Demo', 'Task', 'Other']} /><Select label="Assigned to" value={form.assignedTo || activeUser?.id || ''} onChange={event => setForm({ ...form, assignedTo: event.target.value })} options={users.map(user => ({ value: user.id, label: user.name }))} /></div>
          <div className="grid grid-cols-2 gap-3"><Input label="Due date" type="date" value={form.date} onChange={event => setForm({ ...form, date: event.target.value })} required /><Input label="Due time" value={form.time} onChange={event => setForm({ ...form, time: event.target.value })} required /></div>
          <label className="block text-xs font-medium text-slate-300">Description<textarea value={form.notes} onChange={event => setForm({ ...form, notes: event.target.value })} rows={3} className="mt-1 w-full rounded-md border border-[#283347] bg-[#121722] p-3 text-xs text-slate-100" /></label>
          <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button><Button type="submit" variant="primary" loading={saving}>Save Follow-up</Button></div>
        </form>
      </Modal>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useCRM } from '../../../context/CRMContext';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Modal } from '../../ui/Modal';
import { Select } from '../../ui/Select';
import { Briefcase, Plus, Pencil, Trash2 } from 'lucide-react';

const stages = ['Prospecting', 'Discovery', 'Demo', 'Proposal', 'Negotiation', 'Won', 'Lost'];
const emptyOpportunity = {
  title: '', leadId: '', accountId: '', contactId: '', ownerId: '',
  value: '0', probability: '0', stage: 'Prospecting', expectedCloseDate: '', nextAction: '',
};

export const DealsView = () => {
  const {
    deals, leads, accounts, contacts, users, activeUser,
    saveOpportunity, deleteOpportunity, moveDealStage, busy, addToast,
    quickCreateRequest, clearQuickCreateRequest,
  } = useCRM();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyOpportunity);

  useEffect(() => {
    if (quickCreateRequest?.module !== 'opportunities') return;
    setEditingId(null);
    setForm({ ...emptyOpportunity, ownerId: activeUser?.id || '' });
    setIsOpen(true);
    clearQuickCreateRequest();
  }, [activeUser, clearQuickCreateRequest, quickCreateRequest]);

  const totalPipeline = deals.filter(deal => deal.stage !== 'Won' && deal.stage !== 'Lost').reduce((sum, deal) => sum + Number(deal.value || 0), 0);
  const weightedPipeline = deals.filter(deal => deal.stage !== 'Won' && deal.stage !== 'Lost').reduce((sum, deal) => sum + Number(deal.value || 0) * Number(deal.probability || 0) / 100, 0);
  const openDealsCount = deals.filter(deal => deal.stage !== 'Won' && deal.stage !== 'Lost').length;
  const wonValue = deals.filter(deal => deal.stage === 'Won').reduce((sum, deal) => sum + Number(deal.value || 0), 0);

  const openForm = (deal) => {
    setEditingId(deal?.id || null);
    setForm(deal ? {
      ...emptyOpportunity,
      ...deal,
      title: deal.title || '',
      value: String(deal.value ?? 0),
      probability: String(deal.probability ?? 0),
    } : { ...emptyOpportunity, ownerId: activeUser?.id || '' });
    setIsOpen(true);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      addToast('Opportunity name is required.', 'warning');
      return;
    }
    const saved = await saveOpportunity({ ...form, title: form.title.trim() }, editingId);
    if (saved) setIsOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2"><Briefcase className="w-5 h-5 text-indigo-400" />Sales Opportunities & Kanban Pipeline</h1>
          <p className="text-xs text-slate-400 mt-0.5">Pipeline stages and revenue calculated from saved opportunities.</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => openForm(null)}>Create Opportunity</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric title="Total Pipeline Value" value={`₹${totalPipeline.toLocaleString('en-IN')}`} note={`${openDealsCount} open opportunities`} />
        <Metric title="Weighted Pipeline" value={`₹${Math.round(weightedPipeline).toLocaleString('en-IN')}`} note="Value × probability" />
        <Metric title="Active Open Deals" value={String(openDealsCount)} note="Excludes closed opportunities" />
        <Metric title="Closed Won Revenue" value={`₹${wonValue.toLocaleString('en-IN')}`} note="Won opportunities" />
      </div>

      <div className="overflow-x-auto custom-scrollbar pb-4">
        <div className="flex gap-4 min-w-[1400px]">
          {stages.map(stage => {
            const stageDeals = deals.filter(deal => deal.stage === stage);
            const stageTotal = stageDeals.reduce((sum, deal) => sum + Number(deal.value || 0), 0);
            return (
              <section key={stage} className="w-72 bg-[#121722] border border-[#283347] rounded-lg flex flex-col max-h-[70vh] shrink-0">
                <header className="p-3 border-b border-[#283347] flex items-center justify-between">
                  <div><h2 className="text-xs font-bold text-slate-100">{stage} <span className="ml-1 text-[10px] text-slate-400">({stageDeals.length})</span></h2><p className="text-[11px] font-semibold text-emerald-400 mt-0.5">₹{stageTotal.toLocaleString('en-IN')}</p></div>
                </header>
                <div className="p-3 overflow-y-auto space-y-3 flex-1">
                  {stageDeals.map(deal => (
                    <article key={deal.id} className="p-3.5 bg-[#161c28] border border-[#283347] rounded-lg space-y-3">
                      <div className="flex items-start justify-between gap-2"><div><h3 className="text-xs font-bold text-slate-100">{deal.title}</h3><p className="text-[11px] text-slate-400">{deal.company} • {deal.contactName}</p></div><Badge variant={deal.priority ? deal.priority.toLowerCase() : 'medium'}>{deal.priority || 'Medium'}</Badge></div>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-[#283347]"><span className="font-bold text-emerald-400">₹{Number(deal.value || 0).toLocaleString('en-IN')}</span><span className="text-[10px] text-slate-400">Prob: <strong className="text-slate-200">{deal.probability}%</strong></span></div>
                      <p className="text-[11px] text-slate-400">Owner: <strong className="text-slate-300">{deal.ownerName || 'Unassigned'}</strong></p>
                      <Select aria-label="Opportunity stage" value={stage} onChange={event => moveDealStage(deal.id, event.target.value)} options={stages} />
                      <div className="flex justify-end gap-2 border-t border-[#283347] pt-2">
                        <Button variant="secondary" size="sm" icon={Pencil} onClick={() => openForm(deal)}>Edit</Button>
                        <Button variant="danger" size="sm" icon={Trash2} onClick={async () => {
                          if (window.confirm(`Delete opportunity "${deal.title}"?`)) await deleteOpportunity(deal.id);
                        }}>Delete</Button>
                      </div>
                    </article>
                  ))}
                  {!stageDeals.length && <p className="py-5 text-center text-[11px] text-slate-500">No opportunities</p>}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editingId ? 'Edit Opportunity' : 'Create Opportunity'}>
        <form className="space-y-4" onSubmit={handleSave}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Opportunity name" value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} required />
            <Input label="Value" type="number" min="0" step="0.01" value={form.value} onChange={event => setForm({ ...form, value: event.target.value })} />
            <Input label="Probability (%)" type="number" min="0" max="100" value={form.probability} onChange={event => setForm({ ...form, probability: event.target.value })} />
            <Select label="Stage" value={form.stage} onChange={event => setForm({ ...form, stage: event.target.value })} options={stages} />
            <Input label="Expected close date" type="date" value={form.expectedCloseDate || ''} onChange={event => setForm({ ...form, expectedCloseDate: event.target.value })} />
            <Select label="Owner" value={form.ownerId || activeUser?.id || ''} onChange={event => setForm({ ...form, ownerId: event.target.value })} options={users.map(user => ({ value: user.id, label: user.name }))} />
            <Select label="Account" value={form.accountId || ''} onChange={event => setForm({ ...form, accountId: event.target.value })} options={[{ value: '', label: 'No account' }, ...accounts.map(account => ({ value: account.id, label: account.name }))]} />
            <Select label="Contact" value={form.contactId || ''} onChange={event => setForm({ ...form, contactId: event.target.value })} options={[{ value: '', label: 'No contact' }, ...contacts.map(contact => ({ value: contact.id, label: contact.name }))]} />
            <Select label="Lead" value={form.leadId || ''} onChange={event => setForm({ ...form, leadId: event.target.value })} options={[{ value: '', label: 'No lead' }, ...leads.map(lead => ({ value: lead.id, label: `${lead.firstName} ${lead.lastName}`.trim() }))]} />
            <Input label="Next action" value={form.nextAction || ''} onChange={event => setForm({ ...form, nextAction: event.target.value })} />
          </div>
          <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button><Button type="submit" variant="primary" loading={Boolean(busy[editingId || 'new-opportunity'])}>{editingId ? 'Save Changes' : 'Create Opportunity'}</Button></div>
        </form>
      </Modal>
    </div>
  );
};

const Metric = ({ title, value, note }) => (
  <div className="p-4 bg-[#161c28] border border-[#283347] rounded-lg">
    <span className="text-xs text-slate-400 font-medium">{title}</span>
    <h3 className="text-xl font-bold text-slate-100 mt-1">{value}</h3>
    <span className="text-[11px] text-slate-400">{note}</span>
  </div>
);

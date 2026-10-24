import React, { useEffect, useState } from 'react';
import { useCRM } from '../../../context/CRMContext';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Modal } from '../../ui/Modal';
import { Select } from '../../ui/Select';
import { Building2, Plus, Pencil, Trash2 } from 'lucide-react';

const emptyAccount = {
  name: '', industry: '', website: '', phone: '', email: '',
  companySize: '', location: '', ownerId: '', status: 'Active',
  description: '', tags: '',
};

export const AccountsView = () => {
  const { accounts, contacts, deals, users, activeUser, saveAccount, deleteAccount, busy, addToast, quickCreateRequest, clearQuickCreateRequest } = useCRM();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyAccount);

  useEffect(() => {
    if (quickCreateRequest?.module !== 'accounts') return;
    setEditingId(null);
    setForm({ ...emptyAccount, ownerId: activeUser?.id || '' });
    setIsOpen(true);
    clearQuickCreateRequest();
  }, [activeUser, clearQuickCreateRequest, quickCreateRequest]);

  const openForm = (account) => {
    setEditingId(account?.id || null);
    setForm(account ? {
      ...emptyAccount,
      ...account,
      tags: Array.isArray(account.tags) ? account.tags.join(', ') : '',
    } : { ...emptyAccount, ownerId: activeUser?.id || '' });
    setIsOpen(true);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      addToast('Account name is required.', 'warning');
      return;
    }
    const saved = await saveAccount({
      ...form,
      name: form.name.trim(),
      tags: form.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      ownerId: form.ownerId || activeUser?.id,
    }, editingId);
    if (saved) setIsOpen(false);
  };

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2"><Building2 className="w-5 h-5 text-amber-400" />Accounts & Organization Profiles</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage company relationships, open deal values, and associated contacts.</p>
        </div>
        <Button variant="primary" size="md" icon={Plus} onClick={() => openForm(null)}>+ Add Account</Button>
      </div>

      {accounts.length === 0 && <p className="rounded-lg border border-[#283347] bg-[#161c28] p-8 text-center text-sm text-slate-400">No accounts yet. Create an account to get started.</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map(account => {
          const contactCount = contacts.filter(contact => contact.accountId === account.id).length;
          const accountDeals = deals.filter(deal => deal.accountId === account.id);
          const dealValue = accountDeals.filter(deal => deal.stage !== 'Won' && deal.stage !== 'Lost').reduce((sum, deal) => sum + Number(deal.value || 0), 0);
          return (
            <div key={account.id} className="p-5 bg-[#161c28] border border-[#283347] hover:border-slate-500 rounded-lg space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-100">{account.name}</h3>
                  <p className="text-xs text-slate-400">{account.industry || 'Industry not set'}{account.companySize ? ` • ${account.companySize}` : ''}</p>
                </div>
                <Badge variant={account.status === 'Active' ? 'emerald' : 'slate'}>{account.status}</Badge>
              </div>
              <p className="text-xs text-slate-400">{account.location || 'Location not set'}</p>
              <div className="pt-2 border-t border-[#283347] grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-slate-400 block">Contacts</span><span className="font-semibold text-slate-200">{contactCount} linked</span></div>
                <div><span className="text-slate-400 block">Open Deal Value</span><span className="font-bold text-emerald-400">₹{dealValue.toLocaleString('en-IN')}</span></div>
              </div>
              <div className="pt-2 border-t border-[#283347] flex items-center justify-between text-[11px] text-slate-400">
                <span>Owner: {account.ownerName || 'Unassigned'}</span>
                {account.website && <a href={account.website} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Website →</a>}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" icon={Pencil} onClick={() => openForm(account)}>Edit</Button>
                <Button variant="danger" size="sm" icon={Trash2} onClick={async () => {
                  if (window.confirm(`Delete account "${account.name}"? Linked contacts/opportunities will be unlinked.`)) await deleteAccount(account.id);
                }}>Delete</Button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editingId ? 'Edit Account' : 'Create Account'}>
        <form className="space-y-4" onSubmit={handleSave}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Account name" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} required />
            <Input label="Industry" value={form.industry} onChange={event => setForm({ ...form, industry: event.target.value })} />
            <Input label="Website" type="url" value={form.website} onChange={event => setForm({ ...form, website: event.target.value })} />
            <Input label="Phone" value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} />
            <Input label="Email" type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} />
            <Input label="Company size" value={form.companySize} onChange={event => setForm({ ...form, companySize: event.target.value })} />
            <Input label="Location" value={form.location} onChange={event => setForm({ ...form, location: event.target.value })} />
            <Select label="Owner" value={form.ownerId} onChange={event => setForm({ ...form, ownerId: event.target.value })} options={users.map(user => ({ value: user.id, label: user.name }))} />
            <Select label="Status" value={form.status} onChange={event => setForm({ ...form, status: event.target.value })} options={['Active', 'Inactive', 'Prospect']} />
            <Input label="Tags (comma-separated)" value={form.tags} onChange={event => setForm({ ...form, tags: event.target.value })} />
          </div>
          <label className="block text-xs font-medium text-slate-300">Description<textarea value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} rows={3} className="mt-1 w-full rounded-md border border-[#283347] bg-[#121722] p-3 text-xs text-slate-100" /></label>
          <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button><Button type="submit" variant="primary" loading={Boolean(busy[editingId || 'new-account'])}>{editingId ? 'Save Changes' : 'Create Account'}</Button></div>
        </form>
      </Modal>
    </div>
  );
};

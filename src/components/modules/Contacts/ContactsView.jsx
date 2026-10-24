import React, { useEffect, useState } from 'react';
import { useCRM } from '../../../context/CRMContext';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Modal } from '../../ui/Modal';
import { Select } from '../../ui/Select';
import { Users, Plus, Pencil, Trash2 } from 'lucide-react';

const emptyContact = { name: '', email: '', phone: '', title: '', accountId: '', leadId: '', ownerId: '', status: 'Active', description: '' };

export const ContactsView = () => {
  const { contacts, accounts, leads, users, activeUser, viewLead360, saveContact, deleteContact, busy, addToast, quickCreateRequest, clearQuickCreateRequest } = useCRM();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyContact);

  useEffect(() => {
    if (quickCreateRequest?.module !== 'contacts') return;
    setEditingId(null);
    setForm({ ...emptyContact, ownerId: activeUser?.id || '' });
    setIsOpen(true);
    clearQuickCreateRequest();
  }, [activeUser, clearQuickCreateRequest, quickCreateRequest]);

  const openForm = (contact) => {
    setEditingId(contact?.id || null);
    setForm(contact ? { ...emptyContact, ...contact } : { ...emptyContact, ownerId: activeUser?.id || '' });
    setIsOpen(true);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      addToast('Contact name is required.', 'warning');
      return;
    }
    const saved = await saveContact({ ...form, name: form.name.trim() }, editingId);
    if (saved) setIsOpen(false);
  };

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2"><Users className="w-5 h-5 text-emerald-400" />Contacts Management Workspace</h1>
          <p className="text-xs text-slate-400 mt-0.5">Individual decision makers and business contacts associated with accounts.</p>
        </div>
        <Button variant="primary" size="md" icon={Plus} onClick={() => openForm(null)}>+ Add Contact</Button>
      </div>

      <div className="bg-[#161c28] border border-[#283347] rounded-lg overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead><tr className="bg-[#0f141e] border-b border-[#283347] text-[11px] font-semibold text-slate-400 uppercase">
            <th className="py-3 px-4">Contact Name</th><th className="py-3 px-4">Account</th><th className="py-3 px-4">Email</th><th className="py-3 px-4">Phone</th><th className="py-3 px-4">Owner</th><th className="py-3 px-4">Status</th><th className="py-3 px-4 text-right">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-[#283347]/60">
            {contacts.map(contact => (
              <tr key={contact.id} className="hover:bg-[#1c2433]">
                <td className="py-3 px-4 font-semibold text-slate-100">{contact.name}<p className="mt-0.5 text-[11px] font-normal text-slate-400">{contact.title}</p></td>
                <td className="py-3 px-4 text-slate-300">{contact.company || '—'}</td>
                <td className="py-3 px-4 text-blue-400">{contact.email || '—'}</td>
                <td className="py-3 px-4 text-slate-300">{contact.phone || '—'}</td>
                <td className="py-3 px-4 text-slate-300">{contact.ownerName || 'Unassigned'}</td>
                <td className="py-3 px-4"><Badge variant={contact.status === 'Active' ? 'emerald' : 'slate'}>{contact.status}</Badge></td>
                <td className="py-3 px-4 text-right">
                  <div className="flex justify-end gap-1">
                    {contact.leadId && <Button variant="ghost" size="sm" onClick={() => viewLead360(contact.leadId)}>View Lead</Button>}
                    <Button variant="secondary" size="sm" icon={Pencil} onClick={() => openForm(contact)}>Edit</Button>
                    <Button variant="danger" size="sm" icon={Trash2} onClick={async () => {
                      if (window.confirm(`Delete contact "${contact.name}"?`)) await deleteContact(contact.id);
                    }}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!contacts.length && <p className="p-8 text-center text-sm text-slate-400">No contacts yet.</p>}
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editingId ? 'Edit Contact' : 'Create Contact'}>
        <form className="space-y-4" onSubmit={handleSave}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Full name" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} required />
            <Input label="Job title" value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} />
            <Input label="Email" type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} />
            <Input label="Phone" value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} />
            <Select label="Account" value={form.accountId} onChange={event => setForm({ ...form, accountId: event.target.value })} options={[{ value: '', label: 'No account' }, ...accounts.map(account => ({ value: account.id, label: account.name }))]} />
            <Select label="Linked lead" value={form.leadId} onChange={event => setForm({ ...form, leadId: event.target.value })} options={[{ value: '', label: 'No linked lead' }, ...leads.map(lead => ({ value: lead.id, label: `${lead.firstName} ${lead.lastName}`.trim() }))]} />
            <Select label="Owner" value={form.ownerId} onChange={event => setForm({ ...form, ownerId: event.target.value })} options={users.map(user => ({ value: user.id, label: user.name }))} />
            <Select label="Status" value={form.status} onChange={event => setForm({ ...form, status: event.target.value })} options={['Active', 'Inactive']} />
          </div>
          <label className="block text-xs font-medium text-slate-300">Description<textarea value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} rows={3} className="mt-1 w-full rounded-md border border-[#283347] bg-[#121722] p-3 text-xs text-slate-100" /></label>
          <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button><Button type="submit" variant="primary" loading={Boolean(busy[editingId || 'new-contact'])}>{editingId ? 'Save Changes' : 'Create Contact'}</Button></div>
        </form>
      </Modal>
    </div>
  );
};

import React from 'react';
import { useCRM } from '../../../context/CRMContext';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Users, Mail, PhoneCall, Plus } from 'lucide-react';

export const ContactsView = () => {
  const { contacts, viewLead360, addToast } = useCRM();

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            Contacts Management Workspace
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Individual decision makers and business contacts associated with accounts.
          </p>
        </div>
        <Button variant="primary" size="md" icon={Plus} onClick={() => addToast('Contact form opened', 'info')}>
          + Add Contact
        </Button>
      </div>

      <div className="bg-[#161c28] border border-[#283347] rounded-lg overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#0f141e] border-b border-[#283347] text-[11px] font-semibold text-slate-400 uppercase">
              <th className="py-3 px-4">Contact Name</th>
              <th className="py-3 px-4">Company</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Phone</th>
              <th className="py-3 px-4">Owner</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#283347]/60">
            {contacts.map(c => (
              <tr key={c.id} className="hover:bg-[#1c2433] transition-colors">
                <td className="py-3 px-4 font-semibold text-slate-100">{c.name}</td>
                <td className="py-3 px-4 text-slate-300">{c.company}</td>
                <td className="py-3 px-4 text-blue-400">{c.email}</td>
                <td className="py-3 px-4 text-slate-300">{c.phone}</td>
                <td className="py-3 px-4 text-slate-300">{c.ownerName}</td>
                <td className="py-3 px-4"><Badge variant="emerald">{c.status}</Badge></td>
                <td className="py-3 px-4 text-right">
                  {c.leadId && (
                    <button onClick={() => viewLead360(c.leadId)} className="text-blue-400 hover:underline">
                      View Lead 360 →
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

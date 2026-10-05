import React from 'react';
import { useCRM } from '../../../context/CRMContext';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Building2, Plus, DollarSign, Users } from 'lucide-react';

export const AccountsView = () => {
  const { accounts, addToast } = useCRM();

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            Accounts & Organization Profiles
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage company relationships, open deal values, and associated contacts.
          </p>
        </div>
        <Button variant="primary" size="md" icon={Plus} onClick={() => addToast('Account form opened', 'info')}>
          + Add Account
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map(acc => (
          <div key={acc.id} className="p-5 bg-[#161c28] border border-[#283347] hover:border-slate-500 rounded-lg space-y-3 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100">{acc.name}</h3>
                <p className="text-xs text-slate-400">{acc.industry} • {acc.companySize}</p>
              </div>
              <Badge variant="blue">{acc.location}</Badge>
            </div>

            <div className="pt-2 border-t border-[#283347] grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block">Contacts</span>
                <span className="font-semibold text-slate-200">{acc.contactsCount} Active</span>
              </div>
              <div>
                <span className="text-slate-400 block">Deal Value</span>
                <span className="font-bold text-emerald-400">₹{acc.totalDealValue?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#283347] flex items-center justify-between text-[11px] text-slate-400">
              <span>Owner: {acc.ownerName}</span>
              <a href={acc.website} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                Website →
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

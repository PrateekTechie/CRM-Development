import React, { useState } from 'react';
import { useCRM } from '../../../context/CRMContext';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Select } from '../../ui/Select';
import { Clock, PhoneCall, Mail, MessageSquare, Plus, CheckCircle2, Calendar } from 'lucide-react';

export const ActivitiesView = () => {
  const { activities, viewLead360 } = useCRM();
  const [filterType, setFilterType] = useState('All');

  const filteredActivities = activities.filter(a => filterType === 'All' || a.type === filterType);

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            Activities & Communication History
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Track logged calls, emails, demos, and customer interactions across all leads.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            options={['All', 'Phone', 'Email', 'LinkedIn', 'Meeting', 'Note', 'Demo'].map(t => ({ value: t, label: `Channel: ${t}` }))}
          />
        </div>
      </div>

      <div className="bg-[#161c28] border border-[#283347] rounded-lg p-6 space-y-6">
        <div className="relative pl-6 space-y-6 border-l border-[#283347]">
          {filteredActivities.map(act => (
            <div key={act.id} className="relative group">
              <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-blue-600 border-2 border-[#161c28]" />
              <div className="p-4 bg-[#121722] border border-[#283347] hover:border-slate-600 rounded-lg transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-100">{act.leadName}</span>
                    <span className="text-slate-400 text-xs">({act.company})</span>
                    <Badge variant="blue">{act.type}</Badge>
                  </div>
                  <span className="text-[11px] text-slate-400">{act.timestamp}</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">{act.description}</p>
                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                  <span>Logged by: <strong>{act.performedBy}</strong></span>
                  {act.leadId && (
                    <button onClick={() => viewLead360(act.leadId)} className="text-blue-400 hover:underline">
                      View Lead 360 →
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

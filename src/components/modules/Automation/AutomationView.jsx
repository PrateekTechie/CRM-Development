import React, { useState } from 'react';
import { useCRM } from '../../../context/CRMContext';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Zap, Plus, ArrowDown, CheckCircle2, PlayCircle } from 'lucide-react';

export const AutomationView = () => {
  const { automations, addToast } = useCRM();
  const [isAddRuleOpen, setIsAddRuleOpen] = useState(false);

  const [ruleName, setRuleName] = useState('');
  const [ruleTrigger, setRuleTrigger] = useState('New Lead Created');
  const [ruleCondition, setRuleCondition] = useState('Source == "LinkedIn"');
  const [ruleAction, setRuleAction] = useState('Assign Owner -> Arjun Kapoor');

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Workflow Automation Builder
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Automate lead assignment, task creation, notifications, and pipeline triggers.
          </p>
        </div>
        <Button variant="primary" size="md" icon={Plus} onClick={() => setIsAddRuleOpen(true)}>
          + Create Workflow Rule
        </Button>
      </div>

      {/* Rules Visual Flowchart Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {automations.map((rule) => (
          <div key={rule.id} className="p-5 bg-[#161c28] border border-[#283347] rounded-lg space-y-4 shadow-md">
            
            <div className="flex items-center justify-between border-b border-[#283347] pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100">{rule.name}</h3>
                <span className="text-[10px] text-slate-400">Triggered {rule.triggerCount} times</span>
              </div>
              <Badge variant="emerald">{rule.status}</Badge>
            </div>

            {/* Workflow Node Chain */}
            <div className="space-y-2.5">
              
              {/* Trigger Node */}
              <div className="p-3 bg-[#121722] border border-blue-800/50 rounded-md text-xs">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">WHEN (Trigger)</span>
                <p className="font-semibold text-slate-200 mt-0.5">{rule.trigger}</p>
              </div>

              <div className="flex justify-center">
                <ArrowDown className="w-4 h-4 text-slate-500" />
              </div>

              {/* Condition Node */}
              <div className="p-3 bg-[#121722] border border-amber-800/50 rounded-md text-xs">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">IF (Condition)</span>
                <p className="font-semibold text-slate-200 mt-0.5">{rule.condition}</p>
              </div>

              <div className="flex justify-center">
                <ArrowDown className="w-4 h-4 text-slate-500" />
              </div>

              {/* Action Node */}
              <div className="p-3 bg-[#121722] border border-emerald-800/50 rounded-md text-xs">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">THEN (Action)</span>
                <p className="font-semibold text-slate-200 mt-0.5">{rule.action}</p>
              </div>

            </div>

            <div className="pt-2 border-t border-[#283347] flex items-center justify-between text-xs">
              <button onClick={() => addToast(`Test firing rule "${rule.name}"...`, 'info')} className="text-blue-400 hover:underline flex items-center gap-1">
                <PlayCircle className="w-3.5 h-3.5" /> Test Rule
              </button>
              <span className="text-slate-400 text-[11px]">Active Rule</span>
            </div>

          </div>
        ))}
      </div>

      {/* Add Rule Modal */}
      <Modal isOpen={isAddRuleOpen} onClose={() => setIsAddRuleOpen(false)} title="Create Automation Rule">
        <div className="space-y-4">
          <Input label="Rule Name" value={ruleName} onChange={(e) => setRuleName(e.target.value)} placeholder="e.g. Website Lead Priority Escalation" />
          <Select label="Trigger" value={ruleTrigger} onChange={(e) => setRuleTrigger(e.target.value)} options={['New Lead Created', 'Expected Value > ₹50,000', 'Lead Qualified', 'Follow-up Overdue']} />
          <Input label="Condition Criteria" value={ruleCondition} onChange={(e) => setRuleCondition(e.target.value)} placeholder='e.g. Source == "LinkedIn"' />
          <Select label="Action to Execute" value={ruleAction} onChange={(e) => setRuleAction(e.target.value)} options={['Assign Owner -> Arjun Kapoor & Priority -> High', 'Create Follow-up (Tomorrow)', 'Create Opportunity in Discovery Stage', 'Send Manager Notification']} />
          <div className="flex justify-end gap-2 pt-2 border-t border-[#283347]">
            <Button variant="secondary" onClick={() => setIsAddRuleOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => { addToast('Automation rule created.'); setIsAddRuleOpen(false); }}>Save Automation Rule</Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

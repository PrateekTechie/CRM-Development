import React, { useState } from 'react';
import { useCRM } from '../../../context/CRMContext';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Modal } from '../../ui/Modal';
import { Select } from '../../ui/Select';
import { Zap, Plus, ArrowDown, Pencil, Trash2 } from 'lucide-react';

const triggers = [
  'New Lead Created', 'Lead Updated', 'Lead Status Changed', 'Lead Stage Changed',
  'Lead Assigned', 'Lead Qualified', 'Lead Score Changed', 'Priority Changed',
  'Follow-up Created', 'Follow-up Completed', 'Opportunity Created',
  'Opportunity Stage Changed', 'Opportunity Won', 'Opportunity Lost',
  'Account Created', 'Contact Created', 'Activity Logged',
];

const leadFields = [
  { value: 'source', label: 'Lead Source', type: 'text' },
  { value: 'status', label: 'Status', type: 'enum', options: ['New', 'Contacted', 'Working', 'Qualified', 'Converted', 'Lost'] },
  { value: 'stage', label: 'Stage', type: 'enum', options: ['Prospecting', 'Discovery', 'Demo', 'Proposal', 'Negotiation'] },
  { value: 'priority', label: 'Priority', type: 'enum', options: ['Low', 'Medium', 'High'] },
  { value: 'owner_user_id', label: 'Owner', type: 'owner' },
  { value: 'industry', label: 'Industry', type: 'text' },
  { value: 'company', label: 'Company', type: 'text' },
  { value: 'company_size', label: 'Company Size', type: 'text' },
  { value: 'location', label: 'Location', type: 'text' },
  { value: 'score', label: 'Score', type: 'number' },
  { value: 'expected_value', label: 'Expected Value', type: 'number' },
  { value: 'expected_close_date', label: 'Expected Close Date', type: 'date' },
  { value: 'next_follow_up', label: 'Next Follow-up', type: 'date' },
  { value: 'last_activity_date', label: 'Last Activity Date', type: 'date' },
  { value: 'email', label: 'Email', type: 'text' },
  { value: 'phone', label: 'Phone', type: 'text' },
  { value: 'job_title', label: 'Job Title', type: 'text' },
  { value: 'product_interest', label: 'Product Interest', type: 'text' },
  { value: 'preferred_contact_method', label: 'Preferred Contact Method', type: 'text' },
  { value: 'tags', label: 'Tags', type: 'array' },
  { value: 'created_at', label: 'Created At', type: 'date' },
  { value: 'updated_at', label: 'Updated At', type: 'date' },
];

const operatorOptions = {
  text: [['equals', 'Equals'], ['not_equals', 'Not Equals'], ['contains', 'Contains'], ['does_not_contain', 'Does Not Contain'], ['starts_with', 'Starts With'], ['is_empty', 'Is Empty'], ['is_not_empty', 'Is Not Empty']],
  number: [['equals', 'Equals'], ['not_equals', 'Not Equals'], ['greater_than', 'Greater Than'], ['greater_or_equal', 'Greater Than or Equal'], ['less_than', 'Less Than'], ['less_or_equal', 'Less Than or Equal']],
  date: [['before', 'Before'], ['after', 'After'], ['on', 'On'], ['is_empty', 'Is Empty'], ['is_not_empty', 'Is Not Empty']],
  enum: [['equals', 'Equals'], ['not_equals', 'Not Equals']],
  owner: [['equals', 'Equals'], ['not_equals', 'Not Equals'], ['is_empty', 'Is Empty'], ['is_not_empty', 'Is Not Empty']],
  array: [['contains_tag', 'Contains'], ['does_not_contain', 'Does Not Contain'], ['is_empty', 'Is Empty'], ['is_not_empty', 'Is Not Empty']],
};

const triggerEntity = trigger => trigger.startsWith('Lead') || trigger === 'New Lead Created' || trigger === 'Priority Changed'
  ? 'lead' : trigger.startsWith('Opportunity') ? 'opportunity' : trigger.startsWith('Follow-up') ? 'follow_up'
    : trigger === 'Account Created' ? 'account' : trigger === 'Contact Created' ? 'contact' : 'activity';

const emptyCondition = { field: 'source', operator: 'equals', value: '' };

export const AutomationView = () => {
  const { automations, users, activeUser, saveAutomation, deleteAutomation } = useCRM();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    name: '', description: '', triggerType: 'New Lead Created',
    match: 'all', conditions: [],
    action: { type: 'change_priority', value: 'High' }, active: false,
  });

  const openForm = (rule) => {
    setEditingId(rule?.id || null);
    const firstAction = rule?.actions?.[0] || { type: 'change_priority', value: 'High' };
    setForm(rule ? {
      name: rule.name || '',
      description: rule.description || '',
      triggerType: rule.triggerType || 'New Lead Created',
      match: rule.conditions?.match || 'all',
      conditions: rule.conditions?.rules || [],
      action: firstAction,
      active: Boolean(rule.active),
    } : {
      name: '', description: '', triggerType: 'New Lead Created',
      match: 'all', conditions: [],
      action: { type: 'change_priority', value: 'High' }, active: false,
    });
    setFormError('');
    setIsOpen(true);
  };

  const changeTrigger = (triggerType) => {
    const entity = triggerEntity(triggerType);
    const action = entity === 'lead'
      ? { type: 'change_priority', value: 'High' }
      : entity === 'opportunity'
        ? { type: 'mark_opportunity_won' }
        : { type: 'create_notification', title: '', message: '' };
    setForm({ ...form, triggerType, action, conditions: entity === 'lead' ? form.conditions : [] });
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setFormError('Enter a rule name.');
      return;
    }
    const entity = triggerEntity(form.triggerType);
    const incompleteCondition = entity === 'lead' && form.conditions.some(condition =>
      !condition.field || !condition.operator || (!['is_empty', 'is_not_empty'].includes(condition.operator) && (condition.value === '' || condition.value == null)));
    if (incompleteCondition) {
      setFormError('Complete each condition or remove the unfinished condition.');
      return;
    }
    if (selectedAction === 'create_notification' && !form.action.title?.trim()) {
      setFormError('Enter a notification title.');
      return;
    }
    if (['change_status', 'change_stage', 'change_priority', 'update_opportunity_stage', 'add_tag', 'remove_tag'].includes(selectedAction) && !form.action.value) {
      setFormError('Choose or enter the action value.');
      return;
    }
    if (selectedAction === 'assign_owner' && !form.action.ownerId) {
      setFormError('Choose an owner.');
      return;
    }
    const conditions = entity === 'lead' ? form.conditions : [];
    setFormError('');
    setSaving(true);
    try {
      const saved = await saveAutomation({
        name: form.name.trim(),
        description: form.description.trim(),
        triggerType: form.triggerType,
        conditions: { match: form.match, rules: conditions },
        actions: [form.action],
        active: form.active,
      }, editingId);
      if (saved) setIsOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const entity = triggerEntity(form.triggerType);
  const selectedAction = form.action.type;
  const allowedActions = entity === 'lead'
    ? [
      ['change_status', 'Change Status'], ['change_stage', 'Change Stage'], ['change_priority', 'Change Priority'],
      ['assign_owner', 'Assign Owner'], ['add_tag', 'Add Tag'], ['remove_tag', 'Remove Tag'], ['create_notification', 'Create Notification'],
    ]
    : entity === 'opportunity'
      ? [['update_opportunity_stage', 'Update Opportunity Stage'], ['mark_opportunity_won', 'Mark Opportunity Won'], ['mark_opportunity_lost', 'Mark Opportunity Lost'], ['create_notification', 'Create Notification']]
      : [['create_notification', 'Create Notification']];

  const updateAction = (type) => setForm({
    ...form,
    action: type === 'assign_owner' ? { type, ownerId: activeUser?.id || '', ownerName: activeUser?.name || '' }
      : type === 'create_notification' ? { type, title: '', message: '' }
        : ['mark_opportunity_won', 'mark_opportunity_lost'].includes(type) ? { type }
          : { type, value: '' },
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-xl font-bold text-slate-100 flex items-center gap-2"><Zap className="w-5 h-5 text-amber-400" />Workflow Automation Builder</h1><p className="text-xs text-slate-400 mt-0.5">Configure safe, structured CRM rules. No raw expressions or code execution.</p></div>
        <Button variant="primary" size="md" icon={Plus} onClick={() => openForm(null)}>+ Create Workflow Rule</Button>
      </div>
      <div className="rounded-lg border border-amber-700/50 bg-amber-950/30 p-3 text-xs text-amber-200">
        Rules are stored in Supabase. Event rules execute only after the `process-automation` Edge Function is deployed and configured; time-based overdue scheduling is not configured here.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {automations.map(rule => (
          <article key={rule.id} className="p-5 bg-[#161c28] border border-[#283347] rounded-lg space-y-4">
            <div className="flex items-center justify-between border-b border-[#283347] pb-3"><div><h3 className="text-sm font-bold text-slate-100">{rule.name}</h3><span className="text-[10px] text-slate-400">{rule.triggerType}</span></div><Badge variant={rule.active ? 'emerald' : 'slate'}>{rule.active ? 'Enabled' : 'Draft'}</Badge></div>
            <div className="space-y-2.5 text-xs">
              <FlowNode label="WHEN" text={rule.triggerType} />
              <ArrowDown className="mx-auto h-4 w-4 text-slate-500" />
              <FlowNode label="IF" text={rule.conditions?.rules?.length ? `${rule.conditions.match === 'any' ? 'ANY' : 'ALL'} ${rule.conditions.rules.map(condition => `${leadFields.find(field => field.value === condition.field)?.label || condition.field} ${condition.operator} ${condition.value}`).join('; ')}` : 'No conditions'} />
              <ArrowDown className="mx-auto h-4 w-4 text-slate-500" />
              <FlowNode label="THEN" text={(rule.actions || []).map(action => `${action.type.replaceAll('_', ' ')}${action.value ? `: ${action.value}` : ''}`).join('; ') || 'No action'} />
            </div>
            <div className="flex justify-end gap-2 border-t border-[#283347] pt-2">
              <Button variant="secondary" size="sm" icon={Pencil} onClick={() => openForm(rule)}>Edit</Button>
              <Button variant="danger" size="sm" icon={Trash2} onClick={async () => {
                if (window.confirm(`Delete automation rule "${rule.name}"?`)) await deleteAutomation(rule.id);
              }}>Delete</Button>
            </div>
          </article>
        ))}
        {!automations.length && <p className="col-span-full rounded-lg border border-[#283347] bg-[#161c28] p-8 text-center text-sm text-slate-400">No automation rules configured.</p>}
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editingId ? 'Edit Automation Rule' : 'Create Automation Rule'}>
        <form className="space-y-4" onSubmit={handleSave}>
          <Input label="Rule name" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} required />
          <Input label="Description" value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} />
          <Select label="Trigger" value={form.triggerType} onChange={event => changeTrigger(event.target.value)} options={triggers} />

          {entity === 'lead' && (
            <section className="space-y-3 rounded-md border border-[#283347] p-3">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-300">Match</span>
                <Select value={form.match} onChange={event => setForm({ ...form, match: event.target.value })} options={[{ value: 'all', label: 'ALL conditions (AND)' }, { value: 'any', label: 'ANY condition (OR)' }]} />
                <Button variant="secondary" size="sm" onClick={() => setForm({ ...form, conditions: [...form.conditions, { ...emptyCondition }] })}>Add condition</Button>
              </div>
              {!form.conditions.length && <p className="text-xs text-slate-500">No conditions: the rule applies to every matching event.</p>}
              {form.conditions.map((condition, index) => {
                const field = leadFields.find(item => item.value === condition.field) || leadFields[0];
                const operators = operatorOptions[field.type];
                return (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
                    <Select label="Field" value={field.value} onChange={event => {
                      const nextField = leadFields.find(item => item.value === event.target.value);
                      const next = [...form.conditions];
                      next[index] = { field: nextField.value, operator: operatorOptions[nextField.type][0][0], value: '' };
                      setForm({ ...form, conditions: next });
                    }} options={leadFields.map(item => ({ value: item.value, label: item.label }))} />
                    <Select label="Operator" value={condition.operator} onChange={event => {
                      const next = [...form.conditions];
                      next[index] = { ...condition, operator: event.target.value, value: '' };
                      setForm({ ...form, conditions: next });
                    }} options={operators.map(([value, label]) => ({ value, label }))} />
                    {['is_empty', 'is_not_empty'].includes(condition.operator) ? <span className="text-[11px] text-slate-500">No value</span>
                      : field.type === 'enum' ? <Select label="Value" value={condition.value} onChange={event => {
                        const next = [...form.conditions]; next[index] = { ...condition, value: event.target.value }; setForm({ ...form, conditions: next });
                      }} options={field.options} />
                        : field.type === 'owner' ? <Select label="Value" value={condition.value} onChange={event => {
                          const next = [...form.conditions]; next[index] = { ...condition, value: event.target.value }; setForm({ ...form, conditions: next });
                        }} options={users.map(user => ({ value: user.id, label: user.name }))} />
                          : <Input label="Value" type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'} value={condition.value} onChange={event => {
                            const next = [...form.conditions]; next[index] = { ...condition, value: event.target.value }; setForm({ ...form, conditions: next });
                          }} />}
                    <Button variant="danger" size="sm" onClick={() => setForm({ ...form, conditions: form.conditions.filter((_, row) => row !== index) })}>Remove</Button>
                  </div>
                );
              })}
            </section>
          )}

          <section className="space-y-3 rounded-md border border-[#283347] p-3">
            <Select label="Action" value={selectedAction} onChange={event => updateAction(event.target.value)} options={allowedActions.map(([value, label]) => ({ value, label }))} />
            {['change_status', 'change_stage', 'change_priority'].includes(selectedAction) && (
              <Select label="New value" value={form.action.value || ''} onChange={event => setForm({ ...form, action: { ...form.action, value: event.target.value } })} options={
                selectedAction === 'change_status' ? ['New', 'Contacted', 'Working', 'Qualified', 'Converted', 'Lost']
                  : selectedAction === 'change_stage' ? ['Prospecting', 'Discovery', 'Demo', 'Proposal', 'Negotiation']
                    : ['Low', 'Medium', 'High']
              } />
            )}
            {selectedAction === 'assign_owner' && <Select label="Assign owner" value={form.action.ownerId || ''} onChange={event => {
              const owner = users.find(user => user.id === event.target.value);
              setForm({ ...form, action: { ...form.action, ownerId: event.target.value, ownerName: owner?.name || '' } });
            }} options={users.map(user => ({ value: user.id, label: user.name }))} />}
            {['add_tag', 'remove_tag'].includes(selectedAction) && <Input label="Tag" value={form.action.value || ''} onChange={event => setForm({ ...form, action: { ...form.action, value: event.target.value } })} required />}
            {selectedAction === 'update_opportunity_stage' && <Select label="New stage" value={form.action.value || ''} onChange={event => setForm({ ...form, action: { ...form.action, value: event.target.value } })} options={['Prospecting', 'Discovery', 'Demo', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']} />}
            {selectedAction === 'create_notification' && <><Input label="Notification title" value={form.action.title || ''} onChange={event => setForm({ ...form, action: { ...form.action, title: event.target.value } })} /><Input label="Notification message" value={form.action.message || ''} onChange={event => setForm({ ...form, action: { ...form.action, message: event.target.value } })} /></>}
          </section>
          <label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={form.active} onChange={event => setForm({ ...form, active: event.target.checked })} />Enable after the Edge Function is deployed</label>
          {formError && <p role="alert" className="text-xs text-rose-700">{formError}</p>}
          <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button><Button type="submit" variant="primary" loading={saving}>{editingId ? 'Save Rule' : 'Create Rule'}</Button></div>
        </form>
      </Modal>
    </div>
  );
};

const FlowNode = ({ label, text }) => <div className="p-3 bg-[#121722] border border-[#283347] rounded-md"><span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">{label}</span><p className="font-semibold text-slate-200 mt-0.5">{text}</p></div>;

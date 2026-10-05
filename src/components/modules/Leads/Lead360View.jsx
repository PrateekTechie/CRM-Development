import React, { useState } from 'react';
import { useCRM } from '../../../context/CRMContext';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Tabs } from '../../ui/Tabs';
import { Modal } from '../../ui/Modal';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import {
  User,
  Building2,
  PhoneCall,
  Mail,
  MessageSquare,
  Plus,
  Calendar,
  CheckCircle2,
  Briefcase,
  Clock,
  FileText,
  Tag,
  ArrowLeft,
  Sparkles,
  Award,
  ChevronRight,
  TrendingUp,
  Share2
} from 'lucide-react';

export const Lead360View = () => {
  const {
    leads,
    selectedLeadId,
    setActiveModule,
    activities,
    followUps,
    deals,
    addActivity,
    scheduleFollowUp,
    qualifyLead,
    createOpportunityFromLead,
    addToast
  } = useCRM();

  const [activeTab, setActiveTab] = useState('overview');

  const [isLogActivityModalOpen, setIsLogActivityModalOpen] = useState(false);
  const [isScheduleFollowUpModalOpen, setIsScheduleFollowUpModalOpen] = useState(false);
  const [isQualifyModalOpen, setIsQualifyModalOpen] = useState(false);
  const [isCreateDealModalOpen, setIsCreateDealModalOpen] = useState(false);

  const [newActType, setNewActType] = useState('Phone');
  const [newActDesc, setNewActDesc] = useState('');

  const [newFlwDate, setNewFlwDate] = useState('2026-10-04');
  const [newFlwTime, setNewFlwTime] = useState('10:00 AM');
  const [newFlwNote, setNewFlwNote] = useState('');

  const [dealTitle, setDealTitle] = useState('');
  const [dealValue, setDealValue] = useState('5000');
  const [dealStage, setDealStage] = useState('Discovery');

  const lead = leads.find(l => l.id === selectedLeadId) || leads[0] || {
    id: 'lead-1',
    firstName: 'Rahul',
    lastName: 'Sharma',
    company: 'ABC Technologies',
    email: 'rahul@example.com',
    phone: '+91 9876543210',
    title: 'CTO & VP Engineering',
    status: 'Working',
    stage: 'Discovery',
    priority: 'High',
    score: 82,
    expectedValue: 5000,
    source: 'LinkedIn',
    ownerName: 'Arjun Kapoor',
  };

  const leadActivities = activities.filter(a => a.leadId === lead.id || a.leadName === `${lead.firstName} ${lead.lastName}`);
  const leadFollowups = followUps.filter(f => f.leadId === lead.id || f.leadName === `${lead.firstName} ${lead.lastName}`);
  const leadDeals = deals.filter(d => d.leadId === lead.id || d.company === lead.company);

  const handleLogActivity = () => {
    addActivity({
      leadId: lead.id,
      leadName: `${lead.firstName} ${lead.lastName}`,
      company: lead.company,
      type: newActType,
      description: newActDesc || 'Logged quick communication update.',
    });
    setIsLogActivityModalOpen(false);
    setNewActDesc('');
  };

  const handleScheduleFollowUp = () => {
    scheduleFollowUp({
      leadId: lead.id,
      leadName: `${lead.firstName} ${lead.lastName}`,
      company: lead.company,
      title: `Follow-up with ${lead.firstName}`,
      date: newFlwDate,
      time: newFlwTime,
      notes: newFlwNote || 'Follow-up note',
    });
    setIsScheduleFollowUpModalOpen(false);
    setNewFlwNote('');
  };

  const handleQualifySubmit = () => {
    qualifyLead(lead.id);
    setIsQualifyModalOpen(false);
  };

  const handleCreateDealSubmit = () => {
    createOpportunityFromLead(lead.id, {
      title: dealTitle || `${lead.company} Sales CRM Deal`,
      value: dealValue,
      stage: dealStage,
    });
    setIsCreateDealModalOpen(false);
    setActiveModule('opportunities');
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveModule('leads')}
          className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          Back to Leads Table
        </button>
        <span className="text-xs text-slate-400 font-semibold">Customer 360 Workspace</span>
      </div>

      {/* 360 Header Banner */}
      <div className="bg-[#172033] border border-[#273552] border-l-4 border-l-cyan-500 rounded-lg p-6 space-y-5 shadow-crm-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-white">
                {lead.firstName} {lead.lastName}
              </h1>
              <Badge variant={lead.status.toLowerCase()}>{lead.status}</Badge>
              <Badge variant={lead.priority.toLowerCase()}>{lead.priority} Priority</Badge>
            </div>
            <p className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              {lead.company} • {lead.title || 'CTO'} • Source: <span className="text-cyan-400 font-bold">{lead.source}</span>
            </p>
          </div>

          {/* Quick Actions Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              icon={PhoneCall}
              onClick={() => addToast(`Initiating call to ${lead.phone}...`, 'info')}
            >
              Call
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={Mail}
              onClick={() => addToast(`Opening email compose for ${lead.email}...`, 'info')}
            >
              Email
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={Plus}
              onClick={() => setIsLogActivityModalOpen(true)}
            >
              Log Activity
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={Calendar}
              onClick={() => setIsScheduleFollowUpModalOpen(true)}
            >
              Follow-up
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={CheckCircle2}
              onClick={() => setIsQualifyModalOpen(true)}
            >
              Qualify
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Briefcase}
              onClick={() => {
                setDealTitle(`${lead.company} CRM Deal`);
                setIsCreateDealModalOpen(true);
              }}
            >
              + Create Deal
            </Button>
          </div>

        </div>

        {/* Lead Score & Metrics Banner Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-4 border-t border-[#273552] text-xs">
          <div className="p-3 bg-[#121826] border border-cyan-800/60 rounded-md flex items-center justify-between">
            <div>
              <span className="text-slate-400 font-medium">Lead Intelligence Score</span>
              <p className="text-lg font-extrabold text-cyan-400 mt-0.5">{lead.score || 82} / 100</p>
            </div>
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </div>

          <div className="p-3 bg-[#121826] border border-[#273552] rounded-md">
            <span className="text-slate-400 font-medium">Expected Deal Value</span>
            <p className="text-lg font-extrabold text-emerald-400 mt-0.5">
              ₹{Number(lead.expectedValue || 5000).toLocaleString('en-IN')}
            </p>
          </div>

          <div className="p-3 bg-[#121826] border border-[#273552] rounded-md">
            <span className="text-slate-400 font-medium">Assigned Owner</span>
            <p className="text-sm font-bold text-slate-100 mt-1">{lead.ownerName || 'Arjun Kapoor'}</p>
          </div>

          <div className="p-3 bg-[#121826] border border-[#273552] rounded-md">
            <span className="text-slate-400 font-medium">Next Follow-up</span>
            <p className="text-xs font-bold text-amber-400 mt-1">
              {lead.nextFollowUpDate || 'Tomorrow, 10:00 AM'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'timeline', label: 'Communication Timeline', count: leadActivities.length },
          { id: 'activities', label: 'Activities & Tasks', count: leadFollowups.length },
          { id: 'deals', label: 'Associated Deals', count: leadDeals.length },
          { id: 'notes', label: 'Notes & Specs' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-5">
            {/* Contact & Company Details */}
            <div className="p-5 bg-[#172033] border border-[#273552] rounded-lg space-y-4 shadow-crm-sm">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#273552] pb-2">
                Contact & Company Profile
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Full Name:</span>
                  <span className="font-bold text-slate-100">{lead.firstName} {lead.lastName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Email Address:</span>
                  <span className="font-bold text-cyan-400">{lead.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Phone Number:</span>
                  <span className="font-bold text-slate-100">{lead.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Preferred Contact:</span>
                  <span className="font-bold text-slate-200">{lead.preferredContactMethod || 'Phone'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Company Name:</span>
                  <span className="font-bold text-slate-100">{lead.company}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Industry:</span>
                  <span className="font-bold text-slate-200">{lead.industry || 'Technology'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Company Size:</span>
                  <span className="font-bold text-slate-200">{lead.companySize || '51-200'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Location:</span>
                  <span className="font-bold text-slate-200">{lead.location || 'Bengaluru, India'}</span>
                </div>
              </div>
            </div>

            {/* Requirement Details */}
            <div className="p-5 bg-[#172033] border border-[#273552] rounded-lg space-y-3 shadow-crm-sm">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#273552] pb-2">
                Requirements & Product Interest
              </h3>
              <div className="text-xs space-y-2">
                <p className="text-slate-200 font-bold">Interest: {lead.productInterest}</p>
                <p className="text-slate-300 leading-relaxed font-medium">
                  {lead.requirement || 'Customer expressed interest in unifying sales lead capture, duplicate checks, activity logs, and pipeline tracking.'}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Lead Score Breakdown Card */}
          <div className="space-y-5">
            <div className="p-5 bg-[#172033] border border-cyan-800/60 rounded-lg space-y-4 shadow-crm-sm">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#273552] pb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Lead Score Analysis
                </span>
                <span className="text-cyan-300 font-extrabold">{lead.score || 82}/100</span>
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-[#121826] rounded border border-[#273552]">
                  <span className="text-slate-200 font-semibold">Company Fit Score</span>
                  <span className="font-extrabold text-emerald-400">+25</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-[#121826] rounded border border-[#273552]">
                  <span className="text-slate-200 font-semibold">Decision Maker Job Role</span>
                  <span className="font-extrabold text-emerald-400">+20</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-[#121826] rounded border border-[#273552]">
                  <span className="text-slate-200 font-semibold">Demo Request Triggered</span>
                  <span className="font-extrabold text-emerald-400">+20</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-[#121826] rounded border border-[#273552]">
                  <span className="text-slate-200 font-semibold">Email Engagement</span>
                  <span className="font-extrabold text-emerald-400">+10</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-[#121826] rounded border border-[#273552]">
                  <span className="text-slate-200 font-semibold">Website Activity</span>
                  <span className="font-extrabold text-emerald-400">+7</span>
                </div>
              </div>
            </div>

            {/* Tags Box */}
            <div className="p-5 bg-[#172033] border border-[#273552] rounded-lg space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#273552] pb-2">
                Lead Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {(lead.tags || ['Hot Lead', 'Demo Requested', 'High Value']).map(t => (
                  <span key={t} className="px-2.5 py-1 rounded bg-blue-950 text-blue-300 border border-blue-700 text-xs font-semibold">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT: COMMUNICATION TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="p-6 bg-[#172033] border border-[#273552] rounded-lg space-y-6 shadow-crm-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Chronological Communication Timeline
            </h3>
            <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsLogActivityModalOpen(true)}>
              + Add Communication
            </Button>
          </div>

          <div className="relative pl-6 space-y-6 border-l border-[#273552]">
            {leadActivities.map(act => (
              <div key={act.id} className="relative group">
                <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-blue-500 border-2 border-[#172033]" />
                <div className="p-4 bg-[#121826] border border-[#273552] hover:border-slate-500 rounded-lg transition-all space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      {act.type} • {act.timestamp}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">By {act.performedBy}</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-medium">{act.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: ACTIVITIES */}
      {activeTab === 'activities' && (
        <div className="p-6 bg-[#172033] border border-[#273552] rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Scheduled Follow-up Tasks</h3>
            <Button variant="primary" size="sm" icon={Calendar} onClick={() => setIsScheduleFollowUpModalOpen(true)}>
              + Schedule Task
            </Button>
          </div>

          <div className="space-y-3">
            {leadFollowups.map(flw => (
              <div key={flw.id} className="p-4 bg-[#121826] border border-[#273552] rounded-lg flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{flw.title}</span>
                    <Badge variant={flw.status.toLowerCase()}>{flw.status}</Badge>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 font-medium">Date: {flw.date} at {flw.time}</p>
                  <p className="text-xs text-slate-400 italic mt-1">"{flw.notes}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: DEALS */}
      {activeTab === 'deals' && (
        <div className="p-6 bg-[#172033] border border-[#273552] rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Associated Opportunities</h3>
            <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsCreateDealModalOpen(true)}>
              + Create Deal
            </Button>
          </div>

          <div className="space-y-3">
            {leadDeals.map(d => (
              <div key={d.id} className="p-4 bg-[#121826] border border-[#273552] rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">{d.title}</h4>
                  <p className="text-xs text-slate-300 mt-0.5 font-medium">Stage: <strong className="text-blue-400">{d.stage}</strong> • Win Probability: {d.probability}%</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-emerald-400">₹{d.value?.toLocaleString('en-IN')}</span>
                  <button onClick={() => setActiveModule('opportunities')} className="block text-[11px] text-cyan-400 hover:underline mt-0.5 font-bold">
                    View in Pipeline →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODALS */}
      <Modal isOpen={isLogActivityModalOpen} onClose={() => setIsLogActivityModalOpen(false)} title="Log Communication Activity">
        <div className="space-y-4">
          <Select
            label="Channel / Type"
            value={newActType}
            onChange={(e) => setNewActType(e.target.value)}
            options={['Phone', 'Email', 'LinkedIn', 'WhatsApp', 'Meeting', 'Note', 'Demo']}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-200">Activity Summary & Notes</label>
            <textarea
              rows={4}
              value={newActDesc}
              onChange={(e) => setNewActDesc(e.target.value)}
              placeholder="e.g. Discussed pricing model and agreed to follow up tomorrow..."
              className="w-full bg-[#121826] text-slate-100 text-xs rounded-md border border-[#273552] p-3 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-[#273552]">
            <Button variant="secondary" onClick={() => setIsLogActivityModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleLogActivity}>Save Activity</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isScheduleFollowUpModalOpen} onClose={() => setIsScheduleFollowUpModalOpen(false)} title="Schedule Next Follow-up">
        <div className="space-y-4">
          <Input label="Follow-up Date" type="date" value={newFlwDate} onChange={(e) => setNewFlwDate(e.target.value)} />
          <Input label="Time" value={newFlwTime} onChange={(e) => setNewFlwTime(e.target.value)} />
          <Input label="Instruction / Task Note" value={newFlwNote} onChange={(e) => setNewFlwNote(e.target.value)} placeholder="e.g. Call Rahul to review proposal specs." />
          <div className="flex justify-end gap-2 pt-2 border-t border-[#273552]">
            <Button variant="secondary" onClick={() => setIsScheduleFollowUpModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleScheduleFollowUp}>Schedule Task</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isQualifyModalOpen} onClose={() => setIsQualifyModalOpen(false)} title="Qualify Lead (BANT Check)">
        <div className="space-y-4">
          <p className="text-xs text-slate-300 font-medium">Verify lead qualification criteria before advancing status:</p>
          <div className="space-y-2 text-xs">
            <label className="flex items-center gap-2 p-2 bg-[#121826] rounded border border-[#273552] font-semibold text-slate-200">
              <input type="checkbox" defaultChecked className="rounded text-blue-600" />
              <span>Budget Verified (₹5,000+)</span>
            </label>
            <label className="flex items-center gap-2 p-2 bg-[#121826] rounded border border-[#273552] font-semibold text-slate-200">
              <input type="checkbox" defaultChecked className="rounded text-blue-600" />
              <span>Authority Verified (CTO / VP Level)</span>
            </label>
            <label className="flex items-center gap-2 p-2 bg-[#121826] rounded border border-[#273552] font-semibold text-slate-200">
              <input type="checkbox" defaultChecked className="rounded text-blue-600" />
              <span>Requirement Matched (Sales CRM)</span>
            </label>
            <label className="flex items-center gap-2 p-2 bg-[#121826] rounded border border-[#273552] font-semibold text-slate-200">
              <input type="checkbox" defaultChecked className="rounded text-blue-600" />
              <span>Timeline Defined (Close by Oct 2026)</span>
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-[#273552]">
            <Button variant="secondary" onClick={() => setIsQualifyModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleQualifySubmit}>Qualify Lead Now</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isCreateDealModalOpen} onClose={() => setIsCreateDealModalOpen(false)} title="Create Pipeline Opportunity">
        <div className="space-y-4">
          <Input label="Opportunity Title" value={dealTitle} onChange={(e) => setDealTitle(e.target.value)} />
          <Input label="Deal Value (₹)" value={dealValue} onChange={(e) => setDealValue(e.target.value)} />
          <Select label="Pipeline Stage" value={dealStage} onChange={(e) => setDealStage(e.target.value)} options={['Prospecting', 'Discovery', 'Demo', 'Proposal', 'Negotiation']} />
          <div className="flex justify-end gap-2 pt-2 border-t border-[#273552]">
            <Button variant="secondary" onClick={() => setIsCreateDealModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateDealSubmit}>Create Deal & Open Pipeline</Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

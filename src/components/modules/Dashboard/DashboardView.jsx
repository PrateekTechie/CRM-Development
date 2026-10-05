import React from 'react';
import { useCRM } from '../../../context/CRMContext';
import { KpiCard } from '../../ui/KpiCard';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import {
  Users,
  UserPlus,
  CheckCircle2,
  Briefcase,
  DollarSign,
  Trophy,
  ArrowUpRight,
  Clock,
  PhoneCall,
  Calendar,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Share2,
  Award,
  Sparkles
} from 'lucide-react';

export const DashboardView = () => {
  const {
    leads,
    deals,
    followUps,
    activities,
    activeUser,
    viewLead360,
    setActiveModule,
    setIsAddLeadOpen,
    completeFollowUp
  } = useCRM();

  // Metric Computations
  const totalLeads = leads.length;
  const newLeads = leads.filter(l => l.status === 'New').length;
  const workingLeads = leads.filter(l => l.status === 'Working').length;
  const qualifiedLeads = leads.filter(l => l.status === 'Qualified').length;
  
  const totalPipelineValue = deals.reduce((acc, d) => acc + (d.value || 0), 0);
  const wonDealsValue = deals.filter(d => d.stage === 'Won').reduce((acc, d) => acc + (d.value || 0), 680000);

  const todaysFollowups = followUps.filter(f => f.status === 'Upcoming' || f.status === 'Overdue').slice(0, 4);
  const recentLeads = leads.slice(0, 5);

  // Funnel stages with controlled accents
  const funnelStages = [
    { label: 'New Leads', count: newLeads || 4, color: 'bg-blue-500' },
    { label: 'Contacted', count: 6, color: 'bg-cyan-500' },
    { label: 'Working', count: workingLeads || 8, color: 'bg-amber-500' },
    { label: 'Qualified', count: qualifiedLeads || 5, color: 'bg-emerald-500' },
    { label: 'Opportunity', count: deals.length, color: 'bg-violet-500' },
    { label: 'Won', count: 3, color: 'bg-emerald-400' },
  ];

  // Lead Sources breakdown
  const leadSources = [
    { name: 'LinkedIn', count: leads.filter(l => l.source === 'LinkedIn').length || 12, percent: '38%', color: 'bg-blue-500' },
    { name: 'Website Inbound', count: leads.filter(l => l.source === 'Website').length || 8, percent: '25%', color: 'bg-cyan-500' },
    { name: 'Referral', count: leads.filter(l => l.source === 'Referral').length || 5, percent: '16%', color: 'bg-violet-500' },
    { name: 'Email Campaign', count: leads.filter(l => l.source === 'Email').length || 4, percent: '13%', color: 'bg-amber-500' },
    { name: 'Events & Trade', count: 3, percent: '8%', color: 'bg-emerald-500' },
  ];

  // Leaderboard data
  const performers = [
    { name: 'Arjun Kapoor', role: 'Senior Exec', won: '₹6,80,000', leadsCount: 14, dealsCount: 3, avatar: 'AK' },
    { name: 'Ananya Roy', role: 'Enterprise Exec', won: '₹4,50,000', leadsCount: 10, dealsCount: 2, avatar: 'AR' },
    { name: 'Vikram Malhotra', role: 'Sales Exec', won: '₹2,20,000', leadsCount: 8, dealsCount: 1, avatar: 'VM' },
    { name: 'Priya Sharma', role: 'Sales Manager', won: '₹1,80,000', leadsCount: 6, dealsCount: 1, avatar: 'PS' },
  ];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Hero Banner with Accent Line */}
      <div className="bg-indigo-50 border border-indigo-100 border-l-4 border-l-indigo-700 p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-crm-sm">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            Good afternoon, {activeUser.name.split(' ')[0]} 👋
          </h1>
          <p className="text-xs text-slate-300 mt-1 font-medium">
            Here's what's happening with your leads and pipeline performance today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="md" onClick={() => setActiveModule('reports')}>
            View Analytics
          </Button>
          <Button variant="primary" size="md" icon={UserPlus} onClick={() => setIsAddLeadOpen(true)}>
            + Add Lead
          </Button>
        </div>
      </div>

      {/* Top KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
        <KpiCard
          title="Total Leads"
          value="1,248"
          trend="up"
          trendText="+12%"
          comparisonText="vs last month"
          icon={Users}
          accentColor="blue"
          onClick={() => setActiveModule('leads')}
        />
        <KpiCard
          title="New Leads"
          value="186"
          trend="up"
          trendText="+8%"
          comparisonText="this week"
          icon={UserPlus}
          accentColor="cyan"
          onClick={() => setActiveModule('leads')}
        />
        <KpiCard
          title="Qualified Leads"
          value="74"
          trend="up"
          trendText="+15%"
          comparisonText="conversion"
          icon={CheckCircle2}
          accentColor="emerald"
          onClick={() => setActiveModule('leads')}
        />
        <KpiCard
          title="Open Opportunities"
          value={deals.length}
          trend="up"
          trendText="+5"
          comparisonText="active deals"
          icon={Briefcase}
          accentColor="violet"
          onClick={() => setActiveModule('opportunities')}
        />
        <KpiCard
          title="Pipeline Value"
          value={`₹${(totalPipelineValue / 100000).toFixed(1)}L`}
          trend="up"
          trendText="+18%"
          comparisonText="total pipeline"
          icon={DollarSign}
          accentColor="violet"
          badgeText="Active"
          onClick={() => setActiveModule('opportunities')}
        />
        <KpiCard
          title="Won Deals"
          value={`₹${(wonDealsValue / 100000).toFixed(1)}L`}
          trend="up"
          trendText="+22%"
          comparisonText="target 85%"
          icon={Trophy}
          accentColor="emerald"
          badgeText="Target"
          onClick={() => setActiveModule('opportunities')}
        />
      </div>

      {/* Grid Row 2: Funnel + Lead Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Lead Funnel */}
        <div className="lg:col-span-2 bg-[#172033] border border-[#273552] border-t-2 border-t-cyan-500 rounded-lg p-5 flex flex-col justify-between shadow-crm-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Lead Conversion Funnel
              </h3>
              <p className="text-[11px] text-slate-300 font-medium">Progression from lead capture to won deals</p>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-700/60 px-2.5 py-1 rounded">
              Overall Conv: 18.4%
            </span>
          </div>

          {/* Visual Funnel Bar */}
          <div className="space-y-3 my-2">
            {funnelStages.map((stage, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-200">
                  <span>{stage.label}</span>
                  <span className="text-slate-300">{stage.count} records</span>
                </div>
                <div className="w-full bg-[#121826] h-2.5 rounded-full overflow-hidden border border-[#273552]">
                  <div
                    className={`h-full ${stage.color} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.max(20, 100 - (idx * 14))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#273552] flex items-center justify-between text-[11px] text-slate-300">
            <span>Data updated real-time from workspace state</span>
            <button onClick={() => setActiveModule('reports')} className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold">
              View Detailed Analytics <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Lead Sources breakdown */}
        <div className="bg-[#172033] border border-[#273552] border-t-2 border-t-violet-500 rounded-lg p-5 flex flex-col justify-between shadow-crm-sm">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Share2 className="w-4 h-4 text-violet-400" />
              Lead Sources
            </h3>
            <p className="text-[11px] text-slate-300 font-medium mt-0.5">Primary acquisition channels</p>
            
            <div className="space-y-3.5 mt-4">
              {leadSources.map((src, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-200">{src.name}</span>
                    <span className="text-slate-300">{src.count} ({src.percent})</span>
                  </div>
                  <div className="w-full bg-[#121826] h-2 rounded-full overflow-hidden border border-[#273552]">
                    <div
                      className={`h-full ${src.color}`}
                      style={{ width: src.percent }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#273552] text-center mt-4">
            <span className="text-[11px] text-slate-300">
              Top channel: <strong className="text-cyan-400">LinkedIn (38%)</strong>
            </span>
          </div>
        </div>

      </div>

      {/* Grid Row 3: Follow-ups + Recent Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Today's Follow-ups Widget */}
        <div className="bg-[#172033] border border-[#273552] border-t-2 border-t-amber-500 rounded-lg p-5 space-y-4 shadow-crm-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              Today's Scheduled Follow-ups
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setActiveModule('followups')}>
              View All
            </Button>
          </div>

          <div className="space-y-2.5">
            {todaysFollowups.map(flw => (
              <div
                key={flw.id}
                className="p-3 bg-[#121826] border border-[#273552] hover:border-slate-500 rounded-md transition-all flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white">{flw.leadName}</span>
                    <Badge variant={flw.priority.toLowerCase()}>{flw.priority}</Badge>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">{flw.company} • {flw.time}</p>
                  <p className="text-[11px] text-slate-300 italic mt-1">"{flw.notes}"</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={CheckCircle2}
                  onClick={() => completeFollowUp(flw.id)}
                >
                  Done
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Leads Table Snippet */}
        <div className="lg:col-span-2 bg-[#172033] border border-[#273552] border-t-2 border-t-blue-500 rounded-lg p-5 space-y-4 shadow-crm-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                Recent Leads
              </h3>
              <p className="text-[11px] text-slate-300 font-medium">Newly captured prospects in your workspace</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setActiveModule('leads')}>
              Open Leads Workspace <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#273552] text-slate-300 font-bold bg-[#111726]">
                  <th className="py-2.5 px-3 font-bold">Lead</th>
                  <th className="py-2.5 px-3 font-bold">Company</th>
                  <th className="py-2.5 px-3 font-bold">Source</th>
                  <th className="py-2.5 px-3 font-bold">Status</th>
                  <th className="py-2.5 px-3 font-bold">Expected Value</th>
                  <th className="py-2.5 px-3 font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#273552]">
                {recentLeads.map(lead => (
                  <tr
                    key={lead.id}
                    onClick={() => viewLead360(lead.id)}
                    className="hover:bg-[#1d283e] cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3 font-bold text-white">
                      {lead.firstName} {lead.lastName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-200 font-medium">{lead.company}</td>
                    <td className="py-2.5 px-3 text-cyan-400 font-semibold">{lead.source}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant={lead.status.toLowerCase()}>{lead.status}</Badge>
                    </td>
                    <td className="py-2.5 px-3 font-extrabold text-emerald-400">
                      ₹{lead.expectedValue?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          viewLead360(lead.id);
                        }}
                        className="text-blue-400 hover:text-blue-300 font-bold"
                      >
                        View 360 →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Grid Row 4: Salesperson Performance Leaderboard */}
      <div className="bg-[#172033] border border-[#273552] border-t-2 border-t-emerald-500 rounded-lg p-5 shadow-crm-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              Salesperson Performance Leaderboard
            </h3>
            <p className="text-[11px] text-slate-300 font-medium">Monthly revenue targets and active lead assignment</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {performers.map((p, i) => (
            <div key={i} className="p-4 bg-[#121826] border border-[#273552] rounded-lg flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-950 border border-blue-600 text-blue-300 font-extrabold flex items-center justify-center text-sm shrink-0">
                {p.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white truncate">{p.name}</h4>
                  <span className="text-[10px] font-bold text-amber-400">#{i + 1}</span>
                </div>
                <p className="text-[11px] text-slate-400">{p.role}</p>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-slate-300">Won: <strong className="text-emerald-400">{p.won}</strong></span>
                  <span className="text-slate-400">{p.leadsCount} leads</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

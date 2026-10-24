import React from 'react';
import { useCRM } from '../../../context/CRMContext';
import { KpiCard } from '../../ui/KpiCard';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { formatFollowUpDate } from '../../../lib/dateUtils';
import { formatInrCurrency } from '../../../lib/currencyUtils';
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
  FileText,
  Share2,
  Award,
  Sparkles
} from 'lucide-react';

export const DashboardView = () => {
  const {
    leads,
    deals,
    activities,
    followUps,
    users,
    activeUser,
    leadsLoading,
    leadsError,
    reloadCrmData,
    viewLead360,
    setActiveModule,
    setIsAddLeadOpen,
    completeFollowUp
  } = useCRM();

  if (leadsLoading) {
    return (
      <div className="rounded-lg border border-[#273552] bg-[#172033] p-5 text-xs text-slate-300" role="status">
        Loading dashboard data...
      </div>
    );
  }

  if (leadsError) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-lg border border-rose-800/60 bg-rose-950/40 p-4 text-xs text-rose-200" role="alert">
        <span>Dashboard data is unavailable: {leadsError}</span>
        <Button variant="secondary" size="sm" onClick={reloadCrmData}>Retry</Button>
      </div>
    );
  }

  // Metric Computations
  const totalLeads = leads.length;
  const newLeads = leads.filter(l => l.status === 'New').length;
  const contactedLeads = leads.filter(l => l.status === 'Contacted').length;
  const workingLeads = leads.filter(l => l.status === 'Working').length;
  const qualifiedLeads = leads.filter(l => l.status === 'Qualified').length;
  const openDeals = deals.filter(deal => deal.stage !== 'Won' && deal.stage !== 'Lost');
  const totalPipelineValue = openDeals.reduce((acc, deal) => acc + Number(deal.value || 0), 0);
  const wonDeals = deals.filter(deal => deal.stage === 'Won');
  const wonDealsValue = wonDeals.reduce((acc, deal) => acc + Number(deal.value || 0), 0);
  const convertedLeads = leads.filter(lead => lead.status === 'Converted').length;
  const conversionRate = totalLeads ? (convertedLeads / totalLeads * 100) : 0;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todaysFollowups = followUps
    .filter(item => !['Completed', 'Cancelled'].includes(item.status) && item.date === today)
    .slice(0, 4);
  const overdueFollowups = followUps
    .filter(item => !['Completed', 'Cancelled'].includes(item.status) && item.date && item.date < today)
    .sort((left, right) => left.date.localeCompare(right.date));
  const recentLeads = leads.slice(0, 5);
  const sentQuotationStatuses = new Set(['Sent', 'Under Review', 'Accepted', 'Rejected', 'Expired']);
  const sentQuotations = leads.filter(lead => sentQuotationStatuses.has(lead.quotationStatus));
  const pricedSentQuotations = sentQuotations.filter(lead => (
    lead.quotationValue !== null
    && lead.quotationValue !== undefined
    && lead.quotationValue !== ''
    && Number.isFinite(Number(lead.quotationValue))
  ));
  const sentQuotationValue = pricedSentQuotations.reduce((sum, lead) => sum + Number(lead.quotationValue), 0);
  const currentMonth = today.slice(0, 7);
  const closingOpportunities = deals
    .filter(deal => deal.expectedCloseDate?.slice(0, 7) === currentMonth)
    .filter(deal => !['Won', 'Lost', 'Closed Won', 'Closed Lost'].includes(deal.stage)
      && !['Won', 'Lost', 'Closed Won', 'Closed Lost'].includes(deal.status))
    .sort((left, right) => left.expectedCloseDate.localeCompare(right.expectedCloseDate));
  const leadsById = new Map(leads.map(lead => [lead.id, lead]));
  const closingQuotationLeadIds = new Set();
  const closingQuotationValues = [];
  const closingOpportunityRows = closingOpportunities.map(opportunity => {
    const linkedLead = leadsById.get(opportunity.leadId);
    const quotationValue = linkedLead?.quotationValue;
    let showQuotationValue = false;
    if (
      linkedLead
      && !closingQuotationLeadIds.has(linkedLead.id)
      && quotationValue !== null
      && quotationValue !== undefined
      && quotationValue !== ''
      && Number.isFinite(Number(quotationValue))
    ) {
      closingQuotationLeadIds.add(linkedLead.id);
      closingQuotationValues.push(Number(quotationValue));
      showQuotationValue = true;
    }
    return { opportunity, linkedLead, showQuotationValue };
  });
  const closingQuotationTotal = closingQuotationValues.reduce((sum, amount) => sum + amount, 0);
  const recentCommunication = activities.slice(0, 5);

  const funnelStages = [
    { label: 'New Leads', count: newLeads, color: 'bg-blue-500' },
    { label: 'Contacted', count: contactedLeads, color: 'bg-cyan-500' },
    { label: 'Working', count: workingLeads, color: 'bg-amber-500' },
    { label: 'Qualified', count: qualifiedLeads, color: 'bg-emerald-500' },
    { label: 'Open Opportunities', count: openDeals.length, color: 'bg-violet-500' },
    { label: 'Won Opportunities', count: wonDeals.length, color: 'bg-emerald-400' },
  ];

  const sourceColors = ['bg-blue-500', 'bg-cyan-500', 'bg-violet-500', 'bg-amber-500', 'bg-emerald-500'];
  const leadSources = [...new Set(leads.map(lead => lead.source).filter(Boolean))]
    .map((name, index) => {
      const count = leads.filter(lead => lead.source === name).length;
      const wonCount = leads.filter(lead => lead.source === name && lead.status === 'Converted').length;
      return {
        name,
        count,
        percent: totalLeads ? `${Math.round(count / totalLeads * 100)}%` : '0%',
        conversion: count ? `${Math.round(wonCount / count * 100)}%` : '0%',
        color: sourceColors[index % sourceColors.length],
      };
    }).sort((left, right) => right.count - left.count);
  const topSource = leadSources[0];

  const performers = users.map(user => {
    const userLeads = leads.filter(lead => lead.ownerId === user.id);
    const userWonDeals = wonDeals.filter(deal => deal.ownerId === user.id);
    return {
      id: user.id,
      name: user.name,
      role: user.role,
      won: userWonDeals.reduce((sum, deal) => sum + Number(deal.value || 0), 0),
      leadsCount: userLeads.length,
      dealsCount: userWonDeals.length,
      avatar: user.avatar,
    };
  }).sort((left, right) => right.won - left.won);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Hero Banner with Accent Line */}
      <div className="bg-indigo-50 border border-indigo-100 border-l-4 border-l-indigo-700 p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-crm-sm">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            Welcome, {activeUser?.name?.split(' ')[0] || 'there'}
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
          value={totalLeads.toLocaleString()}
          icon={Users}
          accentColor="blue"
          onClick={() => setActiveModule('leads')}
        />
        <KpiCard
          title="New Leads"
          value={newLeads.toLocaleString()}
          icon={UserPlus}
          accentColor="cyan"
          onClick={() => setActiveModule('leads')}
        />
        <KpiCard
          title="Qualified Leads"
          value={qualifiedLeads.toLocaleString()}
          icon={CheckCircle2}
          accentColor="emerald"
          onClick={() => setActiveModule('leads')}
        />
        <KpiCard
          title="Open Opportunities"
          value={openDeals.length}
          comparisonText="open opportunities"
          icon={Briefcase}
          accentColor="violet"
          onClick={() => setActiveModule('opportunities')}
        />
        <KpiCard
          title="Pipeline Value"
          value={`₹${(totalPipelineValue / 100000).toFixed(1)}L`}
          comparisonText="open pipeline value"
          icon={DollarSign}
          accentColor="violet"
          badgeText="Active"
          onClick={() => setActiveModule('opportunities')}
        />
        <KpiCard
          title="Won Deals"
          value={`₹${(wonDealsValue / 100000).toFixed(1)}L`}
          comparisonText={`${wonDeals.length} closed won`}
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
              Overall Conv: {conversionRate.toFixed(1)}%
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
                    style={{ width: `${totalLeads ? Math.max(0, stage.count / totalLeads * 100) : 0}%` }}
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
              Top channel: <strong className="text-cyan-400">{topSource ? `${topSource.name} (${topSource.percent})` : 'No lead sources yet'}</strong>
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
                    <Badge variant={String(flw.priority ?? 'Medium').toLowerCase()}>
                      {flw.priority ?? 'Medium'}
                    </Badge>
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
            {todaysFollowups.length === 0 && (
              <p className="rounded-md border border-[#273552] bg-[#121826] p-3 text-xs text-slate-400">
                No follow-ups due today.
              </p>
            )}
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

      {/* HR Dashboard Monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-[#172033] border border-[#273552] border-t-2 border-t-cyan-500 rounded-lg p-5 space-y-4 shadow-crm-sm">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              Quotations Sent
            </h3>
            <p className="text-[11px] text-slate-300 font-medium mt-0.5">Sent and subsequently decided quotations</p>
          </div>
          {sentQuotations.length ? (
            <div className="space-y-2">
              <p className="text-2xl font-extrabold text-white">{sentQuotations.length}</p>
              <p className="text-xs text-slate-300">
                Total quotation value: <strong className="text-cyan-300">{pricedSentQuotations.length ? formatInrCurrency(sentQuotationValue) : '—'}</strong>
              </p>
              {sentQuotations.length > pricedSentQuotations.length && (
                <p className="text-[11px] text-amber-300">
                  {sentQuotations.length - pricedSentQuotations.length} sent quotation(s) have no value recorded.
                </p>
              )}
            </div>
          ) : (
            <p className="rounded-md border border-[#273552] bg-[#121826] p-3 text-xs text-slate-400">
              No sent quotations.
            </p>
          )}
        </div>

        <div className="bg-[#172033] border border-[#273552] border-t-2 border-t-violet-500 rounded-lg p-5 space-y-4 shadow-crm-sm">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-violet-400" />
              Quotations Closing This Month
            </h3>
            <p className="text-[11px] text-slate-300 font-medium mt-0.5">
              {closingOpportunities.length} open opportunity(ies) • Associated quotation value: {closingQuotationValues.length ? formatInrCurrency(closingQuotationTotal) : '—'}
            </p>
            {closingQuotationValues.length > 0 && (
              <p className="text-[10px] text-slate-400 mt-1">Each linked lead quotation is counted once.</p>
            )}
          </div>
          {closingOpportunityRows.length ? (
            <div className="space-y-2.5">
              {closingOpportunityRows.slice(0, 5).map(({ opportunity, linkedLead, showQuotationValue }) => (
                <button
                  type="button"
                  key={opportunity.id}
                  onClick={() => linkedLead ? viewLead360(linkedLead.id) : setActiveModule('opportunities')}
                  className="w-full rounded-md border border-[#273552] bg-[#121826] p-3 text-left hover:border-slate-500"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-white">
                      {linkedLead ? `${linkedLead.firstName} ${linkedLead.lastName}`.trim() : opportunity.contactName || opportunity.title}
                    </span>
                    <span className="shrink-0 text-[10px] text-slate-300">{formatFollowUpDate(opportunity.expectedCloseDate)}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {opportunity.title} • {opportunity.status || opportunity.stage || 'Open'}
                    {linkedLead ? ` • Quote: ${linkedLead.quotationStatus || 'Not Sent'}` : ' • No linked lead quotation'}
                  </p>
                  {linkedLead && (
                    <p className="mt-1 text-[11px] text-cyan-300">
                      {showQuotationValue ? formatInrCurrency(linkedLead.quotationValue) : linkedLead.quotationValue !== null && linkedLead.quotationValue !== undefined && linkedLead.quotationValue !== '' ? 'Included above' : 'No quotation value'}
                    </p>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <p className="rounded-md border border-[#273552] bg-[#121826] p-3 text-xs text-slate-400">
              No open opportunities are expected to close this month.
            </p>
          )}
        </div>

        <div className="bg-[#172033] border border-[#273552] border-t-2 border-t-rose-500 rounded-lg p-5 space-y-4 shadow-crm-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Overdue Activities
              </h3>
              <p className="text-[11px] text-slate-300 font-medium mt-0.5">{overdueFollowups.length} pending follow-up(s)</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setActiveModule('followups')}>View All</Button>
          </div>
          {overdueFollowups.length ? (
            <div className="space-y-2.5">
              {overdueFollowups.slice(0, 4).map(item => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border border-[#273552] bg-[#121826] p-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-white">{item.title || item.leadName || 'Follow-up task'}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{item.leadName || item.company || 'Lead not linked'} • Due {formatFollowUpDate(item.date)}</p>
                  </div>
                  <Button variant="secondary" size="sm" icon={CheckCircle2} onClick={() => completeFollowUp(item.id)}>
                    Done
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-md border border-[#273552] bg-[#121826] p-3 text-xs text-slate-400">
              No overdue activities.
            </p>
          )}
        </div>
      </div>

      <div className="bg-[#172033] border border-[#273552] border-t-2 border-t-blue-500 rounded-lg p-5 space-y-4 shadow-crm-sm">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-blue-400" />
            Recent Communication
          </h3>
          <p className="text-[11px] text-slate-300 font-medium mt-0.5">Latest logged activity records</p>
        </div>
        {recentCommunication.length ? (
          <div className="space-y-2">
            {recentCommunication.map(activity => (
              <div key={activity.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#273552] bg-[#121826] p-3">
                <div>
                  <p className="text-xs font-bold text-white">{activity.subject || activity.type}</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {activity.leadName || activity.company || 'CRM record'} • {activity.performedBy || 'Team member'}
                  </p>
                </div>
                <span className="text-[11px] text-slate-300">{activity.timestamp || 'Time unavailable'}</span>
                {activity.description && <p className="w-full text-[11px] text-slate-300">{activity.description}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-md border border-[#273552] bg-[#121826] p-3 text-xs text-slate-400">
            No communication activities have been logged.
          </p>
        )}
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
            <div key={p.id} className="p-4 bg-[#121826] border border-[#273552] rounded-lg flex items-center gap-3">
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
                  <span className="text-slate-300">Won: <strong className="text-emerald-400">₹{p.won.toLocaleString('en-IN')}</strong></span>
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

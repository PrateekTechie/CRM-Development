import React, { useMemo } from 'react';
import { useCRM } from '../../../context/CRMContext';
import { Button } from '../../ui/Button';
import { BarChart3, TrendingUp, Download, DollarSign, CheckCircle2, Users } from 'lucide-react';

const formatCurrency = amount => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

export const ReportsView = () => {
  const { leads, deals, followUps, users, addToast } = useCRM();
  const openDeals = deals.filter(deal => !['Won', 'Lost'].includes(deal.stage));
  const pipelineValue = openDeals.reduce((sum, deal) => sum + Number(deal.value || 0), 0);
  const weightedPipeline = openDeals.reduce((sum, deal) => sum + Number(deal.value || 0) * Number(deal.probability || 0) / 100, 0);
  const wonRevenue = deals.filter(deal => deal.stage === 'Won').reduce((sum, deal) => sum + Number(deal.value || 0), 0);
  const lostRevenue = deals.filter(deal => deal.stage === 'Lost').reduce((sum, deal) => sum + Number(deal.value || 0), 0);
  const convertedCount = leads.filter(lead => lead.status === 'Converted').length;
  const conversionRate = leads.length ? convertedCount / leads.length * 100 : 0;
  const completedFollowUps = followUps.filter(item => item.status === 'Completed').length;
  const followUpRate = followUps.length ? completedFollowUps / followUps.length * 100 : 0;

  const sourceStats = useMemo(() => [...new Set(leads.map(lead => lead.source || 'Unspecified'))].map(source => {
    const sourceLeads = leads.filter(lead => (lead.source || 'Unspecified') === source);
    const converted = sourceLeads.filter(lead => lead.status === 'Converted').length;
    return { source, total: sourceLeads.length, converted, conversion: sourceLeads.length ? converted / sourceLeads.length * 100 : 0 };
  }).sort((left, right) => right.total - left.total), [leads]);

  const stageStats = useMemo(() => ['Prospecting', 'Discovery', 'Demo', 'Proposal', 'Negotiation'].map(stage => {
    const stageDeals = openDeals.filter(deal => deal.stage === stage);
    return {
      stage,
      count: stageDeals.length,
      value: stageDeals.reduce((sum, deal) => sum + Number(deal.value || 0), 0),
    };
  }), [deals]);

  const ownerStats = useMemo(() => users.map(user => {
    const ownedLeads = leads.filter(lead => lead.ownerId === user.id);
    const wonDeals = deals.filter(deal => deal.ownerId === user.id && deal.stage === 'Won');
    return {
      name: user.name,
      leads: ownedLeads.length,
      converted: ownedLeads.filter(lead => lead.status === 'Converted').length,
      wonRevenue: wonDeals.reduce((sum, deal) => sum + Number(deal.value || 0), 0),
    };
  }).sort((left, right) => right.wonRevenue - left.wonRevenue), [deals, leads, users]);

  const exportReport = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Total leads', leads.length],
      ['Qualified leads', leads.filter(lead => lead.status === 'Qualified').length],
      ['Converted leads', convertedCount],
      ['Lead conversion rate', `${conversionRate.toFixed(1)}%`],
      ['Open pipeline value', pipelineValue],
      ['Weighted pipeline', weightedPipeline.toFixed(2)],
      ['Won revenue', wonRevenue],
      ['Lost revenue', lostRevenue],
      ['Follow-up completion rate', `${followUpRate.toFixed(1)}%`],
      ...sourceStats.map(item => [`Source: ${item.source}`, `${item.total} leads; ${item.converted} converted`]),
      ...ownerStats.map(item => [`Owner: ${item.name}`, `${item.leads} leads; ${item.wonRevenue} won revenue`]),
    ];
    const csv = rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `Leadwise_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    addToast('Report exported as CSV.');
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-xl font-bold text-slate-100 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-400" />Analytics & Sales Reports</h1><p className="text-xs text-slate-400 mt-0.5">Metrics calculated from records available to your account.</p></div>
        <Button variant="outline" size="md" icon={Download} onClick={exportReport}>Export CSV</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric icon={Users} label="Leads" value={leads.length} detail={`${leads.filter(lead => lead.status === 'Qualified').length} qualified`} />
        <Metric icon={TrendingUp} label="Conversion Rate" value={`${conversionRate.toFixed(1)}%`} detail={`${convertedCount} converted`} />
        <Metric icon={DollarSign} label="Open Pipeline" value={formatCurrency(pipelineValue)} detail={`Weighted ${formatCurrency(weightedPipeline)}`} />
        <Metric icon={CheckCircle2} label="Follow-ups Completed" value={`${followUpRate.toFixed(1)}%`} detail={`${completedFollowUps} of ${followUps.length}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="p-5 bg-[#161c28] border border-[#283347] rounded-lg space-y-4">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-400" />Lead Conversion by Source</h2>
          <ReportTable headers={['Source', 'Leads', 'Converted', 'Conversion']} rows={sourceStats.map(item => [item.source, item.total, item.converted, `${item.conversion.toFixed(1)}%`])} empty="No lead-source data." />
        </section>
        <section className="p-5 bg-[#161c28] border border-[#283347] rounded-lg space-y-4">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2"><DollarSign className="w-4 h-4 text-amber-400" />Pipeline by Stage</h2>
          <ReportTable headers={['Stage', 'Opportunities', 'Value']} rows={stageStats.map(item => [item.stage, item.count, formatCurrency(item.value)])} empty="No open opportunities." />
        </section>
        <section className="p-5 bg-[#161c28] border border-[#283347] rounded-lg space-y-4">
          <h2 className="text-sm font-bold text-slate-100">Closed Revenue</h2>
          <div className="grid grid-cols-2 gap-3"><div className="rounded bg-[#121722] p-4"><p className="text-xs text-slate-400">Closed Won</p><p className="mt-1 font-bold text-emerald-400">{formatCurrency(wonRevenue)}</p></div><div className="rounded bg-[#121722] p-4"><p className="text-xs text-slate-400">Closed Lost</p><p className="mt-1 font-bold text-rose-400">{formatCurrency(lostRevenue)}</p></div></div>
        </section>
        <section className="p-5 bg-[#161c28] border border-[#283347] rounded-lg space-y-4">
          <h2 className="text-sm font-bold text-slate-100">Owner Performance</h2>
          <ReportTable headers={['Owner', 'Leads', 'Converted', 'Won Revenue']} rows={ownerStats.map(item => [item.name, item.leads, item.converted, formatCurrency(item.wonRevenue)])} empty="No owner data available." />
        </section>
      </div>
    </div>
  );
};

const Metric = ({ icon: Icon, label, value, detail }) => (
  <div className="p-4 bg-[#161c28] border border-[#283347] rounded-lg"><div className="flex items-center justify-between"><span className="text-xs text-slate-400">{label}</span><Icon className="h-4 w-4 text-cyan-400" /></div><p className="mt-2 text-lg font-bold text-slate-100">{value}</p><p className="mt-1 text-[11px] text-slate-400">{detail}</p></div>
);

const ReportTable = ({ headers, rows, empty }) => (
  rows.length ? <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b border-[#283347] text-slate-400">{headers.map(header => <th key={header} className="py-2 pr-4">{header}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex} className="border-b border-[#283347]/60 text-slate-200">{row.map((cell, cellIndex) => <td key={cellIndex} className="py-2 pr-4">{cell}</td>)}</tr>)}</tbody></table></div>
    : <p className="text-xs text-slate-400">{empty}</p>
);

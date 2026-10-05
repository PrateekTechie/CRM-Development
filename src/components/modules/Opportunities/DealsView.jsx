import React, { useState } from 'react';
import { useCRM } from '../../../context/CRMContext';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Briefcase, DollarSign, ArrowRight, ArrowLeft, Trophy, CheckCircle2, XCircle } from 'lucide-react';

export const DealsView = () => {
  const { deals, moveDealStage, viewLead360, addToast } = useCRM();

  const stages = ['Prospecting', 'Discovery', 'Demo', 'Proposal', 'Negotiation', 'Won', 'Lost'];

  // Pipeline Header Calculations
  const totalPipeline = deals.reduce((acc, d) => acc + (d.value || 0), 0);
  const weightedPipeline = deals.reduce((acc, d) => acc + ((d.value || 0) * (d.probability || 50) / 100), 0);
  const openDealsCount = deals.filter(d => d.stage !== 'Won' && d.stage !== 'Lost').length;
  const wonValue = deals.filter(d => d.stage === 'Won').reduce((acc, d) => acc + (d.value || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-400" />
            Sales Opportunities & Kanban Pipeline
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Visualize your deal stages, probability weighted revenue, and pipeline velocity.
          </p>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-[#161c28] border border-[#283347] rounded-lg">
          <span className="text-xs text-slate-400 font-medium">Total Pipeline Value</span>
          <h3 className="text-xl font-bold text-slate-100 mt-1">₹{totalPipeline.toLocaleString('en-IN')}</h3>
          <span className="text-[11px] text-slate-400">across {deals.length} total deals</span>
        </div>
        <div className="p-4 bg-[#161c28] border border-blue-800/40 rounded-lg">
          <span className="text-xs text-blue-400 font-medium">Weighted Pipeline (Probability)</span>
          <h3 className="text-xl font-bold text-blue-300 mt-1">₹{Math.round(weightedPipeline).toLocaleString('en-IN')}</h3>
          <span className="text-[11px] text-slate-400">weighted expected revenue</span>
        </div>
        <div className="p-4 bg-[#161c28] border border-amber-800/40 rounded-lg">
          <span className="text-xs text-amber-400 font-medium">Active Open Deals</span>
          <h3 className="text-xl font-bold text-amber-300 mt-1">{openDealsCount}</h3>
          <span className="text-[11px] text-slate-400">in negotiation & discovery</span>
        </div>
        <div className="p-4 bg-[#161c28] border border-emerald-800/40 rounded-lg">
          <span className="text-xs text-emerald-400 font-medium">Closed Won Revenue</span>
          <h3 className="text-xl font-bold text-emerald-300 mt-1">₹{wonValue.toLocaleString('en-IN')}</h3>
          <span className="text-[11px] text-emerald-400 font-semibold">Target Achieved</span>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="overflow-x-auto custom-scrollbar pb-4">
        <div className="flex gap-4 min-w-[1400px]">
          {stages.map(stage => {
            const stageDeals = deals.filter(d => d.stage === stage);
            const stageTotal = stageDeals.reduce((acc, d) => acc + (d.value || 0), 0);

            return (
              <div
                key={stage}
                className="w-72 bg-slate-100 border border-slate-200 rounded-lg flex flex-col max-h-[70vh] shrink-0"
              >
                {/* Column Header */}
                <div className="p-3 border-b border-slate-200 bg-white rounded-t-lg flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                      {stage}
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#121722] text-slate-300 border border-[#283347]">
                        {stageDeals.length}
                      </span>
                    </h3>
                    <p className="text-[11px] font-semibold text-emerald-400 mt-0.5">
                      ₹{stageTotal.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                {/* Deal Cards Container */}
                <div className="p-3 overflow-y-auto space-y-3 custom-scrollbar flex-1">
                  {stageDeals.map(deal => (
                    <div
                      key={deal.id}
                      className="p-3.5 bg-[#161c28] border border-[#283347] hover:border-slate-500 rounded-lg shadow-sm space-y-3 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-slate-100">{deal.company}</h4>
                          <p className="text-[11px] text-slate-400">{deal.contactName}</p>
                        </div>
                        <Badge variant={deal.priority ? deal.priority.toLowerCase() : 'high'}>
                          {deal.priority || 'High'}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-[#283347]">
                        <span className="font-bold text-emerald-400">
                          ₹{deal.value?.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Prob: <strong className="text-slate-200">{deal.probability}%</strong>
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 space-y-0.5">
                        <p>Owner: <strong className="text-slate-300">{deal.ownerName}</strong></p>
                        <p>Next: <strong className="text-blue-400">{deal.nextAction}</strong></p>
                      </div>

                      {/* Stage Move Controls */}
                      <div className="pt-2 border-t border-[#283347] flex items-center justify-between gap-1">
                        {stages.indexOf(stage) > 0 && (
                          <button
                            onClick={() => moveDealStage(deal.id, stages[stages.indexOf(stage) - 1])}
                            className="p-1 text-slate-400 hover:text-white hover:bg-[#1c2433] rounded"
                            title="Move back a stage"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => moveDealStage(deal.id, 'Won')}
                          className="px-2 py-0.5 text-[10px] font-semibold text-emerald-400 bg-emerald-950 border border-emerald-800 rounded hover:bg-emerald-900"
                        >
                          Won
                        </button>
                        {stages.indexOf(stage) < stages.length - 2 && (
                          <button
                            onClick={() => moveDealStage(deal.id, stages[stages.indexOf(stage) + 1])}
                            className="p-1 text-slate-400 hover:text-white hover:bg-[#1c2433] rounded"
                            title="Advance to next stage"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                    </div>
                  ))}

                  {stageDeals.length === 0 && (
                    <div className="p-4 text-center text-slate-400 text-xs italic">
                      No deals in {stage}
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

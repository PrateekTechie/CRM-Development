import React from 'react';
import { useCRM } from '../../../context/CRMContext';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { BarChart3, TrendingUp, Download, PieChart, Users, DollarSign } from 'lucide-react';

export const ReportsView = () => {
  const { leads, deals, addToast } = useCRM();

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Analytics & Sales Reports
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Deep dive into lead conversion rates, channel performance, and pipeline velocity metrics.
          </p>
        </div>
        <Button variant="outline" size="md" icon={Download} onClick={() => addToast('Analytics report exported as PDF', 'info')}>
          Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Conversion Chart Card */}
        <div className="p-5 bg-[#161c28] border border-[#283347] rounded-lg space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Lead Conversion Rate by Channel
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-200">LinkedIn Campaign</span>
                <span className="font-bold text-emerald-400">32% Conversion</span>
              </div>
              <div className="w-full bg-[#121722] h-2.5 rounded-full overflow-hidden border border-[#283347]">
                <div className="bg-emerald-500 h-full w-[32%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-200">Inbound Website Form</span>
                <span className="font-bold text-blue-400">24% Conversion</span>
              </div>
              <div className="w-full bg-[#121722] h-2.5 rounded-full overflow-hidden border border-[#283347]">
                <div className="bg-blue-500 h-full w-[24%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-200">Customer Referral</span>
                <span className="font-bold text-indigo-400">45% Conversion</span>
              </div>
              <div className="w-full bg-[#121722] h-2.5 rounded-full overflow-hidden border border-[#283347]">
                <div className="bg-indigo-500 h-full w-[45%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Stage Value Distribution */}
        <div className="p-5 bg-[#161c28] border border-[#283347] rounded-lg space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-400" />
            Pipeline Value Distribution by Stage
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-200">Proposal Stage</span>
                <span className="font-bold text-amber-400">₹7,50,000</span>
              </div>
              <div className="w-full bg-[#121722] h-2.5 rounded-full overflow-hidden border border-[#283347]">
                <div className="bg-amber-500 h-full w-[60%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-200">Negotiation Stage</span>
                <span className="font-bold text-emerald-400">₹15,00,000</span>
              </div>
              <div className="w-full bg-[#121722] h-2.5 rounded-full overflow-hidden border border-[#283347]">
                <div className="bg-emerald-500 h-full w-[85%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-200">Discovery & Demo</span>
                <span className="font-bold text-blue-400">₹3,00,000</span>
              </div>
              <div className="w-full bg-[#121722] h-2.5 rounded-full overflow-hidden border border-[#283347]">
                <div className="bg-blue-500 h-full w-[35%]" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

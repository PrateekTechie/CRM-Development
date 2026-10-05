import React, { useState } from 'react';
import { useCRM } from '../../../context/CRMContext';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Calendar, CheckCircle2, AlertTriangle, Clock, PhoneCall, Mail } from 'lucide-react';

export const FollowupsView = () => {
  const { followUps, completeFollowUp, viewLead360, addToast } = useCRM();
  const [activeCategory, setActiveCategory] = useState('all');

  const today = new Date().toISOString().split('T')[0];

  const overdue = followUps.filter(f => f.status === 'Overdue' || (f.status === 'Upcoming' && f.date < today));
  const upcoming = followUps.filter(f => f.status === 'Upcoming' && f.date >= today);
  const completed = followUps.filter(f => f.status === 'Completed');

  const getDisplayed = () => {
    if (activeCategory === 'overdue') return overdue;
    if (activeCategory === 'upcoming') return upcoming;
    if (activeCategory === 'completed') return completed;
    return followUps;
  };

  const displayedList = getDisplayed();

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            Follow-ups & Task Schedule
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Never miss a customer touchpoint. Review today's calls, upcoming meetings, and overdue tasks.
          </p>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 border-b border-[#283347] pb-2 text-xs">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-md font-semibold ${activeCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-[#161c28] text-slate-400 border border-[#283347]'}`}
        >
          All Tasks ({followUps.length})
        </button>
        <button
          onClick={() => setActiveCategory('overdue')}
          className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 ${activeCategory === 'overdue' ? 'bg-rose-600 text-white' : 'bg-rose-950/60 text-rose-300 border border-rose-800'}`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Overdue ({overdue.length})
        </button>
        <button
          onClick={() => setActiveCategory('upcoming')}
          className={`px-3 py-1.5 rounded-md font-semibold ${activeCategory === 'upcoming' ? 'bg-amber-600 text-white' : 'bg-[#161c28] text-slate-400 border border-[#283347]'}`}
        >
          Upcoming ({upcoming.length})
        </button>
        <button
          onClick={() => setActiveCategory('completed')}
          className={`px-3 py-1.5 rounded-md font-semibold ${activeCategory === 'completed' ? 'bg-emerald-600 text-white' : 'bg-[#161c28] text-slate-400 border border-[#283347]'}`}
        >
          Completed ({completed.length})
        </button>
      </div>

      {/* Task Cards List */}
      <div className="space-y-3">
        {displayedList.map(item => {
          const isOverdue = item.status === 'Overdue' || (item.status === 'Upcoming' && item.date < today);

          return (
            <div
              key={item.id}
              className={`p-4 rounded-lg border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                isOverdue
                  ? 'bg-[#1e1418] border-rose-800/60 shadow-md'
                  : item.status === 'Completed'
                  ? 'bg-[#121722] border-[#283347] opacity-70'
                  : 'bg-[#161c28] border-[#283347] hover:border-slate-600'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-sm font-bold text-slate-100">{item.title}</h3>
                  <Badge variant={isOverdue ? 'rose' : item.status.toLowerCase()}>{isOverdue ? 'OVERDUE' : item.status}</Badge>
                  <Badge variant={item.priority.toLowerCase()}>{item.priority}</Badge>
                </div>
                <p className="text-xs text-slate-300">
                  Lead: <strong className="text-blue-400 cursor-pointer hover:underline" onClick={() => viewLead360(item.leadId)}>{item.leadName}</strong> ({item.company})
                </p>
                <p className="text-xs text-slate-400">
                  Scheduled Date: <strong>{item.date}</strong> at <strong>{item.time}</strong> • Owner: {item.ownerName}
                </p>
                {item.notes && (
                  <p className="text-xs text-slate-300 italic pt-1">"{item.notes}"</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={PhoneCall}
                  onClick={() => addToast(`Calling ${item.leadName}...`, 'info')}
                >
                  Call
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Mail}
                  onClick={() => addToast(`Opening mail compose for ${item.leadName}...`, 'info')}
                >
                  Email
                </Button>
                {item.status !== 'Completed' && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={CheckCircle2}
                    onClick={() => completeFollowUp(item.id)}
                  >
                    Complete
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  Calendar,
  Zap,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Clock,
  UserCheck
} from 'lucide-react';

export const Sidebar = () => {
  const { activeModule, setActiveModule, leads, followUps } = useCRM();
  const [collapsed, setCollapsed] = useState(false);

  const leadsCount = leads ? leads.length : 0;
  const overdueFollowupsCount = followUps ? followUps.filter(f => f.status === 'Overdue' || f.status === 'Upcoming').length : 0;

  const navGroups = [
    {
      title: 'WORKSPACE',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'leads', label: 'Leads', icon: UserCheck, count: leadsCount },
        { id: 'contacts', label: 'Contacts', icon: Users },
        { id: 'accounts', label: 'Accounts', icon: Building2 },
        { id: 'opportunities', label: 'Opportunities', icon: Briefcase },
      ]
    },
    {
      title: 'ENGAGE',
      items: [
        { id: 'activities', label: 'Activities', icon: Clock },
        { id: 'followups', label: 'Follow-ups', icon: Calendar, count: overdueFollowupsCount, alert: true },
        { id: 'automation', label: 'Automation', icon: Zap, accent: 'violet' },
      ]
    },
    {
      title: 'INSIGHTS',
      items: [
        { id: 'reports', label: 'Reports', icon: BarChart3, accent: 'cyan' },
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'settings', label: 'Settings', icon: Settings },
      ]
    }
  ];

  return (
    <aside
      data-sidebar-theme="indigo"
      className={`bg-crm-indigo border-r border-slate-200 flex flex-col transition-all duration-200 shrink-0 z-30 select-none ${
        collapsed ? 'w-[70px]' : 'w-[230px]'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200">
        <div
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={() => setActiveModule('dashboard')}
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-sm shadow-crm-sm border border-blue-400/40">
            L
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-sm font-extrabold text-white tracking-tight leading-none flex items-center gap-1.5">
                Leadwise
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block"></span>
              </h1>
              <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
                Sales CRM
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
        className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 py-4 overflow-y-auto custom-scrollbar space-y-5 px-3">
        {navGroups.map((group, idx) => (
          <div key={idx} className="space-y-1">
            {!collapsed && (
              <h2 className="px-3 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                {group.title}
              </h2>
            )}
            <nav className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.id || (item.id === 'leads' && activeModule === 'lead-360');

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveModule(item.id)}
                    title={collapsed ? `${item.label} (${item.count || ''})` : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-cyan-400/10 text-white font-bold border-l-2 border-cyan-400 rounded-l-none'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-cyan-300' : item.accent === 'violet' ? 'text-violet-300' : item.accent === 'cyan' ? 'text-cyan-300' : 'text-slate-400'
                    }`} />
                    {!collapsed && (
                      <span className="flex-1 text-left truncate">{item.label}</span>
                    )}
                    {!collapsed && item.count !== undefined && item.count > 0 && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-cyan-400/20 text-cyan-100'
                          : item.alert
                          ? 'bg-amber-950 text-amber-300 border border-amber-700/60'
                          : 'bg-white/10 text-slate-200 border border-white/10'
                      }`}>
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Footer User Card */}
      {!collapsed && (
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-7 h-7 rounded-full bg-white/10 border border-white/15 text-cyan-200 font-bold text-xs flex items-center justify-center">
              AK
            </div>
            <div className="truncate">
              <p className="font-bold text-slate-100 truncate">Arjun Kapoor</p>
              <p className="text-[10px] text-slate-500 truncate">Senior Exec</p>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="System Connected" />
        </div>
      )}
    </aside>
  );
};

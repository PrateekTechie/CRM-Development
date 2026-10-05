import React, { useState, useRef, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import {
  Search,
  Plus,
  Bell,
  CheckSquare,
  HelpCircle,
  User,
  LogOut,
  UserPlus,
  Briefcase,
  Building2,
  Calendar,
  PhoneCall,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { Button } from '../ui/Button';

export const Topbar = () => {
  const {
    setIsAddLeadOpen,
    setIsCommandPaletteOpen,
    setIsNotificationDrawerOpen,
    notifications,
    activeUser,
    setActiveModule,
    addToast
  } = useCRM();

  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  
  const createMenuRef = useRef(null);
  const profileMenuRef = useRef(null);

  const unreadNotifsCount = notifications ? notifications.filter(n => !n.read).length : 0;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (createMenuRef.current && !createMenuRef.current.contains(e.target)) {
        setCreateMenuOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-20">
      
      {/* Global Search Trigger */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="w-full max-w-md bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-600 text-xs px-3.5 py-2 rounded-md flex items-center justify-between transition-all shadow-crm-sm cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-cyan-600 group-hover:text-blue-600 transition-colors" />
            <span className="text-slate-600 group-hover:text-slate-900 font-medium">
              Search leads, contacts, companies, deals...
            </span>
          </div>
          <kbd className="bg-slate-100 text-slate-600 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-200 shadow-inner font-bold">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* Top Bar Actions */}
      <div className="flex items-center gap-3">
        
        {/* Quick Create Dropdown */}
        <div className="relative" ref={createMenuRef}>
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => setCreateMenuOpen(!createMenuOpen)}
          >
            Create
            <ChevronDown className="w-3.5 h-3.5 ml-0.5 opacity-80" />
          </Button>

          {createMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-md shadow-xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                Quick Add Record
              </div>
              <button
                onClick={() => {
                  setCreateMenuOpen(false);
                  setIsAddLeadOpen(true);
                }}
                className="w-full text-left px-3.5 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2.5 font-semibold"
              >
                <UserPlus className="w-4 h-4 text-blue-400" />
                New Lead
              </button>
              <button
                onClick={() => {
                  setCreateMenuOpen(false);
                  setActiveModule('contacts');
                  addToast('Opening Contacts workspace');
                }}
                className="w-full text-left px-3.5 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2.5 font-semibold"
              >
                <User className="w-4 h-4 text-emerald-400" />
                New Contact
              </button>
              <button
                onClick={() => {
                  setCreateMenuOpen(false);
                  setActiveModule('accounts');
                  addToast('Opening Accounts workspace');
                }}
                className="w-full text-left px-3.5 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2.5 font-semibold"
              >
                <Building2 className="w-4 h-4 text-amber-400" />
                New Account
              </button>
              <button
                onClick={() => {
                  setCreateMenuOpen(false);
                  setActiveModule('opportunities');
                  addToast('Opening Pipeline workspace');
                }}
                className="w-full text-left px-3.5 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2.5 font-semibold"
              >
                <Briefcase className="w-4 h-4 text-violet-400" />
                New Opportunity
              </button>
              <div className="border-t border-slate-200 my-1" />
              <button
                onClick={() => {
                  setCreateMenuOpen(false);
                  setActiveModule('activities');
                  addToast('Opening Activities log');
                }}
                className="w-full text-left px-3.5 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2.5 font-semibold"
              >
                <PhoneCall className="w-4 h-4 text-rose-400" />
                Log Activity
              </button>
              <button
                onClick={() => {
                  setCreateMenuOpen(false);
                  setActiveModule('followups');
                  addToast('Opening Follow-ups schedule');
                }}
                className="w-full text-left px-3.5 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2.5 font-semibold"
              >
                <Calendar className="w-4 h-4 text-cyan-400" />
                Schedule Follow-up
              </button>
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-slate-200 mx-1" />

        {/* Task Counter Icon */}
        <button
          onClick={() => setActiveModule('followups')}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors relative"
          title="Tasks / Follow-ups"
        >
          <CheckSquare className="w-4 h-4" />
        </button>

        {/* Notifications Button */}
        <button
          onClick={() => setIsNotificationDrawerOpen(true)}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors relative"
          title="Notification Center"
        >
          <Bell className="w-4 h-4" />
          {unreadNotifsCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          )}
          {unreadNotifsCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
          )}
        </button>

        {/* Help Button */}
        <button
          onClick={() => addToast('Leadwise CRM Documentation', 'info')}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
          title="Help & Guides"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-slate-200 mx-1" />

        {/* Profile Dropdown */}
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-2.5 p-1 rounded-md hover:bg-slate-100 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center border border-blue-400/40">
              AK
            </div>
            <span className="text-xs font-bold text-slate-800 hidden md:inline">
              Arjun Kapoor
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-md shadow-xl py-1.5 z-50 text-xs">
              <div className="px-4 py-2 border-b border-slate-200">
                <p className="font-extrabold text-slate-900">{activeUser.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{activeUser.email}</p>
                <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {activeUser.role}
                </span>
              </div>
              <button
                onClick={() => {
                  setProfileMenuOpen(false);
                  setActiveModule('settings');
                }}
                className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 font-medium"
              >
                <User className="w-4 h-4 text-slate-400" />
                Profile & Account
              </button>
              <div className="border-t border-slate-200 my-1" />
              <button
                onClick={() => {
                  setProfileMenuOpen(false);
                  addToast('Session locked. Re-authenticate to return.', 'info');
                }}
                className="w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>

      </div>

    </header>
  );
};

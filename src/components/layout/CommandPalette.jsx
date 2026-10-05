import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import { Search, User, Building2, Briefcase, PhoneCall, X, ArrowRight } from 'lucide-react';

export const CommandPalette = () => {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    leads,
    contacts,
    accounts,
    deals,
    activities,
    viewLead360,
    setActiveModule,
  } = useCRM();

  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setIsCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const searchTerm = query.toLowerCase().trim();

  // Search grouped results
  const filteredLeads = leads.filter(l => 
    !searchTerm ||
    `${l.firstName} ${l.lastName}`.toLowerCase().includes(searchTerm) ||
    l.company.toLowerCase().includes(searchTerm) ||
    l.email.toLowerCase().includes(searchTerm)
  ).slice(0, 4);

  const filteredContacts = contacts.filter(c =>
    !searchTerm ||
    c.name.toLowerCase().includes(searchTerm) ||
    c.company.toLowerCase().includes(searchTerm)
  ).slice(0, 3);

  const filteredDeals = deals.filter(d =>
    !searchTerm ||
    d.company.toLowerCase().includes(searchTerm) ||
    d.title.toLowerCase().includes(searchTerm)
  ).slice(0, 3);

  const filteredActivities = activities.filter(a =>
    !searchTerm ||
    a.leadName.toLowerCase().includes(searchTerm) ||
    a.description.toLowerCase().includes(searchTerm)
  ).slice(0, 3);

  const handleSelectLead = (leadId) => {
    setIsCommandPaletteOpen(false);
    viewLead360(leadId);
  };

  const handleSelectModule = (mod) => {
    setIsCommandPaletteOpen(false);
    setActiveModule(mod);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-[#161c28] border border-[#283347] rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#283347] bg-[#0f141e]">
          <Search className="w-5 h-5 text-blue-400 shrink-0 mr-3" />
          <input
            type="text"
            autoFocus
            placeholder="Search leads, contacts, companies, deals, activities..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-slate-100 text-sm focus:outline-none placeholder:text-slate-500"
          />
          <button
            onClick={() => setIsCommandPaletteOpen(false)}
            className="p-1 text-slate-400 hover:text-white rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Container */}
        <div className="overflow-y-auto p-3 space-y-4 custom-scrollbar text-xs">
          
          {/* LEADS GROUP */}
          {filteredLeads.length > 0 && (
            <div className="space-y-1">
              <h3 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3 h-3 text-blue-400" />
                Leads ({filteredLeads.length})
              </h3>
              <div className="space-y-0.5">
                {filteredLeads.map(lead => (
                  <div
                    key={lead.id}
                    onClick={() => handleSelectLead(lead.id)}
                    className="p-2.5 rounded-md hover:bg-[#1c2433] text-slate-200 flex items-center justify-between cursor-pointer group transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-100 flex items-center gap-2">
                        {lead.firstName} {lead.lastName}
                        <span className="text-[10px] text-slate-400 font-normal">({lead.company})</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{lead.email} • {lead.source}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800 font-medium">
                        ₹{lead.expectedValue?.toLocaleString('en-IN')}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CONTACTS GROUP */}
          {filteredContacts.length > 0 && (
            <div className="space-y-1 border-t border-[#283347] pt-3">
              <h3 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3 h-3 text-emerald-400" />
                Contacts
              </h3>
              <div className="space-y-0.5">
                {filteredContacts.map(cnt => (
                  <div
                    key={cnt.id}
                    onClick={() => handleSelectModule('contacts')}
                    className="p-2.5 rounded-md hover:bg-[#1c2433] text-slate-200 flex items-center justify-between cursor-pointer group transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-100">{cnt.name}</div>
                      <p className="text-[11px] text-slate-400">{cnt.company} • {cnt.title}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DEALS GROUP */}
          {filteredDeals.length > 0 && (
            <div className="space-y-1 border-t border-[#283347] pt-3">
              <h3 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-3 h-3 text-indigo-400" />
                Deals & Opportunities
              </h3>
              <div className="space-y-0.5">
                {filteredDeals.map(deal => (
                  <div
                    key={deal.id}
                    onClick={() => handleSelectModule('opportunities')}
                    className="p-2.5 rounded-md hover:bg-[#1c2433] text-slate-200 flex items-center justify-between cursor-pointer group transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-100">{deal.company}</div>
                      <p className="text-[11px] text-slate-400">{deal.title} • Stage: {deal.stage}</p>
                    </div>
                    <span className="font-bold text-emerald-400 text-xs">
                      ₹{deal.value?.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredLeads.length === 0 && filteredContacts.length === 0 && filteredDeals.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              <p className="text-xs">No records matching "{query}"</p>
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-[#283347] bg-[#0f141e] text-[10px] text-slate-400 flex items-center justify-between">
          <span>Press <kbd className="px-1.5 py-0.5 bg-[#1c2433] rounded border border-[#283347]">Esc</kbd> to exit search</span>
          <span>Leadwise CRM Command Palette</span>
        </div>
      </div>
    </div>
  );
};

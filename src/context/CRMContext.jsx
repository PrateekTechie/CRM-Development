import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  initialUsers,
  initialContacts,
  initialAccounts,
  initialDeals,
  initialActivities,
  initialFollowUps,
  initialAutomations,
  initialNotifications,
} from '../data/mockData';
import { getSupabaseClient } from '../lib/supabase';
import { leadChangesToDatabase, leadFromDatabase, leadToDatabase } from '../lib/leadMapping';

const CRMContext = createContext();

export const CRMProvider = ({ children }) => {
  // Persistence Helper
  const loadInitialData = (key, fallback) => {
    try {
      const saved = localStorage.getItem(`leadwise_${key}`);
      return saved ? JSON.parse(saved) : fallback;
    } catch (e) {
      console.warn(`Failed to parse localStorage key leadwise_${key}`, e);
      return fallback;
    }
  };

  // Central Core State
  const [users] = useState(initialUsers);
  const [activeUser] = useState(initialUsers.find(u => u.isCurrent) || initialUsers[0]);

  const [leads, setLeads] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [leadsError, setLeadsError] = useState('');
  const [savingLead, setSavingLead] = useState(false);
  const [updatingLeadIds, setUpdatingLeadIds] = useState([]);
  const [deletingLeadIds, setDeletingLeadIds] = useState([]);
  const [editingLeadId, setEditingLeadId] = useState(null);
  const [contacts, setContacts] = useState(() => loadInitialData('contacts', initialContacts));
  const [accounts, setAccounts] = useState(() => loadInitialData('accounts', initialAccounts));
  const [deals, setDeals] = useState(() => loadInitialData('deals', initialDeals));
  const [activities, setActivities] = useState(() => loadInitialData('activities', initialActivities));
  const [followUps, setFollowUps] = useState(() => loadInitialData('followups', initialFollowUps));
  const [automations, setAutomations] = useState(() => loadInitialData('automations', initialAutomations));
  const [notifications, setNotifications] = useState(() => loadInitialData('notifications', initialNotifications));

  // Navigation & Modal Controls
  const [activeModule, setActiveModule] = useState('dashboard');
  const [selectedLeadId, setSelectedLeadId] = useState('lead-1'); // Default to Rahul Sharma
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  
  // Column Customization for Leads Table (persisted)
  const [visibleColumns, setVisibleColumns] = useState(() => loadInitialData('visible_columns', {
    checkbox: true,
    lead: true,
    company: true,
    source: true,
    owner: true,
    status: true,
    stage: true,
    priority: true,
    score: true,
    expectedValue: true,
    lastActivity: true,
    nextFollowUp: true,
    actions: true,
  }));

  // Saved Views for Leads Table
  const [activeSavedView, setActiveSavedView] = useState('all'); // all, my, new, high_priority, qualified, follow_today, overdue, converted, lost

  // Global Toast System
  const [toasts, setToasts] = useState([]);

  // Sync to LocalStorage
  useEffect(() => { localStorage.setItem('leadwise_contacts', JSON.stringify(contacts)); }, [contacts]);
  useEffect(() => { localStorage.setItem('leadwise_accounts', JSON.stringify(accounts)); }, [accounts]);
  useEffect(() => { localStorage.setItem('leadwise_deals', JSON.stringify(deals)); }, [deals]);
  useEffect(() => { localStorage.setItem('leadwise_activities', JSON.stringify(activities)); }, [activities]);
  useEffect(() => { localStorage.setItem('leadwise_followups', JSON.stringify(followUps)); }, [followUps]);
  useEffect(() => { localStorage.setItem('leadwise_automations', JSON.stringify(automations)); }, [automations]);
  useEffect(() => { localStorage.setItem('leadwise_notifications', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem('leadwise_visible_columns', JSON.stringify(visibleColumns)); }, [visibleColumns]);

  // Toast Helper
  const addToast = useCallback((message, type = 'success') => {
    const id = 'toast-' + Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const loadLeads = useCallback(async () => {
    setLeadsLoading(true);
    setLeadsError('');
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const loadedLeads = data.map(row => leadFromDatabase(row, users));
      setLeads(current => {
        const loadedIds = new Set(loadedLeads.map(lead => lead.id));
        return [...loadedLeads, ...current.filter(lead => !loadedIds.has(lead.id))];
      });
    } catch (error) {
      console.error('Failed to load leads from Supabase:', error);
      const message = error.message || 'Unable to load leads from Supabase.';
      setLeadsError(message);
      addToast(`Unable to load leads: ${message}`, 'danger');
    } finally {
      setLeadsLoading(false);
    }
  }, [addToast, users]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  // Duplicate Check Helper
  const checkDuplicateLead = (email, phone, excludeLeadId) => {
    if (!email && !phone) return null;
    return leads.find(l =>
      l.id !== excludeLeadId && (
        (email && l.email && l.email.toLowerCase().trim() === email.toLowerCase().trim()) ||
        (phone && l.phone && l.phone.trim() === phone.trim())
      )
    ) || null;
  };

  // CRUD Functions

  // Add New Lead
  const addLead = async (newLeadData) => {
    setSavingLead(true);
    let leadObj;
    try {
      const leadDraft = {
      firstName: newLeadData.firstName || '',
      lastName: newLeadData.lastName || '',
      company: newLeadData.company || 'N/A',
      email: newLeadData.email || '',
      phone: newLeadData.phone || '',
      title: newLeadData.title || 'Decision Maker',
      preferredContactMethod: newLeadData.preferredContactMethod || 'Phone',
      industry: newLeadData.industry || 'Technology',
      website: newLeadData.website || '',
      companySize: newLeadData.companySize || '11-50',
      location: newLeadData.location || 'India',
      source: newLeadData.source || 'Website',
      ownerId: newLeadData.ownerId || activeUser.id,
      ownerName: users.find(u => u.id === newLeadData.ownerId)?.name || activeUser.name,
      status: newLeadData.status || 'New',
      stage: newLeadData.stage || 'Prospecting',
      priority: newLeadData.priority || 'Medium',
      score: parseInt(newLeadData.score) || 75,
      expectedValue: parseFloat(newLeadData.expectedValue) || 0,
      expectedCloseDate: newLeadData.expectedCloseDate || '2026-11-01',
      productInterest: newLeadData.productInterest || 'Sales CRM Software',
      requirement: newLeadData.requirement || '',
      notes: newLeadData.notes || '',
      nextFollowUpDate: newLeadData.nextFollowUpDate || '',
      nextFollowUpTime: newLeadData.nextFollowUpTime || '10:00 AM',
      nextFollowUpNote: newLeadData.nextFollowUpNote || '',
      tags: newLeadData.tags || ['New Lead'],
      lastActivityDate: new Date().toISOString().split('T')[0],
      };
      const ownerName = users.find(u => u.id === leadDraft.ownerId)?.name || activeUser.name;
      const { data, error } = await getSupabaseClient()
        .from('leads')
        .insert([leadToDatabase(leadDraft, ownerName)])
        .select('*')
        .single();
      if (error) throw error;
      leadObj = leadFromDatabase(data, users);
    } catch (error) {
      console.error('Failed to save lead to Supabase:', error);
      addToast(`Unable to save lead: ${error.message || 'Supabase request failed.'}`, 'danger');
      return null;
    } finally {
      setSavingLead(false);
    }

    const newId = leadObj.id;
    setLeads(prev => [leadObj, ...prev]);

    // Create associated Contact & Account if company exists
    const contactObj = {
      id: 'cnt-' + Date.now(),
      name: `${leadObj.firstName} ${leadObj.lastName}`,
      company: leadObj.company,
      email: leadObj.email,
      phone: leadObj.phone,
      title: leadObj.title,
      ownerName: leadObj.ownerName,
      lastInteraction: leadObj.createdAt,
      openDealsCount: 0,
      status: 'Active',
      leadId: newId,
    };
    setContacts(prev => [contactObj, ...prev]);

    const existingAcc = accounts.find(a => a.name.toLowerCase() === leadObj.company.toLowerCase());
    if (!existingAcc && leadObj.company) {
      const accObj = {
        id: 'acc-' + Date.now(),
        name: leadObj.company,
        industry: leadObj.industry,
        location: leadObj.location,
        website: leadObj.website,
        companySize: leadObj.companySize,
        contactsCount: 1,
        openOpportunitiesCount: 0,
        totalDealValue: leadObj.expectedValue,
        ownerName: leadObj.ownerName,
        lastActivityDate: leadObj.createdAt,
      };
      setAccounts(prev => [accObj, ...prev]);
    }

    // Schedule follow-up if requested
    if (newLeadData.nextFollowUpDate) {
      const followUpObj = {
        id: 'flw-' + Date.now(),
        leadId: newId,
        leadName: `${leadObj.firstName} ${leadObj.lastName}`,
        company: leadObj.company,
        title: `Follow-up with ${leadObj.firstName}`,
        type: 'Call',
        date: newLeadData.nextFollowUpDate,
        time: newLeadData.nextFollowUpTime || '10:00 AM',
        priority: leadObj.priority,
        status: 'Upcoming',
        ownerName: leadObj.ownerName,
        notes: newLeadData.nextFollowUpNote || 'Follow-up created during lead addition.',
      };
      setFollowUps(prev => [followUpObj, ...prev]);
    }

    // Create Initial Activity
    const actObj = {
      id: 'act-' + Date.now(),
      leadId: newId,
      leadName: `${leadObj.firstName} ${leadObj.lastName}`,
      company: leadObj.company,
      type: 'Note',
      description: `Lead created via ${leadObj.source}. Initial requirement: ${leadObj.productInterest}`,
      performedBy: activeUser.name,
      timestamp: 'Just now',
      date: new Date().toISOString().split('T')[0],
    };
    setActivities(prev => [actObj, ...prev]);

    // Create Notification
    const notifObj = {
      id: 'notif-' + Date.now(),
      title: 'New Lead Created',
      message: `Lead ${leadObj.firstName} ${leadObj.lastName} (${leadObj.company}) was created.`,
      timestamp: 'Just now',
      type: 'info',
      read: false,
      linkTarget: newId,
    };
    setNotifications(prev => [notifObj, ...prev]);

    addToast(`Lead "${leadObj.firstName} ${leadObj.lastName}" created successfully.`);
    return leadObj;
  };

  // Update Lead
  const updateLead = async (leadId, updatedFields) => {
    const existingLead = leads.find(lead => lead.id === leadId);
    if (!existingLead) {
      addToast('The lead could not be found in the current workspace.', 'danger');
      return false;
    }

    setUpdatingLeadIds(prev => [...new Set([...prev, leadId])]);
    try {
      const ownerId = updatedFields.ownerId || existingLead.ownerId;
      const ownerName = users.find(user => user.id === ownerId)?.name || existingLead.ownerName;
      const { data, error } = await getSupabaseClient()
        .from('leads')
        .update(leadChangesToDatabase(existingLead, updatedFields, ownerName))
        .eq('id', leadId)
        .select('*')
        .single();
      if (error) throw error;
      const updatedLead = leadFromDatabase(data, users);
      setLeads(prev => prev.map(lead => lead.id === leadId ? updatedLead : lead));
      addToast('Lead details updated successfully.');
      return true;
    } catch (error) {
      console.error(`Failed to update lead ${leadId} in Supabase:`, error);
      addToast(`Unable to update lead: ${error.message || 'Supabase request failed.'}`, 'danger');
      return false;
    } finally {
      setUpdatingLeadIds(prev => prev.filter(id => id !== leadId));
    }
  };

  // Delete Lead
  const deleteLead = async (leadId) => {
    setDeletingLeadIds(prev => [...new Set([...prev, leadId])]);
    try {
      const { error } = await getSupabaseClient()
        .from('leads')
        .delete()
        .eq('id', leadId)
        .select('id')
        .single();
      if (error) throw error;
      setLeads(prev => prev.filter(lead => lead.id !== leadId));
      addToast('Lead deleted.');
      return true;
    } catch (error) {
      console.error(`Failed to delete lead ${leadId} from Supabase:`, error);
      addToast(`Unable to delete lead: ${error.message || 'Supabase request failed.'}`, 'danger');
      return false;
    } finally {
      setDeletingLeadIds(prev => prev.filter(id => id !== leadId));
    }
  };

  // Bulk Actions
  const bulkUpdateLeads = async (leadIds, updates) => {
    const firstLead = leads.find(lead => leadIds.includes(lead.id));
    if (!firstLead) return false;
    setUpdatingLeadIds(prev => [...new Set([...prev, ...leadIds])]);
    try {
      const ownerId = updates.ownerId || firstLead.ownerId;
      const ownerName = users.find(user => user.id === ownerId)?.name || firstLead.ownerName;
      const { data, error } = await getSupabaseClient()
        .from('leads')
        .update(leadChangesToDatabase(firstLead, updates, ownerName))
        .in('id', leadIds)
        .select('*');
      if (error) throw error;
      const updatedLeads = data.map(row => leadFromDatabase(row, users));
      const updatedById = new Map(updatedLeads.map(lead => [lead.id, lead]));
      setLeads(prev => prev.map(lead => updatedById.get(lead.id) || lead));
      if (updatedLeads.length !== leadIds.length) {
        addToast(`Supabase updated ${updatedLeads.length} of ${leadIds.length} selected leads. Check database permissions.`, 'warning');
        return false;
      }
      addToast(`Updated ${updatedLeads.length} lead(s).`);
      return true;
    } catch (error) {
      console.error('Failed to bulk update leads in Supabase:', error);
      addToast(`Unable to update leads: ${error.message || 'Supabase request failed.'}`, 'danger');
      return false;
    } finally {
      setUpdatingLeadIds(prev => prev.filter(id => !leadIds.includes(id)));
    }
  };

  const bulkDeleteLeads = async (leadIds) => {
    setDeletingLeadIds(prev => [...new Set([...prev, ...leadIds])]);
    try {
      const { data, error } = await getSupabaseClient()
        .from('leads')
        .delete()
        .in('id', leadIds)
        .select('id');
      if (error) throw error;
      const deletedIds = new Set(data.map(row => row.id));
      setLeads(prev => prev.filter(lead => !deletedIds.has(lead.id)));
      if (deletedIds.size !== leadIds.length) {
        addToast(`Supabase deleted ${deletedIds.size} of ${leadIds.length} selected leads. Check database permissions.`, 'warning');
        return false;
      }
      addToast(`Deleted ${leadIds.length} lead(s).`);
      return true;
    } catch (error) {
      console.error('Failed to bulk delete leads from Supabase:', error);
      addToast(`Unable to delete leads: ${error.message || 'Supabase request failed.'}`, 'danger');
      return false;
    } finally {
      setDeletingLeadIds(prev => prev.filter(id => !leadIds.includes(id)));
    }
  };

  // Qualify Lead
  const qualifyLead = async (leadId) => {
    const targetLead = leads.find(l => l.id === leadId);
    if (targetLead && await updateLead(leadId, {
      status: 'Qualified',
      score: Math.max(targetLead.score, 85),
    })) {
      const actObj = {
        id: 'act-' + Date.now(),
        leadId: leadId,
        leadName: `${targetLead.firstName} ${targetLead.lastName}`,
        company: targetLead.company,
        type: 'Note',
        description: 'Lead completed BANT qualification and marked as Qualified.',
        performedBy: activeUser.name,
        timestamp: 'Just now',
        date: new Date().toISOString().split('T')[0],
      };
      setActivities(prev => [actObj, ...prev]);
      addToast(`Lead "${targetLead.firstName} ${targetLead.lastName}" qualified!`);
    }
  };

  // Create Opportunity from Lead
  const createOpportunityFromLead = async (leadId, dealData = {}) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const newDeal = {
      id: 'deal-' + Date.now(),
      title: dealData.title || `${lead.company} CRM Deal`,
      company: lead.company,
      contactName: `${lead.firstName} ${lead.lastName}`,
      contactEmail: lead.email,
      leadId: lead.id,
      stage: dealData.stage || 'Discovery',
      value: parseFloat(dealData.value) || lead.expectedValue || 5000,
      probability: dealData.probability || 70,
      expectedCloseDate: dealData.expectedCloseDate || lead.expectedCloseDate || '2026-11-15',
      ownerId: lead.ownerId,
      ownerName: lead.ownerName,
      nextAction: dealData.nextAction || 'Schedule proposal call',
      priority: lead.priority,
      createdAt: new Date().toISOString().split('T')[0],
    };

    // Update lead stage & status to Converted if won or opportunity active
    const leadUpdated = await updateLead(leadId, { stage: newDeal.stage, status: 'Converted' });
    if (!leadUpdated) return null;

    setDeals(prev => [newDeal, ...prev]);
    addToast(`Opportunity "${newDeal.title}" created in ${newDeal.stage} stage.`);
    return newDeal;
  };

  // Move Deal Stage (Kanban Drag and Drop or Select)
  const moveDealStage = (dealId, newStage) => {
    setDeals(prev => prev.map(d => {
      if (d.id === dealId) {
        let prob = d.probability;
        if (newStage === 'Prospecting') prob = 20;
        if (newStage === 'Discovery') prob = 40;
        if (newStage === 'Demo') prob = 60;
        if (newStage === 'Proposal') prob = 80;
        if (newStage === 'Negotiation') prob = 90;
        if (newStage === 'Won') prob = 100;
        if (newStage === 'Lost') prob = 0;
        return { ...d, stage: newStage, probability: prob };
      }
      return d;
    }));
    addToast(`Deal stage updated to ${newStage}.`);
  };

  // Add Activity Log
  const addActivity = async (actData) => {
    const newAct = {
      id: 'act-' + Date.now(),
      leadId: actData.leadId || selectedLeadId,
      leadName: actData.leadName || 'Rahul Sharma',
      company: actData.company || 'ABC Technologies',
      type: actData.type || 'Phone',
      description: actData.description || 'Logged communication.',
      performedBy: activeUser.name,
      timestamp: 'Just now',
      date: new Date().toISOString().split('T')[0],
    };
    setActivities(prev => [newAct, ...prev]);
    
    // Update last activity date on lead
    if (actData.leadId) {
      await updateLead(actData.leadId, { lastActivityDate: newAct.date });
    }
    
    addToast(`Activity (${newAct.type}) logged.`);
  };

  // Schedule Follow-up
  const scheduleFollowUp = (flwData) => {
    const newFlw = {
      id: 'flw-' + Date.now(),
      leadId: flwData.leadId || selectedLeadId,
      leadName: flwData.leadName || 'Rahul Sharma',
      company: flwData.company || 'ABC Technologies',
      title: flwData.title || 'Follow-up Task',
      type: flwData.type || 'Call',
      date: flwData.date || new Date().toISOString().split('T')[0],
      time: flwData.time || '10:00 AM',
      priority: flwData.priority || 'Medium',
      status: 'Upcoming',
      ownerName: activeUser.name,
      notes: flwData.notes || '',
    };
    setFollowUps(prev => [newFlw, ...prev]);
    addToast('Follow-up scheduled.');
  };

  // Complete Follow-up
  const completeFollowUp = (flwId) => {
    setFollowUps(prev => prev.map(f => f.id === flwId ? { ...f, status: 'Completed' } : f));
    addToast('Follow-up marked as completed.');
  };

  // Notifications
  const markNotificationAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Helper to open Lead 360 view
  const viewLead360 = (leadId) => {
    setSelectedLeadId(leadId);
    setActiveModule('lead-360');
  };

  // Context Value
  return (
    <CRMContext.Provider value={{
      users,
      activeUser,
      leads,
      leadsLoading,
      leadsError,
      reloadLeads: loadLeads,
      savingLead,
      updatingLeadIds,
      deletingLeadIds,
      editingLeadId,
      setEditingLeadId,
      contacts,
      accounts,
      deals,
      activities,
      followUps,
      automations,
      notifications,
      activeModule,
      setActiveModule,
      selectedLeadId,
      setSelectedLeadId,
      viewLead360,
      isAddLeadOpen,
      setIsAddLeadOpen,
      isCommandPaletteOpen,
      setIsCommandPaletteOpen,
      isNotificationDrawerOpen,
      setIsNotificationDrawerOpen,
      visibleColumns,
      setVisibleColumns,
      activeSavedView,
      setActiveSavedView,
      toasts,
      addToast,
      removeToast,
      checkDuplicateLead,
      addLead,
      updateLead,
      deleteLead,
      bulkUpdateLeads,
      bulkDeleteLeads,
      qualifyLead,
      createOpportunityFromLead,
      moveDealStage,
      addActivity,
      scheduleFollowUp,
      completeFollowUp,
      markNotificationAsRead,
      markAllNotificationsAsRead,
    }}>
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
};

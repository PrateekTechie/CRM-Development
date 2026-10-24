import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import { leadChangesToDatabase, leadFromDatabase, leadToDatabase } from '../lib/leadMapping';
import {
  createRecord,
  deleteRecord,
  fromDatabaseRecord,
  listRecords,
  updateRecord,
} from '../lib/crmService';

const CRMContext = createContext();
const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
const activityTypes = new Set(['Call', 'Email', 'Meeting', 'Note', 'WhatsApp', 'Other', 'LinkedIn', 'Demo']);
const toActivityType = type => type === 'Phone' ? 'Call' : type;

const roleLabel = (role) => ({
  admin: 'Admin',
  sales_manager: 'Sales Manager',
  sales_representative: 'Sales Representative',
  viewer: 'Viewer',
}[role] || 'Viewer');

const mapProfile = (profile, isCurrent = false) => ({
  id: profile.id,
  name: profile.full_name || profile.email || 'User',
  email: profile.email || '',
  role: roleLabel(profile.role),
  roleKey: profile.role,
  accessEnabled: Boolean(profile.is_active),
  avatar: profile.avatar || (profile.full_name || 'U').slice(0, 2).toUpperCase(),
  isCurrent,
});

const mapAccount = (row, users) => ({
  ...fromDatabaseRecord(row),
  companySize: row.company_size || '',
  ownerName: users.find(user => user.id === row.owner_id)?.name || '',
});

const mapContact = (row, accounts, users) => {
  const value = fromDatabaseRecord(row);
  const account = accounts.find(item => item.id === row.account_id);
  return {
    ...value,
    name: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
    title: row.job_title || '',
    company: account?.name || '',
    ownerName: users.find(user => user.id === row.owner_id)?.name || '',
    lastInteraction: row.updated_at || row.created_at,
  };
};

const mapOpportunity = (row, accounts, contacts, leads, users) => {
  const account = accounts.find(item => item.id === row.account_id);
  const contact = contacts.find(item => item.id === row.contact_id);
  const lead = leads.find(item => item.id === row.lead_id);
  const stage = row.stage === 'Closed Won' ? 'Won' : row.stage === 'Closed Lost' ? 'Lost' : row.stage;
  return {
    ...fromDatabaseRecord(row),
    title: row.name,
    company: account?.name || lead?.company || '',
    contactName: contact?.name || (lead ? `${lead.firstName} ${lead.lastName}`.trim() : ''),
    contactEmail: contact?.email || lead?.email || '',
    ownerName: users.find(user => user.id === row.owner_id)?.name || '',
    createdAt: row.created_at?.slice(0, 10) || '',
    stage,
  };
};

const mapActivity = (row) => ({
  ...fromDatabaseRecord(row),
  leadName: '',
  company: '',
  performedBy: '',
  timestamp: row.activity_time ? new Date(row.activity_time).toLocaleString() : '',
  date: row.activity_time?.slice(0, 10) || '',
});

const mapFollowUp = (row, leads, users) => {
  const lead = leads.find(item => item.id === row.lead_id);
  const dueDateTime = row.due_at ? new Date(row.due_at) : null;
  const dueDate = dueDateTime && !Number.isNaN(dueDateTime.getTime())
    ? `${dueDateTime.getFullYear()}-${String(dueDateTime.getMonth() + 1).padStart(2, '0')}-${String(dueDateTime.getDate()).padStart(2, '0')}`
    : '';
  const rawStatus = row.status;
  const status = rawStatus === 'Upcoming' && dueDate < today() ? 'Overdue'
    : rawStatus === 'Upcoming' && dueDate === today() ? 'Today' : rawStatus;
  return {
    ...fromDatabaseRecord(row),
    leadName: lead ? `${lead.firstName} ${lead.lastName}`.trim() : '',
    company: lead?.company || '',
    date: dueDate,
    time: row.due_at ? new Date(row.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
    ownerName: users.find(user => user.id === row.assigned_to)?.name || '',
    notes: row.description || '',
    status,
  };
};

const mapNotification = (row) => ({
  ...fromDatabaseRecord(row),
  read: Boolean(row.read_at),
  linkTarget: row.entity_id ? `${row.entity_type || ''}-${row.entity_id}` : '',
  timestamp: row.created_at ? new Date(row.created_at).toLocaleString() : '',
});

const parseDueAt = (date, time) => {
  if (!date) return null;
  const parsedTime = (time || '10:00 AM').match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!parsedTime) throw new Error('Enter a valid follow-up time, such as 10:00 AM.');
  let hours = Number(parsedTime[1]);
  const minutes = Number(parsedTime[2]);
  if (parsedTime[3]?.toUpperCase() === 'PM' && hours < 12) hours += 12;
  if (parsedTime[3]?.toUpperCase() === 'AM' && hours === 12) hours = 0;
  const result = new Date(`${date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
  if (Number.isNaN(result.getTime())) throw new Error('Enter a valid follow-up date and time.');
  return result.toISOString();
};

const toOpportunityStage = (stage) => stage === 'Won' ? 'Closed Won' : stage === 'Lost' ? 'Closed Lost' : stage;

export const CRMProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [users, setUsers] = useState([]);
  const [profile, setProfile] = useState(null);
  const [quickCreateRequest, setQuickCreateRequest] = useState(null);
  const [leads, setLeads] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsError, setLeadsError] = useState('');
  const [dataLoading, setDataLoading] = useState(false);
  const [savingLead, setSavingLead] = useState(false);
  const [updatingLeadIds, setUpdatingLeadIds] = useState([]);
  const [deletingLeadIds, setDeletingLeadIds] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [activities, setActivities] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [automations, setAutomations] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const activeUser = useMemo(() => profile ? {
    ...mapProfile(profile),
    isCurrent: true,
  } : null, [profile]);
  const accessPending = Boolean(profile && !profile.is_active);

  const requestQuickCreate = useCallback((module) => {
    setActiveModule(module);
    setQuickCreateRequest({ module, nonce: crypto.randomUUID() });
  }, []);

  const [activeModule, setActiveModule] = useState('dashboard');
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const defaults = {
      checkbox: true, lead: true, company: true, source: true, owner: true,
      status: true, stage: true, priority: true, expectedValue: true, quotationValue: true,
      quotationStatus: true, lastFollowUp: true, nextFollowUp: true,
      expectedClosingDate: true, actions: true,
    };
    try {
      const saved = localStorage.getItem('leadwise_visible_columns');
      if (!saved) return defaults;
      const { score, lastActivity, ...savedColumns } = JSON.parse(saved);
      return { ...defaults, ...savedColumns };
    } catch (error) {
      console.warn('Unable to load saved lead column preferences.', error);
      return defaults;
    }
  });
  const [activeSavedView, setActiveSavedView] = useState('all');
  const [toasts, setToasts] = useState([]);
  const [busy, setBusy] = useState({});

  const addToast = useCallback((message, type = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts(previous => [...previous, { id, message, type }]);
    window.setTimeout(() => setToasts(previous => previous.filter(toast => toast.id !== id)), 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(previous => previous.filter(toast => toast.id !== id));
  }, []);

  const addNotification = useCallback(async ({ userId, title, message, type = 'info', entityType, entityId }) => {
    try {
      const row = await createRecord('notifications', {
        userId: userId || activeUser?.id,
        title,
        message,
        type,
        entityType: entityType || null,
        entityId: entityId || null,
      });
      setNotifications(previous => [mapNotification(row), ...previous]);
      return row;
    } catch (error) {
      console.error('Failed to create notification:', error);
      addToast(`The CRM change was saved, but its notification could not be created: ${error.message || 'Supabase request failed.'}`, 'warning');
      return null;
    }
  }, [activeUser, addToast]);

  const dispatchAutomationEvent = useCallback(async (triggerType, entityType, entityId) => {
    if (!automations.some(rule => rule.active && rule.triggerType === triggerType)) return;
    try {
      const { error } = await getSupabaseClient().functions.invoke('process-automation', {
        body: { eventId: crypto.randomUUID(), triggerType, entityType, entityId },
      });
      if (error) throw error;
    } catch (error) {
      console.error(`Automation event ${triggerType} could not be processed:`, error);
      addToast(`Record saved, but automation "${triggerType}" was not run. Deploy the process-automation Edge Function and verify its secrets.`, 'warning');
    }
  }, [addToast, automations]);

  useEffect(() => {
    try {
      localStorage.setItem('leadwise_visible_columns', JSON.stringify(visibleColumns));
    } catch (error) {
      console.warn('Unable to save lead column preferences.', error);
    }
  }, [visibleColumns]);

  useEffect(() => {
    let mounted = true;
    const authParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const callbackError = authParams.get('error_description') || hashParams.get('error_description');
    const callbackErrorCode = authParams.get('error_code') || hashParams.get('error_code')
      || authParams.get('error') || hashParams.get('error');
    if (callbackError) {
      setAuthError(callbackError.replace(/\+/g, ' '));
    } else if (callbackErrorCode) {
      const errorMessage = callbackErrorCode.toLowerCase() === 'otp_expired'
        ? 'This confirmation link has expired or was already used. Request a new confirmation email and use its latest link.'
        : `Email confirmation failed (${callbackErrorCode.replaceAll('_', ' ')}). Request a new confirmation email and try again.`;
      setAuthError(errorMessage);
    }

    let subscription;
    try {
      const auth = getSupabaseClient().auth.onAuthStateChange((_event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
        if (newSession) setAuthError('');
        setAuthLoading(false);
      });
      subscription = auth.data.subscription;
    } catch (error) {
      setAuthError(error.message || 'Unable to connect to the authentication service.');
      setAuthLoading(false);
    }

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email, password) => {
    setAuthError('');
    try {
      const { error } = await getSupabaseClient().auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      const message = error.message || 'Sign-in failed. Verify your credentials and try again.';
      setAuthError(message);
      throw error;
    }
  }, []);

  const signUp = useCallback(async (email, password, fullName) => {
    setAuthError('');
    try {
      const { data, error } = await getSupabaseClient().auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
      return { needsEmailConfirmation: !data.session };
    } catch (error) {
      const message = error.message || 'Account creation failed. Try again.';
      setAuthError(message);
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await getSupabaseClient().auth.signOut();
    if (error) throw error;
    setProfile(null);
    setUsers([]);
    setLeads([]);
  }, []);

  const saveProfile = useCallback(async (fullName) => {
    const normalizedName = fullName.trim();
    if (!activeUser) return false;
    if (!normalizedName) {
      addToast('Full name is required.', 'warning');
      return false;
    }
    try {
      const { data, error } = await getSupabaseClient().from('profiles')
        .update({ full_name: normalizedName, avatar: normalizedName.slice(0, 2).toUpperCase() })
        .eq('id', activeUser.id).select('*').single();
      if (error) throw error;
      setProfile(data);
      setUsers(previous => previous.map(user => user.id === data.id ? mapProfile(data, true) : user));
      addToast('Profile updated.');
      return true;
    } catch (error) {
      console.error('Failed to update profile:', error);
      addToast(`Unable to update profile: ${error.message || 'Supabase request failed.'}`, 'danger');
      return false;
    }
  }, [activeUser, addToast]);

  const updateTeamMember = useCallback(async (userId, { role, isActive }) => {
    if (activeUser?.roleKey !== 'admin' || userId === activeUser.id) {
      addToast('Only an administrator can change another team member’s access.', 'danger');
      return false;
    }
    if (!['admin', 'sales_manager', 'sales_representative', 'viewer'].includes(role)) {
      addToast('Choose a valid CRM role.', 'warning');
      return false;
    }
    try {
      const { data, error } = await getSupabaseClient().from('profiles')
        .update({ role, is_active: Boolean(isActive) }).eq('id', userId).select('*').single();
      if (error) throw error;
      const updatedUser = mapProfile(data);
      setUsers(previous => previous.map(user => user.id === userId ? updatedUser : user));
      addToast(`Team access updated for ${updatedUser.name}.`);
      return true;
    } catch (error) {
      console.error(`Failed to update team member ${userId}:`, error);
      addToast(`Unable to update team member: ${error.message || 'Supabase request failed.'}`, 'danger');
      return false;
    }
  }, [activeUser, addToast]);

  const clearQuickCreateRequest = useCallback(() => setQuickCreateRequest(null), []);

  const loadLeads = useCallback(async () => {
    setLeadsLoading(true);
    setLeadsError('');
    try {
      const rows = await listRecords('leads');
      const loaded = rows.map(row => leadFromDatabase(row, users));
      setLeads(loaded);
      return loaded;
    } catch (error) {
      setLeadsError(error.message || 'Unable to load leads.');
      addToast(`Unable to load leads: ${error.message || 'Supabase request failed.'}`, 'danger');
      throw error;
    } finally {
      setLeadsLoading(false);
    }
  }, [addToast, users]);

  const loadCrmData = useCallback(async () => {
    if (!session) return;
    setDataLoading(true);
    try {
      const client = getSupabaseClient();
      const { data: profileRow, error: profileError } = await client
        .from('profiles').select('*').eq('id', session.user.id).single();
      if (profileError) throw profileError;
      setProfile(profileRow);
      if (!profileRow.is_active) {
        setUsers([mapProfile(profileRow, true)]);
        setLeads([]);
        setAccounts([]);
        setContacts([]);
        setDeals([]);
        setActivities([]);
        setFollowUps([]);
        setAutomations([]);
        setNotifications([]);
        return;
      }

      const { data: profileRows, error: usersError } = await client.from('profiles').select('*').order('full_name');
      if (usersError) throw usersError;
      const loadedUsers = profileRows.map(row => mapProfile(row, row.id === session.user.id));
      setUsers(loadedUsers);

      const [
        leadRows, accountRows, contactRows, opportunityRows,
        activityRows, followUpRows, automationRows, notificationRows,
      ] = await Promise.all([
        listRecords('leads'),
        listRecords('accounts'),
        listRecords('contacts'),
        listRecords('opportunities'),
        listRecords('activities', 'activity_time'),
        listRecords('follow_ups', 'due_at'),
        listRecords('automation_rules'),
        listRecords('notifications'),
      ]);
      const loadedLeads = leadRows.map(row => leadFromDatabase(row, loadedUsers));
      const loadedAccounts = accountRows.map(row => mapAccount(row, loadedUsers));
      const loadedContacts = contactRows.map(row => mapContact(row, loadedAccounts, loadedUsers));
      setLeads(loadedLeads);
      setAccounts(loadedAccounts);
      setContacts(loadedContacts);
      setDeals(opportunityRows.map(row => mapOpportunity(row, loadedAccounts, loadedContacts, loadedLeads, loadedUsers)));
      setActivities(activityRows.map(row => {
        const activity = mapActivity(row);
        const lead = loadedLeads.find(item => item.id === row.lead_id);
        const contact = loadedContacts.find(item => item.id === row.contact_id);
        const account = loadedAccounts.find(item => item.id === row.account_id);
        return {
          ...activity,
          leadName: contact?.name || (lead ? `${lead.firstName} ${lead.lastName}`.trim() : ''),
          company: account?.name || contact?.company || lead?.company || '',
          performedBy: loadedUsers.find(user => user.id === row.created_by)?.name || '',
        };
      }));
      setFollowUps(followUpRows.map(row => mapFollowUp(row, loadedLeads, loadedUsers)));
      setAutomations(automationRows.map(fromDatabaseRecord));
      setNotifications(notificationRows.map(mapNotification));
      setLeadsError('');
    } catch (error) {
      console.error('Failed to load CRM data from Supabase:', error);
      const message = error.message || 'Unable to load CRM data. Check your database migration and permissions.';
      setLeadsError(message);
      addToast(`Unable to load CRM data: ${message}`, 'danger');
    } finally {
      setDataLoading(false);
    }
  }, [addToast, session]);

  useEffect(() => {
    if (session) loadCrmData();
    else {
      setProfile(null);
      setUsers([]);
      setLeads([]);
      setContacts([]);
      setAccounts([]);
      setDeals([]);
      setActivities([]);
      setFollowUps([]);
      setAutomations([]);
      setNotifications([]);
    }
  }, [session, loadCrmData]);

  const checkDuplicateLead = useCallback((email, phone, excludeLeadId) => {
    if (!email && !phone) return null;
    return leads.find(lead => lead.id !== excludeLeadId && (
      (email && lead.email && lead.email.toLowerCase().trim() === email.toLowerCase().trim())
      || (phone && lead.phone && lead.phone.trim() === phone.trim())
    )) || null;
  }, [leads]);

  const addLead = useCallback(async (newLeadData) => {
    if (!activeUser) return null;
    setSavingLead(true);
    try {
      const ownerId = newLeadData.ownerId || activeUser.id;
      const ownerName = users.find(user => user.id === ownerId)?.name || activeUser.name;
      const leadDraft = {
        ...newLeadData,
        company: newLeadData.company.trim(),
        ownerId,
        ownerName,
        score: Number(newLeadData.score) || 0,
        expectedValue: Number(newLeadData.expectedValue) || 0,
        lastActivityDate: today(),
      };
      const row = await createRecord('leads', leadToDatabase(leadDraft, ownerName));
      const savedLead = leadFromDatabase(row, users);
      setLeads(previous => [savedLead, ...previous]);
      addToast(`Lead "${savedLead.firstName} ${savedLead.lastName}" created successfully.`);
      void dispatchAutomationEvent('New Lead Created', 'lead', savedLead.id);
      if (ownerId !== activeUser.id) {
        void addNotification({
          userId: ownerId,
          title: 'New lead assigned',
          message: `${savedLead.firstName} ${savedLead.lastName} was assigned to you.`,
          type: 'info',
          entityType: 'lead',
          entityId: savedLead.id,
        });
      }

      if (newLeadData.nextFollowUpDate) {
        await scheduleFollowUp({
          leadId: savedLead.id,
          title: `Follow-up with ${savedLead.firstName}`,
          type: 'Call',
          date: newLeadData.nextFollowUpDate,
          time: newLeadData.nextFollowUpTime,
          notes: newLeadData.nextFollowUpNote,
          assignedTo: savedLead.ownerId,
        });
      }
      return savedLead;
    } catch (error) {
      console.error('Failed to create lead:', error);
      addToast(`Unable to save lead: ${error.message || 'Supabase request failed.'}`, 'danger');
      return null;
    } finally {
      setSavingLead(false);
    }
  }, [activeUser, addNotification, addToast, dispatchAutomationEvent, users]);

  const updateLead = useCallback(async (
    leadId,
    updatedFields,
    leadSnapshot = null,
    successMessage = 'Lead details updated successfully.'
  ) => {
    const currentLead = leads.find(lead => lead.id === leadId) || leadSnapshot;
    if (!currentLead) {
      addToast('The lead could not be found in the current workspace.', 'danger');
      return false;
    }
    setUpdatingLeadIds(previous => [...new Set([...previous, leadId])]);
    try {
      const ownerId = updatedFields.ownerId || currentLead.ownerId || activeUser?.id;
      const ownerName = users.find(user => user.id === ownerId)?.name || currentLead.ownerName;
      const { error, data } = await getSupabaseClient()
        .from('leads')
        .update(leadChangesToDatabase(currentLead, { ...updatedFields, ownerId }, ownerName))
        .eq('id', leadId).select('*').single();
      if (error) throw error;
      const updated = leadFromDatabase(data, users);
      setLeads(previous => previous.map(lead => lead.id === leadId ? updated : lead));
      addToast(successMessage);
      const triggerTypes = [];
      if (updatedFields.status && updatedFields.status !== currentLead.status) triggerTypes.push('Lead Status Changed');
      if (updatedFields.stage && updatedFields.stage !== currentLead.stage) triggerTypes.push('Lead Stage Changed');
      if (updatedFields.ownerId && updatedFields.ownerId !== currentLead.ownerId) triggerTypes.push('Lead Assigned');
      if (updatedFields.score !== undefined && updatedFields.score !== currentLead.score) triggerTypes.push('Lead Score Changed');
      if (updatedFields.priority && updatedFields.priority !== currentLead.priority) triggerTypes.push('Priority Changed');
      if (updatedFields.qualifiedAt) triggerTypes.push('Lead Qualified');
      if (!triggerTypes.length) triggerTypes.push('Lead Updated');
      triggerTypes.forEach(trigger => void dispatchAutomationEvent(trigger, 'lead', leadId));
      return true;
    } catch (error) {
      console.error(`Failed to update lead ${leadId}:`, error);
      addToast(`Unable to update lead: ${error.message || 'Supabase request failed.'}`, 'danger');
      return false;
    } finally {
      setUpdatingLeadIds(previous => previous.filter(id => id !== leadId));
    }
  }, [activeUser, addToast, dispatchAutomationEvent, leads, users]);

  const deleteLead = useCallback(async (leadId) => {
    setDeletingLeadIds(previous => [...new Set([...previous, leadId])]);
    try {
      await deleteRecord('leads', leadId);
      setLeads(previous => previous.filter(lead => lead.id !== leadId));
      setActivities(previous => previous.filter(activity => activity.leadId !== leadId));
      setFollowUps(previous => previous.filter(followUp => followUp.leadId !== leadId));
      setContacts(previous => previous.map(contact => contact.leadId === leadId ? { ...contact, leadId: '' } : contact));
      setDeals(previous => previous.map(deal => {
        if (deal.leadId !== leadId) return deal;
        const linkedContact = contacts.find(contact => contact.id === deal.contactId);
        const linkedAccount = accounts.find(account => account.id === deal.accountId);
        return {
          ...deal,
          leadId: '',
          company: linkedAccount?.name || linkedContact?.company || '',
          contactName: linkedContact?.name || '',
          contactEmail: linkedContact?.email || '',
        };
      }));
      addToast('Lead deleted.');
      return true;
    } catch (error) {
      console.error(`Failed to delete lead ${leadId}:`, error);
      addToast(`Unable to delete lead: ${error.message || 'Supabase request failed.'}`, 'danger');
      return false;
    } finally {
      setDeletingLeadIds(previous => previous.filter(id => id !== leadId));
    }
  }, [accounts, addToast, contacts]);

  const bulkUpdateLeads = useCallback(async (leadIds, changes) => {
    const firstLead = leads.find(lead => leadIds.includes(lead.id));
    if (!firstLead || !leadIds.length) return false;
    setUpdatingLeadIds(previous => [...new Set([...previous, ...leadIds])]);
    try {
      const ownerId = changes.ownerId || firstLead.ownerId || activeUser?.id;
      const ownerName = users.find(user => user.id === ownerId)?.name || firstLead.ownerName;
      const { data, error } = await getSupabaseClient().from('leads')
        .update(leadChangesToDatabase(firstLead, { ...changes, ownerId }, ownerName))
        .in('id', leadIds).select('*');
      if (error) throw error;
      const updated = data.map(row => leadFromDatabase(row, users));
      const byId = new Map(updated.map(lead => [lead.id, lead]));
      setLeads(previous => previous.map(lead => byId.get(lead.id) || lead));
      if (updated.length !== leadIds.length) {
        addToast(`Updated ${updated.length} of ${leadIds.length} selected leads. Some records may not be authorized.`, 'warning');
        return false;
      }
      addToast(`Updated ${updated.length} lead(s).`);
      return true;
    } catch (error) {
      console.error('Failed to bulk update leads:', error);
      addToast(`Unable to update leads: ${error.message || 'Supabase request failed.'}`, 'danger');
      return false;
    } finally {
      setUpdatingLeadIds(previous => previous.filter(id => !leadIds.includes(id)));
    }
  }, [activeUser, addToast, leads, users]);

  const bulkDeleteLeads = useCallback(async (leadIds) => {
    setDeletingLeadIds(previous => [...new Set([...previous, ...leadIds])]);
    try {
      const { data, error } = await getSupabaseClient().from('leads').delete().in('id', leadIds).select('id');
      if (error) throw error;
      const deleted = new Set(data.map(row => row.id));
      setLeads(previous => previous.filter(lead => !deleted.has(lead.id)));
      if (deleted.size) {
        setActivities(previous => previous.filter(activity => !deleted.has(activity.leadId)));
        setFollowUps(previous => previous.filter(followUp => !deleted.has(followUp.leadId)));
        setContacts(previous => previous.map(contact => deleted.has(contact.leadId) ? { ...contact, leadId: '' } : contact));
        setDeals(previous => previous.map(deal => {
          if (!deleted.has(deal.leadId)) return deal;
          const linkedContact = contacts.find(contact => contact.id === deal.contactId);
          const linkedAccount = accounts.find(account => account.id === deal.accountId);
          return {
            ...deal,
            leadId: '',
            company: linkedAccount?.name || linkedContact?.company || '',
            contactName: linkedContact?.name || '',
            contactEmail: linkedContact?.email || '',
          };
        }));
      }
      if (deleted.size !== leadIds.length) {
        addToast(`Deleted ${deleted.size} of ${leadIds.length} selected leads. Some records may not be authorized.`, 'warning');
        return false;
      }
      addToast(`Deleted ${deleted.size} lead(s).`);
      return true;
    } catch (error) {
      console.error('Failed to bulk delete leads:', error);
      addToast(`Unable to delete leads: ${error.message || 'Supabase request failed.'}`, 'danger');
      return false;
    } finally {
      setDeletingLeadIds(previous => previous.filter(id => !leadIds.includes(id)));
    }
  }, [accounts, addToast, contacts]);

  const saveAccount = useCallback(async (record, id) => {
    const key = id || 'new-account';
    setBusy(previous => ({ ...previous, [key]: true }));
    try {
      const payload = { ...record, ownerId: record.ownerId || activeUser?.id };
      const row = id ? await updateRecord('accounts', id, payload) : await createRecord('accounts', payload);
      const saved = mapAccount(row, users);
      setAccounts(previous => id ? previous.map(item => item.id === id ? saved : item) : [saved, ...previous]);
      addToast(id ? 'Account updated.' : 'Account created.');
      if (!id) void dispatchAutomationEvent('Account Created', 'account', saved.id);
      return saved;
    } catch (error) {
      console.error('Failed to save account:', error);
      addToast(`Unable to save account: ${error.message || 'Supabase request failed.'}`, 'danger');
      return null;
    } finally {
      setBusy(previous => ({ ...previous, [key]: false }));
    }
  }, [activeUser, addToast, dispatchAutomationEvent, users]);

  const deleteAccount = useCallback(async (id) => {
    try {
      await deleteRecord('accounts', id);
      setAccounts(previous => previous.filter(item => item.id !== id));
      setContacts(previous => previous.map(contact => contact.accountId === id
        ? { ...contact, accountId: '', company: '' }
        : contact));
      setDeals(previous => previous.map(deal => {
        if (deal.accountId !== id) return deal;
        const linkedLead = leads.find(lead => lead.id === deal.leadId);
        return { ...deal, accountId: '', company: linkedLead?.company || '' };
      }));
      addToast('Account deleted.');
      return true;
    } catch (error) {
      console.error(`Failed to delete account ${id}:`, error);
      addToast(`Unable to delete account: ${error.message || 'Supabase request failed.'}`, 'danger');
      return false;
    }
  }, [addToast, leads]);

  const saveContact = useCallback(async (record, id) => {
    const [firstName, ...lastNameParts] = (record.name || '').trim().split(/\s+/);
    const payload = {
      firstName: firstName || '',
      lastName: lastNameParts.join(' '),
      email: record.email || null,
      phone: record.phone || null,
      jobTitle: record.title || null,
      accountId: record.accountId || null,
      leadId: record.leadId || null,
      ownerId: record.ownerId || activeUser?.id,
      status: record.status || 'Active',
      description: record.description || null,
    };
    const key = id || 'new-contact';
    setBusy(previous => ({ ...previous, [key]: true }));
    try {
      const row = id ? await updateRecord('contacts', id, payload) : await createRecord('contacts', payload);
      const saved = mapContact(row, accounts, users);
      setContacts(previous => id ? previous.map(item => item.id === id ? saved : item) : [saved, ...previous]);
      addToast(id ? 'Contact updated.' : 'Contact created.');
      if (!id) void dispatchAutomationEvent('Contact Created', 'contact', saved.id);
      return saved;
    } catch (error) {
      console.error('Failed to save contact:', error);
      addToast(`Unable to save contact: ${error.message || 'Supabase request failed.'}`, 'danger');
      return null;
    } finally {
      setBusy(previous => ({ ...previous, [key]: false }));
    }
  }, [activeUser, accounts, addToast, dispatchAutomationEvent, users]);

  const deleteContact = useCallback(async (id) => {
    try {
      await deleteRecord('contacts', id);
      setContacts(previous => previous.filter(item => item.id !== id));
      setDeals(previous => previous.map(deal => {
        if (deal.contactId !== id) return deal;
        const linkedLead = leads.find(lead => lead.id === deal.leadId);
        return {
          ...deal,
          contactId: '',
          contactName: linkedLead ? `${linkedLead.firstName} ${linkedLead.lastName}`.trim() : '',
          contactEmail: linkedLead?.email || '',
        };
      }));
      setActivities(previous => previous.map(activity => activity.contactId === id ? { ...activity, contactId: '' } : activity));
      addToast('Contact deleted.');
      return true;
    } catch (error) {
      console.error(`Failed to delete contact ${id}:`, error);
      addToast(`Unable to delete contact: ${error.message || 'Supabase request failed.'}`, 'danger');
      return false;
    }
  }, [addToast, leads]);

  const saveOpportunity = useCallback(async (record, id) => {
    const payload = {
      name: record.title || record.name,
      leadId: record.leadId || null,
      accountId: record.accountId || null,
      contactId: record.contactId || null,
      ownerId: record.ownerId || activeUser?.id,
      value: Number(record.value) || 0,
      probability: Number(record.probability) || 0,
      stage: toOpportunityStage(record.stage || 'Prospecting'),
      status: record.stage === 'Won' || record.stage === 'Closed Won' ? 'Won'
        : record.stage === 'Lost' || record.stage === 'Closed Lost' ? 'Lost' : 'Open',
      expectedCloseDate: record.expectedCloseDate || null,
      nextAction: record.nextAction || null,
    };
    const key = id || 'new-opportunity';
    setBusy(previous => ({ ...previous, [key]: true }));
    try {
      const row = id ? await updateRecord('opportunities', id, payload) : await createRecord('opportunities', payload);
      const saved = mapOpportunity(row, accounts, contacts, leads, users);
      setDeals(previous => id ? previous.map(item => item.id === id ? saved : item) : [saved, ...previous]);
      addToast(id ? 'Opportunity updated.' : 'Opportunity created.');
      if (!id) {
        void dispatchAutomationEvent('Opportunity Created', 'opportunity', saved.id);
      } else {
        const previousDeal = deals.find(item => item.id === id);
        if (previousDeal?.stage !== saved.stage) {
          void dispatchAutomationEvent('Opportunity Stage Changed', 'opportunity', saved.id);
          if (saved.stage === 'Won') {
            void dispatchAutomationEvent('Opportunity Won', 'opportunity', saved.id);
            void addNotification({
              title: 'Opportunity won',
              message: `${saved.title} was marked Closed Won.`,
              type: 'success',
              entityType: 'opportunity',
              entityId: saved.id,
            });
          } else if (saved.stage === 'Lost') {
            void dispatchAutomationEvent('Opportunity Lost', 'opportunity', saved.id);
          }
        }
      }
      return saved;
    } catch (error) {
      console.error('Failed to save opportunity:', error);
      addToast(`Unable to save opportunity: ${error.message || 'Supabase request failed.'}`, 'danger');
      return null;
    } finally {
      setBusy(previous => ({ ...previous, [key]: false }));
    }
  }, [activeUser, accounts, addNotification, addToast, contacts, deals, dispatchAutomationEvent, leads, users]);

  const deleteOpportunity = useCallback(async (id) => {
    try {
      await deleteRecord('opportunities', id);
      setDeals(previous => previous.filter(item => item.id !== id));
      addToast('Opportunity deleted.');
      return true;
    } catch (error) {
      console.error(`Failed to delete opportunity ${id}:`, error);
      addToast(`Unable to delete opportunity: ${error.message || 'Supabase request failed.'}`, 'danger');
      return false;
    }
  }, [addToast]);

  const addActivity = useCallback(async (activityData) => {
    const lead = leads.find(item => item.id === (activityData.leadId || selectedLeadId));
    const type = toActivityType(activityData.type || 'Note');
    if (!activityTypes.has(type)) {
      addToast(`Unsupported activity type: ${activityData.type}`, 'danger');
      return null;
    }
    const payload = {
      leadId: activityData.leadId || selectedLeadId || null,
      contactId: activityData.contactId || null,
      accountId: activityData.accountId || null,
      opportunityId: activityData.opportunityId || null,
      type,
      subject: activityData.subject || null,
      description: activityData.description || 'Activity logged.',
      activityTime: activityData.activityTime || new Date().toISOString(),
      duration: activityData.duration ? Number(activityData.duration) : null,
      outcome: activityData.outcome || null,
      createdBy: activeUser?.id,
    };
    try {
      const row = await createRecord('activities', payload);
      const activity = {
        ...mapActivity(row),
        leadName: lead ? `${lead.firstName} ${lead.lastName}`.trim() : '',
        company: lead?.company || '',
        performedBy: activeUser?.name || '',
      };
      setActivities(previous => [activity, ...previous]);
      if (lead && payload.leadId) await updateLead(lead.id, { lastActivityDate: today() });
      void dispatchAutomationEvent('Activity Logged', 'activity', activity.id);
      addToast('Activity logged.');
      return activity;
    } catch (error) {
      console.error('Failed to log activity:', error);
      addToast(`Unable to log activity: ${error.message || 'Supabase request failed.'}`, 'danger');
      return null;
    }
  }, [activeUser, addToast, dispatchAutomationEvent, leads, selectedLeadId, updateLead]);

  const qualifyLead = useCallback(async (leadId, qualificationDetails = {}) => {
    const target = leads.find(lead => lead.id === leadId);
    if (!target) return false;
    const updated = await updateLead(leadId, {
      status: 'Qualified',
      score: Math.max(target.score, 85),
      qualificationDetails,
      qualifiedAt: new Date().toISOString(),
    });
    if (!updated) return false;
    await addActivity({
      leadId,
      type: 'Note',
      subject: 'Lead qualified',
      description: 'Lead qualification confirmed.',
      outcome: 'Qualified',
    });
    return true;
  }, [addActivity, leads, updateLead]);

  const createOpportunityFromLead = useCallback(async (leadId, dealData = {}) => {
    const lead = leads.find(item => item.id === leadId);
    if (!lead) {
      addToast('The lead could not be found.', 'danger');
      return null;
    }
    const account = accounts.find(item => item.name.toLowerCase() === lead.company.toLowerCase());
    let contact = contacts.find(item => item.leadId === lead.id)
      || contacts.find(item => item.email && item.email.toLowerCase() === lead.email.toLowerCase());
    if (!contact) {
      contact = await saveContact({
        name: `${lead.firstName} ${lead.lastName}`.trim(),
        email: lead.email,
        phone: lead.phone,
        title: lead.title,
        accountId: account?.id,
        leadId: lead.id,
        ownerId: lead.ownerId,
      });
      if (!contact) return null;
    }
    const savedDeal = await saveOpportunity({
      title: dealData.title || `${lead.company} CRM Deal`,
      leadId: lead.id,
      accountId: account?.id,
      contactId: contact.id,
      value: dealData.value ?? lead.expectedValue,
      probability: dealData.probability ?? 40,
      stage: dealData.stage || 'Discovery',
      expectedCloseDate: dealData.expectedCloseDate || lead.expectedCloseDate,
      nextAction: dealData.nextAction || 'Schedule proposal call',
      ownerId: lead.ownerId,
    });
    if (!savedDeal) return null;
    const converted = await updateLead(leadId, {
      status: 'Converted',
      stage: savedDeal.stage,
      accountId: account?.id || null,
      contactId: contact.id,
    });
    if (!converted) {
      addToast('The opportunity was saved, but the lead could not be marked Converted or linked. Review the opportunity before retrying.', 'danger');
      return null;
    }
    return savedDeal;
  }, [accounts, addToast, contacts, leads, saveContact, saveOpportunity, updateLead]);

  const moveDealStage = useCallback(async (dealId, newStage) => {
    const probabilityByStage = {
      Prospecting: 20, Discovery: 40, Demo: 60, Proposal: 80,
      Negotiation: 90, Won: 100, Lost: 0, 'Closed Won': 100, 'Closed Lost': 0,
    };
    const deal = deals.find(item => item.id === dealId);
    if (!deal) return false;
    return Boolean(await saveOpportunity({
      ...deal,
      stage: newStage,
      probability: probabilityByStage[newStage] ?? deal.probability,
    }, dealId));
  }, [deals, saveOpportunity]);

  const scheduleFollowUp = useCallback(async (followUpData) => {
    try {
      const row = await createRecord('follow_ups', {
        leadId: followUpData.leadId || selectedLeadId || null,
        assignedTo: followUpData.assignedTo || activeUser?.id,
        type: followUpData.type || 'Call',
        title: followUpData.title || 'Follow-up task',
        description: followUpData.notes || followUpData.description || null,
        dueAt: parseDueAt(followUpData.date || today(), followUpData.time),
        status: 'Upcoming',
        reminderAt: followUpData.reminderAt || null,
        createdBy: activeUser?.id,
      });
      const saved = mapFollowUp(row, leads, users);
      setFollowUps(previous => [saved, ...previous]);
      void dispatchAutomationEvent('Follow-up Created', 'follow_up', saved.id);
      addToast('Follow-up scheduled.');
      return saved;
    } catch (error) {
      console.error('Failed to schedule follow-up:', error);
      addToast(`Unable to schedule follow-up: ${error.message || 'Supabase request failed.'}`, 'danger');
      return null;
    }
  }, [activeUser, addToast, dispatchAutomationEvent, leads, selectedLeadId, users]);

  const completeFollowUp = useCallback(async (id) => {
    try {
      const row = await updateRecord('follow_ups', id, { status: 'Completed', completedAt: new Date().toISOString() });
      const completed = mapFollowUp(row, leads, users);
      setFollowUps(previous => previous.map(item => item.id === id ? completed : item));
      void dispatchAutomationEvent('Follow-up Completed', 'follow_up', id);
      addToast('Follow-up marked as completed.');
      return true;
    } catch (error) {
      console.error(`Failed to complete follow-up ${id}:`, error);
      addToast(`Unable to complete follow-up: ${error.message || 'Supabase request failed.'}`, 'danger');
      return false;
    }
  }, [addToast, dispatchAutomationEvent, leads, users]);

  const saveAutomation = useCallback(async (rule, id) => {
    try {
      const payload = {
        name: rule.name.trim(),
        description: rule.description || null,
        active: rule.active ?? false,
        triggerType: rule.triggerType || 'New Lead Created',
        conditions: rule.conditions || { match: 'all', rules: [] },
        actions: rule.actions || [],
        createdBy: activeUser?.id,
      };
      const row = id ? await updateRecord('automation_rules', id, payload) : await createRecord('automation_rules', payload);
      const saved = fromDatabaseRecord(row);
      setAutomations(previous => id ? previous.map(item => item.id === id ? saved : item) : [saved, ...previous]);
      addToast(id ? 'Automation rule updated.' : 'Automation rule saved. It runs only after its backend trigger is configured.');
      return saved;
    } catch (error) {
      console.error('Failed to save automation rule:', error);
      addToast(`Unable to save automation rule: ${error.message || 'Supabase request failed.'}`, 'danger');
      return null;
    }
  }, [activeUser, addToast]);

  const markNotificationAsRead = useCallback(async (id) => {
    try {
      const row = await updateRecord('notifications', id, { readAt: new Date().toISOString() });
      setNotifications(previous => previous.map(item => item.id === id ? mapNotification(row) : item));
    } catch (error) {
      console.error(`Failed to mark notification ${id} as read:`, error);
      addToast(`Unable to update notification: ${error.message || 'Supabase request failed.'}`, 'danger');
    }
  }, [addToast]);

  const markAllNotificationsAsRead = useCallback(async () => {
    const unreadIds = notifications.filter(item => !item.read).map(item => item.id);
    if (!unreadIds.length) return;
    try {
      const { error } = await getSupabaseClient().from('notifications')
        .update({ read_at: new Date().toISOString() }).in('id', unreadIds);
      if (error) throw error;
      setNotifications(previous => previous.map(item => ({ ...item, read: true })));
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
      addToast(`Unable to update notifications: ${error.message || 'Supabase request failed.'}`, 'danger');
    }
  }, [addToast, notifications]);

  const deleteAutomation = useCallback(async (id) => {
    try {
      await deleteRecord('automation_rules', id);
      setAutomations(previous => previous.filter(rule => rule.id !== id));
      addToast('Automation rule deleted.');
      return true;
    } catch (error) {
      console.error(`Failed to delete automation rule ${id}:`, error);
      addToast(`Unable to delete automation rule: ${error.message || 'Supabase request failed.'}`, 'danger');
      return false;
    }
  }, [addToast]);

  const viewLead360 = useCallback((leadId) => {
    setSelectedLeadId(leadId);
    setActiveModule('lead-360');
  }, []);

  const value = {
    session, authLoading, authError, signIn, signUp, signOut, accessPending, dataLoading,
    users, activeUser, leads, leadsLoading: leadsLoading || dataLoading,
    leadsError, reloadLeads: loadLeads, reloadCrmData: loadCrmData,
    savingLead, updatingLeadIds, deletingLeadIds, contacts, accounts, deals,
    activities, followUps, automations, notifications, activeModule, setActiveModule,
    quickCreateRequest, requestQuickCreate, clearQuickCreateRequest,
    selectedLeadId, setSelectedLeadId, viewLead360, isAddLeadOpen, setIsAddLeadOpen,
    isCommandPaletteOpen, setIsCommandPaletteOpen, isNotificationDrawerOpen,
    setIsNotificationDrawerOpen, editingLeadId, setEditingLeadId,
    visibleColumns, setVisibleColumns,
    activeSavedView, setActiveSavedView, toasts, addToast, removeToast,
    busy, checkDuplicateLead, addLead, updateLead, deleteLead, bulkUpdateLeads,
    bulkDeleteLeads, saveAccount, deleteAccount, saveContact, deleteContact,
    saveOpportunity, deleteOpportunity, qualifyLead, createOpportunityFromLead,
    moveDealStage, addActivity, scheduleFollowUp, completeFollowUp,
    saveAutomation, deleteAutomation, addNotification,
    saveProfile, updateTeamMember,
    markNotificationAsRead, markAllNotificationsAsRead,
  };

  return <CRMContext.Provider value={value}>{children}</CRMContext.Provider>;
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) throw new Error('useCRM must be used within a CRMProvider');
  return context;
};

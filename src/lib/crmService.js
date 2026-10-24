import { getSupabaseClient } from './supabase';

const toDatabaseKey = key => key.replace(/[A-Z]/g, character => `_${character.toLowerCase()}`);
const fromDatabaseKey = key => key.replace(/_([a-z])/g, (_, character) => character.toUpperCase());
const recordColumns = {
  leads: new Set([
    'name', 'email', 'phone', 'job_title', 'company', 'industry', 'website', 'source', 'owner',
    'owner_id', 'owner_user_id', 'status', 'stage', 'priority', 'score', 'product_interest',
    'expected_value', 'expected_close_date', 'quotation_value', 'quotation_status',
    'quotation_attachment_path', 'quotation_attachment_name', 'quotation_attachment_size',
    'quotation_attachment_type', 'quotation_uploaded_at', 'next_follow_up', 'next_follow_up_time',
    'next_follow_up_note', 'preferred_contact_method', 'notes', 'requirement', 'tags',
    'company_size', 'location', 'last_activity_date', 'qualification_details', 'qualified_at',
    'account_id', 'contact_id',
  ]),
  accounts: new Set(['name', 'industry', 'website', 'phone', 'email', 'company_size', 'location', 'owner_id', 'status', 'description', 'tags']),
  contacts: new Set(['first_name', 'last_name', 'email', 'phone', 'job_title', 'account_id', 'lead_id', 'owner_id', 'status', 'description']),
  opportunities: new Set(['name', 'lead_id', 'account_id', 'contact_id', 'owner_id', 'value', 'probability', 'stage', 'status', 'expected_close_date', 'next_action']),
  activities: new Set(['lead_id', 'contact_id', 'account_id', 'opportunity_id', 'type', 'subject', 'description', 'activity_time', 'duration', 'outcome', 'created_by']),
  follow_ups: new Set(['lead_id', 'assigned_to', 'type', 'title', 'description', 'due_at', 'status', 'reminder_at', 'completed_at', 'created_by']),
  automation_rules: new Set(['name', 'description', 'active', 'trigger_type', 'conditions', 'actions', 'created_by']),
  notifications: new Set(['user_id', 'title', 'message', 'type', 'entity_type', 'entity_id', 'read_at']),
};

export const fromDatabaseRecord = record => {
  if (!record) return record;
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [fromDatabaseKey(key), value]));
};

const toDatabaseRecord = (table, record) => {
  const allowedColumns = recordColumns[table];
  if (!allowedColumns) throw new Error(`Unsupported CRM table: ${table}`);
  return Object.fromEntries(Object.entries(record)
    .map(([key, value]) => [toDatabaseKey(key), value])
    .filter(([column]) => allowedColumns.has(column)));
};

export const listRecords = async (table, orderBy = 'created_at') => {
  const { data, error } = await getSupabaseClient().from(table).select('*').order(orderBy, { ascending: false });
  if (error) throw error;
  return data || [];
};

export const createRecord = async (table, record) => {
  const { data, error } = await getSupabaseClient()
    .from(table).insert(toDatabaseRecord(table, record)).select('*').single();
  if (error) throw error;
  return data;
};

export const updateRecord = async (table, id, record) => {
  const { data, error } = await getSupabaseClient()
    .from(table).update(toDatabaseRecord(table, record)).eq('id', id).select('*').single();
  if (error) throw error;
  return data;
};

export const deleteRecord = async (table, id) => {
  const { error } = await getSupabaseClient().from(table).delete().eq('id', id).select('id').single();
  if (error) throw error;
};

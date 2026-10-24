import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const allowedEvents = {
  lead: new Set(['New Lead Created', 'Lead Updated', 'Lead Status Changed', 'Lead Stage Changed', 'Lead Assigned', 'Lead Qualified', 'Lead Score Changed', 'Priority Changed']),
  follow_up: new Set(['Follow-up Created', 'Follow-up Due', 'Follow-up Overdue', 'Follow-up Completed']),
  opportunity: new Set(['Opportunity Created', 'Opportunity Stage Changed', 'Opportunity Won', 'Opportunity Lost']),
  account: new Set(['Account Created']),
  contact: new Set(['Contact Created']),
  activity: new Set(['Activity Logged']),
};

const leadColumns = {
  source: 'source',
  status: 'status',
  stage: 'stage',
  priority: 'priority',
  owner: 'owner_user_id',
  owner_id: 'owner_user_id',
  owner_user_id: 'owner_user_id',
  industry: 'industry',
  company: 'company',
  company_size: 'company_size',
  location: 'location',
  score: 'score',
  expected_value: 'expected_value',
  expected_close_date: 'expected_close_date',
  next_follow_up: 'next_follow_up',
  last_activity_date: 'last_activity_date',
  email: 'email',
  phone: 'phone',
  job_title: 'job_title',
  product_interest: 'product_interest',
  preferred_contact_method: 'preferred_contact_method',
  tags: 'tags',
  created_at: 'created_at',
  updated_at: 'updated_at',
};

const asText = value => value == null ? '' : String(value).toLocaleLowerCase();
const allowedValues = {
  status: new Set(['New', 'Contacted', 'Working', 'Qualified', 'Converted', 'Lost']),
  stage: new Set(['Prospecting', 'Discovery', 'Demo', 'Proposal', 'Negotiation']),
  priority: new Set(['Low', 'Medium', 'High']),
};

const testRule = (row, conditions) => {
  const rules = Array.isArray(conditions?.rules) ? conditions.rules : [];
  if (!rules.length) return true;
  const results = rules.map(condition => {
    const column = leadColumns[condition.field];
    if (!column || !['lead'].includes(row.__entityType)) return false;
    const actual = row[column];
    const expected = condition.value;
    switch (condition.operator) {
      case 'equals': return asText(actual) === asText(expected);
      case 'not_equals': return asText(actual) !== asText(expected);
      case 'contains': return Array.isArray(actual) ? actual.includes(expected) : asText(actual).includes(asText(expected));
      case 'does_not_contain': return Array.isArray(actual) ? !actual.includes(expected) : !asText(actual).includes(asText(expected));
      case 'starts_with': return asText(actual).startsWith(asText(expected));
      case 'is_empty': return actual == null || actual === '' || (Array.isArray(actual) && actual.length === 0);
      case 'is_not_empty': return !(actual == null || actual === '' || (Array.isArray(actual) && actual.length === 0));
      case 'greater_than': return Number(actual) > Number(expected);
      case 'greater_or_equal': return Number(actual) >= Number(expected);
      case 'less_than': return Number(actual) < Number(expected);
      case 'less_or_equal': return Number(actual) <= Number(expected);
      case 'before': return String(actual || '').slice(0, 10) < String(expected || '').slice(0, 10);
      case 'after': return String(actual || '').slice(0, 10) > String(expected || '').slice(0, 10);
      case 'on': return String(actual || '').slice(0, 10) === String(expected || '').slice(0, 10);
      case 'contains_tag': return Array.isArray(actual) && actual.includes(expected);
      default: return false;
    }
  });
  return conditions.match === 'any' ? results.some(Boolean) : results.every(Boolean);
};

const respond = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json' },
});

Deno.serve(async request => {
  if (request.method !== 'POST') return respond({ error: 'Method not allowed.' }, 405);

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return respond({ error: 'Authentication required.' }, 401);
  const token = authorization.slice('Bearer '.length);
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) return respond({ error: 'Automation backend configuration is incomplete.' }, 500);

  const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') || serviceRoleKey, {
    global: { headers: { Authorization: authorization } },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: userResult, error: userError } = await userClient.auth.getUser(token);
  if (userError || !userResult.user) return respond({ error: 'Invalid authentication token.' }, 401);
  const { data: callerProfile, error: profileError } = await userClient.from('profiles')
    .select('role,is_active').eq('id', userResult.user.id).single();
  if (profileError || !callerProfile?.is_active) return respond({ error: 'Active CRM membership is required.' }, 403);
  if (!['admin', 'sales_manager', 'sales_representative'].includes(callerProfile.role)) {
    return respond({ error: 'Your CRM role cannot execute automation events.' }, 403);
  }

  let event;
  try {
    event = await request.json();
  } catch {
    return respond({ error: 'Expected a JSON event payload.' }, 400);
  }
  const { eventId, triggerType, entityType, entityId } = event || {};
  const entityTable = {
    lead: 'leads',
    follow_up: 'follow_ups',
    opportunity: 'opportunities',
    account: 'accounts',
    contact: 'contacts',
    activity: 'activities',
  }[entityType];
  const uuidPattern = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
  if (!entityTable || !allowedEvents[entityType].has(triggerType)
    || !uuidPattern.test(eventId || '')
    || !uuidPattern.test(entityId || '')) {
    return respond({ error: 'Invalid automation event.' }, 400);
  }

  const { data: accessibleRow, error: accessError } = await userClient
    .from(entityTable).select('id').eq('id', entityId).maybeSingle();
  if (accessError) return respond({ error: accessError.message }, 403);
  if (!accessibleRow) return respond({ error: 'Record not found or access denied.' }, 404);

  const { data: sourceRow, error: entityError } = await adminClient
    .from(entityTable).select('*').eq('id', entityId).single();
  if (entityError) return respond({ error: entityError.message }, 404);
  sourceRow.__entityType = entityType;

  const { data: rules, error: rulesError } = await adminClient
    .from('automation_rules').select('*').eq('active', true).eq('trigger_type', triggerType);
  if (rulesError) return respond({ error: rulesError.message }, 500);

  const results = [];
  for (const rule of rules || []) {
    const { error: logError } = await adminClient.from('automation_logs').insert({
      rule_id: rule.id,
      event_id: eventId,
      entity_type: entityType,
      entity_id: entityId,
      trigger_type: triggerType,
      status: 'running',
    });
    if (logError?.code === '23505') {
      results.push({ ruleId: rule.id, status: 'skipped', message: 'Duplicate event already processed.' });
      continue;
    }
    if (logError) return respond({ error: `Unable to begin automation log: ${logError.message}` }, 500);

    try {
      if (!testRule(sourceRow, rule.conditions)) {
        await adminClient.from('automation_logs').update({ status: 'skipped', message: 'Conditions did not match.' })
          .eq('rule_id', rule.id).eq('event_id', eventId);
        results.push({ ruleId: rule.id, status: 'skipped' });
        continue;
      }

      const actions = Array.isArray(rule.actions) ? rule.actions : [];
      if (!actions.length) throw new Error('Automation rule has no actions.');
      for (const action of actions) {
        if (action.type === 'create_notification') {
          const notificationUserId = action.userId || sourceRow.owner_user_id || sourceRow.owner_id
            || sourceRow.assigned_to || sourceRow.created_by || userResult.user.id;
          if (callerProfile.role === 'sales_representative' && notificationUserId !== userResult.user.id) {
            throw new Error('Sales representatives may only create automation notifications for themselves.');
          }
          const { error } = await adminClient.from('notifications').insert({
            user_id: notificationUserId,
            title: String(action.title || rule.name).slice(0, 200),
            message: String(action.message || `${rule.name} ran for ${sourceRow.name || sourceRow.company || 'a CRM record'}.`).slice(0, 2000),
            type: ['info', 'warning', 'danger', 'success'].includes(action.notificationType) ? action.notificationType : 'info',
            entity_type: entityType,
            entity_id: entityId,
          });
          if (error) throw error;
          continue;
        }

        if (entityType === 'lead') {
          let update = null;
          if (action.type === 'change_status' && allowedValues.status.has(action.value)) update = { status: action.value };
          if (action.type === 'change_stage' && allowedValues.stage.has(action.value)) update = { stage: action.value };
          if (action.type === 'change_priority' && allowedValues.priority.has(action.value)) update = { priority: action.value };
          if (action.type === 'assign_owner' && /^[0-9a-f-]{36}$/i.test(action.ownerId || '')) {
            const { data: owner, error: ownerError } = await adminClient.from('profiles')
              .select('id,full_name').eq('id', action.ownerId).maybeSingle();
            if (ownerError) throw ownerError;
            if (!owner) throw new Error('Selected owner does not exist.');
            if (callerProfile.role === 'sales_representative' && owner.id !== userResult.user.id) {
              throw new Error('Sales representatives cannot reassign records through automation.');
            }
            update = { owner_user_id: owner.id, owner: owner.full_name || action.ownerName || null };
          }
          if (action.type === 'update_lead_field' && ['status', 'stage', 'priority', 'score', 'source', 'industry', 'company', 'company_size', 'location', 'expected_value', 'expected_close_date', 'product_interest'].includes(action.field)) {
            if (allowedValues[action.field] && !allowedValues[action.field].has(action.value)) throw new Error(`Invalid value for ${action.field}.`);
            update = { [action.field]: action.value };
          }
          if ((action.type === 'add_tag' || action.type === 'remove_tag') && typeof action.value === 'string' && action.value.trim()) {
            const tags = Array.isArray(sourceRow.tags) ? [...sourceRow.tags] : [];
            update = { tags: action.type === 'add_tag'
              ? [...new Set([...tags, action.value.trim()])]
              : tags.filter(tag => tag !== action.value.trim()) };
          }
          if (update) {
            const { error } = await adminClient.from('leads').update(update).eq('id', entityId);
            if (error) throw error;
            Object.assign(sourceRow, update);
          } else {
            throw new Error(`Unsupported lead automation action: ${action.type}`);
          }
        } else if (entityType === 'opportunity' && ['update_opportunity_stage', 'mark_opportunity_won', 'mark_opportunity_lost'].includes(action.type)) {
          const stage = action.type === 'mark_opportunity_won' ? 'Closed Won'
            : action.type === 'mark_opportunity_lost' ? 'Closed Lost' : action.value;
          if (!['Prospecting', 'Discovery', 'Demo', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'].includes(stage)) {
            throw new Error('Invalid opportunity stage.');
          }
          const status = stage === 'Closed Won' ? 'Won' : stage === 'Closed Lost' ? 'Lost' : 'Open';
          const probability = status === 'Won' ? 100 : status === 'Lost' ? 0 : undefined;
          const update = { stage, status, ...(probability === undefined ? {} : { probability }) };
          const { error } = await adminClient.from('opportunities').update(update).eq('id', entityId);
          if (error) throw error;
          Object.assign(sourceRow, update);
        } else {
          throw new Error(`Action "${action.type}" is not supported for ${entityType} events.`);
        }
      }
      const { error: successLogError } = await adminClient.from('automation_logs').update({ status: 'success', message: 'All actions completed.' })
        .eq('rule_id', rule.id).eq('event_id', eventId);
      if (successLogError) throw successLogError;
      const { error: auditError } = await adminClient.from('audit_logs').insert({
        user_id: userResult.user.id,
        action: 'automation.executed',
        entity_type: entityType,
        entity_id: entityId,
        metadata: { rule_id: rule.id, trigger_type: triggerType },
      });
      if (auditError) throw auditError;
      results.push({ ruleId: rule.id, status: 'success' });
    } catch (error) {
      const message = error.message || 'Automation action failed.';
      await adminClient.from('automation_logs').update({ status: 'failed', message })
        .eq('rule_id', rule.id).eq('event_id', eventId);
      results.push({ ruleId: rule.id, status: 'failed', message });
    }
  }
  return respond({ eventId, processed: results.length, results });
});

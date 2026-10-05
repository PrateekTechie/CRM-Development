const toDateTimestamp = (date) => date ? `${date}T00:00:00.000Z` : null;

export const leadToDatabase = (lead, ownerName = lead.ownerName) => ({
  name: `${lead.firstName || ''} ${lead.lastName || ''}`.trim(),
  email: lead.email || null,
  phone: lead.phone || null,
  job_title: lead.title || null,
  company: lead.company || null,
  industry: lead.industry || null,
  website: lead.website || null,
  source: lead.source || null,
  owner: ownerName || null,
  owner_id: lead.ownerId || null,
  status: lead.status || 'New',
  stage: lead.stage || 'Prospecting',
  priority: lead.priority || 'Medium',
  score: Number(lead.score) || 0,
  product_interest: lead.productInterest || null,
  expected_value: Number(lead.expectedValue) || 0,
  expected_close_date: lead.expectedCloseDate || null,
  next_follow_up: toDateTimestamp(lead.nextFollowUpDate),
  next_follow_up_time: lead.nextFollowUpTime || null,
  next_follow_up_note: lead.nextFollowUpNote || null,
  preferred_contact_method: lead.preferredContactMethod || null,
  notes: lead.notes || null,
  requirement: lead.requirement || null,
  tags: Array.isArray(lead.tags) ? lead.tags : [],
  company_size: lead.companySize || null,
  location: lead.location || null,
  last_activity_date: lead.lastActivityDate || null,
});

const databaseColumns = new Set([
  'name',
  'email',
  'phone',
  'job_title',
  'company',
  'industry',
  'website',
  'source',
  'owner',
  'owner_id',
  'status',
  'stage',
  'priority',
  'score',
  'product_interest',
  'expected_value',
  'expected_close_date',
  'next_follow_up',
  'next_follow_up_time',
  'next_follow_up_note',
  'preferred_contact_method',
  'notes',
  'requirement',
  'tags',
  'company_size',
  'location',
  'last_activity_date',
  'updated_at',
]);

const databaseColumnByUiField = {
  email: 'email',
  phone: 'phone',
  title: 'job_title',
  company: 'company',
  industry: 'industry',
  website: 'website',
  source: 'source',
  ownerId: 'owner_id',
  status: 'status',
  stage: 'stage',
  priority: 'priority',
  score: 'score',
  productInterest: 'product_interest',
  expectedValue: 'expected_value',
  expectedCloseDate: 'expected_close_date',
  nextFollowUpDate: 'next_follow_up',
  nextFollowUpTime: 'next_follow_up_time',
  nextFollowUpNote: 'next_follow_up_note',
  preferredContactMethod: 'preferred_contact_method',
  notes: 'notes',
  requirement: 'requirement',
  tags: 'tags',
  companySize: 'company_size',
  location: 'location',
  lastActivityDate: 'last_activity_date',
};

export const leadChangesToDatabase = (currentLead, changes, ownerName) => {
  const mapped = leadToDatabase({ ...currentLead, ...changes }, ownerName);
  const payload = { updated_at: new Date().toISOString() };

  if ('firstName' in changes || 'lastName' in changes) {
    payload.name = mapped.name;
  }

  Object.keys(changes).forEach((field) => {
    const column = databaseColumnByUiField[field];
    if (column) payload[column] = mapped[column];
  });

  if ('ownerId' in changes) payload.owner = ownerName || null;
  const invalidColumns = Object.keys(payload).filter(column => !databaseColumns.has(column));
  if (invalidColumns.length) {
    throw new Error(`Lead update contains unmapped database column(s): ${invalidColumns.join(', ')}`);
  }
  return payload;
};

export const leadFromDatabase = (row, users = []) => {
  const [firstName = '', ...lastNameParts] = (row.name || '').trim().split(/\s+/);
  const owner = users.find(user => user.id === row.owner_id || user.name === row.owner);

  return {
    id: row.id,
    firstName,
    lastName: lastNameParts.join(' '),
    email: row.email || '',
    phone: row.phone || '',
    title: row.job_title || '',
    company: row.company || '',
    industry: row.industry || 'Technology',
    website: row.website || '',
    companySize: row.company_size || '',
    location: row.location || '',
    source: row.source || '',
    ownerId: row.owner_id || owner?.id || '',
    ownerName: row.owner || owner?.name || '',
    status: row.status || 'New',
    stage: row.stage || 'Prospecting',
    priority: row.priority || 'Medium',
    score: Number(row.score) || 0,
    productInterest: row.product_interest || '',
    expectedValue: Number(row.expected_value) || 0,
    expectedCloseDate: row.expected_close_date || '',
    requirement: row.requirement || '',
    notes: row.notes || '',
    nextFollowUpDate: row.next_follow_up ? row.next_follow_up.slice(0, 10) : '',
    nextFollowUpTime: row.next_follow_up_time || '10:00 AM',
    nextFollowUpNote: row.next_follow_up_note || '',
    tags: Array.isArray(row.tags) ? row.tags : [],
    lastActivityDate: row.last_activity_date || '',
    createdAt: row.created_at ? row.created_at.slice(0, 10) : '',
    updatedAt: row.updated_at ? row.updated_at.slice(0, 10) : '',
  };
};

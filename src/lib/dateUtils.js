const parseDateValue = (value) => {
  if (!value) return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
      ? date
      : null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateOnly = (date) => new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
}).format(date);

export const formatFollowUpDate = (dateValue, timeValue = '') => {
  const date = parseDateValue(dateValue);
  if (!date) return 'Not Scheduled';

  const dateLabel = formatDateOnly(date);
  return timeValue ? `${dateLabel}, ${timeValue}` : dateLabel;
};

const parseTime = (value) => {
  if (!value) return null;
  const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59 || (!match[3] && hours > 23)) return null;
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  if (meridiem && hours > 12) return null;
  return { hours, minutes };
};

export const getFollowUpStatus = (dateValue, timeValue = '') => {
  const date = parseDateValue(dateValue);
  if (!date) return { label: 'Not Scheduled', tone: 'neutral' };

  const now = new Date();
  if (date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate()) {
    const time = parseTime(timeValue);
    if (time && new Date(date.getFullYear(), date.getMonth(), date.getDate(), time.hours, time.minutes) < now) {
      return { label: 'Overdue', tone: 'danger' };
    }
    return { label: 'Due Today', tone: 'warning' };
  }

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const followUpDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (followUpDay < startOfToday) return { label: 'Overdue', tone: 'danger' };
  return { label: 'Upcoming', tone: 'info' };
};

export const getNextFollowUp = (lead, followUps = []) => {
  if (!lead || !Array.isArray(followUps)) return null;

  const related = followUps.filter(item => item.leadId === lead.id);
  const pending = related
    .filter(item => ['Upcoming', 'Today', 'Overdue'].includes(item.status))
    .filter(item => parseDateValue(item.dueAt || item.date))
    .sort((a, b) => new Date(a.dueAt || a.date) - new Date(b.dueAt || b.date));

  if (pending.length) {
    const next = pending[0];
    return {
      date: next.date || next.dueAt,
      time: next.time || '',
      status: next.status,
    };
  }

  if (related.length) return null;
  if (!lead.nextFollowUpDate) return null;
  return { date: lead.nextFollowUpDate, time: lead.nextFollowUpTime || '', status: 'Upcoming' };
};

export const getLastFollowUpDate = (lead, activities = [], followUps = []) => {
  if (!lead) return null;

  const actualContactTypes = new Set(['Call', 'Email', 'Meeting', 'WhatsApp', 'LinkedIn', 'Demo']);
  const loggedContacts = activities
    .filter(item => item.leadId === lead.id && actualContactTypes.has(item.type) && item.activityTime)
    .filter(item => parseDateValue(item.activityTime))
    .map(item => ({ date: item.activityTime, time: '', source: 'activity' }));
  const completedFollowUps = followUps
    .filter(item => item.leadId === lead.id && item.status === 'Completed' && item.completedAt)
    .filter(item => parseDateValue(item.completedAt))
    .map(item => ({ date: item.completedAt, time: '', source: 'follow-up' }));

  return [...loggedContacts, ...completedFollowUps]
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0] || null;
};

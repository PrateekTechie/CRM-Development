import React, { useEffect, useState } from 'react';
import { useCRM } from '../../../context/CRMContext';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Tabs } from '../../ui/Tabs';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Settings, Shield, Users, Lock } from 'lucide-react';

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'sales_manager', label: 'Sales Manager' },
  { value: 'sales_representative', label: 'Sales Representative' },
  { value: 'viewer', label: 'Viewer' },
];

export const SettingsView = () => {
  const { activeUser, users, saveProfile, updateTeamMember } = useCRM();
  const [activeTab, setActiveTab] = useState('permissions');
  const [fullName, setFullName] = useState(activeUser?.name || '');
  const [teamDrafts, setTeamDrafts] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingUserId, setSavingUserId] = useState(null);
  const isAdmin = activeUser?.roleKey === 'admin';

  useEffect(() => setFullName(activeUser?.name || ''), [activeUser?.name]);

  const updateDraft = (user, change) => setTeamDrafts(previous => ({
    ...previous,
    [user.id]: { role: user.roleKey, isActive: user.accessEnabled, ...previous[user.id], ...change },
  }));

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      await saveProfile(fullName);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleTeamSave = async (user) => {
    const draft = teamDrafts[user.id] || { role: user.roleKey, isActive: user.accessEnabled };
    setSavingUserId(user.id);
    try {
      if (await updateTeamMember(user.id, draft)) {
        setTeamDrafts(previous => {
          const next = { ...previous };
          delete next[user.id];
          return next;
        });
      }
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2"><Settings className="w-5 h-5 text-slate-400" />CRM System Settings & Security</h1>
        <p className="text-xs text-slate-400 mt-0.5">Manage your profile and review the access model enforced by Supabase.</p>
      </div>

      <Tabs
        tabs={[
          { id: 'permissions', label: 'Roles & Permissions' },
          { id: 'team', label: 'Team Members' },
          { id: 'profile', label: 'My Profile' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'permissions' && (
        <section className="bg-[#161c28] border border-[#283347] rounded-lg p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2"><Shield className="w-4 h-4 text-blue-400" />Database-enforced roles</h2>
          <p className="text-xs text-slate-400">This page reflects the current authorization model. Permission switches are not offered because changing client-side state cannot safely change PostgreSQL Row Level Security.</p>
          <ul className="space-y-3 text-xs text-slate-300">
            <li><strong className="text-slate-100">Admin:</strong> read and manage all CRM records, profiles, roles, and account activation.</li>
            <li><strong className="text-slate-100">Sales Manager:</strong> read and manage all CRM records; cannot grant user access or administer roles.</li>
            <li><strong className="text-slate-100">Sales Representative:</strong> read records owned or assigned to the representative and create/update permitted CRM records.</li>
            <li><strong className="text-slate-100">Viewer:</strong> read CRM records; cannot make changes.</li>
          </ul>
          <div className="rounded-md border border-amber-700/50 bg-amber-950/30 p-3 text-xs text-amber-200">
            A newly registered account has no CRM data access until an administrator activates it. The first administrator must be provisioned through the trusted Supabase SQL Editor.
          </div>
        </section>
      )}

      {activeTab === 'team' && (
        <section className="bg-[#161c28] border border-[#283347] rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#283347] pb-3">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2"><Users className="w-4 h-4 text-emerald-400" />Team Members ({users.length})</h2>
          </div>
          <p className="text-xs text-slate-400">New accounts can register from the sign-in screen, but remain inactive until approved. Email invitations are not configured in this application.</p>
          {users.map(user => {
            const draft = teamDrafts[user.id] || { role: user.roleKey, isActive: user.accessEnabled };
            const changed = draft.role !== user.roleKey || draft.isActive !== user.accessEnabled;
            const canEdit = isAdmin && !user.isCurrent;
            return (
              <div key={user.id} className="p-4 bg-[#121722] border border-[#283347] rounded-lg grid grid-cols-1 md:grid-cols-[1fr_200px_160px_auto] items-center gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 shrink-0 rounded-full bg-blue-950 border border-blue-700 text-blue-300 font-bold flex items-center justify-center text-xs">{user.avatar}</div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-slate-100 truncate">{user.name} {user.isCurrent && '(You)'}</h3>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                  </div>
                </div>
                {canEdit
                  ? <Select aria-label={`Role for ${user.name}`} value={draft.role} onChange={event => updateDraft(user, { role: event.target.value })} options={roleOptions} />
                  : <Badge variant={user.roleKey === 'admin' ? 'violet' : 'blue'}>{user.role}</Badge>}
                {canEdit
                  ? <label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={draft.isActive} onChange={event => updateDraft(user, { isActive: event.target.checked })} />Access enabled</label>
                  : <span className={`text-xs ${user.accessEnabled ? 'text-emerald-400' : 'text-amber-300'}`}>{user.accessEnabled ? 'Access enabled' : 'Pending approval'}</span>}
                {canEdit && <Button variant="primary" size="sm" disabled={!changed} loading={savingUserId === user.id} onClick={() => handleTeamSave(user)}>Save Access</Button>}
              </div>
            );
          })}
          {!isAdmin && <p className="flex items-center gap-2 text-xs text-slate-500"><Lock className="h-3.5 w-3.5" />Only an administrator can approve accounts or change roles.</p>}
        </section>
      )}

      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSave} className="bg-[#161c28] border border-[#283347] rounded-lg p-6 space-y-4 max-w-xl">
          <h2 className="text-sm font-bold text-slate-100 border-b border-[#283347] pb-3">My Profile</h2>
          <Input label="Full Name" value={fullName} onChange={event => setFullName(event.target.value)} required />
          <Input label="Email Address" value={activeUser?.email || ''} disabled />
          <Input label="Role" value={activeUser?.role || ''} disabled />
          <div className="pt-2"><Button type="submit" variant="primary" loading={savingProfile}>Save Profile Changes</Button></div>
        </form>
      )}
    </div>
  );
};

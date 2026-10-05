import React, { useState } from 'react';
import { useCRM } from '../../../context/CRMContext';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Tabs } from '../../ui/Tabs';
import { Input } from '../../ui/Input';
import { Settings, Shield, Users, Lock, Check } from 'lucide-react';

export const SettingsView = () => {
  const { activeUser, users, addToast } = useCRM();
  const [activeTab, setActiveTab] = useState('permissions');

  // Role permission matrix state
  const [permissions, setPermissions] = useState({
    viewLeads: { Admin: true, Manager: true, Salesperson: true, Viewer: true },
    createLeads: { Admin: true, Manager: true, Salesperson: true, Viewer: false },
    editLeads: { Admin: true, Manager: true, Salesperson: true, Viewer: false },
    deleteLeads: { Admin: true, Manager: true, Salesperson: false, Viewer: false },
    assignLeads: { Admin: true, Manager: true, Salesperson: false, Viewer: false },
    viewDeals: { Admin: true, Manager: true, Salesperson: true, Viewer: true },
    createDeals: { Admin: true, Manager: true, Salesperson: true, Viewer: false },
    manageAutomation: { Admin: true, Manager: true, Salesperson: false, Viewer: false },
    viewReports: { Admin: true, Manager: true, Salesperson: true, Viewer: true },
  });

  const togglePermission = (permKey, role) => {
    setPermissions(prev => ({
      ...prev,
      [permKey]: {
        ...prev[permKey],
        [role]: !prev[permKey][role]
      }
    }));
    addToast(`Permission updated for ${role}.`);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-400" />
            CRM System Settings & Security
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure team roles, permission matrices, pipeline stages, and user profiles.
          </p>
        </div>
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

      {/* TAB 1: ROLES & PERMISSIONS MATRIX */}
      {activeTab === 'permissions' && (
        <div className="bg-[#161c28] border border-[#283347] rounded-lg p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[#283347] pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                Role & Access Permission Matrix
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Toggle access rights per user role across CRM features.
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={() => addToast('Permission matrix saved successfully.')}>
              Save Permissions Matrix
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#0f141e] border-b border-[#283347] text-[11px] font-semibold text-slate-400 uppercase">
                  <th className="py-3 px-4">Permission Name</th>
                  <th className="py-3 px-4 text-center">Admin</th>
                  <th className="py-3 px-4 text-center">Sales Manager</th>
                  <th className="py-3 px-4 text-center">Salesperson</th>
                  <th className="py-3 px-4 text-center">Viewer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#283347]/60">
                {Object.keys(permissions).map(permKey => (
                  <tr key={permKey} className="hover:bg-[#1c2433] transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-200 capitalize">
                      {permKey.replace(/([A-Z])/g, ' $1')}
                    </td>
                    {['Admin', 'Manager', 'Salesperson', 'Viewer'].map(role => (
                      <td key={role} className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={permissions[permKey][role]}
                          onChange={() => togglePermission(permKey, role)}
                          className="rounded border-[#283347] bg-[#121722] text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: TEAM MEMBERS */}
      {activeTab === 'team' && (
        <div className="bg-[#161c28] border border-[#283347] rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#283347] pb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              Active Team Members ({users.length})
            </h3>
            <Button variant="primary" size="sm" onClick={() => addToast('Invite email sent.', 'info')}>
              + Invite Team Member
            </Button>
          </div>

          <div className="space-y-3">
            {users.map(u => (
              <div key={u.id} className="p-4 bg-[#121722] border border-[#283347] rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-950 border border-blue-700 text-blue-300 font-bold flex items-center justify-center text-xs">
                    {u.avatar}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">{u.name} {u.isCurrent && '(You)'}</h4>
                    <p className="text-[11px] text-slate-400">{u.email} • Role: {u.role}</p>
                  </div>
                </div>
                <Badge variant={u.isCurrent ? 'blue' : 'slate'}>{u.role}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MY PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-[#161c28] border border-[#283347] rounded-lg p-6 space-y-4 max-w-xl">
          <h3 className="text-sm font-bold text-slate-100 border-b border-[#283347] pb-3">
            User Profile Settings
          </h3>
          <Input label="Full Name" defaultValue={activeUser.name} />
          <Input label="Email Address" defaultValue={activeUser.email} />
          <Input label="Role Title" defaultValue={activeUser.role} disabled />
          <div className="pt-2">
            <Button variant="primary" onClick={() => addToast('Profile details updated.')}>
              Save Profile Changes
            </Button>
          </div>
        </div>
      )}

    </div>
  );
};

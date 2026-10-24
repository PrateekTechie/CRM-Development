import React from 'react';
import { CRMProvider, useCRM } from './context/CRMContext';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { CommandPalette } from './components/layout/CommandPalette';
import { NotificationDrawer } from './components/layout/NotificationDrawer';
import { Toast } from './components/ui/Toast';
import { AuthScreen } from './components/auth/AuthScreen';

// Module Views
import { DashboardView } from './components/modules/Dashboard/DashboardView';
import { LeadsView } from './components/modules/Leads/LeadsView';
import { AddLeadDrawer } from './components/modules/Leads/AddLeadDrawer';
import { Lead360View } from './components/modules/Leads/Lead360View';
import { ActivitiesView } from './components/modules/Activities/ActivitiesView';
import { FollowupsView } from './components/modules/Followups/FollowupsView';
import { DealsView } from './components/modules/Opportunities/DealsView';
import { ContactsView } from './components/modules/Contacts/ContactsView';
import { AccountsView } from './components/modules/Accounts/AccountsView';
import { AutomationView } from './components/modules/Automation/AutomationView';
import { ReportsView } from './components/modules/Reports/ReportsView';
import { SettingsView } from './components/modules/Settings/SettingsView';

const MainWorkspaceContent = () => {
  const { activeModule } = useCRM();

  const renderView = () => {
    switch (activeModule) {
      case 'dashboard':
        return <DashboardView />;
      case 'leads':
        return <LeadsView />;
      case 'lead-360':
        return <Lead360View />;
      case 'contacts':
        return <ContactsView />;
      case 'accounts':
        return <AccountsView />;
      case 'opportunities':
        return <DealsView />;
      case 'activities':
        return <ActivitiesView />;
      case 'followups':
        return <FollowupsView />;
      case 'automation':
        return <AutomationView />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <main className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-crm-bg">
      <div className="max-w-7xl mx-auto">
        {renderView()}
      </div>
    </main>
  );
};

const CRMApplication = () => {
  const { session, activeUser, accessPending, dataLoading, leadsError, signOut, addToast } = useCRM();
  if (!session) return <AuthScreen />;
  if (dataLoading && !activeUser) {
    return <div className="min-h-screen grid place-items-center bg-[#0f141e] text-slate-300">Loading your CRM access…</div>;
  }
  if (!activeUser) {
    return (
      <main className="min-h-screen grid place-items-center bg-[#0f141e] px-4 text-slate-100">
        <section className="max-w-md space-y-4 rounded-xl border border-slate-200 bg-white p-7 text-slate-900 shadow-xl">
          <h1 className="text-lg font-bold">Workspace access unavailable</h1>
          <p className="text-sm text-slate-600">{leadsError || 'Your user profile could not be loaded. Contact a workspace administrator.'}</p>
          <button className="text-sm font-semibold text-blue-700" onClick={() => signOut().catch(error => addToast(`Unable to sign out: ${error.message}`, 'danger'))}>Sign out</button>
        </section>
      </main>
    );
  }
  if (accessPending) {
    return (
      <main className="min-h-screen grid place-items-center bg-[#0f141e] px-4 text-slate-100">
        <section className="max-w-md space-y-4 rounded-xl border border-slate-200 bg-white p-7 text-slate-900 shadow-xl">
          <h1 className="text-lg font-bold">Access pending approval</h1>
          <p className="text-sm text-slate-600">Your account is registered, but it cannot access CRM records until a workspace administrator enables it and assigns a role.</p>
          <button className="text-sm font-semibold text-blue-700" onClick={() => signOut().catch(error => addToast(`Unable to sign out: ${error.message}`, 'danger'))}>Sign out</button>
        </section>
      </main>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-crm-bg text-slate-100 font-sans antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Topbar />
        <MainWorkspaceContent />
      </div>

      <CommandPalette />
      <NotificationDrawer />
      <AddLeadDrawer />
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <CRMProvider>
      <CRMApplication />
    </CRMProvider>
  );
}

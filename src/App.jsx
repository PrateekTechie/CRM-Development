import React from 'react';
import { CRMProvider, useCRM } from './context/CRMContext';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { CommandPalette } from './components/layout/CommandPalette';
import { NotificationDrawer } from './components/layout/NotificationDrawer';
import { Toast } from './components/ui/Toast';

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

export default function App() {
  return (
    <CRMProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-crm-bg text-slate-100 font-sans antialiased">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <Topbar />
          <MainWorkspaceContent />
        </div>

        {/* Global Overlays */}
        <CommandPalette />
        <NotificationDrawer />
        <AddLeadDrawer />
        <Toast />
      </div>
    </CRMProvider>
  );
}

import React from 'react';
import { useCRM } from '../../context/CRMContext';
import { Drawer } from '../ui/Drawer';
import { Bell, CheckCircle2, AlertTriangle, AlertCircle, Info, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

export const NotificationDrawer = () => {
  const {
    isNotificationDrawerOpen,
    setIsNotificationDrawerOpen,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    viewLead360,
    setActiveModule,
  } = useCRM();

  const handleNotificationClick = (notif) => {
    markNotificationAsRead(notif.id);
    setIsNotificationDrawerOpen(false);
    if (notif.linkTarget && notif.linkTarget.startsWith('lead-')) {
      viewLead360(notif.linkTarget);
    } else if (notif.linkTarget && notif.linkTarget.startsWith('flw-')) {
      setActiveModule('followups');
    } else if (notif.linkTarget && notif.linkTarget.startsWith('deal-')) {
      setActiveModule('opportunities');
    }
  };

  const icons = {
    info: <Info className="w-4 h-4 text-blue-400 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
    danger: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
  };

  return (
    <Drawer
      isOpen={isNotificationDrawerOpen}
      onClose={() => setIsNotificationDrawerOpen(false)}
      title="Notification Center"
      subtitle="Real-time alerts, follow-up reminders & pipeline updates"
      width="max-w-md"
    >
      <div className="space-y-4">
        
        <div className="flex items-center justify-between pb-3 border-b border-[#283347]">
          <span className="text-xs text-slate-400 font-medium">
            {notifications.filter(n => !n.read).length} unread notification(s)
          </span>
          <Button variant="ghost" size="sm" onClick={markAllNotificationsAsRead}>
            Mark all read
          </Button>
        </div>

        <div className="space-y-2.5">
          {notifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-3.5 rounded-lg border transition-all cursor-pointer group flex items-start gap-3 ${
                notif.read
                  ? 'bg-[#121722] border-[#283347] opacity-75 hover:opacity-100'
                  : 'bg-[#161c28] border-blue-500/40 shadow-sm hover:border-blue-500'
              }`}
            >
              <div className="mt-0.5">
                {icons[notif.type] || icons.info}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">
                    {notif.title}
                  </h4>
                  <span className="text-[10px] text-slate-400">{notif.timestamp}</span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{notif.message}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </Drawer>
  );
};

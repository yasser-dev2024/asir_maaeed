import { Activity, Bot, CalendarDays, Download, Home, MapPinned, Route, Ticket } from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { FloatingNowButton } from '../components/FloatingNowButton';
import { DoctorAssistantFloatingButton } from '../components/DoctorAssistantFloatingButton';
import { useQrTracking } from '../hooks/useQrTracking';

const navItems = [
  { label: 'الرئيسية', to: '/', icon: Home },
  { label: 'رحلتي', to: '/journey', icon: Route },
  { label: 'فعاليات', to: '/events', icon: CalendarDays },
  { label: 'الجواز', to: '/passport', icon: Ticket },
  { label: 'مساعد', to: '/assistant', icon: Bot },
];

const moreItems = [
  { label: 'الخطة', to: '/plan', icon: Activity },
  { label: 'المواد', to: '/downloads', icon: Download },
  { label: 'قريب مني', to: '/nearby', icon: MapPinned },
];

export function ClientLayout() {
  useQrTracking();
  const location = useLocation();
  const home = location.pathname === '/';

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-white/60 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <NavLink className="flex items-center gap-3" to="/">
            <span className="grid size-10 place-items-center rounded-lg bg-teal-700 text-white">
              <Activity className="size-5" />
            </span>
            <span>
              <span className="block text-base font-black leading-5">صيف وصحة</span>
              <span className="block text-xs font-bold text-teal-700">مساعد عسير</span>
            </span>
          </NavLink>
          <nav className="hidden items-center gap-1 sm:flex">
            {[...navItems, ...moreItems].map((item) => (
              <NavLink
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-bold transition ${
                    isActive ? 'bg-teal-50 text-teal-800' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
                key={item.to}
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className={home ? 'w-full pb-28 sm:pb-10' : 'mx-auto w-full max-w-6xl px-4 pb-28 sm:pb-10'}>
        <Outlet />
      </main>
      <FloatingNowButton />
      <DoctorAssistantFloatingButton />
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.4rem)] pt-2 shadow-2xl shadow-slate-950/10 backdrop-blur sm:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {navItems.map((item) => (
            <NavLink
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-bold ${
                  isActive ? 'bg-teal-50 text-teal-800' : 'text-slate-500'
                }`
              }
              key={item.to}
              to={item.to}
            >
              <item.icon className="size-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

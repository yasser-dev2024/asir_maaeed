import { BarChart3, BookOpen, Bot, CalendarDays, HeartPulse, LogOut, QrCode, ShieldCheck, Ticket } from 'lucide-react';
import { NavLink, Navigate, Outlet } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAppStore } from '../store/appStore';

const sections = [
  { label: 'المؤشرات', hash: '#dashboard', icon: BarChart3 },
  { label: 'الكلمات', hash: '#keywords', icon: Bot },
  { label: 'الدكتور مساعد', hash: '#doctor-assistant', icon: HeartPulse },
  { label: 'الفعاليات', hash: '#events', icon: CalendarDays },
  { label: 'المحتوى', hash: '#content', icon: BookOpen },
  { label: 'الجواز', hash: '#passport', icon: Ticket },
  { label: 'البداية الذكية', hash: '#smart-entry', icon: HeartPulse },
  { label: 'QR', hash: '#qr', icon: QrCode },
];

export function AdminLayout() {
  const authenticated = useAppStore((state) => state.adminAuthenticated);
  const logout = useAppStore((state) => state.logout);

  if (!authenticated) {
    return <Navigate replace to="/admin/login" />;
  }

  return (
    <div className="min-h-dvh bg-slate-100 text-slate-950">
      <div className="mx-auto grid w-full max-w-7xl gap-4 p-4 lg:grid-cols-[17rem_1fr]">
        <aside className="lg:sticky lg:top-4 lg:h-[calc(100dvh-2rem)]">
          <div className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <NavLink className="flex items-center gap-3" to="/admin">
              <span className="grid size-11 place-items-center rounded-lg bg-slate-950 text-white">
                <ShieldCheck className="size-5" />
              </span>
              <span>
                <span className="block text-base font-black">لوحة التحكم</span>
                <span className="block text-xs font-bold text-teal-700">بوابة الإدارة</span>
              </span>
            </NavLink>
            <nav className="mt-6 grid gap-2">
              {sections.map((section) => (
                <a
                  className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  href={section.hash}
                  key={section.hash}
                >
                  <section.icon className="size-4" />
                  {section.label}
                </a>
              ))}
            </nav>
            <div className="mt-auto pt-4">
              <Button className="w-full" icon={<LogOut className="size-4" />} onClick={logout} variant="secondary">
                خروج
              </Button>
            </div>
          </div>
        </aside>
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import {
  Activity,
  BarChart3,
  BookOpen,
  Bot,
  CalendarDays,
  HeartPulse,
  LogOut,
  QrCode,
  ShieldCheck,
  Ticket,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAppStore } from '../store/appStore';

// ── Section definitions ──────────────────────────────────────────────────────

const ANCHOR_SECTIONS = [
  { label: 'المؤشرات',       id: 'dashboard',        icon: BarChart3    },
  { label: 'الكلمات',        id: 'keywords',         icon: Bot          },
  { label: 'الدكتور مساعد',  id: 'doctor-assistant', icon: HeartPulse   },
  { label: 'الفعاليات',      id: 'events',           icon: CalendarDays },
  { label: 'المحتوى',        id: 'content',          icon: BookOpen     },
  { label: 'الجواز',         id: 'passport',         icon: Ticket       },
  { label: 'البداية الذكية', id: 'smart-entry',      icon: Activity     },
  { label: 'تقارير QR',      id: 'qr',               icon: QrCode       },
] as const;

const ROUTE_SECTIONS = [
  { label: 'QR المناطق', to: '/admin/qr-locations', icon: QrCode },
] as const;

// ── Layout ───────────────────────────────────────────────────────────────────

export function AdminLayout() {
  const authenticated  = useAppStore((s) => s.adminAuthenticated);
  const logout         = useAppStore((s) => s.logout);
  const refreshSession = useAppStore((s) => s.refreshAdminSession);

  const location = useLocation();
  const navigate = useNavigate();

  const isAdminRoot =
    location.pathname === '/admin' || location.pathname === '/admin/';

  // Active section — initialized from URL hash (survives page refresh)
  const [activeId, setActiveId] = useState<string>(
    () => location.hash.replace('#', '') || 'dashboard'
  );

  // Keep active state in sync when location.hash changes via browser nav
  useEffect(() => {
    const id = location.hash.replace('#', '') || 'dashboard';
    setActiveId(id);
  }, [location.hash]);

  // Refresh admin session every 60 s
  useEffect(() => {
    refreshSession();
    const id = window.setInterval(refreshSession, 60_000);
    return () => window.clearInterval(id);
  }, [refreshSession]);

  // IntersectionObserver — updates activeId and URL hash while scrolling
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!isAdminRoot) return;

    const timer = window.setTimeout(() => {
      observerRef.current?.disconnect();

      const obs = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

          if (!visible[0]) return;
          const id = visible[0].target.id;
          setActiveId(id);
          // Update URL hash without creating a history entry (silent update)
          const next = id === 'dashboard' ? '#dashboard' : '#' + id;
          if (window.location.hash !== next) {
            window.history.replaceState(null, '', next);
          }
        },
        { threshold: 0.2, rootMargin: '-5% 0px -60% 0px' }
      );

      ANCHOR_SECTIONS.forEach(({ id }) => {
        const el = document.getElementById(id);
        if (el) obs.observe(el);
      });

      observerRef.current = obs;
    }, 150);

    return () => {
      window.clearTimeout(timer);
      observerRef.current?.disconnect();
    };
  }, [isAdminRoot]);

  if (!authenticated) {
    return <Navigate replace to="/admin/login" />;
  }

  // Navigate to a section — works from any admin sub-route
  function goToSection(id: string) {
    if (!isAdminRoot) {
      // From sub-page: navigate to /admin with hash; AdminDashboardPage will scroll
      navigate('/admin#' + id);
    } else {
      // Already on admin page: scroll + update state + update URL silently
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(id);
      const next = '#' + id;
      if (window.location.hash !== next) {
        window.history.replaceState(null, '', next);
      }
    }
  }

  // ── Nav item renderers ────────────────────────────────────────────────────

  function SidebarBtn({
    id,
    label,
    icon: Icon,
  }: {
    id: string;
    label: string;
    icon: React.ElementType;
  }) {
    const active = isAdminRoot && activeId === id;
    return (
      <button
        className={`group relative flex min-h-11 w-full items-center gap-3 rounded-xl px-3.5 text-sm font-bold transition-all duration-200 ${
          active
            ? 'bg-gradient-to-l from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-600/25'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
        }`}
        onClick={() => goToSection(id)}
        type="button"
      >
        {active && (
          <span className="absolute right-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-emerald-200" />
        )}
        <Icon
          className={`size-4 shrink-0 transition-transform duration-200 ${
            active ? '' : 'group-hover:scale-110'
          }`}
        />
        <span>{label}</span>
      </button>
    );
  }

  function MobileBtn({
    id,
    label,
    icon: Icon,
  }: {
    id: string;
    label: string;
    icon: React.ElementType;
  }) {
    const active = isAdminRoot && activeId === id;
    return (
      <button
        className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-black transition-all ${
          active
            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
        onClick={() => goToSection(id)}
        type="button"
      >
        <Icon className="size-3.5" />
        {label}
      </button>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-dvh bg-slate-100 text-slate-950">

      {/* ── Mobile top bar ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-sm lg:hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-950 text-white">
            <ShieldCheck className="size-4" />
          </span>
          <span className="text-sm font-black text-slate-900">لوحة التحكم</span>
          <button
            className="mr-auto flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-200"
            onClick={logout}
            type="button"
          >
            <LogOut className="size-3.5" />
            خروج
          </button>
        </div>

        {/* Horizontal scroll nav */}
        <div className="flex gap-1.5 overflow-x-auto px-3 pb-3 scrollbar-none">
          {ANCHOR_SECTIONS.map(({ id, label, icon }) => (
            <MobileBtn icon={icon} id={id} key={id} label={label} />
          ))}
          {ROUTE_SECTIONS.map(({ to, label, icon: Icon }) => (
            <NavLink
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-black transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`
              }
              key={to}
              to={to}
            >
              <Icon className="size-3.5" />
              {label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* ── Desktop layout ────────────────────────────────────────────────────── */}
      <div className="mx-auto grid w-full max-w-7xl gap-4 p-4 lg:grid-cols-[17rem_1fr]">

        {/* Sidebar — desktop only */}
        <aside className="hidden lg:block">
          <div className="sticky top-4 flex h-[calc(100dvh-2rem)] flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

            {/* Brand */}
            <div className="flex items-center gap-3 rounded-xl p-2">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-950 text-white shadow-lg shadow-slate-950/20">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <p className="text-base font-black text-slate-950">لوحة التحكم</p>
                <p className="text-xs font-bold text-emerald-700">بوابة الإدارة</p>
              </div>
            </div>

            <div className="my-3 h-px bg-slate-100" />

            {/* Nav */}
            <nav className="grid gap-1 overflow-y-auto">
              {ANCHOR_SECTIONS.map(({ id, label, icon }) => (
                <SidebarBtn icon={icon} id={id} key={id} label={label} />
              ))}

              <div className="my-1 h-px bg-slate-100" />

              {ROUTE_SECTIONS.map(({ to, label, icon: Icon }) => (
                <NavLink
                  className={({ isActive }) =>
                    `flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-bold transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-l from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-600/25'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                  key={to}
                  to={to}
                >
                  <Icon className="size-4 shrink-0" />
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* Logout */}
            <div className="mt-auto border-t border-slate-100 pt-4">
              <Button
                className="w-full"
                icon={<LogOut className="size-4" />}
                onClick={logout}
                variant="secondary"
              >
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

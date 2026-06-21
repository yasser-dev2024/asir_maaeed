import { Ambulance, MapPin, Navigation, Share2, Trees, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/Button';

const nearbyActions = [
  { label: 'أقرب مركز صحي', icon: Ambulance },
  { label: 'أقرب فعالية', icon: MapPin },
  { label: 'أقرب ممشى', icon: Trees },
  { label: 'نقطة توعوية', icon: Navigation },
];

export function FloatingNowButton() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  if (location.pathname === '/') {
    return null;
  }

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.8rem)] left-4 z-30 sm:bottom-6">
      {open ? (
        <div className="mb-3 w-72 rounded-lg border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-950/20">
          <div className="flex items-center justify-between">
            <p className="text-sm font-black text-slate-950">أنا الآن</p>
            <button
              aria-label="إغلاق"
              className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
              onClick={() => setOpen(false)}
              type="button"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="mt-2 grid gap-2">
            {nearbyActions.map((action) => (
              <Link
                className="flex min-h-11 items-center gap-3 rounded-lg bg-slate-50 px-3 text-sm font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-800"
                key={action.label}
                to="/nearby"
              >
                <action.icon className="size-4" />
                {action.label}
              </Link>
            ))}
            <button
              className="flex min-h-11 items-center gap-3 rounded-lg bg-slate-50 px-3 text-sm font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-800"
              onClick={() => {
                void navigator.share?.({
                  title: 'موقعي في صيف وصحة',
                  text: 'أشارك موقعي للحصول على أقرب خدمة صحية وسياحية.',
                  url: window.location.href,
                });
              }}
              type="button"
            >
              <Share2 className="size-4" />
              مشاركة الموقع
            </button>
          </div>
        </div>
      ) : null}
      <Button
        className="min-h-14 rounded-full px-5 shadow-xl shadow-teal-950/25"
        icon={<Navigation className="size-5" />}
        onClick={() => setOpen((value) => !value)}
      >
        أنا الآن
      </Button>
    </div>
  );
}

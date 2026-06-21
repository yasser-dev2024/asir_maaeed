import { Activity, HeartPulse, MapPinned, Route, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import asirHero from '../assets/asir-hero-mobile.jpg';
import { Button } from './ui/Button';

interface SplashScreenProps {
  visible: boolean;
  onDone: () => void;
  autoClose?: boolean;
}

const promiseItems = [
  { label: 'موقعك', icon: MapPinned },
  { label: 'نبض صحي', icon: Activity },
  { label: 'مسار الرحلة', icon: Route },
];

export function SplashScreen({ visible, onDone, autoClose = true }: SplashScreenProps) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!visible || !autoClose) {
      return;
    }

    const timer = window.setTimeout(() => {
      setLeaving(true);
      window.setTimeout(onDone, 360);
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [autoClose, onDone, visible]);

  if (!visible) {
    return null;
  }

  function closeSplash(delay = 220) {
    setLeaving(true);
    window.setTimeout(onDone, delay);
  }

  return (
    <div
      className={`fixed inset-0 z-50 h-dvh overflow-hidden bg-emerald-950 text-white transition-opacity duration-500 ${
        leaving ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <img
        alt="منظر من عسير"
        className="splash-scene-zoom splash-image fixed inset-0 h-dvh w-full object-cover object-bottom"
        src={asirHero}
      />
      <div className="splash-backdrop fixed inset-0" />
      <div className="fixed inset-0 bg-slate-950/18" />

      <span className="splash-thread splash-thread-one" />
      <span className="splash-thread splash-thread-two" />
      <span className="splash-thread splash-thread-three" />
      <span className="splash-thread splash-thread-four" />
      <span className="splash-orbit splash-orbit-one" />
      <span className="splash-orbit splash-orbit-two" />
      <span className="splash-gold-dot splash-gold-dot-one" />
      <span className="splash-gold-dot splash-gold-dot-two" />
      <span className="splash-gold-dot splash-gold-dot-three" />

      <div className="relative grid h-dvh place-items-center px-5 pb-[calc(env(safe-area-inset-bottom)+2rem)] pt-[calc(env(safe-area-inset-top)+2rem)]">
        <div className="w-full max-w-sm text-center">
          <div className="splash-float relative mx-auto grid size-28 place-items-center rounded-[2rem] border border-amber-200/40 bg-white/14 shadow-2xl shadow-amber-950/25">
            <span className="splash-pulse absolute size-28 rounded-[2rem] border border-amber-100/40" />
            <span className="splash-heart-glow absolute inset-3 rounded-[1.45rem]" />
            <HeartPulse className="relative size-14 text-amber-50 drop-shadow" strokeWidth={2.5} />
          </div>

          <div className="splash-welcome-burst mt-6 inline-flex items-center gap-2 rounded-full border border-amber-200/45 bg-amber-100/18 px-6 py-3 text-2xl font-black text-amber-50 shadow-[0_0_40px_rgba(251,191,36,0.38)]">
            <Sparkles className="size-5 text-amber-200" />
            <span className="inline-flex flex-row items-baseline gap-2" dir="ltr">
              <span dir="rtl">مرحبا</span>
              <span className="text-3xl text-white">1000</span>
            </span>
          </div>

          <h1 className="splash-reveal splash-strong-text mt-5 text-5xl font-black leading-tight tracking-normal text-white">
            صيف وصحة
          </h1>
          <p className="splash-reveal splash-reveal-delay splash-strong-text mt-3 text-xl font-black text-amber-50">
            أهلاً بك في عسير
          </p>
          <div className="mt-8 grid grid-cols-3 gap-2">
            {promiseItems.map((item) => (
              <div
                className="rounded-lg border border-amber-100/20 bg-slate-950/34 p-3 shadow-[0_0_18px_rgba(251,191,36,0.1)]"
                key={item.label}
              >
                <item.icon className="mx-auto size-5 text-amber-100" />
                <p className="mt-2 text-xs font-black text-white">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-right" aria-label="جاري تجهيز التجربة">
            <div className="h-2 overflow-hidden rounded-full bg-white/18 shadow-inner shadow-slate-950/40">
              <span className="splash-loading-bar block h-full rounded-full bg-[linear-gradient(90deg,#f59e0b,#fde68a,#ffffff,#fbbf24)] shadow-[0_0_24px_rgba(251,191,36,0.85)]" />
            </div>
          </div>

          {!autoClose ? (
            <Button className="mt-8 bg-amber-50 text-emerald-950 hover:bg-white" onClick={() => closeSplash()}>
              ابدأ التجربة
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

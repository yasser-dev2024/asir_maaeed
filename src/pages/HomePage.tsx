import {
  Activity,
  ArrowLeft,
  Baby,
  Bot,
  HeartPulse,
  MapPinned,
  QrCode,
  Route,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import asirHero from '../assets/asir-hero-mobile.jpg';
import { Button } from '../components/ui/Button';
import { useAppStore } from '../store/appStore';
import type { AgeGroup, CompanionType, CurrentLocation, JourneyAnswers, JourneyType, VisitPurpose } from '../types/domain';

const journeySignals = [
  { label: 'طبيعة قريبة', value: 'أبها والسودة وممشى الضباب', icon: MapPinned },
  { label: 'فرحة العائلة', value: 'خيارات مناسبة للصغار والكبار', icon: Users },
  { label: 'سلامة صحية', value: 'تنبيه ومراكز قريبة عند الحاجة', icon: ShieldCheck },
];

const asirMoments = [
  { title: 'مرتفعات عسير', text: 'اقتراحات تبدأ من موقعك وتراعي الوقت والازدحام.', icon: Route },
  { title: 'أجواء عائلية', text: 'مسارات سهلة، نقاط جلوس، وخيارات مناسبة للأطفال.', icon: Sparkles },
  { title: 'اطمئنان صحي', text: 'إرشاد سريع لأقرب مركز صحي أو نقطة توعوية.', icon: HeartPulse },
];

const locations: { label: string; value: CurrentLocation }[] = [
  { label: 'أبها', value: 'abha' },
  { label: 'السودة', value: 'soudah' },
  { label: 'مطار أبها', value: 'airport' },
  { label: 'ممشى الضباب', value: 'fog-walk' },
];

const ageGroups: { label: string; value: AgeGroup }[] = [
  { label: 'أقل من 18', value: 'under-18' },
  { label: '18 إلى 49', value: '18-49' },
  { label: '50 فأكثر', value: '50-plus' },
];

const familyOptions = [
  { label: 'مع العائلة', value: true },
  { label: 'بدون عائلة', value: false },
];

const visitPurposes: { label: string; value: VisitPurpose; journeyType: JourneyType }[] = [
  { label: 'نشاط ومشي', value: 'activity', journeyType: 'activity' },
  { label: 'زيارة عائلية', value: 'family', journeyType: 'family' },
  { label: 'استرخاء', value: 'relax', journeyType: 'relax' },
  { label: 'توعية صحية', value: 'awareness', journeyType: 'elderly' },
  { label: 'مساعدة صحية', value: 'urgent', journeyType: 'elderly' },
];

interface WelcomeProfile {
  currentLocation: CurrentLocation;
  ageGroup: AgeGroup;
  withFamily: boolean;
  visitPurpose: VisitPurpose;
}

function OptionButtons<T extends string | boolean>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {options.map((option) => (
        <button
          className={`min-h-12 rounded-lg border px-3 text-sm font-black transition ${
            value === option.value
              ? 'border-emerald-700 bg-emerald-700 text-white shadow-lg shadow-emerald-950/18'
              : 'border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50'
          }`}
          key={String(option.value)}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function buildRecommendations(profile: WelcomeProfile) {
  const locationName = locations.find((item) => item.value === profile.currentLocation)?.label ?? 'عسير';
  const cards = [
    {
      title: `قريب من ${locationName}`,
      text:
        profile.currentLocation === 'airport'
          ? 'بداية هادئة من المطار ثم خيار قريب مناسب قبل الانطلاق.'
          : 'خيارات قريبة من موقعك الحالي مع مسار واضح للزيارة.',
      icon: MapPinned,
    },
    {
      title: profile.withFamily ? 'مناسب للعائلة' : 'مناسب لك الآن',
      text: profile.withFamily
        ? 'فعالية عائلية ومسار آمن مع نقاط جلوس وخدمات قريبة.'
        : 'مسار صحي قصير ونقطة توعوية سهلة الوصول.',
      icon: profile.withFamily ? Users : UserRound,
    },
    {
      title: profile.ageGroup === '50-plus' ? 'راحة وسلامة أولًا' : 'نشاط بقدر مناسب',
      text:
        profile.ageGroup === '50-plus'
          ? 'مسار قصير ومركز صحي قريب قبل أي اقتراح طويل.'
          : 'توازن بين الحركة، الترطيب، وتجربة سياحية ممتعة.',
      icon: profile.ageGroup === 'under-18' ? Baby : Activity,
    },
  ];

  if (profile.visitPurpose === 'urgent') {
    return [
      {
        title: 'مساعدة صحية فورية',
        text: 'إظهار أقرب مركز صحي وأرقام الطوارئ قبل أي خيار سياحي.',
        icon: ShieldCheck,
      },
      ...cards,
    ];
  }

  if (profile.visitPurpose === 'relax') {
    return [
      ...cards,
      {
        title: 'هدوء ومنظر',
        text: 'اقتراح خفيف: ممشى قصير، نقطة ترطيب، ومكان مناسب للجلوس.',
        icon: Sparkles,
      },
    ];
  }

  return cards;
}

function toJourneyAnswers(profile: WelcomeProfile): JourneyAnswers {
  const purpose = visitPurposes.find((item) => item.value === profile.visitPurpose);
  const companion: CompanionType = profile.withFamily
    ? 'family'
    : profile.ageGroup === '50-plus' || profile.ageGroup === '60-plus'
      ? 'elderly'
      : 'solo';

  return {
    journeyType: purpose?.journeyType ?? 'activity',
    companion,
    duration: profile.visitPurpose === 'urgent' ? 'one-hour' : 'half-day',
    currentLocation: profile.currentLocation,
    ageGroup: profile.ageGroup,
    withFamily: profile.withFamily,
    visitPurpose: profile.visitPurpose,
  };
}

export function HomePage() {
  const navigate = useNavigate();
  const metrics = useAppStore((state) => state.metrics);
  const setJourneyAnswers = useAppStore((state) => state.setJourneyAnswers);
  const [profile, setProfile] = useState<WelcomeProfile>({
    currentLocation: 'abha',
    ageGroup: '18-49',
    withFamily: true,
    visitPurpose: 'family',
  });
  const recommendations = useMemo(() => buildRecommendations(profile), [profile]);

  function startPersonalPlan() {
    setJourneyAnswers(toJourneyAnswers(profile));
    navigate(profile.visitPurpose === 'urgent' ? '/nearby' : '/plan');
  }

  return (
    <div className="bg-slate-50">
      <section className="relative isolate overflow-hidden bg-emerald-950 text-white">
        <img
          alt="منظر من عسير"
          className="absolute inset-0 h-full w-full object-cover object-center"
          src={asirHero}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,78,59,0.48),rgba(9,75,78,0.62)_42%,rgba(2,6,23,0.92))]" />
        <div className="home-asir-strip absolute inset-x-0 top-0 h-3" />
        <span className="home-gold-thread absolute top-[22%] left-[-18%] h-0.5 w-[82%] rotate-[-14deg]" />
        <span className="home-gold-thread home-gold-thread-delay absolute bottom-[28%] right-[-22%] h-0.5 w-[92%] rotate-[18deg]" />

        <div className="relative mx-auto grid min-h-[calc(100dvh-4rem)] w-full max-w-6xl content-end gap-5 px-4 pb-28 pt-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:pb-14">
          <div className="pb-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/14 px-4 py-2 text-sm font-black text-amber-50 shadow-lg shadow-slate-950/20">
              <Sparkles className="size-4 text-amber-200" />
              منطقة عسير ترحب بك
            </div>
            <h1 className="mt-5 text-5xl font-black leading-tight tracking-normal sm:text-7xl">صيف وصحة</h1>
            <p className="mt-4 max-w-lg text-lg font-bold leading-9 text-white/92">
              اختر موقعك وهدف زيارتك، ونرتب لك تجربة صحية سياحية قريبة من أجواء عسير.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-2">
              {journeySignals.map((signal) => (
                <article className="rounded-lg border border-white/16 bg-slate-950/28 p-3 shadow-lg shadow-slate-950/10" key={signal.label}>
                  <signal.icon className="size-5 text-amber-100" />
                  <p className="mt-2 text-xs font-black">{signal.label}</p>
                  <p className="mt-1 text-[11px] leading-4 text-white/76">{signal.value}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-white/25 bg-white/96 text-slate-950 shadow-2xl shadow-slate-950/30">
            <div className="home-asir-strip h-3" />
            <div className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-emerald-700">رحلتك الآن</p>
                  <h2 className="mt-1 text-2xl font-black leading-tight">ابدأ من المكان المناسب لك</h2>
                </div>
                <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700">
                  <QrCode className="size-6" />
                </span>
              </div>

              <div className="mt-5 space-y-5">
                <section>
                  <p className="text-sm font-black text-slate-800">أنت الآن في</p>
                  <OptionButtons
                    onChange={(currentLocation) => setProfile((current) => ({ ...current, currentLocation }))}
                    options={locations}
                    value={profile.currentLocation}
                  />
                </section>

                <section className="border-t border-slate-100 pt-4">
                  <p className="text-sm font-black text-slate-800">العمر</p>
                  <OptionButtons
                    onChange={(ageGroup) => setProfile((current) => ({ ...current, ageGroup }))}
                    options={ageGroups}
                    value={profile.ageGroup}
                  />
                </section>

                <section className="grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-black text-slate-800">من معك؟</p>
                    <OptionButtons
                      onChange={(withFamily) => setProfile((current) => ({ ...current, withFamily }))}
                      options={familyOptions}
                      value={profile.withFamily}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800">الغرض من الزيارة</p>
                    <OptionButtons
                      onChange={(visitPurpose) => setProfile((current) => ({ ...current, visitPurpose }))}
                      options={visitPurposes}
                      value={profile.visitPurpose}
                    />
                  </div>
                </section>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-sm font-black text-emerald-800">اقتراحات فورية</p>
                <div className="mt-3 grid gap-3">
                  {recommendations.slice(0, 3).map((item) => (
                    <article className="flex items-start gap-3" key={item.title}>
                      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-emerald-700 text-white">
                        <item.icon className="size-5" />
                      </span>
                      <div>
                        <h3 className="text-sm font-black text-slate-950">{item.title}</h3>
                        <p className="mt-1 text-xs font-bold leading-5 text-slate-600">{item.text}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <Button className="mt-5 w-full bg-emerald-700 hover:bg-emerald-800" icon={<ArrowLeft className="size-4" />} onClick={startPersonalPlan}>
                اعرض الخيارات المناسبة
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-black text-emerald-700">أجواء عسير في رحلتك</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">سياحة وفرح واطمئنان</h2>
            </div>
            <p className="hidden text-sm font-bold text-slate-500 sm:block">
              {metrics.journeys.toLocaleString('ar-SA')} رحلة مخططة
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {asirMoments.map((item) => (
              <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" key={item.title}>
                <span className="grid size-11 place-items-center rounded-lg bg-amber-100 text-amber-700">
                  <item.icon className="size-6" />
                </span>
                <h3 className="mt-4 text-lg font-black text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm font-bold leading-7 text-slate-600">{item.text}</p>
              </article>
            ))}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr]">
            <button
              className="rounded-lg border border-emerald-200 bg-emerald-700 p-5 text-right text-white shadow-sm transition hover:bg-emerald-800"
              onClick={() => navigate('/assistant')}
              type="button"
            >
              <Bot className="size-6" />
              <h2 className="mt-4 text-xl font-black">اسأل الدكتور مساعد</h2>
              <p className="mt-2 text-sm font-bold leading-7 text-emerald-50">
                إجابة سريعة عن المركز الصحي، الطوارئ، الفعاليات، أو أقرب نقطة توعوية.
              </p>
            </button>
            <button
              className="rounded-lg border border-amber-200 bg-white p-5 text-right shadow-sm transition hover:bg-amber-50"
              onClick={() => navigate('/events')}
              type="button"
            >
              <Sparkles className="size-6 text-amber-600" />
              <h2 className="mt-4 text-xl font-black text-slate-950">فعاليات قريبة</h2>
              <p className="mt-2 text-sm font-bold leading-7 text-slate-600">
                اختر فعالية صحية أو عائلية قريبة، ثم اربطها بخطة اليوم.
              </p>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

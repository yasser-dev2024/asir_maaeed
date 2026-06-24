import { ArrowLeft, HeartPulse, MapPinned, Phone, ShieldCheck, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';
import { useAppStore } from '../store/appStore';
import type { AgeGroup, CompanionType, JourneyAnswers, JourneyType, SmartEntryTripOption, VisitorType } from '../types/domain';
import { safeUrl } from '../utils/security';

interface SmartHealthEntryProps {
  visible: boolean;
  force?: boolean;
  onDone?: () => void;
}

type EntryStep = 'age' | 'visitor' | 'call937' | 'nearby' | 'facility' | 'trip' | 'result';

function optionToJourneyType(optionId: string): JourneyType {
  if (optionId === 'hiking') {
    return 'adventure';
  }

  if (optionId === 'kids-events') {
    return 'kids';
  }

  if (optionId === 'family-events') {
    return 'family';
  }

  if (optionId === 'walkway' || optionId === 'sport') {
    return 'activity';
  }

  return 'relax';
}

function companionFor(ageGroupId: string, visitorType?: VisitorType): CompanionType {
  if (ageGroupId === 'under-18') {
    return 'family';
  }

  if (ageGroupId === '50-plus') {
    return 'elderly';
  }

  return visitorType === 'visitor' ? 'friends' : 'solo';
}

function toJourneyAnswers(ageGroupId: string, visitorType: VisitorType | undefined, option: SmartEntryTripOption): JourneyAnswers {
  return {
    journeyType: optionToJourneyType(option.id),
    companion: companionFor(ageGroupId, visitorType),
    duration: option.id === 'health-centers' ? 'one-hour' : 'half-day',
    ageGroup: ageGroupId as AgeGroup,
    withFamily: ageGroupId === 'under-18' || option.id === 'family-events' || option.id === 'kids-events',
    visitPurpose: option.id === 'health-centers' ? 'urgent' : option.id === 'walkway' ? 'activity' : 'relax',
  };
}

export function SmartHealthEntry({ visible, force = false, onDone }: SmartHealthEntryProps) {
  const navigate = useNavigate();
  const config = useAppStore((state) => state.smartEntryConfig);
  const setSmartEntryCompleted = useAppStore((state) => state.setSmartEntryCompleted);
  const setJourneyAnswers = useAppStore((state) => state.setJourneyAnswers);
  const [step, setStep] = useState<EntryStep>('age');
  const [ageGroupId, setAgeGroupId] = useState('');
  const [visitorType, setVisitorType] = useState<VisitorType | undefined>();
  const [selectedTripId, setSelectedTripId] = useState('');

  const activeAgeGroups = useMemo(() => config.ageGroups.filter((item) => item.active), [config.ageGroups]);
  const selectedAgeGroup = activeAgeGroups.find((item) => item.id === ageGroupId);
  const activeVisitorTypes = useMemo(() => config.visitorTypes.filter((item) => item.active), [config.visitorTypes]);
  const callQuestion = config.yesNoQuestions.find((item) => item.id === 'call937' && item.active);
  const nearbyQuestion = config.yesNoQuestions.find((item) => item.id === 'nearbyFacility' && item.active);
  const activeFacilities = config.facilityOptions.filter((item) => item.active);
  const activeTrips = config.tripOptions.filter(
    (item) => item.active && (!ageGroupId || item.ageGroupIds.includes(ageGroupId))
  );
  const selectedTrip = activeTrips.find((item) => item.id === selectedTripId);

  if (!visible) {
    return null;
  }

  function finish(route?: string) {
    if (!force) {
      setSmartEntryCompleted();
    }

    onDone?.();

    if (route?.startsWith('/')) {
      navigate(route);
    }
  }

  function nextAfterVisitor() {
    if (callQuestion) {
      setStep('call937');
      return;
    }

    if (nearbyQuestion) {
      setStep('nearby');
      return;
    }

    setStep('trip');
  }

  function nextAfterCall() {
    if (nearbyQuestion) {
      setStep('nearby');
      return;
    }

    setStep('trip');
  }

  function openUrl(url: string, fallbackRoute?: string) {
    const cleanUrl = safeUrl(url);

    if (cleanUrl.startsWith('tel:') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('mailto:')) {
      window.location.assign(cleanUrl);
      return;
    }

    if (cleanUrl.startsWith('/')) {
      finish(cleanUrl);
      return;
    }

    finish(fallbackRoute);
  }

  function chooseTrip(option: SmartEntryTripOption) {
    setSelectedTripId(option.id);
    setJourneyAnswers(toJourneyAnswers(ageGroupId, visitorType, option));
    setStep('result');
  }

  return (
    <div className="fixed inset-0 z-40 grid h-dvh overflow-y-auto bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(251,191,36,0.22),transparent_24%),linear-gradient(180deg,#064e3b,#0f766e_44%,#020617)]" />
      <span className="home-asir-strip absolute inset-x-0 top-0 h-3" />
      <span className="home-gold-thread absolute top-[24%] left-[-20%] h-0.5 w-[92%] rotate-[-14deg]" />

      <div className="smart-entry-card relative mx-auto flex min-h-full w-full max-w-md flex-col overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom)+1.35rem)] pt-[calc(env(safe-area-inset-top)+1.35rem)]">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-normal text-amber-100">Smart Health Entry</p>
            <h1 className="mt-1 text-2xl font-black">الدخول الصحي الذكي</h1>
          </div>
          <span className="grid size-12 place-items-center rounded-lg border border-amber-100/25 bg-white/12">
            <HeartPulse className="size-6 text-amber-100" />
          </span>
        </header>

        <main className="grid flex-1 place-items-center py-7">
          {step === 'age' ? (
            <section className="w-full">
              <div className="mb-7 text-center">
                <Sparkles className="mx-auto size-8 text-amber-100" />
                <h2 className="mt-4 text-3xl font-black leading-tight">ما فئتك العمرية؟</h2>
              </div>
              <div className="grid gap-3">
                {activeAgeGroups.map((group) => (
                  <button
                    className="min-h-16 rounded-lg border border-white/18 bg-white/12 px-5 text-xl font-black shadow-lg shadow-slate-950/18 transition hover:bg-white/18"
                    key={group.id}
                    onClick={() => {
                      setAgeGroupId(group.id);
                      setStep('visitor');
                    }}
                    type="button"
                  >
                    {group.label}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {step === 'visitor' ? (
            <section className="w-full">
              <div className="rounded-lg border border-amber-100/24 bg-amber-50/12 p-4 text-center">
                <ShieldCheck className="mx-auto size-7 text-amber-100" />
                <p className="mt-3 text-lg font-black leading-8">{selectedAgeGroup?.message}</p>
              </div>
              <div className="mt-7 text-center">
                <h2 className="text-3xl font-black leading-tight">هل أنت زائر أم من سكان المنطقة؟</h2>
              </div>
              <div className="mt-5 grid gap-3">
                {activeVisitorTypes.map((type) => (
                  <button
                    className="min-h-15 rounded-lg border border-white/18 bg-white/12 px-5 text-lg font-black transition hover:bg-white/18"
                    key={type.id}
                    onClick={() => {
                      setVisitorType(type.id);
                      nextAfterVisitor();
                    }}
                    type="button"
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {step === 'call937' && callQuestion ? (
            <section className="w-full text-center">
              <Phone className="mx-auto size-10 text-amber-100" />
              <h2 className="mt-5 text-4xl font-black leading-tight">{callQuestion.question}</h2>
              <div className="mt-8 grid gap-3">
                <button
                  className="min-h-16 rounded-lg bg-amber-100 px-5 text-lg font-black text-emerald-950"
                  onClick={() => {
                    window.location.assign('tel:937');
                    nextAfterCall();
                  }}
                  type="button"
                >
                  {callQuestion.yesLabel}
                </button>
                <button
                  className="min-h-16 rounded-lg border border-white/18 bg-white/12 px-5 text-lg font-black"
                  onClick={nextAfterCall}
                  type="button"
                >
                  {callQuestion.noLabel}
                </button>
              </div>
            </section>
          ) : null}

          {step === 'nearby' && nearbyQuestion ? (
            <section className="w-full text-center">
              <MapPinned className="mx-auto size-10 text-amber-100" />
              <h2 className="mt-5 text-4xl font-black leading-tight">{nearbyQuestion.question}</h2>
              <div className="mt-8 grid gap-3">
                <button
                  className="min-h-16 rounded-lg bg-amber-100 px-5 text-lg font-black text-emerald-950"
                  onClick={() => setStep('facility')}
                  type="button"
                >
                  {nearbyQuestion.yesLabel}
                </button>
                <button
                  className="min-h-16 rounded-lg border border-white/18 bg-white/12 px-5 text-lg font-black"
                  onClick={() => setStep('trip')}
                  type="button"
                >
                  {nearbyQuestion.noLabel}
                </button>
              </div>
            </section>
          ) : null}

          {step === 'facility' ? (
            <section className="w-full">
              <div className="mb-5 text-center">
                <h2 className="text-3xl font-black leading-tight">اختر المرفق الأقرب</h2>
              </div>
              <div className="grid gap-3">
                {activeFacilities.map((facility) => (
                  <button
                    className="min-h-14 rounded-lg border border-white/18 bg-white/12 px-5 text-base font-black transition hover:bg-white/18"
                    key={facility.id}
                    onClick={() => openUrl(facility.mapUrl, '/nearby')}
                    type="button"
                  >
                    {facility.label}
                  </button>
                ))}
              </div>
              <Button className="mt-5 w-full bg-amber-100 text-emerald-950 hover:bg-white" onClick={() => setStep('trip')}>
                أكمل الرحلة
              </Button>
            </section>
          ) : null}

          {step === 'trip' ? (
            <section className="w-full">
              <div className="mb-5 text-center">
                <h2 className="text-3xl font-black leading-tight">أين وجهتك أو ماذا تريد في رحلتك الحالية؟</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {activeTrips.map((option) => (
                  <button
                    className="min-h-14 rounded-lg border border-white/18 bg-white/12 px-3 text-base font-black transition hover:bg-white/18"
                    key={option.id}
                    onClick={() => chooseTrip(option)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {step === 'result' && selectedTrip ? (
            <section className="w-full rounded-lg border border-white/18 bg-white/12 p-5 shadow-2xl shadow-slate-950/25">
              <p className="text-sm font-black text-amber-100">النتيجة المناسبة</p>
              <h2 className="mt-2 text-3xl font-black leading-tight">{selectedTrip.title}</h2>
              <p className="mt-3 text-base font-bold leading-7 text-white/86">{selectedTrip.healthNotice}</p>
              <div className="mt-5 grid gap-2">
                {selectedTrip.tips.map((tip) => (
                  <div className="flex items-center gap-3 rounded-lg bg-slate-950/24 px-3 py-2 text-sm font-black" key={tip}>
                    <span className="size-2 rounded-full bg-amber-200" />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 grid gap-3">
                {selectedTrip.call937 ? (
                  <Button className="w-full bg-white text-emerald-950 hover:bg-amber-50" icon={<Phone className="size-4" />} onClick={() => window.location.assign('tel:937')}>
                    اتصل بـ 937
                  </Button>
                ) : null}
                <Button
                  className="w-full bg-amber-100 text-emerald-950 hover:bg-white"
                  icon={<ArrowLeft className="size-4" />}
                  onClick={() => openUrl(selectedTrip.mapUrl, selectedTrip.route)}
                >
                  {selectedTrip.ctaLabel}
                </Button>
                <button className="min-h-11 text-sm font-black text-white/80" onClick={() => finish('/')} type="button">
                  الدخول للرئيسية
                </button>
              </div>
            </section>
          ) : null}
        </main>

        <footer className="rounded-lg border border-white/12 bg-slate-950/20 p-3 text-xs font-bold leading-5 text-white/74">
          {config.privacyNote}
        </footer>
      </div>
    </div>
  );
}

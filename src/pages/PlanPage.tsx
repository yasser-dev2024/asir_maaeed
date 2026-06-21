import { BookmarkCheck, CalendarCheck, HeartPulse, Map, MapPin, Route, ShieldPlus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { buildDailyPlan } from '../services/planService';
import { useAppStore } from '../store/appStore';

export function PlanPage() {
  const events = useAppStore((state) => state.events);
  const answers = useAppStore((state) => state.journeyAnswers);
  const savedPlan = useAppStore((state) => state.savedPlan);
  const savePlan = useAppStore((state) => state.savePlan);
  const plan = buildDailyPlan(answers, events);

  return (
    <div className="py-4">
      <PageHeader
        action={
          <Button icon={<BookmarkCheck className="size-4" />} onClick={savePlan} variant={savedPlan ? 'secondary' : 'primary'}>
            {savedPlan ? 'تم حفظ خطتي' : 'احفظ خطتي'}
          </Button>
        }
        description="خطة يوم مبنية على اختياراتك، تجمع الفعالية الأقرب، ممشى مناسب، مركز صحي، ونصائح سلامة."
        eyebrow="الخطة الصحية"
        title="يوم صحي وسياحي جاهز"
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <section className="grid gap-3">
          <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="grid size-11 place-items-center rounded-lg bg-teal-50 text-teal-700">
                <CalendarCheck className="size-5" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-500">أقرب فعالية</p>
                <h2 className="mt-1 text-lg font-black text-slate-950">{plan.event.title}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">{plan.event.description}</p>
                <p className="mt-3 text-sm font-bold text-teal-700">
                  {plan.event.location} - {plan.event.time}
                </p>
              </div>
            </div>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="grid size-11 place-items-center rounded-lg bg-sky-50 text-sky-700">
                <Route className="size-5" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-500">أقرب ممشى</p>
                <h2 className="mt-1 text-lg font-black text-slate-950">{plan.walkway.name}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  يبعد {plan.walkway.distance}، طوله {plan.walkway.length}، و{plan.walkway.shade}.
                </p>
              </div>
            </div>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="grid size-11 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                <ShieldPlus className="size-5" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-500">أقرب مركز صحي</p>
                <h2 className="mt-1 text-lg font-black text-slate-950">{plan.healthCenter.name}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {plan.healthCenter.distance} - {plan.healthCenter.availability} - للاستشارة {plan.healthCenter.phone}
                </p>
              </div>
            </div>
          </article>
        </section>
        <aside className="grid gap-4">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <HeartPulse className="size-5 text-teal-700" />
              <h2 className="font-black text-slate-950">نصائح صحية</h2>
            </div>
            <ul className="mt-4 grid gap-2">
              {plan.tips.map((tip) => (
                <li className="rounded-lg bg-slate-50 p-3 text-sm leading-7 text-slate-700" key={tip}>
                  {tip}
                </li>
              ))}
            </ul>
          </section>
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Map className="size-5 text-teal-700" />
                <h2 className="font-black text-slate-950">خريطة الخطة</h2>
              </div>
              <span className="text-xs font-bold text-slate-500">محاكاة تفاعلية</span>
            </div>
            <div className="relative h-64 bg-[linear-gradient(135deg,#e0f2fe,#ecfdf5)]">
              <div className="absolute inset-x-6 top-1/2 h-2 -translate-y-1/2 rounded-full bg-white shadow-inner" />
              {plan.mapNotes.map((note, index) => (
                <div
                  className="absolute flex -translate-x-1/2 flex-col items-center gap-1 text-center"
                  key={note}
                  style={{ left: `${20 + index * 20}%`, top: `${34 + (index % 2) * 24}%` }}
                >
                  <span className="grid size-9 place-items-center rounded-full bg-teal-700 text-white shadow-lg">
                    <MapPin className="size-4" />
                  </span>
                  <span className="max-w-20 text-[11px] font-bold leading-4 text-slate-700">{note}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

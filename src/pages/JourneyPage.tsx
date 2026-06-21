import { ArrowLeft, HeartPulse, MapPin, Target, Users } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { useAppStore } from '../store/appStore';
import type {
  AgeGroup,
  CompanionType,
  CurrentLocation,
  JourneyAnswers,
  JourneyType,
  VisitPurpose,
} from '../types/domain';

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

const visitPurposes: { label: string; value: VisitPurpose; journeyType: JourneyType }[] = [
  { label: 'نشاط ومشي', value: 'activity', journeyType: 'activity' },
  { label: 'زيارة عائلية', value: 'family', journeyType: 'family' },
  { label: 'استرخاء', value: 'relax', journeyType: 'relax' },
  { label: 'توعية صحية', value: 'awareness', journeyType: 'elderly' },
  { label: 'مساعدة صحية', value: 'urgent', journeyType: 'elderly' },
];

interface JourneyForm {
  currentLocation: CurrentLocation;
  ageGroup: AgeGroup;
  withFamily: boolean;
  visitPurpose: VisitPurpose;
}

function OptionGrid<T extends string | boolean>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { label: string; value: T }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-2">
      {options.map((option) => (
        <button
          className={`min-h-12 rounded-lg border px-3 text-sm font-black transition ${
            value === option.value
              ? 'border-teal-700 bg-teal-700 text-white shadow-lg shadow-teal-900/15'
              : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-teal-50'
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

function buildAnswers(form: JourneyForm): JourneyAnswers {
  const purpose = visitPurposes.find((item) => item.value === form.visitPurpose);
  const companion: CompanionType =
    form.withFamily || form.ageGroup === 'under-18'
      ? 'family'
      : form.ageGroup === '50-plus' || form.ageGroup === '60-plus'
        ? 'elderly'
        : 'solo';

  return {
    journeyType: purpose?.journeyType ?? 'activity',
    companion,
    duration: form.visitPurpose === 'urgent' ? 'one-hour' : 'half-day',
    currentLocation: form.currentLocation,
    ageGroup: form.ageGroup,
    withFamily: form.withFamily,
    visitPurpose: form.visitPurpose,
  };
}

export function JourneyPage() {
  const navigate = useNavigate();
  const setJourneyAnswers = useAppStore((state) => state.setJourneyAnswers);
  const [form, setForm] = useState<JourneyForm>({
    currentLocation: 'abha',
    ageGroup: '18-49',
    withFamily: true,
    visitPurpose: 'family',
  });

  function submitJourney() {
    setJourneyAnswers(buildAnswers(form));
    navigate(form.visitPurpose === 'urgent' ? '/nearby' : '/plan');
  }

  return (
    <div className="py-4">
      <PageHeader
        description="أجب عن الأسئلة الرئيسية ليعرض لك مساعد صيف وصحة خيارات مناسبة لموقعك وعائلتك وهدف زيارتك."
        eyebrow="بداية الرحلة الصحية"
        title="معلومات الزيارة"
      />

      <div className="grid gap-4">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-teal-50 text-teal-700">
              <MapPin className="size-5" />
            </span>
            <h2 className="text-base font-black text-slate-950">أنت الآن في ..</h2>
          </div>
          <OptionGrid
            onChange={(currentLocation) => setForm((current) => ({ ...current, currentLocation }))}
            options={locations}
            value={form.currentLocation}
          />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-sky-50 text-sky-700">
              <HeartPulse className="size-5" />
            </span>
            <h2 className="text-base font-black text-slate-950">العمر</h2>
          </div>
          <OptionGrid
            onChange={(ageGroup) => setForm((current) => ({ ...current, ageGroup }))}
            options={ageGroups}
            value={form.ageGroup}
          />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
              <Users className="size-5" />
            </span>
            <h2 className="text-base font-black text-slate-950">العائلة</h2>
          </div>
          <OptionGrid
            onChange={(withFamily) => setForm((current) => ({ ...current, withFamily }))}
            options={[
              { label: 'مع العائلة', value: true },
              { label: 'بدون عائلة', value: false },
            ]}
            value={form.withFamily}
          />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-amber-50 text-amber-700">
              <Target className="size-5" />
            </span>
            <h2 className="text-base font-black text-slate-950">الغرض من الزيارة</h2>
          </div>
          <OptionGrid
            onChange={(visitPurpose) => setForm((current) => ({ ...current, visitPurpose }))}
            options={visitPurposes}
            value={form.visitPurpose}
          />
        </section>
      </div>

      <div className="sticky bottom-24 mt-5 rounded-lg border border-slate-200 bg-white p-3 shadow-lg shadow-slate-950/10 sm:static sm:shadow-none">
        <Button className="w-full" icon={<ArrowLeft className="size-4" />} onClick={submitJourney}>
          اعرض الخيارات المناسبة
        </Button>
      </div>
    </div>
  );
}

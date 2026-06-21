import { Ambulance, ExternalLink, MapPin, Navigation, Phone, Share2, Trees } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { healthCenters, walkways } from '../data/mockData';
import { useAppStore } from '../store/appStore';

export function NearbyPage() {
  const event = useAppStore((state) => state.events.find((item) => item.active));
  const center = healthCenters[0] ?? {
    id: 'center-default',
    name: 'مركز صحي قريب',
    distance: 'قريب منك',
    availability: 'متاح عبر 937',
    phone: '937',
    mapUrl: 'https://maps.google.com/?q=Abha+Health+Center',
  };
  const walkway = walkways[0] ?? {
    id: 'walk-default',
    name: 'ممشى صحي قريب',
    distance: 'قريب منك',
    length: 'مسار قصير',
    shade: 'مناسب للمشي الخفيف',
    mapUrl: 'https://maps.google.com/?q=Abha+Walkway',
  };

  return (
    <div className="py-4">
      <PageHeader
        description="وضع سريع للزائر يعرض أقرب خدمات صحية وسياحية وإجراءات طارئة ومشاركة الموقع."
        eyebrow="أنا الآن"
        title="الخدمات القريبة منك"
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <section className="grid gap-3">
          <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="grid size-11 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                <Ambulance className="size-5" />
              </span>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-500">أقرب مركز صحي</p>
                <h2 className="mt-1 text-lg font-black text-slate-950">{center.name}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  يبعد {center.distance}، {center.availability}.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href={`tel:${center.phone}`}>
                    <Button icon={<Phone className="size-4" />} variant="secondary">
                      {center.phone}
                    </Button>
                  </a>
                  <a href={center.mapUrl} rel="noreferrer" target="_blank">
                    <Button icon={<ExternalLink className="size-4" />} variant="secondary">
                      الخريطة
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="grid size-11 place-items-center rounded-lg bg-sky-50 text-sky-700">
                <MapPin className="size-5" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-500">أقرب فعالية</p>
                <h2 className="mt-1 text-lg font-black text-slate-950">{event?.title ?? 'مسار الضباب الصحي'}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">{event?.location ?? 'ممشى الضباب - أبها'}</p>
              </div>
            </div>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="grid size-11 place-items-center rounded-lg bg-teal-50 text-teal-700">
                <Trees className="size-5" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-500">أقرب ممشى</p>
                <h2 className="mt-1 text-lg font-black text-slate-950">{walkway.name}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {walkway.distance} - {walkway.length} - {walkway.shade}
                </p>
              </div>
            </div>
          </article>
        </section>
        <aside className="grid gap-4">
          <section className="rounded-lg border border-rose-200 bg-rose-50 p-4">
            <h2 className="text-lg font-black text-rose-900">الطوارئ</h2>
            <p className="mt-2 text-sm leading-7 text-rose-800">
              عند ألم صدر، ضيق تنفس شديد، إغماء، نزيف، أو أعراض خطيرة اتصل فوراً ولا تعتمد على المنصة.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <a href="tel:997">
                <Button className="w-full" variant="danger">
                  الإسعاف 997
                </Button>
              </a>
              <a href="tel:937">
                <Button className="w-full" variant="secondary">
                  الصحة 937
                </Button>
              </a>
            </div>
          </section>
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">مشاركة الموقع</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              يفتح زر المشاركة خيارات الجهاز لإرسال رابط موقعك الحالي للفريق أو للمرافقين.
            </p>
            <Button
              className="mt-4 w-full"
              icon={<Share2 className="size-4" />}
              onClick={() => {
                void navigator.share?.({
                  title: 'أنا الآن - صيف وصحة',
                  text: 'أحتاج أقرب خدمة صحية أو سياحية في عسير.',
                  url: window.location.href,
                });
              }}
            >
              مشاركة الموقع
            </Button>
          </section>
          <section className="relative h-64 overflow-hidden rounded-lg border border-slate-200 bg-[linear-gradient(135deg,#dbeafe,#dcfce7)] shadow-sm">
            <div className="absolute inset-5 rounded-[2rem] border-2 border-white/70" />
            <div className="absolute right-10 top-8 flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm">
              <Navigation className="size-4 text-teal-700" />
              موقعك الحالي
            </div>
            {[center.name, event?.title ?? 'فعالية قريبة', walkway.name].map((label, index) => (
              <div
                className="absolute flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm"
                key={label}
                style={{ left: `${18 + index * 17}%`, top: `${42 + index * 14}%` }}
              >
                <MapPin className="size-4 text-teal-700" />
                {label}
              </div>
            ))}
          </section>
        </aside>
      </div>
    </div>
  );
}

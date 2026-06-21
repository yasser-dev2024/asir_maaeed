import {
  BarChart3,
  CalendarDays,
  Copy,
  Download,
  Edit3,
  Eye,
  EyeOff,
  MapPinned,
  Plus,
  QrCode,
  RefreshCw,
  Save,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../../components/ui/Button';
import { MetricCard } from '../../components/ui/MetricCard';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusPill } from '../../components/ui/StatusPill';
import { fetchQrCentralStats, type QrCentralStats } from '../../services/qrAnalyticsService';
import { buildQrLocationUrl, generateQrPngDataUrl } from '../../services/qrLocationService';
import { useAppStore } from '../../store/appStore';
import type { QrLocation } from '../../types/domain';

interface QrLocationFormState {
  name: string;
  description: string;
  active: boolean;
}

const emptyForm: QrLocationFormState = {
  name: '',
  description: '',
  active: true,
};

function formatDate(value: string) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString('ar-SA');
}

function sameLocalDay(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function QrPreview({ slug }: { slug: string }) {
  const [src, setSrc] = useState('');

  useEffect(() => {
    let mounted = true;

    generateQrPngDataUrl(buildQrLocationUrl(slug), 900)
      .then((dataUrl) => {
        if (mounted) {
          setSrc(dataUrl);
        }
      })
      .catch(() => {
        if (mounted) {
          setSrc('');
        }
      });

    return () => {
      mounted = false;
    };
  }, [slug]);

  if (!src) {
    return (
      <span className="grid size-36 place-items-center rounded-lg bg-slate-100 text-slate-400 sm:size-40">
        <QrCode className="size-10" />
      </span>
    );
  }

  return (
    <img
      alt={`QR ${slug}`}
      className="size-36 rounded-lg border border-slate-200 bg-white object-contain p-2 shadow-sm sm:size-40"
      src={src}
    />
  );
}

export function QrLocationsAdminPage() {
  const qrLocations = useAppStore((state) => state.qrLocations);
  const qrLocationVisits = useAppStore((state) => state.qrLocationVisits);
  const addQrLocation = useAppStore((state) => state.addQrLocation);
  const updateQrLocation = useAppStore((state) => state.updateQrLocation);
  const deleteQrLocation = useAppStore((state) => state.deleteQrLocation);
  const toggleQrLocation = useAppStore((state) => state.toggleQrLocation);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<QrLocationFormState>(emptyForm);
  const [copiedSlug, setCopiedSlug] = useState('');
  const [error, setError] = useState('');
  const [centralStats, setCentralStats] = useState<Record<string, QrCentralStats>>({});
  const [centralStatus, setCentralStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function loadCentralStats() {
      if (!qrLocations.length) {
        setCentralStats({});
        setCentralStatus('ready');
        return;
      }

      setCentralStatus('loading');

      try {
        const entries = await Promise.all(
          qrLocations.map(async (location) => [location.slug, await fetchQrCentralStats(location.slug)] as const)
        );

        if (mounted) {
          setCentralStats(Object.fromEntries(entries));
          setCentralStatus('ready');
        }
      } catch {
        if (mounted) {
          setCentralStatus('error');
        }
      }
    }

    void loadCentralStats();

    return () => {
      mounted = false;
    };
  }, [qrLocations, refreshTick]);

  const locationsWithStats = useMemo(
    () =>
      qrLocations.map((location) => {
        const remote = centralStats[location.slug];

        return {
          ...location,
          displayScans: Math.max(location.scans, remote?.total ?? 0),
          displayLastScanAt: remote?.updatedAt || location.lastScanAt,
          centralToday: remote?.today ?? 0,
          centralThisWeek: remote?.thisWeek ?? 0,
        };
      }),
    [centralStats, qrLocations]
  );

  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 6);
    weekAgo.setHours(0, 0, 0, 0);

    const totalScans = locationsWithStats.reduce((sum, location) => sum + location.displayScans, 0);
    const sortedByScans = [...locationsWithStats].sort((a, b) => b.displayScans - a.displayScans);
    const sortedLow = [...locationsWithStats].sort((a, b) => a.displayScans - b.displayScans);
    const centralToday = locationsWithStats.reduce((sum, location) => sum + location.centralToday, 0);
    const centralThisWeek = locationsWithStats.reduce((sum, location) => sum + location.centralThisWeek, 0);
    const localToday = qrLocationVisits.filter((visit) => sameLocalDay(new Date(visit.timestamp), now)).length;
    const localThisWeek = qrLocationVisits.filter((visit) => new Date(visit.timestamp) >= weekAgo).length;

    return {
      totalCreated: locationsWithStats.length,
      totalScans,
      mostScanned: sortedByScans[0],
      leastScanned: sortedLow[0],
      scansToday: Math.max(centralToday, localToday),
      scansThisWeek: Math.max(centralThisWeek, localThisWeek),
      topAreas: sortedByScans.slice(0, 6),
    };
  }, [locationsWithStats, qrLocationVisits]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
  }

  function openCreateForm() {
    resetForm();
    setShowForm(true);
  }

  function startEdit(location: QrLocation) {
    setForm({
      name: location.name,
      description: location.description,
      active: location.active,
    });
    setEditingId(location.id);
    setShowForm(true);
    setError('');
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError('أدخل اسم المنطقة أولًا.');
      return;
    }

    if (editingId) {
      updateQrLocation(editingId, form);
    } else {
      addQrLocation(form);
    }

    resetForm();
    setShowForm(false);
  }

  async function copyLink(slug: string) {
    const link = buildQrLocationUrl(slug);

    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = link;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }

    setCopiedSlug(slug);
    window.setTimeout(() => setCopiedSlug(''), 1600);
  }

  async function downloadQr(location: QrLocation) {
    const dataUrl = await generateQrPngDataUrl(buildQrLocationUrl(location.slug), 1800);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `print-qr-${location.slug}.png`;
    link.click();
  }

  return (
    <div className="grid gap-4">
      <PageHeader
        description="أنشئ QR لكل منطقة أو حي أو موقع، واجعل الرابط يفتح الصفحة الرئيسية نفسها مع تسجيل الإحصائيات دون جمع أي بيانات شخصية."
        eyebrow="QR LOCATIONS"
        title="إدارة QR المناطق"
      />

      <section
        className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 shadow-sm ${
          centralStatus === 'error'
            ? 'border-amber-200 bg-amber-50 text-amber-950'
            : 'border-teal-100 bg-teal-50 text-teal-950'
        }`}
      >
        <div>
          <h2 className="text-base font-black">
            {centralStatus === 'error' ? 'تعذر تحديث الإحصائيات المركزية' : 'الإحصائيات المركزية مفعلة'}
          </h2>
          <p className="mt-1 text-sm font-bold leading-6 opacity-80">
            يتم عد مسحات الجوال في عداد مركزي لا يجمع رقم الجوال أو IMEI أو أي بيانات شخصية.
          </p>
        </div>
        <Button
          icon={<RefreshCw className={`size-4 ${centralStatus === 'loading' ? 'animate-spin' : ''}`} />}
          onClick={() => setRefreshTick((value) => value + 1)}
          variant="secondary"
        >
          تحديث الإحصائيات
        </Button>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          helper="كل المناطق المحفوظة في النظام"
          icon={<QrCode className="size-5" />}
          label="إجمالي QR المنشأة"
          value={stats.totalCreated.toLocaleString('ar-SA')}
        />
        <MetricCard
          helper="بعد منع التكرار خلال 10 دقائق"
          icon={<BarChart3 className="size-5" />}
          label="إجمالي المسحات"
          value={stats.totalScans.toLocaleString('ar-SA')}
        />
        <MetricCard
          helper="أكثر منطقة استخدامًا"
          icon={<MapPinned className="size-5" />}
          label="أكثر منطقة"
          value={stats.mostScanned ? stats.mostScanned.name : '-'}
        />
        <MetricCard
          helper="أقل منطقة استخدامًا"
          icon={<MapPinned className="size-5" />}
          label="أقل منطقة"
          value={stats.leastScanned ? stats.leastScanned.name : '-'}
        />
        <MetricCard
          helper="حسب تاريخ الجهاز المحلي"
          icon={<CalendarDays className="size-5" />}
          label="المسحات اليوم"
          value={stats.scansToday.toLocaleString('ar-SA')}
        />
        <MetricCard
          helper="آخر 7 أيام"
          icon={<CalendarDays className="size-5" />}
          label="المسحات هذا الأسبوع"
          value={stats.scansThisWeek.toLocaleString('ar-SA')}
        />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-950">أكثر المناطق مسحًا للـ QR</h2>
            <p className="mt-1 text-sm font-bold text-slate-500">رسم سريع يساعدك تعرف أين يتحرك الزوار.</p>
          </div>
          <Button icon={<Plus className="size-4" />} onClick={openCreateForm}>
            إضافة QR جديد
          </Button>
        </div>

        <div className="mt-5 grid gap-3">
          {stats.topAreas.length ? (
            stats.topAreas.map((location) => {
              const width = stats.totalScans ? Math.max(8, (location.displayScans / stats.totalScans) * 100) : 8;

              return (
                <div key={location.id}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm font-black">
                    <span className="text-slate-800">{location.name}</span>
                    <span className="text-teal-700">{location.displayScans.toLocaleString('ar-SA')}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <span
                      className="block h-full rounded-full bg-[linear-gradient(90deg,#0f766e,#2dd4bf,#fbbf24)] shadow-[0_0_16px_rgba(20,184,166,0.32)]"
                      style={{ width: `${Math.min(100, width)}%` }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-lg bg-slate-50 p-5 text-center text-sm font-bold text-slate-500">
              أضف أول منطقة ليظهر الرسم البياني هنا.
            </div>
          )}
        </div>
      </section>

      {showForm ? (
        <section className="rounded-lg border border-teal-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-slate-950">
              {editingId ? 'تعديل QR منطقة' : 'إضافة QR جديد'}
            </h2>
            <Button
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              variant="ghost"
            >
              إغلاق
            </Button>
          </div>

          <form className="grid gap-3" onSubmit={onSubmit}>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              اسم المنطقة
              <input
                className="min-h-12 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="مثال: شارع الفن"
                value={form.name}
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              وصف اختياري
              <textarea
                className="min-h-28 rounded-lg border border-slate-200 px-3 py-3 text-sm leading-7 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="وصف مختصر يظهر للإدارة فقط"
                value={form.description}
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              حالة QR
              <select
                className="min-h-12 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                onChange={(event) => setForm((current) => ({ ...current, active: event.target.value === 'active' }))}
                value={form.active ? 'active' : 'inactive'}
              >
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
              </select>
            </label>
            {error ? <p className="rounded-lg bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p> : null}
            <Button className="w-full sm:w-fit" icon={editingId ? <Save className="size-4" /> : <Plus className="size-4" />} type="submit">
              {editingId ? 'حفظ التعديل' : 'حفظ وإنشاء QR'}
            </Button>
          </form>
        </section>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-950">جدول المناطق</h2>
            <p className="mt-1 text-sm font-bold text-slate-500">
              الرابط يفتح الصفحة الرئيسية ويحمل اسم المنطقة داخل قيمة qr.
            </p>
          </div>
          <Button icon={<Plus className="size-4" />} onClick={openCreateForm} variant="secondary">
            إضافة QR جديد
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1120px] w-full text-right text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-3 py-3 font-black">صورة QR</th>
                <th className="px-3 py-3 font-black">اسم المنطقة</th>
                <th className="px-3 py-3 font-black">slug</th>
                <th className="px-3 py-3 font-black">رابط QR</th>
                <th className="px-3 py-3 font-black">عدد المسحات</th>
                <th className="px-3 py-3 font-black">آخر مسح</th>
                <th className="px-3 py-3 font-black">الحالة</th>
                <th className="px-3 py-3 font-black">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {locationsWithStats.map((location) => {
                const qrLink = buildQrLocationUrl(location.slug);

                return (
                  <tr className="border-b border-slate-100 align-top" key={location.id}>
                    <td className="px-3 py-3">
                      <QrPreview slug={location.slug} />
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-black text-slate-950">{location.name}</p>
                      {location.description ? (
                        <p className="mt-1 max-w-xs text-xs font-bold leading-5 text-slate-500">{location.description}</p>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs font-black text-slate-700">{location.slug}</td>
                    <td className="px-3 py-3">
                      <code className="block max-w-xs truncate rounded-lg bg-slate-50 px-2 py-2 text-xs font-bold text-slate-600">
                        {qrLink}
                      </code>
                    </td>
                    <td className="px-3 py-3 font-black text-teal-700">{location.displayScans.toLocaleString('ar-SA')}</td>
                    <td className="px-3 py-3 text-slate-600">{formatDate(location.displayLastScanAt)}</td>
                    <td className="px-3 py-3">
                      <StatusPill active={location.active} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button icon={<Download className="size-4" />} onClick={() => downloadQr(location)} variant="secondary">
                          تحميل للطباعة
                        </Button>
                        <Button icon={<Copy className="size-4" />} onClick={() => copyLink(location.slug)} variant="secondary">
                          {copiedSlug === location.slug ? 'تم النسخ' : 'نسخ الرابط'}
                        </Button>
                        <Button icon={<Edit3 className="size-4" />} onClick={() => startEdit(location)} variant="secondary">
                          تعديل
                        </Button>
                        <Button
                          icon={location.active ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          onClick={() => toggleQrLocation(location.id)}
                          variant="secondary"
                        >
                          {location.active ? 'تعطيل' : 'تفعيل'}
                        </Button>
                        <Button icon={<Trash2 className="size-4" />} onClick={() => deleteQrLocation(location.id)} variant="danger">
                          حذف
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!qrLocations.length ? (
          <div className="mt-4 rounded-lg bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
            لا توجد مناطق بعد. اضغط "إضافة QR جديد" لإنشاء أول رابط.
          </div>
        ) : null}
      </section>
    </div>
  );
}

import {
  Activity,
  BarChart3,
  Bot,
  CalendarDays,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  Plus,
  QrCode,
  Save,
  Search,
  Settings,
  Ticket,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Button } from '../../components/ui/Button';
import { MetricCard } from '../../components/ui/MetricCard';
import { StatusPill } from '../../components/ui/StatusPill';
import { DoctorAssistantAdminSection } from '../../components/admin/DoctorAssistantAdminSection';
import { SmartEntryAdminSection } from '../../components/admin/SmartEntryAdminSection';
import { useAppStore, type ContentPayload, type EventPayload, type KeywordPayload } from '../../store/appStore';
import type { ContentType, KeywordAnswer } from '../../types/domain';
import { contentSchema, eventSchema, keywordSchema, validationMessage } from '../../utils/validation';

// ── Types ───────────────────────────────────────────────────────────────────

type AdminTab = 'dashboard' | 'events' | 'content' | 'keywords' | 'doctor' | 'passport' | 'qr' | 'settings';

interface KeywordFormState {
  question: string;
  keywordsText: string;
  answer: string;
  linkLabel: string;
  linkUrl: string;
  imageUrl: string;
  ctaLabel: string;
  ctaUrl: string;
}

// ── Defaults ─────────────────────────────────────────────────────────────────

const emptyKeywordForm: KeywordFormState = {
  question: '',
  keywordsText: '',
  answer: '',
  linkLabel: '',
  linkUrl: '',
  imageUrl: '',
  ctaLabel: '',
  ctaUrl: '',
};

const emptyEventForm: EventPayload = {
  title: '',
  description: '',
  location: '',
  date: '2026-07-01',
  time: '05:00 م',
  audience: '',
  category: '',
  mapUrl: 'https://maps.google.com/?q=Abha',
};

const emptyContentForm: ContentPayload = {
  title: '',
  type: 'post',
  summary: '',
  category: '',
  actionLabel: 'عرض المادة',
  fileUrl: '/downloads/hydration-guide.pdf',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function toKeywordPayload(form: KeywordFormState): KeywordPayload {
  return keywordSchema.parse({
    question: form.question,
    keywords: form.keywordsText
      .split(/[\n,،]/)
      .map((item) => item.trim())
      .filter(Boolean),
    answer: form.answer,
    linkLabel: form.linkLabel,
    linkUrl: form.linkUrl,
    imageUrl: form.imageUrl,
    ctaLabel: form.ctaLabel,
    ctaUrl: form.ctaUrl,
  });
}

function keywordToForm(answer: KeywordAnswer): KeywordFormState {
  return {
    question: answer.question,
    keywordsText: answer.keywords.join('\n'),
    answer: answer.answer,
    linkLabel: answer.linkLabel,
    linkUrl: answer.linkUrl,
    imageUrl: answer.imageUrl,
    ctaLabel: answer.ctaLabel,
    ctaUrl: answer.ctaUrl,
  };
}

function formatScanDate(scannedAt: string, visits: number) {
  if (!visits || !scannedAt) return '-';
  const date = new Date(scannedAt);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('ar-SA');
}

// ── Shared UI ────────────────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  type = 'text',
  multiline = false,
  placeholder = '',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  multiline?: boolean;
  placeholder?: string;
}) {
  const base =
    'rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition';
  return (
    <label className="grid gap-1.5 text-xs font-black uppercase tracking-wide text-slate-500">
      {label}
      {multiline ? (
        <textarea
          className={`${base} min-h-28 py-2.5 leading-7`}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          value={value}
        />
      ) : (
        <input
          className={`${base} min-h-11`}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          type={type}
          value={value}
        />
      )}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-black uppercase tracking-wide text-slate-500">
      {label}
      <select
        className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
        onChange={(e) => onChange(e.target.value)}
        value={value}
      >
        {children}
      </select>
    </label>
  );
}

function SectionCard({ children, editing = false }: { children: ReactNode; editing?: boolean }) {
  return (
    <div
      className={`rounded-2xl border bg-white p-5 shadow-sm transition ${
        editing ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200'
      }`}
    >
      {children}
    </div>
  );
}

function EditingBanner({ label, onCancel }: { label: string; onCancel: () => void }) {
  return (
    <div className="mb-4 flex items-center justify-between rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-black text-amber-700">
      <span>✏️ وضع التعديل — {label}</span>
      <button className="flex items-center gap-1 text-amber-600 hover:text-amber-800" onClick={onCancel} type="button">
        <X className="size-4" />
        إلغاء
      </button>
    </div>
  );
}

function ItemCard({ children }: { children: ReactNode }) {
  return (
    <article className="rounded-xl border border-slate-100 bg-slate-50 p-4 transition hover:border-slate-200">
      {children}
    </article>
  );
}

// ── Toast ────────────────────────────────────────────────────────────────────

function SaveToast({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-8 left-1/2 z-[200] -translate-x-1/2 flex items-center gap-2 rounded-full bg-teal-700 px-6 py-3 text-sm font-black text-white shadow-2xl shadow-teal-900/30">
      <CheckCircle2 className="size-4" />
      {message}
    </div>
  );
}

function useSavedToast() {
  const [msg, setMsg] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((text = 'تم الحفظ بنجاح ✓') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMsg(text);
    timerRef.current = setTimeout(() => setMsg(''), 3000);
  }, []);
  return { msg, show };
}

// ── Tab nav ───────────────────────────────────────────────────────────────────

const tabs: { id: AdminTab; label: string; icon: typeof Bot }[] = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: BarChart3 },
  { id: 'events', label: 'الفعاليات', icon: CalendarDays },
  { id: 'content', label: 'المحتوى', icon: FileText },
  { id: 'keywords', label: 'الكلمات المفتاحية', icon: Search },
  { id: 'doctor', label: 'د. مساعد', icon: Bot },
  { id: 'passport', label: 'الجواز', icon: Ticket },
  { id: 'qr', label: 'تقارير QR', icon: QrCode },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
];

// ═══════════════════════════════════════════════════════════════════════════════
//  Main page
// ═══════════════════════════════════════════════════════════════════════════════

export function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const toast = useSavedToast();

  // Store
  const metrics = useAppStore((s) => s.metrics);
  const events = useAppStore((s) => s.events);
  const keywordAnswers = useAppStore((s) => s.keywordAnswers);
  const contents = useAppStore((s) => s.contents);
  const passport = useAppStore((s) => s.passport);
  const qrScans = useAppStore((s) => s.qrScans);

  const addKeywordAnswer = useAppStore((s) => s.addKeywordAnswer);
  const updateKeywordAnswer = useAppStore((s) => s.updateKeywordAnswer);
  const deleteKeywordAnswer = useAppStore((s) => s.deleteKeywordAnswer);
  const toggleKeywordAnswer = useAppStore((s) => s.toggleKeywordAnswer);
  const addEvent = useAppStore((s) => s.addEvent);
  const updateEvent = useAppStore((s) => s.updateEvent);
  const deleteEvent = useAppStore((s) => s.deleteEvent);
  const toggleEvent = useAppStore((s) => s.toggleEvent);
  const addContent = useAppStore((s) => s.addContent);
  const updateContent = useAppStore((s) => s.updateContent);
  const deleteContent = useAppStore((s) => s.deleteContent);
  const toggleContent = useAppStore((s) => s.toggleContent);
  const addPassportPoints = useAppStore((s) => s.addPassportPoints);

  // Keywords form
  const [keywordForm, setKeywordForm] = useState<KeywordFormState>(emptyKeywordForm);
  const [editingKeywordId, setEditingKeywordId] = useState<string | null>(null);
  const [keywordError, setKeywordError] = useState('');

  // Events form
  const [eventForm, setEventForm] = useState<EventPayload>(emptyEventForm);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventError, setEventError] = useState('');

  // Contents form
  const [contentForm, setContentForm] = useState<ContentPayload>(emptyContentForm);
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [contentError, setContentError] = useState('');

  // Passport
  const [passportDelta, setPassportDelta] = useState('25');

  // Charts
  const topEvents = useMemo(() => [...events].sort((a, b) => b.visits - a.visits).slice(0, 5), [events]);
  const topKeywords = useMemo(() => [...keywordAnswers].sort((a, b) => b.usage - a.usage).slice(0, 5), [keywordAnswers]);
  const topQr = useMemo(() => [...qrScans].sort((a, b) => b.visits - a.visits).slice(0, 5), [qrScans]);

  // ── Submit handlers ──────────────────────────────────────────────────────

  function onKeywordSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const payload = toKeywordPayload(keywordForm);
      if (editingKeywordId) {
        updateKeywordAnswer(editingKeywordId, payload);
        toast.show('تم تعديل السؤال بنجاح ✓');
      } else {
        addKeywordAnswer(payload);
        toast.show('تم إضافة السؤال بنجاح ✓');
      }
      setKeywordForm(emptyKeywordForm);
      setEditingKeywordId(null);
      setKeywordError('');
    } catch (err) {
      setKeywordError(validationMessage(err));
    }
  }

  function onEventSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const payload = eventSchema.parse(eventForm);
      if (editingEventId) {
        updateEvent(editingEventId, payload);
        toast.show('تم تعديل الفعالية بنجاح ✓');
      } else {
        addEvent(payload);
        toast.show('تم إضافة الفعالية بنجاح ✓');
      }
      setEventForm(emptyEventForm);
      setEditingEventId(null);
      setEventError('');
    } catch (err) {
      setEventError(validationMessage(err));
    }
  }

  function onContentSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const payload = contentSchema.parse(contentForm);
      if (editingContentId) {
        updateContent(editingContentId, payload);
        toast.show('تم تعديل المادة بنجاح ✓');
      } else {
        addContent(payload);
        toast.show('تم إضافة المادة بنجاح ✓');
      }
      setContentForm(emptyContentForm);
      setEditingContentId(null);
      setContentError('');
    } catch (err) {
      setContentError(validationMessage(err));
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-6 py-5">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-widest text-teal-600">ADMIN PORTAL</p>
          <h1 className="mt-1 text-2xl font-black text-slate-950">مركز إدارة صيف وصحة</h1>
        </div>
      </div>

      {/* Tab bar */}
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl">
          <div className="flex gap-1 overflow-x-auto px-4 py-2 scrollbar-none">
            {tabs.map((tab) => (
              <button
                className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition focus:outline-none ${
                  activeTab === tab.id
                    ? 'bg-teal-700 text-white shadow-lg shadow-teal-900/20'
                    : 'text-slate-600 hover:bg-slate-100'
                } ${tab.id === 'doctor' && activeTab !== 'doctor' ? 'ring-2 ring-teal-200' : ''}`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                type="button"
              >
                <tab.icon className="size-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-6">

        {/* ── Dashboard ── */}
        {activeTab === 'dashboard' && (
          <div className="grid gap-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard helper="إجمالي الزيارات المسجلة" icon={<Users className="size-5" />} label="الزوار" value={metrics.visitors.toLocaleString('ar-SA')} />
              <MetricCard helper="مصادر QR المختلفة" icon={<QrCode className="size-5" />} label="QR Scans" value={metrics.qrScans.toLocaleString('ar-SA')} />
              <MetricCard helper="خطط يوم أنشأها المستخدمون" icon={<Activity className="size-5" />} label="الرحلات" value={metrics.journeys.toLocaleString('ar-SA')} />
              <MetricCard helper="استفسارات د. مساعد" icon={<Bot className="size-5" />} label="الاستفسارات" value={metrics.inquiries.toLocaleString('ar-SA')} />
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              {[
                { title: 'أكثر الفعاليات زيارة', rows: topEvents.map((e) => [e.title, e.visits] as const), icon: CalendarDays, color: 'bg-teal-500' },
                { title: 'أكثر مواقع QR نشاطاً', rows: topQr.map((q) => [q.location, q.visits] as const), icon: QrCode, color: 'bg-indigo-500' },
                { title: 'أكثر الكلمات استخداماً', rows: topKeywords.map((k) => [k.question, k.usage] as const), icon: Search, color: 'bg-amber-500' },
              ].map((block) => (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={block.title}>
                  <div className="flex items-center gap-2 font-black text-slate-900">
                    <block.icon className="size-5 text-teal-700" />
                    {block.title}
                  </div>
                  <div className="mt-4 grid gap-3">
                    {block.rows.map(([label, value]) => {
                      const max = Math.max(...block.rows.map(([, v]) => v), 1);
                      return (
                        <div key={label}>
                          <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-500">
                            <span className="truncate">{label}</span>
                            <span className="ml-3 shrink-0">{value.toLocaleString('ar-SA')}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <span
                              className={`block h-full rounded-full transition-all ${block.color}`}
                              style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="mb-4 text-sm font-black text-slate-500 uppercase tracking-widest">الانتقال السريع</p>
              <div className="flex flex-wrap gap-3">
                {tabs.filter((t) => t.id !== 'dashboard').map((tab) => (
                  <button
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ring-1 ring-slate-200 hover:bg-slate-50 transition ${
                      tab.id === 'doctor' ? 'bg-teal-50 text-teal-700 ring-teal-200' : 'text-slate-700'
                    }`}
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    type="button"
                  >
                    <tab.icon className="size-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Events ── */}
        {activeTab === 'events' && (
          <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
            {/* Form */}
            <div className="h-fit">
              <SectionCard editing={Boolean(editingEventId)}>
                {editingEventId && (
                  <EditingBanner
                    label={events.find((e) => e.id === editingEventId)?.title ?? ''}
                    onCancel={() => { setEditingEventId(null); setEventForm(emptyEventForm); setEventError(''); }}
                  />
                )}
                <p className="mb-4 text-lg font-black text-slate-950">
                  {editingEventId ? 'تعديل الفعالية' : 'إضافة فعالية جديدة'}
                </p>
                <form className="grid gap-4" onSubmit={onEventSubmit}>
                  <Field label="اسم الفعالية *" onChange={(v) => setEventForm((f) => ({ ...f, title: v }))} placeholder="مثال: يوم صحة الأسرة" value={eventForm.title} />
                  <Field label="الوصف *" multiline onChange={(v) => setEventForm((f) => ({ ...f, description: v }))} placeholder="وصف مختصر للفعالية..." value={eventForm.description} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="الموقع" onChange={(v) => setEventForm((f) => ({ ...f, location: v }))} placeholder="مثال: مركز صحي أبها" value={eventForm.location} />
                    <Field label="التاريخ" onChange={(v) => setEventForm((f) => ({ ...f, date: v }))} type="date" value={eventForm.date} />
                    <Field label="الوقت" onChange={(v) => setEventForm((f) => ({ ...f, time: v }))} placeholder="05:00 م" value={eventForm.time} />
                    <Field label="الفئة المستهدفة" onChange={(v) => setEventForm((f) => ({ ...f, audience: v }))} placeholder="الأسرة، الأطفال..." value={eventForm.audience} />
                    <Field label="التصنيف" onChange={(v) => setEventForm((f) => ({ ...f, category: v }))} placeholder="صحة، رياضة..." value={eventForm.category} />
                    <Field label="رابط الخريطة" onChange={(v) => setEventForm((f) => ({ ...f, mapUrl: v }))} placeholder="https://maps.google.com/..." value={eventForm.mapUrl} />
                  </div>
                  {eventError && (
                    <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{eventError}</p>
                  )}
                  <Button className="w-full" icon={editingEventId ? <Save className="size-4" /> : <Plus className="size-4" />} type="submit">
                    {editingEventId ? 'حفظ التعديل' : 'إضافة الفعالية'}
                  </Button>
                </form>
              </SectionCard>
            </div>

            {/* List */}
            <div className="grid gap-3 content-start">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                {events.length} فعالية
              </p>
              {events.map((event) => (
                <ItemCard key={event.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-black text-slate-950">{event.title}</h3>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {event.location} · {event.date} · {event.time}
                      </p>
                      {event.description && (
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{event.description}</p>
                      )}
                    </div>
                    <StatusPill active={event.active} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      icon={<Edit3 className="size-3.5" />}
                      onClick={() => { setEditingEventId(event.id); setEventForm(event); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      variant="secondary"
                    >
                      تعديل
                    </Button>
                    <Button
                      icon={event.active ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      onClick={() => { toggleEvent(event.id); toast.show(event.active ? 'تم التعطيل' : 'تم التفعيل'); }}
                      variant="secondary"
                    >
                      {event.active ? 'تعطيل' : 'تفعيل'}
                    </Button>
                    <Button
                      icon={<Trash2 className="size-3.5" />}
                      onClick={() => { if (confirm('هل تريد حذف هذه الفعالية؟')) { deleteEvent(event.id); toast.show('تم الحذف'); } }}
                      variant="danger"
                    >
                      حذف
                    </Button>
                  </div>
                </ItemCard>
              ))}
            </div>
          </div>
        )}

        {/* ── Content ── */}
        {activeTab === 'content' && (
          <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
            <div className="h-fit">
              <SectionCard editing={Boolean(editingContentId)}>
                {editingContentId && (
                  <EditingBanner
                    label={contents.find((c) => c.id === editingContentId)?.title ?? ''}
                    onCancel={() => { setEditingContentId(null); setContentForm(emptyContentForm); setContentError(''); }}
                  />
                )}
                <p className="mb-4 text-lg font-black text-slate-950">
                  {editingContentId ? 'تعديل المادة' : 'إضافة مادة توعوية'}
                </p>
                <form className="grid gap-4" onSubmit={onContentSubmit}>
                  <Field label="عنوان المادة *" onChange={(v) => setContentForm((f) => ({ ...f, title: v }))} placeholder="عنوان المادة..." value={contentForm.title} />
                  <SelectField label="نوع المادة" onChange={(v) => setContentForm((f) => ({ ...f, type: v as ContentType }))} value={contentForm.type}>
                    <option value="post">منشور توعوي</option>
                    <option value="card">بطاقة توعوية</option>
                    <option value="pdf">ملف PDF</option>
                  </SelectField>
                  <Field label="الملخص *" multiline onChange={(v) => setContentForm((f) => ({ ...f, summary: v }))} placeholder="ملخص المادة..." value={contentForm.summary} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="التصنيف" onChange={(v) => setContentForm((f) => ({ ...f, category: v }))} placeholder="صحة، ترطيب..." value={contentForm.category} />
                    <Field label="نص الزر" onChange={(v) => setContentForm((f) => ({ ...f, actionLabel: v }))} placeholder="عرض المادة" value={contentForm.actionLabel} />
                  </div>
                  <Field label="رابط الملف أو الصفحة" onChange={(v) => setContentForm((f) => ({ ...f, fileUrl: v }))} placeholder="/downloads/..." value={contentForm.fileUrl} />
                  {contentError && (
                    <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{contentError}</p>
                  )}
                  <Button className="w-full" icon={editingContentId ? <Save className="size-4" /> : <Plus className="size-4" />} type="submit">
                    {editingContentId ? 'حفظ التعديل' : 'إضافة المادة'}
                  </Button>
                </form>
              </SectionCard>
            </div>

            <div className="grid gap-3 content-start">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                {contents.length} مادة
              </p>
              {contents.map((content) => (
                <ItemCard key={content.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-black text-slate-950">{content.title}</h3>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {content.category} · {content.type === 'post' ? 'منشور' : content.type === 'card' ? 'بطاقة' : 'PDF'}
                      </p>
                      {content.summary && (
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{content.summary}</p>
                      )}
                    </div>
                    <StatusPill active={content.active} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      icon={<Edit3 className="size-3.5" />}
                      onClick={() => { setEditingContentId(content.id); setContentForm(content); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      variant="secondary"
                    >
                      تعديل
                    </Button>
                    <Button
                      icon={content.active ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      onClick={() => { toggleContent(content.id); toast.show(content.active ? 'تم التعطيل' : 'تم التفعيل'); }}
                      variant="secondary"
                    >
                      {content.active ? 'تعطيل' : 'تفعيل'}
                    </Button>
                    <Button
                      icon={<Trash2 className="size-3.5" />}
                      onClick={() => { if (confirm('هل تريد حذف هذه المادة؟')) { deleteContent(content.id); toast.show('تم الحذف'); } }}
                      variant="danger"
                    >
                      حذف
                    </Button>
                  </div>
                </ItemCard>
              ))}
            </div>
          </div>
        )}

        {/* ── Keywords ── */}
        {activeTab === 'keywords' && (
          <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
            <div className="h-fit">
              <SectionCard editing={Boolean(editingKeywordId)}>
                {editingKeywordId && (
                  <EditingBanner
                    label={keywordAnswers.find((k) => k.id === editingKeywordId)?.question ?? ''}
                    onCancel={() => { setEditingKeywordId(null); setKeywordForm(emptyKeywordForm); setKeywordError(''); }}
                  />
                )}
                <p className="mb-4 text-lg font-black text-slate-950">
                  {editingKeywordId ? 'تعديل السؤال' : 'إضافة سؤال جديد'}
                </p>
                <form className="grid gap-4" onSubmit={onKeywordSubmit}>
                  <Field label="عنوان السؤال *" onChange={(v) => setKeywordForm((f) => ({ ...f, question: v }))} placeholder="ما هو سؤالك؟" value={keywordForm.question} />
                  <Field label="الكلمات المفتاحية — كل كلمة في سطر *" multiline onChange={(v) => setKeywordForm((f) => ({ ...f, keywordsText: v }))} placeholder="ماء&#10;ترطيب&#10;شرب" value={keywordForm.keywordsText} />
                  <Field label="الرد النصي *" multiline onChange={(v) => setKeywordForm((f) => ({ ...f, answer: v }))} placeholder="اكتب الإجابة هنا..." value={keywordForm.answer} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="نص الرابط" onChange={(v) => setKeywordForm((f) => ({ ...f, linkLabel: v }))} placeholder="للمزيد اضغط هنا" value={keywordForm.linkLabel} />
                    <Field label="رابط" onChange={(v) => setKeywordForm((f) => ({ ...f, linkUrl: v }))} placeholder="https://..." value={keywordForm.linkUrl} />
                    <Field label="رابط صورة" onChange={(v) => setKeywordForm((f) => ({ ...f, imageUrl: v }))} placeholder="https://..." value={keywordForm.imageUrl} />
                    <Field label="نص زر الإجراء" onChange={(v) => setKeywordForm((f) => ({ ...f, ctaLabel: v }))} placeholder="اتصل بنا" value={keywordForm.ctaLabel} />
                    <Field label="رابط زر الإجراء" onChange={(v) => setKeywordForm((f) => ({ ...f, ctaUrl: v }))} placeholder="https://..." value={keywordForm.ctaUrl} />
                  </div>
                  {keywordError && (
                    <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{keywordError}</p>
                  )}
                  <Button className="w-full" icon={editingKeywordId ? <Save className="size-4" /> : <Plus className="size-4" />} type="submit">
                    {editingKeywordId ? 'حفظ التعديل' : 'إضافة السؤال'}
                  </Button>
                </form>
              </SectionCard>
            </div>

            <div className="grid gap-3 content-start">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                {keywordAnswers.length} سؤال
              </p>
              {keywordAnswers.map((answer) => (
                <ItemCard key={answer.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-black text-slate-950">{answer.question}</h3>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{answer.answer}</p>
                    </div>
                    <StatusPill active={answer.active} />
                  </div>
                  {answer.keywords.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {answer.keywords.map((kw) => (
                        <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700" key={kw}>
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      icon={<Edit3 className="size-3.5" />}
                      onClick={() => { setEditingKeywordId(answer.id); setKeywordForm(keywordToForm(answer)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      variant="secondary"
                    >
                      تعديل
                    </Button>
                    <Button
                      icon={answer.active ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      onClick={() => { toggleKeywordAnswer(answer.id); toast.show(answer.active ? 'تم التعطيل' : 'تم التفعيل'); }}
                      variant="secondary"
                    >
                      {answer.active ? 'تعطيل' : 'تفعيل'}
                    </Button>
                    <Button
                      icon={<Trash2 className="size-3.5" />}
                      onClick={() => { if (confirm('هل تريد حذف هذا السؤال؟')) { deleteKeywordAnswer(answer.id); toast.show('تم الحذف'); } }}
                      variant="danger"
                    >
                      حذف
                    </Button>
                  </div>
                </ItemCard>
              ))}
            </div>
          </div>
        )}

        {/* ── Doctor Assistant ── */}
        {activeTab === 'doctor' && (
          <DoctorAssistantAdminSection onSaved={toast.show} />
        )}

        {/* ── Passport ── */}
        {activeTab === 'passport' && (
          <div className="grid gap-4 lg:grid-cols-3">
            <SectionCard>
              <div className="flex items-center gap-3">
                <div className="grid size-12 place-items-center rounded-2xl bg-teal-50">
                  <Ticket className="size-6 text-teal-700" />
                </div>
                <div>
                  <p className="text-3xl font-black text-slate-950">{passport.points.toLocaleString('ar-SA')}</p>
                  <p className="text-sm font-bold text-slate-500">نقاط المستخدم</p>
                </div>
              </div>
            </SectionCard>

            <SectionCard>
              <div className="flex items-center gap-3">
                <div className="grid size-12 place-items-center rounded-2xl bg-indigo-50">
                  <QrCode className="size-6 text-indigo-700" />
                </div>
                <div>
                  <p className="text-3xl font-black text-slate-950">{passport.scans.toLocaleString('ar-SA')}</p>
                  <p className="text-sm font-bold text-slate-500">عمليات Scan</p>
                </div>
              </div>
            </SectionCard>

            <SectionCard>
              <p className="mb-3 text-sm font-black text-slate-700">تعديل نقاط المستخدم</p>
              <form
                className="grid gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  addPassportPoints(Number(passportDelta), 'تعديل نقاط من لوحة التحكم');
                  toast.show('تم تعديل النقاط ✓');
                }}
              >
                <Field label="عدد النقاط" onChange={setPassportDelta} type="number" value={passportDelta} />
                <Button className="w-full" icon={<Save className="size-4" />} type="submit">
                  تطبيق التعديل
                </Button>
              </form>
            </SectionCard>

            {passport.achievements.length > 0 && (
              <div className="lg:col-span-3">
                <SectionCard>
                  <p className="mb-3 text-sm font-black text-slate-500 uppercase tracking-widest">الإنجازات المحفوظة</p>
                  <div className="flex flex-wrap gap-2">
                    {passport.achievements.map((a) => (
                      <span className="rounded-full bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-700" key={a}>
                        {a}
                      </span>
                    ))}
                  </div>
                </SectionCard>
              </div>
            )}
          </div>
        )}

        {/* ── QR Reports ── */}
        {activeTab === 'qr' && (
          <SectionCard>
            <p className="mb-4 text-lg font-black text-slate-950">تقارير QR الذكية</p>
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="min-w-full text-right text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {['المعرف', 'الموقع', 'Route', 'آخر Scan', 'الزيارات'].map((h) => (
                      <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500" key={h}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {qrScans.map((scan) => (
                    <tr className="hover:bg-slate-50 transition" key={scan.id}>
                      <td className="px-4 py-3 font-black text-slate-950">{scan.source}</td>
                      <td className="px-4 py-3 text-slate-600">{scan.location}</td>
                      <td className="px-4 py-3 text-slate-500">{scan.visits ? scan.lastRoute : '-'}</td>
                      <td className="px-4 py-3 text-slate-500">{formatScanDate(scan.scannedAt, scan.visits)}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block rounded-full bg-teal-50 px-2.5 py-1 text-xs font-black text-teal-700">
                          {scan.visits.toLocaleString('ar-SA')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

        {/* ── Settings ── */}
        {activeTab === 'settings' && (
          <SmartEntryAdminSection />
        )}
      </div>

      <SaveToast message={toast.msg} />
    </div>
  );
}

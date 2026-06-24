import {
  Activity,
  AlertCircle,
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
  Ticket,
  TrendingUp,
  Trash2,
  Users,
  Wifi,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { StatusPill } from '../../components/ui/StatusPill';
import { DoctorAssistantAdminSection } from '../../components/admin/DoctorAssistantAdminSection';
import { SmartEntryAdminSection } from '../../components/admin/SmartEntryAdminSection';
import { useAppStore, type ContentPayload, type EventPayload, type KeywordPayload } from '../../store/appStore';
import type { ContentType, KeywordAnswer } from '../../types/domain';
import { contentSchema, eventSchema, keywordSchema, validationMessage } from '../../utils/validation';

// ── Helpers ──────────────────────────────────────────────────────────────────

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

const emptyKeywordForm: KeywordFormState = {
  question: '', keywordsText: '', answer: '',
  linkLabel: '', linkUrl: '', imageUrl: '', ctaLabel: '', ctaUrl: '',
};

const emptyEventForm: EventPayload = {
  title: '', description: '', location: '',
  date: '2026-07-01', time: '05:00 م',
  audience: '', category: '',
  mapUrl: 'https://maps.google.com/?q=Abha',
};

const emptyContentForm: ContentPayload = {
  title: '', type: 'post', summary: '',
  category: '', actionLabel: 'عرض المادة',
  fileUrl: '/downloads/hydration-guide.pdf',
};

function toKeywordPayload(form: KeywordFormState): KeywordPayload {
  return keywordSchema.parse({
    question: form.question,
    keywords: form.keywordsText.split(/[\n,،]/).map((s) => s.trim()).filter(Boolean),
    answer: form.answer, linkLabel: form.linkLabel, linkUrl: form.linkUrl,
    imageUrl: form.imageUrl, ctaLabel: form.ctaLabel, ctaUrl: form.ctaUrl,
  });
}

function keywordToForm(kw: KeywordAnswer): KeywordFormState {
  return {
    question: kw.question, keywordsText: kw.keywords.join('\n'),
    answer: kw.answer, linkLabel: kw.linkLabel, linkUrl: kw.linkUrl,
    imageUrl: kw.imageUrl, ctaLabel: kw.ctaLabel, ctaUrl: kw.ctaUrl,
  };
}

function fmtDate(iso: string, visits: number) {
  if (!visits || !iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('ar-SA');
}

// ── Toast ────────────────────────────────────────────────────────────────────

function useSavedToast() {
  const [msg, setMsg] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((text = 'تم الحفظ ✓') => {
    if (timer.current) clearTimeout(timer.current);
    setMsg(text);
    timer.current = setTimeout(() => setMsg(''), 3000);
  }, []);
  return { msg, show };
}

function SaveToast({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[300] flex items-center gap-2.5 rounded-2xl bg-teal-700 px-5 py-3.5 text-sm font-black text-white shadow-2xl shadow-teal-900/30 animate-in slide-in-from-bottom-4">
      <CheckCircle2 className="size-5 shrink-0" />
      {message}
    </div>
  );
}

// ── Shared form components ────────────────────────────────────────────────────

function FLabel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">{label}</span>
      {children}
    </label>
  );
}

const inputCls = 'w-full min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition placeholder:text-slate-300';
const areaCls = `${inputCls} py-2.5 leading-7`;

function FInput({ label, value, onChange, type = 'text', placeholder = '' }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <FLabel label={label}>
      <input className={inputCls} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} type={type} value={value} />
    </FLabel>
  );
}

function FTextarea({ label, value, onChange, placeholder = '', rows = 4 }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <FLabel label={label}>
      <textarea className={areaCls} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} value={value} />
    </FLabel>
  );
}

function FSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: ReactNode }) {
  return (
    <FLabel label={label}>
      <select className={inputCls} onChange={(e) => onChange(e.target.value)} value={value}>{children}</select>
    </FLabel>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────

function Section({ id, icon: Icon, title, desc, color = 'teal', children }: {
  id: string; icon: typeof Bot; title: string; desc?: string; color?: 'teal' | 'indigo' | 'amber' | 'rose' | 'slate'; children: ReactNode;
}) {
  const palette = {
    teal: 'bg-teal-600', indigo: 'bg-indigo-600', amber: 'bg-amber-500', rose: 'bg-rose-500', slate: 'bg-slate-700',
  };
  return (
    <section className="scroll-mt-6 rounded-3xl border border-slate-200 bg-white shadow-sm" id={id}>
      <div className={`flex items-center gap-4 rounded-t-3xl ${palette[color]} px-6 py-5`}>
        <div className="grid size-10 place-items-center rounded-2xl bg-white/20">
          <Icon className="size-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-black text-white">{title}</h2>
          {desc && <p className="text-xs font-bold text-white/70">{desc}</p>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

// ── Form card + editing state ─────────────────────────────────────────────

function FormCard({ editing, editingLabel = '', onCancel, children }: {
  editing: boolean; editingLabel?: string | undefined; onCancel: () => void; children: ReactNode;
}) {
  return (
    <div className={`rounded-2xl border p-5 transition ${editing ? 'border-amber-300 bg-amber-50 ring-2 ring-amber-100' : 'border-slate-100 bg-slate-50'}`}>
      {editing && (
        <div className="mb-4 flex items-center justify-between rounded-xl bg-amber-100 px-4 py-2.5">
          <span className="text-sm font-black text-amber-800">✏️ تعديل: {editingLabel}</span>
          <button className="flex items-center gap-1 text-xs font-black text-amber-700 hover:text-amber-900" onClick={onCancel} type="button">
            <X className="size-3.5" /> إلغاء التعديل
          </button>
        </div>
      )}
      {children}
    </div>
  );
}

// ── Item card ────────────────────────────────────────────────────────────────

function ItemCard({ active, title, sub, tags, onEdit, onToggle, onDelete, extraActions }: {
  active: boolean; title: string; sub?: string; tags?: string[];
  onEdit: () => void; onToggle: () => void; onDelete: () => void;
  extraActions?: ReactNode;
}) {
  return (
    <div className={`rounded-2xl border p-4 transition ${active ? 'border-slate-100 bg-white' : 'border-slate-100 bg-slate-50 opacity-60'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-black text-slate-950 leading-tight">{title}</p>
          {sub && <p className="mt-0.5 text-xs text-slate-500 leading-5">{sub}</p>}
        </div>
        <StatusPill active={active} />
      </div>
      {tags && tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-black text-teal-700" key={t}>{t}</span>
          ))}
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-200 transition"
          onClick={onEdit} type="button"
        >
          <Edit3 className="size-3.5" /> تعديل
        </button>
        <button
          className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black transition ${active ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-teal-50 text-teal-700 hover:bg-teal-100'}`}
          onClick={onToggle} type="button"
        >
          {active ? <><EyeOff className="size-3.5" /> تعطيل</> : <><Eye className="size-3.5" /> تفعيل</>}
        </button>
        <button
          className="flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 hover:bg-rose-100 transition"
          onClick={onDelete} type="button"
        >
          <Trash2 className="size-3.5" /> حذف
        </button>
        {extraActions}
      </div>
    </div>
  );
}

// ── Save button ────────────────────────────────────────────────────────────

function SaveBtn({ editing }: { editing: boolean }) {
  return (
    <button
      className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 py-3.5 text-sm font-black text-white shadow-lg shadow-teal-600/25 hover:bg-teal-700 active:scale-[0.98] transition focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
      type="submit"
    >
      {editing ? <><Save className="size-4.5" /> حفظ التعديل</> : <><Plus className="size-4.5" /> إضافة وحفظ</>}
    </button>
  );
}

// ── Metric card ────────────────────────────────────────────────────────────

function StatCard({ label, value, helper, icon: Icon, gradient }: {
  label: string; value: string; helper: string; icon: typeof Bot; gradient: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-3xl p-5 text-white ${gradient}`}>
      <div className="absolute -left-4 -top-4 size-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 -right-2 size-20 rounded-full bg-white/10" />
      <div className="relative">
        <Icon className="size-5 opacity-80" />
        <p className="mt-3 text-3xl font-black tracking-tight">{value}</p>
        <p className="mt-0.5 text-sm font-bold opacity-90">{label}</p>
        <p className="mt-1 text-xs opacity-60">{helper}</p>
      </div>
    </div>
  );
}

// ── Chart bar ─────────────────────────────────────────────────────────────

function ChartRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-slate-600">
        <span className="truncate ml-2">{label}</span>
        <span className="shrink-0 text-slate-900 font-black">{value.toLocaleString('ar-SA')}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  Main page
// ═══════════════════════════════════════════════════════════════════════════

export function AdminDashboardPage() {
  const toast = useSavedToast();

  // Store selectors
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

  // Forms
  const [kwForm, setKwForm] = useState<KeywordFormState>(emptyKeywordForm);
  const [kwEditId, setKwEditId] = useState<string | null>(null);
  const [kwErr, setKwErr] = useState('');

  const [evForm, setEvForm] = useState<EventPayload>(emptyEventForm);
  const [evEditId, setEvEditId] = useState<string | null>(null);
  const [evErr, setEvErr] = useState('');

  const [ctForm, setCtForm] = useState<ContentPayload>(emptyContentForm);
  const [ctEditId, setCtEditId] = useState<string | null>(null);
  const [ctErr, setCtErr] = useState('');

  const [pointsDelta, setPointsDelta] = useState('25');

  // Sync status — checks if the backend API is actually reachable
  const [syncStatus, setSyncStatus] = useState<'checking' | 'online' | 'local'>('checking');
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/health', { signal: controller.signal, cache: 'no-store' })
      .then((r) => setSyncStatus(r.ok ? 'online' : 'local'))
      .catch(() => setSyncStatus('local'));
    return () => controller.abort();
  }, []);

  // Scroll to URL hash section on first mount (supports deep-linking)
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    // Double rAF ensures the page has painted before scrolling
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        document.getElementById(hash)?.scrollIntoView({ block: 'start' });
      })
    );
  }, []);

  // Charts
  const topEvents = useMemo(() => [...events].sort((a, b) => b.visits - a.visits).slice(0, 5), [events]);
  const topKw = useMemo(() => [...keywordAnswers].sort((a, b) => b.usage - a.usage).slice(0, 5), [keywordAnswers]);
  const topQr = useMemo(() => [...qrScans].sort((a, b) => b.visits - a.visits).slice(0, 5), [qrScans]);
  const maxEv = Math.max(...topEvents.map((e) => e.visits), 1);
  const maxKw = Math.max(...topKw.map((k) => k.usage), 1);
  const maxQr = Math.max(...topQr.map((q) => q.visits), 1);

  // ── Submit handlers ──────────────────────────────────────────────────────

  function onKwSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const p = toKeywordPayload(kwForm);
      if (kwEditId) { updateKeywordAnswer(kwEditId, p); toast.show('تم حفظ التعديل ✓'); }
      else { addKeywordAnswer(p); toast.show('تم إضافة السؤال ✓'); }
      setKwForm(emptyKeywordForm); setKwEditId(null); setKwErr('');
    } catch (err) { setKwErr(validationMessage(err)); }
  }

  function onEvSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const p = eventSchema.parse(evForm);
      if (evEditId) { updateEvent(evEditId, p); toast.show('تم حفظ التعديل ✓'); }
      else { addEvent(p); toast.show('تم إضافة الفعالية ✓'); }
      setEvForm(emptyEventForm); setEvEditId(null); setEvErr('');
    } catch (err) { setEvErr(validationMessage(err)); }
  }

  function onCtSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const p = contentSchema.parse(ctForm);
      if (ctEditId) { updateContent(ctEditId, p); toast.show('تم حفظ التعديل ✓'); }
      else { addContent(p); toast.show('تم إضافة المادة ✓'); }
      setCtForm(emptyContentForm); setCtEditId(null); setCtErr('');
    } catch (err) { setCtErr(validationMessage(err)); }
  }

  function confirmDelete(label: string, fn: () => void) {
    if (window.confirm(`حذف "${label}"؟`)) { fn(); toast.show('تم الحذف'); }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="grid gap-6 pb-10">

      {/* ── Sync status banner ────────────────────────────── */}
      {syncStatus === 'online' && (
        <div className="flex items-center gap-3 rounded-2xl border border-teal-200 bg-teal-50 px-5 py-3.5">
          <Wifi className="size-5 shrink-0 text-teal-600" />
          <p className="text-sm font-bold text-teal-800">المزامنة عبر الأجهزة مفعّلة — التعديلات تظهر على جميع الأجهزة فوراً</p>
        </div>
      )}
      {syncStatus === 'local' && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3.5">
          <Wifi className="size-5 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-bold text-amber-800">التعديلات محلية فقط — لا تظهر على أجهزة أخرى</p>
            <p className="text-xs text-amber-600 mt-0.5">المزامنة تعمل فقط عند نشر الخادم على Render مع قاعدة بيانات</p>
          </div>
        </div>
      )}

      {/* ── Dashboard ── */}
      <section className="scroll-mt-6" id="dashboard">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard gradient="bg-gradient-to-br from-teal-500 to-teal-700" helper="إجمالي الزيارات" icon={Users} label="الزوار" value={metrics.visitors.toLocaleString('ar-SA')} />
          <StatCard gradient="bg-gradient-to-br from-indigo-500 to-indigo-700" helper="من مواقع QR" icon={QrCode} label="مسح QR" value={metrics.qrScans.toLocaleString('ar-SA')} />
          <StatCard gradient="bg-gradient-to-br from-amber-500 to-orange-600" helper="خطط المستخدمين" icon={Activity} label="الرحلات" value={metrics.journeys.toLocaleString('ar-SA')} />
          <StatCard gradient="bg-gradient-to-br from-rose-500 to-rose-700" helper="أسئلة د. مساعد" icon={Bot} label="الاستفسارات" value={metrics.inquiries.toLocaleString('ar-SA')} />
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="size-4 text-teal-600" />
              <p className="text-sm font-black text-slate-800">أكثر الفعاليات زيارة</p>
            </div>
            <div className="grid gap-3">
              {topEvents.map((e) => <ChartRow color="bg-teal-500" key={e.id} label={e.title} max={maxEv} value={e.visits} />)}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <QrCode className="size-4 text-indigo-600" />
              <p className="text-sm font-black text-slate-800">أكثر مواقع QR نشاطاً</p>
            </div>
            <div className="grid gap-3">
              {topQr.map((q) => <ChartRow color="bg-indigo-500" key={q.id} label={q.location} max={maxQr} value={q.visits} />)}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Search className="size-4 text-amber-600" />
              <p className="text-sm font-black text-slate-800">أكثر الكلمات استخداماً</p>
            </div>
            <div className="grid gap-3">
              {topKw.map((k) => <ChartRow color="bg-amber-500" key={k.id} label={k.question} max={maxKw} value={k.usage} />)}
            </div>
          </div>
        </div>
      </section>

      {/* ── Keywords ── */}
      <Section color="slate" desc="أسئلة المساعد الذكي والكلمات المفتاحية التي تحرّكها" icon={Search} id="keywords" title="الكلمات المفتاحية">
        <div className="grid gap-5 xl:grid-cols-[400px_1fr]">
          <FormCard editing={Boolean(kwEditId)} editingLabel={keywordAnswers.find((k) => k.id === kwEditId)?.question} onCancel={() => { setKwEditId(null); setKwForm(emptyKeywordForm); setKwErr(''); }}>
            <form className="grid gap-4" onSubmit={onKwSubmit}>
              <FInput label="عنوان السؤال *" onChange={(v) => setKwForm((f) => ({ ...f, question: v }))} placeholder="ما هو سؤالك؟" value={kwForm.question} />
              <FTextarea label="الكلمات المفتاحية — كل كلمة في سطر *" onChange={(v) => setKwForm((f) => ({ ...f, keywordsText: v }))} placeholder={'ماء\nترطيب\nشرب'} rows={3} value={kwForm.keywordsText} />
              <FTextarea label="الرد النصي *" onChange={(v) => setKwForm((f) => ({ ...f, answer: v }))} placeholder="اكتب الإجابة هنا..." rows={4} value={kwForm.answer} />
              <div className="grid gap-3 sm:grid-cols-2">
                <FInput label="نص الرابط" onChange={(v) => setKwForm((f) => ({ ...f, linkLabel: v }))} placeholder="للمزيد..." value={kwForm.linkLabel} />
                <FInput label="رابط" onChange={(v) => setKwForm((f) => ({ ...f, linkUrl: v }))} placeholder="https://" value={kwForm.linkUrl} />
                <FInput label="رابط صورة" onChange={(v) => setKwForm((f) => ({ ...f, imageUrl: v }))} placeholder="https://" value={kwForm.imageUrl} />
                <FInput label="نص زر الإجراء" onChange={(v) => setKwForm((f) => ({ ...f, ctaLabel: v }))} placeholder="اتصل الآن" value={kwForm.ctaLabel} />
                <FInput label="رابط زر الإجراء" onChange={(v) => setKwForm((f) => ({ ...f, ctaUrl: v }))} placeholder="https://" value={kwForm.ctaUrl} />
              </div>
              {kwErr && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{kwErr}</p>}
              <SaveBtn editing={Boolean(kwEditId)} />
            </form>
          </FormCard>

          <div className="grid gap-3 content-start">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">{keywordAnswers.length} سؤال مضاف</p>
            {keywordAnswers.map((kw) => (
              <ItemCard
                active={kw.active}
                key={kw.id}
                onDelete={() => confirmDelete(kw.question, () => deleteKeywordAnswer(kw.id))}
                onEdit={() => { setKwEditId(kw.id); setKwForm(keywordToForm(kw)); document.getElementById('keywords')?.scrollIntoView({ behavior: 'smooth' }); }}
                onToggle={() => { toggleKeywordAnswer(kw.id); toast.show(kw.active ? 'تم التعطيل' : 'تم التفعيل'); }}
                sub={kw.answer.slice(0, 80) + (kw.answer.length > 80 ? '...' : '')}
                tags={kw.keywords}
                title={kw.question}
              />
            ))}
          </div>
        </div>
      </Section>

      {/* ── Doctor Assistant ── */}
      <Section color="indigo" desc="الأسئلة والإجابات التي يعرضها الدكتور مساعد للمستخدمين" icon={Bot} id="doctor-assistant" title="إدارة الدكتور مساعد">
        <DoctorAssistantAdminSection onSaved={toast.show} />
      </Section>

      {/* ── Events ── */}
      <Section color="teal" desc="الفعاليات الصحية المرئية في صفحة الفعاليات" icon={CalendarDays} id="events" title="إدارة الفعاليات">
        <div className="grid gap-5 xl:grid-cols-[400px_1fr]">
          <FormCard editing={Boolean(evEditId)} editingLabel={events.find((e) => e.id === evEditId)?.title} onCancel={() => { setEvEditId(null); setEvForm(emptyEventForm); setEvErr(''); }}>
            <form className="grid gap-4" onSubmit={onEvSubmit}>
              <FInput label="اسم الفعالية *" onChange={(v) => setEvForm((f) => ({ ...f, title: v }))} placeholder="يوم صحة الأسرة..." value={evForm.title} />
              <FTextarea label="الوصف *" onChange={(v) => setEvForm((f) => ({ ...f, description: v }))} placeholder="وصف الفعالية..." rows={3} value={evForm.description} />
              <div className="grid gap-3 sm:grid-cols-2">
                <FInput label="الموقع" onChange={(v) => setEvForm((f) => ({ ...f, location: v }))} placeholder="مركز صحي أبها" value={evForm.location} />
                <FInput label="التاريخ" onChange={(v) => setEvForm((f) => ({ ...f, date: v }))} type="date" value={evForm.date} />
                <FInput label="الوقت" onChange={(v) => setEvForm((f) => ({ ...f, time: v }))} placeholder="05:00 م" value={evForm.time} />
                <FInput label="الفئة المستهدفة" onChange={(v) => setEvForm((f) => ({ ...f, audience: v }))} placeholder="الأسرة، الأطفال..." value={evForm.audience} />
                <FInput label="التصنيف" onChange={(v) => setEvForm((f) => ({ ...f, category: v }))} placeholder="صحة، رياضة..." value={evForm.category} />
                <FInput label="رابط الخريطة" onChange={(v) => setEvForm((f) => ({ ...f, mapUrl: v }))} placeholder="https://maps.google.com/..." value={evForm.mapUrl} />
              </div>
              {evErr && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{evErr}</p>}
              <SaveBtn editing={Boolean(evEditId)} />
            </form>
          </FormCard>

          <div className="grid gap-3 content-start">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">{events.length} فعالية</p>
            {events.map((ev) => (
              <ItemCard
                active={ev.active}
                key={ev.id}
                onDelete={() => confirmDelete(ev.title, () => deleteEvent(ev.id))}
                onEdit={() => { setEvEditId(ev.id); setEvForm(ev); document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' }); }}
                onToggle={() => { toggleEvent(ev.id); toast.show(ev.active ? 'تم التعطيل' : 'تم التفعيل'); }}
                sub={`${ev.location} · ${ev.date} · ${ev.time}`}
                title={ev.title}
              />
            ))}
          </div>
        </div>
      </Section>

      {/* ── Content ── */}
      <Section color="amber" desc="المواد التوعوية المرئية في صفحة المواد" icon={FileText} id="content" title="إدارة المحتوى التوعوي">
        <div className="grid gap-5 xl:grid-cols-[400px_1fr]">
          <FormCard editing={Boolean(ctEditId)} editingLabel={contents.find((c) => c.id === ctEditId)?.title} onCancel={() => { setCtEditId(null); setCtForm(emptyContentForm); setCtErr(''); }}>
            <form className="grid gap-4" onSubmit={onCtSubmit}>
              <FInput label="عنوان المادة *" onChange={(v) => setCtForm((f) => ({ ...f, title: v }))} placeholder="دليل الترطيب في الصيف..." value={ctForm.title} />
              <FSelect label="نوع المادة" onChange={(v) => setCtForm((f) => ({ ...f, type: v as ContentType }))} value={ctForm.type}>
                <option value="post">منشور توعوي</option>
                <option value="card">بطاقة توعوية</option>
                <option value="pdf">ملف PDF</option>
              </FSelect>
              <FTextarea label="الملخص *" onChange={(v) => setCtForm((f) => ({ ...f, summary: v }))} placeholder="ملخص المادة..." rows={3} value={ctForm.summary} />
              <div className="grid gap-3 sm:grid-cols-2">
                <FInput label="التصنيف" onChange={(v) => setCtForm((f) => ({ ...f, category: v }))} placeholder="صحة، ترطيب..." value={ctForm.category} />
                <FInput label="نص الزر" onChange={(v) => setCtForm((f) => ({ ...f, actionLabel: v }))} placeholder="عرض المادة" value={ctForm.actionLabel} />
              </div>
              <FInput label="رابط الملف أو الصفحة" onChange={(v) => setCtForm((f) => ({ ...f, fileUrl: v }))} placeholder="/downloads/..." value={ctForm.fileUrl} />
              {ctErr && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{ctErr}</p>}
              <SaveBtn editing={Boolean(ctEditId)} />
            </form>
          </FormCard>

          <div className="grid gap-3 content-start">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">{contents.length} مادة</p>
            {contents.map((ct) => (
              <ItemCard
                active={ct.active}
                key={ct.id}
                onDelete={() => confirmDelete(ct.title, () => deleteContent(ct.id))}
                onEdit={() => { setCtEditId(ct.id); setCtForm(ct); document.getElementById('content')?.scrollIntoView({ behavior: 'smooth' }); }}
                onToggle={() => { toggleContent(ct.id); toast.show(ct.active ? 'تم التعطيل' : 'تم التفعيل'); }}
                sub={`${ct.category || '—'} · ${ct.type === 'post' ? 'منشور' : ct.type === 'card' ? 'بطاقة' : 'PDF'}`}
                title={ct.title}
              />
            ))}
          </div>
        </div>
      </Section>

      {/* ── Passport ── */}
      <Section color="rose" desc="نقاط وإنجازات الجواز الصحي" icon={Ticket} id="passport" title="إدارة جواز صحة عسير">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-teal-50 to-teal-100 p-5">
            <Ticket className="size-6 text-teal-700" />
            <p className="mt-3 text-3xl font-black text-teal-900">{passport.points.toLocaleString('ar-SA')}</p>
            <p className="text-sm font-bold text-teal-700">نقاط مكتسبة</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-indigo-50 to-indigo-100 p-5">
            <QrCode className="size-6 text-indigo-700" />
            <p className="mt-3 text-3xl font-black text-indigo-900">{passport.scans.toLocaleString('ar-SA')}</p>
            <p className="text-sm font-bold text-indigo-700">عمليات مسح QR</p>
          </div>
          <form
            className="rounded-2xl border border-slate-100 bg-white p-5"
            onSubmit={(e) => { e.preventDefault(); addPassportPoints(Number(pointsDelta), 'تعديل من لوحة التحكم'); toast.show('تم تحديث النقاط ✓'); }}
          >
            <p className="mb-3 text-sm font-black text-slate-700">إضافة نقاط</p>
            <FInput label="عدد النقاط" onChange={setPointsDelta} type="number" value={pointsDelta} />
            <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 py-3 text-sm font-black text-white hover:bg-teal-700 transition" type="submit">
              <Save className="size-4" /> تطبيق
            </button>
          </form>
        </div>
        {passport.achievements.length > 0 && (
          <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-400">الإنجازات</p>
            <div className="flex flex-wrap gap-2">
              {passport.achievements.map((a) => (
                <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700" key={a}>{a}</span>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* ── Smart Entry ── */}
      <Section color="teal" desc="إعدادات شاشة الدخول الصحي الذكي" icon={AlertCircle} id="smart-entry" title="البداية الصحية الذكية">
        <SmartEntryAdminSection onSaved={toast.show} />
      </Section>

      {/* ── QR ── */}
      <Section color="indigo" desc="إحصاء مصادر QR والزيارات" icon={QrCode} id="qr" title="تقارير QR الذكية">
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="min-w-full text-right text-sm">
            <thead className="bg-slate-50">
              <tr>
                {['المصدر', 'الموقع', 'آخر Route', 'آخر Scan', 'الزيارات'].map((h) => (
                  <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wide text-slate-500" key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {qrScans.map((scan) => (
                <tr className="hover:bg-slate-50 transition" key={scan.id}>
                  <td className="px-4 py-3 font-black text-slate-950">{scan.source}</td>
                  <td className="px-4 py-3 text-slate-600">{scan.location}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{scan.visits ? scan.lastRoute : '—'}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{fmtDate(scan.scannedAt, scan.visits)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">
                      {scan.visits.toLocaleString('ar-SA')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <SaveToast message={toast.msg} />
    </div>
  );
}

import {
  Activity,
  BarChart3,
  Bot,
  CalendarDays,
  Edit3,
  Eye,
  EyeOff,
  Plus,
  QrCode,
  Save,
  Search,
  Ticket,
  Trash2,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Button } from '../../components/ui/Button';
import { MetricCard } from '../../components/ui/MetricCard';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusPill } from '../../components/ui/StatusPill';
import { DoctorAssistantAdminSection } from '../../components/admin/DoctorAssistantAdminSection';
import { SmartEntryAdminSection } from '../../components/admin/SmartEntryAdminSection';
import { useAppStore, type ContentPayload, type EventPayload, type KeywordPayload } from '../../store/appStore';
import type { ContentType, KeywordAnswer } from '../../types/domain';
import { contentSchema, eventSchema, keywordSchema, validationMessage } from '../../utils/validation';

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

function toKeywordPayload(form: KeywordFormState): KeywordPayload {
  return keywordSchema.parse({
    question: form.question,
    keywords: form.keywordsText.split(/[\n,،]/).map((item) => item.trim()).filter(Boolean),
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

function Field({
  label,
  value,
  onChange,
  type = 'text',
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  multiline?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700">
      {label}
      {multiline ? (
        <textarea
          className="min-h-28 rounded-lg border border-slate-200 px-3 py-3 text-sm leading-7 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
          onChange={(event) => onChange(event.target.value)}
          value={value}
        />
      ) : (
        <input
          className="min-h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
          onChange={(event) => onChange(event.target.value)}
          type={type}
          value={value}
        />
      )}
    </label>
  );
}

function AdminSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" id={id}>
      <h2 className="text-xl font-black text-slate-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function AdminDashboardPage() {
  const metrics = useAppStore((state) => state.metrics);
  const events = useAppStore((state) => state.events);
  const keywordAnswers = useAppStore((state) => state.keywordAnswers);
  const contents = useAppStore((state) => state.contents);
  const passport = useAppStore((state) => state.passport);
  const qrScans = useAppStore((state) => state.qrScans);
  const addKeywordAnswer = useAppStore((state) => state.addKeywordAnswer);
  const updateKeywordAnswer = useAppStore((state) => state.updateKeywordAnswer);
  const deleteKeywordAnswer = useAppStore((state) => state.deleteKeywordAnswer);
  const toggleKeywordAnswer = useAppStore((state) => state.toggleKeywordAnswer);
  const addEvent = useAppStore((state) => state.addEvent);
  const updateEvent = useAppStore((state) => state.updateEvent);
  const deleteEvent = useAppStore((state) => state.deleteEvent);
  const toggleEvent = useAppStore((state) => state.toggleEvent);
  const addContent = useAppStore((state) => state.addContent);
  const updateContent = useAppStore((state) => state.updateContent);
  const deleteContent = useAppStore((state) => state.deleteContent);
  const toggleContent = useAppStore((state) => state.toggleContent);
  const addPassportPoints = useAppStore((state) => state.addPassportPoints);
  const [keywordForm, setKeywordForm] = useState<KeywordFormState>(emptyKeywordForm);
  const [editingKeywordId, setEditingKeywordId] = useState<string | null>(null);
  const [keywordError, setKeywordError] = useState('');
  const [eventForm, setEventForm] = useState<EventPayload>(emptyEventForm);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventError, setEventError] = useState('');
  const [contentForm, setContentForm] = useState<ContentPayload>(emptyContentForm);
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [contentError, setContentError] = useState('');
  const [passportDelta, setPassportDelta] = useState('25');

  const topEvents = useMemo(() => [...events].sort((a, b) => b.visits - a.visits).slice(0, 4), [events]);
  const topKeywords = useMemo(
    () => [...keywordAnswers].sort((a, b) => b.usage - a.usage).slice(0, 4),
    [keywordAnswers]
  );
  const topQr = useMemo(() => [...qrScans].sort((a, b) => b.visits - a.visits).slice(0, 4), [qrScans]);

  function onKeywordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const payload = toKeywordPayload(keywordForm);
      if (editingKeywordId) {
        updateKeywordAnswer(editingKeywordId, payload);
      } else {
        addKeywordAnswer(payload);
      }

      setKeywordForm(emptyKeywordForm);
      setEditingKeywordId(null);
      setKeywordError('');
    } catch (error) {
      setKeywordError(validationMessage(error));
    }
  }

  function onEventSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const payload = eventSchema.parse(eventForm);
      if (editingEventId) {
        updateEvent(editingEventId, payload);
      } else {
        addEvent(payload);
      }

      setEventForm(emptyEventForm);
      setEditingEventId(null);
      setEventError('');
    } catch (error) {
      setEventError(validationMessage(error));
    }
  }

  function onContentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const payload = contentSchema.parse(contentForm);
      if (editingContentId) {
        updateContent(editingContentId, payload);
      } else {
        addContent(payload);
      }

      setContentForm(emptyContentForm);
      setEditingContentId(null);
      setContentError('');
    } catch (error) {
      setContentError(validationMessage(error));
    }
  }

  return (
    <div className="grid gap-4">
      <PageHeader
        description="بوابة مستقلة للإدارة لا تظهر ضمن تنقل المستخدم، وتتحكم في المحتوى والردود والفعاليات والتقارير."
        eyebrow="ADMIN PORTAL"
        title="مركز إدارة صيف وصحة"
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" id="dashboard">
        <MetricCard helper="إجمالي الزيارات المسجلة عبر الويب وQR" icon={<Users className="size-5" />} label="عدد الزوار" value={metrics.visitors.toLocaleString('ar-SA')} />
        <MetricCard helper="مصادر QR-Airport وQR-Walkway وغيرها" icon={<QrCode className="size-5" />} label="QR Scans" value={metrics.qrScans.toLocaleString('ar-SA')} />
        <MetricCard helper="خطط يوم أنشأها المستخدمون" icon={<Activity className="size-5" />} label="الرحلات" value={metrics.journeys.toLocaleString('ar-SA')} />
        <MetricCard helper="استفسارات الدكتور مساعد" icon={<Bot className="size-5" />} label="الاستفسارات" value={metrics.inquiries.toLocaleString('ar-SA')} />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {[{ title: 'أكثر الفعاليات زيارة', rows: topEvents.map((item) => [item.title, item.visits] as const), icon: CalendarDays }, { title: 'أكثر المواقع زيارة', rows: topQr.map((item) => [item.location, item.visits] as const), icon: BarChart3 }, { title: 'أكثر الكلمات استخداماً', rows: topKeywords.map((item) => [item.question, item.usage] as const), icon: Search }].map((block) => (
          <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" key={block.title}>
            <h2 className="flex items-center gap-2 font-black text-slate-950">
              <block.icon className="size-5 text-teal-700" />
              {block.title}
            </h2>
            <div className="mt-4 grid gap-3">
              {block.rows.map(([label, value]) => (
                <div key={label}>
                  <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>{label}</span>
                    <span>{value.toLocaleString('ar-SA')}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <span className="block h-full rounded-full bg-teal-600" style={{ width: `${Math.min(100, value / 25)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <AdminSection id="keywords" title="إدارة الأسئلة والكلمات المفتاحية">
        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <form className="grid gap-3 rounded-lg bg-slate-50 p-3" onSubmit={onKeywordSubmit}>
            <Field label="عنوان السؤال" onChange={(value) => setKeywordForm((form) => ({ ...form, question: value }))} value={keywordForm.question} />
            <Field label="الكلمات المفتاحية - كل كلمة في سطر" multiline onChange={(value) => setKeywordForm((form) => ({ ...form, keywordsText: value }))} value={keywordForm.keywordsText} />
            <Field label="الرد النصي" multiline onChange={(value) => setKeywordForm((form) => ({ ...form, answer: value }))} value={keywordForm.answer} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="اسم الرابط" onChange={(value) => setKeywordForm((form) => ({ ...form, linkLabel: value }))} value={keywordForm.linkLabel} />
              <Field label="رابط داخلي أو خارجي" onChange={(value) => setKeywordForm((form) => ({ ...form, linkUrl: value }))} value={keywordForm.linkUrl} />
              <Field label="رابط صورة" onChange={(value) => setKeywordForm((form) => ({ ...form, imageUrl: value }))} value={keywordForm.imageUrl} />
              <Field label="زر خارجي" onChange={(value) => setKeywordForm((form) => ({ ...form, ctaLabel: value }))} value={keywordForm.ctaLabel} />
              <Field label="رابط الزر" onChange={(value) => setKeywordForm((form) => ({ ...form, ctaUrl: value }))} value={keywordForm.ctaUrl} />
            </div>
            {keywordError ? <p className="rounded-lg bg-rose-50 p-3 text-sm font-bold text-rose-700">{keywordError}</p> : null}
            <Button icon={editingKeywordId ? <Save className="size-4" /> : <Plus className="size-4" />} type="submit">
              {editingKeywordId ? 'حفظ التعديل' : 'إضافة سؤال'}
            </Button>
          </form>
          <div className="grid gap-3">
            {keywordAnswers.map((answer) => (
              <article className="rounded-lg border border-slate-200 p-3" key={answer.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-slate-950">{answer.question}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{answer.answer}</p>
                  </div>
                  <StatusPill active={answer.active} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {answer.keywords.map((keyword) => (
                    <span className="rounded-full bg-teal-50 px-2 py-1 text-xs font-bold text-teal-700" key={keyword}>
                      {keyword}
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button icon={<Edit3 className="size-4" />} onClick={() => { setEditingKeywordId(answer.id); setKeywordForm(keywordToForm(answer)); }} variant="secondary">
                    تعديل
                  </Button>
                  <Button icon={answer.active ? <EyeOff className="size-4" /> : <Eye className="size-4" />} onClick={() => toggleKeywordAnswer(answer.id)} variant="secondary">
                    {answer.active ? 'تعطيل' : 'تفعيل'}
                  </Button>
                  <Button icon={<Trash2 className="size-4" />} onClick={() => deleteKeywordAnswer(answer.id)} variant="danger">
                    حذف
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </AdminSection>

      <DoctorAssistantAdminSection />

      <AdminSection id="events" title="إدارة الفعاليات">
        <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
          <form className="grid gap-3 rounded-lg bg-slate-50 p-3" onSubmit={onEventSubmit}>
            <Field label="اسم الفعالية" onChange={(value) => setEventForm((form) => ({ ...form, title: value }))} value={eventForm.title} />
            <Field label="الوصف" multiline onChange={(value) => setEventForm((form) => ({ ...form, description: value }))} value={eventForm.description} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="الموقع" onChange={(value) => setEventForm((form) => ({ ...form, location: value }))} value={eventForm.location} />
              <Field label="التاريخ" onChange={(value) => setEventForm((form) => ({ ...form, date: value }))} type="date" value={eventForm.date} />
              <Field label="الوقت" onChange={(value) => setEventForm((form) => ({ ...form, time: value }))} value={eventForm.time} />
              <Field label="الفئة المستهدفة" onChange={(value) => setEventForm((form) => ({ ...form, audience: value }))} value={eventForm.audience} />
              <Field label="التصنيف" onChange={(value) => setEventForm((form) => ({ ...form, category: value }))} value={eventForm.category} />
              <Field label="رابط الخريطة" onChange={(value) => setEventForm((form) => ({ ...form, mapUrl: value }))} value={eventForm.mapUrl} />
            </div>
            {eventError ? <p className="rounded-lg bg-rose-50 p-3 text-sm font-bold text-rose-700">{eventError}</p> : null}
            <Button icon={editingEventId ? <Save className="size-4" /> : <Plus className="size-4" />} type="submit">
              {editingEventId ? 'حفظ الفعالية' : 'إضافة فعالية'}
            </Button>
          </form>
          <div className="grid gap-3">
            {events.map((event) => (
              <article className="rounded-lg border border-slate-200 p-3" key={event.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-slate-950">{event.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{event.location} - {event.date} - {event.time}</p>
                  </div>
                  <StatusPill active={event.active} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button icon={<Edit3 className="size-4" />} onClick={() => { setEditingEventId(event.id); setEventForm(event); }} variant="secondary">
                    تعديل
                  </Button>
                  <Button icon={event.active ? <EyeOff className="size-4" /> : <Eye className="size-4" />} onClick={() => toggleEvent(event.id)} variant="secondary">
                    {event.active ? 'تعطيل' : 'تفعيل'}
                  </Button>
                  <Button icon={<Trash2 className="size-4" />} onClick={() => deleteEvent(event.id)} variant="danger">
                    حذف
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </AdminSection>

      <AdminSection id="content" title="إدارة المحتوى التوعوي">
        <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
          <form className="grid gap-3 rounded-lg bg-slate-50 p-3" onSubmit={onContentSubmit}>
            <Field label="عنوان المادة" onChange={(value) => setContentForm((form) => ({ ...form, title: value }))} value={contentForm.title} />
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              النوع
              <select
                className="min-h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                onChange={(event) => setContentForm((form) => ({ ...form, type: event.target.value as ContentType }))}
                value={contentForm.type}
              >
                <option value="post">منشور</option>
                <option value="card">بطاقة توعوية</option>
                <option value="pdf">PDF</option>
              </select>
            </label>
            <Field label="الملخص" multiline onChange={(value) => setContentForm((form) => ({ ...form, summary: value }))} value={contentForm.summary} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="التصنيف" onChange={(value) => setContentForm((form) => ({ ...form, category: value }))} value={contentForm.category} />
              <Field label="اسم الزر" onChange={(value) => setContentForm((form) => ({ ...form, actionLabel: value }))} value={contentForm.actionLabel} />
              <Field label="رابط الملف" onChange={(value) => setContentForm((form) => ({ ...form, fileUrl: value }))} value={contentForm.fileUrl} />
            </div>
            {contentError ? <p className="rounded-lg bg-rose-50 p-3 text-sm font-bold text-rose-700">{contentError}</p> : null}
            <Button icon={editingContentId ? <Save className="size-4" /> : <Plus className="size-4" />} type="submit">
              {editingContentId ? 'حفظ المادة' : 'إضافة مادة'}
            </Button>
          </form>
          <div className="grid gap-3">
            {contents.map((content) => (
              <article className="rounded-lg border border-slate-200 p-3" key={content.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-slate-950">{content.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{content.category} - {content.type}</p>
                  </div>
                  <StatusPill active={content.active} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button icon={<Edit3 className="size-4" />} onClick={() => { setEditingContentId(content.id); setContentForm(content); }} variant="secondary">
                    تعديل
                  </Button>
                  <Button icon={content.active ? <EyeOff className="size-4" /> : <Eye className="size-4" />} onClick={() => toggleContent(content.id)} variant="secondary">
                    {content.active ? 'تعطيل' : 'تفعيل'}
                  </Button>
                  <Button icon={<Trash2 className="size-4" />} onClick={() => deleteContent(content.id)} variant="danger">
                    حذف
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </AdminSection>

      <AdminSection id="passport" title="إدارة جواز صحة عسير">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-lg bg-slate-50 p-4">
            <Ticket className="size-6 text-teal-700" />
            <p className="mt-3 text-3xl font-black text-slate-950">{passport.points.toLocaleString('ar-SA')}</p>
            <p className="text-sm font-bold text-slate-500">نقاط المستخدم التجريبية</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <QrCode className="size-6 text-teal-700" />
            <p className="mt-3 text-3xl font-black text-slate-950">{passport.scans.toLocaleString('ar-SA')}</p>
            <p className="text-sm font-bold text-slate-500">عمليات Scan في الجواز</p>
          </div>
          <form className="rounded-lg bg-slate-50 p-4" onSubmit={(event) => { event.preventDefault(); addPassportPoints(Number(passportDelta), 'تعديل نقاط من لوحة التحكم'); }}>
            <Field label="تعديل النقاط" onChange={setPassportDelta} type="number" value={passportDelta} />
            <Button className="mt-3 w-full" icon={<Save className="size-4" />} type="submit">
              تطبيق التعديل
            </Button>
          </form>
        </div>
      </AdminSection>

      <SmartEntryAdminSection />

      <AdminSection id="qr" title="تقارير QR الذكية">
        <div className="overflow-x-auto">
          <table className="min-w-full text-right text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-3 py-3 font-black">المعرف</th>
                <th className="px-3 py-3 font-black">الموقع</th>
                <th className="px-3 py-3 font-black">Route</th>
                <th className="px-3 py-3 font-black">آخر Scan</th>
                <th className="px-3 py-3 font-black">الزيارات</th>
              </tr>
            </thead>
            <tbody>
              {qrScans.map((scan) => (
                <tr className="border-b border-slate-100" key={scan.id}>
                  <td className="px-3 py-3 font-bold text-slate-950">{scan.source}</td>
                  <td className="px-3 py-3 text-slate-600">{scan.location}</td>
                  <td className="px-3 py-3 text-slate-600">{scan.lastRoute ?? '-'}</td>
                  <td className="px-3 py-3 text-slate-600">{new Date(scan.scannedAt).toLocaleString('ar-SA')}</td>
                  <td className="px-3 py-3 font-black text-teal-700">{scan.visits.toLocaleString('ar-SA')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminSection>
    </div>
  );
}

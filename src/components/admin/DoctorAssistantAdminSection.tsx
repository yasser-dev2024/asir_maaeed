import { ArrowDown, ArrowUp, Edit3, Eye, EyeOff, Plus, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/Button';
import { StatusPill } from '../ui/StatusPill';
import { useAppStore } from '../../store/appStore';
import type { DoctorAssistantQuestion } from '../../types/domain';

interface DoctorAssistantForm {
  question: string;
  answer: string;
  keywordsText: string;
  active: boolean;
  order: string;
}

const emptyForm: DoctorAssistantForm = {
  question: '',
  answer: '',
  keywordsText: '',
  active: true,
  order: '10',
};

function toForm(question: DoctorAssistantQuestion): DoctorAssistantForm {
  return {
    question: question.question,
    answer: question.answer,
    keywordsText: question.keywords.join('\n'),
    active: question.active,
    order: String(question.order),
  };
}

function toPayload(form: DoctorAssistantForm) {
  return {
    question: form.question,
    answer: form.answer,
    keywords: form.keywordsText.split(/[\n,،]/).map((item) => item.trim()).filter(Boolean),
    active: form.active,
    order: Number(form.order) || 999,
  };
}

function fieldClass() {
  return 'min-h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100';
}

export function DoctorAssistantAdminSection() {
  const questions = useAppStore((state) => state.doctorAssistantQuestions);
  const addQuestion = useAppStore((state) => state.addDoctorAssistantQuestion);
  const updateQuestion = useAppStore((state) => state.updateDoctorAssistantQuestion);
  const deleteQuestion = useAppStore((state) => state.deleteDoctorAssistantQuestion);
  const toggleQuestion = useAppStore((state) => state.toggleDoctorAssistantQuestion);
  const moveQuestion = useAppStore((state) => state.moveDoctorAssistantQuestion);
  const [form, setForm] = useState<DoctorAssistantForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);

  function submit() {
    if (form.question.trim().length < 3 || form.answer.trim().length < 6) {
      setError('أضف سؤالًا وإجابة واضحة قبل الحفظ.');
      return;
    }

    if (editingId) {
      updateQuestion(editingId, toPayload(form));
    } else {
      addQuestion(toPayload(form));
    }

    setForm(emptyForm);
    setEditingId(null);
    setError('');
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" id="doctor-assistant">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-950">إدارة الدكتور مساعد</h2>
          <p className="mt-1 text-sm font-bold leading-6 text-slate-500">
            الأسئلة والإجابات الثابتة التي تظهر للمستخدم في شاشة الدكتور مساعد.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
        <form className="grid gap-3 rounded-lg bg-slate-50 p-3" onSubmit={(event) => { event.preventDefault(); submit(); }}>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            السؤال
            <input className={fieldClass()} onChange={(event) => setForm((current) => ({ ...current, question: event.target.value }))} value={form.question} />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            الإجابة
            <textarea
              className="min-h-32 rounded-lg border border-slate-200 px-3 py-3 text-sm leading-7 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              onChange={(event) => setForm((current) => ({ ...current, answer: event.target.value }))}
              value={form.answer}
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            الكلمات المفتاحية - كل كلمة في سطر
            <textarea
              className="min-h-24 rounded-lg border border-slate-200 px-3 py-3 text-sm leading-7 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              onChange={(event) => setForm((current) => ({ ...current, keywordsText: event.target.value }))}
              value={form.keywordsText}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              الترتيب
              <input className={fieldClass()} onChange={(event) => setForm((current) => ({ ...current, order: event.target.value }))} type="number" value={form.order} />
            </label>
            <label className="flex items-center gap-2 pt-7 text-sm font-black text-slate-700">
              <input checked={form.active} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))} type="checkbox" />
              تفعيل السؤال
            </label>
          </div>
          {error ? <p className="rounded-lg bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p> : null}
          <div className="grid gap-2 sm:grid-cols-2">
            <Button icon={editingId ? <Save className="size-4" /> : <Plus className="size-4" />} type="submit">
              {editingId ? 'حفظ التعديل' : 'إضافة سؤال'}
            </Button>
            <Button
              onClick={() => {
                setForm(emptyForm);
                setEditingId(null);
                setError('');
              }}
              variant="secondary"
            >
              تفريغ
            </Button>
          </div>
        </form>

        <div className="grid gap-3">
          {sortedQuestions.map((question) => (
            <article className="rounded-lg border border-slate-200 p-3" key={question.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-black text-slate-950">{question.question}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{question.answer}</p>
                </div>
                <StatusPill active={question.active} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {question.keywords.map((keyword) => (
                  <span className="rounded-full bg-teal-50 px-2 py-1 text-xs font-bold text-teal-700" key={keyword}>
                    {keyword}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button icon={<ArrowUp className="size-4" />} onClick={() => moveQuestion(question.id, 'up')} variant="secondary">
                  أعلى
                </Button>
                <Button icon={<ArrowDown className="size-4" />} onClick={() => moveQuestion(question.id, 'down')} variant="secondary">
                  أسفل
                </Button>
                <Button icon={<Edit3 className="size-4" />} onClick={() => { setEditingId(question.id); setForm(toForm(question)); }} variant="secondary">
                  تعديل
                </Button>
                <Button icon={question.active ? <EyeOff className="size-4" /> : <Eye className="size-4" />} onClick={() => toggleQuestion(question.id)} variant="secondary">
                  {question.active ? 'تعطيل' : 'تفعيل'}
                </Button>
                <Button icon={<Trash2 className="size-4" />} onClick={() => deleteQuestion(question.id)} variant="danger">
                  حذف
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

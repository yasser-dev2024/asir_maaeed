import { ArrowDown, ArrowUp, Edit3, Eye, EyeOff, Plus, Save, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/Button';
import { StatusPill } from '../ui/StatusPill';
import { useAppStore } from '../../store/appStore';
import type { DoctorAssistantQuestion } from '../../types/domain';
import { doctorAssistantSchema, validationMessage } from '../../utils/validation';

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

function toForm(q: DoctorAssistantQuestion): DoctorAssistantForm {
  return {
    question: q.question,
    answer: q.answer,
    keywordsText: q.keywords.join('\n'),
    active: q.active,
    order: String(q.order),
  };
}

function toPayload(form: DoctorAssistantForm) {
  return {
    question: form.question,
    answer: form.answer,
    keywords: form.keywordsText
      .split(/[\n,،]/)
      .map((item) => item.trim())
      .filter(Boolean),
    active: form.active,
    order: Number(form.order) || 999,
  };
}

const inputCls =
  'min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition';

const textareaCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm leading-7 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition';

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-xs font-black uppercase tracking-wide text-slate-500">
      {label}
      {children}
    </label>
  );
}

export function DoctorAssistantAdminSection({ onSaved }: { onSaved?: (msg: string) => void }) {
  const questions = useAppStore((s) => s.doctorAssistantQuestions);
  const addQuestion = useAppStore((s) => s.addDoctorAssistantQuestion);
  const updateQuestion = useAppStore((s) => s.updateDoctorAssistantQuestion);
  const deleteQuestion = useAppStore((s) => s.deleteDoctorAssistantQuestion);
  const toggleQuestion = useAppStore((s) => s.toggleDoctorAssistantQuestion);
  const moveQuestion = useAppStore((s) => s.moveDoctorAssistantQuestion);

  const [form, setForm] = useState<DoctorAssistantForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);

  function cancelEdit() {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
  }

  function submit() {
    const result = doctorAssistantSchema.safeParse(toPayload(form));
    if (!result.success) {
      setError(validationMessage(result.error));
      return;
    }

    if (editingId) {
      updateQuestion(editingId, result.data);
      onSaved?.('تم تعديل السؤال بنجاح ✓');
    } else {
      addQuestion(result.data);
      onSaved?.('تم إضافة السؤال بنجاح ✓');
    }

    cancelEdit();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      {/* ── Form ── */}
      <div className="h-fit">
        <div
          className={`rounded-2xl border bg-white p-5 shadow-sm transition ${
            editingId ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200'
          }`}
        >
          {/* Editing banner */}
          {editingId && (
            <div className="mb-4 flex items-center justify-between rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-black text-amber-700">
              <span>✏️ وضع التعديل</span>
              <button className="flex items-center gap-1 text-amber-600 hover:text-amber-800" onClick={cancelEdit} type="button">
                <X className="size-4" />
                إلغاء
              </button>
            </div>
          )}

          <p className="mb-4 text-lg font-black text-slate-950">
            {editingId ? 'تعديل سؤال د. مساعد' : 'إضافة سؤال جديد'}
          </p>

          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <FieldLabel label="السؤال *">
              <input
                className={inputCls}
                onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
                placeholder="ما هو سؤال المريض؟"
                value={form.question}
              />
            </FieldLabel>

            <FieldLabel label="الإجابة *">
              <textarea
                className={`${textareaCls} min-h-32`}
                onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
                placeholder="اكتب الإجابة الطبية بوضوح..."
                value={form.answer}
              />
            </FieldLabel>

            <FieldLabel label="الكلمات المفتاحية — كل كلمة في سطر">
              <textarea
                className={`${textareaCls} min-h-24`}
                onChange={(e) => setForm((f) => ({ ...f, keywordsText: e.target.value }))}
                placeholder="ألم&#10;صداع&#10;دوخة"
                value={form.keywordsText}
              />
            </FieldLabel>

            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <FieldLabel label="الترتيب">
                <input
                  className={inputCls}
                  min={1}
                  onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
                  type="number"
                  value={form.order}
                />
              </FieldLabel>

              <label className="flex cursor-pointer items-center gap-2 pt-6 text-sm font-black text-slate-700 select-none">
                <input
                  checked={form.active}
                  className="size-4 accent-teal-600"
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                  type="checkbox"
                />
                تفعيل
              </label>
            </div>

            {error && (
              <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p>
            )}

            <div className="grid gap-2 sm:grid-cols-2">
              <Button className="w-full" icon={editingId ? <Save className="size-4" /> : <Plus className="size-4" />} type="submit">
                {editingId ? 'حفظ التعديل' : 'إضافة السؤال'}
              </Button>
              <Button
                className="w-full"
                onClick={cancelEdit}
                type="button"
                variant="secondary"
              >
                تفريغ
              </Button>
            </div>
          </form>
        </div>

        {/* Stats */}
        <div className="mt-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-center shadow-sm">
          <p className="text-2xl font-black text-teal-700">{questions.length}</p>
          <p className="text-xs font-bold text-slate-500">سؤال مضاف · {sortedQuestions.filter((q) => q.active).length} مفعّل</p>
        </div>
      </div>

      {/* ── List ── */}
      <div className="grid gap-3 content-start">
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">
          {sortedQuestions.length} سؤال — مرتبة حسب الترتيب
        </p>

        {sortedQuestions.map((question, idx) => (
          <article
            className={`rounded-xl border p-4 transition ${
              editingId === question.id
                ? 'border-amber-300 bg-amber-50'
                : 'border-slate-100 bg-slate-50 hover:border-slate-200'
            }`}
            key={question.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-block rounded-lg bg-teal-100 px-2 py-0.5 text-xs font-black text-teal-700">
                    #{idx + 1}
                  </span>
                  <h3 className="font-black text-slate-950">{question.question}</h3>
                </div>
                <p className="mt-1.5 line-clamp-3 text-sm leading-6 text-slate-600">{question.answer}</p>
              </div>
              <StatusPill active={question.active} />
            </div>

            {question.keywords.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {question.keywords.map((kw) => (
                  <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700" key={kw}>
                    {kw}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                icon={<ArrowUp className="size-3.5" />}
                onClick={() => { moveQuestion(question.id, 'up'); onSaved?.('تم تغيير الترتيب'); }}
                variant="secondary"
              >
                أعلى
              </Button>
              <Button
                icon={<ArrowDown className="size-3.5" />}
                onClick={() => { moveQuestion(question.id, 'down'); onSaved?.('تم تغيير الترتيب'); }}
                variant="secondary"
              >
                أسفل
              </Button>
              <Button
                icon={<Edit3 className="size-3.5" />}
                onClick={() => {
                  setEditingId(question.id);
                  setForm(toForm(question));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                variant="secondary"
              >
                تعديل
              </Button>
              <Button
                icon={question.active ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                onClick={() => { toggleQuestion(question.id); onSaved?.(question.active ? 'تم التعطيل' : 'تم التفعيل'); }}
                variant="secondary"
              >
                {question.active ? 'تعطيل' : 'تفعيل'}
              </Button>
              <Button
                icon={<Trash2 className="size-3.5" />}
                onClick={() => {
                  if (confirm('هل تريد حذف هذا السؤال؟')) {
                    deleteQuestion(question.id);
                    onSaved?.('تم الحذف');
                  }
                }}
                variant="danger"
              >
                حذف
              </Button>
            </div>
          </article>
        ))}

        {sortedQuestions.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-400">
            <p className="text-sm font-bold">لا توجد أسئلة بعد — أضف أول سؤال من النموذج</p>
          </div>
        )}
      </div>
    </div>
  );
}

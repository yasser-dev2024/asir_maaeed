import { Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import doctorImage from '../assets/doctor.png';
import { useAppStore } from '../store/appStore';

export function AssistantPage() {
  const navigate = useNavigate();
  const questions = useAppStore((state) => state.doctorAssistantQuestions);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const cleanedSearch = search.trim().toLowerCase();
  const filteredQuestions = useMemo(() => {
    return questions
      .filter((question) => question.active)
      .sort((a, b) => a.order - b.order)
      .filter((question) => {
        if (!cleanedSearch) {
          return true;
        }

        return (
          question.question.toLowerCase().includes(cleanedSearch) ||
          question.keywords.some((keyword) => keyword.toLowerCase().includes(cleanedSearch))
        );
      });
  }, [cleanedSearch, questions]);
  return (
    <div className="fixed inset-0 z-30 flex h-dvh flex-col overflow-hidden bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white px-4 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <span className="grid size-16 shrink-0 place-items-end overflow-hidden rounded-full bg-teal-50 ring-2 ring-teal-100">
            <img alt="الدكتور مساعد" className="h-20 w-16 object-cover object-top" src={doctorImage} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-black text-slate-950">الدكتور مساعد</h1>
            <p className="mt-1 text-sm font-bold text-teal-700">مساعدك الصحي الذكي</p>
          </div>
          <button
            aria-label="إغلاق"
            className="grid size-11 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600 transition hover:bg-slate-200"
            onClick={() => navigate(-1)}
            type="button"
          >
            <X className="size-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col px-4 py-4">
        <label className="relative block">
          <Search className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
          <input
            className="min-h-14 w-full rounded-lg border border-slate-200 bg-white pr-12 pl-4 text-base font-bold outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            onChange={(event) => {
              setSearch(event.target.value);
              setSelectedId(null);
            }}
            placeholder="ابحث في الأسئلة"
            value={search}
          />
        </label>

        <section className="mt-4 min-h-0 flex-1 overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+5.5rem)]">
          {filteredQuestions.length ? (
            <div className="grid gap-3">
              {filteredQuestions.map((question) => {
                const selected = selectedId === question.id;

                return (
                  <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" key={question.id}>
                    <button
                      className={`flex min-h-16 w-full items-center justify-between gap-3 px-4 py-3 text-right text-base font-black transition ${
                        selected ? 'bg-teal-700 text-white' : 'bg-white text-slate-950 hover:bg-teal-50'
                      }`}
                      onClick={() => setSelectedId(selected ? null : question.id)}
                      type="button"
                    >
                      <span>{question.question}</span>
                    </button>
                    {selected ? (
                      <div className="border-t border-teal-100 bg-teal-50 p-4">
                        <p className="text-base font-bold leading-8 text-slate-700">{question.answer}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {question.keywords.map((keyword) => (
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-teal-700 ring-1 ring-teal-100" key={keyword}>
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="grid min-h-64 place-items-center rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center">
              <p className="text-lg font-black text-slate-600">لم أجد إجابة مناسبة، يمكنك تجربة سؤال آخر.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

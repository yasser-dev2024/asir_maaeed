import { BookOpen, Download, FileText, Layers } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { useAppStore } from '../store/appStore';
import type { ContentType } from '../types/domain';

const icons: Record<ContentType, typeof FileText> = {
  post: BookOpen,
  card: Layers,
  pdf: FileText,
};

export function DownloadsPage() {
  const contents = useAppStore((state) => state.contents.filter((content) => content.active));

  return (
    <div className="py-4">
      <PageHeader
        description="مواد توعوية قابلة للإدارة من لوحة التحكم: منشورات، بطاقات، وملفات PDF للحملة."
        eyebrow="المواد الصحية"
        title="مكتبة صيف وصحة"
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {contents.map((content) => {
          const Icon = icons[content.type];

          return (
            <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" key={content.id}>
              <div className="flex items-center justify-between gap-3">
                <span className="grid size-12 place-items-center rounded-lg bg-teal-50 text-teal-700">
                  <Icon className="size-5" />
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  {content.category}
                </span>
              </div>
              <h2 className="mt-4 text-lg font-black text-slate-950">{content.title}</h2>
              <p className="mt-2 min-h-20 text-sm leading-7 text-slate-600">{content.summary}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-xs font-bold text-slate-500">تحديث {content.updatedAt}</p>
                <a href={content.fileUrl} rel="noreferrer" target="_blank">
                  <Button icon={<Download className="size-4" />} variant="secondary">
                    {content.actionLabel}
                  </Button>
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

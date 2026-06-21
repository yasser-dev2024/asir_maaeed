import { z } from 'zod';

export const keywordSchema = z.object({
  question: z.string().trim().min(3, 'اكتب عنواناً واضحاً للسؤال.').max(90),
  keywords: z.array(z.string().trim().min(2)).min(1, 'أضف كلمة مفتاحية واحدة على الأقل.'),
  answer: z.string().trim().min(12, 'الإجابة قصيرة جداً.').max(700),
  linkLabel: z.string().trim().max(40).default(''),
  linkUrl: z.string().trim().max(250).default(''),
  imageUrl: z.string().trim().max(250).default(''),
  ctaLabel: z.string().trim().max(40).default(''),
  ctaUrl: z.string().trim().max(250).default(''),
});

export const eventSchema = z.object({
  title: z.string().trim().min(3, 'اكتب اسم الفعالية.').max(90),
  description: z.string().trim().min(12, 'اكتب وصفاً مناسباً للفعالية.').max(400),
  location: z.string().trim().min(3, 'حدد الموقع.').max(90),
  date: z.string().trim().min(8, 'حدد التاريخ.'),
  time: z.string().trim().min(3, 'حدد الوقت.').max(20),
  audience: z.string().trim().min(3, 'حدد الفئة المستهدفة.').max(70),
  category: z.string().trim().min(3, 'حدد الفئة.').max(50),
  mapUrl: z.string().trim().min(1, 'أضف رابط الخريطة.').max(250),
});

export const contentSchema = z.object({
  title: z.string().trim().min(3, 'اكتب عنوان المادة.').max(90),
  type: z.enum(['post', 'card', 'pdf']),
  summary: z.string().trim().min(12, 'اكتب ملخصاً مناسباً.').max(420),
  category: z.string().trim().min(3, 'حدد التصنيف.').max(50),
  actionLabel: z.string().trim().min(3, 'اكتب اسم الزر.').max(40),
  fileUrl: z.string().trim().min(1, 'أضف رابط المادة.').max(250),
});

export function validationMessage(error: unknown): string {
  if (error instanceof z.ZodError) {
    return error.issues.map((issue) => issue.message).join(' ');
  }

  return 'تعذر حفظ البيانات. راجع المدخلات وحاول مرة أخرى.';
}

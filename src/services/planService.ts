import { defaultTips, healthCenters, walkways } from '../data/mockData';
import type { DailyPlan, HealthCenter, HealthEvent, JourneyAnswers, Walkway } from '../types/domain';

const defaultEvent: HealthEvent = {
  id: 'event-default',
  title: 'مسار صحي قريب',
  description: 'تجربة مشي خفيفة مع نصائح ترطيب وسلامة مناسبة للزائر.',
  location: 'أبها',
  date: '2026-07-01',
  time: '07:00 ص',
  audience: 'جميع الزوار',
  category: 'نشاط بدني',
  mapUrl: 'https://maps.google.com/?q=Abha',
  visits: 0,
  active: true,
  tone: 'green',
};

const defaultWalkway: Walkway = {
  id: 'walk-default',
  name: 'ممشى صحي قريب',
  distance: 'قريب منك',
  length: 'مسار قصير',
  shade: 'مناسب للمشي الخفيف',
  mapUrl: 'https://maps.google.com/?q=Abha+Walkway',
};

const defaultHealthCenter: HealthCenter = {
  id: 'center-default',
  name: 'مركز صحي قريب',
  distance: 'قريب منك',
  availability: 'متاح عبر 937',
  phone: '937',
  mapUrl: 'https://maps.google.com/?q=Abha+Health+Center',
};

function olderAdult(answers: JourneyAnswers | null) {
  return answers?.ageGroup === '50-plus' || answers?.ageGroup === '60-plus';
}

function pickEvent(answers: JourneyAnswers | null, activeEvents: HealthEvent[], fallbackEvent: HealthEvent) {
  if (!answers) {
    return activeEvents.find((event) => event.category === 'نشاط بدني') ?? activeEvents[0] ?? fallbackEvent;
  }

  if (answers.visitPurpose === 'urgent') {
    return activeEvents.find((event) => event.category.includes('توعية')) ?? activeEvents[0] ?? fallbackEvent;
  }

  if (answers.visitPurpose === 'family' || answers.withFamily || answers.companion === 'kids') {
    return (
      activeEvents.find((event) => event.audience.includes('الأطفال') || event.category.includes('عائلة')) ??
      activeEvents[0] ??
      fallbackEvent
    );
  }

  if (answers.visitPurpose === 'relax' || answers.companion === 'elderly' || olderAdult(answers)) {
    return activeEvents.find((event) => event.category.includes('توعية')) ?? activeEvents[0] ?? fallbackEvent;
  }

  return (
    activeEvents.find((event) => event.category.includes('نشاط') || event.category.includes('عائلة')) ??
    activeEvents[0] ??
    fallbackEvent
  );
}

function pickWalkway(answers: JourneyAnswers | null, fallbackWalkway: Walkway) {
  if (answers?.currentLocation === 'soudah') {
    return walkways[2] ?? fallbackWalkway;
  }

  if (answers?.visitPurpose === 'relax' || olderAdult(answers) || answers?.duration === 'one-hour') {
    return walkways[1] ?? fallbackWalkway;
  }

  return walkways[0] ?? fallbackWalkway;
}

function pickHealthCenter(answers: JourneyAnswers | null, fallbackHealthCenter: HealthCenter) {
  if (answers?.currentLocation === 'soudah') {
    return healthCenters[1] ?? fallbackHealthCenter;
  }

  if (olderAdult(answers) || answers?.visitPurpose === 'urgent' || answers?.companion === 'elderly') {
    return healthCenters[2] ?? fallbackHealthCenter;
  }

  return healthCenters[0] ?? fallbackHealthCenter;
}

function pickTips(answers: JourneyAnswers | null) {
  if (answers?.visitPurpose === 'urgent') {
    return [
      'إذا كانت الأعراض خطيرة فاتصل فوراً على 997 أو 937 قبل أي نشاط.',
      'شارك موقعك مع مرافقك أو مع الفريق المسؤول عند الحاجة.',
      'توجه لأقرب مركز صحي ولا تنتظر اكتمال الخطة عند وجود ألم صدر أو إغماء.',
    ];
  }

  if (olderAdult(answers)) {
    return [
      'اختر مساراً قصيراً ومظللاً وابدأ بنشاط خفيف.',
      'اجعل أقرب مركز صحي ضمن خطتك قبل اختيار الفعالية.',
      'خذ استراحة كل 15 دقيقة واشرب الماء على دفعات.',
    ];
  }

  if (answers?.journeyType === 'adventure') {
    return [
      'اختر مساراً معروفاً ولا تبدأ في مناطق مرتفعة دون رفيق.',
      'احمل ماءً ووجبة خفيفة، وتابع مؤشرات الإجهاد.',
      'توقف فوراً عند ألم الصدر أو ضيق التنفس واطلب المساعدة.',
    ];
  }

  if (answers?.withFamily) {
    return [
      'ابدأ بموقع قريب من الخدمات ومناسب للأطفال وكبار السن.',
      'اتفق مع العائلة على نقطة تجمع واضحة قبل بدء الفعالية.',
      'احمل ماءً ووجبة خفيفة، وخصص وقتاً للراحة بين الأنشطة.',
    ];
  }

  return defaultTips;
}

export function buildDailyPlan(answers: JourneyAnswers | null, events: HealthEvent[]): DailyPlan {
  const activeEvents = events.filter((event) => event.active);
  const fallbackEvent = events[0] ?? defaultEvent;
  const fallbackWalkway = walkways[0] ?? defaultWalkway;
  const fallbackHealthCenter = healthCenters[0] ?? defaultHealthCenter;

  return {
    event: pickEvent(answers, activeEvents, fallbackEvent),
    walkway: pickWalkway(answers, fallbackWalkway),
    healthCenter: pickHealthCenter(answers, fallbackHealthCenter),
    tips: pickTips(answers),
    mapNotes: ['موقعك الآن', 'مركز صحي قريب', 'ممشى مناسب', 'خيار يناسب الزيارة'],
  };
}

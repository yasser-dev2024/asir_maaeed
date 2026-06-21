import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  initialContents,
  initialDoctorAssistantQuestions,
  initialEvents,
  initialKeywordAnswers,
  initialMetrics,
  initialPassport,
  initialQrScans,
  initialSmartEntryConfig,
} from '../data/mockData';
import type {
  AdminMetrics,
  AwarenessContent,
  ContentType,
  DoctorAssistantQuestion,
  HealthEvent,
  JourneyAnswers,
  KeywordAnswer,
  PassportProfile,
  QrScan,
  QrVisit,
  SmartEntryConfig,
} from '../types/domain';
import { createId, safeUrl, sanitizeList, sanitizeText } from '../utils/security';
import { logEvent } from '../services/logger';
import { getOrCreateVisitorId, normalizeQrSource, qrSourceLabel } from '../utils/privacy';

type KeywordPayload = Omit<KeywordAnswer, 'id' | 'active' | 'usage' | 'updatedAt'>;
type EventPayload = Omit<HealthEvent, 'id' | 'active' | 'visits' | 'tone'>;
type ContentPayload = Omit<AwarenessContent, 'id' | 'active' | 'updatedAt'>;
type SmartEntryConfigPayload = SmartEntryConfig;
type DoctorAssistantPayload = Omit<DoctorAssistantQuestion, 'id' | 'updatedAt'>;

interface AppState {
  metrics: AdminMetrics;
  events: HealthEvent[];
  contents: AwarenessContent[];
  doctorAssistantQuestions: DoctorAssistantQuestion[];
  keywordAnswers: KeywordAnswer[];
  passport: PassportProfile;
  qrScans: QrScan[];
  qrVisits: QrVisit[];
  visitorId: string;
  smartEntryConfig: SmartEntryConfig;
  smartEntryCompleted: boolean;
  journeyAnswers: JourneyAnswers | null;
  savedPlan: boolean;
  adminAuthenticated: boolean;
  splashSeen: boolean;
  setSplashSeen: () => void;
  setJourneyAnswers: (answers: JourneyAnswers) => void;
  savePlan: () => void;
  visitEvent: (eventId: string) => void;
  addKeywordAnswer: (payload: KeywordPayload) => void;
  updateKeywordAnswer: (id: string, payload: KeywordPayload) => void;
  deleteKeywordAnswer: (id: string) => void;
  toggleKeywordAnswer: (id: string) => void;
  recordKeywordUse: (id: string) => void;
  addEvent: (payload: EventPayload) => void;
  updateEvent: (id: string, payload: EventPayload) => void;
  deleteEvent: (id: string) => void;
  toggleEvent: (id: string) => void;
  addContent: (payload: ContentPayload) => void;
  updateContent: (id: string, payload: ContentPayload) => void;
  deleteContent: (id: string) => void;
  toggleContent: (id: string) => void;
  addDoctorAssistantQuestion: (payload: DoctorAssistantPayload) => void;
  updateDoctorAssistantQuestion: (id: string, payload: DoctorAssistantPayload) => void;
  deleteDoctorAssistantQuestion: (id: string) => void;
  toggleDoctorAssistantQuestion: (id: string) => void;
  moveDoctorAssistantQuestion: (id: string, direction: 'up' | 'down') => void;
  addPassportPoints: (points: number, label: string) => void;
  recordQrScan: (source: string, route: string) => boolean;
  resetSmartEntry: () => void;
  setSmartEntryCompleted: () => void;
  updateSmartEntryConfig: (config: SmartEntryConfigPayload) => void;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

function cleanKeywordPayload(payload: KeywordPayload): KeywordPayload {
  return {
    question: sanitizeText(payload.question),
    keywords: sanitizeList(payload.keywords),
    answer: sanitizeText(payload.answer),
    linkLabel: sanitizeText(payload.linkLabel),
    linkUrl: safeUrl(payload.linkUrl),
    imageUrl: safeUrl(payload.imageUrl),
    ctaLabel: sanitizeText(payload.ctaLabel),
    ctaUrl: safeUrl(payload.ctaUrl),
  };
}

function cleanEventPayload(payload: EventPayload): EventPayload {
  return {
    title: sanitizeText(payload.title),
    description: sanitizeText(payload.description),
    location: sanitizeText(payload.location),
    date: sanitizeText(payload.date),
    time: sanitizeText(payload.time),
    audience: sanitizeText(payload.audience),
    category: sanitizeText(payload.category),
    mapUrl: safeUrl(payload.mapUrl),
  };
}

function cleanContentPayload(payload: ContentPayload): ContentPayload {
  return {
    title: sanitizeText(payload.title),
    type: payload.type,
    summary: sanitizeText(payload.summary),
    category: sanitizeText(payload.category),
    actionLabel: sanitizeText(payload.actionLabel),
    fileUrl: safeUrl(payload.fileUrl),
  };
}

function cleanDoctorAssistantPayload(payload: DoctorAssistantPayload): DoctorAssistantPayload {
  return {
    question: sanitizeText(payload.question),
    answer: sanitizeText(payload.answer),
    keywords: sanitizeList(payload.keywords),
    active: Boolean(payload.active),
    order: Number.isFinite(payload.order) ? payload.order : 999,
  };
}

function cleanSmartEntryConfig(config: SmartEntryConfigPayload): SmartEntryConfig {
  return {
    privacyNote: sanitizeText(config.privacyNote),
    ageGroups: config.ageGroups.map((group) => ({
      id: sanitizeText(group.id),
      label: sanitizeText(group.label),
      message: sanitizeText(group.message),
      active: Boolean(group.active),
    })),
    visitorTypes: config.visitorTypes.map((type) => ({
      id: type.id,
      label: sanitizeText(type.label),
      active: Boolean(type.active),
    })),
    yesNoQuestions: config.yesNoQuestions.map((question) => ({
      id: sanitizeText(question.id),
      question: sanitizeText(question.question),
      yesLabel: sanitizeText(question.yesLabel),
      noLabel: sanitizeText(question.noLabel),
      active: Boolean(question.active),
    })),
    facilityOptions: config.facilityOptions.map((option) => ({
      id: sanitizeText(option.id),
      label: sanitizeText(option.label),
      mapUrl: safeUrl(option.mapUrl),
      active: Boolean(option.active),
    })),
    tripOptions: config.tripOptions.map((option) => ({
      id: sanitizeText(option.id),
      label: sanitizeText(option.label),
      active: Boolean(option.active),
      ageGroupIds: sanitizeList(option.ageGroupIds),
      title: sanitizeText(option.title),
      healthNotice: sanitizeText(option.healthNotice),
      tips: sanitizeList(option.tips),
      ctaLabel: sanitizeText(option.ctaLabel),
      mapUrl: safeUrl(option.mapUrl),
      route: safeUrl(option.route) || '/',
      call937: Boolean(option.call937),
    })),
  };
}

function increaseMetric(metrics: AdminMetrics, key: keyof AdminMetrics, amount = 1): AdminMetrics {
  return { ...metrics, [key]: metrics[key] + amount };
}

const QR_REPEAT_WINDOW_MS = 10 * 60 * 1000;

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      metrics: initialMetrics,
      events: initialEvents,
      contents: initialContents,
      doctorAssistantQuestions: initialDoctorAssistantQuestions,
      keywordAnswers: initialKeywordAnswers,
      passport: initialPassport,
      qrScans: initialQrScans,
      qrVisits: [],
      visitorId: getOrCreateVisitorId(),
      smartEntryConfig: initialSmartEntryConfig,
      smartEntryCompleted: false,
      journeyAnswers: null,
      savedPlan: false,
      adminAuthenticated: false,
      splashSeen: false,
      setSplashSeen: () => set({ splashSeen: true }),
      setJourneyAnswers: (answers) => {
        logEvent('info', 'journey_created', { answers });
        set((state) => ({
          journeyAnswers: answers,
          savedPlan: false,
          metrics: increaseMetric(state.metrics, 'journeys'),
        }));
      },
      savePlan: () => {
        logEvent('info', 'plan_saved');
        set({ savedPlan: true });
      },
      visitEvent: (eventId) =>
        set((state) => ({
          events: state.events.map((event) =>
            event.id === eventId ? { ...event, visits: event.visits + 1 } : event
          ),
        })),
      addKeywordAnswer: (payload) => {
        const cleaned = cleanKeywordPayload(payload);
        logEvent('info', 'keyword_added', { question: cleaned.question });
        set((state) => ({
          keywordAnswers: [
            {
              ...cleaned,
              id: createId('kw'),
              active: true,
              usage: 0,
              updatedAt: new Date().toISOString().slice(0, 10),
            },
            ...state.keywordAnswers,
          ],
        }));
      },
      updateKeywordAnswer: (id, payload) => {
        const cleaned = cleanKeywordPayload(payload);
        logEvent('info', 'keyword_updated', { id });
        set((state) => ({
          keywordAnswers: state.keywordAnswers.map((answer) =>
            answer.id === id
              ? { ...answer, ...cleaned, updatedAt: new Date().toISOString().slice(0, 10) }
              : answer
          ),
        }));
      },
      deleteKeywordAnswer: (id) => {
        logEvent('warn', 'keyword_deleted', { id });
        set((state) => ({ keywordAnswers: state.keywordAnswers.filter((answer) => answer.id !== id) }));
      },
      toggleKeywordAnswer: (id) =>
        set((state) => ({
          keywordAnswers: state.keywordAnswers.map((answer) =>
            answer.id === id ? { ...answer, active: !answer.active } : answer
          ),
        })),
      recordKeywordUse: (id) =>
        set((state) => ({
          metrics: increaseMetric(state.metrics, 'inquiries'),
          keywordAnswers: state.keywordAnswers.map((answer) =>
            answer.id === id ? { ...answer, usage: answer.usage + 1 } : answer
          ),
        })),
      addEvent: (payload) => {
        const tones: HealthEvent['tone'][] = ['green', 'blue', 'rose', 'amber'];
        const cleaned = cleanEventPayload(payload);
        set((state) => ({
          events: [
            {
              ...cleaned,
              id: createId('event'),
              active: true,
              visits: 0,
              tone: tones[state.events.length % tones.length] ?? 'green',
            },
            ...state.events,
          ],
        }));
      },
      updateEvent: (id, payload) => {
        const cleaned = cleanEventPayload(payload);
        set((state) => ({
          events: state.events.map((event) => (event.id === id ? { ...event, ...cleaned } : event)),
        }));
      },
      deleteEvent: (id) => set((state) => ({ events: state.events.filter((event) => event.id !== id) })),
      toggleEvent: (id) =>
        set((state) => ({
          events: state.events.map((event) =>
            event.id === id ? { ...event, active: !event.active } : event
          ),
        })),
      addContent: (payload) => {
        const cleaned = cleanContentPayload(payload);
        set((state) => ({
          contents: [
            {
              ...cleaned,
              id: createId('content'),
              active: true,
              updatedAt: new Date().toISOString().slice(0, 10),
            },
            ...state.contents,
          ],
        }));
      },
      updateContent: (id, payload) => {
        const cleaned = cleanContentPayload(payload);
        set((state) => ({
          contents: state.contents.map((content) =>
            content.id === id
              ? { ...content, ...cleaned, updatedAt: new Date().toISOString().slice(0, 10) }
              : content
          ),
        }));
      },
      deleteContent: (id) =>
        set((state) => ({ contents: state.contents.filter((content) => content.id !== id) })),
      toggleContent: (id) =>
        set((state) => ({
          contents: state.contents.map((content) =>
            content.id === id ? { ...content, active: !content.active } : content
          ),
        })),
      addDoctorAssistantQuestion: (payload) => {
        const cleaned = cleanDoctorAssistantPayload(payload);
        set((state) => ({
          doctorAssistantQuestions: [
            {
              ...cleaned,
              id: createId('doctor'),
              updatedAt: new Date().toISOString().slice(0, 10),
            },
            ...state.doctorAssistantQuestions,
          ],
        }));
      },
      updateDoctorAssistantQuestion: (id, payload) => {
        const cleaned = cleanDoctorAssistantPayload(payload);
        set((state) => ({
          doctorAssistantQuestions: state.doctorAssistantQuestions.map((question) =>
            question.id === id
              ? { ...question, ...cleaned, updatedAt: new Date().toISOString().slice(0, 10) }
              : question
          ),
        }));
      },
      deleteDoctorAssistantQuestion: (id) =>
        set((state) => ({
          doctorAssistantQuestions: state.doctorAssistantQuestions.filter((question) => question.id !== id),
        })),
      toggleDoctorAssistantQuestion: (id) =>
        set((state) => ({
          doctorAssistantQuestions: state.doctorAssistantQuestions.map((question) =>
            question.id === id ? { ...question, active: !question.active } : question
          ),
        })),
      moveDoctorAssistantQuestion: (id, direction) =>
        set((state) => {
          const sorted = [...state.doctorAssistantQuestions].sort((a, b) => a.order - b.order);
          const index = sorted.findIndex((question) => question.id === id);
          const targetIndex = direction === 'up' ? index - 1 : index + 1;

          if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) {
            return {};
          }

          const current = sorted[index];
          const target = sorted[targetIndex];
          if (!current || !target) {
            return {};
          }

          sorted[index] = { ...target, order: current.order };
          sorted[targetIndex] = { ...current, order: target.order };

          return { doctorAssistantQuestions: sorted };
        }),
      addPassportPoints: (points, label) =>
        set((state) => {
          const cleanLabel = sanitizeText(label);
          const achievements = state.passport.achievements.includes(cleanLabel)
            ? state.passport.achievements
            : [cleanLabel, ...state.passport.achievements].slice(0, 8);

          return {
            passport: {
              ...state.passport,
              points: Math.max(0, state.passport.points + points),
              scans: points > 0 && cleanLabel.includes('QR') ? state.passport.scans + 1 : state.passport.scans,
              achievements,
            },
          };
        }),
      recordQrScan: (source, route) => {
        const visitorId = getOrCreateVisitorId();
        const qrSource = normalizeQrSource(source || 'QR_UNKNOWN');
        const cleanRoute = sanitizeText(route || window.location.pathname || '/');
        const timestamp = new Date().toISOString();
        let counted = false;

        set((state) => {
          const now = new Date(timestamp).getTime();
          const repeated = state.qrVisits.some(
            (visit) =>
              visit.visitorId === visitorId &&
              visit.qrSource === qrSource &&
              now - new Date(visit.timestamp).getTime() < QR_REPEAT_WINDOW_MS
          );

          if (repeated) {
            logEvent('info', 'qr_scan_repeated_ignored', { qrSource, route: cleanRoute });
            return { visitorId };
          }

          counted = true;
          const qrVisits: QrVisit[] = [
            {
              id: createId('qr-visit'),
              visitorId,
              qrSource,
              timestamp,
              route: cleanRoute,
            },
            ...state.qrVisits,
          ].slice(0, 1000);

          const exists = state.qrScans.some((scan) => scan.source === qrSource);
          const qrScans = exists
            ? state.qrScans.map((scan) =>
                scan.source === qrSource
                  ? { ...scan, visits: scan.visits + 1, scannedAt: timestamp, lastRoute: cleanRoute }
                  : scan
              )
            : [
                {
                  id: createId('qr'),
                  source: qrSource,
                  location: qrSourceLabel(qrSource),
                  visits: 1,
                  scannedAt: timestamp,
                  lastRoute: cleanRoute,
                },
                ...state.qrScans,
              ];

          logEvent('info', 'qr_scan_counted_privacy_safe', { qrSource, route: cleanRoute });

          return {
            visitorId,
            qrVisits,
            qrScans,
            metrics: increaseMetric(increaseMetric(state.metrics, 'qrScans'), 'visitors'),
            passport: {
              ...state.passport,
              points: state.passport.points + 15,
              scans: state.passport.scans + 1,
              achievements: ['مسح QR جديد', ...state.passport.achievements].slice(0, 8),
            },
          };
        });

        return counted;
      },
      resetSmartEntry: () => set({ smartEntryCompleted: false }),
      setSmartEntryCompleted: () => set({ smartEntryCompleted: true }),
      updateSmartEntryConfig: (config) => set({ smartEntryConfig: cleanSmartEntryConfig(config) }),
      login: (email, password) => {
        const valid = sanitizeText(email) === 'admin@aseer.health.sa' && password === 'Aseer@2026';
        if (valid) {
          set({ adminAuthenticated: true });
          logEvent('info', 'admin_login_success');
        } else {
          logEvent('warn', 'admin_login_failed', { email: sanitizeText(email) });
        }

        return valid;
      },
      logout: () => {
        set({ adminAuthenticated: false });
        logEvent('info', 'admin_logout');
      },
    }),
    {
      name: 'saif-seha-musaed-store',
      storage: createJSONStorage(() => window.localStorage),
      partialize: (state) => ({
        metrics: state.metrics,
        events: state.events,
        contents: state.contents,
        doctorAssistantQuestions: state.doctorAssistantQuestions,
        keywordAnswers: state.keywordAnswers,
        passport: state.passport,
        qrScans: state.qrScans,
        qrVisits: state.qrVisits,
        visitorId: state.visitorId,
        smartEntryConfig: state.smartEntryConfig,
        smartEntryCompleted: state.smartEntryCompleted,
        journeyAnswers: state.journeyAnswers,
        savedPlan: state.savedPlan,
        adminAuthenticated: state.adminAuthenticated,
        splashSeen: state.splashSeen,
      }),
    }
  )
);

export type { ContentPayload, EventPayload, KeywordPayload };
export type { ContentType };

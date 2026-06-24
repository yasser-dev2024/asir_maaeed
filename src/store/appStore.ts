import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  initialContents,
  initialDoctorAssistantQuestions,
  initialEvents,
  initialKeywordAnswers,
  initialMetrics,
  initialPassport,
  initialQrLocations,
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
  QrLocation,
  QrLocationVisit,
  QrScan,
  QrVisit,
  SmartEntryConfig,
} from '../types/domain';
import { createId, safeUrl, sanitizeList, sanitizeText } from '../utils/security';
import { logEvent } from '../services/logger';
import { getOrCreateVisitorId, isKnownQrSource, normalizeQrSource, qrSourceLabel } from '../utils/privacy';
import { uniqueLocationSlug } from '../services/qrLocationService';
import {
  deleteRemoteContent,
  deleteRemoteDoctorQuestion,
  deleteRemoteEvent,
  deleteRemoteKeyword,
  deleteRemoteQrLocation,
  upsertRemoteContent,
  upsertRemoteDoctorQuestion,
  upsertRemoteEvent,
  upsertRemoteKeyword,
  upsertRemoteQrLocation,
  upsertRemoteSmartEntryConfig,
} from '../services/remoteSync';

type KeywordPayload = Omit<KeywordAnswer, 'id' | 'active' | 'usage' | 'updatedAt'>;
type EventPayload = Omit<HealthEvent, 'id' | 'active' | 'visits' | 'tone'>;
type ContentPayload = Omit<AwarenessContent, 'id' | 'active' | 'updatedAt'>;
type SmartEntryConfigPayload = SmartEntryConfig;
type DoctorAssistantPayload = Omit<DoctorAssistantQuestion, 'id' | 'updatedAt'>;
type QrLocationPayload = Pick<QrLocation, 'name' | 'description' | 'active'>;
type QrLocationScanResult = { counted: boolean; location?: QrLocation; slug?: string; external?: boolean };

interface AppState {
  metrics: AdminMetrics;
  events: HealthEvent[];
  contents: AwarenessContent[];
  doctorAssistantQuestions: DoctorAssistantQuestion[];
  keywordAnswers: KeywordAnswer[];
  passport: PassportProfile;
  qrScans: QrScan[];
  qrVisits: QrVisit[];
  qrLocations: QrLocation[];
  qrLocationVisits: QrLocationVisit[];
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
  addQrLocation: (payload: QrLocationPayload) => void;
  updateQrLocation: (id: string, payload: QrLocationPayload) => void;
  deleteQrLocation: (id: string) => void;
  toggleQrLocation: (id: string) => void;
  recordQrLocationScan: (slug: string, route: string, locationName?: string) => QrLocationScanResult;
  resetSmartEntry: () => void;
  setSmartEntryCompleted: () => void;
  updateSmartEntryConfig: (config: SmartEntryConfigPayload) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshAdminSession: () => boolean;
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
    mapUrl: safeUrl(payload.mapUrl, { allowRelative: false, allowedProtocols: ['https:'] }),
  };
}

function cleanContentPayload(payload: ContentPayload): ContentPayload {
  return {
    title: sanitizeText(payload.title),
    type: payload.type,
    summary: sanitizeText(payload.summary),
    category: sanitizeText(payload.category),
    actionLabel: sanitizeText(payload.actionLabel),
    fileUrl: safeUrl(payload.fileUrl, { allowRelative: true, allowedProtocols: ['https:'] }),
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

function cleanQrLocationPayload(payload: QrLocationPayload): QrLocationPayload {
  const name = sanitizeText(payload.name, 80).trim();

  return {
    name: name || 'منطقة جديدة',
    description: sanitizeText(payload.description, 220).trim(),
    active: Boolean(payload.active),
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
      mapUrl: safeUrl(option.mapUrl, { allowRelative: true, allowedProtocols: ['https:'] }),
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
      mapUrl: safeUrl(option.mapUrl, { allowRelative: true, allowedProtocols: ['https:'] }),
      route: safeUrl(option.route, { allowRelative: true, allowedProtocols: [] }) || '/',
      call937: Boolean(option.call937),
    })),
  };
}

function increaseMetric(metrics: AdminMetrics, key: keyof AdminMetrics, amount = 1): AdminMetrics {
  return { ...metrics, [key]: metrics[key] + amount };
}

const QR_REPEAT_WINDOW_MS = 0;
const STORE_VERSION = 3;
const ADMIN_SESSION_KEY = 'saif-seha-admin-session';
const ADMIN_JWT_KEY = 'admin-jwt-token';
const ADMIN_LOGIN_ATTEMPTS_KEY = 'saif-seha-admin-login-attempts';
const ADMIN_MAX_FAILED_ATTEMPTS = 5;
const ADMIN_LOCKOUT_MS = 5 * 60 * 1000;
const SEEDED_METRICS_BASELINE: AdminMetrics = {
  visitors: 18420,
  qrScans: 6940,
  journeys: 3275,
  inquiries: 2188,
};
const SEEDED_EVENT_VISIT_BASELINES: Record<string, number> = {
  'event-fog-walk': 1420,
  'event-airport-booth': 2015,
  'event-family-soudah': 1188,
};
const SEEDED_KEYWORD_USAGE_BASELINES: Record<string, number> = {
  'health-center': 760,
  'booth': 520,
  'hydration': 430,
  'emergency': 298,
};
const SEEDED_QR_VISIT_BASELINES: Record<string, number> = {
  QR_AIRPORT: 2480,
  QR_WALKWAY: 1775,
  QR_EVENT: 1642,
};
const SEEDED_PASSPORT_POINTS = 80;
const SEEDED_PASSPORT_SCANS = 3;
const SEEDED_PASSPORT_ACHIEVEMENTS = new Set(['مسح QR من نقطة الوصول', 'زيارة ممشى صحي', 'قراءة بطاقة توعوية']);
const SEEDED_PASSPORT_BADGES = new Set(['نشط اليوم', 'محافظ على الترطيب']);

interface AdminLoginAttempts {
  count: number;
  lockedUntil: number;
}

function readAdminSessionExpiresAt(): number {
  try {
    const raw = window.sessionStorage.getItem(ADMIN_SESSION_KEY);
    const parsed = raw ? (JSON.parse(raw) as { expiresAt?: number }) : null;
    const expiresAt = Number(parsed?.expiresAt || 0);

    if (!expiresAt || expiresAt <= Date.now()) {
      window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
      return 0;
    }

    return expiresAt;
  } catch {
    return 0;
  }
}

function hasValidAdminSession(): boolean {
  return readAdminSessionExpiresAt() > Date.now();
}


function clearAdminSession(): void {
  window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
  window.sessionStorage.removeItem(ADMIN_JWT_KEY);
}

function readAdminLoginAttempts(): AdminLoginAttempts {
  try {
    const raw = window.localStorage.getItem(ADMIN_LOGIN_ATTEMPTS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<AdminLoginAttempts>) : {};
    const lockedUntil = Number(parsed.lockedUntil || 0);

    if (lockedUntil && lockedUntil <= Date.now()) {
      window.localStorage.removeItem(ADMIN_LOGIN_ATTEMPTS_KEY);
      return { count: 0, lockedUntil: 0 };
    }

    return {
      count: Math.max(0, Number(parsed.count || 0)),
      lockedUntil,
    };
  } catch {
    return { count: 0, lockedUntil: 0 };
  }
}

function recordFailedAdminLogin(): void {
  const attempts = readAdminLoginAttempts();
  const count = attempts.count + 1;
  const lockedUntil = count >= ADMIN_MAX_FAILED_ATTEMPTS ? Date.now() + ADMIN_LOCKOUT_MS : 0;
  window.localStorage.setItem(ADMIN_LOGIN_ATTEMPTS_KEY, JSON.stringify({ count, lockedUntil }));
}

function clearFailedAdminLogins(): void {
  window.localStorage.removeItem(ADMIN_LOGIN_ATTEMPTS_KEY);
}

export function getAdminLoginLockRemainingSeconds(): number {
  const attempts = readAdminLoginAttempts();
  return Math.max(0, Math.ceil((attempts.lockedUntil - Date.now()) / 1000));
}

function subtractBaseline(value: number | undefined, baseline: number): number {
  return Math.max(0, Number(value || 0) - baseline);
}

function qrStatsFromVisits(qrVisits: QrVisit[]) {
  const stats = new Map<string, { visits: number; timestamp: string; route: string }>();

  qrVisits.forEach((visit) => {
    const current = stats.get(visit.qrSource);
    if (!current || new Date(visit.timestamp).getTime() > new Date(current.timestamp).getTime()) {
      stats.set(visit.qrSource, {
        visits: (current?.visits ?? 0) + 1,
        timestamp: visit.timestamp,
        route: visit.route,
      });
      return;
    }

    stats.set(visit.qrSource, {
      ...current,
      visits: current.visits + 1,
    });
  });

  return stats;
}

function mergeQrLocationsWithDefaults(locations: QrLocation[] | undefined, includeDefaults = true): QrLocation[] {
  const merged = new Map<string, QrLocation>();

  if (includeDefaults) {
    initialQrLocations.forEach((location) => {
      merged.set(location.slug, location);
    });
  }

  if (!Array.isArray(locations)) {
    return Array.from(merged.values());
  }

  locations.forEach((location) => {
    const slug = sanitizeText(location.slug).trim().toLowerCase();

    if (!slug) {
      return;
    }

    const defaultLocation = initialQrLocations.find((item) => item.slug === slug);
    merged.set(slug, {
      ...(defaultLocation ?? {
        id: createId('qr-location'),
        name: slug,
        description: '',
        active: true,
        scans: 0,
        lastScanAt: '',
        createdAt: new Date().toISOString(),
      }),
      ...location,
      slug,
      name: sanitizeText(location.name || defaultLocation?.name || slug),
      description: sanitizeText(location.description || defaultLocation?.description || ''),
      active: typeof location.active === 'boolean' ? location.active : defaultLocation?.active ?? true,
      scans: Number.isFinite(location.scans) ? Math.max(0, Number(location.scans)) : (defaultLocation?.scans ?? 0),
      lastScanAt: sanitizeText(location.lastScanAt || defaultLocation?.lastScanAt || ''),
      createdAt: sanitizeText(location.createdAt || defaultLocation?.createdAt || new Date().toISOString()),
    });
  });

  return Array.from(merged.values());
}

function cleanPersistedAnalytics(persistedState: Partial<AppState>): Partial<AppState> {
  const qrVisits = Array.isArray(persistedState.qrVisits) ? persistedState.qrVisits : [];
  const qrVisitStats = qrStatsFromVisits(qrVisits);
  const persistedQrScans = Array.isArray(persistedState.qrScans) ? persistedState.qrScans : [];
  const persistedQrBySource = new Map(persistedQrScans.map((scan) => [scan.source, scan]));
  const knownQrScans = initialQrScans.map((scan) => {
    const persisted = persistedQrBySource.get(scan.source);
    const stats = qrVisitStats.get(scan.source);

    return {
      ...scan,
      ...persisted,
      visits: stats?.visits ?? 0,
      scannedAt: stats?.timestamp ?? '',
      lastRoute: stats?.route ?? '-',
    };
  });
  const otherQrScans = persistedQrScans
    .filter((scan) => !(scan.source in SEEDED_QR_VISIT_BASELINES))
    .map((scan) => {
      const stats = qrVisitStats.get(scan.source);

      if (!stats) {
        return scan;
      }

      return {
        ...scan,
        visits: stats.visits,
        scannedAt: stats.timestamp,
        lastRoute: stats.route,
      };
    });

  const cleanedState: Partial<AppState> = {
    ...persistedState,
    qrScans: [...knownQrScans, ...otherQrScans],
    qrVisits,
    qrLocations: mergeQrLocationsWithDefaults(
      persistedState.qrLocations,
      !Array.isArray(persistedState.qrLocations)
    ),
  };

  if (persistedState.metrics) {
    cleanedState.metrics = {
      visitors: subtractBaseline(persistedState.metrics.visitors, SEEDED_METRICS_BASELINE.visitors),
      qrScans: Math.max(subtractBaseline(persistedState.metrics.qrScans, SEEDED_METRICS_BASELINE.qrScans), qrVisits.length),
      journeys: subtractBaseline(persistedState.metrics.journeys, SEEDED_METRICS_BASELINE.journeys),
      inquiries: subtractBaseline(persistedState.metrics.inquiries, SEEDED_METRICS_BASELINE.inquiries),
    };
  }

  if (Array.isArray(persistedState.events)) {
    cleanedState.events = persistedState.events.map((event) => ({
      ...event,
      visits: subtractBaseline(event.visits, SEEDED_EVENT_VISIT_BASELINES[event.id] ?? 0),
    }));
  }

  if (Array.isArray(persistedState.keywordAnswers)) {
    cleanedState.keywordAnswers = persistedState.keywordAnswers.map((answer) => ({
      ...answer,
      usage: subtractBaseline(answer.usage, SEEDED_KEYWORD_USAGE_BASELINES[answer.id] ?? 0),
    }));
  }

  if (persistedState.passport) {
    cleanedState.passport = {
      ...persistedState.passport,
      points: subtractBaseline(persistedState.passport.points, SEEDED_PASSPORT_POINTS),
      scans: Math.max(subtractBaseline(persistedState.passport.scans, SEEDED_PASSPORT_SCANS), qrVisits.length),
      achievements: persistedState.passport.achievements.filter(
        (achievement) => !SEEDED_PASSPORT_ACHIEVEMENTS.has(achievement)
      ),
      badges: persistedState.passport.badges.filter((badge) => !SEEDED_PASSPORT_BADGES.has(badge)),
    };
  }

  return cleanedState;
}

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
      qrLocations: initialQrLocations,
      qrLocationVisits: [],
      visitorId: getOrCreateVisitorId(),
      smartEntryConfig: initialSmartEntryConfig,
      smartEntryCompleted: false,
      journeyAnswers: null,
      savedPlan: false,
      adminAuthenticated: hasValidAdminSession(),
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
        let newKeyword: (typeof cleaned & { id: string; active: boolean; usage: number; updatedAt: string }) | undefined;
        set((state) => {
          newKeyword = {
            ...cleaned,
            id: createId('kw'),
            active: true,
            usage: 0,
            updatedAt: new Date().toISOString().slice(0, 10),
          };
          return { keywordAnswers: [newKeyword, ...state.keywordAnswers] };
        });
        if (newKeyword) void upsertRemoteKeyword(newKeyword);
      },
      updateKeywordAnswer: (id, payload) => {
        const cleaned = cleanKeywordPayload(payload);
        logEvent('info', 'keyword_updated', { id });
        let updated: KeywordAnswer | undefined;
        set((state) => {
          const keywordAnswers = state.keywordAnswers.map((answer) => {
            if (answer.id !== id) return answer;
            updated = { ...answer, ...cleaned, updatedAt: new Date().toISOString().slice(0, 10) };
            return updated;
          });
          return { keywordAnswers };
        });
        if (updated) void upsertRemoteKeyword(updated);
      },
      deleteKeywordAnswer: (id) => {
        logEvent('warn', 'keyword_deleted', { id });
        void deleteRemoteKeyword(id);
        set((state) => ({ keywordAnswers: state.keywordAnswers.filter((answer) => answer.id !== id) }));
      },
      toggleKeywordAnswer: (id) => {
        let toggled: KeywordAnswer | undefined;
        set((state) => {
          const keywordAnswers = state.keywordAnswers.map((answer) => {
            if (answer.id !== id) return answer;
            toggled = { ...answer, active: !answer.active };
            return toggled;
          });
          return { keywordAnswers };
        });
        if (toggled) void upsertRemoteKeyword(toggled);
      },
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
        let newEvent: HealthEvent | undefined;
        set((state) => {
          newEvent = {
            ...cleaned,
            id: createId('event'),
            active: true,
            visits: 0,
            tone: tones[state.events.length % tones.length] ?? 'green',
          };
          return { events: [newEvent, ...state.events] };
        });
        if (newEvent) void upsertRemoteEvent(newEvent);
      },
      updateEvent: (id, payload) => {
        const cleaned = cleanEventPayload(payload);
        let updated: HealthEvent | undefined;
        set((state) => {
          const events = state.events.map((event) => {
            if (event.id !== id) return event;
            updated = { ...event, ...cleaned };
            return updated;
          });
          return { events };
        });
        if (updated) void upsertRemoteEvent(updated);
      },
      deleteEvent: (id) => {
        void deleteRemoteEvent(id);
        set((state) => ({ events: state.events.filter((event) => event.id !== id) }));
      },
      toggleEvent: (id) => {
        let toggled: HealthEvent | undefined;
        set((state) => {
          const events = state.events.map((event) => {
            if (event.id !== id) return event;
            toggled = { ...event, active: !event.active };
            return toggled;
          });
          return { events };
        });
        if (toggled) void upsertRemoteEvent(toggled);
      },
      addContent: (payload) => {
        const cleaned = cleanContentPayload(payload);
        let newContent: AwarenessContent | undefined;
        set((state) => {
          newContent = {
            ...cleaned,
            id: createId('content'),
            active: true,
            updatedAt: new Date().toISOString().slice(0, 10),
          };
          return { contents: [newContent, ...state.contents] };
        });
        if (newContent) void upsertRemoteContent(newContent);
      },
      updateContent: (id, payload) => {
        const cleaned = cleanContentPayload(payload);
        let updated: AwarenessContent | undefined;
        set((state) => {
          const contents = state.contents.map((content) => {
            if (content.id !== id) return content;
            updated = { ...content, ...cleaned, updatedAt: new Date().toISOString().slice(0, 10) };
            return updated;
          });
          return { contents };
        });
        if (updated) void upsertRemoteContent(updated);
      },
      deleteContent: (id) => {
        void deleteRemoteContent(id);
        set((state) => ({ contents: state.contents.filter((content) => content.id !== id) }));
      },
      toggleContent: (id) => {
        let toggled: AwarenessContent | undefined;
        set((state) => {
          const contents = state.contents.map((content) => {
            if (content.id !== id) return content;
            toggled = { ...content, active: !content.active };
            return toggled;
          });
          return { contents };
        });
        if (toggled) void upsertRemoteContent(toggled);
      },
      addDoctorAssistantQuestion: (payload) => {
        const cleaned = cleanDoctorAssistantPayload(payload);
        let newQuestion: DoctorAssistantQuestion | undefined;
        set((state) => {
          newQuestion = {
            ...cleaned,
            id: createId('doctor'),
            updatedAt: new Date().toISOString().slice(0, 10),
          };
          return { doctorAssistantQuestions: [newQuestion, ...state.doctorAssistantQuestions] };
        });
        if (newQuestion) void upsertRemoteDoctorQuestion(newQuestion);
      },
      updateDoctorAssistantQuestion: (id, payload) => {
        const cleaned = cleanDoctorAssistantPayload(payload);
        let updated: DoctorAssistantQuestion | undefined;
        set((state) => {
          const doctorAssistantQuestions = state.doctorAssistantQuestions.map((question) => {
            if (question.id !== id) return question;
            updated = { ...question, ...cleaned, updatedAt: new Date().toISOString().slice(0, 10) };
            return updated;
          });
          return { doctorAssistantQuestions };
        });
        if (updated) void upsertRemoteDoctorQuestion(updated);
      },
      deleteDoctorAssistantQuestion: (id) => {
        void deleteRemoteDoctorQuestion(id);
        set((state) => ({
          doctorAssistantQuestions: state.doctorAssistantQuestions.filter((question) => question.id !== id),
        }));
      },
      toggleDoctorAssistantQuestion: (id) => {
        let toggled: DoctorAssistantQuestion | undefined;
        set((state) => {
          const doctorAssistantQuestions = state.doctorAssistantQuestions.map((question) => {
            if (question.id !== id) return question;
            toggled = { ...question, active: !question.active };
            return toggled;
          });
          return { doctorAssistantQuestions };
        });
        if (toggled) void upsertRemoteDoctorQuestion(toggled);
      },
      moveDoctorAssistantQuestion: (id, direction) => {
        let q1: DoctorAssistantQuestion | undefined;
        let q2: DoctorAssistantQuestion | undefined;
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

          q1 = { ...target, order: current.order };
          q2 = { ...current, order: target.order };
          sorted[index] = q1;
          sorted[targetIndex] = q2;

          return { doctorAssistantQuestions: sorted };
        });
        if (q1) void upsertRemoteDoctorQuestion(q1);
        if (q2) void upsertRemoteDoctorQuestion(q2);
      },
      addPassportPoints: (points, label) =>
        set((state) => {
          const safePoints = Number.isFinite(points) ? Math.max(-500, Math.min(500, Math.trunc(points))) : 0;
          const cleanLabel = sanitizeText(label);
          const achievements = state.passport.achievements.includes(cleanLabel)
            ? state.passport.achievements
            : [cleanLabel, ...state.passport.achievements].slice(0, 8);

          return {
            passport: {
              ...state.passport,
              points: Math.max(0, state.passport.points + safePoints),
              scans: safePoints > 0 && cleanLabel.includes('QR') ? state.passport.scans + 1 : state.passport.scans,
              achievements,
            },
          };
        }),
      addQrLocation: (payload) => {
        const cleaned = cleanQrLocationPayload(payload);
        let created: QrLocation | undefined;
        set((state) => {
          const timestamp = new Date().toISOString();
          created = {
            id: createId('qr-location'),
            ...cleaned,
            slug: uniqueLocationSlug(cleaned.name, state.qrLocations.map((location) => location.slug)),
            scans: 0,
            lastScanAt: '',
            createdAt: timestamp,
          };
          logEvent('info', 'qr_location_created', { slug: created.slug });
          return { qrLocations: [created, ...state.qrLocations] };
        });
        if (created) void upsertRemoteQrLocation(created);
      },
      updateQrLocation: (id, payload) => {
        const cleaned = cleanQrLocationPayload(payload);
        let updated: QrLocation | undefined;
        set((state) => {
          const qrLocations = state.qrLocations.map((location) => {
            if (location.id !== id) return location;
            updated = { ...location, ...cleaned };
            return updated;
          });
          return { qrLocations };
        });
        if (updated) void upsertRemoteQrLocation(updated);
      },
      deleteQrLocation: (id) => {
        void deleteRemoteQrLocation(id);
        set((state) => ({
          qrLocations: state.qrLocations.filter((location) => location.id !== id),
          qrLocationVisits: state.qrLocationVisits.filter((visit) => visit.locationId !== id),
        }));
      },
      toggleQrLocation: (id) => {
        let toggled: QrLocation | undefined;
        set((state) => {
          const qrLocations = state.qrLocations.map((location) => {
            if (location.id !== id) return location;
            toggled = { ...location, active: !location.active };
            return toggled;
          });
          return { qrLocations };
        });
        if (toggled) void upsertRemoteQrLocation(toggled);
      },
      recordQrLocationScan: (slug, route, locationName = '') => {
        const visitorId = getOrCreateVisitorId();
        const cleanSlug = sanitizeText(slug, 80).trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
        const cleanLocationName = sanitizeText(locationName, 80);
        const cleanRoute = sanitizeText(route || window.location.pathname || '/', 300);
        const timestamp = new Date().toISOString();
        let result: QrLocationScanResult = { counted: false };

        set((state) => {
          const location = state.qrLocations.find((item) => item.slug === cleanSlug);

          if (!location) {
            if (!cleanSlug || isKnownQrSource(normalizeQrSource(slug))) {
              return { visitorId };
            }

            result = { counted: false, slug: cleanSlug, external: true };
            const now = new Date(timestamp).getTime();
            const repeated = state.qrLocationVisits.some(
              (visit) =>
                visit.visitorId === visitorId &&
                visit.slug === cleanSlug &&
                now - new Date(visit.timestamp).getTime() < QR_REPEAT_WINDOW_MS
            );

            if (repeated) {
              logEvent('info', 'external_qr_location_repeated_ignored', { slug: cleanSlug, route: cleanRoute });
              return { visitorId };
            }

            const displayName = cleanLocationName || cleanSlug.replace(/-/g, ' ');
            result = { counted: true, slug: cleanSlug, external: true };

            const qrLocationVisits: QrLocationVisit[] = [
              {
                id: createId('qr-location-visit'),
                visitorId,
                locationId: `external-${cleanSlug}`,
                slug: cleanSlug,
                locationName: displayName,
                timestamp,
                route: cleanRoute,
              },
              ...state.qrLocationVisits,
            ].slice(0, 1000);

            logEvent('info', 'external_qr_location_scan_counted_privacy_safe', {
              slug: cleanSlug,
              route: cleanRoute,
            });

            return {
              visitorId,
              qrLocationVisits,
              metrics: increaseMetric(increaseMetric(state.metrics, 'qrScans'), 'visitors'),
              passport: {
                ...state.passport,
                points: state.passport.points + 15,
                scans: state.passport.scans + 1,
                achievements: [`مسح QR منطقة: ${displayName}`, ...state.passport.achievements].slice(0, 8),
              },
            };
          }

          if (!cleanSlug) {
            return { visitorId };
          }

          result = { counted: false, location, slug: cleanSlug };

          if (!location.active) {
            logEvent('info', 'qr_location_inactive_ignored', { slug: cleanSlug });
            return { visitorId };
          }

          const now = new Date(timestamp).getTime();
          const repeated = state.qrLocationVisits.some(
            (visit) =>
              visit.visitorId === visitorId &&
              visit.slug === cleanSlug &&
              now - new Date(visit.timestamp).getTime() < QR_REPEAT_WINDOW_MS
          );

          if (repeated) {
            logEvent('info', 'qr_location_repeated_ignored', { slug: cleanSlug, route: cleanRoute });
            return { visitorId };
          }

          const updatedLocation: QrLocation = {
            ...location,
            scans: location.scans + 1,
            lastScanAt: timestamp,
          };

          result = { counted: true, location: updatedLocation, slug: cleanSlug };

          const qrLocationVisits: QrLocationVisit[] = [
            {
              id: createId('qr-location-visit'),
              visitorId,
              locationId: location.id,
              slug: cleanSlug,
              locationName: location.name,
              timestamp,
              route: cleanRoute,
            },
            ...state.qrLocationVisits,
          ].slice(0, 1000);

          logEvent('info', 'qr_location_scan_counted_privacy_safe', { slug: cleanSlug, route: cleanRoute });

          return {
            visitorId,
            qrLocationVisits,
            qrLocations: state.qrLocations.map((item) =>
              item.id === location.id ? updatedLocation : item
            ),
            metrics: increaseMetric(increaseMetric(state.metrics, 'qrScans'), 'visitors'),
            passport: {
              ...state.passport,
              points: state.passport.points + 15,
              scans: state.passport.scans + 1,
              achievements: [`مسح QR منطقة: ${location.name}`, ...state.passport.achievements].slice(0, 8),
            },
          };
        });

        return result;
      },
      recordQrScan: (source, route) => {
        const visitorId = getOrCreateVisitorId();
        const qrSource = normalizeQrSource(source || 'QR_UNKNOWN');
        const cleanRoute = sanitizeText(route || window.location.pathname || '/', 300);
        const timestamp = new Date().toISOString();
        let counted = false;

        if (!isKnownQrSource(qrSource)) {
          logEvent('warn', 'qr_scan_unknown_ignored', { qrSource });
          return false;
        }

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
      updateSmartEntryConfig: (config) => {
        const cleaned = cleanSmartEntryConfig(config);
        set({ smartEntryConfig: cleaned });
        void upsertRemoteSmartEntryConfig(cleaned);
      },
      login: async (email, password) => {
        if (getAdminLoginLockRemainingSeconds() > 0) {
          set({ adminAuthenticated: false });
          logEvent('warn', 'admin_login_locked');
          return false;
        }

        try {
          const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: sanitizeText(email, 120), password }),
          });

          if (!res.ok) {
            clearAdminSession();
            recordFailedAdminLogin();
            set({ adminAuthenticated: false });
            logEvent('warn', 'admin_login_failed');
            return false;
          }

          const { token, expiresAt } = await res.json() as { token: string; expiresAt: number };
          window.sessionStorage.setItem(ADMIN_JWT_KEY, token);
          window.sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ expiresAt }));
          clearFailedAdminLogins();
          set({ adminAuthenticated: true });
          logEvent('info', 'admin_login_success');
          return true;
        } catch {
          clearAdminSession();
          set({ adminAuthenticated: false });
          return false;
        }
      },
      logout: () => {
        clearAdminSession();
        set({ adminAuthenticated: false });
        logEvent('info', 'admin_logout');
      },
      refreshAdminSession: () => {
        const valid = hasValidAdminSession();
        set({ adminAuthenticated: valid });
        return valid;
      },
    }),
    {
      name: 'saif-seha-musaed-store',
      storage: createJSONStorage(() => window.localStorage),
      version: STORE_VERSION,
      migrate: (persistedState, version) => {
        if (version >= STORE_VERSION || !persistedState || typeof persistedState !== 'object') {
          return persistedState as AppState;
        }

        return cleanPersistedAnalytics(persistedState as Partial<AppState>) as AppState;
      },
      merge: (persistedState, currentState) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return currentState;
        }

        const state = persistedState as Partial<AppState>;

        return {
          ...currentState,
          ...state,
          adminAuthenticated: hasValidAdminSession(),
          qrLocations: mergeQrLocationsWithDefaults(state.qrLocations, !Array.isArray(state.qrLocations)),
        };
      },
      partialize: (state) => ({
        metrics: state.metrics,
        events: state.events,
        contents: state.contents,
        doctorAssistantQuestions: state.doctorAssistantQuestions,
        keywordAnswers: state.keywordAnswers,
        passport: state.passport,
        qrScans: state.qrScans,
        qrVisits: state.qrVisits,
        qrLocations: state.qrLocations,
        qrLocationVisits: state.qrLocationVisits,
        visitorId: state.visitorId,
        smartEntryConfig: state.smartEntryConfig,
        smartEntryCompleted: state.smartEntryCompleted,
        journeyAnswers: state.journeyAnswers,
        savedPlan: state.savedPlan,
        splashSeen: state.splashSeen,
      }),
    }
  )
);

export type { ContentPayload, EventPayload, KeywordPayload };
export type { ContentType };

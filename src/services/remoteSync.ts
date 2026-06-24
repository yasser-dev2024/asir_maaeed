import type {
  AwarenessContent,
  DoctorAssistantQuestion,
  HealthEvent,
  KeywordAnswer,
  QrLocation,
  SmartEntryConfig,
} from '../types/domain';

// ── API helpers ───────────────────────────────────────────────────────────────

const API = '/api';
const ADMIN_JWT_KEY = 'admin-jwt-token';

function getAdminToken(): string {
  try { return sessionStorage.getItem(ADMIN_JWT_KEY) ?? ''; }
  catch { return ''; }
}

function adminHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getAdminToken()}`,
  };
}

async function safePut(path: string, body: unknown): Promise<void> {
  if (!getAdminToken()) return;
  try {
    await fetch(`${API}${path}`, {
      method: 'PUT',
      headers: adminHeaders(),
      body: JSON.stringify(body),
    });
  } catch {
    // best-effort — never break local flow
  }
}

async function safeDel(path: string): Promise<void> {
  if (!getAdminToken()) return;
  try {
    await fetch(`${API}${path}`, {
      method: 'DELETE',
      headers: adminHeaders(),
    });
  } catch {
    // best-effort
  }
}

// ── Per-entity upsert / delete ─────────────────────────────────────────────

export function upsertRemoteEvent(event: HealthEvent): Promise<void> {
  return safePut(`/events/${event.id}`, {
    title: event.title,
    description: event.description,
    location: event.location,
    date: event.date,
    time: event.time,
    audience: event.audience,
    category: event.category,
    map_url: event.mapUrl,
    active: event.active,
    tone: event.tone,
  });
}

export function deleteRemoteEvent(id: string): Promise<void> {
  return safeDel(`/events/${id}`);
}

export function upsertRemoteContent(content: AwarenessContent): Promise<void> {
  return safePut(`/contents/${content.id}`, {
    title: content.title,
    type: content.type,
    summary: content.summary,
    category: content.category,
    action_label: content.actionLabel,
    file_url: content.fileUrl,
    active: content.active,
    updated_at: content.updatedAt,
  });
}

export function deleteRemoteContent(id: string): Promise<void> {
  return safeDel(`/contents/${id}`);
}

export function upsertRemoteKeyword(keyword: KeywordAnswer): Promise<void> {
  return safePut(`/keywords/${keyword.id}`, {
    question: keyword.question,
    keywords: keyword.keywords,
    answer: keyword.answer,
    link_label: keyword.linkLabel,
    link_url: keyword.linkUrl,
    image_url: keyword.imageUrl,
    cta_label: keyword.ctaLabel,
    cta_url: keyword.ctaUrl,
    active: keyword.active,
    updated_at: keyword.updatedAt,
  });
}

export function deleteRemoteKeyword(id: string): Promise<void> {
  return safeDel(`/keywords/${id}`);
}

export function upsertRemoteDoctorQuestion(question: DoctorAssistantQuestion): Promise<void> {
  return safePut(`/doctor-questions/${question.id}`, {
    question: question.question,
    answer: question.answer,
    keywords: question.keywords,
    active: question.active,
    order: question.order,
    updated_at: question.updatedAt,
  });
}

export function deleteRemoteDoctorQuestion(id: string): Promise<void> {
  return safeDel(`/doctor-questions/${id}`);
}

export function upsertRemoteQrLocation(location: QrLocation): Promise<void> {
  return safePut(`/qr-locations/${location.id}`, {
    name: location.name,
    description: location.description,
    slug: location.slug,
    active: location.active,
    scans: location.scans,
    last_scan_at: location.lastScanAt || null,
    created_at: location.createdAt,
  });
}

export function deleteRemoteQrLocation(id: string): Promise<void> {
  return safeDel(`/qr-locations/${id}`);
}

export function upsertRemoteSmartEntryConfig(config: SmartEntryConfig): Promise<void> {
  if (!getAdminToken()) return Promise.resolve();
  return fetch(`${API}/smart-entry-config`, {
    method: 'PUT',
    headers: adminHeaders(),
    body: JSON.stringify(config),
  }).then(() => undefined).catch(() => undefined);
}

// ── Row → domain mappers ───────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function rowToEvent(r: Row): HealthEvent {
  return {
    id: String(r.id ?? ''),
    title: String(r.title ?? ''),
    description: String(r.description ?? ''),
    location: String(r.location ?? ''),
    date: String(r.date ?? ''),
    time: String(r.time ?? ''),
    audience: String(r.audience ?? ''),
    category: String(r.category ?? ''),
    mapUrl: String(r.map_url ?? ''),
    visits: 0,
    active: Boolean(r.active ?? true),
    tone: (r.tone ?? 'green') as HealthEvent['tone'],
  };
}

function rowToContent(r: Row): AwarenessContent {
  return {
    id: String(r.id ?? ''),
    title: String(r.title ?? ''),
    type: (r.type ?? 'post') as AwarenessContent['type'],
    summary: String(r.summary ?? ''),
    category: String(r.category ?? ''),
    actionLabel: String(r.action_label ?? ''),
    fileUrl: String(r.file_url ?? ''),
    active: Boolean(r.active ?? true),
    updatedAt: String(r.updated_at ?? ''),
  };
}

function rowToKeyword(r: Row): KeywordAnswer {
  return {
    id: String(r.id ?? ''),
    question: String(r.question ?? ''),
    keywords: Array.isArray(r.keywords) ? (r.keywords as string[]).map(String) : [],
    answer: String(r.answer ?? ''),
    linkLabel: String(r.link_label ?? ''),
    linkUrl: String(r.link_url ?? ''),
    imageUrl: String(r.image_url ?? ''),
    ctaLabel: String(r.cta_label ?? ''),
    ctaUrl: String(r.cta_url ?? ''),
    active: Boolean(r.active ?? true),
    usage: 0,
    updatedAt: String(r.updated_at ?? ''),
  };
}

function rowToDoctor(r: Row): DoctorAssistantQuestion {
  return {
    id: String(r.id ?? ''),
    question: String(r.question ?? ''),
    answer: String(r.answer ?? ''),
    keywords: Array.isArray(r.keywords) ? (r.keywords as string[]).map(String) : [],
    active: Boolean(r.active ?? true),
    order: Number(r.sort_order ?? r.order ?? 999),
    updatedAt: String(r.updated_at ?? ''),
  };
}

function rowToQrLocation(r: Row, existingLocations: QrLocation[] = []): QrLocation {
  const existing = existingLocations.find((l) => l.id === r.id);
  return {
    id: String(r.id ?? ''),
    name: String(r.name ?? ''),
    description: String(r.description ?? ''),
    slug: String(r.slug ?? ''),
    active: Boolean(r.active ?? true),
    scans: Number(r.scans ?? existing?.scans ?? 0),
    lastScanAt: r.last_scan_at ? String(r.last_scan_at) : (existing?.lastScanAt ?? ''),
    createdAt: String(r.created_at ?? ''),
  };
}

// ── Snapshot types ─────────────────────────────────────────────────────────

export interface RemoteSnapshot {
  events: HealthEvent[];
  contents: AwarenessContent[];
  keywordAnswers: KeywordAnswer[];
  doctorAssistantQuestions: DoctorAssistantQuestion[];
  qrLocations: QrLocation[];
  smartEntryConfig: SmartEntryConfig | null;
}

export interface LocalSeedData {
  events: HealthEvent[];
  contents: AwarenessContent[];
  keywordAnswers: KeywordAnswer[];
  doctorAssistantQuestions: DoctorAssistantQuestion[];
  qrLocations: QrLocation[];
  smartEntryConfig: SmartEntryConfig;
}

// ── Fetch all remote data ──────────────────────────────────────────────────

export async function fetchRemoteSnapshot(existingLocations: QrLocation[] = []): Promise<RemoteSnapshot | null> {
  try {
    const res = await fetch(`${API}/data`, { cache: 'no-store' });
    if (!res.ok) return null;

    const data = await res.json() as {
      events: Row[];
      contents: Row[];
      keywords: Row[];
      doctorQuestions: Row[];
      qrLocations: Row[];
      smartEntryConfig: SmartEntryConfig | null;
    };

    return {
      events: (data.events ?? []).map(rowToEvent),
      contents: (data.contents ?? []).map(rowToContent),
      keywordAnswers: (data.keywords ?? []).map(rowToKeyword),
      doctorAssistantQuestions: (data.doctorQuestions ?? []).map(rowToDoctor),
      qrLocations: (data.qrLocations ?? []).map((row) => rowToQrLocation(row, existingLocations)),
      smartEntryConfig: data.smartEntryConfig ?? null,
    };
  } catch {
    return null;
  }
}

// ── Seed remote from local (first-time setup when DB is empty) ────────────

export async function seedRemote(localData: LocalSeedData): Promise<void> {
  if (!getAdminToken()) return;
  await Promise.allSettled([
    ...localData.events.map((e) => upsertRemoteEvent(e)),
    ...localData.contents.map((c) => upsertRemoteContent(c)),
    ...localData.keywordAnswers.map((k) => upsertRemoteKeyword(k)),
    ...localData.doctorAssistantQuestions.map((q) => upsertRemoteDoctorQuestion(q)),
    ...localData.qrLocations.map((l) => upsertRemoteQrLocation(l)),
    upsertRemoteSmartEntryConfig(localData.smartEntryConfig),
  ]);
}

import { getOrCreateVisitorId } from '../utils/privacy';

const COUNTER_API_BASE_URL = 'https://api.counterapi.dev/v1';
const DEFAULT_COUNTER_NAMESPACE = 'asir-maaeed-qr-locations';
const QR_REPEAT_WINDOW_MS = 10 * 60 * 1000;
const SYNC_REPEAT_PREFIX = 'saif-seha-musaed-qr-sync';

interface CounterApiResponse {
  count?: number;
  updated_at?: string;
}

export interface QrCentralStats {
  total: number;
  today: number;
  thisWeek: number;
  updatedAt: string;
  available: boolean;
}

function getCounterNamespace() {
  const env = import.meta.env as ImportMetaEnv & {
    readonly APP_QR_COUNTER_NAMESPACE?: string;
    readonly VITE_QR_COUNTER_NAMESPACE?: string;
  };

  return (env.APP_QR_COUNTER_NAMESPACE || env.VITE_QR_COUNTER_NAMESPACE || DEFAULT_COUNTER_NAMESPACE)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || DEFAULT_COUNTER_NAMESPACE;
}

function safeCounterName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function requestUrl(counterName: string, action?: 'up') {
  const namespace = getCounterNamespace();
  const url = new URL(`${COUNTER_API_BASE_URL}/${namespace}/${counterName}${action ? `/${action}` : ''}`);
  return url.toString();
}

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function weekKey(date = new Date()) {
  const current = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = current.getUTCDay() || 7;
  current.setUTCDate(current.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(current.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((current.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${current.getUTCFullYear()}-w${String(week).padStart(2, '0')}`;
}

function counterNames(slug: string) {
  const safeSlug = safeCounterName(slug);

  return {
    total: `qr-${safeSlug}`,
    today: `qr-${safeSlug}-day-${todayKey()}`,
    thisWeek: `qr-${safeSlug}-week-${weekKey()}`,
  };
}

async function fetchCounter(counterName: string, action?: 'up') {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetch(requestUrl(counterName, action), {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (response.status === 400 || response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Counter API ${response.status}`);
    }

    return (await response.json()) as CounterApiResponse;
  } finally {
    window.clearTimeout(timeout);
  }
}

function getRepeatStorageKey(slug: string) {
  return `${SYNC_REPEAT_PREFIX}:${getOrCreateVisitorId()}:${safeCounterName(slug)}`;
}

function shouldSkipRepeatedSync(slug: string) {
  const key = getRepeatStorageKey(slug);
  const previous = Number(window.localStorage.getItem(key) || 0);

  return previous > 0 && Date.now() - previous < QR_REPEAT_WINDOW_MS;
}

function markSync(slug: string) {
  window.localStorage.setItem(getRepeatStorageKey(slug), String(Date.now()));
}

export async function syncQrScanToCentralCounter(slug: string) {
  if (!slug || shouldSkipRepeatedSync(slug)) {
    return;
  }

  const names = counterNames(slug);
  await Promise.all([fetchCounter(names.total, 'up'), fetchCounter(names.today, 'up'), fetchCounter(names.thisWeek, 'up')]);
  markSync(slug);
}

export async function fetchQrCentralStats(slug: string): Promise<QrCentralStats> {
  const names = counterNames(slug);
  const [total, today, thisWeek] = await Promise.all([
    fetchCounter(names.total),
    fetchCounter(names.today),
    fetchCounter(names.thisWeek),
  ]);

  return {
    total: Number(total?.count || 0),
    today: Number(today?.count || 0),
    thisWeek: Number(thisWeek?.count || 0),
    updatedAt: total?.updated_at || '',
    available: true,
  };
}

import { getOrCreateVisitorId } from '../utils/privacy';

const COUNTER_API_BASE_URL = 'https://api.counterapi.dev/v1';
const DEFAULT_COUNTER_NAMESPACE = 'asir-maaeed-qr-locations';

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
  const timeout = window.setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(requestUrl(counterName, action), {
      cache: 'no-store',
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
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function syncQrScanToCentralCounter(slug: string) {
  if (!slug) {
    return;
  }

  getOrCreateVisitorId();
  const names = counterNames(slug);
  await Promise.allSettled([
    fetchCounter(names.total, 'up'),
    fetchCounter(names.today, 'up'),
    fetchCounter(names.thisWeek, 'up'),
  ]);
}

export async function fetchQrCentralStats(slug: string): Promise<QrCentralStats> {
  const names = counterNames(slug);
  const [total, today, thisWeek] = await Promise.allSettled([
    fetchCounter(names.total),
    fetchCounter(names.today),
    fetchCounter(names.thisWeek),
  ]);
  const totalValue = total.status === 'fulfilled' ? total.value : null;
  const todayValue = today.status === 'fulfilled' ? today.value : null;
  const thisWeekValue = thisWeek.status === 'fulfilled' ? thisWeek.value : null;

  return {
    total: Number(totalValue?.count || 0),
    today: Number(todayValue?.count || 0),
    thisWeek: Number(thisWeekValue?.count || 0),
    updatedAt: totalValue?.updated_at || '',
    available: Boolean(totalValue || todayValue || thisWeekValue),
  };
}

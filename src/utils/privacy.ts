const VISITOR_ID_KEY = 'saif-seha-visitor-id';

const qrAliases: Record<string, string> = {
  airport: 'QR_AIRPORT',
  qr_airport: 'QR_AIRPORT',
  'qr-airport': 'QR_AIRPORT',
  walkway: 'QR_WALKWAY',
  qr_walkway: 'QR_WALKWAY',
  'qr-walkway': 'QR_WALKWAY',
  event: 'QR_EVENT',
  qr_event: 'QR_EVENT',
  'qr-event': 'QR_EVENT',
  booth: 'QR_BOOTH',
  qr_booth: 'QR_BOOTH',
  'qr-booth': 'QR_BOOTH',
};

export const qrSourceLabels: Record<string, string> = {
  QR_AIRPORT: 'مطار أبها',
  QR_WALKWAY: 'ممشى الضباب',
  QR_EVENT: 'ركن الفعاليات',
  QR_BOOTH: 'نقطة توعوية',
};

function randomSegment(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function getOrCreateVisitorId(): string {
  const existing = window.localStorage.getItem(VISITOR_ID_KEY);
  if (existing) {
    return existing;
  }

  const randomId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? `visitor_${crypto.randomUUID()}`
      : `visitor_${Date.now().toString(36)}_${randomSegment()}${randomSegment()}`;

  window.localStorage.setItem(VISITOR_ID_KEY, randomId);
  return randomId;
}

export function normalizeQrSource(value: string): string {
  const cleaned = value.trim().replace(/\s+/g, '_');
  const alias = qrAliases[cleaned.toLowerCase()];
  if (alias) {
    return alias;
  }

  return cleaned.toUpperCase().replace(/[^A-Z0-9_]/g, '_').slice(0, 60) || 'QR_UNKNOWN';
}

export function qrSourceLabel(source: string): string {
  return qrSourceLabels[source] ?? source.replaceAll('_', ' ');
}

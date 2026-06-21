import * as QRCode from 'qrcode';

const QR_LINK_VERSION = '8';

const knownLocationSlugs = new Map<string, string>([
  ['شارع الفن', 'art-street'],
  ['مطار أبها', 'abha-airport'],
  ['ممشى الضباب', 'fog-walkway'],
  ['السودة', 'soudah'],
]);

const arabicSlugMap: Record<string, string> = {
  ا: 'a',
  أ: 'a',
  إ: 'i',
  آ: 'a',
  ب: 'b',
  ت: 't',
  ث: 'th',
  ج: 'j',
  ح: 'h',
  خ: 'kh',
  د: 'd',
  ذ: 'dh',
  ر: 'r',
  ز: 'z',
  س: 's',
  ش: 'sh',
  ص: 's',
  ض: 'd',
  ط: 't',
  ظ: 'z',
  ع: 'a',
  غ: 'gh',
  ف: 'f',
  ق: 'q',
  ك: 'k',
  ل: 'l',
  م: 'm',
  ن: 'n',
  ه: 'h',
  و: 'w',
  ي: 'y',
  ى: 'a',
  ة: 'h',
  ء: '',
  ئ: 'e',
  ؤ: 'o',
};

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, '');
}

export function getAppBaseUrl() {
  const env = import.meta.env as ImportMetaEnv & {
    readonly APP_BASE_URL?: string;
    readonly VITE_APP_BASE_URL?: string;
  };
  const configured = env.APP_BASE_URL || env.VITE_APP_BASE_URL;

  if (configured) {
    return normalizeBaseUrl(configured);
  }

  return normalizeBaseUrl(new URL(import.meta.env.BASE_URL, window.location.origin).toString());
}

export function slugifyLocationName(name: string) {
  const cleanName = name.trim().replace(/\s+/g, ' ');
  const knownSlug = knownLocationSlugs.get(cleanName);

  if (knownSlug) {
    return knownSlug;
  }

  const transliterated = name
    .trim()
    .split('')
    .map((char) => arabicSlugMap[char] ?? char)
    .join('')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  return transliterated || `location-${Date.now().toString(36)}`;
}

export function uniqueLocationSlug(name: string, usedSlugs: string[]) {
  const baseSlug = slugifyLocationName(name);
  const used = new Set(usedSlugs);
  let slug = baseSlug;
  let suffix = 2;

  while (used.has(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

export function buildQrLocationUrl(slug: string) {
  const baseUrl = getAppBaseUrl();
  const url = new URL(baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
  url.searchParams.set('qr', slug);
  url.searchParams.set('v', QR_LINK_VERSION);
  return url.toString();
}

export function generateQrPngDataUrl(url: string, width = 1600) {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'H',
    margin: 4,
    width,
    color: {
      dark: '#0f766e',
      light: '#ffffff',
    },
  });
}

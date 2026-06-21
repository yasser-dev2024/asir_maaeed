const dangerousPattern = /<script|<\/script|javascript:|onerror=|onload=|data:text\/html/gi;

export function sanitizeText(value: string): string {
  return value.replace(dangerousPattern, '').replace(/[<>]/g, '').trim();
}

export function sanitizeList(values: string[]): string[] {
  return values
    .map((value) => sanitizeText(value))
    .filter((value, index, list) => value.length > 0 && list.indexOf(value) === index);
}

export function safeUrl(value: string): string {
  const cleaned = sanitizeText(value);
  if (!cleaned) {
    return '';
  }

  if (cleaned.startsWith('/') || cleaned.startsWith('https://') || cleaned.startsWith('mailto:') || cleaned.startsWith('tel:')) {
    return cleaned;
  }

  return '';
}

export function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

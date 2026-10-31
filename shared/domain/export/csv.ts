/**
 * Safe CSV generator with formula-injection guard (SECURITY-PRIVACY.md §3.4)
 */
export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  const str = String(value);

  // Formula injection check: if string starts with dangerous characters, prepend single quote
  const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r'];
  let safeStr = str;
  if (dangerousPrefixes.some(prefix => str.startsWith(prefix))) {
    safeStr = `'${str}`;
  }

  // Escape inner double quotes
  const escaped = safeStr.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function buildCsv(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  const headerLine = headers.map(h => sanitizeCsvCell(h)).join(',');
  const rowLines = rows.map(row => row.map(cell => sanitizeCsvCell(cell)).join(','));
  return [headerLine, ...rowLines].join('\r\n');
}

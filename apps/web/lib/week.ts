/** ISO week helpers. Weeks start Monday; dates are 'YYYY-MM-DD' (local). */

const MS_DAY = 86_400_000;

export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseIsoDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
}

/** Monday of the week containing `d`, as ISO date. */
export function mondayOf(d: Date = new Date()): string {
  const day = (d.getDay() + 6) % 7; // Mon=0 … Sun=6
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
  return toIsoDate(monday);
}

export function addWeeks(isoMonday: string, weeks: number): string {
  const d = parseIsoDate(isoMonday);
  return toIsoDate(new Date(d.getTime() + weeks * 7 * MS_DAY + 12 * 3_600_000)).slice(0, 10);
}

export function isoWeekNumber(isoDate: string): number {
  const d = parseIsoDate(isoDate);
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / MS_DAY + 1) / 7);
}

const MONTHS_DA = ['jan.', 'feb.', 'mar.', 'apr.', 'maj', 'juni', 'juli', 'aug.', 'sep.', 'okt.', 'nov.', 'dec.'];

/** "14.–20. sep." or "28. sep.–4. okt." */
export function weekRangeLabel(isoMonday: string): string {
  const start = parseIsoDate(isoMonday);
  const end = new Date(start.getTime() + 6 * MS_DAY + 12 * 3_600_000);
  const sm = MONTHS_DA[start.getMonth()]!;
  const em = MONTHS_DA[end.getMonth()]!;
  return sm === em ? `${start.getDate()}.–${end.getDate()}. ${sm}` : `${start.getDate()}. ${sm}–${end.getDate()}. ${em}`;
}

/** "Uge 38 · 14.–20. sep." */
export function weekLabel(isoMonday: string): string {
  return `Uge ${isoWeekNumber(isoMonday)} · ${weekRangeLabel(isoMonday)}`;
}

/** "Denne uge", "Næste uge", or "Uge 40". */
export function relativeWeekLabel(isoMonday: string, today: Date = new Date()): string {
  const current = mondayOf(today);
  if (isoMonday === current) return 'Denne uge';
  if (isoMonday === addWeeks(current, 1)) return 'Næste uge';
  if (isoMonday < current) return `Uge ${isoWeekNumber(isoMonday)} (afsluttet)`;
  return `Uge ${isoWeekNumber(isoMonday)}`;
}

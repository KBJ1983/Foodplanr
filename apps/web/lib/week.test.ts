import { describe, expect, it } from 'vitest';
import { addWeeks, isoWeekNumber, mondayOf, relativeWeekLabel, weekLabel, weekRangeLabel } from './week';

describe('week helpers', () => {
  it('finds the Monday of a week', () => {
    expect(mondayOf(new Date(2026, 8, 14))).toBe('2026-09-14'); // Monday
    expect(mondayOf(new Date(2026, 8, 20))).toBe('2026-09-14'); // Sunday
    expect(mondayOf(new Date(2026, 8, 16))).toBe('2026-09-14'); // Wednesday
  });

  it('computes ISO week numbers', () => {
    expect(isoWeekNumber('2026-09-14')).toBe(38);
    expect(isoWeekNumber('2026-01-01')).toBe(1);
    expect(isoWeekNumber('2027-01-03')).toBe(53); // 2026 has 53 ISO weeks
  });

  it('adds weeks across month boundaries', () => {
    expect(addWeeks('2026-09-14', 1)).toBe('2026-09-21');
    expect(addWeeks('2026-09-28', 1)).toBe('2026-10-05');
  });

  it('formats Danish week labels', () => {
    expect(weekRangeLabel('2026-09-14')).toBe('14.–20. sep.');
    expect(weekRangeLabel('2026-09-28')).toBe('28. sep.–4. okt.');
    expect(weekLabel('2026-09-14')).toBe('Uge 38 · 14.–20. sep.');
  });

  it('labels weeks relative to today', () => {
    const today = new Date(2026, 8, 16);
    expect(relativeWeekLabel('2026-09-14', today)).toBe('Denne uge');
    expect(relativeWeekLabel('2026-09-21', today)).toBe('Næste uge');
    expect(relativeWeekLabel('2026-09-28', today)).toBe('Uge 40');
    expect(relativeWeekLabel('2026-09-07', today)).toBe('Uge 37 (afsluttet)');
  });
});

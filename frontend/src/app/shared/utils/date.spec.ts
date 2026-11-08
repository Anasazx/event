import { isInPast, toDateTimeString, toLocalInputValue } from './date';

describe('date utilities', () => {
  it('trims API timestamps to datetime-local values', () => {
    expect(toLocalInputValue('2026-11-08T14:30:00')).toBe('2026-11-08T14:30');
    expect(toLocalInputValue(null)).toBe('');
  });

  it('formats local dates as LocalDateTime strings the API accepts', () => {
    expect(toDateTimeString(new Date(2026, 10, 8, 9, 5))).toBe('2026-11-08T09:05');
  });

  it('detects past timestamps', () => {
    expect(isInPast('2000-01-01T00:00:00')).toBeTrue();
    expect(isInPast('2999-01-01T00:00:00')).toBeFalse();
    expect(isInPast(undefined)).toBeFalse();
  });
});

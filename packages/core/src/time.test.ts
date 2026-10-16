import { describe, expect, it } from 'vitest';
import { addMinutes, formatTime, minutesBetween, timeOf } from './time.ts';

describe('timeOf', () => {
  it('reads the local time of day as "HH:mm"', () => {
    expect(timeOf(new Date(2026, 9, 20, 9, 5))).toBe('09:05');
    expect(timeOf(new Date(2026, 9, 20, 13, 30))).toBe('13:30');
  });
});

describe('addMinutes', () => {
  it('moves the arrival 15 minutes before the break', () => {
    expect(addMinutes('13:30', -15)).toBe('13:15');
  });

  it('carries across the hour and wraps around midnight', () => {
    expect(addMinutes('12:50', 25)).toBe('13:15');
    expect(addMinutes('00:10', -20)).toBe('23:50');
  });
});

describe('minutesBetween', () => {
  it('counts the minutes from one time to the next', () => {
    expect(minutesBetween('13:15', '13:30')).toBe(15);
    expect(minutesBetween('13:30', '13:15')).toBe(-15);
  });
});

describe('formatTime', () => {
  it.each([
    ['13:30', '1:30'],
    ['12:30', '12:30'],
    ['12:00', '12:00'],
    ['09:05', '9:05'],
    ['00:15', '12:15'],
    ['23:59', '11:59'],
  ])('shows %s as %s', (input, expected) => {
    expect(formatTime(input)).toBe(expected);
  });

  it.each(['24:00', '1:30', '13:60', '1330', ''])('rejects "%s"', (input) => {
    expect(() => formatTime(input)).toThrow(RangeError);
  });
});

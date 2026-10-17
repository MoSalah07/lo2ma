import { describe, expect, it } from 'vitest';
import { distanceMeters, isInServiceArea, roundPoint, workplaceAt } from './geo.ts';
import { SERVICE_AREA } from './rules.ts';

const tahrir = { lat: 30.0444, lng: 31.2357 };
const smartVillage = { lat: 30.0717, lng: 31.0167 };
const newCapital = { lat: 30.011, lng: 31.74 };

describe('distanceMeters', () => {
  it('is zero from a point to itself', () => {
    expect(distanceMeters(tahrir, tahrir)).toBe(0);
  });

  it('measures along the earth: Tahrir to Smart Village is about 21 km', () => {
    expect(distanceMeters(tahrir, smartVillage)).toBeGreaterThan(20_500);
    expect(distanceMeters(tahrir, smartVillage)).toBeLessThan(22_000);
  });

  it('is the same both ways', () => {
    expect(distanceMeters(tahrir, newCapital)).toBeCloseTo(distanceMeters(newCapital, tahrir), 6);
  });

  it('gives a degree of latitude as about 111 km', () => {
    expect(distanceMeters({ lat: 30, lng: 31 }, { lat: 31, lng: 31 })).toBeCloseTo(111_195, -2);
  });
});

describe('isInServiceArea', () => {
  it('covers Greater Cairo, from Smart Village to New Cairo', () => {
    expect(isInServiceArea(tahrir)).toBe(true);
    expect(isInServiceArea(smartVillage)).toBe(true);
    expect(isInServiceArea({ lat: 30.0236, lng: 31.4593 })).toBe(true);
  });

  it('does not reach the New Capital or Alexandria yet', () => {
    expect(isInServiceArea(newCapital)).toBe(false);
    expect(isInServiceArea({ lat: 31.2001, lng: 29.9187 })).toBe(false);
  });

  it('ends at its radius', () => {
    // A degree of latitude is about 111,195 m, so these sit just inside and just outside the circle.
    const north = (meters: number) => ({
      lat: SERVICE_AREA.center.lat + meters / 111_195,
      lng: SERVICE_AREA.center.lng,
    });
    expect(isInServiceArea(north(SERVICE_AREA.radiusMeters - 100))).toBe(true);
    expect(isInServiceArea(north(SERVICE_AREA.radiusMeters + 100))).toBe(false);
  });
});

describe('roundPoint', () => {
  it('keeps five decimals, about a meter', () => {
    expect(roundPoint({ lat: 30.071712345, lng: 31.016749999 })).toEqual({
      lat: 30.07171,
      lng: 31.01675,
    });
  });
});

describe('workplaceAt', () => {
  const named = {
    name: { ar: 'القرية الذكية · مبنى B2', en: 'Smart Village · Building B2' },
    area: { ar: 'الجيزة', en: 'Giza' },
  };

  it('keeps the pin where the user put it, rounded to a meter', () => {
    expect(workplaceAt(named, { lat: 30.071712345, lng: 31.016749999 })).toEqual({
      ...named,
      point: { lat: 30.07171, lng: 31.01675 },
      details: '',
    });
  });

  it('keeps the courier notes, trimmed', () => {
    expect(workplaceAt(named, smartVillage, '  الدور التالت ').details).toBe('الدور التالت');
  });
});

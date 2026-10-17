import type { GeoPoint, PointLookup, Workplace } from '@lo2ma/core';
import { messages } from '@lo2ma/i18n';
import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePointLookup } from './api';
import { LocationPicker } from './location-picker';
import type { MapViewProps } from './map-view';

const t = messages.en.location;

// The real map needs WebGL. This one lets a test move it, or fail it, the way MapLibre would.
vi.mock('next/dynamic', () => ({
  default: () =>
    function FakeMap({ initialCenter, onMoveStart, onMoveEnd, onUnavailable }: MapViewProps) {
      return (
        <>
          <button type="button" onClick={() => onMoveEnd(initialCenter)}>
            settle where it opened
          </button>
          <button type="button" onClick={onMoveStart}>
            start moving
          </button>
          <button type="button" onClick={() => onMoveEnd({ lat: 30.0287, lng: 31.4086 })}>
            stop at CFC
          </button>
          <button type="button" onClick={onUnavailable}>
            lose WebGL
          </button>
        </>
      );
    },
}));

vi.mock('./api', () => ({
  MIN_QUERY_LENGTH: 2,
  usePointLookup: vi.fn(),
  usePlaceSearch: () => ({ data: [], isFetching: false }),
  useSuggestedPlaces: () => ({ data: [] }),
}));

const smartVillage: Workplace = {
  name: { ar: 'القرية الذكية · مبنى B2', en: 'Smart Village · Building B2' },
  area: { ar: 'الجيزة', en: 'Giza' },
  point: { lat: 30.0712, lng: 31.0175 },
  details: '',
};

/** What the lookup answers for each point, or undefined while it loads. */
let answer: (point: GeoPoint) => PointLookup | undefined;

beforeEach(() => {
  answer = () => ({ name: smartVillage.name, area: smartVillage.area, inServiceArea: true });
  vi.mocked(usePointLookup).mockImplementation(
    (point) =>
      ({
        data: point ? answer(point) : undefined,
        isFetching: false,
        isError: false,
      }) as ReturnType<typeof usePointLookup>,
  );
});

afterEach(() => vi.unstubAllGlobals());

function open(onConfirm = vi.fn()) {
  render(
    <NextIntlClientProvider locale="en" messages={messages.en}>
      <LocationPicker open onOpenChange={vi.fn()} value={smartVillage} onConfirm={onConfirm} />
    </NextIntlClientProvider>,
  );
  return onConfirm;
}

const confirm = () => screen.getByRole('button', { name: t.confirm });

describe('LocationPicker', () => {
  it('opens on the saved workplace and names it', () => {
    open();
    expect(screen.getByRole('dialog', { name: t.title })).toBeInTheDocument();
    expect(screen.getByText(smartVillage.name.en)).toBeInTheDocument();
    expect(confirm()).toBeEnabled();
  });

  it('confirms the point under the pin with the courier notes', () => {
    answer = () => ({
      name: { ar: 'كايرو فستيفال سيتي', en: 'Cairo Festival City' },
      area: { ar: 'القاهرة الجديدة', en: 'New Cairo' },
      inServiceArea: true,
    });
    const onConfirm = open();
    fireEvent.click(screen.getByRole('button', { name: 'stop at CFC' }));
    fireEvent.change(screen.getByLabelText(t.detailsLabel), {
      target: { value: '  Tower B, 4th floor ' },
    });
    fireEvent.click(confirm());

    expect(onConfirm).toHaveBeenCalledWith({
      name: { ar: 'كايرو فستيفال سيتي', en: 'Cairo Festival City' },
      area: { ar: 'القاهرة الجديدة', en: 'New Cairo' },
      point: { lat: 30.0287, lng: 31.4086 },
      details: 'Tower B, 4th floor',
    });
  });

  it('waits for the map to stop before it can confirm', () => {
    open();
    fireEvent.click(screen.getByRole('button', { name: 'start moving' }));
    expect(confirm()).toBeDisabled();
    expect(screen.getByText(t.resolving)).toBeInTheDocument();
  });

  it('opens the map on a point chosen before it loaded, not on the old one', () => {
    vi.stubGlobal('navigator', {
      ...navigator,
      geolocation: {
        getCurrentPosition: (
          found: (position: { coords: { latitude: number; longitude: number } }) => void,
        ) => found({ coords: { latitude: 30.0287, longitude: 31.4086 } }),
      },
    });
    const onConfirm = open();
    // The fake map never hands over its controls, like a map still loading: the point moves without it.
    fireEvent.click(screen.getByRole('button', { name: t.useMyLocation }));
    // Then the map comes up and settles where it opened, which must be that point, not the saved one.
    fireEvent.click(screen.getByRole('button', { name: 'settle where it opened' }));
    fireEvent.click(confirm());
    expect(onConfirm).toHaveBeenLastCalledWith(
      expect.objectContaining({ point: { lat: 30.0287, lng: 31.4086 } }),
    );
  });

  it('says so, and cannot confirm, where Lo2ma does not deliver yet', () => {
    answer = () => ({
      name: { ar: 'العاصمة الإدارية', en: 'New Capital' },
      area: { ar: 'مصر', en: 'Egypt' },
      inServiceArea: false,
    });
    open();
    expect(screen.getByText(t.outsideArea)).toBeInTheDocument();
    expect(confirm()).toBeDisabled();
  });

  it('keeps working without a map: search and «my location» still choose the point', () => {
    open();
    fireEvent.click(screen.getByRole('button', { name: 'lose WebGL' }));
    expect(screen.getByText(t.mapUnavailable)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: t.searchLabel })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: t.useMyLocation })).toBeInTheDocument();
  });

  it('explains a refused location, and moves to a found one', () => {
    let deny = true;
    vi.stubGlobal('navigator', {
      ...navigator,
      geolocation: {
        getCurrentPosition: (
          found: (position: { coords: { latitude: number; longitude: number } }) => void,
          failed: (error: { code: number; PERMISSION_DENIED: number }) => void,
        ) =>
          deny
            ? failed({ code: 1, PERMISSION_DENIED: 1 })
            : found({ coords: { latitude: 30.0287, longitude: 31.4086 } }),
      },
    });
    const onConfirm = open();
    fireEvent.click(screen.getByRole('button', { name: 'lose WebGL' }));

    fireEvent.click(screen.getByRole('button', { name: t.useMyLocation }));
    expect(screen.getByRole('alert')).toHaveTextContent(t.permissionDenied);

    deny = false;
    fireEvent.click(screen.getByRole('button', { name: t.useMyLocation }));
    fireEvent.click(confirm());
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ point: { lat: 30.0287, lng: 31.4086 } }),
    );
  });
});

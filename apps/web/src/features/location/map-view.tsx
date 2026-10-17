'use client';

import type { GeoPoint } from '@lo2ma/core';
import type { Locale } from '@lo2ma/i18n/locales';
import type { MapColors } from '@lo2ma/tokens';
import { getVersion, Map as MapLibreMap, setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useEffectEvent, useImperativeHandle, useRef, type Ref } from 'react';
import { mapStyle } from './map-style';

/** What the picker asks of the map: go somewhere, or zoom a step. */
export interface MapHandle {
  flyTo: (point: GeoPoint) => void;
  zoomBy: (steps: number) => void;
}

export interface MapViewProps {
  ref?: Ref<MapHandle>;
  /** Where it opens. After that the user moves it, or the picker through `flyTo`. */
  initialCenter: GeoPoint;
  colors: MapColors;
  locale: Locale;
  /** The map's accessible name. */
  label: string;
  /** Space at the bottom the sheet covers, in pixels: the center the pin marks sits above it. */
  bottomInset: number;
  onMoveStart: () => void;
  onMoveEnd: (center: GeoPoint) => void;
  /** No WebGL, or it was lost: the picker goes on without a map. */
  onUnavailable: () => void;
}

/** Close enough to tell the building from the one next to it. */
export const STREET_ZOOM = 16;

// The worker is copied next to the app by scripts/vendor.mjs, under the version it comes from.
setWorkerUrl(`/vendor/maplibre-gl-worker-${getVersion()}.mjs`);

/**
 * The map under the location picker: MapLibre with Lo2ma's style, flat (no tilting or turning, which only gets in
 * the way of placing a pin), restyled in place when the theme changes. The picker loads it with next/dynamic, so
 * MapLibre is downloaded only when someone opens it.
 */
export default function MapView({
  ref,
  initialCenter,
  colors,
  locale,
  label,
  bottomInset,
  onMoveStart,
  onMoveEnd,
  onUnavailable,
}: MapViewProps) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const start = useEffectEvent(() => ({ center: initialCenter, label, bottomInset }));
  const moveStarted = useEffectEvent(onMoveStart);
  const moveEnded = useEffectEvent(onMoveEnd);
  const unavailable = useEffectEvent(onUnavailable);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const { center, label: title, bottomInset: bottom } = start();
    let instance: MapLibreMap;
    try {
      instance = new MapLibreMap({
        container: element,
        center: [center.lng, center.lat],
        zoom: STREET_ZOOM,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        maxPitch: 0,
        // The credits are shown in the sheet, in the page's language, with real links.
        attributionControl: false,
        locale: { 'Map.Title': title },
      });
    } catch {
      unavailable();
      return;
    }
    instance.setPadding({ top: 0, bottom, left: 0, right: 0 });
    instance.touchZoomRotate.disableRotation();
    instance.keyboard.disableRotation();
    instance.on('movestart', () => moveStarted());
    instance.on('moveend', () => {
      const { lat, lng } = instance.getCenter();
      moveEnded({ lat, lng });
    });
    instance.on('webglcontextlost', () => unavailable());
    map.current = instance;
    return () => {
      map.current = null;
      instance.remove();
    };
  }, []);

  // The first run sets the style the map opens with; later runs swap it in place (MapLibre diffs the two).
  useEffect(() => {
    map.current?.setStyle(mapStyle(colors, locale));
  }, [colors, locale]);

  useImperativeHandle(ref, () => ({
    flyTo: ({ lat, lng }) =>
      map.current?.flyTo({
        center: [lng, lat],
        zoom: Math.max(map.current.getZoom(), STREET_ZOOM),
      }),
    zoomBy: (steps) => map.current?.zoomTo(map.current.getZoom() + steps),
  }));

  // MapLibre makes its container position: relative, so the container fills a box that does the positioning.
  return (
    <div className="absolute inset-0">
      <div ref={container} className="size-full" />
    </div>
  );
}

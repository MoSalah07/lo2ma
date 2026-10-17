'use client';

import type { GeoPoint } from '@lo2ma/core';
import { useState } from 'react';

/** Where finding the user's position stands. `denied` and `unavailable` each get their own message. */
export type GeolocationStatus = 'idle' | 'locating' | 'denied' | 'unavailable';

/**
 * Finds where the user is, only when they ask (the browser shows its permission prompt then, never on load).
 * A fix up to a minute old is fine for a workplace, and after ten seconds it gives up.
 */
export function useGeolocation() {
  const [status, setStatus] = useState<GeolocationStatus>('idle');

  function locate(onFound: (point: GeoPoint) => void) {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setStatus('unavailable');
      return;
    }
    setStatus('locating');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setStatus('idle');
        onFound({ lat: coords.latitude, lng: coords.longitude });
      },
      (error) => setStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable'),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  return { status, locate };
}

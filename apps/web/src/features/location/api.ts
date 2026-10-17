import { placeSchema, pointLookupSchema, roundPoint, type GeoPoint } from '@lo2ma/core';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from '@/lib/api';

const places = z.array(placeSchema);

/** A search needs this many letters, so one letter doesn't list half of Cairo. */
export const MIN_QUERY_LENGTH = 2;

/** Popular workplaces, shown before anything is typed. The first one is the default for a new user. */
export function useSuggestedPlaces() {
  return useQuery({
    queryKey: ['places', 'suggested'],
    queryFn: () => api('/places/suggested', places),
    staleTime: Infinity,
  });
}

/** Places matching what was typed. The last results stay on screen while the next ones load. */
export function usePlaceSearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ['places', 'search', q],
    queryFn: () => api(`/places/search?${new URLSearchParams({ q })}`, places),
    enabled: q.length >= MIN_QUERY_LENGTH,
    placeholderData: keepPreviousData,
    staleTime: Infinity,
  });
}

/**
 * What is at a point, once the map has stopped moving (null while it moves). Points are rounded to a meter, so a
 * pin dropped back where it was costs no new request.
 */
export function usePointLookup(point: GeoPoint | null) {
  const at = point && roundPoint(point);
  return useQuery({
    queryKey: ['places', 'reverse', at?.lat, at?.lng],
    queryFn: () =>
      api(
        `/places/reverse?${new URLSearchParams({ lat: String(at?.lat), lng: String(at?.lng) })}`,
        pointLookupSchema,
      ),
    enabled: at !== null,
    staleTime: Infinity,
  });
}

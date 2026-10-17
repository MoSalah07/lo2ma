import { isInServiceArea, userPrefsSchema, workplaceAt, type UserPrefs } from '@lo2ma/core';
import { http, HttpResponse } from 'msw';
import { places } from '../data/places';
import { readDb, writeDb } from '../store';
import { fail, readBody, route } from './respond';

/**
 * Preferences saved before workplaces had a point on the map held only a place id. They come back as that place,
 * so nobody has to onboard again; anything else that no longer fits is treated as never saved.
 */
function upgrade(saved: unknown): UserPrefs | null {
  const current = userPrefsSchema.safeParse(saved);
  if (current.success) return current.data;
  const old = saved as { workplace?: { id?: string } } | null;
  const place = places.find(({ id }) => id === old?.workplace?.id);
  if (!place) return null;
  const upgraded = userPrefsSchema.safeParse({
    ...old,
    workplace: workplaceAt(place, place.point),
  });
  return upgraded.success ? upgraded.data : null;
}

export const prefsHandlers = [
  http.get(route('/prefs'), () => {
    const prefs = upgrade(readDb().prefs);
    return prefs ? HttpResponse.json(prefs) : fail(404, 'not_onboarded');
  }),

  http.put(route('/prefs'), async ({ request }) => {
    const prefs = await readBody(request, userPrefsSchema);
    if (!prefs) return fail(400, 'invalid_prefs');
    if (!isInServiceArea(prefs.workplace.point)) return fail(422, 'outside_service_area');
    // New preferences change the week, so the draft plan is rebuilt next time.
    writeDb((db) => ({ ...db, prefs, plan: db.plan?.confirmed ? db.plan : null }));
    return HttpResponse.json(prefs);
  }),
];

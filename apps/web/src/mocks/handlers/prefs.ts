import { userPrefsSchema } from '@lo2ma/core';
import { http, HttpResponse } from 'msw';
import { workplaces } from '../data/workplaces';
import { readDb, writeDb } from '../store';
import { fail, readBody, route } from './respond';

export const prefsHandlers = [
  http.get(route('/workplaces'), () => HttpResponse.json(workplaces)),

  http.get(route('/prefs'), () => {
    const { prefs } = readDb();
    return prefs ? HttpResponse.json(prefs) : fail(404, 'not_onboarded');
  }),

  http.put(route('/prefs'), async ({ request }) => {
    const prefs = await readBody(request, userPrefsSchema);
    if (!prefs) return fail(400, 'invalid_prefs');
    // New preferences change the week, so the draft plan is rebuilt next time.
    writeDb((db) => ({ ...db, prefs, plan: db.plan?.confirmed ? db.plan : null }));
    return HttpResponse.json(prefs);
  }),
];

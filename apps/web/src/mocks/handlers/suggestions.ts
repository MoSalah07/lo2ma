import { http, HttpResponse } from 'msw';
import { mealBreakdown } from '../engine/breakdown';
import { dishesFromId, suggestionFromId } from '../engine/suggest';
import { fail, route } from './respond';

export const suggestionHandlers = [
  http.get(route('/suggestions/:id'), ({ params }) => {
    const suggestion = suggestionFromId(String(params.id));
    return suggestion ? HttpResponse.json(suggestion) : fail(404, 'suggestion_not_found');
  }),

  http.get(route('/suggestions/:id/nutrition'), ({ params }) => {
    const breakdown = mealBreakdown(String(params.id));
    return breakdown ? HttpResponse.json(breakdown) : fail(404, 'suggestion_not_found');
  }),

  // «الطبق جالك مختلف؟»: the backend queues the meal's estimated dishes for review (phase 3).
  http.post(route('/suggestions/:id/nutrition/report'), ({ params }) =>
    dishesFromId(String(params.id))
      ? new HttpResponse(null, { status: 202 })
      : fail(404, 'suggestion_not_found'),
  ),
];

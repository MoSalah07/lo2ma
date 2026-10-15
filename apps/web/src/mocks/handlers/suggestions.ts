import { http, HttpResponse } from 'msw';
import { suggestionFromId } from '../engine/suggest';
import { fail, route } from './respond';

export const suggestionHandlers = [
  http.get(route('/suggestions/:id'), ({ params }) => {
    const suggestion = suggestionFromId(String(params.id));
    return suggestion ? HttpResponse.json(suggestion) : fail(404, 'suggestion_not_found');
  }),
];

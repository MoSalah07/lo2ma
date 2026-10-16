import {
  chatRequestSchema,
  transcriptionSchema,
  VOICE_MAX_BYTES,
  type ChatEvent,
  type Ingredient,
} from '@lo2ma/core';
import { delay, http, HttpResponse } from 'msw';
import { parseMessage } from '../engine/parse-message';
import { replyText } from '../engine/reply';
import { suggestMeals } from '../engine/suggest';
import { readDb, writeDb } from '../store';
import { fail, readBody, route } from './respond';

/** What the demo "hears" in any voice message. */
const DEMO_TRANSCRIPTS = { ar: 'معايا 150 ومش عايز فراخ', en: 'I have 150, no chicken please' };

const encoder = new TextEncoder();
const sseFrame = (event: ChatEvent) => encoder.encode(`data: ${JSON.stringify(event)}\n\n`);

/** Streams the reply word by word, like an LLM, then the suggestions. FastAPI will send the same events. */
function streamReply(text: string, events: ChatEvent[]) {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const word of text.split(/(?<=\s)/)) {
        controller.enqueue(sseFrame({ type: 'token', text: word }));
        await delay(35);
      }
      for (const event of events) controller.enqueue(sseFrame(event));
      controller.enqueue(sseFrame({ type: 'done' }));
      controller.close();
    },
  });
}

export const chatHandlers = [
  http.post(route('/chat'), async ({ request }) => {
    const body = await readBody(request, chatRequestSchema);
    if (!body) return fail(400, 'invalid_message');

    const parsed = parseMessage(body.message);
    const db = readDb();
    const budget = parsed.budget ?? db.prefs?.budget;
    const exclusions = [
      ...new Set<Ingredient>([...(db.prefs?.exclusions ?? []), ...parsed.exclusions]),
    ];
    const preferredKcal = db.prefs?.calories.mode === 'any' ? undefined : db.prefs?.calories.kcal;

    const suggestions = budget
      ? suggestMeals({
          budget,
          exclusions,
          caloriesMax: parsed.caloriesMax ?? (parsed.wantsLighter ? 600 : preferredKcal),
          below: parsed.wantsCheaper ? (db.lastCheapest ?? undefined) : undefined,
        })
      : [];
    writeDb((state) => ({
      ...state,
      lastCheapest: suggestions[0]?.bill.total ?? state.lastCheapest,
    }));

    const text = replyText(body.locale, suggestions.length, budget === undefined);
    const stream = streamReply(text, [{ type: 'suggestions', suggestions, budget }]);
    return new HttpResponse(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  }),

  // Phase 3 sends the audio to a speech-to-text model chosen by evals. The demo hears the same sentence
  // every time, after a short wait, and an empty recording is silence.
  http.post(route('/chat/transcribe'), async ({ request }) => {
    const form = await request.formData().catch(() => null);
    const audio = form?.get('audio');
    if (!(audio instanceof Blob)) return fail(400, 'invalid_audio');
    if (audio.size > VOICE_MAX_BYTES) return fail(413, 'audio_too_large');
    if (audio.size === 0) return fail(422, 'no_speech');
    await delay(600);
    const locale = form?.get('locale') === 'en' ? 'en' : 'ar';
    return HttpResponse.json(transcriptionSchema.parse({ text: DEMO_TRANSCRIPTS[locale] }));
  }),
];

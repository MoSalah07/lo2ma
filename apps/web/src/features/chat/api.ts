import { transcriptionSchema } from '@lo2ma/core';
import type { Locale } from '@lo2ma/i18n/locales';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

/**
 * Sends a recording to be written down. In the chat the text comes back for the user to check before sending;
 * on a call it goes to the agent, the way speaking on a phone call does.
 */
export function useTranscribe() {
  return useMutation({
    mutationFn: ({ audio, locale }: { audio: Blob; locale: Locale }) => {
      const form = new FormData();
      form.append('audio', audio, 'voice');
      form.append('locale', locale);
      return api('/chat/transcribe', transcriptionSchema, { method: 'POST', body: form });
    },
  });
}

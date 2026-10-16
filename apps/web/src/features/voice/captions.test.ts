import { describe, expect, it } from 'vitest';
import type { ChatMessage } from '@/features/chat/store';
import { captionsFor } from './captions';

const user = (text: string): ChatMessage => ({ id: text, role: 'user', text, status: 'done' });
const agent = (text: string, status: ChatMessage['status'] = 'done'): ChatMessage => ({
  id: text,
  role: 'agent',
  text,
  status,
});

describe('captionsFor', () => {
  it('shows nothing said yet before the first turn', () => {
    expect(captionsFor('listening', [])).toEqual({ before: undefined, suggestion: undefined });
  });

  it('keeps the last reply on top while listening for the next turn', () => {
    const messages = [user('معايا 150'), agent('لقيتلك كشري')];
    expect(captionsFor('listening', messages).before).toBe('لقيتلك كشري');
  });

  it('shows the reply as it streams, under what the user said', () => {
    const messages = [user('معايا 150'), agent('لقيتلك', 'streaming')];
    expect(captionsFor('thinking', messages)).toMatchObject({
      before: 'معايا 150',
      now: 'لقيتلك',
    });
  });

  it('does not show the previous reply as new while the words are still being written down', () => {
    const messages = [user('معايا 150'), agent('لقيتلك كشري')];
    expect(captionsFor('thinking', messages).now).toBeUndefined();
  });

  it('reads out the whole reply while speaking', () => {
    const messages = [user('أرخص من كده'), agent('لقيت فول')];
    expect(captionsFor('speaking', messages)).toMatchObject({
      before: 'أرخص من كده',
      now: 'لقيت فول',
    });
  });
});

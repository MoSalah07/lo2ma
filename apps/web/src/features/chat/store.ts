import type { Piasters, Suggestion } from '@lo2ma/core';
import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
  status: 'streaming' | 'done' | 'error';
  suggestions?: Suggestion[];
  /** The budget the agent used, to show how much each meal leaves. */
  budget?: Piasters;
}

interface ChatState {
  messages: ChatMessage[];
  add: (message: ChatMessage) => void;
  update: (id: string, change: (message: ChatMessage) => ChatMessage) => void;
}

/**
 * The conversation lives outside the chat screen, so it survives a visit to a meal's details and back.
 * It is per tab and not saved: a reload starts a fresh chat.
 */
export const useChatStore = create<ChatState>()((set) => ({
  messages: [],
  add: (message) => set((state) => ({ messages: [...state.messages, message] })),
  update: (id, change) =>
    set((state) => ({
      messages: state.messages.map((message) => (message.id === id ? change(message) : message)),
    })),
}));

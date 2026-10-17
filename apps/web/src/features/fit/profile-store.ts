import { bodyProfileSchema, type BodyProfile } from '@lo2ma/core';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface BodyProfileState {
  profile: BodyProfile | null;
  remember: (profile: BodyProfile) => void;
}

/**
 * The calculator's answers, kept in this browser only (localStorage), so the goal can be worked out again next
 * time. They never reach the server: it only gets the goal.
 */
export const useBodyProfile = create<BodyProfileState>()(
  persist((set) => ({ profile: null, remember: (profile) => set({ profile }) }), {
    name: 'lo2ma.body-profile',
    storage: createJSONStorage(() => localStorage),
    // Whatever an older version saved, or someone edited by hand, is dropped rather than trusted.
    merge: (saved, current) => {
      const parsed = bodyProfileSchema.safeParse((saved as { profile?: unknown } | null)?.profile);
      return { ...current, profile: parsed.success ? parsed.data : null };
    },
  }),
);

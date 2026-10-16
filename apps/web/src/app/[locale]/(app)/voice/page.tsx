import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ClientMessages } from '@/components/client-messages';
import { VoiceScreen } from '@/features/voice/voice-screen';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('voiceMode');
  return { title: t('title') };
}

export default function VoicePage() {
  return (
    <ClientMessages namespaces={['common', 'chat', 'voiceMode', 'auth']}>
      <main className="flex flex-1 flex-col">
        <VoiceScreen />
      </main>
    </ClientMessages>
  );
}

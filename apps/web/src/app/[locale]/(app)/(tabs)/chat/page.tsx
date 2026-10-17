import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ClientMessages } from '@/components/client-messages';
import { ChatScreen } from '@/features/chat/chat-screen';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return { title: t('chat') };
}

export default function ChatPage() {
  return (
    <ClientMessages namespaces={['common', 'chat', 'bill', 'format', 'prefs', 'auth', 'location']}>
      <ChatScreen />
    </ClientMessages>
  );
}

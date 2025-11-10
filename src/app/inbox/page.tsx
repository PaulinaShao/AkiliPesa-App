export const dynamic = 'force-dynamic';

import { getConversations } from '@/lib/data';
import { InboxClient } from './InboxClient';

export default async function InboxPage() {
  const { conversations } = await getConversations();
  return <InboxClient initialConversations={conversations} />;
}

export const dynamic = 'force-dynamic';

import { InboxClient } from './InboxClient';

export default async function InboxPage() {
  // The initialConversations are now fetched on the client to prevent race conditions.
  // We pass an empty array to the client component, which will handle loading.
  return <InboxClient initialConversations={[]} />;
}

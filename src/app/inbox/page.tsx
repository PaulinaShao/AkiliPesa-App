
import { getConversations } from '@/lib/data';
import { InboxClient } from './InboxClient';

// This is now a Server Component
export default async function InboxPage() {
    // Fetch data on the server
    const { conversations, users } = await getConversations();

    // Pass the fetched data to the Client Component
    return <InboxClient initialConversations={conversations} initialUsers={users} />;
}

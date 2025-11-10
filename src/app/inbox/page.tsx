'use client';
export const dynamic = "force-dynamic";

import { getConversations } from '@/lib/data';
import { InboxClient } from './InboxClient';

// This is now a Server Component
export default async function InboxPage() {
    // Fetch only the conversation data on the server.
    const { conversations } = await getConversations();

    // Pass the initial data to the Client Component, which will handle fetching user profiles.
    return <InboxClient initialConversations={conversations} />;
}

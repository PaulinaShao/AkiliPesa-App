
import { Header } from '@/components/header';
import { getPostsAndUsers } from '@/lib/data';
import HomePageClient from './HomePageClient';

// This is now a Next.js Server Component
export default async function Home() {
  // Fetch data directly on the server
  const { posts, users } = await getPostsAndUsers();

  // The Header can remain here if it doesn't need client-side interactivity
  // that depends on state from the page, or it can be moved to the client component.
  // For simplicity, we'll let HomePageClient handle its own state.
  return <HomePageClient initialPosts={posts} initialUsers={users} />;
}


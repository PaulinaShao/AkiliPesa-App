import { collection, getDocs, getFirestore, query } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/server-init';
import type { Post, Message } from './definitions';
import type { UserProfile } from 'docs/backend';

// Initialize Firebase for server-side usage.
const { firestore } = initializeFirebase();

/**
 * Fetches all posts and their corresponding author profiles from Firestore.
 * This function is designed to run on the server.
 */
export async function getPostsAndUsers(): Promise<{ posts: Post[], users: UserProfile[] }> {
  const postsCollection = collection(firestore, 'posts');
  const postsSnapshot = await getDocs(postsCollection);
  const posts: Post[] = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));

  const usersCollection = collection(firestore, 'users');
  const usersSnapshot = await getDocs(usersCollection);
  const users: UserProfile[] = usersSnapshot.docs.map(doc => ({ ...doc.data() } as UserProfile));
  
  return { posts, users };
}


/**
 * Fetches all conversations and the necessary user data for the inbox.
 */
export async function getConversations(): Promise<{ conversations: Message[], users: UserProfile[] }> {
  // In a real app, you would fetch conversations for the current user.
  // For now, we simulate this by fetching a few conversations and users.
  // This function is designed to replace the static data import.

  const usersCollection = collection(firestore, 'users');
  const usersSnapshot = await getDocs(usersCollection);
  const users: UserProfile[] = usersSnapshot.docs.map(doc => ({ ...doc.data() } as UserProfile));

  // Simulating conversation data. Replace with real Firestore query.
  const simulatedConversations: Message[] = [
    {
      id: "convo-1",
      senderId: "u2",
      receiverId: "u1",
      text: "Hey, saw your latest video, great stuff!",
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      unread: true
    },
    {
      id: "convo-2",
      senderId: "u1",
      receiverId: "u3",
      text: "Let's collaborate on a project next week.",
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    }
  ];

  return { conversations: simulatedConversations, users };
}

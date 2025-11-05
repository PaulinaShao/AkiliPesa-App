
import { collection, getDocs, getFirestore, query, where, documentId } from 'firebase/firestore';
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

  const authorIds = [...new Set(posts.map(post => post.authorId).filter(id => !!id))];

  let users: UserProfile[] = [];

  // Firestore 'in' queries are limited to 30 items.
  // We process in chunks if there are more than 30 authors.
  if (authorIds.length > 0) {
    const usersCollection = collection(firestore, 'users');
    const userChunks: string[][] = [];
    for (let i = 0; i < authorIds.length; i += 30) {
        userChunks.push(authorIds.slice(i, i + 30));
    }

    const userPromises = userChunks.map(chunk => 
        getDocs(query(usersCollection, where(documentId(), 'in', chunk)))
    );

    const userSnapshots = await Promise.all(userPromises);
    userSnapshots.forEach(snapshot => {
        snapshot.forEach(doc => {
            users.push({ ...doc.data() } as UserProfile);
        });
    });
  }
  
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
  // To avoid permission errors, we fetch a limited number of users instead of all of them
  const usersQuery = query(usersCollection, where('email', '!=', ''));
  const usersSnapshot = await getDocs(usersQuery);
  const users: UserProfile[] = usersSnapshot.docs.map(doc => ({ ...doc.data() } as UserProfile));

  // Simulating conversation data. Replace with real Firestore query.
  const simulatedConversations: Message[] = [
    {
      id: "convo-1",
      senderId: users.length > 1 ? users[1].uid : "u2",
      receiverId: users.length > 0 ? users[0].uid : "u1",
      text: "Hey, saw your latest video, great stuff!",
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      unread: true
    },
    {
      id: "convo-2",
      senderId: users.length > 0 ? users[0].uid : "u1",
      receiverId: users.length > 2 ? users[2].uid : "u3",
      text: "Let's collaborate on a project next week.",
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    }
  ];

  return { conversations: simulatedConversations, users };
}

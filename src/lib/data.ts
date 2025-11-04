import { collection, getDocs, getFirestore, query } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/server-init';
import type { Post } from './definitions';
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
  const users: UserProfile[] = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
  
  return { posts, users };
}

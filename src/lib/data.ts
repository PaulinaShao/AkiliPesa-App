
import { collection, getDocs, getFirestore, query, where, documentId, Timestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/server-init';
import type { Post, Message } from './definitions';
import type { UserProfile } from 'docs/backend';

// Initialize Firebase for server-side usage.
const { firestore } = initializeFirebase();

/**
 * Converts Firestore Timestamps in an object to ISO strings.
 * @param obj The object to process.
 * @returns A new object with Timestamps converted to strings.
 */
function convertTimestamps<T extends object>(obj: T): any {
    const newObj: any = {};
    for (const key in obj) {
        const value = (obj as any)[key];
        if (value instanceof Timestamp) {
            newObj[key] = value.toDate().toISOString();
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            newObj[key] = convertTimestamps(value);
        } else {
            newObj[key] = value;
        }
    }
    return newObj;
}


/**
 * Fetches all posts and their corresponding author profiles from Firestore.
 * This function is designed to run on the server.
 */
export async function getPostsAndUsers(): Promise<{ posts: Post[], users: UserProfile[] }> {
  const postsCollection = collection(firestore, 'posts');
  const postsSnapshot = await getDocs(postsCollection);
  const posts: Post[] = postsSnapshot.docs.map(doc => convertTimestamps({ id: doc.id, ...doc.data() } as Post));

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
            users.push(convertTimestamps({ ...doc.data(), uid: doc.id } as UserProfile));
        });
    });
  }
  
  return { posts, users };
}


/**
 * Fetches conversations for the inbox. This is a simplified simulation.
 * In a real app, you would query a 'conversations' collection for the current user.
 */
export async function getConversations(): Promise<{ conversations: Message[], users: UserProfile[] }> {
  // This function is simplified for the demo. It no longer fetches all users.
  // The client will be responsible for fetching the user profiles it needs.

  // Simulate fetching a list of conversations for the current user.
  // In a real app, this would be a Firestore query like:
  // query(collection(firestore, 'users', currentUserId, 'conversations'))
  const simulatedConversations: Message[] = [
    {
      id: "convo-1",
      // These UIDs would come from your database. For the demo, we'll use placeholders.
      senderId: "user-placeholder-2",
      receiverId: "user-placeholder-1",
      text: "Hey, saw your latest video, great stuff!",
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      unread: true
    },
    {
      id: "convo-2",
      senderId: "user-placeholder-1",
      receiverId: "user-placeholder-3",
      text: "Let's collaborate on a project next week.",
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    }
  ];

  // We return an empty user list. The client will fetch the profiles.
  return { conversations: simulatedConversations, users: [] };
}

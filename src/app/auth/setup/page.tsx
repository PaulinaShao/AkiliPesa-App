
'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, useFirebaseUser, useFirestore } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Single source of truth:
 * - If no user: go to /auth/login
 * - If user has no profile doc: create a minimal one once
 * - Then always route to /profile (or the saved post-login redirect)
 */
export default function SetupPage() {
  const router = useRouter();
  const search = useSearchParams();
  const { user, isUserLoading } = useFirebaseUser();
  const firestore = useFirestore();
  const onceRef = useRef(false);

  useEffect(() => {
    if (onceRef.current) return;
    if (isUserLoading) return;

    if (!user) {
      router.replace('/auth/login');
      return;
    }

    const run = async () => {
      if (!firestore) return;

      const uid = user.uid;
      const ref = doc(firestore, 'users', uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        await setDoc(ref, {
          uid,
          displayName: user.displayName || '',
          handle: (user.displayName || 'user').replace(/\s+/g, ''),
          photoURL: user.photoURL || '',
          bio: '',
          stats: { followers: 0, following: 0, likes: 0, postsCount: 0 },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }

      onceRef.current = true;

      // Optional: support ?redirect=<path> passed from login
      const next = search.get('redirect');
      router.replace(next ? decodeURIComponent(next) : '/profile');
    };

    run().catch(() => router.replace('/profile'));
  }, [user, isUserLoading, firestore, router, search]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background dark">
      <p>Preparing your profile...</p>
    </div>
  );
}

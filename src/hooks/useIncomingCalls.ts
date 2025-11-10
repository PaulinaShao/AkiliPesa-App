
'use client';

import { useState, useEffect } from 'react';
import { useFirebaseUser, useFirestore } from '@/firebase';
import { doc, onSnapshot, deleteDoc } from 'firebase/firestore';

interface CallInvite {
    callerId: string;
    callerName: string;
    channelName: string;
    sessionId: string;
    mode: 'audio' | 'video';
    status: 'ringing' | 'answered' | 'declined';
}

export function useIncomingCalls() {
  const { user, isUserLoading } = useFirebaseUser();
  const firestore = useFirestore();
  const [call, setCall] = useState<CallInvite | null>(null);

  useEffect(() => {
    if (!user || !firestore || isUserLoading) {
      return;
    }

    const inviteRef = doc(firestore, 'callInvites', user.uid);
    const unsubscribe = onSnapshot(inviteRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as CallInvite;
        if (data.status === 'ringing') {
          setCall(data);
        } else {
          setCall(null);
        }
      } else {
        setCall(null);
      }
    });

    return () => unsubscribe();
  }, [user, firestore, isUserLoading]);

  const accept = async () => {
    if (!user || !firestore || !call) return;
    const inviteRef = doc(firestore, 'callInvites', user.uid);
    await deleteDoc(inviteRef); // Or update status to 'answered'
    setCall(null);
  };

  const reject = async () => {
    if (!user || !firestore || !call) return;
    const inviteRef = doc(firestore, 'callInvites', user.uid);
    await deleteDoc(inviteRef);
    setCall(null);
  };

  return { call, accept, reject };
}

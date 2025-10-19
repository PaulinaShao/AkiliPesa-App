
'use client';

import { useEffect, useState, useRef } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useFirebaseUser, useFirestore } from '@/firebase';

type SessionState = {
  sessionId: string;
  agentId: string | null;
  mode: 'audio' | 'video' | 'chat';
  lastMessage?: string;
  isActive: boolean;
  lastUpdated: number;
};

export default function useSessionManager(agentId?: string, mode: 'audio' | 'video' | 'chat' = 'chat') {
  const { user, isUserLoading } = useFirebaseUser();
  const firestore = useFirestore();
  const [session, setSession] = useState<SessionState | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionRef = useRef<string | null>(null);

  useEffect(() => {
    if (isUserLoading || !firestore) return;

    const initSession = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const userSessionRef = doc(firestore, "aiSessions", user.uid);
      const snapshot = await getDoc(userSessionRef);

      if (snapshot.exists()) {
        const data = snapshot.data() as SessionState;
        // If the agentId or mode is different, we might want to start a new session
        // For now, we'll resume the existing one.
        sessionRef.current = data.sessionId;
        setSession(data);
      } else {
        const newSessionId = `${user.uid}-${Date.now()}`;
        const newSession: SessionState = {
          sessionId: newSessionId,
          agentId: agentId || 'akilipesa-ai',
          mode,
          isActive: true,
          lastUpdated: Date.now(),
        };
        await setDoc(userSessionRef, { ...newSession, createdAt: serverTimestamp() });
        sessionRef.current = newSession.sessionId;
        setSession(newSession);
      }

      setLoading(false);
    };

    initSession();
  }, [user, isUserLoading, firestore, agentId, mode]);

  const updateSession = async (updates: Partial<Omit<SessionState, 'sessionId'>>) => {
    if (!user || !sessionRef.current || !firestore) return;

    const currentSessionState = { ...session, ...updates, lastUpdated: Date.now() };

    const ref = doc(firestore, 'aiSessions', user.uid);
    await setDoc(ref, currentSessionState, { merge: true });
    
    setSession(prev => {
        if (!prev) return null;
        return { ...prev, ...updates, lastUpdated: Date.now() };
    });
  };

  return { session, loading, updateSession };
}

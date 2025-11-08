
'use client';

import { useEffect, useState, useRef } from 'react';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useFirebaseUser, useFirestore } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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
      
      try {
        const snapshot = await getDoc(userSessionRef);

        if (snapshot.exists()) {
          const data = snapshot.data() as SessionState;
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
          
          const dataToSet = { ...newSession, createdAt: serverTimestamp(), userId: user.uid };

          // Use non-blocking write with contextual error handling
          setDoc(userSessionRef, dataToSet).catch(error => {
            const contextualError = new FirestorePermissionError({
              path: userSessionRef.path,
              operation: 'create',
              requestResourceData: dataToSet
            });
            errorEmitter.emit('permission-error', contextualError);
          });

          sessionRef.current = newSession.sessionId;
          setSession(newSession);
        }
      } catch (error) {
         const contextualError = new FirestorePermissionError({
            path: userSessionRef.path,
            operation: 'get',
          });
          errorEmitter.emit('permission-error', contextualError);
      } finally {
         setLoading(false);
      }
    };

    initSession();
  }, [user, isUserLoading, firestore, agentId, mode]);

  const updateSession = (updates: Partial<Omit<SessionState, 'sessionId'>>) => {
    if (!user || !sessionRef.current || !firestore) return;

    const updatesWithTimestamp = { ...updates, lastUpdated: Date.now() };
    const fullSessionData = { ...session, ...updatesWithTimestamp };

    const ref = doc(firestore, 'aiSessions', user.uid);
    
    // Use non-blocking write with contextual error handling
    updateDoc(ref, updatesWithTimestamp).catch(error => {
        const contextualError = new FirestorePermissionError({
            path: ref.path,
            operation: 'update',
            requestResourceData: updatesWithTimestamp
        });
        errorEmitter.emit('permission-error', contextualError);
    });
    
    setSession(prev => {
        if (!prev) return null;
        return { ...prev, ...updatesWithTimestamp };
    });
  };

  return { session, loading, updateSession };
}

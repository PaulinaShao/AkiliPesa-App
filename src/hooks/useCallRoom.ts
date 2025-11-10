'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useFirestore, useFirebaseUser } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { httpsCallable } from 'firebase/functions';

export type Participant = {
  uid: string;
  role: 'host' | 'guest';
  joinedAt: any;
  muted: boolean;
  cameraOn: boolean;
  volume?: number;
};

export type CallRoom = {
  id: string;
  hostId: string;
  channelName: string;
  mode: 'audio' | 'video';
  roomType: 'classroom' | 'meeting' | 'live';
  layoutMode: 'grid' | 'spotlight' | 'speaker';
  participants: Participant[];
  startedAt: any;
  endedAt: any | null;
};

export function useCallRoom(callId: string) {
  const firestore = useFirestore();
  const { functions } = useFirebaseUser();
  const { user } = useFirebaseUser();
  const [room, setRoom] = useState<CallRoom | null>(null);
  const [loading, setLoading] = useState(true);

  const callRoomRef = useMemoFirebase(() => {
    if (!firestore || !callId) return null;
    return doc(firestore, 'callRooms', callId);
  }, [firestore, callId]);

  useEffect(() => {
    if (!callRoomRef) {
      setLoading(false);
      return;
    }
    const unsubscribe = onSnapshot(callRoomRef, (snap) => {
      if (snap.exists()) {
        setRoom({ id: snap.id, ...snap.data() } as CallRoom);
      } else {
        setRoom(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [callRoomRef]);

  const isHost = user?.uid === room?.hostId;
  const participants = room?.participants || [];

  const setLayoutMode = async (layoutMode: 'grid' | 'spotlight' | 'speaker') => {
    if (!functions || !isHost) return;
    const updateLayout = httpsCallable(functions, 'updateLayoutMode');
    await updateLayout({ callId, layoutMode });
  };
  
  const invite = async (calleeId: string) => {
      if (!functions) return;
      const inviteFn = httpsCallable(functions, 'inviteToCall');
      await inviteFn({ callId, calleeId });
  }

  return { room, participants, isHost, loading, setLayoutMode, invite };
}

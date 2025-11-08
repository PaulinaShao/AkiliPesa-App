'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import AgoraRTC, { IAgoraRTCClient, ILocalAudioTrack, IRemoteAudioTrack, IRemoteVideoTrack, IRemoteUser } from 'agora-rtc-sdk-ng';
import { httpsCallable } from 'firebase/functions';
import { useFirebase } from '@/firebase';

type RemoteUserMedia = {
  uid: string;
  audioTrack?: IRemoteAudioTrack | null;
  videoTrack?: IRemoteVideoTrack | null;
};

export function useAgoraCall() {
  const { functions } = useFirebase();
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const micRef = useRef<ILocalAudioTrack | null>(null);
  const [joined, setJoined] = useState(false);
  const [channelName, setChannelName] = useState<string | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<RemoteUserMedia[]>([]);
  const [callId, setCallId] = useState<string | null>(null);
  const [appId, setAppId] = useState<string | null>(null);

  // helpers
  const addOrUpdateRemote = (user: IRemoteUser) => {
    setRemoteUsers(prev => {
      const idx = prev.findIndex(u => u.uid === String(user.uid));
      const entry: RemoteUserMedia = {
        uid: String(user.uid),
        audioTrack: user.audioTrack ?? null,
        videoTrack: user.videoTrack ?? null,
      };
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...entry };
        return next;
      }
      return [...prev, entry];
    });
  };

  const join = useCallback(async ({ agentId, agentType = 'admin', mode = 'audio' as 'audio'|'video' }) => {
    if (joined || !functions) return;

    const getAgoraToken = httpsCallable(functions, 'getAgoraToken');
    const { data } = await getAgoraToken({ agentId, agentType, mode }) as any;
    const { token, channelName: ch, callId: cid, appId: aid } = data;
    setChannelName(ch);
    setCallId(cid);
    setAppId(aid);

    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    clientRef.current = client;

    client.on('user-published', async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      if (mediaType === 'audio' && user.audioTrack) user.audioTrack.play();
      addOrUpdateRemote(user);
    });

    client.on('user-unpublished', (user) => addOrUpdateRemote(user));
    client.on('user-left', (user) => {
      setRemoteUsers(prev => prev.filter(u => u.uid !== String(user.uid)));
    });

    await client.join(aid, ch, token, null);

    // mic
    const mic = await AgoraRTC.createMicrophoneAudioTrack();
    micRef.current = mic;
    await client.publish([mic]);

    setJoined(true);
    return { channelName: ch, callId: cid };
  }, [joined, functions]);

  const leave = useCallback(async () => {
    if (!clientRef.current) return;
    if (micRef.current) {
      micRef.current.stop();
      micRef.current.close();
      micRef.current = null;
    }
    await clientRef.current.leave();
    clientRef.current.removeAllListeners();
    clientRef.current = null;
    setJoined(false);
    setChannelName(null);
    setRemoteUsers([]);
    setCallId(null);
  }, []);

  return { joined, channelName, callId, remoteUsers, join, leave };
}

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { IAgoraRTCClient, IRemoteAudioTrack, IRemoteVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { httpsCallable } from 'firebase/functions';
import { useFirebase } from '@/firebase';

type RemoteUser = {
  uid: string;
  audio?: IRemoteAudioTrack | null;
  video?: IRemoteVideoTrack | null;
};

type UseAgoraCallOptions = {
  mode?: 'rtc' | 'live';
  codec?: 'vp8' | 'h264';
  role?: 'host' | 'audience';
  agentId?: string; // optional: the admin/agent to connect to
  agentType?: 'admin' | 'user';
  callMode?: 'audio' | 'video';
};

export function useAgoraCall(opts: UseAgoraCallOptions = {}) {
  const { functions } = useFirebase();
  const { mode = 'rtc', codec = 'vp8', role = 'host', agentId, agentType = 'admin', callMode = 'audio' } = opts;

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localMicRef = useRef<IMicrophoneAudioTrack | null>(null);
  const joinedRef = useRef(false);

  const [appId, setAppId] = useState<string>('');
  const [channelName, setChannelName] = useState<string>('');
  const [callId, setCallId] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [uid, setUid] = useState<string>('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);

  // Lazily create client
  const client = useMemo(() => {
    if (!clientRef.current) {
      clientRef.current = AgoraRTC.createClient({ mode, codec });
    }
    return clientRef.current!;
  }, [mode, codec]);

  // Subscribe handlers
  useEffect(() => {
    const onUserPublished = async (user: any, mediaType: 'audio' | 'video') => {
      await client.subscribe(user, mediaType);
      setRemoteUsers((prev) => {
        const existing = prev.find((u) => u.uid === String(user.uid));
        const updated: RemoteUser = {
          uid: String(user.uid),
          audio: mediaType === 'audio' ? (user.audioTrack as IRemoteAudioTrack) : existing?.audio,
          video: mediaType === 'video' ? (user.videoTrack as IRemoteVideoTrack) : existing?.video,
        };
        const others = prev.filter((u) => u.uid !== String(user.uid));
        return [updated, ...others];
      });

      if (mediaType === 'audio' && user.audioTrack) {
        // Play remote audio
        (user.audioTrack as IRemoteAudioTrack).play();
      }
    };

    const onUserUnpublished = (user: any, mediaType: 'audio' | 'video') => {
      setRemoteUsers((prev) => {
        const existing = prev.find((u) => u.uid === String(user.uid));
        if (!existing) return prev;
        const updated: RemoteUser = {
          uid: existing.uid,
          audio: mediaType === 'audio' ? undefined : existing.audio,
          video: mediaType === 'video' ? undefined : existing.video,
        };
        const others = prev.filter((u) => u.uid !== String(user.uid));
        return [updated, ...others];
      });
    };

    client.on('user-published', onUserPublished);
    client.on('user-unpublished', onUserUnpublished);

    return () => {
      client.off('user-published', onUserPublished);
      client.off('user-unpublished', onUserUnpublished);
    };
  }, [client]);

  const getToken = useCallback(async () => {
    // Uses your callable getAgoraToken (already in your functions/index.ts)
    const callable = httpsCallable(functions, 'getAgoraToken');
    const res: any = await callable({
      agentId: agentId ?? 'akili-admin',
      agentType, // 'admin' (supported today)
      mode: callMode, // 'audio' | 'video'
    });
    setToken(res.data.token);
    setChannelName(res.data.channelName);
    setCallId(res.data.callId);
    setAppId(res.data.appId);
    // We let Agora pick uid (0 = auto) on join; store after join
    return { token: res.data.token, channelName: res.data.channelName, appId: res.data.appId };
  }, [agentId, agentType, callMode, functions]);

  const join = useCallback(async () => {
    if (joinedRef.current) return;
    const { token, channelName, appId } = await getToken();

    const joinUid = await client.join(appId, channelName, token || null, null);
    setUid(String(joinUid));
    joinedRef.current = true;
    setIsJoined(true);

    if (role === 'host' || callMode === 'audio') {
      localMicRef.current = await AgoraRTC.createMicrophoneAudioTrack();
    }
  }, [client, role, callMode, getToken]);

  const publishMic = useCallback(async () => {
    if (!joinedRef.current || !localMicRef.current) return;
    await client.publish([localMicRef.current]);
    setIsPublishing(true);
    if (isMuted) {
      await localMicRef.current.setEnabled(false);
    }
  }, [client, isMuted]);

  const toggleMute = useCallback(async () => {
    if (!localMicRef.current) return;
    const next = !isMuted;
    await localMicRef.current.setEnabled(!next); // enabled=false => muted
    setIsMuted(next);
  }, [isMuted]);

  const leave = useCallback(async () => {
    try {
      if (localMicRef.current) {
        if (isPublishing) await client.unpublish([localMicRef.current]);
        localMicRef.current.close();
        localMicRef.current = null;
      }
      await client.leave();
    } finally {
      joinedRef.current = false;
      setIsJoined(false);
      setIsPublishing(false);
      setRemoteUsers([]);
    }
  }, [client, isPublishing]);

  // Kick off AI loop once joined (server side)
  const startAI = useCallback(async (sessionId: string) => {
    const callable = httpsCallable(functions, 'callSessionHandler');
    await callable({ sessionId });
  }, [functions]);

  return {
    appId,
    channelName,
    callId,
    uid,
    isJoined,
    isPublishing,
    isMuted,
    remoteUsers,
    join,
    publishMic,
    toggleMute,
    leave,
    startAI,
  };
}

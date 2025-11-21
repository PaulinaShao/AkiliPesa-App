// src/lib/agoraConnection.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  ILocalAudioTrack,
  ILocalVideoTrack,
  IRemoteUser,
} from 'agora-rtc-sdk-ng';

type UseAgoraConfig = {
  appId?: string | null;
  channelName?: string | null;
  token?: string | null;
  uid?: string | null;
  mode?: 'audio' | 'video';
};

export function useAgoraConnection(config: UseAgoraConfig) {
  const { appId, channelName, token, uid, mode = 'video' } = config;

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const [connected, setConnected] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<IRemoteUser[]>([]);
  const [localAudioTrack, setLocalAudioTrack] = useState<ILocalAudioTrack | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ILocalVideoTrack | null>(null);

  // Create client + join
  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!appId || !channelName || !token || !uid) return;
      if (clientRef.current) return;

      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;

      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        setRemoteUsers(Array.from(client.remoteUsers));
      });

      client.on('user-unpublished', () => {
        setRemoteUsers(Array.from(client.remoteUsers));
      });

      client.on('user-left', () => {
        setRemoteUsers(Array.from(client.remoteUsers));
      });

      try {
        await client.join(appId, channelName, token, uid);
        if (cancelled) return;
        setConnected(true);
      } catch (err) {
        console.error('Agora join failed:', err);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [appId, channelName, token, uid]);

  const publishAudio = useCallback(async () => {
    if (!clientRef.current || localAudioTrack) return;
    try {
      const track = await AgoraRTC.createMicrophoneAudioTrack();
      setLocalAudioTrack(track);
      await clientRef.current.publish(track);
    } catch (err) {
      console.error('Failed to publish audio:', err);
    }
  }, [localAudioTrack]);

  const publishVideo = useCallback(async () => {
    if (!clientRef.current || localVideoTrack) return localVideoTrack;
    try {
      const track = await AgoraRTC.createCameraVideoTrack();
      setLocalVideoTrack(track);
      await clientRef.current.publish(track);
      return track;
    } catch (err) {
      console.error('Failed to publish video:', err);
      return null;
    }
  }, [localVideoTrack]);

  const leave = useCallback(async () => {
    try {
      if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close();
      }
      if (localVideoTrack) {
        localVideoTrack.stop();
        localVideoTrack.close();
      }
      if (clientRef.current) {
        await clientRef.current.leave();
      }
    } catch (err) {
      console.error('Failed to leave Agora:', err);
    } finally {
      clientRef.current = null;
      setLocalAudioTrack(null);
      setLocalVideoTrack(null);
      setConnected(false);
      setRemoteUsers([]);
    }
  }, [localAudioTrack, localVideoTrack]);

  return {
    client: clientRef.current,
    connected,
    remoteUsers,
    localAudioTrack,
    localVideoTrack,
    publishAudio,
    publishVideo,
    leave,
  };
}

export default useAgoraConnection;

'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IRemoteVideoTrack,
  IRemoteAudioTrack,
  IRemoteUser,
} from 'agora-rtc-sdk-ng';
import { httpsCallable } from 'firebase/functions';
import { useFirebase } from '@/firebase';

type TokenResponse = { appId: string; token: string };
export type UseAgora = {
  client: IAgoraRTCClient | null;
  connected: boolean;
  publishVideo: () => Promise<ICameraVideoTrack | null>;
  publishAudio: () => Promise<IMicrophoneAudioTrack | null>;
  localVideoTrack: ICameraVideoTrack | null;
  leave: () => Promise<void>;
};

/**
 * Safe on Next 15: returns an inert stub on the server and the real
 * client implementation on the browser.
 */
export default function useAgoraConnection(channelName?: string | null): UseAgora {
  // SSR stub
  if (typeof window === 'undefined') {
    return {
      client: null,
      connected: false,
      publishVideo: async () => null,
      publishAudio: async () => null,
      localVideoTrack: null,
      leave: async () => {},
    };
  }

  const { functions } = useFirebase();
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [connected, setConnected] = useState(false);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);

  const channelRef = useRef<string | null>(channelName ?? null);
  channelRef.current = channelName ?? null;

  // Create client once
  const rtcClient = useMemo(() => {
    const c = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    setClient(c);
    return c;
  }, []);

  // Join/subscribe lifecycle
  useEffect(() => {
    if (!functions || !rtcClient || !channelRef.current) return;

    let mounted = true;
    const activeClient = rtcClient;

    const init = async () => {
      try {
        const getAgoraToken = httpsCallable(functions, 'getAgoraToken');
        const uid = Math.floor(Math.random() * 10_000);

        const { data } = await getAgoraToken({
          channelName: channelRef.current,
          uid,
          role: 'publisher',
        });

        const { appId, token } = data as TokenResponse;

        await activeClient.join(appId, channelRef.current!, token, uid);
        if (!mounted) return;

        setConnected(true);

        activeClient.on('user-published', async (user: IRemoteUser, mediaType) => {
          await activeClient.subscribe(user, mediaType);
          if (mediaType === 'video') {
            // You can create a DOM container on demand, or rely on a known id:
            const elId = `remote-player-${user.uid}`;
            let el = document.getElementById(elId);
            if (!el) {
              el = document.createElement('div');
              el.id = elId;
              el.style.width = '100%';
              el.style.height = '100%';
              document.body.appendChild(el); // or mount inside your call UI container
            }
            (user.videoTrack as IRemoteVideoTrack | null)?.play(elId);
          }
          if (mediaType === 'audio') {
            (user.audioTrack as IRemoteAudioTrack | null)?.play();
          }
        });

        activeClient.on('connection-state-change', (cur) => {
          setConnected(cur === 'CONNECTED');
        });
      } catch (e) {
        console.error('[Agora] join failed:', e);
        setConnected(false);
      }
    };

    init();

    return () => {
      mounted = false;
      // Cleanup handles in leave() below; we still ensure tracks are closed.
      (async () => {
        try {
          // Close local tracks if any
          localVideoTrack?.close();
          localAudioTrackRef.current?.close();
          // Leave if still joined
          if (activeClient.connectionState !== 'DISCONNECTED') {
            await activeClient.leave();
          }
        } catch (_) {}
      })();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [functions, rtcClient, channelRef.current]);

  const publishVideo = useCallback(async () => {
    if (!client) return null;
    if (localVideoTrack) return localVideoTrack;
    const track = await AgoraRTC.createCameraVideoTrack();
    setLocalVideoTrack(track);
    await client.publish(track);
    return track;
  }, [client, localVideoTrack]);

  const publishAudio = useCallback(async () => {
    if (!client) return null;
    if (localAudioTrackRef.current) return localAudioTrackRef.current;
    const track = await AgoraRTC.createMicrophoneAudioTrack();
    localAudioTrackRef.current = track;
    await client.publish(track);
    return track;
  }, [client]);

  const leave = useCallback(async () => {
    try {
      localVideoTrack?.stop();
      localVideoTrack?.close();
      setLocalVideoTrack(null);
      localAudioTrackRef.current?.close();
      localAudioTrackRef.current = null;

      if (client && client.connectionState !== 'DISCONNECTED') {
        await client.unpublish();
        await client.leave();
      }
      setConnected(false);
    } catch (e) {
      console.warn('[Agora] leave error:', e);
    }
  }, [client, localVideoTrack]);

  return { client, connected, publishVideo, publishAudio, localVideoTrack, leave };
}

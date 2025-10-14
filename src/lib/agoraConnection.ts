
'use client';

import { useState, useEffect, useRef } from 'react';
import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';
import { useFirebase } from '@/firebase';
import { httpsCallable } from 'firebase/functions';

export default function useAgoraConnection(channelName: string | null) {
  const { functions } = useFirebase();
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [connected, setConnected] = useState(false);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);

  const channelRef = useRef(channelName);
  channelRef.current = channelName;

  useEffect(() => {
    if (!channelName || !functions) return;

    const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    setClient(agoraClient);

    const init = async () => {
      try {
        const getAgoraToken = httpsCallable(functions, 'getAgoraToken');
        // A real app might use a more persistent UID, but for this hook, a random one is fine.
        const uid = Math.floor(Math.random() * 10000);
        const { data } = await getAgoraToken({ channelName, uid, role: 'publisher' });
        
        const { appId, token } = data as { appId: string, token: string };

        await agoraClient.join(appId, channelName, token, uid);
        setConnected(true);

        agoraClient.on('user-published', async (user, mediaType) => {
          await agoraClient.subscribe(user, mediaType);
          if (mediaType === 'video') {
            user.videoTrack?.play(`remote-player-${user.uid}`);
          }
          if (mediaType === 'audio') {
            user.audioTrack?.play();
          }
        });
        
        agoraClient.on('connection-state-change', (curState, prevState) => {
            console.log(`Connection state changed from ${prevState} to ${curState}`);
            if (curState === 'CONNECTED') {
                setConnected(true);
            } else if (curState === 'DISCONNECTED' || curState === 'RECONNECTING') {
                setConnected(false);
            }
        });

      } catch (error) {
        console.error('Failed to join Agora channel', error);
        setConnected(false);
      }
    };

    init();

    return () => {
      localVideoTrack?.close();
      localAudioTrack?.close();
      agoraClient.leave();
    };
  }, [channelName, functions]);

  const publishVideo = async () => {
    if (client && !localVideoTrack) {
      const track = await AgoraRTC.createCameraVideoTrack();
      setLocalVideoTrack(track);
      await client.publish(track);
      return track;
    }
    return localVideoTrack;
  };

  const publishAudio = async () => {
    if (client && !localAudioTrack) {
      const track = await AgoraRTC.createMicrophoneAudioTrack();
      setLocalAudioTrack(track);
      await client.publish(track);
      return track;
    }
    return localAudioTrack;
  };

  return { client, connected, publishVideo, publishAudio, localVideoTrack };
}

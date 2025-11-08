import { useEffect, useRef, useState, useCallback } from "react";
import type { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack, IRemoteAudioTrack, IRemoteVideoTrack } from "agora-rtc-sdk-ng";
import AgoraRTC from "agora-rtc-sdk-ng";

type Tracks = {
  mic?: IMicrophoneAudioTrack;
  cam?: ICameraVideoTrack;
};

export function useAgoraCall() {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localRef = useRef<Tracks>({});
  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(true);
  const [videoOn, setVideoOn] = useState(false);

  // DOM refs for rendering video
  const localVideoContainerRef = useRef<HTMLDivElement | null>(null);
  const [remoteVideoEl, setRemoteVideoEl] = useState<HTMLDivElement | null>(null);

  const attachRemoteHandlers = useCallback((client: IAgoraRTCClient) => {
    client.on("user-published", async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      if (mediaType === "video") {
        const vTrack = user.videoTrack as IRemoteVideoTrack;
        if (remoteVideoEl) {
          vTrack.play(remoteVideoEl);
        }
      }
      if (mediaType === "audio") {
        const aTrack = user.audioTrack as IRemoteAudioTrack;
        aTrack.play();
      }
    });

    client.on("user-unpublished", (user, mediaType) => {
      if (mediaType === "video" && remoteVideoEl) {
        // the SDK stops rendering automatically when track is unpublished
        remoteVideoEl.innerHTML = "";
      }
    });
  }, [remoteVideoEl]);

  const join = useCallback(async (appId: string, channel: string, uid: string | number, token: string, withVideo = false) => {
    if (!clientRef.current) {
      const client = AgoraRTC.createClient({ codec: "vp8", mode: "rtc" });
      clientRef.current = client;
      attachRemoteHandlers(client);
    }
    const client = clientRef.current!;
    await client.join(appId, channel, token, uid);

    // Create audio track (mic)
    const mic = await AgoraRTC.createMicrophoneAudioTrack();
    localRef.current.mic = mic;

    // Publish mic muted by default (respect privacy)
    await client.publish([mic]);
    await mic.setEnabled(false);
    setMuted(true);

    // Optional camera
    if (withVideo) {
      const cam = await AgoraRTC.createCameraVideoTrack();
      localRef.current.cam = cam;
      if (localVideoContainerRef.current) {
        cam.play(localVideoContainerRef.current);
      }
      await client.publish([cam]);
      setVideoOn(true);
    }

    setJoined(true);
  }, [attachRemoteHandlers]);

  const leave = useCallback(async () => {
    const client = clientRef.current;
    if (!client) return;

    const { mic, cam } = localRef.current;
    if (mic) { mic.stop(); mic.close(); }
    if (cam) { cam.stop(); cam.close(); }

    localRef.current = {};
    await client.unpublish();
    await client.leave();

    if (localVideoContainerRef.current) localVideoContainerRef.current.innerHTML = "";
    if (remoteVideoEl) remoteVideoEl.innerHTML = "";
    setJoined(false);
    setVideoOn(false);
    setMuted(true);
  }, [remoteVideoEl]);

  const toggleMute = useCallback(async () => {
    const mic = localRef.current.mic;
    if (!mic) return;
    const next = !muted;
    await mic.setEnabled(!next ? true : false); // next=true means muted
    setMuted(next);
  }, [muted]);

  const toggleVideo = useCallback(async () => {
    const client = clientRef.current!;
    let cam = localRef.current.cam;

    if (cam) {
      // turn OFF
      cam.stop(); cam.close();
      await client.unpublish([cam]);
      localRef.current.cam = undefined;
      setVideoOn(false);
      if (localVideoContainerRef.current) localVideoContainerRef.current.innerHTML = "";
      return;
    }

    // turn ON
    cam = await AgoraRTC.createCameraVideoTrack();
    localRef.current.cam = cam;
    if (localVideoContainerRef.current) cam.play(localVideoContainerRef.current);
    await client.publish([cam]);
    setVideoOn(true);
  }, []);

  return {
    joined, muted, videoOn,
    localVideoContainerRef,
    setRemoteVideoEl,
    join, leave, toggleMute, toggleVideo,
  };
}

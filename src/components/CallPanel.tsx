
"use client";
import { useEffect, useState, useRef } from "react";
import { getAuth } from "firebase/auth";
import { getRtcToken } from "@/lib/agoraApi";
import { useAgoraCall } from "@/hooks/useAgoraCall";
import { getApp } from "firebase/app";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

type Props = {
  channelPrefix?: string;     // e.g. "akili"
  withVideo?: boolean;        // default false (voice first)
};

export default function CallPanel({ channelPrefix = "akili", withVideo = false }: Props) {
  const { joined, muted, videoOn, localVideoContainerRef, setRemoteVideoEl, join, leave, toggleMute, toggleVideo } = useAgoraCall();
  const remoteDivRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [channel, setChannel] = useState<string>("");

  useEffect(() => {
    setRemoteVideoEl(remoteDivRef.current);
  }, [setRemoteVideoEl]);

  async function handleStart() {
    setLoading(true);
    try {
      const auth = getAuth();
      if (!auth.currentUser) throw new Error("Please sign in");
      const uid = auth.currentUser.uid;

      // Make a unique channel for this session
      const ch = `${channelPrefix}_${uid}_${Date.now().toString(36)}`;
      setChannel(ch);

      // Ask backend for token
      const { appId, token } = await getRtcToken({ channel: ch, uid, role: "publisher", ttlSeconds: 3600 });

      // (Optional) record a session doc your server functions can watch
      const db = getFirestore(getApp());
      await setDoc(doc(db, "aiSessions", uid), {
        isActive: true,
        channelName: ch,
        startedAt: serverTimestamp(),
      }, { merge: true });

      // Join + publish mic (video optional)
      await join(appId, ch, uid, token, withVideo);
    } catch (e: any) {
      console.error("Start call failed:", e);
      alert(e.message || "Start call failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleEnd() {
    await leave();
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4 rounded-2xl bg-neutral-900 text-white">
      <div className="flex items-center justify-between mb-3">
        <div className="text-lg font-semibold">AkiliPesa Live Call {channel ? `— ${channel}` : ""}</div>
        <div className="text-sm opacity-75">{joined ? "Connected" : "Idle"}</div>
      </div>

      {/* Video surfaces (hidden if voice-only) */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="h-48 bg-black/60 rounded-xl flex items-center justify-center" ref={localVideoContainerRef}>
          {!videoOn && <span className="text-xs opacity-60">Local video off</span>}
        </div>
        <div className="h-48 bg-black/40 rounded-xl flex items-center justify-center" ref={remoteDivRef}>
          <span className="text-xs opacity-60">Remote</span>
        </div>
      </div>

      <div className="flex gap-2">
        {!joined ? (
          <button
            onClick={handleStart}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading ? "Starting…" : "Start Call"}
          </button>
        ) : (
          <>
            <button onClick={toggleMute} className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500">
              {muted ? "Unmute" : "Mute"}
            </button>
            <button onClick={toggleVideo} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500">
              {videoOn ? "Camera Off" : "Camera On"}
            </button>
            <button onClick={handleEnd} className="ml-auto px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500">
              End Call
            </button>
          </>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useAgoraCall } from '@/hooks/useAgoraCall';

export default function CallPanel() {
  const [sessionId, setSessionId] = useState<string>('');
  const {
    channelName, callId, isJoined, isPublishing, isMuted,
    join, publishMic, toggleMute, leave, startAI
  } = useAgoraCall({
    mode: 'rtc',
    codec: 'vp8',
    role: 'host',
    agentId: 'akili-admin',
    agentType: 'admin',
    callMode: 'audio',
  });

  const handleStart = async () => {
    // Typically, you’d create an aiSessions/{id} doc and pass that id here.
    const id = sessionId || `sess_${Date.now()}`;
    setSessionId(id);
    await join();
    await publishMic();
    await startAI(id); // tells Cloud Function to start the AI loop for this channel
  };

  const handleStop = async () => {
    await leave();
  };

  return (
    <div className="flex flex-col gap-2 p-4 rounded-xl border">
      <div className="text-sm">Channel: <b>{channelName || '—'}</b> &nbsp; Call: <b>{callId || '—'}</b></div>

      <div className="flex gap-2">
        <button onClick={handleStart} disabled={isJoined} className="px-3 py-2 rounded bg-emerald-600 text-white disabled:opacity-50">
          {isJoined ? 'In Call' : 'Start Call'}
        </button>
        <button onClick={toggleMute} disabled={!isJoined} className="px-3 py-2 rounded bg-zinc-700 text-white disabled:opacity-50">
          {isMuted ? 'Unmute' : 'Mute'}
        </button>
        <button onClick={handleStop} disabled={!isJoined} className="px-3 py-2 rounded bg-rose-600 text-white disabled:opacity-50">
          Stop Call
        </button>
      </div>

      <p className="text-xs text-zinc-500">
        When you click <b>Start Call</b>, your mic is published and the server AI joins/publishes TTS into the same channel.
      </p>
    </div>
  );
}

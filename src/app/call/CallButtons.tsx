'use client';
import { useAgoraCall } from '@/hooks/useAgoraCall';

export default function CallButtons() {
  const { joined, join, leave } = useAgoraCall();

  return (
    <div className="flex gap-3">
      {!joined ? (
        <button
          className="rounded-xl px-4 py-2 bg-blue-600 text-white"
          onClick={() => join({ agentId: 'akili_core', agentType: 'admin', mode: 'audio' })}
        >
          Start Call
        </button>
      ) : (
        <button
          className="rounded-xl px-4 py-2 bg-rose-600 text-white"
          onClick={leave}
        >
          End Call
        </button>
      )}
    </div>
  );
}

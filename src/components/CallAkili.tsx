'use client';

import { useState } from "react";
import { useAkiliCall } from "@/hooks/useAkiliCall";
import { httpsCallable } from "firebase/functions";
import { useFirebase } from "@/firebase";

export function CallAkili() {
  const { functions } = useFirebase();
  const { inCall, loading, startCall, endCall } = useAkiliCall();
  const [sessionId, setSessionId] = useState<string | null>(null);

  async function handleStart() {
    if (!functions) return;
    const createSession = httpsCallable(functions, "createAiCallSession");
    
    try {
      const res: any = await createSession({});
      const { sessionId, token, channelName, uid } = res.data;

      setSessionId(sessionId);
      await startCall(sessionId, channelName, token, uid);
    } catch(e) {
      console.error("Failed to create call session:", e);
      alert("Could not start call. See console for details.");
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      {!inCall && (
        <button 
          onClick={handleStart}
          disabled={loading}
          className="px-6 py-3 rounded-xl bg-purple-700 text-white shadow-lg hover:bg-purple-800 disabled:bg-purple-900 disabled:cursor-not-allowed"
        >
          {loading ? "Connecting..." : "🎧 Call AkiliPesa AI"}
        </button>
      )}

      {inCall && (
        <button 
          onClick={endCall}
          className="px-6 py-3 rounded-xl bg-gray-900 text-white shadow-lg hover:bg-black"
        >
          🔚 End Call
        </button>
      )}
    </div>
  );
}

'use client';

import { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { useFunctions, useFirebaseUser } from "@/firebase";
import { toast } from "sonner";
import { Phone, Video } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {
  calleeId: string;     // user, agent or akilipesa-ai
  mode: "audio" | "video";
  className?: string;
};

export default function CallButton({ calleeId, mode, className }: Props) {
  const router = useRouter();
  const functions = useFunctions();
  const { user } = useFirebaseUser();
  const [loading, setLoading] = useState(false);

  const startCall = async () => {
    if (!user) {
      return toast.error("Please login to call.");
    }

    try {
      setLoading(true);

      const createCallSession = httpsCallable(functions, "createCallSession");
      const res: any = await createCallSession({
        calleeId,
        mode
      });

      const { callId, channelName, appId, token } = res.data;

      router.push(
        `/call/${mode}?callId=${callId}&channelName=${channelName}&token=${token}&appId=${appId}`
      );
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to start call.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={startCall}
      disabled={loading}
      className={className ?? "p-3 rounded-full bg-primary text-white"}
    >
      {mode === "audio" ? <Phone size={20} /> : <Video size={20} />}
    </button>
  );
}

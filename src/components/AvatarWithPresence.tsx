'use client';
import { useRealtime } from "@/hooks/useRealtime";
import FallbackAvatar from "./ui/FallbackAvatar";

export function AvatarWithPresence({ uid, src }: { uid: string; src?: string }) {
  const { state } = useRealtime(`status/${uid}`);
  const isOnline = state === "online";
  
  return (
    <div className="relative">
      <FallbackAvatar src={src} size={40} />
      {isOnline && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
      )}
    </div>
  );
}

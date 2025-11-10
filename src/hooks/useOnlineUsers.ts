'use client';
import { useRealtime } from "@/hooks/useRealtime";

type UserStatus = {
  state: 'online' | 'offline';
  last_changed: number;
};

export function useOnlineUsers() {
  const statusData = useRealtime('status');
  const onlineUsers = statusData 
    ? Object.entries(statusData as Record<string, UserStatus>)
        .filter(([, data]) => data.state === 'online')
        .map(([uid]) => uid)
    : [];
  
  return onlineUsers;
}

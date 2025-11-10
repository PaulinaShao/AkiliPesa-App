
'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useIncomingCalls } from "@/hooks/useIncomingCalls";
import { useRouter } from "next/navigation";
import { Phone, Video, PhoneOff } from "lucide-react";

export function IncomingCallWatcher() {
  const { call, accept, reject } = useIncomingCalls();
  const router = useRouter();

  if (!call) {
    return null;
  }

  const handleAccept = () => {
    accept();
    router.push(`/call/${call.mode}?sessionId=${call.sessionId}`);
  };

  const handleReject = () => {
    reject();
  };

  return (
    <AlertDialog open={!!call}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Incoming {call.mode} Call</AlertDialogTitle>
          <AlertDialogDescription>
            You have an incoming call from{" "}
            <span className="font-bold">{call.callerName || "Unknown"}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleReject}>
            <PhoneOff className="mr-2 h-4 w-4" />
            Decline
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleAccept}>
            {call.mode === "video" ? (
              <Video className="mr-2 h-4 w-4" />
            ) : (
              <Phone className="mr-2 h-4 w-4" />
            )}
            Accept
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

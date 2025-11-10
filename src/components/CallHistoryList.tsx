
'use client';

import { useCallHistory } from "@/hooks/useCallHistory";
import { Avatar } from "@/components/ui/avatar";
import { format } from "date-fns";

export default function CallHistoryList() {
  const history = useCallHistory();

  if (!history.length) return <p className="text-center text-muted-foreground py-10">No calls yet</p>;

  return (
    <div className="p-4 space-y-4">
      {history.map(call => (
        <div key={call.callId} className="flex items-center justify-between p-3 rounded-xl bg-background/60 border">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8" />
            <div>
              <p className="font-medium">
                {call.callerId === "akilipesa-ai" ? "AkiliPesa AI" : call.callerId}
              </p>
              <p className="text-xs text-muted-foreground capitalize">{call.status}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {call.startedAt?.toDate ? format(call.startedAt.toDate(), "MMM d, h:mm a") : ""}
          </p>
        </div>
      ))}
    </div>
  );
}

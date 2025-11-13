'use client';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "./ui/button";
import { Users } from "lucide-react";
import { useOnlineUsers } from "@/hooks/useOnlineUsers";
import { useCollection, useFirestore } from "@/firebase";
import { collection, query, where, documentId } from "firebase/firestore";
import { useFsMemo } from "@/firebase/use-memo-firebase";
import { AvatarWithPresence } from "./AvatarWithPresence";
import Link from "next/link";
import { useMemo } from "react";
import type { UserProfile } from "docs/backend";

function RosterList() {
    const firestore = useFirestore();
    const onlineUsers = useOnlineUsers();

    const usersQuery = useFsMemo(() => {
        if (!firestore || onlineUsers.length === 0) return null;
        // Firestore 'in' query is limited to 30 items.
        // For a real app, you might need to paginate or use a different strategy.
        const userIds = onlineUsers.slice(0, 30);
        return query(collection(firestore, 'users'), where(documentId(), 'in', userIds));
    }, [firestore, onlineUsers]);

    const { data: users, isLoading } = useCollection<UserProfile>(usersQuery);

    const memoizedUsers = useMemo(() => {
        return users?.sort((a,b) => (a.displayName || "").localeCompare(b.displayName || ""));
    }, [users]);

    if(isLoading) return <p className="text-center p-4">Loading online users...</p>
    if(!memoizedUsers || memoizedUsers.length === 0) return <p className="text-center p-4 text-muted-foreground">No one else is online right now.</p>

    return (
        <div className="space-y-3 p-4">
            {memoizedUsers.map(user => (
                <Link href={`/${user.handle}`} key={user.uid} className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted">
                    <AvatarWithPresence uid={user.uid} src={user.photoURL} />
                    <div className="flex-1">
                        <p className="font-bold">{user.displayName}</p>
                        <p className="text-xs text-muted-foreground">@{user.handle}</p>
                    </div>
                </Link>
            ))}
        </div>
    )
}


export function RosterDrawer() {
  const onlineUsers = useOnlineUsers();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Users className="h-6 w-6" />
           {onlineUsers.length > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-sky-500 text-xs items-center justify-center">
                        {onlineUsers.length}
                    </span>
                </span>
            )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Who's Online</SheetTitle>
          <SheetDescription>
            See who is currently active on AkiliPesa.
          </SheetDescription>
        </SheetHeader>
        <RosterList/>
      </SheetContent>
    </Sheet>
  );
}

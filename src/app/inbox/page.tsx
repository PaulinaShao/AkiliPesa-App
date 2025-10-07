
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/user-avatar';
import { conversations, users } from '@/lib/data';
import { Phone, Sparkles, Video, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function InboxPage() {
    const router = useRouter();
    const currentUser = users.find(u => u.id === 'u1'); // Assuming current user is 'u1'

    return (
        <div className="flex flex-col h-screen bg-background text-foreground">
            <header className="flex items-center justify-between p-4 border-b shrink-0 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <X className="h-6 w-6" />
                </Button>
                <h1 className="text-xl font-bold">Messages</h1>
                <div className="w-10"></div>
            </header>

            <main className="flex-1 overflow-y-auto">
                {/* Pinned AkiliPesa AI Chat */}
                <Link href="/upload" className="flex items-center gap-4 p-4 hover:bg-muted transition-colors cursor-pointer">
                    <Avatar className="w-14 h-14 border-2 border-primary">
                        <AvatarFallback><Sparkles className="w-6 h-6"/></AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <p className="font-bold">AkiliPesa AI</p>
                        <p className="text-sm text-muted-foreground">Click to chat...</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon"><Phone className="h-6 w-6 text-primary"/></Button>
                        <Button variant="ghost" size="icon"><Video className="h-6 w-6 text-primary"/></Button>
                    </div>
                </Link>

                {/* User DMs List */}
                <div className="border-t">
                    {conversations.map(convo => {
                        const otherUser = users.find(u => u.id === (convo.senderId === currentUser?.id ? convo.receiverId : convo.senderId));
                        if (!otherUser) return null;

                        const isUnread = convo.unread && convo.senderId !== currentUser?.id;

                        return (
                            <Link href={`/inbox/${otherUser.username}`} key={convo.id} className="flex items-center gap-4 p-4 border-b hover:bg-muted transition-colors cursor-pointer">
                                <div className="relative">
                                    <UserAvatar src={otherUser.avatar} username={otherUser.username} className="w-14 h-14"/>
                                    {isUnread && <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-primary ring-2 ring-background" />}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex justify-between items-start">
                                        <p className="font-bold truncate">{otherUser.username}</p>
                                        <p className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                            {formatDistanceToNow(new Date(convo.timestamp), { addSuffix: true })}
                                        </p>
                                    </div>
                                    <p className={`text-sm truncate ${isUnread ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                                        {convo.senderId === currentUser?.id && 'You: '} {convo.text}
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}

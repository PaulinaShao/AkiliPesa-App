
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import FallbackAvatar from '@/components/ui/FallbackAvatar';
import { Phone, Sparkles, Video, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useEffect, useState, useMemo } from 'react';
import { useFirebase, useFirebaseUser, useCollection, useMemoFirebase } from '@/firebase';
import { httpsCallable } from 'firebase/functions';
import { useToast } from '@/hooks/use-toast';
import { AgentPicker } from '@/components/AgentPicker';
import type { Message } from '@/lib/definitions';
import type { UserProfile } from 'docs/backend';
import { collection, query, where, documentId } from 'firebase/firestore';

interface InboxClientProps {
  initialConversations: Message[];
}

export function InboxClient({ initialConversations }: InboxClientProps) {
    const router = useRouter();
    const { functions, user: currentUserAuth, firestore } = useFirebase();
    const { toast } = useToast();

    const [isClient, setIsClient] = useState(false);
    const [showAgentPicker, setShowAgentPicker] = useState(false);
    const [callMode, setCallMode] = useState<'audio' | 'video' | null>(null);

    useEffect(() => {
        setIsClient(true);
    }, []);
    
    // Get all unique user IDs from the conversations to fetch their profiles
    const userIdsInConversations = useMemo(() => {
      const ids = new Set<string>();
      if(currentUserAuth) ids.add(currentUserAuth.uid);
      initialConversations.forEach(convo => {
        ids.add(convo.senderId);
        ids.add(convo.receiverId);
      });
      return Array.from(ids);
    }, [initialConversations, currentUserAuth]);

    const usersQuery = useMemoFirebase(() => {
      if (!firestore || userIdsInConversations.length === 0) return null;
      // Note: A real app might need to chunk this query if userIdsInConversations > 30
      return query(collection(firestore, 'users'), where(documentId(), 'in', userIdsInConversations));
    }, [firestore, userIdsInConversations]);

    const { data: users, isLoading: usersLoading } = useCollection<UserProfile>(usersQuery as any);

    const handleInitiateCall = (mode: 'audio' | 'video') => {
        if (!currentUserAuth) {
            toast({
                variant: "destructive",
                title: "Login Required",
                description: "You must be logged in to make a call.",
            });
            router.push('/auth/login');
            return;
        }
        setCallMode(mode);
        setShowAgentPicker(true);
    };

    const handleAgentSelect = async (agent: { id: string, type: 'admin' | 'user' }) => {
        setShowAgentPicker(false);
        if (!callMode || !functions) return;

        try {
            const getAgoraToken = httpsCallable(functions, 'getAgoraToken');
            const result = await getAgoraToken({ agentId: agent.id, agentType: agent.type, mode: callMode });
            const { token, channelName, callId, appId } = result.data as any;
            
            const query = new URLSearchParams({
                to: agent.id,
                callId,
                channelName,
                token,
                appId
            }).toString();

            router.push(`/call/${callMode}?${query}`);

        } catch (error: any) {
            console.error('Error getting Agora token:', error);
            toast({
                variant: "destructive",
                title: "Call Failed",
                description: error.message || "Could not initiate the call. Please try again.",
            });
        }
    };
    
    const currentUser = users?.find(u => u.uid === currentUserAuth?.uid);

    if (!isClient) {
        return null;
    }

    if (usersLoading) {
        return (
             <div className="flex h-screen w-full items-center justify-center bg-background dark">
                <p>Loading Conversations...</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-background text-foreground overflow-x-hidden w-full max-w-full">
            <header className="flex items-center justify-between p-4 border-b shrink-0 sticky top-0 bg-background/80 backdrop-blur-sm z-10 supports-[padding-top:env(safe-area-inset-top)]:pt-[env(safe-area-inset-top)]">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <X className="h-6 w-6" />
                </Button>
                <h1 className="text-xl font-bold">Messages</h1>
                <div className="w-10"></div>
            </header>

            <AgentPicker
                show={showAgentPicker}
                onSelect={handleAgentSelect}
                onCancel={() => setShowAgentPicker(false)}
            />

            <main className="flex-1 overflow-y-auto supports-[padding-bottom:env(safe-area-inset-bottom)]:pb-[calc(env(safe-area-inset-bottom)+64px)] md:supports-[padding-bottom:env(safe-area-inset-bottom)]:pb-0">
                {/* Pinned AkiliPesa AI Chat */}
                <div className="flex items-center gap-4 p-4 hover:bg-muted transition-colors">
                    <Link href="/inbox/akilipesa-ai" className="flex-1 flex items-center gap-4">
                        <Avatar className="w-14 h-14 bg-gradient-tanzanite p-1">
                            <div className="bg-background rounded-full w-full h-full flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-white"/>
                            </div>
                        </Avatar>
                        <div className="flex-1">
                            <p className="font-bold">AkiliPesa AI</p>
                            <p className="text-sm text-muted-foreground">Click to chat...</p>
                        </div>
                    </Link>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => handleInitiateCall('audio')}><Phone className="h-6 w-6 text-primary"/></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleInitiateCall('video')}><Video className="h-6 w-6 text-primary"/></Button>
                    </div>
                </div>

                {/* User DMs List */}
                <div className="border-t">
                    {initialConversations.map(convo => {
                        const otherUser = users?.find(u => u.uid === (convo.senderId === currentUser?.uid ? convo.receiverId : convo.senderId));
                        if (!otherUser) return null;

                        const isUnread = convo.unread && convo.senderId !== currentUser?.uid;

                        return (
                            <Link href={`/inbox/${otherUser.handle}`} key={convo.id} className="flex items-center gap-4 p-4 border-b hover:bg-muted transition-colors cursor-pointer">
                                <div className="relative shrink-0">
                                    <FallbackAvatar src={otherUser.photoURL} alt={otherUser.handle} size={56}/>
                                    {isUnread && <span className={cn(
                                        "absolute top-0 right-0 block h-3.5 w-3.5 rounded-full ring-2 ring-background",
                                        "bg-gradient-tanzanite animate-pulse"
                                    )} />}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex justify-between items-start">
                                        <p className="font-bold truncate">{otherUser.handle}</p>
                                        <p className="text-xs text-muted-foreground whitespace-nowrap ml-2 shrink-0">
                                            {isClient ? formatDistanceToNow(new Date(convo.timestamp), { addSuffix: true }) : ''}
                                        </p>
                                    </div>
                                    <p className={`text-sm truncate ${isUnread ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                                        {convo.senderId === currentUser?.uid && 'You: '} {convo.text}
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

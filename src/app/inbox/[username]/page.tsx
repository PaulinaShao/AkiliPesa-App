
'use client';

import { FormEvent, useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Paperclip, Mic, Send, Phone, Video } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import FallbackAvatar from '@/components/ui/FallbackAvatar';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Message } from '@/lib/definitions';
import { format } from 'date-fns';
import { useFirebase, useFirebaseUser, useCollection } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { AgentPicker } from '@/components/AgentPicker';
import { collection, query, where, limit, doc, getDocs, addDoc, serverTimestamp, orderBy, onSnapshot } from 'firebase/firestore';
import type { UserProfile } from 'docs/backend';

export default function ChatPage() {
    const router = useRouter();
    const params = useParams();
    const { username } = params;
    const { functions, user: currentUserAuth, firestore } = useFirebase();
    const { toast } = useToast();

    const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const [showAgentPicker, setShowAgentPicker] = useState(false);
    const [callMode, setCallMode] = useState<'audio' | 'video' | null>(null);

    useEffect(() => {
        if (!firestore || !username) return;
        const q = query(collection(firestore, 'users'), where('handle', '==', username), limit(1));
        getDocs(q).then(snapshot => {
            if (!snapshot.empty) {
                setOtherUser(snapshot.docs[0].data() as UserProfile);
            } else {
                notFound();
            }
        });
    }, [firestore, username]);

    useEffect(() => {
        if (!firestore || !currentUserAuth || !otherUser) return;

        // Create a consistent channel ID
        const channelId = [currentUserAuth.uid, otherUser.uid].sort().join('_');
        const messagesRef = collection(firestore, 'chats', channelId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
            setMessages(msgs);
        });

        return () => unsubscribe();
    }, [firestore, currentUserAuth, otherUser]);

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
    }, [messages]);

    const handleInitiateCall = (mode: 'audio' | 'video') => {
        if (!currentUserAuth) {
            toast({ variant: "destructive", title: "Login Required" });
            router.push('/auth/login');
            return;
        }
        setCallMode(mode);
        setShowAgentPicker(true);
    };
    
    const handleAgentSelect = async (agent: { id: string, type: 'admin' | 'user' }) => {
        setShowAgentPicker(false);
        if (!callMode) return;

        try {
            const getAgoraToken = httpsCallable(functions, 'getAgoraToken');
            const result = await getAgoraToken({ agentId: agent.id, agentType: agent.type, mode: callMode });
            const { token, channelName, callId, appId } = result.data as any;

            const query = new URLSearchParams({ to: agent.id, callId, channelName, token, appId }).toString();
            router.push(`/call/${callMode}?${query}`);

        } catch (error: any) {
            console.error('Error getting Agora token:', error);
            toast({ variant: "destructive", title: "Call Failed", description: error.message || "Could not initiate call." });
        }
    };

    const handleSendMessage = async (e: FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUserAuth || !otherUser || !firestore) return;

        const channelId = [currentUserAuth.uid, otherUser.uid].sort().join('_');
        const messagesRef = collection(firestore, 'chats', channelId, 'messages');

        const messageData = {
            senderId: currentUserAuth.uid,
            receiverId: otherUser.uid,
            text: newMessage,
            timestamp: serverTimestamp()
        };

        setNewMessage('');
        await addDoc(messagesRef, messageData);
    };
    
    if (!otherUser) {
        return <div className="flex h-screen items-center justify-center">Loading chat...</div>
    }

    return (
        <div className="flex flex-col h-screen bg-muted/30 text-foreground overflow-x-hidden w-full max-w-full">
            <header className="flex items-center justify-between p-2 border-b shrink-0 sticky top-0 bg-background/80 backdrop-blur-sm z-10 supports-[padding-top:env(safe-area-inset-top)]:pt-[env(safe-area-inset-top)]">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <div className="flex items-center gap-3 overflow-hidden">
                    <FallbackAvatar src={otherUser.photoURL} alt={otherUser.handle} size={40} />
                    <span className="font-bold text-lg truncate">{otherUser.handle}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => handleInitiateCall('audio')}><Phone className="h-6 w-6 text-primary"/></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleInitiateCall('video')}><Video className="h-6 w-6 text-primary"/></Button>
                </div>
            </header>
            
             <AgentPicker
                show={showAgentPicker}
                onSelect={handleAgentSelect}
                onCancel={() => setShowAgentPicker(false)}
            />

            <main ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(msg => (
                    <div key={msg.id} className={cn(
                        "flex items-end gap-2 max-w-[80%]",
                        msg.senderId === currentUserAuth?.uid ? "ml-auto flex-row-reverse" : "mr-auto"
                    )}>
                        <FallbackAvatar src={msg.senderId === currentUserAuth?.uid ? currentUserAuth?.photoURL : otherUser.photoURL} alt="avatar" size={32} />
                        <div className={cn(
                            "rounded-2xl px-4 py-2",
                            msg.senderId === currentUserAuth?.uid ? "bg-primary text-primary-foreground rounded-br-none" : "bg-background rounded-bl-none"
                        )}>
                            <p className="text-sm">{msg.text}</p>
                            {msg.timestamp && (
                                <p className={cn(
                                    "text-xs mt-1",
                                    msg.senderId === currentUserAuth?.uid ? "text-primary-foreground/70 text-right" : "text-muted-foreground"
                                )}>
                                    {typeof msg.timestamp === 'string' ? format(new Date(msg.timestamp), 'h:mm a') : format((msg.timestamp as any).toDate(), 'h:mm a')}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </main>
            
            <footer className="p-4 bg-background/80 backdrop-blur-lg border-t supports-[padding-bottom:env(safe-area-inset-bottom)]:pb-[calc(env(safe-area-inset-bottom)+1rem)]">
                <form onSubmit={handleSendMessage} className="relative bg-muted/50 rounded-xl p-2 flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="shrink-0">
                        <Paperclip className="h-5 w-5" />
                    </Button>
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Message..." 
                        className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 h-9"
                    />
                    <Button variant="ghost" size="icon" className="shrink-0">
                        <Mic className="h-5 w-5" />
                    </Button>
                    <Button type="submit" size="icon" className="shrink-0 h-9 w-9 rounded-full bg-primary">
                        <Send className="h-5 w-5" />
                    </Button>
                </form>
            </footer>
        </div>
    );
}

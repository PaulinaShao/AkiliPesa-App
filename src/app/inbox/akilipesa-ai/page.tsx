
'use client';

import { useState, FormEvent, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Sparkles, Phone, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { UserAvatar } from '@/components/user-avatar';
import { Input } from '@/components/ui/input';
import { Paperclip, Mic, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message } from '@/lib/definitions';
import { users } from '@/lib/data';
import { format } from 'date-fns';
import Link from 'next/link';

export default function AkiliPesaAIChatPage() {
    const router = useRouter();
    const currentUser = users.find(u => u.id === 'u1');
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const initialMessages: Message[] = [
        {
            id: 'ai-m1',
            senderId: 'akili-ai',
            receiverId: currentUser?.id || 'u1',
            text: 'Hello! How can I help you create today? You can ask me to generate a video, create a song, design an ad, or even clone your voice.',
            timestamp: new Date(Date.now() - 2 * 60000).toISOString()
        },
        {
            id: 'user-m1',
            senderId: currentUser?.id || 'u1',
            receiverId: 'akili-ai',
            text: 'Create a 15-second video ad for a new coffee shop called "Zanzibar Beans". Show a beautiful sunrise over the ocean and fresh coffee brewing.',
            timestamp: new Date(Date.now() - 1 * 60000).toISOString()
        },
    ];

    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [newMessage, setNewMessage] = useState('');
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
    }, [messages]);


    if (!currentUser) {
        return <div>Loading...</div>; // Or some other loading state
    }
    
    const aiUser = {
        id: 'akili-ai',
        username: 'AkiliPesa AI',
        avatar: '', // No avatar, will use fallback
    }

    const handleSendMessage = (e: FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const message: Message = {
            id: `m${messages.length + 10}`,
            senderId: currentUser.id,
            receiverId: 'akili-ai',
            text: newMessage,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, message]);
        setNewMessage('');

        // Simulate AI response
        setTimeout(() => {
            const aiResponse: Message = {
                id: `ai-m${messages.length + 2}`,
                senderId: 'akili-ai',
                receiverId: currentUser.id,
                text: `Sure, I can create that video for you. Generating a 15-second ad for "Zanzibar Beans" now...`,
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, aiResponse]);
        }, 1500);
    };

    return (
        <div className="flex flex-col h-screen bg-muted/30 text-foreground">
            <header className="flex items-center justify-between p-2 border-b shrink-0 sticky top-0 bg-background/80 backdrop-blur-sm z-10 supports-[padding-top:env(safe-area-inset-top)]:pt-[env(safe-area-inset-top)]">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <div className="flex items-center gap-3">
                     <Avatar className="w-10 h-10 bg-gradient-tanzanite p-0.5">
                        <div className="bg-background rounded-full w-full h-full flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                    </Avatar>
                    <span className="font-bold text-lg">{aiUser.username}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Button asChild variant="ghost" size="icon"><Link href="/call/audio"><Phone className="h-6 w-6 text-primary"/></Link></Button>
                    <Button asChild variant="ghost" size="icon"><Link href="/call/video"><Video className="h-6 w-6 text-primary"/></Link></Button>
                </div>
            </header>

            <main ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(msg => (
                    <div key={msg.id} className={cn(
                        "flex items-end gap-2 max-w-[80%]",
                        msg.senderId === currentUser.id ? "ml-auto flex-row-reverse" : "mr-auto"
                    )}>
                        {msg.senderId !== currentUser.id ? (
                            <Avatar className="w-8 h-8 bg-gradient-tanzanite p-0.5 self-start">
                                <div className="bg-background rounded-full w-full h-full flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-white"/>
                                </div>
                            </Avatar>
                        ) : (
                           <UserAvatar src={currentUser.avatar} username={currentUser.username} className="w-8 h-8" />
                        )}
                        <div className={cn(
                            "rounded-2xl px-4 py-2",
                            msg.senderId === currentUser.id ? "bg-gradient-tanzanite text-primary-foreground rounded-br-none" : "bg-background rounded-bl-none"
                        )}>
                            <p className="text-sm">{msg.text}</p>
                            {isClient && (
                                <p className={cn(
                                    "text-xs mt-1",
                                    msg.senderId === currentUser.id ? "text-primary-foreground/70 text-right" : "text-muted-foreground"
                                )}>
                                    {format(new Date(msg.timestamp), 'h:mm a')}
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
                        placeholder="Message AkiliPesa AI..." 
                        className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 h-9"
                    />
                    <Button variant="ghost" size="icon" className="shrink-0">
                        <Mic className="h-5 w-5" />
                    </Button>
                    <Button type="submit" size="icon" className="shrink-0 h-9 w-9 rounded-full bg-gradient-tanzanite">
                        <Send className="h-5 w-5" />
                    </Button>
                </form>
            </footer>
        </div>
    );
}

'use client';

import { FormEvent, useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Paperclip, Mic, Send, Phone, Video } from 'lucide-react';
import { users, messages as allMessages } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/user-avatar';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Message } from '@/lib/definitions';
import { format } from 'date-fns';


export default function ChatPage() {
    const router = useRouter();
    const params = useParams();
    const { username } = params;

    const currentUser = users.find(u => u.id === 'u1');
    const otherUser = users.find(u => u.username === username);
    
    const [messages, setMessages] = useState<Message[]>(
        allMessages.filter(m => 
            (m.senderId === currentUser?.id && m.receiverId === otherUser?.id) ||
            (m.senderId === otherUser?.id && m.receiverId === currentUser?.id)
        ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    );
    const [newMessage, setNewMessage] = useState('');
    const [isClient, setIsClient] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
      }
    }, [messages]);


    if (!currentUser || !otherUser) {
        notFound();
    }

    const handleSendMessage = (e: FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const message: Message = {
            id: `m${messages.length + 10}`,
            senderId: currentUser.id,
            receiverId: otherUser.id,
            text: newMessage,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, message]);
        setNewMessage('');
    };

    return (
        <div className="flex flex-col h-screen bg-muted/30 text-foreground">
            <header className="flex items-center justify-between p-2 border-b shrink-0 sticky top-0 bg-background/80 backdrop-blur-sm z-10 supports-[padding-top:env(safe-area-inset-top)]:pt-[env(safe-area-inset-top)]">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <div className="flex items-center gap-3">
                    <UserAvatar src={otherUser.avatar} username={otherUser.username} className="w-10 h-10" />
                    <span className="font-bold text-lg">{otherUser.username}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon"><Phone className="h-6 w-6 text-primary"/></Button>
                    <Button variant="ghost" size="icon"><Video className="h-6 w-6 text-primary"/></Button>
                </div>
            </header>

            <main ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(msg => (
                    <div key={msg.id} className={cn(
                        "flex items-end gap-2 max-w-[80%]",
                        msg.senderId === currentUser.id ? "ml-auto flex-row-reverse" : "mr-auto"
                    )}>
                        <UserAvatar src={users.find(u => u.id === msg.senderId)?.avatar} username={users.find(u => u.id === msg.senderId)?.username} className="w-8 h-8" />
                        <div className={cn(
                            "rounded-2xl px-4 py-2",
                            msg.senderId === currentUser.id ? "bg-primary text-primary-foreground rounded-br-none" : "bg-background rounded-bl-none"
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

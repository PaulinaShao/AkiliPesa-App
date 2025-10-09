
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserAvatar } from '@/components/user-avatar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { X, Phone, Video as VideoIcon, Sparkles, Globe, Paperclip, Mic, SendHorizonal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { users } from '@/lib/data';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  avatar?: string;
  username?: string;
}

const capabilities = [
  "Create Video", "Create Song", "Design Ad", "Clone Voice"
]

export default function AiCreatePage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: "Hello! I'm your creative partner. Tell me what you'd like to make, or select a capability below to get started.",
      username: 'AkiliPesa AI'
    }
  ]);
  const [input, setInput] = useState('');
  const currentUser = users.find(u => u.id === 'u1'); // Mock current user

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: String(Date.now()),
      sender: 'user',
      text: input,
      avatar: currentUser?.avatar,
      username: currentUser?.username,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-screen dark bg-background text-foreground">
      <header className="flex items-center justify-between p-2 border-b shrink-0 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <X className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-semibold">AkiliPesa AI</h1>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon"><Phone className="h-5 w-5 text-primary" /></Button>
          <Button variant="ghost" size="icon"><VideoIcon className="h-5 w-5 text-primary" /></Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <div className="flex items-center p-2 border-b gap-2">
            <Link href="/create/camera"><Button variant="outline" className="text-xs h-8">Camera</Button></Link>
            <Link href="/create/upload"><Button variant="outline" className="text-xs h-8">Upload</Button></Link>
        </div>
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
            {messages.map(msg => (
              <div key={msg.id} className={cn(
                "flex items-start gap-3 max-w-[85%]",
                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              )}>
                {msg.sender === 'ai' ? (
                  <Avatar className="w-8 h-8 border-2 border-primary">
                    <AvatarFallback><Sparkles className="w-4 h-4" /></AvatarFallback>
                  </Avatar>
                ) : (
                  <UserAvatar src={msg.avatar} username={msg.username} className="w-8 h-8" />
                )}
                <div className={cn(
                  "rounded-2xl px-4 py-2.5 text-sm",
                  msg.sender === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-secondary rounded-bl-none'
                )}>
                  <p>{msg.text}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </main>

      <footer className="p-2 border-t bg-background">
        <div className="bg-muted/50 rounded-xl p-2 space-y-2">
           <div className="flex items-center gap-2 px-1">
             <Globe className="h-5 w-5 text-primary"/>
             <div className="flex-1 flex flex-wrap gap-2">
                {capabilities.map(cap => (
                    <Button key={cap} variant="outline" size="sm" className="h-7 text-xs bg-background" onClick={() => setInput(cap)}>{cap}</Button>
                ))}
             </div>
           </div>
          <div className="relative flex items-center gap-2">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Start typing below..."
              className="flex-1 bg-transparent border rounded-lg min-h-[40px] max-h-[120px] h-10 resize-none pr-24"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                <Button variant="ghost" size="icon" className="h-8 w-8"><Paperclip className="h-5 w-5" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8"><Mic className="h-5 w-5" /></Button>
                <Button onClick={handleSend} size="icon" className="h-8 w-8 rounded-full bg-primary"><SendHorizonal className="h-5 w-5" /></Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

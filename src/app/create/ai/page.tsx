'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import FallbackAvatar from '@/components/ui/FallbackAvatar';
import { Avatar } from '@/components/ui/avatar';
import { X, Phone, Video as VideoIcon, Sparkles, Globe, Paperclip, Mic, SendHorizonal, Music, Film, Clapperboard, Mic2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirebase, useFirebaseUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import useSessionManager from '@/lib/sessionManager';
import { ScrollArea } from '@/components/ui/scroll-area';
import dynamic from "next/dynamic";
import { useInitiateCall } from '@/hooks/useInitiateCall';
const CallPanel = dynamic(() => import("@/components/CallPanel"), { ssr: false });


interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  avatar?: string;
  username?: string;
}

const capabilities = [
  { label: "Create Video", icon: Film, prompt: "Create a video about " },
  { label: "Create Song", icon: Music, prompt: "Create a song about " },
  { label: "Design Ad", icon: Clapperboard, prompt: "Design an ad for " },
  { label: "Clone Voice", icon: Mic2, prompt: "Clone a voice from a sample" }
]

const GradientIcon = ({ icon: Icon, ...props }: { icon: React.ElementType, [key: string]: any }) => {
    return (
        <>
            <svg width="0" height="0" className="absolute">
                <linearGradient id="tanzanite-icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))' }} />
                    <stop offset="100%" style={{ stopColor: 'hsl(var(--accent))' }} />
                </linearGradient>
            </svg>
            <Icon {...props} style={{ stroke: 'url(#tanzanite-icon-gradient)' }} />
        </>
    );
};


export default function AiCreatePage() {
  const router = useRouter();
  const { user: currentUserAuth } = useFirebase();
  const { toast } = useToast();
  const { session, updateSession } = useSessionManager('akilipesa-ai', 'chat');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { initiateCall } = useInitiateCall();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: "Hello! I'm Akili, your creative partner. What masterpiece shall we create today? A video, a song, a voice clone?",
      username: 'AkiliPesa AI'
    }
  ]);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !currentUserAuth) return;

    const userMessage: Message = {
      id: String(Date.now()),
      sender: 'user',
      text: input,
      avatar: currentUserAuth?.photoURL || undefined,
      username: currentUserAuth?.displayName || 'User',
    };

    setMessages(prev => [...prev, userMessage]);
    updateSession({ lastMessage: input, lastUpdated: Date.now() });
    setInput('');
  };
  
  const handleCall = (mode: 'audio' | 'video') => {
    initiateCall({
        mode,
        agentId: 'akilipesa-ai',
        agentType: 'admin'
    });
  }


  return (
    <div className="flex flex-col h-screen dark bg-background text-foreground">
      <header className="flex items-center justify-between p-2 border-b shrink-0 h-16">
        <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
          <X className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-semibold">Create</h1>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => handleCall('audio')}><GradientIcon icon={Phone} className="h-5 w-5" /></Button>
          <Button variant="ghost" size="icon" onClick={() => handleCall('video')}><GradientIcon icon={VideoIcon} className="h-5 w-5" /></Button>
        </div>
      </header>
       
      <div className="border-b shrink-0">
         <div className="flex justify-center p-2">
           <Tabs defaultValue="ai" className="w-auto">
              <TabsList>
                <TabsTrigger value="ai" onClick={() => router.push('/create/ai')}>AkiliPesa AI</TabsTrigger>
                <TabsTrigger value="camera" onClick={() => router.push('/create/camera')}>Camera</TabsTrigger>
                <TabsTrigger value="upload" onClick={() => router.push('/create/upload')}>Upload</TabsTrigger>
              </TabsList>
            </Tabs>
        </div>
      </div>
      
       <ScrollArea className="flex-1" ref={scrollAreaRef}>
         <div className="p-4 space-y-6">
            {messages.map(msg => (
            <div key={msg.id} className={cn(
                "flex items-start gap-3 max-w-[85%]",
                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            )}>
                {msg.sender === 'ai' ? (
                <Avatar className="w-8 h-8 bg-gradient-tanzanite p-0.5 shadow-lg shadow-primary/20">
                    <div className="bg-background rounded-full w-full h-full flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                </Avatar>
                ) : (
                <FallbackAvatar src={msg.avatar} alt={msg.username} className="w-8 h-8" />
                )}
                <div className={cn(
                "rounded-2xl px-4 py-2.5 text-sm shadow-md",
                msg.sender === 'user'
                    ? 'bg-gradient-tanzanite text-primary-foreground rounded-br-none'
                    : 'bg-secondary rounded-bl-none'
                )}>
                <p>{msg.text}</p>
                </div>
            </div>
            ))}
             <div className="pt-4">
              <CallPanel withVideo={false} />
            </div>
        </div>
      </ScrollArea>
      
      <footer className="p-2 border-t bg-background shrink-0 h-auto">
        <div className="bg-muted/50 rounded-xl p-2 space-y-2">
           <div className="relative w-full">
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex items-center gap-2 px-1 py-1">
                 <Globe className="h-5 w-5 text-gradient flex-shrink-0"/>
                 {capabilities.map(({label, icon: Icon, prompt}) => (
                    <Button key={label} variant="outline" size="sm" className="h-8 rounded-full text-xs bg-background transition-all hover:bg-primary/10 hover:border-primary/50" onClick={() => setInput(prompt || label)}>
                      <Icon className="mr-2 h-4 w-4 text-primary" />
                      {label}
                    </Button>
                ))}
              </div>
              <div className="pointer-events-none absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-muted/50 to-transparent"></div>
            </ScrollArea>
           </div>

          <div className="relative flex items-center gap-2">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Start typing your idea..."
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
                <Button onClick={handleSend} size="icon" className="h-8 w-8 rounded-full bg-gradient-tanzanite"><SendHorizonal className="h-5 w-5" /></Button>
            </div>
          </div>
           <p className="text-xs text-muted-foreground px-2">Session: {session?.sessionId ?? 'Inactive'}</p>
        </div>
      </footer>
    </div>
  );
}

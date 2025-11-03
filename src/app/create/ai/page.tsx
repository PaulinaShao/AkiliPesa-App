
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import FallbackAvatar from '@/components/ui/FallbackAvatar';
import { Avatar } from '@/components/ui/avatar';
import { X, Phone, Video as VideoIcon, Sparkles, Globe, Paperclip, Mic, SendHorizonal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { users } from '@/lib/data';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { httpsCallable } from 'firebase/functions';
import { AgentPicker } from '@/components/AgentPicker';
import useSessionManager from '@/lib/sessionManager';


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

const GradientIcon = ({ icon: Icon, ...props }: { icon: React.ElementType, [key: string]: any }) => {
    return (
        <>
            <svg width="0" height="0" className="absolute">
                <linearGradient id="tanzanite-icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: 'var(--gradient-violet)' }} />
                    <stop offset="50%" style={{ stopColor: 'var(--gradient-sapphire)' }} />
                    <stop offset="100%" style={{ stopColor: 'var(--gradient-teal)' }} />
                </linearGradient>
            </svg>
            <Icon {...props} style={{ fill: 'url(#tanzanite-icon-gradient)', stroke: 'url(#tanzanite-icon-gradient)' }} />
        </>
    );
};

export default function AiCreatePage() {
  const router = useRouter();
  const { functions, user: currentUserAuth } = useFirebase();
  const { toast } = useToast();
  const { session, updateSession } = useSessionManager('akilipesa-ai', 'chat');
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: "Hello! I'm your creative partner. Tell me what you'd like to make, or select a capability below to get started.",
      username: 'AkiliPesa AI'
    }
  ]);
  const [input, setInput] = useState('');
  const [showAgentPicker, setShowAgentPicker] = useState(false);
  const [callMode, setCallMode] = useState<'audio' | 'video' | null>(null);
  
  const currentUser = users.find(u => u.id === 'u1'); // Mock current user

  useEffect(() => {
    if (session?.isActive) {
      updateSession({ lastUpdated: Date.now() });
      if (session.lastMessage) {
        // Here you could restore chat history from the session
      }
    }
  }, [session, updateSession]);

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
    updateSession({ lastMessage: input });
    setInput('');
  };
  
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

  const handleAgentSelect = async (agent: { id: string; type: 'admin' | 'user' }) => {
    setShowAgentPicker(false);
    if (!callMode || !functions) return;

    try {
        const getAgoraToken = httpsCallable(functions, 'getAgoraToken');
        const result = await getAgoraToken({ agentId: agent.id, agentType: agent.type, mode: callMode });
        const { token, channelName, callId, appId } = result.data as any;

        const query = new URLSearchParams({
            agentId: agent.id,
            callId,
            channelName,
            token,
            appId,
        }).toString();
        
        router.push(`/call/${callMode}?${query}`);

    } catch (error: any) {
        console.error('Error getting Agora token:', error);
        toast({
            variant: "destructive",
            title: "Call Failed",
            description: error.message || "Could not initiate the call.",
        });
    }
  };

  return (
    <div className="flex flex-col h-screen dark bg-background text-foreground">
      <header className="flex items-center justify-between p-2 border-b shrink-0 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
          <X className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-semibold">Create</h1>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => handleInitiateCall('audio')}><GradientIcon icon={Phone} className="h-5 w-5" /></Button>
          <Button variant="ghost" size="icon" onClick={() => handleInitiateCall('video')}><GradientIcon icon={VideoIcon} className="h-5 w-5" /></Button>
        </div>
      </header>
       
      <AgentPicker
        show={showAgentPicker}
        onSelect={handleAgentSelect}
        onCancel={() => setShowAgentPicker(false)}
      />

      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex justify-center p-2 border-b">
           <Tabs defaultValue="ai" className="w-auto">
              <TabsList>
                <TabsTrigger value="ai" onClick={() => router.push('/create/ai')}>AkiliPesa AI</TabsTrigger>
                <TabsTrigger value="camera" onClick={() => router.push('/create/camera')}>Camera</TabsTrigger>
                <TabsTrigger value="upload" onClick={() => router.push('/create/upload')}>Upload</TabsTrigger>
              </TabsList>
            </Tabs>
        </div>
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
            {messages.map(msg => (
              <div key={msg.id} className={cn(
                "flex items-start gap-3 max-w-[85%]",
                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              )}>
                {msg.sender === 'ai' ? (
                  <Avatar className="w-8 h-8 bg-gradient-tanzanite p-0.5">
                    <div className="bg-background rounded-full w-full h-full flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  </Avatar>
                ) : (
                  <FallbackAvatar src={msg.avatar} alt={msg.username} className="w-8 h-8" />
                )}
                <div className={cn(
                  "rounded-2xl px-4 py-2.5 text-sm",
                  msg.sender === 'user'
                    ? 'bg-gradient-tanzanite text-primary-foreground rounded-br-none'
                    : 'bg-secondary rounded-bl-none'
                )}>
                  <p>{msg.text}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <footer className="p-2 border-t bg-background">
        <div className="bg-muted/50 rounded-xl p-2 space-y-2">
           <div className="flex items-center gap-2 px-1">
             <Globe className="h-5 w-5 text-gradient"/>
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
                <Button onClick={handleSend} size="icon" className="h-8 w-8 rounded-full bg-gradient-tanzanite"><SendHorizonal className="h-5 w-5" /></Button>
            </div>
          </div>
           <p className="text-xs text-muted-foreground px-2">Session: {session?.sessionId ?? 'Inactive'}</p>
        </div>
      </footer>
    </div>
  );
}

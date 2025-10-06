
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Sparkles, Camera, Upload, Paperclip, Mic, Send, X, Phone, Video, SwitchCamera, Circle } from 'lucide-react';
import { UserAvatar } from '@/components/user-avatar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

type Tab = 'ai' | 'camera' | 'upload';

export default function UploadPage() {
  const [activeTab, setActiveTab] = useState<Tab>('ai');
  const router = useRouter();

  const renderContent = () => {
    switch (activeTab) {
      case 'ai':
        return <AICreationScreen />;
      case 'camera':
        return <CameraScreen />;
      case 'upload':
        return <UploadScreen />;
      default:
        return null;
    }
  };

  const getHeaderText = () => {
    switch (activeTab) {
      case 'ai':
        return "Start typing below.";
      case 'camera':
        return "Capture new content.";
      case 'upload':
        return "Select from device.";
      default:
        return "";
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')}><X className="h-6 w-6"/></Button>
            <p className="text-muted-foreground">{getHeaderText()}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon"><Phone className="h-6 w-6 text-primary"/></Button>
            <Button variant="ghost" size="icon"><Video className="h-6 w-6 text-primary"/></Button>
          </div>
        </div>
        <div className="mt-4 flex justify-around items-center">
          <TabButton
            label="AkiliPesa AI"
            isActive={activeTab === 'ai'}
            onClick={() => setActiveTab('ai')}
          />
          <TabButton
            label="Camera"
            isActive={activeTab === 'camera'}
            onClick={() => setActiveTab('camera')}
          />
          <TabButton
            label="Upload"
            isActive={activeTab === 'upload'}
            onClick={() => setActiveTab('upload')}
          />
        </div>
      </header>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}

const AICreationScreen = () => {
  return (
    <div className="flex-1 flex flex-col bg-muted/30">
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        {/* Initial AI Welcome Message */}
        <div className="flex items-start gap-3">
          <Avatar className="w-8 h-8 border-2 border-primary">
            <AvatarFallback><Sparkles className="w-4 h-4"/></AvatarFallback>
          </Avatar>
          <div className="bg-background rounded-lg p-3 max-w-[80%]">
            <p className="font-semibold text-primary mb-1">AkiliPesa AI</p>
            <p className="text-sm">Hello! How can I help you create today? You can ask me to generate a video, create a song, design an ad, or even clone your voice.</p>
            <p className="text-xs text-muted-foreground mt-2">10:30 AM</p>
          </div>
        </div>

        {/* User Message Example */}
        <div className="flex items-start gap-3 justify-end">
          <div className="bg-primary text-primary-foreground rounded-lg p-3 max-w-[80%]">
            <p className="text-sm">Create a 15-second video ad for a new coffee shop called "Zanzibar Beans". Show a beautiful sunrise over the ocean and fresh coffee brewing.</p>
            <p className="text-xs text-primary-foreground/70 mt-2 text-right">10:31 AM</p>
          </div>
          <UserAvatar className="w-8 h-8"/>
        </div>

        {/* AI Processing / Response Example */}
        <div className="flex items-start gap-3">
          <Avatar className="w-8 h-8 border-2 border-primary">
            <AvatarFallback><Sparkles className="w-4 h-4"/></AvatarFallback>
          </Avatar>
          <div className="bg-background rounded-lg p-3 max-w-[80%]">
            <p className="font-semibold text-primary mb-1">AkiliPesa AI</p>
            <p className="text-sm">Certainly! Generating a video for "Zanzibar Beans" now. This may take a moment...</p>
            <div className="w-full bg-muted rounded-full h-2.5 my-3">
              <div className="bg-primary h-2.5 rounded-full w-[45%] animate-pulse"></div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">10:32 AM</p>
          </div>
        </div>
      </div>
      
      {/* Chat Input */}
      <div className="p-4 bg-background/80 backdrop-blur-lg border-t border-border/50 supports-[padding-bottom:env(safe-area-inset-bottom)]:pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <div className="relative bg-muted/50 rounded-xl p-2 flex items-end gap-2">
          <Button variant="ghost" size="icon" className="shrink-0">
            <Paperclip className="h-5 w-5" />
          </Button>
          <Textarea 
            placeholder="Message AkiliPesa AI..." 
            className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 resize-none min-h-[24px] max-h-36 placeholder:text-muted-foreground/80 placeholder:text-xs md:placeholder:text-sm"
            rows={1}
          />
          <Button variant="ghost" size="icon" className="shrink-0">
            <Mic className="h-5 w-5" />
          </Button>
          <Button size="icon" className="shrink-0 h-9 w-9 rounded-full bg-primary">
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};


const CameraScreen = () => {
    const { toast } = useToast();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

    useEffect(() => {
        const getCameraPermission = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facingMode } });
                setHasCameraPermission(true);

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (error) {
                console.error('Error accessing camera:', error);
                setHasCameraPermission(false);
                toast({
                    variant: 'destructive',
                    title: 'Camera Access Denied',
                    description: 'Please enable camera permissions in your browser settings to use this app.',
                });
            }
        };

        getCameraPermission();
        
        return () => {
            if(videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        }
    }, [toast, facingMode]);

    const handleSwapCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    }

    return (
        <div className="relative flex-1 bg-black">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
            
            {!hasCameraPermission && hasCameraPermission !== null && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                    <Alert variant="destructive" className="w-11/12 max-w-sm">
                        <AlertTitle>Camera Access Required</AlertTitle>
                        <AlertDescription>
                            Please allow camera access to use this feature. You may need to change permissions in your browser settings.
                        </AlertDescription>
                    </Alert>
                </div>
            )}

            <div className="absolute top-4 right-4 z-10">
                <Button variant="ghost" size="icon" onClick={handleSwapCamera} className="bg-black/30 hover:bg-black/50 text-white rounded-full">
                    <SwitchCamera className="h-6 w-6" />
                </Button>
            </div>

            <div className="absolute bottom-0 left-0 right-0 z-10 flex justify-center pb-8 supports-[padding-bottom:env(safe-area-inset-bottom)]:pb-[calc(env(safe-area-inset-bottom)+2rem)]">
                <button className="w-16 h-16 rounded-full bg-white/30 border-4 border-white flex items-center justify-center backdrop-blur-sm">
                    <div className="w-12 h-12 rounded-full bg-white"></div>
                </button>
            </div>
        </div>
    );
};


const UploadScreen = () => {
    return (
        <div className="flex flex-col h-full items-center justify-center p-4 bg-muted/30">
             <div className="border-2 border-dashed border-muted-foreground/50 rounded-lg p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors">
                <Upload className="h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold">Select video to upload</h2>
                <p className="text-muted-foreground mt-1">Or drag and drop a file</p>
                <p className="text-xs text-muted-foreground mt-4">MP4, WebM, or other video formats</p>
                <Button className="mt-6">Select file</Button>
            </div>
        </div>
    );
};


interface TabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const TabButton = ({ label, isActive, onClick }: TabButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 text-center py-2 text-muted-foreground transition-colors text-lg',
        isActive ? 'text-white font-bold border-b-2 border-white' : 'hover:text-foreground'
      )}
    >
      {label}
    </button>
  );
};

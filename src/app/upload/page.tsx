'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Sparkles, Camera, Upload, Paperclip, Mic, Send, X, Phone, Video } from 'lucide-react';
import { UserAvatar } from '@/components/user-avatar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

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
              isActive={active-tab === 'camera'}
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
    <div className="flex flex-col h-full bg-muted/30">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
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
      <div className="p-4 bg-background/80 backdrop-blur-lg border-t border-border/50">
        <div className="relative bg-muted/50 rounded-xl p-2 flex items-end gap-2">
            <Button variant="ghost" size="icon" className="shrink-0">
              <Paperclip className="h-5 w-5" />
            </Button>
            <Textarea 
                placeholder="Message AkiliPesa AI..." 
                className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 resize-none min-h-[24px] max-h-36" 
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
    return (
        <div className="flex flex-col h-full items-center justify-center text-center p-4 bg-black">
            <Camera className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-white">Camera Interface</h2>
            <p className="text-muted-foreground mt-1">Ready to capture content.</p>
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

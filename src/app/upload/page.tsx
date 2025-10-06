'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Sparkles, Camera, Upload, Paperclip, Mic, Send, X, Phone, Video } from 'lucide-react';
import { UserAvatar } from '@/components/user-avatar';

type Tab = 'ai' | 'camera' | 'upload';

export default function CreatePage() {
  const [activeTab, setActiveTab] = useState<Tab>('ai');

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

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* The main content area will fill the space between header and footer */}
      <div className="flex-1 flex flex-col">
        {renderContent()}
      </div>

      {/* Bottom Tab Navigator */}
      <div className="bg-background border-t border-border/50">
        <div className="flex justify-around items-center h-16">
          <TabButton
            icon={Sparkles}
            label="AkiliPesa AI"
            isActive={activeTab === 'ai'}
            onClick={() => setActiveTab('ai')}
          />
          <TabButton
            icon={Camera}
            label="Camera"
            isActive={activeTab === 'camera'}
            onClick={() => setActiveTab('camera')}
          />
          <TabButton
            icon={Upload}
            label="Upload"
            isActive={activeTab === 'upload'}
            onClick={() => setActiveTab('upload')}
          />
        </div>
      </div>
    </div>
  );
}

const AICreationScreen = () => {
  return (
    <div className="flex flex-col h-full">
      <header className="p-4 flex items-center justify-between border-b border-border/50">
          <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon"><X className="h-6 w-6"/></Button>
              <p className="text-muted-foreground">Start typing below.</p>
          </div>
          <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon"><Phone className="h-6 w-6 text-primary"/></Button>
              <Button variant="ghost" size="icon"><Video className="h-6 w-6 text-primary"/></Button>
          </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <Sparkles className="h-16 w-16 text-primary/50 mb-4" />
        <h2 className="text-2xl font-bold mb-2">AkiliPesa AI</h2>
        <p className="text-muted-foreground max-w-sm">
          Describe what you want to create. Generate video ads, music, avatars, and more.
        </p>
      </div>
      
      <div className="p-4 bg-background">
        <div className="relative">
          <Input 
            placeholder="Message AkiliPesa AI..." 
            className="pl-10 pr-24 h-12 rounded-full bg-muted border-border/50" 
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <UserAvatar className="h-6 w-6" />
          </div>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Paperclip className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Mic className="h-5 w-5" />
            </Button>
            <Button size="icon" className="h-9 w-9 rounded-full bg-primary">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};


const CameraScreen = () => {
    return (
        <div className="flex flex-col h-full items-center justify-center text-center p-4">
            <Camera className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold">Camera Interface</h2>
            <p className="text-muted-foreground mt-1">Ready to capture content.</p>
        </div>
    );
};

const UploadScreen = () => {
    return (
        <div className="flex flex-col h-full items-center justify-center text-center p-4">
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
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const TabButton = ({ icon: Icon, label, isActive, onClick }: TabButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 flex flex-col items-center justify-center gap-1.5 text-muted-foreground transition-colors h-full',
        isActive ? 'text-white font-bold' : 'hover:text-foreground'
      )}
    >
      <span className="text-sm">{label}</span>
    </button>
  );
};

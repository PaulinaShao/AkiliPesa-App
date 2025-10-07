
'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Camera, Upload, X, SwitchCamera, Zap, Timer, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

const tabs = ['Camera', 'Templates', 'AI'];

export default function UploadPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Camera');
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center p-4">
        <Button variant="ghost" size="icon" className="rounded-full bg-black/50" onClick={() => router.back()}>
          <X className="h-6 w-6" />
        </Button>
        <div className="flex gap-2 items-center text-sm p-1 rounded-full bg-black/50">
            <Zap className="h-5 w-5 text-yellow-300"/>
            <span className="font-semibold">AI Tools</span>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full bg-black/50"><SwitchCamera className="h-6 w-6"/></Button>
            <Button variant="ghost" size="icon" className="rounded-full bg-black/50"><Timer className="h-6 w-6"/></Button>
            <Button variant="ghost" size="icon" className="rounded-full bg-black/50"><Settings className="h-6 w-6"/></Button>
        </div>
      </header>

      {/* Main Content (Camera View) */}
      <main className="flex-1 relative">
        <video ref={videoRef} className="w-full h-full object-cover" playsInline autoPlay muted loop/>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
      </main>

      {/* Footer */}
      <footer className="z-10 p-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" className="bg-white/90 text-black font-bold">
            <Upload className="h-5 w-5 mr-2" />
            Upload
          </Button>
          <div className="flex flex-col items-center">
            <button className="w-20 h-20 rounded-full bg-red-500 border-4 border-white"></button>
          </div>
          <Button variant="secondary" className="font-bold">
            Effects
          </Button>
        </div>
        <div className="flex justify-center gap-8 mt-4">
          {tabs.map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={cn(
                "text-lg font-semibold",
                activeTab === tab ? 'text-white' : 'text-gray-400'
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}


'use client';

import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Camera, Upload, X, SwitchCamera, Zap, Timer, Settings, Phone, Video as VideoIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';


export default function CameraPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [hasCameraPermission, setHasCameraPermission] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Not Supported',
          description: 'Your browser does not support camera access.',
        });
        return;
      }
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({video: true});
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
          description: 'Please enable camera permissions in your browser settings to use this feature.',
        });
      }
    };

    getCameraPermission();
  }, [toast]);

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      <header className="flex items-center justify-between p-2 border-b border-b-neutral-800 shrink-0 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
          <X className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-semibold">Create</h1>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon"><Phone className="h-5 w-5 text-primary" /></Button>
          <Button variant="ghost" size="icon"><VideoIcon className="h-5 w-5 text-primary" /></Button>
        </div>
      </header>

      <div className="flex justify-center p-2 border-b border-b-neutral-800">
          <Tabs defaultValue="camera" className="w-auto">
            <TabsList>
              <TabsTrigger value="ai" onClick={() => router.push('/create/ai')}>AkiliPesa AI</TabsTrigger>
              <TabsTrigger value="camera" onClick={() => router.push('/create/camera')}>Camera</TabsTrigger>
              <TabsTrigger value="upload" onClick={() => router.push('/create/upload')}>Upload</TabsTrigger>
            </TabsList>
          </Tabs>
      </div>

      {/* Main Content (Camera View) */}
      <main className="flex-1 relative flex items-center justify-center bg-black">
        <video ref={videoRef} className="w-full h-full object-cover" playsInline autoPlay muted />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
         {!hasCameraPermission && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-4">
                <Alert variant="destructive">
                  <AlertTitle>Camera Access Required</AlertTitle>
                  <AlertDescription>
                    Please allow camera access in your browser settings to use this feature.
                  </AlertDescription>
              </Alert>
            </div>
        )}
         <div className="absolute top-4 right-4 flex flex-col gap-4">
            <Button variant="ghost" size="icon" className="rounded-full bg-black/50"><SwitchCamera className="h-6 w-6"/></Button>
            <Button variant="ghost" size="icon" className="rounded-full bg-black/50"><Timer className="h-6 w-6"/></Button>
            <Button variant="ghost" size="icon" className="rounded-full bg-black/50"><Settings className="h-6 w-6"/></Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="z-10 p-4 bg-black">
        <div className="flex items-center justify-around">
          <Button variant="ghost" className="font-bold text-base">
            Effects
          </Button>
          <div className="flex flex-col items-center">
            <button className="w-20 h-20 rounded-full bg-red-500 border-4 border-white"></button>
          </div>
           <Button variant="ghost" className="font-bold text-base" onClick={() => router.push('/create/upload')}>
            <Upload className="h-5 w-5 mr-2" />
            Upload
          </Button>
        </div>
      </footer>
    </div>
  );
}

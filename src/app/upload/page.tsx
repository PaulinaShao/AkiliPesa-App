
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Sparkles, Camera, Upload, Paperclip, Mic, Send, X, Phone, Video, SwitchCamera, Zap, Timer, Settings } from 'lucide-react';
import { UserAvatar } from '@/components/user-avatar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import Webcam from 'react-webcam';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/firebase/config";
import dynamic from 'next/dynamic';

type Tab = 'ai' | 'camera' | 'upload';

export default function UploadPage() {
  const [activeTab, setActiveTab] = useState<Tab>('camera');
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
      <header className="p-4 border-b border-border/50 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')}><X className="h-6 w-6"/></Button>
            <p className="text-muted-foreground">{getHeaderText()}</p>
          </div>
          <div className="flex items-center gap-2">
             {activeTab !== 'camera' && 
                <>
                    <Button variant="ghost" size="icon"><Phone className="h-6 w-6 text-primary"/></Button>
                    <Button variant="ghost" size="icon"><Video className="h-6 w-6 text-primary"/></Button>
                </>
             }
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
    <div className="flex-1 flex flex-col bg-muted/30 overflow-hidden">
      {/* Chat History */}
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


const CameraView = () => {
    const { toast } = useToast();
    const webcamRef = useRef<Webcam>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [captureMode, setCaptureMode] = useState<'photo' | 'video'>('photo');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingProgress, setRecordingProgress] = useState(0);
    const [preview, setPreview] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<'photo' | 'video' | null>(null);

    const filters = ['Normal', 'Fresh', 'Vintage', 'Cinematic', 'B&W'];
    const [activeFilter, setActiveFilter] = useState('Normal');

    const filterClasses: Record<string, string> = {
        'Normal': 'filter-none',
        'Fresh': 'saturate-150 brightness-105',
        'Vintage': 'sepia-[.6] contrast-[1.1]',
        'Cinematic': 'contrast-125 brightness-90',
        'B&W': 'grayscale-100',
    };
    
    useEffect(() => {
        const getPermission = async () => {
            try {
                // We only need to ask for permission, not use the stream directly here.
                // react-webcam will handle getting the stream.
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                // We need to stop the tracks immediately, otherwise the browser will show that the camera is in use.
                stream.getTracks().forEach(track => track.stop());
                setHasCameraPermission(true);
            } catch (error: any) {
                console.error('Error accessing camera:', error);
                setHasCameraPermission(false);
                let title = 'Camera Access Denied';
                let description = 'Please enable camera permissions in your browser settings.';
                if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                    title = 'Camera Not Found';
                    description = 'No camera was found on your device.';
                }
                toast({ variant: 'destructive', title, description });
            }
        };
        getPermission();
    }, [toast]);
    
    const handleUserMedia = () => {
      if (hasCameraPermission === null) {
        setHasCameraPermission(true);
      }
    };

    const handleUserMediaError = (error: any) => {
        if (hasCameraPermission !== false) {
             console.error('Error accessing camera:', error);
            setHasCameraPermission(false);
            let title = 'Camera Access Denied';
            let description = 'Please enable camera permissions in your browser settings.';
            if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                title = 'Camera Not Found';
                description = 'No camera was found on your device.';
            }
            toast({ variant: 'destructive', title, description });
        }
    };
    
    const uploadToFirebase = async (blob: Blob, type: 'photo' | 'video') => {
        const fileExtension = type === 'photo' ? 'png' : 'webm';
        const storagePath = `${type}s/${Date.now()}.${fileExtension}`;
        const storageRef = ref(storage, storagePath);
        
        try {
            await uploadBytes(storageRef, blob);
            const url = await getDownloadURL(storageRef);
            return url;
        } catch (error) {
            console.error("Failed to upload to Firebase:", error);
            toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload your media.' });
            return null;
        }
    };


    const handleTakePhoto = useCallback(async () => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot({width: 1080, height: 1920});
            if (imageSrc) {
                setPreview(imageSrc);
                setMediaType('photo');
            }
        }
    }, [webcamRef]);
    
    const startRecording = useCallback(() => {
        if (webcamRef.current?.stream && !isRecording) {
            const stream = webcamRef.current.stream;
            if (!stream.active) {
                toast({ variant: 'destructive', title: 'Stream not active', description: 'Could not start recording.' });
                return;
            }
            
            setIsRecording(true);
            setRecordingProgress(0);

            try {
                mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm' });
            } catch(e) {
                console.error("Error creating MediaRecorder: ", e);
                toast({ variant: 'destructive', title: 'Recording Error', description: 'Your browser may not support video recording.' });
                setIsRecording(false);
                return;
            }

            const chunks: Blob[] = [];
            
            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };
            
            mediaRecorderRef.current.onstop = () => {
                if (chunks.length > 0) {
                    const blob = new Blob(chunks, { type: 'video/webm' });
                    const url = URL.createObjectURL(blob);
                    setPreview(url);
                    setMediaType('video');
                }
                setIsRecording(false);
                setRecordingProgress(0);
                if (recordingTimeoutRef.current) {
                    clearInterval(recordingTimeoutRef.current);
                }
            };
            
            mediaRecorderRef.current.start();

            const maxDuration = 15000; // 15 seconds
            const intervalTime = 100;
            recordingTimeoutRef.current = setInterval(() => {
                setRecordingProgress(prev => {
                    const nextProgress = prev + (100 / (maxDuration / intervalTime));
                    if (nextProgress >= 100) {
                        stopRecording();
                        return 100;
                    }
                    return nextProgress;
                });
            }, intervalTime);
        }
    }, [isRecording, webcamRef, toast]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
        }
    }, [isRecording]);
    
    const handleSwapCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    const handleSave = async () => {
        if (!preview || !mediaType) return;

        const res = await fetch(preview);
        const blob = await res.blob();
        
        const uploadedUrl = await uploadToFirebase(blob, mediaType);
        if (uploadedUrl) {
            toast({ title: 'Upload Successful!', description: 'Your media has been saved.' });
            // Here you would typically navigate to an editor or post screen
            // For now, just reset
            setPreview(null);
            setMediaType(null);
        }
    };
    
    if (preview) {
        return (
            <div className="relative flex-1 bg-black text-white">
                {mediaType === 'photo' ? (
                    <img src={preview} alt="Captured" className="w-full h-full object-contain" />
                ) : (
                    <video src={preview} controls autoPlay loop className="w-full h-full object-contain" />
                )}
                <div className="absolute top-4 left-4 z-20">
                     <Button variant="ghost" size="icon" onClick={() => { setPreview(null); setMediaType(null); }}><X className="h-6 w-6 text-white"/></Button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 z-20 flex justify-center items-center p-4 bg-gradient-to-t from-black/50 to-transparent gap-4">
                    <Button variant="outline" className="flex-1" onClick={() => { setPreview(null); setMediaType(null); }}>Retake</Button>
                    <Button className="flex-1" onClick={handleSave}>Save & Post</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex-1 bg-black text-white overflow-hidden flex flex-col">
            <div className="relative flex-1 w-full h-full">
                {hasCameraPermission ? (
                    <Webcam
                        audio={false} // audio is requested in permissions, but not needed for recorder
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{ facingMode, width: 1080, height: 1920, aspectRatio: 9/16 }}
                        onUserMedia={handleUserMedia}
                        onUserMediaError={handleUserMediaError}
                        className={cn("absolute inset-0 w-full h-full object-cover transition-all duration-300", filterClasses[activeFilter])}
                        mirrored={facingMode === 'user'}
                    />
                 ) : null }
                
                {hasCameraPermission === null && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                        <p>Starting camera...</p>
                    </div>
                )}

                {hasCameraPermission === false && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-4">
                        <Alert variant="destructive" className="w-full max-w-sm">
                            <AlertTitle>Camera Access Blocked</AlertTitle>
                            <AlertDescription>
                                AkiliPesa needs camera access to work. Please enable it in your browser settings and refresh the page.
                            </AlertDescription>
                        </Alert>
                    </div>
                )}
            
                {/* Top Controls */}
                <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-4 bg-gradient-to-b from-black/50 to-transparent">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="text-white rounded-full"><Zap className="h-6 w-6" /></Button>
                        <Button variant="ghost" size="icon" onClick={handleSwapCamera} className="text-white rounded-full"><SwitchCamera className="h-6 w-6" /></Button>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="text-white rounded-full"><Timer className="h-6 w-6" /></Button>
                        <Button variant="ghost" size="icon" className="text-white rounded-full"><Settings className="h-6 w-6" /></Button>
                    </div>
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="shrink-0 z-10 flex flex-col items-center pb-6 supports-[padding-bottom:env(safe-area-inset-bottom)]:pb-[calc(env(safe-area-inset-bottom)+1.5rem)] bg-gradient-to-t from-black/50 to-transparent">
                {/* Filters */}
                <div className="flex gap-4 mb-6 overflow-x-auto px-4 pb-2 w-full">
                    {filters.map(filter => (
                        <button key={filter} onClick={() => setActiveFilter(filter)} className={cn("px-3 py-1 rounded-full text-sm shrink-0", activeFilter === filter ? 'bg-white/90 text-black font-bold' : 'bg-black/40 text-white')}>
                            {filter}
                        </button>
                    ))}
                </div>

                {/* Capture Button and Mode Toggle */}
                <div className="w-full flex items-center justify-center gap-12">
                    <button onClick={() => setCaptureMode('photo')} className={cn("font-semibold", captureMode === 'photo' ? 'text-white' : 'text-gray-400')}>PHOTO</button>
                    
                    <div className="relative w-20 h-20 flex items-center justify-center">
                        <svg className="absolute w-full h-full" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="48" stroke="rgba(255,255,255,0.3)" strokeWidth="4" fill="none" />
                            {isRecording && <circle 
                                cx="50" cy="50" r="48" 
                                stroke="#f87171" strokeWidth="4" fill="none"
                                strokeDasharray="301.59"
                                strokeDashoffset={301.59 * (1 - recordingProgress / 100)}
                                transform="rotate(-90 50 50)"
                                style={{ transition: 'stroke-dashoffset 0.1s linear' }}
                            />}
                        </svg>

                        <button
                            onClick={captureMode === 'photo' ? handleTakePhoto : undefined}
                            onMouseDown={captureMode === 'video' ? startRecording : undefined}
                            onMouseUp={captureMode === 'video' ? stopRecording : undefined}
                            onTouchStart={captureMode === 'video' ? startRecording : undefined}
                            onTouchEnd={captureMode === 'video' ? stopRecording : undefined}
                            className="w-16 h-16 rounded-full bg-white flex items-center justify-center transition-transform active:scale-90"
                            aria-label={captureMode === 'photo' ? 'Take Photo' : 'Record Video'}
                            disabled={hasCameraPermission !== true}
                        >
                            {captureMode === 'video' && <div className={cn("w-8 h-8 rounded-full bg-red-500 transition-all duration-300", isRecording ? "w-5 h-5 rounded-md" : "")}></div>}
                        </button>
                    </div>

                    <button onClick={() => setCaptureMode('video')} className={cn("font-semibold", captureMode === 'video' ? 'text-white' : 'text-gray-400')}>VIDEO</button>
                </div>
            </div>
        </div>
    );
};

const CameraScreen = () => {
    const CameraViewWithNoSSR = dynamic(() => Promise.resolve(CameraView), {
        ssr: false,
        loading: () => <div className="absolute inset-0 flex items-center justify-center bg-black/70"><p>Starting camera...</p></div>
    });

    return <CameraViewWithNoSSR />;
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

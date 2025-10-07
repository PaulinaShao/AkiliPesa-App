
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Sparkles, Camera, Upload, Paperclip, Mic, Send, X, Phone, Video, SwitchCamera, Circle, Zap, Timer, Settings } from 'lucide-react';
import { UserAvatar } from '@/components/user-avatar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

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
      <header className="p-4 border-b border-border/50">
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
            isActive={activeTeb === 'camera'}
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


const CameraScreen = () => {
    const { toast } = useToast();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [supportsFacingMode, setSupportsFacingMode] = useState(false);
    const [captureMode, setCaptureMode] = useState<'photo' | 'video'>('photo');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingProgress, setRecordingProgress] = useState(0);
    const [capturedMedia, setCapturedMedia] = useState<{ type: 'photo' | 'video'; url: string } | null>(null);

    const filters = ['Normal', 'Fresh', 'Vintage', 'Cinematic', 'B&W'];
    const [activeFilter, setActiveFilter] = useState('Normal');

    const filterClasses: Record<string, string> = {
        'Normal': 'filter-none',
        'Fresh': 'saturate-150',
        'Vintage': 'sepia',
        'Cinematic': 'contrast-125',
        'B&W': 'grayscale',
    };

    const setupCamera = useCallback(async (facing: 'user' | 'environment') => {
        setIsCameraReady(false);
        if (videoRef.current?.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        }

        try {
            const constraints: MediaStreamConstraints = {
                video: {
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    facingMode: supportsFacingMode ? facing : undefined,
                },
                audio: false
            };
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            setHasCameraPermission(true);

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(err => {
                    console.error("Video play failed:", err);
                    // This can happen if the user navigates away quickly
                });
                videoRef.current.onloadedmetadata = () => {
                    setIsCameraReady(true);
                }
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            setHasCameraPermission(false);
            const err = error as Error;
            let title = 'Camera Access Denied';
            let description = 'Please enable camera permissions in your browser settings.';
            if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                title = 'Camera Not Found';
                description = 'No camera was found on your device.';
            } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                // Already the default message
            }
            toast({ variant: 'destructive', title, description });
        }
    }, [toast, supportsFacingMode]);
    
    useEffect(() => {
        const checkFacingModeSupport = async () => {
            if (navigator.mediaDevices?.getSupportedConstraints) {
                const supported = navigator.mediaDevices.getSupportedConstraints();
                setSupportsFacingMode(supported.facingMode || false);
            }
        };
        checkFacingModeSupport();
    }, []);

    useEffect(() => {
        setupCamera(facingMode);
    
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
            if (recordingTimeoutRef.current) {
                clearInterval(recordingTimeoutRef.current);
            }
        };
    }, [facingMode]);


    const handleSwapCamera = () => {
        if (supportsFacingMode) {
            setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
        }
    };

    const handleTakePhoto = () => {
        if (!videoRef.current || !canvasRef.current || !isCameraReady) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.filter = window.getComputedStyle(video).filter;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            setCapturedMedia({ type: 'photo', url: dataUrl });
        }
    };
    
    const startRecording = () => {
        if (!videoRef.current?.srcObject || isRecording || !isCameraReady) return;
        
        setIsRecording(true);
        setRecordingProgress(0);
        
        const stream = videoRef.current.srcObject as MediaStream;
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm' });
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
                setCapturedMedia({ type: 'video', url });
            }
            setIsRecording(false);
            if (recordingTimeoutRef.current) {
                clearInterval(recordingTimeoutRef.current);
            }
        };
        
        mediaRecorderRef.current.start();

        const maxDuration = 15000; // 15 seconds
        recordingTimeoutRef.current = setInterval(() => {
            setRecordingProgress(prev => {
                const nextProgress = prev + (100 / (maxDuration / 100));
                if (nextProgress >= 100) {
                    stopRecording();
                    return 100;
                }
                return nextProgress;
            });
        }, 100);
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
        }
    };

    if (capturedMedia) {
        return (
            <div className="relative flex-1 bg-black text-white">
                {capturedMedia.type === 'photo' ? (
                    <img src={capturedMedia.url} alt="Captured" className="w-full h-full object-contain" />
                ) : (
                    <video src={capturedMedia.url} controls autoPlay loop className="w-full h-full object-contain" />
                )}
                <div className="absolute bottom-0 left-0 right-0 z-20 flex justify-between items-center p-4 bg-gradient-to-t from-black/50 to-transparent">
                    <Button variant="ghost" onClick={() => { setCapturedMedia(null); setupCamera(facingMode); }}>Retake</Button>
                    <Button>Next</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex-1 bg-black text-white overflow-hidden">
            <video ref={videoRef} style={{ filter: filterClasses[activeFilter].replace(/_/g, ' ') }} className="w-full h-full object-cover" autoPlay muted playsInline />
            <canvas ref={canvasRef} className="hidden"></canvas>
            
            {!isCameraReady && hasCameraPermission !== false && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                    <p>Starting camera...</p>
                </div>
            )}

            {hasCameraPermission === false && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-4">
                    <Alert variant="destructive" className="w-full max-w-sm">
                        <AlertTitle>Camera Access Required</AlertTitle>
                        <AlertDescription>
                            Please allow camera access. You may need to change permissions in your browser settings.
                        </AlertDescription>
                    </Alert>
                </div>
            )}
            
            {/* Top Controls */}
            <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-4 bg-gradient-to-b from-black/50 to-transparent">
                <div className="flex items-center gap-4">
                     <Button variant="ghost" size="icon" className="text-white rounded-full"><Zap className="h-6 w-6" /></Button>
                     {supportsFacingMode && <Button variant="ghost" size="icon" onClick={handleSwapCamera} className="text-white rounded-full"><SwitchCamera className="h-6 w-6" /></Button>}
                </div>
                 <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="text-white rounded-full"><Timer className="h-6 w-6" /></Button>
                    <Button variant="ghost" size="icon" className="text-white rounded-full"><Settings className="h-6 w-6" /></Button>
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col items-center pb-6 supports-[padding-bottom:env(safe-area-inset-bottom)]:pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
                {/* Filters */}
                <div className="flex gap-4 mb-6">
                    {filters.map(filter => (
                        <button key={filter} onClick={() => setActiveFilter(filter)} className={cn("px-3 py-1 rounded-full text-sm", activeFilter === filter ? 'bg-white/90 text-black font-bold' : 'bg-black/40 text-white')}>
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
                                className="transition-all duration-100"
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
                            disabled={!isCameraReady}
                        >
                            {captureMode === 'video' && <div className={cn("w-8 h-8 rounded-full bg-red-500 transition-all", isRecording && "w-6 h-6 rounded-md")}></div>}
                        </button>
                    </div>

                    <button onClick={() => setCaptureMode('video')} className={cn("font-semibold", captureMode === 'video' ? 'text-white' : 'text-gray-400')}>VIDEO</button>
                </div>
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

    
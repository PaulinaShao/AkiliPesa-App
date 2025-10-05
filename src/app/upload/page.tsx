'use client';

import { UploadCloud } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';

export default function UploadPage() {
  const router = useRouter();

  const handleUpload = () => {
    // In a real app, you would handle file upload here.
    // For now, we'll just redirect to a mock edit page.
    router.push('/edit/v1');
  };

  return (
    <>
    <Header />
    <div className="flex flex-col items-center justify-center h-screen p-4 bg-muted/20 pt-16">
      <div className="w-full max-w-2xl">
        <div className="bg-background rounded-xl shadow-lg p-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold">Upload video</h1>
            <p className="text-muted-foreground mt-2">Post a video to your account</p>
          </div>
          
          <div className="border-2 border-dashed border-muted-foreground/50 rounded-lg p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors">
            <UploadCloud className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold">Select video to upload</h2>
            <p className="text-muted-foreground mt-1">Or drag and drop a file</p>
            <p className="text-xs text-muted-foreground mt-4">MP4 or WebM</p>
            <p className="text-xs text-muted-foreground">720x1280 resolution or higher</p>
            <p className="text-xs text-muted-foreground">Up to 10 minutes</p>
            <p className="text-xs text-muted-foreground">Less than 2 GB</p>
            <Button className="mt-6" onClick={() => document.getElementById('file-upload')?.click()}>
              Select file
            </Button>
            <input id="file-upload" type="file" className="hidden" onChange={handleUpload}/>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

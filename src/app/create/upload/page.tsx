
'use client';

import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Phone, Video as VideoIcon, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
    const router = useRouter();

  return (
    <div className="flex flex-col h-screen dark bg-background text-foreground">
        <header className="flex items-center justify-between p-2 border-b shrink-0 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
            <X className="h-6 w-6" />
            </Button>
            <h1 className="text-lg font-semibold">Create</h1>
            <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon"><Phone className="h-5 w-5 text-primary" /></Button>
            <Button variant="ghost" size="icon"><VideoIcon className="h-5 w-5 text-primary" /></Button>
            </div>
        </header>

        <div className="flex justify-center p-2 border-b">
           <Tabs defaultValue="upload" className="w-auto">
              <TabsList>
                <TabsTrigger value="ai" onClick={() => router.push('/create/ai')}>AkiliPesa AI</TabsTrigger>
                <TabsTrigger value="camera" onClick={() => router.push('/create/camera')}>Camera</TabsTrigger>
                <TabsTrigger value="upload" onClick={() => router.push('/create/upload')}>Upload</TabsTrigger>
              </TabsList>
            </Tabs>
        </div>

        <main className="flex-1 flex items-center justify-center">
            <Card>
                <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">Upload from device will go here. This section is under construction.</p>
                </CardContent>
            </Card>
        </main>
    </div>
  );
}

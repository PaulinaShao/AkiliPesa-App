'use client';

import { useState, use } from 'react';
import { videos } from '@/lib/data';
import { notFound, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SlidersHorizontal, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/header';

const filters = [
  { name: 'None', style: '' },
  { name: 'B&W', style: 'grayscale' },
  { name: 'Vintage', style: 'sepia' },
  { name: 'Vibrant', style: 'saturate-150' },
  { name: 'Cool', style: 'hue-rotate-180 contrast-125' },
];

export default function EditPage({ params }: { params: Promise<{ videoId: string }> }) {
  const router = useRouter();
  const { videoId } = use(params);
  const video = videos.find(v => v.id === videoId);
  const [activeFilter, setActiveFilter] = useState('None');

  if (!video) {
    notFound();
  }

  const handlePost = () => {
    // In a real app, you would post the edited video.
    // For now, we'll just redirect to the home page.
    router.push('/');
  }

  return (
    <>
    <Header />
    <div className="flex flex-col md:flex-row h-screen bg-muted/40 pt-16">
      <div className="flex-1 flex items-center justify-center p-4 md:p-12">
        <div className="relative w-full max-w-sm aspect-[9/16] bg-black rounded-xl overflow-hidden shadow-2xl">
          <video
            src={video.videoUrl}
            loop
            autoPlay
            muted
            className={cn("w-full h-full object-cover transition-all duration-300", filters.find(f => f.name === activeFilter)?.style)}
          />
        </div>
      </div>
      <div className="w-full md:w-96 bg-background border-l p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-6">Edit Video</h1>
        <div className="space-y-6 flex-1 overflow-y-auto pr-2">
          <div>
            <Label htmlFor="caption" className="text-lg font-semibold">Caption</Label>
            <Textarea id="caption" placeholder="Write a caption..." className="mt-2" defaultValue={video.caption} />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center"><Sparkles className="w-5 h-5 mr-2 text-accent"/> Filters</h3>
            <div className="grid grid-cols-3 gap-2">
              {filters.map(filter => (
                <button key={filter.name} onClick={() => setActiveFilter(filter.name)} className={cn("aspect-square rounded-md overflow-hidden border-2", activeFilter === filter.name ? 'border-primary' : 'border-transparent')}>
                  <div className="w-full h-full relative">
                    <img src={video.thumbnailUrl} alt={filter.name} className={cn("w-full h-full object-cover", filter.style)} data-ai-hint="lifestyle" />
                    <div className="absolute inset-0 bg-black/20"></div>
                    <span className="absolute bottom-1 right-1 text-white text-xs font-bold bg-black/50 px-1 rounded">{filter.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center"><SlidersHorizontal className="w-5 h-5 mr-2"/> Trim</h3>
             <Card>
                <CardContent className="pt-6">
                    <p className="text-center text-sm text-muted-foreground">Trimming controls would go here.</p>
                </CardContent>
            </Card>
          </div>
        </div>
        <div className="mt-6 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => router.back()}>Discard</Button>
          <Button className="flex-1" onClick={handlePost}>Post</Button>
        </div>
      </div>
    </div>
    </>
  );
}

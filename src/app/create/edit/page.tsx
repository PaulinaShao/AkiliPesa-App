
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function EditPage() {
    const router = useRouter();

  return (
    <div className="flex flex-col h-screen dark bg-background text-foreground">
        <header className="flex items-center justify-between p-2 border-b shrink-0 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <X className="h-6 w-6" />
            </Button>
            <h1 className="text-lg font-semibold">Edit</h1>
            <div className="w-10"></div>
        </header>

        <main className="flex-1 flex items-center justify-center">
            <Card>
                <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">Edit screen will go here. This section is under construction.</p>
                </CardContent>
            </Card>
        </main>
    </div>
  );
}

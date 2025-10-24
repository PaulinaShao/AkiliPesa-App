
'use client';

import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

export default function AgentsPage() {
  return (
    <div className="dark">
      <Header isMuted={true} onToggleMute={() => {}} />
      <div className="max-w-xl mx-auto p-4 pt-20">
         <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Agents</h1>
             <Button variant="ghost" asChild>
                <Link href="/profile">Back to Profile</Link>
            </Button>
        </div>
        <Card>
            <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Agent management will go here. This section is under construction.</p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

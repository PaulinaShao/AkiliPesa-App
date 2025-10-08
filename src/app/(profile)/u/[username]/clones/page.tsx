'use client';

import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Dna, Mic, PlusCircle } from 'lucide-react';
import Link from 'next/link';

function ClonePlaceholder() {
  return (
    <Card className="text-center">
        <CardContent className="pt-6">
            <p className="text-muted-foreground">No clones yet. Create one to get started.</p>
        </CardContent>
    </Card>
  )
}

function CloneCard({ type }: { type: 'Face' | 'Voice' }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>My {type} Clone</span>
                    <span className="text-xs font-normal bg-green-500/20 text-green-300 px-2 py-1 rounded-full">Ready</span>
                </CardTitle>
                <CardDescription>Created on: {new Date().toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                     <p className="text-sm text-muted-foreground">Default: No</p>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm">Rename</Button>
                        <Button variant="ghost" size="sm">Set Default</Button>
                        <Button variant="destructive" size="sm">Delete</Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}


export default function ClonesPage() {
  return (
    <div className="dark">
      <Header isMuted={true} onToggleMute={() => {}} />
      <div className="max-w-4xl mx-auto p-4 pt-20">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Clones & Avatars</h1>
             <Button variant="ghost" asChild>
                <Link href="..">Back to Profile</Link>
            </Button>
        </div>

        <Tabs defaultValue="face" className="w-full">
            <div className="flex justify-between items-end mb-4">
                <TabsList>
                    <TabsTrigger value="face"><User className="mr-2 h-4 w-4"/> Face</TabsTrigger>
                    <TabsTrigger value="full-body"><Dna className="mr-2 h-4 w-4"/> Full Body</TabsTrigger>
                    <TabsTrigger value="voice"><Mic className="mr-2 h-4 w-4"/> Voice</TabsTrigger>
                </TabsList>
                <Button><PlusCircle className="mr-2 h-4 w-4"/> Create New Clone</Button>
            </div>
            <TabsContent value="face">
                <div className="space-y-4">
                    <CloneCard type="Face"/>
                </div>
            </TabsContent>
            <TabsContent value="full-body">
                 <ClonePlaceholder />
            </TabsContent>
            <TabsContent value="voice">
                <div className="space-y-4">
                    <CloneCard type="Voice"/>
                </div>
            </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

'use client';

import { Sparkles, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from './ui/button';

interface SuggestedTopicsProps {
  topics: string[];
  onClear: () => void;
}

export function SuggestedTopics({ topics, onClear }: SuggestedTopicsProps) {
  if (topics.length === 0) {
    return null;
  }

  return (
    <Card className="bg-background/80 backdrop-blur-lg border-primary/50 shadow-lg animate-in fade-in-0 slide-in-from-top-4 duration-500">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center text-base font-semibold">
          <Sparkles className="h-5 w-5 mr-2 text-accent" />
          For You
        </CardTitle>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClear}>
            <X className="h-4 w-4"/>
            <span className="sr-only">Close</span>
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">Based on what you've watched, you might like:</p>
        <div className="flex flex-wrap gap-2">
          {topics.map(topic => (
            <Badge key={topic} variant="secondary" className="text-sm cursor-pointer hover:bg-primary/20">
              {topic}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

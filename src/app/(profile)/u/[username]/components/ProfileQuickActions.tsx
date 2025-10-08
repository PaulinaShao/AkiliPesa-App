'use client';

import { Button } from '@/components/ui/button';
import { Bot, UserSquare } from 'lucide-react';
import Link from 'next/link';

export function ProfileQuickActions() {
  return (
    <div className="my-4 p-3 bg-secondary/50 rounded-lg">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">AI & Agents</h3>
        <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className="flex-1 bg-background/70 h-auto py-2">
                <Link href="clones">
                    <UserSquare className="h-5 w-5 mr-2" />
                    <div>
                        <p className="font-bold text-sm">Create/Manage Clone</p>
                        <p className="text-xs text-muted-foreground text-left">Face, Voice, Avatar</p>
                    </div>
                </Link>
            </Button>
             <Button asChild variant="outline" size="sm" className="flex-1 bg-background/70 h-auto py-2">
                <Link href="agents">
                    <Bot className="h-5 w-5 mr-2" />
                    <div>
                        <p className="font-bold text-sm">Create/Manage Agent</p>
                        <p className="text-xs text-muted-foreground text-left">Sales, Support, etc.</p>
                    </div>
                </Link>
            </Button>
        </div>
    </div>
  );
}

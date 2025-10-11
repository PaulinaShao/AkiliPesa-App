'use client';

import { Button } from '@/components/ui/button';
import { Bot, UserSquare } from 'lucide-react';
import Link from 'next/link';

export function ProfileQuickActions() {
  return (
    <div 
      className="my-4 p-4 bg-[#0A0A0A] rounded-2xl border border-[#1A1A1A] transition-shadow duration-300"
      style={{ boxShadow: '0 0 10px rgba(75,0,130,0.3)' }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 0 15px rgba(0,201,167,0.4)'}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 0 10px rgba(75,0,130,0.3)'}
    >
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">AI & Agents</h3>
        <div className="flex flex-row justify-between items-center gap-3">
            <Button asChild variant="outline" size="sm" className="flex-1 min-w-0 bg-background/70 h-auto py-2">
                <Link href="clones" className="flex items-center">
                    <UserSquare className="h-5 w-5 mr-2" />
                    <div>
                        <p className="font-bold text-sm">My Clone</p>
                        <p className="text-xs text-muted-foreground text-left">Face, Voice, Avatar</p>
                    </div>
                </Link>
            </Button>
             <Button asChild variant="outline" size="sm" className="flex-1 min-w-0 bg-background/70 h-auto py-2">
                <Link href="agents" className="flex items-center">
                    <Bot className="h-5 w-5 mr-2" />
                    <div>
                        <p className="font-bold text-sm">My Agents</p>
                        <p className="text-xs text-muted-foreground text-left">Sales, Support, etc.</p>
                    </div>
                </Link>
            </Button>
        </div>
    </div>
  );
}

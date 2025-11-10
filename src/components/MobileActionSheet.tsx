
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Phone, Video, MessageCircle, Calendar } from 'lucide-react';
import { useInitiateCall } from '@/hooks/useInitiateCall';
import { useRouter } from 'next/navigation';
import { BookingRequest } from '@/components/BookingRequest';
import { AvailabilityCalendar } from '@/components/AvailabilityCalendar';


export function MobileActionSheet({ agentId }: { agentId: string }) {
    const { initiateCall } = useInitiateCall();
    const router = useRouter();
    const [isBookingOpen, setIsBookingOpen] = useState(false);

    const handleCall = (mode: 'audio' | 'video') => {
        initiateCall({ agentId, agentType: 'user', mode });
    };

    const handleMessage = () => {
        router.push(`/inbox/${agentId}`);
    };

    return (
        <>
            <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t supports-[padding-bottom:env(safe-area-inset-bottom)]:pb-[calc(env(safe-area-inset-bottom)+1rem)]">
                <div className="grid grid-cols-4 gap-2">
                    <Button onClick={() => handleCall('audio')} variant="outline" className="flex-col h-16"><Phone className="h-6 w-6 mb-1"/><span>Audio</span></Button>
                    <Button onClick={() => handleCall('video')} variant="outline" className="flex-col h-16"><Video className="h-6 w-6 mb-1"/><span>Video</span></Button>
                    <Button onClick={handleMessage} variant="outline" className="flex-col h-16"><MessageCircle className="h-6 w-6 mb-1"/><span>Message</span></Button>
                    <Button onClick={() => setIsBookingOpen(true)} className="flex-col h-16"><Calendar className="h-6 w-6 mb-1"/><span>Book</span></Button>
                </div>
            </div>
            <Sheet open={isBookingOpen} onOpenChange={setIsBookingOpen}>
                <SheetContent side="bottom">
                    <SheetHeader>
                        <SheetTitle>Book a Session</SheetTitle>
                    </SheetHeader>
                    <div className="py-4">
                        <AvailabilityCalendar agentId={agentId} />
                        <BookingRequest agentId={agentId} />
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}

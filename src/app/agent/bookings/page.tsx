'use client';
import { Header } from '@/components/header';
import { BookingTable } from '@/components/BookingTable';
import { useFirebaseUser } from '@/firebase';

export default function AgentBookingsPage() {
  const { user } = useFirebaseUser();
  return (
    <div className="dark">
      <Header isMuted={true} onToggleMute={() => {}} />
      <div className="p-4 md:p-6 pt-20 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gradient mb-6">My Booking Requests</h1>
        {user ? <BookingTable agentId={user.uid} adminMode={false} /> : <p className="text-muted-foreground">Loading...</p>}
      </div>
    </div>
  );
}

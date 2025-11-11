
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useFirebaseUser } from '@/firebase';
import { collection, query, where, limit, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { Header } from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';
import { notFound, useParams } from 'next/navigation';
import { AgentProfilePanel } from '@/components/AgentProfilePanel';
import FallbackAvatar from '@/components/ui/FallbackAvatar';
import type { UserProfile } from 'docs/backend';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { MobileActionSheet } from '@/components/MobileActionSheet';
import { useAgentRating } from '@/hooks/useAgentRating';
import { RatingChip } from '@/components/RatingChip';
import { BookingRequest } from '@/components/BookingRequest';
import { AvailabilityCalendar } from '@/components/AvailabilityCalendar';


function StarRating({ value, setValue }: { value: number; setValue: (value: number) => void; }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <Star
          key={n}
          onClick={() => setValue(n)}
          className={n <= value ? "text-yellow-400 fill-yellow-400 cursor-pointer" : "text-muted-foreground cursor-pointer"}
        />
      ))}
    </div>
  );
}

function ReviewsSection({ agentId }: { agentId: string }) {
  const firestore = useFirestore();
  const { user } = useFirebaseUser();
  const [reviews, setReviews] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);

  const reviewsQuery = useMemoFirebase(() => {
    if (!firestore || !agentId) return null;
    const ref = collection(firestore, "agentReviews", agentId, "reviews");
    return query(ref, orderBy("createdAt", "desc"));
  }, [agentId, firestore]);

  const { data: reviewData } = useCollection(reviewsQuery);
  
  useEffect(() => {
    if (reviewData) {
      setReviews(reviewData);
    }
  }, [reviewData]);


  async function submit() {
    if (!user || !text.trim() || !firestore) return;
    const ref = collection(firestore, "agentReviews", agentId, "reviews");
    await addDoc(ref, {
      userId: user.uid,
      rating,
      text,
      createdAt: serverTimestamp()
    });
    setText("");
    setRating(5);
  }

  return (
    <div className="space-y-3 pt-8 mt-6 border-t">
      <h2 className="font-semibold text-xl">Reviews</h2>

      <div className="rounded-xl border bg-card p-4 space-y-3">
         <h3 className="font-medium">Leave a Review</h3>
        <StarRating value={rating} setValue={setRating} />
        <Textarea value={text} onChange={e => setText(e.target.value)} placeholder="Share your experience…" />
        <Button onClick={submit}>Submit Review</Button>
      </div>

      <div className="space-y-4">
        {reviews.length === 0 && <p className="text-muted-foreground text-center py-4">No reviews yet.</p>}
        {reviews.map(r => (
          <div key={r.id} className="border bg-card rounded-lg p-4">
            <div className="flex items-center justify-between">
                <div className="flex gap-1">
                {[...Array(r.rating)].map((_, i) => <Star key={i} className="text-yellow-400 fill-yellow-400 h-4 w-4" />)}
                </div>
                <p className="text-xs text-muted-foreground">{r.createdAt?.toDate().toLocaleDateString()}</p>
            </div>
            <p className="text-sm mt-2">{r.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}


export default function PublicAgentProfilePage() {
  const firestore = useFirestore();
  const params = useParams();
  const handle = params.handle as string;

  const userQuery = useMemoFirebase(() => {
    if (!firestore || !handle) return null;
    return query(collection(firestore, 'users'), where('handle', '==', handle), limit(1));
  }, [firestore, handle]);

  const { data: users, isLoading: isProfileLoading } = useCollection<UserProfile>(userQuery);
  
  useEffect(() => {
    if (!isProfileLoading && (!users || users.length === 0)) {
      notFound();
    }
  }, [isProfileLoading, users]);
  
  const profile = users?.[0];
  const agentId = profile?.id || profile?.uid;

  if (isProfileLoading || !profile || !agentId) {
    return (
      <div className="dark">
        <Header isMuted={true} onToggleMute={() => {}} />
        <div className="max-w-xl mx-auto p-4 pt-20">
          <div className="flex flex-col items-center text-center">
            <Skeleton className="w-24 h-24 rounded-full" />
            <Skeleton className="h-8 w-48 mt-4" />
            <Skeleton className="h-4 w-32 mt-2" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dark">
      <Header isMuted={true} onToggleMute={() => {}} />
      <div className="max-w-xl mx-auto p-4 pt-20 pb-24">
        <header className="flex flex-col items-center text-center">
          <FallbackAvatar src={profile.photoURL} alt={profile.handle} size={96} />
          <h1 className="text-2xl font-bold mt-4">@{profile.handle}</h1>
          <p className="text-muted-foreground">{profile.displayName}</p>
          <div className="my-2">
            <RatingChip agentId={agentId} />
          </div>
          <p className="text-sm max-w-md mt-2">{profile.bio}</p>
        </header>
        
        <AgentProfilePanel agentId={agentId} />

        <div className="mt-4">
            <h3 className="font-medium text-lg mb-2">Book a Session</h3>
            <AvailabilityCalendar agentId={agentId} />
            <BookingRequest agentId={agentId} />
        </div>
        
        <ReviewsSection agentId={agentId} />
        
      </div>
       <MobileActionSheet agentId={agentId} />
    </div>
  );
}

'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useFsMemo } from '@/firebase';
import { collection, query } from 'firebase/firestore';

type Review = {
  rating: number;
};

export function useAgentRating(agentId: string) {
  const firestore = useFirestore();

  const reviewsQuery = useFsMemo(() => {
    if (!firestore || !agentId) return null;
    return query(collection(firestore, 'agentReviews', agentId, 'reviews'));
  }, [firestore, agentId]);

  const { data: reviews, isLoading } = useCollection<Review>(reviewsQuery);

  const ratingStats = useMemo(() => {
    if (!reviews || reviews.length === 0) {
      return { average: 0, count: 0 };
    }

    const totalRating = reviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );
    const average = totalRating / reviews.length;

    return { average, count: reviews.length };
  }, [reviews]);

  return { ...ratingStats, isLoading };
}

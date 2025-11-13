
'use client';

import { useFirestore, useDoc, useFsMemo } from '@/firebase';
import { doc } from 'firebase/firestore';

interface AkiliPoints {
  totalPoints: number;
  level: string;
  lifetimePoints: number;
}

const levelThresholds: Record<string, number> = {
  Bronze: 0,
  Silver: 1000,
  Gold: 3000,
  Platinum: 7000,
};

export function AkiliPointsBadge({ userId }: { userId: string }) {
  const firestore = useFirestore();

  const pointsDocRef = useFsMemo(() => {
    if (!firestore || !userId) return null;
    return doc(firestore, 'akiliPoints', userId);
  }, [firestore, userId]);

  const { data: pointsData, isLoading } = useDoc<AkiliPoints>(pointsDocRef);

  if (isLoading) {
    return (
      <div className="my-4 p-4 bg-[#0A0A0A] rounded-2xl border border-[#1A1A1A]">
        <p className="text-sm text-center text-muted-foreground">Loading AkiliPoints...</p>
      </div>
    );
  }

  if (!pointsData) {
    return null; // Or some placeholder
  }
  
  const currentLevel = pointsData.level || 'Bronze';
  const currentLevelPoints = levelThresholds[currentLevel] || 0;
  const nextLevel = Object.keys(levelThresholds).find(key => levelThresholds[key] > currentLevelPoints) || 'Platinum';
  const nextLevelPoints = levelThresholds[nextLevel] || pointsData.lifetimePoints;
  
  const pointsInCurrentLevel = pointsData.lifetimePoints - currentLevelPoints;
  const pointsForNextLevel = nextLevelPoints - currentLevelPoints;
  const progressPercent = pointsForNextLevel > 0 ? (pointsInCurrentLevel / pointsForNextLevel) * 100 : 100;
  const pointsToNextLevel = nextLevelPoints - pointsData.lifetimePoints;


  return (
    <div 
      className="my-4 p-4 bg-[#0A0A0A] rounded-2xl border border-[#1A1A1A] transition-shadow duration-300"
      style={{ boxShadow: '0 0 10px rgba(142, 62, 255, 0.3)' }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 0 15px rgba(142, 62, 255, 0.4)'}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 0 10px rgba(142, 62, 255, 0.3)'}
    >
      <div className="flex justify-between items-center mb-2">
         <h3 className="text-sm font-semibold text-muted-foreground">AkiliPoints Balance</h3>
         <div className="text-xl font-bold text-gradient">{pointsData.totalPoints?.toLocaleString() ?? 0} ⭐</div>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2.5">
        <div
          className="h-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-400"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>
      <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
        <span>Level: {currentLevel}</span>
        {currentLevel !== 'Platinum' && <span>{pointsToNextLevel.toLocaleString()} points to {nextLevel}</span>}
      </div>
    </div>
  );
}

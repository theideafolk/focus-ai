import React, { useEffect } from 'react';
import { Flame } from 'lucide-react';

interface StreakCounterProps {
  streak: number;
}

export default function StreakCounter({ streak }: StreakCounterProps) {
  // Only show streak counter if there is an active streak
  if (streak <= 0) return null;
  
  return (
    <div className="flex items-center gap-1 bg-white/90 border border-gray-100 rounded-full px-3 py-1 shadow-sm text-sm">
      <Flame className="h-4 w-4 text-orange-500" />
      <span className="font-medium text-gray-800">{streak}</span>
      <span className="text-gray-500">day streak</span>
    </div>
  );
}
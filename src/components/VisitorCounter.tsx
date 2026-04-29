import React, { useEffect, useState } from 'react';
import { subscribeToUniqueVisitorsCount } from '../firebase';

const VisitorCounter: React.FC = () => {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToUniqueVisitorsCount((newCount: number) => {
      setCount(newCount);
    });
    return () => unsubscribe();
  }, []);

  if (count === null) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-zinc-300 text-sm shadow-lg">
      👥 Счётчик: <span className="font-semibold text-white">{count}</span>
    </div>
  );
};

export default VisitorCounter;
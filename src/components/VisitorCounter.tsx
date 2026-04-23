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
    <div className="fixed bottom-4 left-4 z-40 surface-card px-4 py-2 text-slate-600 dark:text-slate-300 text-sm shadow-md">
      👥 Счётчик: <span className="font-semibold text-slate-900 dark:text-white">{count}</span>
    </div>
  );
};

export default VisitorCounter;
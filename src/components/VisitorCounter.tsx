import React, { useEffect, useState } from 'react';
import { subscribeToUniqueVisitorsCount } from '../firebase';

const VisitorCounter: React.FC = () => {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToUniqueVisitorsCount((newCount) => {
      setCount(newCount);
    });

    return () => unsubscribe();
  }, []);

  if (count === null) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 glass-card px-4 py-2 text-white text-sm shadow-lg">
      👥 Счётчик: <span className="font-bold">{count}</span>
    </div>
  );
};

export default VisitorCounter;
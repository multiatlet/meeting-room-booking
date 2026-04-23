import React, { useEffect, useState } from 'react';
import { subscribeToUniqueVisitorsCount } from '../firebase';
import useStore from '../store';

const VisitorCounter: React.FC = () => {
  const [count, setCount] = useState<number | null>(null);
  const { theme } = useStore();

  useEffect(() => {
    const unsubscribe = subscribeToUniqueVisitorsCount((newCount: number) => {
      setCount(newCount);
    });
    return () => unsubscribe();
  }, []);

  if (count === null) return null;

  const textClass = theme === 'light' ? 'text-gray-900' : 'text-[#F9FAFB]';

  return (
    <div className={`fixed bottom-4 left-4 z-40 glass-card px-4 py-2 ${textClass} text-sm shadow-lg`}>
      👥 Счётчик: <span className="font-bold">{count}</span>
    </div>
  );
};

export default VisitorCounter;
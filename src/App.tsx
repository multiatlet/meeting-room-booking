import React, { useEffect, useState } from 'react';
import useStore from './store';
import Header from './components/Header';
import Calendar from './components/Calendar';
import VisitorCounter from './components/VisitorCounter';
import { trackUniqueVisitor } from './firebase';

// ... хук useTimeOfDayGradient остаётся прежним

const App: React.FC = () => {
  const { initializeFirebaseSync } = useStore();
  const gradient = useTimeOfDayGradient();

  useEffect(() => {
    const unsubscribe = initializeFirebaseSync();

    const STORAGE_KEY = 'visitor_id';
    let userId = localStorage.getItem(STORAGE_KEY);
    if (!userId) {
      userId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(STORAGE_KEY, userId);
    }
    trackUniqueVisitor(userId);

    return () => {
      unsubscribe();
    };
  }, [initializeFirebaseSync]);

  return (
    <div className={`min-h-screen p-4 md:p-6 bg-gradient-to-br ${gradient} transition-colors duration-1000`}>
      <div className="max-w-[1400px] mx-auto">
        <Header />
        <Calendar />
      </div>
      <VisitorCounter />
    </div>
  );
};

export default App;
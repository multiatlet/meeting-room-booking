import React, { useEffect, useState } from 'react';
import useStore from './store';
import Header from './components/Header';
import Calendar from './components/Calendar';
import VisitorCounter from './components/VisitorCounter';
import { trackUniqueVisitor } from './firebase';

// Хук для динамического градиента по времени суток
const useTimeOfDayGradient = () => {
  const getGradientForHour = (hour: number): string => {
    if (hour >= 6 && hour < 12) {
      return 'from-[#7ec8ff] via-[#5ba3e6] to-[#2d3a52]';
    }
    if (hour >= 12 && hour < 18) {
      return 'from-[#3b82f6] via-[#2563eb] to-[#1e293b]';
    }
    if (hour >= 18 && hour < 24) {
      return 'from-[#1e3a8a] via-[#152c5e] to-[#0f172a]';
    }
    return 'from-[#0f172a] via-[#1e293b] to-[#020617]';
  };

  const [gradient, setGradient] = useState(() => getGradientForHour(new Date().getHours()));

  useEffect(() => {
    const updateGradient = () => {
      const hour = new Date().getHours();
      setGradient(getGradientForHour(hour));
    };

    updateGradient(); // сразу при монтировании
    const interval = setInterval(updateGradient, 60000); // каждую минуту

    return () => clearInterval(interval);
  }, []);

  return gradient;
};

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
import React, { useEffect, useState } from 'react';
import useStore from './store';
import Header from './components/Header';
import Calendar from './components/Calendar';
import VisitorCounter from './components/VisitorCounter';
import { trackUniqueVisitor } from './firebase';

// Хук для динамического фона по времени суток
const useTimeOfDayBackground = () => {
  const getBackgroundForHour = (hour: number): string => {
    // Утро (06:00–11:00) — лёгкость, чистота
    if (hour >= 6 && hour < 11) {
      return 'from-[#EAF3FF] via-[#F5F7FF] to-[#FFFFFF]';
    }
    // День (11:00–17:00) — нейтральная продуктивность
    if (hour >= 11 && hour < 17) {
      return 'from-[#F8FAFF] via-[#EEF2FF] to-[#E5E7EB]';
    }
    // Вечер (17:00–21:00) — фокус и снижение яркости
    if (hour >= 17 && hour < 21) {
      return 'from-[#1E293B] via-[#0F172A] to-[#0B1220]';
    }
    // Ночь (21:00–06:00) — комфорт для глаз
    return 'from-[#0A0F1C] via-[#0B1220] to-[#050814]';
  };

  const [background, setBackground] = useState(() =>
    getBackgroundForHour(new Date().getHours())
  );

  useEffect(() => {
    const updateBackground = () => {
      const hour = new Date().getHours();
      setBackground(getBackgroundForHour(hour));
    };

    updateBackground();
    const interval = setInterval(updateBackground, 60000); // каждую минуту
    return () => clearInterval(interval);
  }, []);

  return background;
};

const App: React.FC = () => {
  const { initializeFirebaseSync } = useStore();
  const backgroundGradient = useTimeOfDayBackground();

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
    <div
      className={`min-h-screen p-4 md:p-6 bg-gradient-to-br ${backgroundGradient} transition-all duration-1000 ease-in-out relative`}
    >
      {/* Радиальный оверлей для глубины */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),_transparent_60%)]" />

      <div className="relative z-10 max-w-[1400px] mx-auto">
        <Header />
        <Calendar />
      </div>

      <VisitorCounter />
    </div>
  );
};

export default App;
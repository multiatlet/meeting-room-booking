import React, { useEffect } from 'react';
import useStore from './store';
import Header from './components/Header';
import Calendar from './components/Calendar';
import VisitorCounter from './components/VisitorCounter';
import { trackUniqueVisitor } from './firebase';

// Хук для определения фона и темы по времени суток
const useTimeOfDay = () => {
  const getThemeAndBackground = (hour: number) => {
    // Утро (06:00–11:00) — светлая тема, лёгкий фон
    if (hour >= 6 && hour < 11) {
      return {
        background: 'from-[#EAF3FF] via-[#F5F7FF] to-[#FFFFFF]',
        theme: 'light' as const,
      };
    }
    // День (11:00–17:00) — светлая тема, нейтральный фон
    if (hour >= 11 && hour < 17) {
      return {
        background: 'from-[#F8FAFF] via-[#EEF2FF] to-[#E5E7EB]',
        theme: 'light' as const,
      };
    }
    // Вечер (17:00–21:00) — тёмная тема
    if (hour >= 17 && hour < 21) {
      return {
        background: 'from-[#1E293B] via-[#0F172A] to-[#0B1220]',
        theme: 'dark' as const,
      };
    }
    // Ночь (21:00–06:00) — тёмная тема
    return {
      background: 'from-[#0A0F1C] via-[#0B1220] to-[#050814]',
      theme: 'dark' as const,
    };
  };

  const hour = new Date().getHours();
  return getThemeAndBackground(hour);
};

const App: React.FC = () => {
  const { initializeFirebaseSync, setTheme } = useStore();
  const { background: backgroundGradient, theme } = useTimeOfDay();

  // Обновляем тему в store при каждом рендере и каждую минуту
  useEffect(() => {
    setTheme(theme);
    const interval = setInterval(() => {
      const hour = new Date().getHours();
      const { theme: newTheme } = useTimeOfDay();
      setTheme(newTheme);
    }, 60000);
    return () => clearInterval(interval);
  }, [theme, setTheme]);

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
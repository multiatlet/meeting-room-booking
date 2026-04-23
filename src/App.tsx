import React, { useEffect, useState } from 'react';
import useStore from './store';
import Header from './components/Header';
import Calendar from './components/Calendar';
import VisitorCounter from './components/VisitorCounter';
import { trackUniqueVisitor } from './firebase';

// Вспомогательная функция: возвращает фон и тему по часу
const getTimeOfDayState = (hour: number) => {
  if (hour >= 6 && hour < 11) {
    return {
      background: 'from-[#EAF3FF] via-[#F5F7FF] to-[#FFFFFF]',
      theme: 'light' as const,
    };
  }
  if (hour >= 11 && hour < 17) {
    return {
      background: 'from-[#F8FAFF] via-[#EEF2FF] to-[#E5E7EB]',
      theme: 'light' as const,
    };
  }
  if (hour >= 17 && hour < 21) {
    return {
      background: 'from-[#1E293B] via-[#0F172A] to-[#0B1220]',
      theme: 'dark' as const,
    };
  }
  return {
    background: 'from-[#0A0F1C] via-[#0B1220] to-[#050814]',
    theme: 'dark' as const,
  };
};

const App: React.FC = () => {
  const { initializeFirebaseSync, setTheme } = useStore();

  // Состояние для динамического фона
  const [backgroundGradient, setBackgroundGradient] = useState(
    () => getTimeOfDayState(new Date().getHours()).background
  );

  useEffect(() => {
    // Функция обновления фона и темы
    const updateTimeOfDay = () => {
      const hour = new Date().getHours();
      const { background, theme } = getTimeOfDayState(hour);
      setBackgroundGradient(background);
      setTheme(theme);
    };

    // Первоначальная установка темы (фон уже установлен через useState)
    setTheme(getTimeOfDayState(new Date().getHours()).theme);

    // Обновляем каждую минуту
    const interval = setInterval(updateTimeOfDay, 60000);
    return () => clearInterval(interval);
  }, [setTheme]);

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
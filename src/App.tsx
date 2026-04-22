import React, { useEffect } from 'react';
import useStore from './store';
import Header from './components/Header';
import Calendar from './components/Calendar';
import VisitorCounter from './components/VisitorCounter';
import { trackUniqueVisitor } from './firebase';

const App: React.FC = () => {
  const { initializeFirebaseSync } = useStore();

  useEffect(() => {
    const unsubscribe = initializeFirebaseSync();

    // Генерация/получение user_id
    const STORAGE_KEY = 'visitor_id';
    let userId = localStorage.getItem(STORAGE_KEY);
    if (!userId) {
      userId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(STORAGE_KEY, userId);
    }

    // Отправляем информацию о посещении
    trackUniqueVisitor(userId);

    return () => {
      unsubscribe();
    };
  }, [initializeFirebaseSync]);

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gradient-to-br from-[#1e293b] via-[#2d3a52] to-[#0f172a]">
      <div className="max-w-[1400px] mx-auto">
        <Header />
        <Calendar />
      </div>
      <VisitorCounter />
    </div>
  );
};

export default App;
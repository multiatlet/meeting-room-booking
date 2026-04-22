import React, { useEffect } from 'react';
import useStore from './store';
import Header from './components/Header';
import Calendar from './components/Calendar';

const App: React.FC = () => {
  const { initializeFirebaseSync, visitorCount } = useStore();

  useEffect(() => {
    const unsubscribe = initializeFirebaseSync();
    return unsubscribe;
  }, [initializeFirebaseSync]);

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gradient-to-br from-[#1e293b] via-[#2d3a52] to-[#0f172a]">
      <div className="max-w-[1400px] mx-auto relative pb-12">
        <Header />
        {/* Добавляем отступ сверху, чтобы рамка текущего дня не обрезалась */}
        <div className="mt-4">
          <Calendar />
        </div>
        {/* Счётчик уникальных посетителей */}
        <div className="absolute bottom-2 left-4 md:left-6 text-white/50 text-xs md:text-sm">
          👥 Уникальных посетителей: {visitorCount}
        </div>
      </div>
    </div>
  );
};

export default App;
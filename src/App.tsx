import React, { useEffect } from 'react';
import useStore from './store';
import Header from './components/Header';
import Calendar from './components/Calendar';
import VisitorCounter from './components/VisitorCounter';

const App: React.FC = () => {
  const { initializeFirebaseSync } = useStore();

  useEffect(() => {
    const unsubscribe = initializeFirebaseSync();
    return unsubscribe;
  }, [initializeFirebaseSync]);

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gradient-to-br from-[#1e293b] via-[#2d3a52] to-[#0f172a] flex flex-col">
      <div className="max-w-[1400px] mx-auto w-full flex-1">
        <Header />
        {/* Добавлен верхний отступ для таблицы, чтобы рамка текущего дня не обрезалась */}
        <div className="mt-4">
          <Calendar />
        </div>
      </div>
      <VisitorCounter />
    </div>
  );
};

export default App;
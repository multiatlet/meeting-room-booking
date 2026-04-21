import React, { useEffect } from 'react';
import useStore from './store';
import Header from './components/Header';
import Calendar from './components/Calendar';

const App: React.FC = () => {
  const { initializeFirebaseSync } = useStore();

  useEffect(() => {
    const unsubscribe = initializeFirebaseSync();
    return unsubscribe;
  }, [initializeFirebaseSync]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#020617] p-4 md:p-6">
      <div className="max-w-[1200px] mx-auto">
        <Header />
        <Calendar />
      </div>
    </div>
  );
};

export default App;
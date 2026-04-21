import React from 'react';
import { format, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import useStore from '../store';

const Header: React.FC = () => {
  const { selectedDate, setSelectedDate } = useStore();

  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
        Бронирование переговорных
      </h1>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setSelectedDate(addDays(selectedDate, -1))}
          className="w-10 h-10 rounded-xl glass-card flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition"
        >
          ←
        </button>
        <span className="text-white text-lg font-medium min-w-[180px] text-center">
          {format(selectedDate, 'd MMMM yyyy', { locale: ru })}
        </span>
        <button
          onClick={() => setSelectedDate(addDays(selectedDate, 1))}
          className="w-10 h-10 rounded-xl glass-card flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition"
        >
          →
        </button>
      </div>
    </header>
  );
};

export default Header;
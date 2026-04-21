import React from 'react';
import { format, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import useStore from '../store';

const Header: React.FC = () => {
  const { selectedDate, setSelectedDate } = useStore();

  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <h1 className="text-3xl md:text-4xl font-bold text-[#0a2a44]">
        Бронирование переговорных
      </h1>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setSelectedDate(addDays(selectedDate, -1))}
          className="icon-btn"
          aria-label="Предыдущий день"
        >
          ←
        </button>
        <span className="text-[#0a2a44] text-lg font-medium min-w-[180px] text-center">
          {format(selectedDate, 'd MMMM yyyy', { locale: ru })}
        </span>
        <button
          onClick={() => setSelectedDate(addDays(selectedDate, 1))}
          className="icon-btn"
          aria-label="Следующий день"
        >
          →
        </button>
      </div>
    </header>
  );
};

export default Header;
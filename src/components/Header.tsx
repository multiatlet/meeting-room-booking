import React, { useState } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import useStore from '../store';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@vpluse.ru';

const Header: React.FC = () => {
  const { selectedDate, setSelectedDate, notificationEmails, updateNotificationEmails, getCurrentUser } = useStore();
  const [showSettings, setShowSettings] = useState(false);
  const [emailsInput, setEmailsInput] = useState(notificationEmails);

  const currentUser = getCurrentUser();
  const isAdmin = currentUser.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const handleSaveEmails = async () => {
    await updateNotificationEmails(emailsInput.trim());
    setShowSettings(false);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const isTodayVisible = isSameDay(selectedDate, new Date());

  return (
    <>
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          Бронирование переговорных
        </h1>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, -1))}
            className="w-9 h-9 rounded-lg border border-zinc-800 flex items-center justify-center text-zinc-300 hover:bg-zinc-900 transition-colors"
          >
            ←
          </button>
          <span className="text-white text-base font-medium min-w-[160px] text-center">
            {format(selectedDate, 'd MMMM yyyy', { locale: ru })}
          </span>
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            className="w-9 h-9 rounded-lg border border-zinc-800 flex items-center justify-center text-zinc-300 hover:bg-zinc-900 transition-colors"
          >
            →
          </button>

          {!isTodayVisible && (
            <button
              onClick={goToToday}
              className="ml-1 px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-300 text-sm hover:bg-zinc-900 transition-colors"
            >
              Сегодня
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => {
                setEmailsInput(notificationEmails);
                setShowSettings(true);
              }}
              className="w-9 h-9 rounded-lg border border-zinc-800 flex items-center justify-center text-zinc-300 hover:bg-zinc-900 transition-colors"
              title="Настройки уведомлений"
            >
              ⚙️
            </button>
          )}
        </div>
      </header>

      {showSettings && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl w-[420px] max-w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-white mb-4">Настройки уведомлений (админ)</h2>
            <p className="text-zinc-400 text-sm mb-2">
              Общий список email для рассылки (через запятую)
            </p>
            <input
              type="text"
              placeholder="admin@vpluse.ru, manager@vpluse.ru"
              value={emailsInput}
              onChange={e => setEmailsInput(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 outline-none mb-6"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 py-3 rounded-xl bg-zinc-800 text-zinc-300 font-medium hover:bg-zinc-700 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleSaveEmails}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
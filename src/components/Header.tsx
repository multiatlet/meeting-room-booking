import React, { useState } from 'react';
import { format, addDays } from 'date-fns';
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

  return (
    <>
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-[#F9FAFB] tracking-tight">
          Бронирование переговорных
        </h1>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, -1))}
            className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-[#D1D5DB] hover:text-white hover:bg-white/10 transition"
          >
            ←
          </button>
          <span className="text-[#F9FAFB] text-lg font-medium min-w-[180px] text-center">
            {format(selectedDate, 'd MMMM yyyy', { locale: ru })}
          </span>
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-[#D1D5DB] hover:text-white hover:bg-white/10 transition"
          >
            →
          </button>

          {isAdmin && (
            <button
              onClick={() => {
                setEmailsInput(notificationEmails);
                setShowSettings(true);
              }}
              className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-[#D1D5DB] hover:text-white hover:bg-white/10 transition"
              title="Настройки уведомлений"
            >
              ⚙️
            </button>
          )}
        </div>
      </header>

      {showSettings && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="glass-panel p-6 w-[420px] max-w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-[#0B1220] mb-4">Настройки уведомлений (админ)</h2>
            <p className="text-[#374151] text-sm mb-2">
              Общий список email для рассылки (через запятую)
            </p>
            <input
              type="text"
              placeholder="admin@vpluse.ru, manager@vpluse.ru"
              value={emailsInput}
              onChange={e => setEmailsInput(e.target.value)}
              className="w-full bg-white/70 backdrop-blur-sm border border-[#3B82F6]/20 rounded-2xl px-4 py-3 text-[#0B1220] placeholder-[#9CA3AF] focus:ring-2 focus:ring-[#3B82F6]/40 outline-none mb-6"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 py-3 rounded-2xl bg-white/60 border border-[#3B82F6]/20 text-[#0B1220] font-medium hover:bg-white/80 transition"
              >
                Отмена
              </button>
              <button
                onClick={handleSaveEmails}
                className="flex-1 py-3 rounded-2xl bg-[#3B82F6] text-white font-medium shadow-md shadow-[#3B82F6]/30 hover:bg-[#2563EB] hover:scale-[1.02] transition"
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
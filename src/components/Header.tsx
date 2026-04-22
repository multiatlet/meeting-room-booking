import React, { useState } from 'react';
import { format, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import useStore from '../store';

const Header: React.FC = () => {
  const { selectedDate, setSelectedDate, getNotificationEmails, setNotificationEmails } = useStore();
  const [showSettings, setShowSettings] = useState(false);
  const [emailsInput, setEmailsInput] = useState(getNotificationEmails());

  const handleSaveEmails = () => {
    setNotificationEmails(emailsInput.trim());
    setShowSettings(false);
  };

  return (
    <>
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-white">
          Бронирование переговорных
        </h1>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, -1))}
            className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition"
            aria-label="Предыдущий день"
          >
            ←
          </button>
          <span className="text-white text-lg font-medium min-w-[180px] text-center">
            {format(selectedDate, 'd MMMM yyyy', { locale: ru })}
          </span>
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition"
            aria-label="Следующий день"
          >
            →
          </button>

          {/* Кнопка настроек уведомлений */}
          <button
            onClick={() => setShowSettings(true)}
            className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition"
            aria-label="Настройки уведомлений"
            title="Email для уведомлений"
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* Модальное окно настроек */}
      {showSettings && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="bg-white/85 backdrop-blur-xl border border-[#1a5cff]/10 rounded-2xl p-6 w-[420px] max-w-full shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-[#0a2a44] mb-4">Настройки уведомлений</h2>
            <p className="text-[#2c4f7f] text-sm mb-2">
              Email-адреса для рассылки (через запятую)
            </p>
            <input
              type="text"
              placeholder="admin@вплюсе.pw, manager@вплюсе.pw"
              value={emailsInput}
              onChange={e => setEmailsInput(e.target.value)}
              className="w-full bg-white/60 backdrop-blur-sm border border-[#1a5cff]/20 rounded-2xl px-4 py-3 text-[#0a2a44] placeholder-[#b0c8e0] focus:ring-2 focus:ring-[#1a5cff]/40 outline-none mb-6"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 py-3 rounded-2xl bg-white/60 border border-[#1a5cff]/20 text-[#0a2a44] font-medium hover:bg-white/80 transition"
              >
                Отмена
              </button>
              <button
                onClick={handleSaveEmails}
                className="flex-1 py-3 rounded-2xl bg-[#1a5cff] text-white font-medium shadow-md shadow-[#1a5cff]/20 hover:bg-[#0040d0] hover:scale-[1.02] transition"
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
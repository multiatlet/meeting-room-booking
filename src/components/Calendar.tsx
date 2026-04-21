import React, { useState } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import useStore from '../store';

// ==================== ВРЕМЕННЫЕ СЛОТЫ ====================
const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00'
];

const DURATION_OPTIONS = [30, 60, 90, 120, 180, 240];

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
const add30min = (time: string): string => {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m + 30, 0, 0);
  return format(d, 'HH:mm');
};

const addMinutesToTime = (time: string, mins: number): string => {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m + mins, 0, 0);
  return format(d, 'HH:mm');
};

// ==================== КОМПОНЕНТ ====================
const Calendar: React.FC = () => {
  const { rooms, bookings, selectedDate, addBooking, isSlotAvailable } = useStore();

  // Модальное окно
  const [modal, setModal] = useState<{ roomId: string; date: Date } | null>(null);
  const [userName, setUserName] = useState('');
  const [startTime, setStartTime] = useState(TIME_SLOTS[0]);
  const [duration, setDuration] = useState(60);

  // 7 дней, начиная с selectedDate
  const dates = Array.from({ length: 7 }, (_, i) => addDays(selectedDate, i));

  // Бронирования для ячейки
  const getBookingsForCell = (roomId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return bookings
      .filter(b => b.roomId === roomId && b.date === dateStr)
      .sort((a, b) => a.start.localeCompare(b.start));
  };

  const openModal = (roomId: string, date: Date) => {
    setModal({ roomId, date });
    setUserName('');
    setStartTime(TIME_SLOTS[0]);
    setDuration(60);
  };

  const closeModal = () => setModal(null);

  const handleSave = async () => {
    if (!modal) return;
    if (!userName.trim()) {
      alert('Введите имя');
      return;
    }

    const dateStr = format(modal.date, 'yyyy-MM-dd');
    const endTime = addMinutesToTime(startTime, duration);

    if (endTime < startTime) {
      alert('Некорректное время окончания');
      return;
    }

    if (!isSlotAvailable(modal.roomId, dateStr, startTime, endTime)) {
      alert('Это время уже занято');
      return;
    }

    await addBooking({
      roomId: modal.roomId,
      date: dateStr,
      start: startTime,
      end: endTime,
      userName: userName.trim(),
    });
    closeModal();
  };

  // Доступные начальные слоты (фильтрация по занятости)
  const availableStartSlots = modal
    ? TIME_SLOTS.filter(slot => {
        const dateStr = format(modal.date, 'yyyy-MM-dd');
        return isSlotAvailable(modal.roomId, dateStr, slot, add30min(slot));
      })
    : [];

  const selectedRoom = modal ? rooms.find(r => r.id === modal.roomId) : null;

  // ==================== РЕНДЕР ====================
  return (
    <div className="overflow-x-auto scrollbar-hide">
      {/* ЕДИНЫЙ GRID – строго одна таблица */}
      <div className="grid grid-cols-[220px_repeat(7,1fr)] gap-3 min-w-[900px]">
        {/* 1. Пустая ячейка (верхний левый угол) */}
        <div className="p-3 text-[#b0c8e0] text-sm font-medium uppercase tracking-wider">
          Помещение
        </div>

        {/* 2. Заголовки дат (ровно 7 колонок) */}
        {dates.map(date => {
          const isToday = isSameDay(date, new Date());
          return (
            <div
              key={date.toISOString()}
              className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-3 text-center transition-all ${
                isToday ? 'ring-2 ring-[#1a5cff]/50 shadow-[0_0_10px_rgba(26,92,255,0.3)]' : ''
              }`}
            >
              <div className="text-xs uppercase tracking-wide text-[#b0c8e0] opacity-80">
                {format(date, 'EEE', { locale: ru })}
              </div>
              <div className="text-sm font-medium text-white">
                {format(date, 'd MMM', { locale: ru })}
              </div>
            </div>
          );
        })}

        {/* 3. Строки комнат (название + 7 ячеек) */}
        {rooms.map(room => (
          <React.Fragment key={room.id}>
            {/* Левая колонка – название комнаты */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shadow-[0_0_6px_currentColor]"
                  style={{ backgroundColor: room.color, color: room.color }}
                />
                <span className="text-white font-medium truncate">{room.name}</span>
              </div>
              <span className="text-[#b0c8e0] text-xs">{room.capacity} мест</span>
            </div>

            {/* 7 ячеек календаря – ровно по одной на каждую дату */}
            {dates.map(date => {
              const cellBookings = getBookingsForCell(room.id, date);
              return (
                <button
                  key={date.toISOString()}
                  onClick={() => openModal(room.id, date)}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-3 text-left transition-all hover:bg-white/10 hover:scale-[1.01] cursor-pointer min-h-[90px]"
                >
                  {cellBookings.length === 0 ? (
                    <span className="text-[#b0c8e0] text-sm">Свободно</span>
                  ) : (
                    <div className="space-y-1">
                      {cellBookings.slice(0, 3).map(b => (
                        <div key={b.id} className="text-xs">
                          <div className="text-white font-medium truncate">
                            {b.userName}
                          </div>
                          <div className="text-[#b0c8e0]">{b.start}–{b.end}</div>
                        </div>
                      ))}
                      {cellBookings.length > 3 && (
                        <div className="text-[#b0c8e0] text-xs">+{cellBookings.length - 3}</div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Модальное окно */}
      {modal && selectedRoom && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white/85 backdrop-blur-xl border border-[#1a5cff]/10 rounded-2xl p-6 w-[420px] max-w-full shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-[#0a2a44] mb-1">
              {selectedRoom.name}
            </h2>
            <p className="text-[#2c4f7f] text-sm mb-6">
              {format(modal.date, 'd MMMM yyyy, EEEE', { locale: ru })}
            </p>

            {availableStartSlots.length === 0 ? (
              <p className="text-[#b02b3a] text-center py-4">Нет свободного времени</p>
            ) : (
              <div className="space-y-5">
                <input
                  type="text"
                  placeholder="Ваше имя"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  className="w-full bg-white/60 backdrop-blur-sm border border-[#1a5cff]/20 rounded-2xl px-4 py-3 text-[#0a2a44] placeholder-[#b0c8e0] focus:ring-2 focus:ring-[#1a5cff]/40 outline-none"
                  autoFocus
                />

                <div>
                  <label className="block text-[#2c4f7f] text-sm mb-2">Начало</label>
                  <select
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full bg-white/60 backdrop-blur-sm border border-[#1a5cff]/20 rounded-2xl px-4 py-3 text-[#0a2a44]"
                  >
                    {availableStartSlots.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#2c4f7f] text-sm mb-2">Длительность</label>
                  <select
                    value={duration}
                    onChange={e => setDuration(parseInt(e.target.value))}
                    className="w-full bg-white/60 backdrop-blur-sm border border-[#1a5cff]/20 rounded-2xl px-4 py-3 text-[#0a2a44]"
                  >
                    {DURATION_OPTIONS.map(mins => (
                      <option key={mins} value={mins}>
                        {Math.floor(mins / 60)} ч {mins % 60 > 0 ? `${mins % 60} мин` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-3 text-sm text-[#2c4f7f]">
                  🕒 {startTime} – {addMinutesToTime(startTime, duration)}
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-8">
              <button
                onClick={closeModal}
                className="flex-1 py-3 rounded-2xl bg-white/60 border border-[#1a5cff]/20 text-[#0a2a44] font-medium hover:bg-white/80 transition"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={availableStartSlots.length === 0}
                className="flex-1 py-3 rounded-2xl bg-[#1a5cff] text-white font-medium shadow-md shadow-[#1a5cff]/20 hover:bg-[#0040d0] hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Забронировать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
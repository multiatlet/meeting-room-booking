import React, { useState } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import useStore from '../store';

// Жёстко заданные временные слоты (с 08:00 до 18:00, шаг 30 минут)
const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00'
];

const DURATION_OPTIONS = [30, 60, 90, 120, 180, 240]; // минуты

// Вспомогательная функция: добавить минуты к строке времени "HH:mm"
const addMinutesToTime = (time: string, mins: number): string => {
  const [h, m] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m + mins);
  return format(date, 'HH:mm');
};

// Функция для добавления 30 минут (используется при фильтрации слотов)
const add30min = (time: string): string => addMinutesToTime(time, 30);

const Calendar: React.FC = () => {
  const { rooms, bookings, selectedDate, addBooking, isSlotAvailable } = useStore();

  // Состояние модального окна
  const [modalData, setModalData] = useState<{ roomId: string; date: Date } | null>(null);
  const [userName, setUserName] = useState('');
  const [startTime, setStartTime] = useState(TIME_SLOTS[0]);
  const [duration, setDuration] = useState(60);

  // 7 дней, начиная с selectedDate
  const dates = Array.from({ length: 7 }, (_, i) => addDays(selectedDate, i));

  // Получить бронирования для конкретной комнаты и дня
  const getBookingsForCell = (roomId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return bookings
      .filter(b => b.roomId === roomId && b.date === dateStr)
      .sort((a, b) => a.start.localeCompare(b.start));
  };

  // Открыть модальное окно
  const openModal = (roomId: string, date: Date) => {
    setModalData({ roomId, date });
    setUserName('');
    setStartTime(TIME_SLOTS[0]);
    setDuration(60);
  };

  const closeModal = () => setModalData(null);

  // Сохранение бронирования
  const handleSave = async () => {
    if (!modalData) return;
    if (!userName.trim()) {
      alert('Введите имя');
      return;
    }

    const dateStr = format(modalData.date, 'yyyy-MM-dd');
    const endTime = addMinutesToTime(startTime, duration);

    if (endTime < startTime) {
      alert('Некорректное время окончания');
      return;
    }

    if (!isSlotAvailable(modalData.roomId, dateStr, startTime, endTime)) {
      alert('Это время уже занято');
      return;
    }

    await addBooking({
      roomId: modalData.roomId,
      date: dateStr,
      start: startTime,
      end: endTime,
      userName: userName.trim(),
    });
    closeModal();
  };

  // Доступные начальные слоты (фильтруем по занятости 30-минутных интервалов)
  const availableStartSlots = modalData
    ? TIME_SLOTS.filter(slot => {
        const dateStr = format(modalData.date, 'yyyy-MM-dd');
        return isSlotAvailable(modalData.roomId, dateStr, slot, add30min(slot));
      })
    : [];

  const selectedRoom = modalData ? rooms.find(r => r.id === modalData.roomId) : null;

  return (
    <div className="overflow-x-auto scrollbar-hide">
      {/* Единый контейнер сетки */}
      <div className="grid grid-cols-[220px_repeat(7,1fr)] gap-3 min-w-[900px]">
        {/* Пустая ячейка (верхний левый угол) */}
        <div className="p-3 text-white/50 text-sm font-medium uppercase tracking-wider">
          Помещение
        </div>

        {/* Заголовки дней (7 колонок) */}
        {dates.map(date => {
          const isToday = isSameDay(date, new Date());
          return (
            <div
              key={date.toISOString()}
              className={`glass-card p-3 text-center ${
                isToday ? 'ring-2 ring-blue-400/50 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : ''
              }`}
            >
              <div className="text-xs uppercase tracking-wide text-white/70">
                {format(date, 'EEE', { locale: ru })}
              </div>
              <div className="text-sm font-medium text-white">
                {format(date, 'd MMM', { locale: ru })}
              </div>
            </div>
          );
        })}

        {/* Строки комнат + ячейки */}
        {rooms.map(room => (
          <React.Fragment key={room.id}>
            {/* Название комнаты (левая колонка) */}
            <div className="glass-card p-3 flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shadow-[0_0_6px_currentColor]"
                style={{ backgroundColor: room.color, color: room.color }}
              />
              <span className="text-white font-medium truncate">{room.name}</span>
              <span className="text-white/40 text-xs ml-auto">{room.capacity} мест</span>
            </div>

            {/* 7 ячеек для каждой даты */}
            {dates.map(date => {
              const cellBookings = getBookingsForCell(room.id, date);
              return (
                <button
                  key={date.toISOString()}
                  onClick={() => openModal(room.id, date)}
                  className="glass-card p-3 text-left transition-all hover:bg-white/10 hover:scale-[1.01] cursor-pointer min-h-[90px]"
                >
                  {cellBookings.length === 0 ? (
                    <span className="text-white/40 text-sm">Свободно</span>
                  ) : (
                    <div className="space-y-1">
                      {cellBookings.slice(0, 3).map(b => (
                        <div key={b.id} className="text-xs">
                          <div className="text-white font-medium truncate">
                            {b.userName}
                          </div>
                          <div className="text-white/50">{b.start}–{b.end}</div>
                        </div>
                      ))}
                      {cellBookings.length > 3 && (
                        <div className="text-white/30 text-xs">+{cellBookings.length - 3}</div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Модальное окно бронирования */}
      {modalData && selectedRoom && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-[#1e293b] border border-white/10 p-6 rounded-2xl w-[400px] max-w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-white mb-1">
              {selectedRoom.name}
            </h2>
            <p className="text-white/60 text-sm mb-6">
              {format(modalData.date, 'd MMMM yyyy, EEEE', { locale: ru })}
            </p>

            {availableStartSlots.length === 0 ? (
              <p className="text-red-400 text-center py-4">
                Нет свободного времени
              </p>
            ) : (
              <div className="space-y-5">
                <input
                  type="text"
                  placeholder="Ваше имя"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-blue-500/50 outline-none"
                  autoFocus
                />

                <div>
                  <label className="block text-white/70 text-sm mb-2">
                    Начало
                  </label>
                  <select
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white"
                  >
                    {availableStartSlots.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white/70 text-sm mb-2">
                    Длительность
                  </label>
                  <select
                    value={duration}
                    onChange={e => setDuration(parseInt(e.target.value))}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white"
                  >
                    {DURATION_OPTIONS.map(mins => (
                      <option key={mins} value={mins}>
                        {Math.floor(mins / 60)} ч {mins % 60 > 0 ? `${mins % 60} мин` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-white/5 rounded-xl p-3 text-sm text-white/70">
                  🕒 {startTime} – {addMinutesToTime(startTime, duration)}
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-8">
              <button
                onClick={closeModal}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 transition"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={availableStartSlots.length === 0}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-lg shadow-blue-600/30 hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed"
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
import React, { useState } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import useStore from '../store';

// Временные слоты с 8:00 до 18:00 с шагом 30 минут
const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00'
];

const DURATION_OPTIONS = [30, 60, 90, 120, 180, 240];

// Вспомогательная функция для добавления минут к строке времени
const addMinutesToTime = (time: string, mins: number): string => {
  const [h, m] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m + mins);
  return format(date, 'HH:mm');
};

const Calendar: React.FC = () => {
  const { rooms, bookings, selectedDate, addBooking, isSlotAvailable } = useStore();
  const [modalData, setModalData] = useState<{ roomId: string; date: Date } | null>(null);
  const [userName, setUserName] = useState('');
  const [startTime, setStartTime] = useState(TIME_SLOTS[0]);
  const [duration, setDuration] = useState(60);

  // Генерируем 7 дней начиная с selectedDate
  const dates = Array.from({ length: 7 }, (_, i) => addDays(selectedDate, i));

  const getBookingsForCell = (roomId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return bookings
      .filter(b => b.roomId === roomId && b.date === dateStr)
      .sort((a, b) => a.start.localeCompare(b.start));
  };

  const openModal = (roomId: string, date: Date) => {
    setModalData({ roomId, date });
    setUserName('');
    setStartTime(TIME_SLOTS[0]);
    setDuration(60);
  };

  const closeModal = () => setModalData(null);

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

  // Доступные начальные слоты (не занятые полностью 30-минутные интервалы)
  const availableStartSlots = modalData
    ? TIME_SLOTS.filter(slot => {
        const dateStr = format(modalData.date, 'yyyy-MM-dd');
        const slotEnd = addMinutesToTime(slot, 30);
        return isSlotAvailable(modalData.roomId, dateStr, slot, slotEnd);
      })
    : [];

  const selectedRoom = modalData ? rooms.find(r => r.id === modalData.roomId) : null;

  return (
    <div className="overflow-x-auto scrollbar-hide">
      <div className="min-w-[900px]">
        {/* Заголовки дней */}
        <div className="grid grid-cols-[220px_repeat(7,1fr)] gap-3 mb-3">
          <div className="p-3 text-[#2c4f7f] text-sm font-medium uppercase tracking-wider">
            Помещение
          </div>
          {dates.map(date => {
            const isToday = isSameDay(date, new Date());
            return (
              <div
                key={date.toISOString()}
                className={`glass-card p-3 text-center ${
                  isToday ? 'ring-2 ring-[#1a5cff]/30' : ''
                }`}
              >
                <div className="text-xs uppercase tracking-wide text-[#2c4f7f] opacity-80">
                  {format(date, 'EEE', { locale: ru })}
                </div>
                <div className="text-sm font-medium text-[#0a2a44]">
                  {format(date, 'd MMM', { locale: ru })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Строки комнат */}
        <div className="space-y-3">
          {rooms.map(room => (
            <div key={room.id} className="grid grid-cols-[220px_repeat(7,1fr)] gap-3">
              {/* Левая колонка: название комнаты */}
              <div className="glass-card p-3 flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shadow-sm"
                  style={{ backgroundColor: room.color }}
                />
                <span className="text-[#0a2a44] font-medium truncate">{room.name}</span>
                <span className="text-[#b0c8e0] text-xs ml-auto">{room.capacity} мест</span>
              </div>

              {/* Ячейки бронирования */}
              {dates.map(date => {
                const cellBookings = getBookingsForCell(room.id, date);
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => openModal(room.id, date)}
                    className="glass-card p-3 text-left transition-all hover:bg-white/80 hover:scale-[1.01] cursor-pointer min-h-[90px]"
                  >
                    {cellBookings.length === 0 ? (
                      <span className="text-[#b0c8e0] text-sm">Свободно</span>
                    ) : (
                      <div className="space-y-1">
                        {cellBookings.slice(0, 3).map(b => (
                          <div key={b.id} className="text-xs">
                            <div className="text-[#0a2a44] font-medium truncate">
                              {b.userName}
                            </div>
                            <div className="text-[#2c4f7f]">
                              {b.start}–{b.end}
                            </div>
                          </div>
                        ))}
                        {cellBookings.length > 3 && (
                          <div className="text-[#b0c8e0] text-xs">
                            +{cellBookings.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Модальное окно */}
      {modalData && selectedRoom && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="glass-panel w-full max-w-md p-6"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-[#0a2a44] mb-1">
              {selectedRoom.name}
            </h2>
            <p className="text-[#2c4f7f] text-sm mb-6">
              {format(modalData.date, 'd MMMM yyyy, EEEE', { locale: ru })}
            </p>

            {availableStartSlots.length === 0 ? (
              <p className="text-[#b02b3a] text-center py-4">
                Нет свободного времени
              </p>
            ) : (
              <div className="space-y-5">
                <input
                  type="text"
                  placeholder="Ваше имя"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  className="glass-input"
                  autoFocus
                />

                <div>
                  <label className="block text-[#2c4f7f] text-sm mb-2">
                    Начало
                  </label>
                  <select
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="glass-input"
                  >
                    {availableStartSlots.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#2c4f7f] text-sm mb-2">
                    Длительность
                  </label>
                  <select
                    value={duration}
                    onChange={e => setDuration(parseInt(e.target.value))}
                    className="glass-input"
                  >
                    {DURATION_OPTIONS.map(mins => (
                      <option key={mins} value={mins}>
                        {Math.floor(mins / 60)} ч {mins % 60 > 0 ? `${mins % 60} мин` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-white/40 backdrop-blur-sm rounded-full px-5 py-3 text-sm text-[#2c4f7f]">
                  🕒 {startTime} – {addMinutesToTime(startTime, duration)}
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-8">
              <button onClick={closeModal} className="btn-secondary flex-1">
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={availableStartSlots.length === 0}
                className="btn-primary flex-1"
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
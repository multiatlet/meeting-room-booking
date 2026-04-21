import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import useStore, { createDateTime } from '../store';

interface BookingModalProps {
  roomId: string;
  date: Date;
  onClose: () => void;
}

const DURATION_OPTIONS = [30, 60, 90, 120, 180, 240, 300, 360, 420, 480]; // в минутах

// Генерация всех 30-минутных слотов с 00:00 до 23:30
const generateTimeSlots = (): string[] => {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
  }
  return slots;
};

const ALL_SLOTS = generateTimeSlots();

const BookingModal: React.FC<BookingModalProps> = ({ roomId, date, onClose }) => {
  const { rooms, bookings, addBooking } = useStore();
  const room = rooms.find(r => r.id === roomId)!;
  const dateStr = format(date, 'yyyy-MM-dd');

  const [userName, setUserName] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [durationMinutes, setDurationMinutes] = useState(60);

  // Доступные слоты для начала бронирования
  const availableStartSlots = ALL_SLOTS.filter(slot => {
    const slotStart = createDateTime(dateStr, slot);
    const slotEnd = new Date(slotStart.getTime() + 30 * 60000);
    return !bookings.some(b => {
      if (b.roomId !== roomId || b.date !== dateStr) return false;
      const bStart = createDateTime(b.date, b.start);
      const bEnd = createDateTime(b.date, b.end);
      return slotStart < bEnd && slotEnd > bStart;
    });
  });

  // При открытии выбрать первый доступный слот
  useEffect(() => {
    if (availableStartSlots.length > 0) {
      setStartTime(availableStartSlots[0]);
    }
  }, [availableStartSlots]);

  const handleSubmit = async () => {
    if (!userName.trim()) {
      alert('Введите имя');
      return;
    }

    const endDateTime = new Date(createDateTime(dateStr, startTime).getTime() + durationMinutes * 60000);
    const endStr = format(endDateTime, 'HH:mm');

    // Проверка, что бронь не выходит за пределы дня
    if (endDateTime.getDate() !== date.getDate()) {
      alert('Бронирование не может заканчиваться на следующий день');
      return;
    }

    // Проверка доступности всего интервала
    const intervalStart = createDateTime(dateStr, startTime);
    const intervalEnd = endDateTime;
    const isAvailable = !bookings.some(b => {
      if (b.roomId !== roomId || b.date !== dateStr) return false;
      const bStart = createDateTime(b.date, b.start);
      const bEnd = createDateTime(b.date, b.end);
      return intervalStart < bEnd && intervalEnd > bStart;
    });

    if (!isAvailable) {
      alert('Выбранное время занято');
      return;
    }

    await addBooking({
      roomId,
      date: dateStr,
      start: startTime,
      end: endStr,
      userName: userName.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-panel w-full max-w-md p-6 rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-semibold text-white mb-1">{room.name}</h2>
        <p className="text-white/60 text-sm mb-6">
          {format(date, 'd MMMM yyyy, EEEE', { locale: ru })}
        </p>

        {availableStartSlots.length === 0 ? (
          <p className="text-red-400 text-center py-4">Нет свободного времени</p>
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
              <label className="block text-white/70 text-sm mb-2">Начало</label>
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
              <label className="block text-white/70 text-sm mb-2">Длительность</label>
              <select
                value={durationMinutes}
                onChange={e => setDurationMinutes(parseInt(e.target.value))}
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
              🕒 {startTime} – {format(new Date(createDateTime(dateStr, startTime).getTime() + durationMinutes * 60000), 'HH:mm')}
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 transition"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={availableStartSlots.length === 0}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-lg shadow-blue-600/30 hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Забронировать
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
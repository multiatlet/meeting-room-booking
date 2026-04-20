import React, { useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import useStore from '../store';
import type { Room } from '../store';

interface TimeSlotGridProps {
  room: Room;
  date: Date;
}

const generateTimeSlots = (startHour: number, endHour: number, stepMin: number): string[] => {
  const slots: string[] = [];
  const current = new Date();
  current.setHours(startHour, 0, 0, 0);
  const end = new Date();
  end.setHours(endHour, 0, 0, 0);

  while (current < end) {
    slots.push(format(current, 'HH:mm'));
    current.setMinutes(current.getMinutes() + stepMin);
  }
  return slots;
};

const addMinutesToTime = (time: string, minutes: number): string => {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m + minutes);
  return format(d, 'HH:mm');
};

const TimeSlotGrid: React.FC<TimeSlotGridProps> = ({ room, date }) => {
  const { bookings, userName, addBooking, cancelBooking, isSlotAvailable, setUserName } = useStore();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const slots = generateTimeSlots(9, 18, 30); // 9:00 - 18:00 каждые 30 мин
  const dateStr = format(date, 'yyyy-MM-dd');
  const roomBookings = bookings.filter(b => b.roomId === room.id && b.date === dateStr);

  const handleSlotClick = (start: string) => {
    const end = addMinutesToTime(start, 30);
    if (!isSlotAvailable(room.id, date, start, end)) return;
    setSelectedSlot(start);
  };

  const handleConfirm = async () => {
    if (!selectedSlot || !userName.trim()) {
      alert('Введите имя и выберите время');
      return;
    }
    const end = addMinutesToTime(selectedSlot, 30);
    await addBooking({
      roomId: room.id,
      date: dateStr,
      start: selectedSlot,
      end,
      userName: userName.trim(),
    });
    setSelectedSlot(null);
  };

  const isSlotBooked = (start: string) => {
    const end = addMinutesToTime(start, 30);
    return !isSlotAvailable(room.id, date, start, end);
  };

  const getUserBookings = () => roomBookings.filter(b => b.userName === userName);

  return (
    <div className="mt-6 p-5 glass-panel rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Бронирование · {room.name}</h3>
        <span className="text-sm text-white/60">{format(date, 'd MMMM', { locale: ru })}</span>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-5">
        {slots.map((slot) => {
          const booked = isSlotBooked(slot);
          const isSelected = selectedSlot === slot;
          return (
            <button
              key={slot}
              disabled={booked}
              onClick={() => handleSlotClick(slot)}
              className={`py-3 px-2 rounded-xl text-sm font-medium transition-all duration-200 ${
  booked
    ? 'bg-gray-800/30 text-gray-500 cursor-not-allowed border border-gray-700/30'
    : isSelected
    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/40 scale-105 border-0'
    : 'bg-white/5 text-white/90 hover:bg-white/10 border border-white/10 hover:border-white/20 hover:scale-[1.02]'
}`}
            >
              {slot}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <input
          type="text"
          placeholder="Ваше имя"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
        <button
          onClick={handleConfirm}
          disabled={!selectedSlot || !userName.trim()}
          className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white font-medium shadow-lg shadow-blue-600/30 disabled:opacity-40 disabled:shadow-none transition-all"
        >
          Забронировать
        </button>
      </div>

      {getUserBookings().length > 0 && (
        <div className="mt-6 pt-4 border-t border-white/10">
          <p className="text-sm text-white/70 mb-2">Мои бронирования</p>
          <div className="space-y-2">
            {getUserBookings().map(b => (
              <div key={b.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                <span className="text-white">{b.start} – {b.end}</span>
                <button
                  onClick={() => cancelBooking(b.id)}
                  className="text-xs text-red-400 hover:text-red-300 underline"
                >
                  Отменить
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeSlotGrid;
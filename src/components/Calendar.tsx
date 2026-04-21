import React, { useState } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import useStore from '../store';
import BookingModal from './BookingModal';

const DAYS_TO_SHOW = 7;

const Calendar: React.FC = () => {
  const { rooms, bookings, selectedDate } = useStore();
  const [modalInfo, setModalInfo] = useState<{ roomId: string; date: Date } | null>(null);

  const dates = Array.from({ length: DAYS_TO_SHOW + 1 }, (_, i) => addDays(selectedDate, i));

  const getBookingsForCell = (roomId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return bookings
      .filter(b => b.roomId === roomId && b.date === dateStr)
      .sort((a, b) => a.start.localeCompare(b.start));
  };

  return (
    <div className="overflow-x-auto scrollbar-hide">
      <div className="min-w-[800px]">
        <div className="grid grid-cols-[200px_repeat(8,1fr)] gap-2 mb-2">
          <div className="p-3 text-white/50 text-sm font-medium">Помещение</div>
          {dates.map(date => {
            const isToday = isSameDay(date, new Date());
            return (
              <div
                key={date.toISOString()}
                className={`glass-card p-3 rounded-xl text-center transition-all ${
                  isToday ? 'ring-2 ring-blue-400/50 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : ''
                }`}
              >
                <div className="text-white font-medium">
                  {format(date, 'EEE, d MMM', { locale: ru })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-2">
          {rooms.map(room => (
            <div key={room.id} className="grid grid-cols-[200px_repeat(8,1fr)] gap-2">
              <div className="glass-card p-3 rounded-xl flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shadow-[0_0_6px_currentColor]"
                  style={{ backgroundColor: room.color, color: room.color }}
                />
                <span className="text-white font-medium truncate">{room.name}</span>
                <span className="text-white/40 text-xs ml-auto">{room.capacity} мест</span>
              </div>

              {dates.map(date => {
                const cellBookings = getBookingsForCell(room.id, date);
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => setModalInfo({ roomId: room.id, date })}
                    className="glass-card p-2 rounded-xl text-left transition-all hover:bg-white/10 hover:scale-[1.01] cursor-pointer min-h-[85px]"
                  >
                    {cellBookings.length === 0 ? (
                      <span className="text-white/40 text-sm">Свободно</span>
                    ) : (
                      <div className="space-y-1">
                        {cellBookings.slice(0, 3).map(b => (
                          <div key={b.id} className="text-xs">
                            <div className="text-white font-medium truncate">{b.userName}</div>
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
            </div>
          ))}
        </div>
      </div>

      {modalInfo && (
        <BookingModal
          roomId={modalInfo.roomId}
          date={modalInfo.date}
          onClose={() => setModalInfo(null)}
        />
      )}
    </div>
  );
};

export default Calendar;
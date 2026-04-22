import React, { useState } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import useStore from '../store';

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00'
];

const DURATION_OPTIONS = [30, 60, 90, 120, 180, 240];

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

const Calendar: React.FC = () => {
  const {
    rooms,
    bookings,
    selectedDate,
    addBooking,
    cancelBooking,
    isSlotAvailable,
    getCurrentUser,
    setCurrentUser,
    getNotificationEmails,
    setNotificationEmails,
  } = useStore();

  const [modal, setModal] = useState<{ roomId: string; date: Date } | null>(null);
  const [userName, setUserName] = useState(getCurrentUser());
  const [startTime, setStartTime] = useState(TIME_SLOTS[0]);
  const [duration, setDuration] = useState(60);
  const [notificationEmails, setNotificationEmailsLocal] = useState(getNotificationEmails());

  const dates = Array.from({ length: 7 }, (_, i) => addDays(selectedDate, i));

  const getBookingsForCell = (roomId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return bookings
      .filter(b => b.roomId === roomId && b.date === dateStr)
      .sort((a, b) => a.start.localeCompare(b.start));
  };

  const openModal = (roomId: string, date: Date) => {
    setModal({ roomId, date });
    setUserName(getCurrentUser());
    setNotificationEmailsLocal(getNotificationEmails());
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

    setCurrentUser(userName.trim());
    setNotificationEmails(notificationEmails.trim());

    await addBooking({
      roomId: modal.roomId,
      date: dateStr,
      start: startTime,
      end: endTime,
      userName: userName.trim(),
    });

    const emails = notificationEmails
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);

    if (emails.length > 0) {
      try {
        await fetch('/api/send-booking-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userName: userName.trim(),
            roomName: rooms.find(r => r.id === modal.roomId)?.name,
            date: format(modal.date, 'd MMMM yyyy', { locale: ru }),
            start: startTime,
            end: endTime,
            recipients: emails,
          }),
        });
      } catch (error) {
        console.error('Ошибка отправки email:', error);
      }
    }

    closeModal();
  };

  const handleDelete = async (bookingId: string) => {
    if (confirm('Удалить бронь?')) {
      await cancelBooking(bookingId);
    }
  };

  const availableStartSlots = modal
    ? TIME_SLOTS.filter(slot => {
        const dateStr = format(modal.date, 'yyyy-MM-dd');
        return isSlotAvailable(modal.roomId, dateStr, slot, add30min(slot));
      })
    : [];

  const selectedRoom = modal ? rooms.find(r => r.id === modal.roomId) : null;
  const currentUser = getCurrentUser();

  return (
    <div className="overflow-x-auto scrollbar-hide">
      <div className="grid grid-cols-[260px_repeat(7,1fr)] gap-3 min-w-[900px]">
        <div className="p-3 text-[#b0c8e0] text-sm font-medium uppercase tracking-wider">
          Помещение
        </div>

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

        {rooms.map(room => (
          <React.Fragment key={room.id}>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-3 flex flex-col justify-center min-h-[90px]">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shadow-[0_0_6px_currentColor]"
                  style={{ backgroundColor: room.color, color: room.color }}
                />
                <span className="text-white font-medium break-words">{room.name}</span>
              </div>
              <span className="text-[#b0c8e0] text-xs mt-1">{room.capacity} мест</span>
            </div>

            {dates.map(date => {
              const cellBookings = getBookingsForCell(room.id, date);
              return (
                <div
                  key={date.toISOString()}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-3 min-h-[90px] flex flex-col"
                >
                  <button
                    onClick={() => openModal(room.id, date)}
                    className="flex-1 text-left w-full transition-all hover:bg-white/5 rounded-xl -m-1 p-1"
                  >
                    {cellBookings.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-[#b0c8e0] text-sm">Свободно</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {cellBookings.slice(0, 3).map(b => (
                          <div key={b.id} className="text-xs flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="text-white font-medium break-words">
                                {b.userName}
                              </div>
                              <div className="text-[#b0c8e0]">{b.start}–{b.end}</div>
                            </div>
                            {b.userName === currentUser && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(b.id);
                                }}
                                className="ml-1 text-[#b02b3a] hover:text-red-400 text-lg leading-none"
                                title="Удалить"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                        {cellBookings.length > 3 && (
                          <div className="text-[#b0c8e0] text-xs">+{cellBookings.length - 3}</div>
                        )}
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {modal && selectedRoom && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white/85 backdrop-blur-xl border border-[#1a5cff]/10 rounded-2xl p-6 w-[420px] max-w-full shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-[#0a2a44] mb-1">
              {selectedRoom.name}
            </h2>
            <p className="text-[#2c4f7f] text-sm mb-4">
              {format(modal.date, 'd MMMM yyyy, EEEE', { locale: ru })}
            </p>

            {availableStartSlots.length === 0 ? (
              <p className="text-[#b02b3a] text-center py-4">Нет свободного времени</p>
            ) : (
              <div className="space-y-4">
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

                <div>
                  <label className="block text-[#2c4f7f] text-sm mb-2">
                    Email для уведомлений (через запятую)
                  </label>
                  <input
                    type="text"
                    placeholder="admin@вплюсе.pw, manager@вплюсе.pw"
                    value={notificationEmails}
                    onChange={e => setNotificationEmailsLocal(e.target.value)}
                    className="w-full bg-white/60 backdrop-blur-sm border border-[#1a5cff]/20 rounded-2xl px-4 py-3 text-[#0a2a44] placeholder-[#b0c8e0] focus:ring-2 focus:ring-[#1a5cff]/40 outline-none"
                  />
                  <p className="text-[#b0c8e0] text-xs mt-1">
                    Оставьте пустым, если не нужно отправлять уведомления
                  </p>
                </div>

                <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-3 text-sm text-[#2c4f7f]">
                  🕒 {startTime} – {addMinutesToTime(startTime, duration)}
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
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
import React, { useState } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import useStore from '../store';
import { logEvent } from '../firebase';

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
    notificationEmails,
  } = useStore();

  const [modal, setModal] = useState<{ roomId: string; date: Date } | null>(null);
  const [userName, setUserName] = useState(getCurrentUser());
  const [startTime, setStartTime] = useState(TIME_SLOTS[0]);
  const [duration, setDuration] = useState(60);
  const [topic, setTopic] = useState('');
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

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
    setStartTime(TIME_SLOTS[0]);
    setDuration(60);
    setTopic('');
    setGeneratedLink(null);
    logEvent('slot_viewed', { roomId, date: format(date, 'yyyy-MM-dd') });
  };

  const closeModal = () => setModal(null);

  const generateMeetingLink = () => {
    if (!modal) return '';
    const room = rooms.find(r => r.id === modal.roomId);
    const base = `${room?.name || 'meeting'}-${format(modal.date, 'yyyy-MM-dd')}-${startTime}`;
    const meetingId = base.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
    return `https://meet.jit.si/${meetingId}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Ссылка скопирована!');
  };

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

    const isVirtual = modal.roomId === 'virtual-video';
    const finalVideoLink = isVirtual ? generateMeetingLink() : undefined;

    await addBooking({
      roomId: modal.roomId,
      date: dateStr,
      start: startTime,
      end: endTime,
      userName: userName.trim(),
      topic: topic.trim() || undefined,
      videoMeetingLink: finalVideoLink,
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
            topic: topic.trim() || undefined,
            videoMeetingLink: finalVideoLink,
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
    <div className="overflow-x-auto scrollbar-hide pt-1">
      <div className="grid grid-cols-[200px_repeat(7,1fr)] md:grid-cols-[240px_repeat(7,1fr)] gap-2 md:gap-3 min-w-[800px] md:min-w-[900px]">
        <div className="sticky left-0 z-10 glass-card p-2 md:p-3 text-[#9CA3AF] text-[10px] md:text-sm font-medium uppercase tracking-wider">
          Помещение
        </div>

        {dates.map(date => {
          const isToday = isSameDay(date, new Date());
          const dayOfWeek = date.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          return (
            <div
              key={date.toISOString()}
              className={`glass-card p-2 md:p-3 text-center ${
                isToday ? 'ring-2 ring-[#3B82F6]/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : ''
              }`}
            >
              <div className="text-[10px] md:text-xs uppercase tracking-wider text-[#9CA3AF]">
                {format(date, 'EEE', { locale: ru })}
              </div>
              <div className={`text-sm md:text-base font-medium ${isWeekend ? 'text-rose-400' : 'text-[#F9FAFB]'}`}>
                {format(date, 'd MMM', { locale: ru })}
              </div>
            </div>
          );
        })}

        {rooms.map(room => (
          <React.Fragment key={room.id}>
            <div className="sticky left-0 z-10 glass-card p-2 md:p-3 flex flex-col justify-center min-h-[70px] md:min-h-[90px]">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full shadow-[0_0_8px_currentColor]"
                  style={{ backgroundColor: room.color, color: room.color }}
                />
                <span className="text-[#F9FAFB] font-medium break-words text-xs md:text-base leading-tight tracking-tight">
                  {room.name}
                </span>
              </div>
              <span className="text-[#9CA3AF] text-[10px] md:text-xs mt-1">{room.capacity} мест</span>
            </div>

            {dates.map(date => {
              const cellBookings = getBookingsForCell(room.id, date);
              const isOccupied = cellBookings.length > 0;
              return (
                <div
                  key={date.toISOString()}
                  className={`glass-card-interactive p-2 md:p-3 min-h-[70px] md:min-h-[90px] flex flex-col ${
                    isOccupied ? 'status-occupied' : 'status-free'
                  }`}
                >
                  <button
                    onClick={() => openModal(room.id, date)}
                    className="flex-1 text-left w-full transition-all rounded-xl -m-1 p-1"
                  >
                    {cellBookings.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-emerald-200/90 text-xs md:text-sm font-medium">Свободно</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {cellBookings.slice(0, 3).map(b => (
                          <div key={b.id} className="text-[10px] md:text-xs">
                            <div className="text-white font-medium break-words">
                              {b.topic || b.userName}
                            </div>
                            <div className="text-rose-200/80">{b.start}–{b.end}</div>
                            {b.videoMeetingLink && (
                              <a
                                href={b.videoMeetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 underline break-all"
                                onClick={(e) => e.stopPropagation()}
                              >
                                ▶️ Видео
                              </a>
                            )}
                            {b.userName === currentUser && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(b.id);
                                }}
                                className="ml-1 text-rose-400 hover:text-rose-300 text-base md:text-lg leading-none transition-colors"
                                title="Удалить"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                        {cellBookings.length > 3 && (
                          <div className="text-rose-200/60 text-[10px] md:text-xs">+{cellBookings.length - 3}</div>
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
          className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300"
          onClick={closeModal}
        >
          <div
            className="glass-panel p-5 md:p-7 w-full max-w-[440px] shadow-2xl scale-100 transition-all duration-300 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl md:text-2xl font-bold text-[#0B1220] mb-1 tracking-tight">
              {selectedRoom.name}
            </h2>
            <p className="text-[#374151] text-sm md:text-base mb-4">
              {format(modal.date, 'd MMMM yyyy, EEEE', { locale: ru })}
            </p>

            {availableStartSlots.length === 0 ? (
              <p className="text-rose-500 text-center py-6 text-base">Нет свободного времени</p>
            ) : (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Ваше имя"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  className="w-full bg-white/70 backdrop-blur-sm border border-[#3B82F6]/20 rounded-2xl px-4 py-3 text-[#0B1220] placeholder-[#9CA3AF] focus:ring-2 focus:ring-[#3B82F6]/40 outline-none transition-all"
                  autoFocus
                />

                <input
                  type="text"
                  placeholder="Тема встречи (необязательно)"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  className="w-full bg-white/70 backdrop-blur-sm border border-[#3B82F6]/20 rounded-2xl px-4 py-3 text-[#0B1220] placeholder-[#9CA3AF] focus:ring-2 focus:ring-[#3B82F6]/40 outline-none transition-all"
                />

                <div>
                  <label className="block text-[#374151] text-sm mb-1.5 font-medium">Начало</label>
                  <select
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full bg-white/70 backdrop-blur-sm border border-[#3B82F6]/20 rounded-2xl px-4 py-3 text-[#0B1220]"
                  >
                    {availableStartSlots.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#374151] text-sm mb-1.5 font-medium">Длительность</label>
                  <select
                    value={duration}
                    onChange={e => setDuration(parseInt(e.target.value))}
                    className="w-full bg-white/70 backdrop-blur-sm border border-[#3B82F6]/20 rounded-2xl px-4 py-3 text-[#0B1220]"
                  >
                    {DURATION_OPTIONS.map(mins => (
                      <option key={mins} value={mins}>
                        {Math.floor(mins / 60)} ч {mins % 60 > 0 ? `${mins % 60} мин` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-3 text-sm text-[#374151]">
                  🕒 {startTime} – {addMinutesToTime(startTime, duration)}
                </div>

                {selectedRoom.id === 'virtual-video' && (
                  <div className="border-t border-[#3B82F6]/20 pt-4">
                    <p className="text-sm font-medium text-[#0B1220] mb-2">Ссылка на видеовстречу:</p>
                    <div className="p-3 bg-white/40 rounded-xl border border-[#3B82F6]/20">
                      <code className="block text-xs bg-black/10 p-2 rounded break-all mb-2">
                        {generateMeetingLink()}
                      </code>
                      <button
                        onClick={() => copyToClipboard(generateMeetingLink())}
                        className="w-full py-2 bg-[#3B82F6] text-white text-sm rounded-lg hover:bg-[#2563EB] transition"
                      >
                        Копировать ссылку
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 mt-8">
              <button
                onClick={closeModal}
                className="flex-1 py-3 rounded-2xl bg-white/60 border border-[#3B82F6]/20 text-[#0B1220] font-medium hover:bg-white/80 transition-all"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={availableStartSlots.length === 0}
                className="flex-1 py-3 rounded-2xl bg-[#3B82F6] text-white font-medium shadow-lg shadow-[#3B82F6]/30 hover:bg-[#2563EB] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
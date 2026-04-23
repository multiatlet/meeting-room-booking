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

// Скелетон-ячейка
const SkeletonCell: React.FC<{ isOccupied?: boolean }> = ({ isOccupied = false }) => (
  <div className={`cell-card min-h-[70px] md:min-h-[90px] animate-pulse ${isOccupied ? 'status-occupied' : 'status-free'}`}>
    <div className="space-y-2">
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
    </div>
  </div>
);

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
    isLoading,
    isRefreshing,
    lastUpdated,
  } = useStore();

  const [modal, setModal] = useState<{ roomId: string; date: Date } | null>(null);
  const [userName, setUserName] = useState(getCurrentUser());
  const [startTime, setStartTime] = useState(TIME_SLOTS[0]);
  const [duration, setDuration] = useState(60);
  const [topic, setTopic] = useState('');

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

    const bookingData: Omit<import('../firebase').Booking, 'id'> = {
      roomId: modal.roomId,
      date: dateStr,
      start: startTime,
      end: endTime,
      userName: userName.trim(),
    };
    if (topic.trim()) bookingData.topic = topic.trim();
    if (finalVideoLink) bookingData.videoMeetingLink = finalVideoLink;

    await addBooking(bookingData);

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

  // Отображение скелетона, если загрузка первая и нет кэша
  const showSkeleton = isLoading && bookings.length === 0;

  return (
    <div className="relative overflow-x-auto scrollbar-hide pt-1">
      {/* Мягкий оверлей при фоновом обновлении */}
      {isRefreshing && (
        <div className="absolute inset-0 z-20 flex items-start justify-center pt-8 pointer-events-none">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg text-sm text-slate-600 dark:text-slate-300 pointer-events-auto">
            Обновление данных...
          </div>
        </div>
      )}

      <div className={`transition-opacity duration-300 ${isRefreshing ? 'opacity-70' : 'opacity-100'}`}>
        <div className="grid grid-cols-[200px_repeat(7,1fr)] md:grid-cols-[240px_repeat(7,1fr)] gap-3 min-w-[800px] md:min-w-[900px]">
          <div className="sticky left-0 z-10 surface-card p-3 text-slate-500 dark:text-slate-400 text-xs md:text-sm font-medium uppercase tracking-wider">
            Помещение
          </div>

          {dates.map(date => {
            const isToday = isSameDay(date, new Date());
            const dayOfWeek = date.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            return (
              <div
                key={date.toISOString()}
                className={`surface-card p-3 text-center ${
                  isToday ? 'ring-2 ring-blue-500/20 dark:ring-blue-400/20' : ''
                }`}
              >
                <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {format(date, 'EEE', { locale: ru })}
                </div>
                <div className={`text-sm md:text-base font-medium ${isWeekend ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                  {format(date, 'd MMM', { locale: ru })}
                </div>
              </div>
            );
          })}

          {rooms.map(room => (
            <React.Fragment key={room.id}>
              <div className="sticky left-0 z-10 surface-card p-3 flex flex-col justify-center min-h-[70px] md:min-h-[90px]">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full"
                    style={{ backgroundColor: room.color }}
                  />
                  <span className="text-slate-900 dark:text-white font-medium text-xs md:text-base">
                    {room.name}
                  </span>
                </div>
                <span className="text-slate-500 dark:text-slate-400 text-[10px] md:text-xs mt-1">{room.capacity} мест</span>
              </div>

              {dates.map(date => {
                if (showSkeleton) {
                  // Скелетон – показываем заглушки для всех ячеек
                  return <SkeletonCell key={date.toISOString()} isOccupied={false} />;
                }

                const cellBookings = getBookingsForCell(room.id, date);
                const isOccupied = cellBookings.length > 0;
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => openModal(room.id, date)}
                    className={`cell-card text-left min-h-[70px] md:min-h-[90px] ${isOccupied ? 'status-occupied' : 'status-free'}`}
                  >
                    {cellBookings.length === 0 ? (
                      <div className="flex items-center h-full">
                        <span className="text-slate-400 dark:text-slate-500 text-sm">Свободно</span>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {cellBookings.slice(0, 3).map(b => (
                          <div key={b.id} className="text-xs">
                            <div className="text-slate-900 dark:text-white font-medium">
                              {b.topic || b.userName}
                            </div>
                            <div className="text-slate-500 dark:text-slate-400">{b.start}–{b.end}</div>
                            {b.videoMeetingLink && (
                              <a
                                href={b.videoMeetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 text-xs underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Видео
                              </a>
                            )}
                            {b.userName === currentUser && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(b.id);
                                }}
                                className="mt-1 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 transition-colors"
                                title="Удалить бронь"
                              >
                                Удалить
                              </button>
                            )}
                          </div>
                        ))}
                        {cellBookings.length > 3 && (
                          <div className="text-slate-400 dark:text-slate-500 text-xs">+{cellBookings.length - 3}</div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {modal && selectedRoom && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="modal-panel p-6 w-full max-w-[440px] max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">
              {selectedRoom.name}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              {format(modal.date, 'd MMMM yyyy, EEEE', { locale: ru })}
            </p>

            {availableStartSlots.length === 0 ? (
              <p className="text-rose-500 text-center py-6">Нет свободного времени</p>
            ) : (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Ваше имя"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
                  autoFocus
                />

                <input
                  type="text"
                  placeholder="Тема встречи"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
                />

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 text-sm mb-1.5">Начало</label>
                  <select
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white"
                  >
                    {availableStartSlots.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 text-sm mb-1.5">Длительность</label>
                  <select
                    value={duration}
                    onChange={e => setDuration(parseInt(e.target.value))}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white"
                  >
                    {DURATION_OPTIONS.map(mins => (
                      <option key={mins} value={mins}>
                        {Math.floor(mins / 60)} ч {mins % 60 > 0 ? `${mins % 60} мин` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-sm text-slate-600 dark:text-slate-300">
                  🕒 {startTime} – {addMinutesToTime(startTime, duration)}
                </div>

                {selectedRoom.id === 'virtual-video' && (
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                    <p className="text-sm font-medium text-slate-900 dark:text-white mb-2">Ссылка на видеовстречу:</p>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                      <code className="block text-xs bg-slate-100 dark:bg-slate-900 p-2 rounded break-all mb-2">
                        {generateMeetingLink()}
                      </code>
                      <button
                        onClick={() => copyToClipboard(generateMeetingLink())}
                        className="w-full py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
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
                className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={availableStartSlots.length === 0}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
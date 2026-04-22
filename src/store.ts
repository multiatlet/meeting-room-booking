import { create } from 'zustand';
import {
  subscribeToBookings,
  addBookingToFirebase,
  deleteBookingFromFirebase,
  subscribeToNotificationEmails,
  setNotificationEmails as setFirebaseNotificationEmails,
  logEvent,
} from './firebase';
import type { Booking } from './firebase';

export type RoomType = 'conference' | 'large' | 'small' | 'virtual';

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  capacity: number;
  color: string;
}

interface AppState {
  rooms: Room[];
  bookings: Booking[];
  selectedDate: Date;
  notificationEmails: string;
  initializeFirebaseSync: () => () => void;
  setSelectedDate: (date: Date) => void;
  addBooking: (booking: Omit<Booking, 'id'>) => Promise<void>;
  cancelBooking: (bookingId: string) => Promise<boolean>;
  isSlotAvailable: (roomId: string, date: string, start: string, end: string) => boolean;
  getCurrentUser: () => string;
  setCurrentUser: (name: string) => void;
  updateNotificationEmails: (emails: string) => Promise<void>;
}

export const createDateTime = (dateStr: string, timeStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
};

const STORAGE_USER_KEY = 'booking_user_name';

const validateBooking = (booking: Omit<Booking, 'id'>, existingBookings: Booking[]): string | null => {
  if (!booking.userName || booking.userName.trim().length === 0) {
    return 'Имя пользователя обязательно';
  }
  if (!booking.roomId || !booking.date || !booking.start || !booking.end) {
    return 'Все поля обязательны';
  }
  const start = createDateTime(booking.date, booking.start);
  const end = createDateTime(booking.date, booking.end);
  if (end <= start) {
    return 'Время окончания должно быть позже начала';
  }
  // Для виртуальной комнаты пропускаем проверку конфликтов
  if (booking.roomId === 'virtual-video') {
    return null;
  }
  for (const b of existingBookings) {
    if (b.roomId !== booking.roomId || b.date !== booking.date) continue;
    const bStart = createDateTime(b.date, b.start);
    const bEnd = createDateTime(b.date, b.end);
    if (start < bEnd && end > bStart) {
      return 'Время пересекается с существующей бронью';
    }
  }
  return null;
};

const useStore = create<AppState>((set, get) => ({
  rooms: [
    { id: 'small-1', name: 'Малая переговорная 1', type: 'small', capacity: 2, color: '#10b981' },
    { id: 'small-2', name: 'Малая переговорная 2', type: 'small', capacity: 2, color: '#f59e0b' },
    { id: 'large-1', name: 'Большая переговорная 3', type: 'large', capacity: 15, color: '#8b5cf6' },
    { id: 'conf-1', name: 'Конференц-зал', type: 'conference', capacity: 30, color: '#3b82f6' },
    { id: 'virtual-video', name: 'Видеовстреча (beta)', type: 'virtual', capacity: 100, color: '#8b5cf6' },
  ],
  bookings: [],
  selectedDate: new Date(),
  notificationEmails: '',

  initializeFirebaseSync: () => {
    const unsubBookings = subscribeToBookings((bookings) => set({ bookings }));
    const unsubSettings = subscribeToNotificationEmails((emails) => set({ notificationEmails: emails }));
    return () => {
      unsubBookings();
      unsubSettings();
    };
  },

  setSelectedDate: (date) => set({ selectedDate: date }),

  addBooking: async (booking) => {
    const { bookings } = get();
    const error = validateBooking(booking, bookings);
    if (error) {
      alert(error);
      return;
    }
    try {
      await addBookingToFirebase(booking);
      localStorage.setItem(STORAGE_USER_KEY, booking.userName);
      await logEvent('booking_created', { roomId: booking.roomId, date: booking.date, start: booking.start });
      alert('✅ Комната забронирована!');
    } catch (error) {
      console.error('Ошибка при добавлении брони:', error);
      alert('❌ Не удалось забронировать');
    }
  },

  cancelBooking: async (bookingId) => {
    const { bookings, getCurrentUser } = get();
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return false;
    if (booking.userName !== getCurrentUser()) {
      alert('Вы не можете удалить чужую бронь');
      return false;
    }
    try {
      await deleteBookingFromFirebase(bookingId);
      await logEvent('booking_deleted', { roomId: booking.roomId, date: booking.date });
      alert('🗑️ Бронь отменена');
      return true;
    } catch (error) {
      console.error('Ошибка при отмене брони:', error);
      alert('❌ Не удалось отменить бронь');
      return false;
    }
  },

  isSlotAvailable: (roomId, date, start, end) => {
    // Для виртуальной комнаты всегда доступно
    if (roomId === 'virtual-video') {
      return true;
    }
    const { bookings } = get();
    return !bookings.some(b => {
      if (b.roomId !== roomId || b.date !== date) return false;
      const bStart = createDateTime(b.date, b.start);
      const bEnd = createDateTime(b.date, b.end);
      const slotStart = createDateTime(date, start);
      const slotEnd = createDateTime(date, end);
      return slotStart < bEnd && slotEnd > bStart;
    });
  },

  getCurrentUser: () => {
    return localStorage.getItem(STORAGE_USER_KEY) || '';
  },

  setCurrentUser: (name: string) => {
    localStorage.setItem(STORAGE_USER_KEY, name);
  },

  updateNotificationEmails: async (emails: string) => {
    await setFirebaseNotificationEmails(emails);
  },
}));

export default useStore;
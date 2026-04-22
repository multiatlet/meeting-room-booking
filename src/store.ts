import { create } from 'zustand';
import { subscribeToBookings, addBookingToFirebase, deleteBookingFromFirebase } from './firebase';
import type { Booking } from './firebase';

export type RoomType = 'conference' | 'large' | 'small';

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
  initializeFirebaseSync: () => () => void;
  setSelectedDate: (date: Date) => void;
  addBooking: (booking: Omit<Booking, 'id'>) => Promise<void>;
  cancelBooking: (bookingId: string) => Promise<boolean>;
  isSlotAvailable: (roomId: string, date: string, start: string, end: string) => boolean;
  getCurrentUser: () => string;
  setCurrentUser: (name: string) => void;
  getNotificationEmails: () => string;
  setNotificationEmails: (emails: string) => void;
}

export const createDateTime = (dateStr: string, timeStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
};

const STORAGE_USER_KEY = 'booking_user_name';
const STORAGE_EMAILS_KEY = 'booking_notification_emails';

const useStore = create<AppState>((set, get) => ({
  rooms: [
    { id: 'conf-1', name: 'Конференц-зал', type: 'conference', capacity: 30, color: '#3b82f6' },
    { id: 'large-1', name: 'Большая переговорная', type: 'large', capacity: 15, color: '#8b5cf6' },
    { id: 'small-1', name: 'Малая переговорная A', type: 'small', capacity: 2, color: '#10b981' },
    { id: 'small-2', name: 'Малая переговорная B', type: 'small', capacity: 2, color: '#f59e0b' },
  ],
  bookings: [],
  selectedDate: new Date(),

  initializeFirebaseSync: () => {
    const unsubscribe = subscribeToBookings((bookings) => set({ bookings }));
    return unsubscribe;
  },

  setSelectedDate: (date) => set({ selectedDate: date }),

  addBooking: async (booking) => {
    const { isSlotAvailable } = get();
    if (!isSlotAvailable(booking.roomId, booking.date, booking.start, booking.end)) {
      alert('Этот слот уже занят');
      return;
    }
    try {
      await addBookingToFirebase(booking);
      localStorage.setItem(STORAGE_USER_KEY, booking.userName);
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
      alert('🗑️ Бронь отменена');
      return true;
    } catch (error) {
      console.error('Ошибка при отмене брони:', error);
      alert('❌ Не удалось отменить бронь');
      return false;
    }
  },

  isSlotAvailable: (roomId, date, start, end) => {
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

  getNotificationEmails: () => {
    return localStorage.getItem(STORAGE_EMAILS_KEY) || '';
  },

  setNotificationEmails: (emails: string) => {
    localStorage.setItem(STORAGE_EMAILS_KEY, emails);
  },
}));

export default useStore;
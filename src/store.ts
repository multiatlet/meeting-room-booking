import { create } from 'zustand';
import { parseISO } from 'date-fns';
import { subscribeToBookings, addBookingToFirebase, deleteBookingFromFirebase, Booking } from './firebase';

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
  selectedRoomId: string | null;
  selectedDate: Date;
  userName: string;
  initializeFirebaseSync: () => () => void;
  setSelectedRoom: (id: string | null) => void;
  setSelectedDate: (date: Date) => void;
  setUserName: (name: string) => void;
  addBooking: (booking: Omit<Booking, 'id'>) => Promise<void>;
  cancelBooking: (bookingId: string) => Promise<void>;
  isSlotAvailable: (roomId: string, date: Date, start: string, end: string, excludeBookingId?: string) => boolean;
}

const useStore = create<AppState>((set, get) => ({
  rooms: [
    { id: 'conf-1', name: 'Конференц-зал', type: 'conference', capacity: 30, color: '#3b82f6' },
    { id: 'large-1', name: 'Большая переговорная', type: 'large', capacity: 15, color: '#8b5cf6' },
    { id: 'small-1', name: 'Малая переговорная A', type: 'small', capacity: 6, color: '#10b981' },
    { id: 'small-2', name: 'Малая переговорная B', type: 'small', capacity: 6, color: '#f59e0b' },
  ],
  bookings: [],
  selectedRoomId: null,
  selectedDate: new Date(),
  userName: '',

  initializeFirebaseSync: () => {
    const unsubscribe = subscribeToBookings((bookings) => {
      set({ bookings });
    });
    return unsubscribe;
  },

  setSelectedRoom: (id) => set({ selectedRoomId: id }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setUserName: (name) => set({ userName: name }),

  addBooking: async (booking) => {
    const { isSlotAvailable } = get();
    if (!isSlotAvailable(booking.roomId, parseISO(booking.date), booking.start, booking.end)) {
      alert('Слот занят!');
      return;
    }
    await addBookingToFirebase(booking);
  },

  cancelBooking: async (bookingId) => {
    await deleteBookingFromFirebase(bookingId);
  },

  isSlotAvailable: (roomId, date, start, end, excludeBookingId) => {
    const { bookings } = get();
    const dateStr = date.toISOString().split('T')[0];
    return !bookings.some(b => {
      if (b.roomId !== roomId) return false;
      if (b.date !== dateStr) return false;
      if (excludeBookingId && b.id === excludeBookingId) return false;

      const bookingStart = parseTimeString(b.start);
      const bookingEnd = parseTimeString(b.end);
      const slotStart = parseTimeString(start);
      const slotEnd = parseTimeString(end);

      return (slotStart < bookingEnd && slotEnd > bookingStart);
    });
  },
}));

function parseTimeString(time: string): Date {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

export default useStore;
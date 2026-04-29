import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, push, remove, set, get, update } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

export const bookingsRef = ref(db, 'bookings');
export const settingsRef = ref(db, 'settings');

export const addBookingToFirebase = async (booking: Omit<Booking, 'id'>) => {
  const newRef = push(bookingsRef);
  await set(newRef, booking);
  return newRef.key;
};

export const deleteBookingFromFirebase = async (id: string) => {
  const bookingRef = ref(db, `bookings/${id}`);
  await remove(bookingRef);
};

export const subscribeToBookings = (callback: (bookings: Booking[]) => void) => {
  return onValue(bookingsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const bookingsArray = Object.entries(data).map(([id, value]: any) => ({
        id,
        ...value,
      }));
      callback(bookingsArray);
    } else {
      callback([]);
    }
  });
};

// ==================== АНАЛИТИКА ====================
export const logEvent = async (type: 'booking_created' | 'booking_deleted' | 'slot_viewed', metadata?: any) => {
  const userId = localStorage.getItem('visitor_id') || 'anonymous';
  const eventsRef = ref(db, 'analytics/events');
  await push(eventsRef, {
    type,
    userId,
    timestamp: Date.now(),
    ...metadata,
  });
};

export const trackUniqueVisitor = async (userId: string) => {
  const visitorRef = ref(db, `analytics/unique_visitors/${userId}`);
  const snapshot = await get(visitorRef);
  const now = Date.now();

  if (snapshot.exists()) {
    await update(visitorRef, { last_seen: now });
  } else {
    await set(visitorRef, {
      first_seen: now,
      last_seen: now,
    });
  }
};

export const subscribeToUniqueVisitorsCount = (callback: (count: number) => void) => {
  const visitorsRef = ref(db, 'analytics/unique_visitors');
  return onValue(visitorsRef, (snapshot) => {
    const data = snapshot.val();
    const count = data ? Object.keys(data).length : 0;
    callback(count);
  });
};

// ==================== НАСТРОЙКИ ====================
export const getNotificationEmails = async (): Promise<string> => {
  const snapshot = await get(ref(db, 'settings/notificationEmails'));
  return snapshot.val() || '';
};

export const setNotificationEmails = async (emails: string): Promise<void> => {
  await set(ref(db, 'settings/notificationEmails'), emails);
};

export const subscribeToNotificationEmails = (callback: (emails: string) => void) => {
  return onValue(ref(db, 'settings/notificationEmails'), (snapshot) => {
    callback(snapshot.val() || '');
  });
};

export interface Booking {
  id: string;
  roomId: string;
  date: string;
  start: string;
  end: string;
  userName: string;
  topic?: string;
  videoMeetingLink?: string;
}
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, push, remove, set } from 'firebase/database';

// Конфигурация будет подставлена из переменных окружения Vercel
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

// Тип данных (используется в других файлах)
export interface Booking {
  id: string;
  roomId: string;
  date: string;
  start: string;
  end: string;
  userName: string;
}
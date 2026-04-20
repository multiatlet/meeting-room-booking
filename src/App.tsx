import React, { useEffect } from 'react';
import { format } from 'date-fns';
import useStore from './store';
import RoomCard3D from './components/RoomCard3D';
import TimeSlotGrid from './components/TimeSlotGrid';
import Background3D from './components/Background3D';

const App: React.FC = () => {
  const { rooms, selectedRoomId, selectedDate, setSelectedRoom, setSelectedDate, initializeFirebaseSync } = useStore();
  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  useEffect(() => {
    const unsubscribe = initializeFirebaseSync();
    return unsubscribe;
  }, [initializeFirebaseSync]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f1a] via-[#1a1a2e] to-[#16213e] p-4 md:p-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          Бронирование комнат
        </h1>
        <div className="flex items-center gap-3">
          <label className="text-white/70 text-sm">Дата:</label>
          <input
            type="date"
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={(e) => setSelectedDate(e.target.valueAsDate || new Date())}
            className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {rooms.map((room) => (
          <RoomCard3D
            key={room.id}
            room={room}
            isSelected={selectedRoomId === room.id}
            onClick={() => setSelectedRoom(room.id)}
          />
        ))}
      </div>

      {selectedRoom ? (
        <TimeSlotGrid room={selectedRoom} date={selectedDate} />
      ) : (
        <div className="text-center text-white/50 py-12 glass-panel rounded-3xl">
          Выберите комнату, чтобы увидеть доступное время
        </div>
      )}

      <Background3D />
    </div>
  );
};

export default App;
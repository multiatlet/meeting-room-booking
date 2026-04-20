import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box, Plane, Environment, MeshWobbleMaterial } from '@react-three/drei';
import type { Room } from '../store';  // ← исправлено: type-only import

interface RoomCard3DProps {
  room: Room;
  isSelected: boolean;
  onClick: () => void;
}

const RoomCard3D: React.FC<RoomCard3DProps> = ({ room, isSelected, onClick }) => {
  const meshRef = useRef<any>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {  // ← исправлено: передаём колбэк
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.2) * 0.1;
      meshRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.5) * 0.05;
    }
  });

  const getGeometry = () => {
    switch (room.type) {
      case 'conference': return <Box args={[2.2, 1.8, 1.5]} />;
      case 'large': return <Box args={[1.8, 1.8, 1.5]} />;
      default: return <Box args={[1.4, 1.4, 1.4]} />;
    }
  };

  return (
    <div
      className={`relative group cursor-pointer transition-all duration-300 ${
        isSelected ? 'ring-4 ring-blue-500/50 rounded-2xl' : 'hover:scale-[1.02]'
      }`}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="h-40 w-full rounded-2xl overflow-hidden glass-card">
        <Canvas camera={{ position: [3, 2, 4], fov: 35 }} shadows dpr={[1, 2]}>
          <ambientLight intensity={0.5} />
          <spotLight position={[5, 5, 5]} angle={0.3} penumbra={1} intensity={1} castShadow />
          <pointLight position={[-2, 1, 2]} intensity={0.5} color={room.color} />
          <React.Suspense fallback={null}>
            <mesh ref={meshRef} castShadow receiveShadow>
              {getGeometry()}
              <MeshWobbleMaterial
                color={room.color}
                factor={hovered ? 0.2 : 0}
                speed={2}
                transparent
                opacity={0.85}
                roughness={0.2}
                metalness={0.1}
                emissive={room.color}
                emissiveIntensity={isSelected ? 0.5 : 0.1}
              />
            </mesh>
            <Box args={[0.5, 0.8, 0.1]} position={[0.5, 0.2, 0.8]}>
              <meshStandardMaterial color="#ffffff" emissive="#a5f3fc" emissiveIntensity={0.3} />
            </Box>
            <Plane args={[3, 3]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.9, 0]} receiveShadow>
              <meshStandardMaterial color="#1e1e2f" transparent opacity={0.3} />
            </Plane>
            <Environment preset="city" />
          </React.Suspense>
        </Canvas>
      </div>
      <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center text-white z-10">
        <span className="font-medium text-sm bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">
          {room.name}
        </span>
        <span className="text-xs bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
          {room.capacity} мест
        </span>
      </div>
    </div>
  );
};

export default RoomCard3D;
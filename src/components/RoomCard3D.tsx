import React, { useRef, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box, Plane, Environment, MeshDistortMaterial } from '@react-three/drei';
import type { Room } from '../store';

interface RoomCard3DProps {
  room: Room;
  isSelected: boolean;
  onClick: () => void;
}

// Компонент с анимацией — внутри Canvas
const AnimatedRoom: React.FC<{ room: Room; isSelected: boolean; hovered: boolean }> = ({ room, isSelected, hovered }) => {
  const meshRef = useRef<any>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.3) * 0.08;
      meshRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.6) * 0.03;
    }
  });

  const getGeometry = () => {
    switch (room.type) {
      case 'conference': return <Box args={[2.4, 1.8, 1.5]} />;
      case 'large': return <Box args={[1.9, 1.8, 1.5]} />;
      default: return <Box args={[1.5, 1.5, 1.5]} />;
    }
  };

  return (
    <>
      <ambientLight intensity={0.6} />
      <spotLight position={[5, 5, 5]} angle={0.3} penumbra={1} intensity={1.2} castShadow />
      <pointLight position={[-2, 1, 2]} intensity={0.8} color={room.color} />
      <pointLight position={[2, 2, -2]} intensity={0.3} color="#ffffff" />
      
      <mesh ref={meshRef} castShadow receiveShadow>
        {getGeometry()}
        <MeshDistortMaterial
          color={room.color}
          speed={hovered ? 3 : 1}
          distort={hovered ? 0.2 : 0.05}
          radius={1}
          transparent
          opacity={0.9}
          roughness={0.15}
          metalness={0.1}
          emissive={room.color}
          emissiveIntensity={isSelected ? 0.4 : 0.1}
        />
      </mesh>
      
      {/* Внутренние декоративные элементы */}
      <Box args={[0.6, 0.9, 0.1]} position={[0.6, 0.2, 0.8]}>
        <meshStandardMaterial color="#ffffff" emissive="#a5f3fc" emissiveIntensity={0.4} />
      </Box>
      <Box args={[0.4, 0.6, 0.1]} position={[-0.4, 0.3, 0.8]}>
        <meshStandardMaterial color="#ffffff" emissive="#c4b5fd" emissiveIntensity={0.3} />
      </Box>
      
      <Plane args={[3.5, 3.5]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.9, 0]} receiveShadow>
        <meshStandardMaterial color="#111827" transparent opacity={0.2} />
      </Plane>
      
      <Environment preset="city" />
    </>
  );
};

const RoomCard3D: React.FC<RoomCard3DProps> = ({ room, isSelected, onClick }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`relative group cursor-pointer transition-all duration-500 ${
        isSelected 
          ? 'ring-2 ring-blue-400/60 shadow-2xl shadow-blue-500/20 scale-[1.02]' 
          : 'hover:scale-[1.01] hover:shadow-xl hover:shadow-black/30'
      } rounded-2xl`}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="h-44 w-full rounded-2xl overflow-hidden glass-card border border-white/15 shadow-inner">
        <Canvas camera={{ position: [3.5, 2.2, 4.5], fov: 32 }} shadows dpr={[1, 1.5]}>
          <Suspense fallback={null}>
            <AnimatedRoom room={room} isSelected={isSelected} hovered={hovered} />
          </Suspense>
        </Canvas>
      </div>
      
      {/* Информационная плашка */}
      <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center text-white z-10">
        <span className="font-semibold text-sm tracking-wide bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
          {room.name}
        </span>
        <span className="text-xs font-medium bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-1">
          <span>👥</span> {room.capacity}
        </span>
      </div>
      
      {/* Индикатор выбора (галочка) */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 bg-blue-500 rounded-full p-1 shadow-lg z-20">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default RoomCard3D;
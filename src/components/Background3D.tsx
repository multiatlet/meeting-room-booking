import React from 'react';
import { Canvas } from '@react-three/fiber';

const Background3D: React.FC = () => (
  <div className="fixed inset-0 -z-10 opacity-30 pointer-events-none">
    <Canvas camera={{ position: [0, 0, 5] }}>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} />
      <React.Suspense fallback={null}>
        <group>
          {[...Array(20)].map((_, i) => (
            <mesh key={i} position={[Math.sin(i) * 4, Math.cos(i * 2) * 3, -2]}>
              <sphereGeometry args={[0.05 + Math.random() * 0.1, 8, 8]} />
              <meshStandardMaterial color="#4f9cf7" emissive="#1e3a8a" emissiveIntensity={0.5} />
            </mesh>
          ))}
        </group>
      </React.Suspense>
    </Canvas>
  </div>
);

export default Background3D;
import React, { useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { riskColor, VESSELS } from "./data.js";

const PATHS = {
  LAD: [[0, 1.4, 0.9], [-0.1, 0.9, 1.15], [-0.15, 0.3, 1.2], [-0.1, -0.4, 1.0], [0, -1.1, 0.5]],
  LCX: [[0, 1.4, 0.9], [-0.6, 1.0, 0.7], [-1.1, 0.4, 0.1], [-1.0, -0.2, -0.5], [-0.6, -0.6, -0.8]],
  RCA: [[0.1, 1.35, 0.85], [0.7, 0.95, 0.6], [1.15, 0.3, 0.0], [1.0, -0.4, -0.3], [0.5, -1.0, -0.2]],
};

function Vessel({ name, prob, selected, onSelect }) {
  const [hover, setHover] = useState(false);
  const geom = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      PATHS[name].map((p) => new THREE.Vector3(...p))
    );
    return new THREE.TubeGeometry(curve, 80, selected || hover ? 0.12 : 0.09, 14, false);
  }, [name, selected, hover]);
  const color = riskColor(prob ?? 0);
  const start = PATHS[name][0];
  return (
    <group>
      <mesh
        geometry={geom}
        onClick={(e) => { e.stopPropagation(); onSelect(name); }}
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = "auto"; }}
      >
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={selected ? 0.9 : hover ? 0.6 : 0.3}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>
      <Html position={[start[0], start[1] + 0.15, start[2]]} center distanceFactor={9}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: "#fff", padding: "1px 5px",
          background: "rgba(0,0,0,.55)", borderRadius: 4,
          border: selected ? "1px solid #4f9cff" : "1px solid transparent",
          whiteSpace: "nowrap", pointerEvents: "none",
        }}>{name}</div>
      </Html>
    </group>
  );
}
function HeartBody() {
  // Stylized myocardium: a semi-transparent ellipsoid. Swap for an .gltf
  // mesh later if desired — the vessels are drawn independently either way.
  return (
    <mesh scale={[1.3, 1.6, 1.2]} rotation={[0, 0, 0.15]} onClick={(e) => e.stopPropagation()}>
      <icosahedronGeometry args={[1, 4]} />
      <meshStandardMaterial color="#6e1f24" roughness={0.7} metalness={0.05}
        transparent opacity={0.55} />
    </mesh>
  );
}

export default function Heart({ probs = {}, selected, onSelect }) {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 45 }} dpr={[1, 2]}
      onPointerMissed={() => onSelect(null)}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 5]} intensity={1.1} />
      <directionalLight position={[-4, -2, -3]} intensity={0.4} />
      <HeartBody />
      {VESSELS.map((v) => (
        <Vessel key={v} name={v} prob={probs[v]} selected={selected === v} onSelect={onSelect} />
      ))}
      <OrbitControls enablePan={false} minDistance={3} maxDistance={9} />
    </Canvas>
  );
}

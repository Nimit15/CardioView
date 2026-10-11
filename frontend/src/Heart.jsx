import React, { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { riskColor, VESSELS } from "./data.js";

// Coronary vessel centre-lines (unchanged) — each tube recolours by probability.
const PATHS = {
  LAD: [[0, 1.4, 0.9], [-0.1, 0.9, 1.15], [-0.15, 0.3, 1.2], [-0.1, -0.4, 1.0], [0, -1.1, 0.5]],
  LCX: [[0, 1.4, 0.9], [-0.6, 1.0, 0.7], [-1.1, 0.4, 0.1], [-1.0, -0.2, -0.5], [-0.6, -0.6, -0.8]],
  RCA: [[0.1, 1.35, 0.85], [0.7, 0.95, 0.6], [1.15, 0.3, 0.0], [1.0, -0.4, -0.3], [0.5, -1.0, -0.2]],
};

// Label anchors sit on each vessel's own territory (front / left / right) so the
// three tags never overlap.
const LABEL_POS = {
  LAD: [-0.12, 0.5, 1.3],
  LCX: [-0.95, 0.62, 0.3],
  RCA: [0.98, 0.55, 0.2],
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
  const lp = LABEL_POS[name];
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
      <Html position={lp} center distanceFactor={9} zIndexRange={[20, 0]}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: "#fff", padding: "1px 6px",
          background: "rgba(0,0,0,.6)", borderRadius: 4,
          border: selected ? "1px solid #4f9cff" : "1px solid rgba(255,255,255,.15)",
          whiteSpace: "nowrap", pointerEvents: "none",
        }}>{name}</div>
      </Html>
    </group>
  );
}

// Anatomically-styled myocardium: a solid of revolution that bulges at the base
// and tapers to a rounded apex, plus two atrial lobes at the back. The coronary
// tubes are drawn independently on top, so their geometry is untouched.
function HeartBody() {
  const bodyGeom = useMemo(() => {
    const profile = [
      [0.0, -1.72], [0.30, -1.5], [0.58, -1.18], [0.86, -0.76],
      [1.08, -0.3], [1.22, 0.12], [1.21, 0.56], [1.08, 0.96],
      [0.86, 1.26], [0.6, 1.48], [0.3, 1.58], [0.0, 1.62],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(profile, 72);
  }, []);

  const mat = (
    <meshStandardMaterial color="#9a2b2b" emissive="#360c0c" emissiveIntensity={0.35}
      roughness={0.52} metalness={0.0} transparent opacity={0.7} />
  );

  return (
    <group>
      <mesh geometry={bodyGeom} onClick={(e) => e.stopPropagation()}>{mat}</mesh>
      {/* atrial lobes, tucked toward the back-top so they never cover the vessels */}
      <mesh position={[-0.52, 1.18, -0.28]} scale={[0.62, 0.5, 0.6]} onClick={(e) => e.stopPropagation()}>
        <sphereGeometry args={[1, 32, 24]} />
        <meshStandardMaterial color="#86262a" emissive="#2c0a0a" emissiveIntensity={0.3}
          roughness={0.55} transparent opacity={0.8} />
      </mesh>
      <mesh position={[0.52, 1.18, -0.28]} scale={[0.62, 0.5, 0.6]} onClick={(e) => e.stopPropagation()}>
        <sphereGeometry args={[1, 32, 24]} />
        <meshStandardMaterial color="#86262a" emissive="#2c0a0a" emissiveIntensity={0.3}
          roughness={0.55} transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

export default function Heart({ probs = {}, selected, onSelect }) {
  return (
    <Canvas camera={{ position: [2.3, 1.2, 6.4], fov: 42 }} dpr={[1, 2]}
      onPointerMissed={() => onSelect(null)}>
      <hemisphereLight args={["#ffffff", "#3a1620", 0.55]} />
      <ambientLight intensity={0.32} />
      <directionalLight position={[4, 6, 6]} intensity={1.35} />
      <directionalLight position={[-5, 0, -2]} intensity={0.4} />
      <pointLight position={[0, 2.5, -5]} intensity={0.5} color="#ff6b6b" />
      <HeartBody />
      {VESSELS.map((v) => (
        <Vessel key={v} name={v} prob={probs[v]} selected={selected === v} onSelect={onSelect} />
      ))}
      <OrbitControls enablePan={false} target={[0, -0.05, 0]} minDistance={3.2} maxDistance={10} />
    </Canvas>
  );
}

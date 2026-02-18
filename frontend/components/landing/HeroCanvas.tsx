"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { PixelParticleMaterial } from "@/lib/shaders/HeroShaderMaterial";

function ShaderPlane() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const { size, mouse } = useThree();

  // Update shader uniforms on every frame
  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as any;
      material.uTime = state.clock.getElapsedTime();
      
      // Smoothly track mouse position (NDC to UV transition)
      const targetMouseX = (mouse.x + 1) / 2;
      const targetMouseY = (mouse.y + 1) / 2;
      
      material.uMouse.x += (targetMouseX - material.uMouse.x) * 0.1;
      material.uMouse.y += (targetMouseY - material.uMouse.y) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      {/* @ts-ignore */}
      <pixelParticleMaterial 
        key={PixelParticleMaterial.key}
        uResolution={new THREE.Vector2(size.width, size.height)}
      />
    </mesh>
  );
}

export function HeroCanvas() {
  return (
    <div className="absolute inset-0 -z-10 bg-black overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 1] }}
        dpr={[1, 2]} // Performance: Limit pixel ratio
        gl={{ antialias: false, stencil: false, depth: false }}
      >
        <ShaderPlane />
      </Canvas>
      {/* Overlay vignette/mesh for extra depth */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black pointer-events-none" />
    </div>
  );
}

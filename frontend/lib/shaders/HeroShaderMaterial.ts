import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";

/**
 * PixelParticleMaterial
 * A custom shader material that creates a pixelated, flowing particle effect.
 * Adapted for the AI Career Agent aesthetic (Purple/Cyan/Black).
 */
export const PixelParticleMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor1: new THREE.Color("#8B5CF6"), // Royal Purple
    uColor2: new THREE.Color("#22D3EE"), // Cyan Neon
    uMouse: new THREE.Vector2(0, 0),
    uResolution: new THREE.Vector2(1, 1),
  },
  // Vertex Shader
  `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  // Fragment Shader
  `
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec2 uMouse;
  uniform vec2 uResolution;
  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    vec2 uv = vUv;
    
    // Pixelation effect
    float pixelSize = 40.0;
    vec2 gridUv = floor(uv * pixelSize) / pixelSize;
    
    // Noise and flow
    float n = hash(gridUv);
    float t = uTime * 0.2;
    
    // Mouse proximity
    float dist = distance(gridUv, uMouse);
    float mouseEffect = smoothstep(0.4, 0.0, dist);
    
    // Dynamic color shifting
    float colorMix = sin(gridUv.x * 10.0 + t + n * 6.28) * 0.5 + 0.5;
    colorMix = mix(colorMix, 1.0, mouseEffect);
    
    vec3 color = mix(uColor1, uColor2, colorMix);
    
    // Brightness based on noise and mouse
    float brightness = sin(gridUv.y * 20.0 - t * 2.0 + n * 10.0) * 0.5 + 0.5;
    brightness *= n > 0.5 ? 1.2 : 0.4;
    brightness += mouseEffect * 0.5;
    
    // Ambient dark vignette
    float edge = 1.0 - smoothstep(0.5, 1.5, length(uv - 0.5));
    
    gl_FragColor = vec4(color * brightness * edge, 1.0);
  }
  `
);

extend({ PixelParticleMaterial });

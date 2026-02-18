import { ThreeElement } from "@react-three/fiber";
import { PixelParticleMaterial } from "@/lib/shaders/HeroShaderMaterial";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      pixelParticleMaterial: ThreeElement<typeof PixelParticleMaterial>;
    }
  }
}

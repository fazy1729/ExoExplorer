import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'three',
      'three/addons/controls/OrbitControls',
      'three/addons/postprocessing/EffectComposer',
      'three/addons/postprocessing/RenderPass',
      'three/addons/postprocessing/UnrealBloomPass'
    ]
  }
});
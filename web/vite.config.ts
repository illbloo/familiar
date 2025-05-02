import { defineConfig, loadEnv } from 'vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  return {
    envDir: path.dirname(new URL(import.meta.url).pathname),
    envPrefix: "FUCKYOU_",
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    server: {
      open: true,
    },
  };
});

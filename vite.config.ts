import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  esbuild: {
    legalComments: 'none',
    drop: ['console'],
  },
  server: {
    port: 5173,
    strictPort: false,
  },
  test: {
    dir: 'tests',
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});

import { URL, fileURLToPath } from 'node:url';
import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import viteTsConfigPaths from 'vite-tsconfig-paths';
import type { PluginOption } from 'vite';

const plugins: Array<PluginOption> =
  process.platform === 'win32'
    ? [
        devtools(),
        // no nitro because bugged
        // this is the plugin that enables path aliases
        viteTsConfigPaths({
          projects: ['./tsconfig.json'],
        }),
        tailwindcss(),
        cloudflare({ viteEnvironment: { name: 'ssr' } }),
        tanstackStart({
          srcDirectory: './src/frontend',
        }),
        viteReact({
          babel: {
            plugins: ['babel-plugin-react-compiler'],
          },
        }),
      ]
    : [
        devtools(),
        // nitro({ preset: 'bun' }),
        // this is the plugin that enables path aliases
        viteTsConfigPaths({
          projects: ['./tsconfig.json'],
        }),
        tailwindcss(),
        cloudflare({ viteEnvironment: { name: 'ssr' } }),
        tanstackStart({
          srcDirectory: './src/frontend',
        }),
        viteReact({
          babel: {
            plugins: ['babel-plugin-react-compiler'],
          },
        }),
      ];

const config = defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: plugins,
});

export default config;

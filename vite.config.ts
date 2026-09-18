import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ isSsrBuild }) => {
  let i18nModule = './locales/i18n.client.ts';
  if (isSsrBuild) {
    i18nModule = './locales/i18n.server.ts';
  }

  return {
    envPrefix: ['VITE_', 'DEFAULT_'],
    plugins: [tailwindcss(), react()],
    resolve: {
      alias: {
        '#locales/i18n': fileURLToPath(new URL(i18nModule, import.meta.url)),
      },
    },
    build: {
      copyPublicDir: !isSsrBuild,
    },
  };
});

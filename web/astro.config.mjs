import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const canonicalURL = import.meta.env.PUBLIC_CANONICAL_URL ?? 'https://TODO.example';

export default defineConfig({
  site: canonicalURL,
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [sitemap()],
  vite: {
    resolve: {
      alias: {
        '@': '/src',
      },
    },
  },
});

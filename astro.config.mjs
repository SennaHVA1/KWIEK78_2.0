// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

/**
 * Het adres waarop de site draait. Wordt gebruikt voor de canonical-tags en
 * voor de sitemap, dus het moet kloppen met waar hij echt staat.
 *
 *   SITE_URL       zet je zelf, in Cloudflare onder Settings > Variables
 *   CF_PAGES_URL   zet Cloudflare zelf, het adres van deze deploy
 *   de laatste     de bestemming zodra de club het domein overzet
 *
 * Zolang SITE_URL niet is ingesteld pakt hij dus automatisch het pages.dev
 * adres van de deploy, en klopt de canonical ook op de demo.
 */
const SITE = process.env.SITE_URL ?? process.env.CF_PAGES_URL ?? 'https://www.kwiek78.nl';

// Volledig statische site. Alles wordt bij `npm run build` naar HTML gerenderd.
export default defineConfig({
  site: SITE,
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  vite: { plugins: [tailwindcss()] },
});

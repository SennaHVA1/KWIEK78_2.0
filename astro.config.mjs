// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

/**
 * Het adres waarop de site draait. Wordt gebruikt voor de canonical-tags en
 * voor de sitemap, dus het moet kloppen met waar hij echt staat.
 *
 *   SITE_URL       zet je zelf, in Cloudflare onder Settings > Variables
 *   CF_PAGES_URL   zet Cloudflare zelf, het adres van deze deploy. Alleen voor
 *                  previews van andere branches dan main.
 *   de laatste     het eigen domein, voor productie
 *
 * Productie mag niet op CF_PAGES_URL draaien: dat is per deploy een ander
 * adres (abc123.kwiek78-2-0.pages.dev), en dan stuurt de canonical Google
 * daarheen in plaats van naar www.kwiek78.nl.
 */
const PREVIEW = process.env.CF_PAGES_BRANCH && process.env.CF_PAGES_BRANCH !== 'main';
const SITE =
  process.env.SITE_URL ?? (PREVIEW ? process.env.CF_PAGES_URL : undefined) ?? 'https://www.kwiek78.nl';

// Volledig statische site. Alles wordt bij `npm run build` naar HTML gerenderd.
export default defineConfig({
  site: SITE,
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  vite: { plugins: [tailwindcss()] },
});

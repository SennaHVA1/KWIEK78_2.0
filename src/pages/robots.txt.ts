/**
 * robots.txt.
 *
 * Als route en niet als vast bestand in /public, omdat de inhoud afhangt van
 * de demoschakelaar `IS_DEMO` in src/lib/club.ts en van het adres waarop de
 * site draait. Zo staat de knop op een plek.
 */
import type { APIRoute } from 'astro';
import { IS_DEMO } from '../lib/club';

export const GET: APIRoute = ({ site }) => {
  const basis = (site ?? new URL('https://www.kwiek78.nl')).origin;

  const regels = IS_DEMO
    ? [
        '# Demo-omgeving. Deze site hoort nog niet in de zoekresultaten,',
        '# want de bestaande clubsite staat er al in.',
        'User-agent: *',
        'Disallow: /',
      ]
    : [
        'User-agent: *',
        'Allow: /',
        '',
        `Sitemap: ${basis}/sitemap.xml`,
      ];

  return new Response(regels.join('\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};

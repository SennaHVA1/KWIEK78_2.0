/**
 * Sitemap, met de hand opgebouwd uit de adapters.
 *
 * Bewust geen @astrojs/sitemap: dat is een extra dependency voor iets wat
 * hier twintig regels is, en zo houden we zelf de hand in de prioriteiten.
 * Het programma en de uitslagen staan bovenaan, want dat is waar mensen voor
 * komen.
 */
import type { APIRoute } from 'astro';
import { getAlleWedstrijden, getTeams } from '../lib/sportlink';
import { getNieuws, getAantalNieuwsPaginas } from '../lib/nieuws';

type Regel = { pad: string; prioriteit: number; frequentie: string };

export const GET: APIRoute = ({ site }) => {
  // Het adres komt uit `site` in astro.config.mjs, dat op zijn beurt SITE_URL
  // of CF_PAGES_URL volgt. Niet hier hardcoderen: dan wijst de sitemap op de
  // demo naar een domein dat nog niet bestaat.
  const SITE = (site ?? new URL('https://www.kwiek78.nl')).origin;

  const regels: Regel[] = [
    { pad: '/', prioriteit: 1.0, frequentie: 'daily' },
    { pad: '/wedstrijden/programma', prioriteit: 0.9, frequentie: 'daily' },
    { pad: '/wedstrijden/uitslagen', prioriteit: 0.9, frequentie: 'daily' },
    { pad: '/wedstrijden/standen', prioriteit: 0.8, frequentie: 'weekly' },
    { pad: '/vrijwillige-diensten', prioriteit: 0.8, frequentie: 'weekly' },
    { pad: '/nieuws', prioriteit: 0.8, frequentie: 'weekly' },
    { pad: '/nieuws/kwiek-inside', prioriteit: 0.6, frequentie: 'monthly' },
    { pad: '/teams', prioriteit: 0.7, frequentie: 'monthly' },
    { pad: '/club/lid-worden', prioriteit: 0.7, frequentie: 'monthly' },
    { pad: '/club/bestuur', prioriteit: 0.6, frequentie: 'monthly' },
    { pad: '/club/agenda', prioriteit: 0.6, frequentie: 'weekly' },
    { pad: '/club/verjaardagen', prioriteit: 0.5, frequentie: 'weekly' },
    { pad: '/club/minutenspel', prioriteit: 0.5, frequentie: 'monthly' },
    { pad: '/club/informatiebulletin', prioriteit: 0.5, frequentie: 'monthly' },
    { pad: '/club/ereleden', prioriteit: 0.4, frequentie: 'yearly' },
    { pad: '/sponsoring', prioriteit: 0.7, frequentie: 'monthly' },
    { pad: '/contact', prioriteit: 0.7, frequentie: 'yearly' },
    { pad: '/privacyverklaring', prioriteit: 0.3, frequentie: 'yearly' },
    { pad: '/avg', prioriteit: 0.3, frequentie: 'yearly' },
  ];

  for (const team of getTeams()) {
    regels.push({ pad: `/teams/${team.id}`, prioriteit: 0.7, frequentie: 'weekly' });
  }
  for (const wedstrijd of getAlleWedstrijden()) {
    regels.push({ pad: `/wedstrijd/${wedstrijd.wedstrijdcode}`, prioriteit: 0.5, frequentie: 'weekly' });
  }
  for (const artikel of getNieuws()) {
    regels.push({ pad: `/nieuws/${artikel.slug}`, prioriteit: 0.6, frequentie: 'yearly' });
  }
  for (let pagina = 2; pagina <= getAantalNieuwsPaginas(); pagina++) {
    regels.push({ pad: `/nieuws/pagina/${pagina}`, prioriteit: 0.4, frequentie: 'weekly' });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${regels
  .map(
    (regel) => `  <url>
    <loc>${SITE}${regel.pad}</loc>
    <changefreq>${regel.frequentie}</changefreq>
    <priority>${regel.prioriteit.toFixed(1)}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};

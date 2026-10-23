/**
 * ============================================================================
 *  NIEUWS-ADAPTER
 * ============================================================================
 *
 * De wens van de club: berichten die de club plaatst komen automatisch als
 * artikel op de site.
 *
 * Er zijn twee bronnen, en de pagina's merken daar niets van:
 *
 *   - src/data/facebook/nieuws.json, bij elke build gevuld door
 *     scripts/facebook-ophalen.mjs uit de Graph API, met het Page Access
 *     Token uit FB_PAGE_TOKEN. Staat buiten git.
 *   - src/data/nieuws.json, de berichten van kwiek78.nl, met de hand gevuld
 *     door `npm run nieuws`. Dit is de terugval als er geen token is.
 *
 * Het formaat is in beide gevallen dat van de Graph API, dus alles hieronder
 * werkt voor allebei.
 *
 * BELANGRIJK OVER DE VORM VAN EEN BERICHT:
 * Een Facebookpost heeft geen kop, alleen een veld `message` met de volledige
 * tekst. Om beide bronnen door dezelfde molen te halen zet het importscript de
 * kop als eerste regel van `message`. Deze adapter doet daarom het volgende:
 *
 *   - de eerste niet-lege regel wordt de titel van het artikel
 *   - alles daaronder wordt de body
 *   - de samenvatting is de eerste alinea van die body, afgekapt
 *   - de slug wordt afgeleid van de titel
 *
 * Gevolg voor de club: de eerste regel van een Facebookbericht is meteen de
 * kop op de website. Dat is het waard om even te melden aan degene die post.
 *
 * Artikelen die met de hand zijn geschreven krijgen `bron: "cms"` en gaan door
 * precies dezelfde omzetting heen, zodat er maar een weg is.
 */

import vanWebsite from '../data/nieuws.json';
import type { Artikel } from './types';

/** De vorm van een ruw bericht, gelijk aan wat de Facebook Graph API geeft. */
type RuwBericht = {
  id: string;
  bron: 'website' | 'facebook' | 'cms';
  message: string;
  created_time: string;
  full_picture?: string;
  /** Niet van de Graph API zelf: het importscript meet de foto na. */
  beeldverhouding?: number;
  permalink_url?: string | null;
};

/* Bestaat src/data/facebook niet, dan geeft deze glob een leeg object en komt
   het nieuws van kwiek78.nl. */
const vanFacebook = import.meta.glob<{ default: unknown }>('../data/facebook/nieuws.json', { eager: true });
const berichten = (vanFacebook['../data/facebook/nieuws.json']?.default ?? vanWebsite) as RuwBericht[];

/** Maakt een URL-veilige slug van een titel. */
function maakSlug(titel: string): string {
  return titel
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')  // accenten weg
    .replace(/['’]/g, '')        // apostrofs weg, "Kwiek '78" wordt "kwiek-78"
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
}

/** Kort een tekst af op een woordgrens. */
function kort(tekst: string, maximaleLengte = 165): string {
  const schoon = tekst.replace(/\s+/g, ' ').trim();
  if (schoon.length <= maximaleLengte) return schoon;
  const afgekapt = schoon.slice(0, maximaleLengte);
  return afgekapt.slice(0, afgekapt.lastIndexOf(' ')) + '...';
}

/**
 * Zet een ruw bericht om naar een artikel.
 *
 * Dit is de functie die blijft staan zodra de Graph API is aangesloten.
 * Alleen de aanlevering erboven verandert dan.
 */
function naarArtikel(bericht: RuwBericht): Artikel {
  const regels = bericht.message.split('\n');
  const eersteGevulde = regels.findIndex((r) => r.trim().length > 0);
  const titel = regels[eersteGevulde].trim();
  const body = regels.slice(eersteGevulde + 1).join('\n').trim();
  const eersteAlinea = body.split(/\n\s*\n/)[0] ?? '';

  return {
    slug: maakSlug(titel),
    titel,
    datum: bericht.created_time,
    samenvatting: kort(eersteAlinea),
    body,
    afbeelding: bericht.full_picture,
    afbeeldingVerhouding: bericht.beeldverhouding,
    bron: bericht.bron,
    bronUrl: bericht.permalink_url ?? undefined,
  };
}

/** Alle artikelen, nieuwste eerst. */
export function getNieuws(): Artikel[] {
  return alleArtikelen;
}

/* Twee posts die met dezelfde regel beginnen ("Uitslagen van het weekend")
   krijgen dezelfde slug. De oudste houdt hem, de rest krijgt -2, -3. */
const alleArtikelen = (() => {
  const artikelen = berichten
    .map(naarArtikel)
    .sort((a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime());
  const gezien = new Map<string, number>();
  for (const artikel of artikelen) {
    const keer = (gezien.get(artikel.slug) ?? 0) + 1;
    gezien.set(artikel.slug, keer);
    if (keer > 1) artikel.slug = `${artikel.slug}-${keer}`;
  }
  return artikelen.reverse();
})();

/** Een enkel artikel op slug. Voedt /nieuws/[slug]. */
export function getArtikel(slug: string): Artikel | undefined {
  return getNieuws().find((artikel) => artikel.slug === slug);
}

/** De laatste `aantal` artikelen, voor het nieuwsblok op de homepage. */
export function getLaatsteNieuws(aantal = 4): Artikel[] {
  return getNieuws().slice(0, aantal);
}

/**
 * Artikelen in pagina's, voor het nieuwsoverzicht.
 * Paginanummering begint bij 1.
 */
export function getNieuwsPagina(pagina: number, perPagina = 6) {
  const alles = getNieuws();
  const totaalPaginas = Math.max(1, Math.ceil(alles.length / perPagina));
  const huidige = Math.min(Math.max(1, pagina), totaalPaginas);
  return {
    artikelen: alles.slice((huidige - 1) * perPagina, huidige * perPagina),
    pagina: huidige,
    totaalPaginas,
    totaalArtikelen: alles.length,
  };
}

/** Hoeveel pagina's telt het nieuwsoverzicht? Nodig voor getStaticPaths. */
export function getAantalNieuwsPaginas(perPagina = 6): number {
  return Math.max(1, Math.ceil(getNieuws().length / perPagina));
}

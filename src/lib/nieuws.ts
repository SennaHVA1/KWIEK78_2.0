/**
 * ============================================================================
 *  NIEUWS-ADAPTER
 * ============================================================================
 *
 * De wens van de club: berichten die op de Facebookpagina verschijnen komen
 * automatisch als artikel op de site.
 *
 * NU:    deze module leest uit /src/data/nieuws.json. Dat bestand heeft
 *        bewust dezelfde vorm als wat de Facebook Graph API teruggeeft, zodat
 *        de omzetting hieronder straks ongewijzigd blijft.
 *
 * STRAKS: GET https://graph.facebook.com/v21.0/{page-id}/posts
 *             ?fields=id,message,created_time,full_picture,permalink_url
 *             &access_token={page-access-token}
 *
 * OPENSTAAND PUNT, EN DIT IS GEEN TECHNISCHE KEUZE:
 * Om een Page Access Token te kunnen aanmaken moet de club Brand-On admin
 * maken op de Facebookpagina van v.v. Kwiek '78. Dat kan alleen de huidige
 * paginabeheerder doen, via Meta Business Suite. Zonder die stap kan deze
 * koppeling niet worden gebouwd. Zie README, kopje "Openstaande punten".
 *
 * BELANGRIJK OVER DE VORM VAN EEN FACEBOOKBERICHT:
 * Een Facebookpost heeft geen kop. Er is alleen een veld `message` met de
 * volledige tekst. Deze adapter doet daarom het volgende:
 *
 *   - de eerste niet-lege regel wordt de titel van het artikel
 *   - alles daaronder wordt de body
 *   - de samenvatting is de eerste alinea van die body, afgekapt
 *   - de slug wordt afgeleid van de titel
 *
 * Gevolg voor de club: de eerste regel van een Facebookbericht is meteen de
 * kop op de website. Dat is het waard om even te melden aan degene die post.
 *
 * Redactionele artikelen die niet van Facebook komen krijgen `bron: "cms"` en
 * gaan door precies dezelfde omzetting heen, zodat er maar een weg is.
 */

import ruwNieuws from '../data/nieuws.json';
import type { Artikel } from './types';

/** De vorm waarin de Facebook Graph API een bericht teruggeeft. */
type RuwBericht = {
  id: string;
  bron: 'facebook' | 'cms';
  message: string;
  created_time: string;
  full_picture?: string;
  permalink_url?: string | null;
};

const berichten = ruwNieuws as RuwBericht[];

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
    bron: bericht.bron,
    facebookUrl: bericht.permalink_url ?? undefined,
  };
}

/** Alle artikelen, nieuwste eerst. */
export function getNieuws(): Artikel[] {
  return berichten
    .map(naarArtikel)
    .sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime());
}

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

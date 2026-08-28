/**
 * ============================================================================
 *  CLUB-ADAPTER
 * ============================================================================
 *
 * Data die de club zelf beheert en die dus niet uit Sportlink of Facebook
 * komt: agenda, vrijwillige diensten, sponsoren, bestuur en commissies,
 * ereleden, documenten, minutenspel en Kwiek Inside.
 *
 * Waarom een derde module en niet alles in sportlink.ts: de drie modules
 * staan een-op-een voor de drie bronnen die er straks zijn.
 *
 *   sportlink.ts  ->  Sportlink API        (wedstrijden, teams, standen, leden)
 *   nieuws.ts     ->  Facebook Graph API   (nieuwsberichten)
 *   club.ts       ->  eigen beheer         (de rest)
 *
 * Pagina's importeren nooit rechtstreeks een JSON-bestand, altijd via een van
 * deze drie. Zo verandert er bij het aansluiten van een bron niets aan de
 * pagina's zelf.
 *
 * Voor deze module is er geen externe API voorzien. Wil de club dit zelf gaan
 * bijhouden, dan is de logische stap een headless CMS achter dezelfde
 * functies. De aanroepen in de pagina's blijven dan gelijk.
 */

import ruweAgenda from '../data/agenda.json';
import ruweDiensten from '../data/diensten.json';
import ruweSponsoren from '../data/sponsoren.json';
import ruwBestuur from '../data/bestuur.json';
import ruweEreleden from '../data/ereleden.json';
import ruweBulletins from '../data/bulletins.json';
import ruwMinutenspel from '../data/minutenspel.json';
import ruweVideos from '../data/videos.json';
import type {
  AgendaItem, Dienst, DienstSoort, Sponsor, SponsorNiveau,
  Bestuurslid, Erelid, Bulletin, MinutenspelClaim, Video,
} from './types';

const agenda = ruweAgenda as AgendaItem[];
const diensten = ruweDiensten as Dienst[];
const sponsoren = ruweSponsoren as Sponsor[];
const bestuur = ruwBestuur as Bestuurslid[];
const ereleden = ruweEreleden as Erelid[];
const bulletins = ruweBulletins as Bulletin[];
const minutenspel = ruwMinutenspel as MinutenspelClaim[];
const videos = ruweVideos as Video[];

/* ==========================================================================
   Demoschakelaar
   ========================================================================== */

/**
 * Staat deze site nog als demo online?
 *
 * Zolang dit `true` is krijgt elke pagina een noindex mee en houdt robots.txt
 * de zoekmachines tegen. Dat is nodig omdat de bestaande clubsite nog gewoon
 * in Google staat: twee sites over dezelfde club die om dezelfde zoekwoorden
 * vechten kost de club posities.
 *
 * Bij oplevering zet je dit op `false`. Dat is de enige plek waar het staat.
 */
export const IS_DEMO = true;

/* ==========================================================================
   Vaste clubgegevens
   ========================================================================== */

export const CLUBGEGEVENS = {
  naam: "v.v. Kwiek '78",
  opgericht: 1978,
  plaats: 'Avenhorn',
  provincie: 'Noord-Holland',
  straat: 'Het Veer 92',
  postcode: '1633 HE',
  sportpark: "Sportpark Kwiek '78",
  knvbClubcode: 'BBKY84H',
  telefoon: '0229 54 17 82',
  email: 'info@kwiek78.nl',
  facebook: 'https://www.facebook.com/vvkwiek78',
  x: 'https://x.com/kwiek78',
  youtube: 'https://www.youtube.com/@vvkwiek78',
  clubwinkel: 'https://kwiek78.clubwereld.nl/',
  /** Coordinaten van het sportpark, voor de kaart en de routelink. */
  breedtegraad: 52.5665,
  lengtegraad: 4.9542,
} as const;

/** Volledig adres op een regel. */
export const ADRES = `${CLUBGEGEVENS.straat}, ${CLUBGEGEVENS.postcode} ${CLUBGEGEVENS.plaats}`;

/** Routelink naar het sportpark. Opent in Google Maps of de kaart-app. */
export function routeLink(accommodatie: string = CLUBGEGEVENS.sportpark): string {
  const doel = accommodatie === CLUBGEGEVENS.sportpark ? ADRES : accommodatie;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(doel)}`;
}

/* ==========================================================================
   Agenda
   ========================================================================== */

/** Alle agendapunten, chronologisch. */
export function getAgenda(): AgendaItem[] {
  return [...agenda].sort((a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime());
}

/** De eerstvolgende activiteiten, voor het agendablok op de homepage. */
export function getKomendeAgenda(aantal = 4, vanaf: Date = new Date()): AgendaItem[] {
  const grens = vanaf.getTime();
  const komend = getAgenda().filter((item) => {
    const eind = new Date(item.eindDatum ?? item.datum).getTime();
    return eind >= grens;
  });
  // Is het seizoen voorbij en staat er niets meer, toon dan toch de laatste
  // punten. Een leeg agendablok op de homepage ziet eruit als een storing.
  return (komend.length > 0 ? komend : getAgenda().slice(-aantal)).slice(0, aantal);
}

/* ==========================================================================
   Vrijwillige diensten
   ========================================================================== */

export const DIENSTLABELS: Record<DienstSoort, string> = {
  'kantine-zaterdag': 'Kantinedienst zaterdag',
  'kantine-zondag': 'Kantinedienst zondag',
  'bestuursdienst': 'Bestuursdienst',
  'schoonmaak': 'Schoonmaak',
};

/** Alle diensten van een soort, chronologisch. */
export function getDiensten(soort: DienstSoort): Dienst[] {
  return diensten
    .filter((d) => d.soort === soort)
    .sort((a, b) => a.datum.localeCompare(b.datum));
}

/** Het complete rooster, gegroepeerd per soort en in menuvolgorde. */
export function getDienstenrooster(): { soort: DienstSoort; label: string; diensten: Dienst[] }[] {
  const volgorde: DienstSoort[] = ['kantine-zaterdag', 'kantine-zondag', 'bestuursdienst', 'schoonmaak'];
  return volgorde.map((soort) => ({ soort, label: DIENSTLABELS[soort], diensten: getDiensten(soort) }));
}

/**
 * De eerste datum die vanaf vandaag nog komt. De dienstenpagina zet daar de
 * scheiding tussen "komende weken" en "rest van het seizoen".
 */
export function eersteKomendeDienstDatum(vanaf: Date = new Date()): string {
  const vandaag = vanaf.toISOString().slice(0, 10);
  const komend = diensten.map((d) => d.datum).filter((d) => d >= vandaag).sort();
  return komend[0] ?? vandaag;
}

/* ==========================================================================
   Sponsoren
   ========================================================================== */

export const SPONSORLABELS: Record<SponsorNiveau, string> = {
  hoofdsponsor: 'Hoofdsponsoren',
  allstars: 'Allstars',
  club78: "Club van '78",
  bord: 'Bordsponsoren',
};

/** Alle sponsoren. */
export function getSponsoren(): Sponsor[] {
  return sponsoren;
}

/** Sponsoren van een niveau. */
export function getSponsorenPerNiveau(niveau: SponsorNiveau): Sponsor[] {
  return sponsoren.filter((s) => s.niveau === niveau);
}

/** Alle niveaus met hun sponsoren, in de volgorde waarin ze op de pagina staan. */
export function getSponsorNiveaus(): { niveau: SponsorNiveau; label: string; sponsoren: Sponsor[] }[] {
  const volgorde: SponsorNiveau[] = ['hoofdsponsor', 'allstars', 'club78', 'bord'];
  return volgorde.map((niveau) => ({
    niveau,
    label: SPONSORLABELS[niveau],
    sponsoren: getSponsorenPerNiveau(niveau),
  }));
}

/** De sponsoren die meedraaien in de carousel op de homepage. */
export function getCarouselSponsoren(): Sponsor[] {
  return sponsoren.filter((s) => s.inCarousel);
}

/* ==========================================================================
   Bestuur en commissies
   ========================================================================== */

/** Alle bestuurs- en commissieleden, gegroepeerd per commissie. */
export function getCommissies(): { commissie: string; leden: Bestuurslid[] }[] {
  const volgorde = [
    'Dagelijks bestuur',
    'Jeugdcommissie',
    'Wedstrijdsecretariaat',
    'Kantinecommissie',
    'Accommodatie en onderhoud',
    'Sponsorcommissie',
    'Ledenadministratie en communicatie',
    'Vertrouwenscontactpersonen',
  ];
  return volgorde
    .map((commissie) => ({ commissie, leden: bestuur.filter((l) => l.commissie === commissie) }))
    .filter((groep) => groep.leden.length > 0);
}

/** Het dagelijks bestuur, voor de contactpagina. */
export function getDagelijksBestuur(): Bestuurslid[] {
  return bestuur.filter((l) => l.commissie === 'Dagelijks bestuur');
}

/** Zoekt een contactpersoon op functie. Voor de contactpagina. */
export function getContactpersoon(functie: string): Bestuurslid | undefined {
  return bestuur.find((l) => l.functie === functie);
}

/* ==========================================================================
   Ereleden, documenten, minutenspel, video
   ========================================================================== */

export function getEreleden(): Erelid[] {
  return [...ereleden].sort((a, b) => a.sinds - b.sinds);
}

export function getBulletins(): Bulletin[] {
  return [...bulletins].sort((a, b) => b.datum.localeCompare(a.datum));
}

/** Het documentblok "Richtlijnen gebruik kunstgras" staat apart op de pagina. */
export function getKunstgrasrichtlijnen(): Bulletin | undefined {
  return bulletins.find((b) => b.id === 'richtlijnen-kunstgras');
}

/**
 * Het minutenspel: negentig minuten, waarvan een deel verkocht.
 * Geeft altijd alle negentig terug, met `naam` op null als de minuut vrij is.
 */
export function getMinutenspel(): { minuut: number; naam: string | null }[] {
  const geclaimd = new Map(minutenspel.map((c) => [c.minuut, c.naam]));
  return Array.from({ length: 90 }, (_, i) => ({
    minuut: i + 1,
    naam: geclaimd.get(i + 1) ?? null,
  }));
}

/** Hoeveel minuten zijn er verkocht en hoeveel zijn er nog vrij? */
export function getMinutenspelStand(): { verkocht: number; vrij: number; totaal: number } {
  const verkocht = minutenspel.length;
  return { verkocht, vrij: 90 - verkocht, totaal: 90 };
}

/** De afleveringen van Kwiek Inside, nieuwste eerst. */
export function getVideos(): Video[] {
  return [...videos].sort((a, b) => b.datum.localeCompare(a.datum));
}

/**
 * ============================================================================
 *  SPORTLINK-ADAPTER
 * ============================================================================
 *
 * Dit is de enige plek waar wedstrijd-, team-, stand- en ledendata vandaan
 * komt. Geen enkele pagina importeert rechtstreeks een JSON-bestand.
 *
 * NU:    de functies hieronder lezen uit /src/data/*.json.
 * STRAKS: dezelfde functies doen een fetch naar
 *
 *           https://data.sportlink.com/<artikel>?client_id=<CLIENT_ID>
 *
 *         Boven elke functie staat welk Sportlink-artikel erbij hoort.
 *         De veldnamen in /src/lib/types.ts liggen bewust dicht tegen de
 *         Sportlink-uitvoer aan, zodat alleen de body van deze functies
 *         hoeft te veranderen en geen enkele pagina.
 *
 * OPENSTAAND PUNT: de club moet bij Sportlink een client_id aanvragen voor
 * het domein waarop de site draait. Zonder dat ID werkt geen enkele call.
 * Zie README, kopje "Openstaande punten".
 *
 * Voorbeeld van hoe een functie er straks uitziet:
 *
 *   const BASIS = 'https://data.sportlink.com';
 *   const CLIENT_ID = import.meta.env.SPORTLINK_CLIENT_ID;
 *
 *   export async function getProgramma(): Promise<Wedstrijd[]> {
 *     const antwoord = await fetch(`${BASIS}/wedstrijdprogramma?client_id=${CLIENT_ID}`);
 *     const ruw = await antwoord.json();
 *     return ruw.map(naarWedstrijd);   // veldnamen omzetten, zie onder
 *   }
 *
 * Omdat de site statisch gebouwd wordt draaien die calls tijdens `npm run
 * build`, niet in de browser van de bezoeker. Het client_id komt dus nooit
 * in de uitgeleverde HTML terecht.
 */

import ruweWedstrijden from '../data/wedstrijden.json';
import ruweTeams from '../data/teams.json';
import ruweStanden from '../data/standen.json';
import ruweVerjaardagen from '../data/verjaardagen.json';
import type {
  Wedstrijd,
  Team,
  Poulestand,
  Verjaardag,
  Speler,
  Competitie,
  TeamCategorie,
} from './types';

/** Naam van de vereniging zoals Sportlink hem gebruikt in teamnamen. */
export const CLUB = "Kwiek '78";

/** KNVB-clubcode van v.v. Kwiek '78. Nodig bij de Sportlink-aanvraag. */
export const CLUBCODE = 'BBKY84H';

const wedstrijden = ruweWedstrijden as Wedstrijd[];
const teams = ruweTeams as Team[];
const standen = ruweStanden as Poulestand[];
const verjaardagen = ruweVerjaardagen as Verjaardag[];

/* ==========================================================================
   Hulpfuncties
   ========================================================================== */

const opDatum = (a: Wedstrijd, b: Wedstrijd) =>
  new Date(a.datum).getTime() - new Date(b.datum).getTime();

/** Een wedstrijd is gespeeld zodra er een uitslag bij staat. */
const isGespeeld = (w: Wedstrijd) => w.uitslag !== undefined;

/**
 * Hoort deze wedstrijd bij dit team? Sportlink levert geen team-id mee in het
 * wedstrijdprogramma, alleen de teamnaam. We koppelen daarom op naam, precies
 * zoals je dat tegen de echte API ook zou doen.
 */
export function isVanTeam(wedstrijd: Wedstrijd, team: Team): boolean {
  return wedstrijd.thuisteam === team.naam || wedstrijd.uitteam === team.naam;
}

/** Speelt Kwiek deze wedstrijd thuis? */
export function isThuiswedstrijd(wedstrijd: Wedstrijd): boolean {
  return wedstrijd.thuisteam.startsWith(CLUB);
}

/** De tegenstander, gezien vanuit Kwiek. */
export function tegenstander(wedstrijd: Wedstrijd): string {
  return isThuiswedstrijd(wedstrijd) ? wedstrijd.uitteam : wedstrijd.thuisteam;
}

/* ==========================================================================
   Wedstrijden
   ========================================================================== */

/**
 * Het volledige programma: wedstrijden die nog gespeeld moeten worden,
 * chronologisch, afgelaste wedstrijden inbegrepen.
 *
 * Sportlink-artikel: `wedstrijdprogramma`
 * Relevante velden: wedstrijdcode, wedstrijddatum, aanvangstijd, thuisteam,
 * uitteam, thuisteamlogo, uitteamlogo, accommodatie, veld, competitiesoort.
 */
export function getProgramma(): Wedstrijd[] {
  return wedstrijden.filter((w) => !isGespeeld(w)).sort(opDatum);
}

/**
 * Gespeelde wedstrijden, nieuwste eerst.
 *
 * Sportlink-artikel: `uitslagen`
 * Sportlink levert de score in twee losse velden aan (thuisteamdoelpunten en
 * uitteamdoelpunten). Die worden hier samengevouwen tot `uitslag`.
 */
export function getUitslagen(): Wedstrijd[] {
  return wedstrijden.filter(isGespeeld).sort((a, b) => opDatum(b, a));
}

/**
 * Alles bij elkaar, chronologisch. Handig voor de weekendpagina en voor de
 * teampagina's, waar programma en uitslagen naast elkaar staan.
 *
 * Sportlink-artikelen: `wedstrijdprogramma` en `uitslagen`
 */
export function getAlleWedstrijden(): Wedstrijd[] {
  return [...wedstrijden].sort(opDatum);
}

/**
 * Een enkele wedstrijd op wedstrijdcode. Voedt /wedstrijd/[wedstrijdcode].
 *
 * Sportlink-artikel: `wedstrijdprogramma` (filteren op wedstrijdcode)
 */
export function getWedstrijd(wedstrijdcode: string): Wedstrijd | undefined {
  return wedstrijden.find((w) => w.wedstrijdcode === wedstrijdcode);
}

/**
 * De eerstvolgende nog te spelen wedstrijd, eventueel van een specifiek team.
 * Afgelaste wedstrijden tellen niet mee: daar hoef je niet naartoe.
 *
 * De homepage vraagt hier het eerste elftal op. Wil je liever de eerste
 * wedstrijd van de hele club, roep hem dan zonder argument aan.
 *
 * Sportlink-artikel: `wedstrijdprogramma`
 */
export function getEerstvolgendeWedstrijd(teamId?: string): Wedstrijd | undefined {
  return getEerstvolgendeWedstrijden(teamId, 1)[0];
}

/**
 * De eerstvolgende `aantal` wedstrijden. De countdown op de homepage krijgt er
 * een paar mee, zodat de teller ook nog klopt als de site een tijdje niet
 * opnieuw is gebouwd en de eerste wedstrijd inmiddels gespeeld is.
 *
 * Sportlink-artikel: `wedstrijdprogramma`
 */
export function getEerstvolgendeWedstrijden(teamId?: string, aantal = 4): Wedstrijd[] {
  const team = teamId ? getTeam(teamId) : undefined;
  const nu = Date.now();
  return wedstrijden
    .filter((w) => !isGespeeld(w) && !w.afgelast)
    .filter((w) => new Date(w.datum).getTime() > nu)
    .filter((w) => (team ? isVanTeam(w, team) : true))
    .sort(opDatum)
    .slice(0, aantal);
}

/**
 * Alle wedstrijden van een team, chronologisch.
 *
 * Sportlink-artikelen: `wedstrijdprogramma` en `uitslagen`
 */
export function getWedstrijdenVoorTeam(teamId: string): Wedstrijd[] {
  const team = getTeam(teamId);
  if (!team) return [];
  return wedstrijden.filter((w) => isVanTeam(w, team)).sort(opDatum);
}

/** Alle teamnamen die in het programma voorkomen, voor de filters. */
export function getWedstrijdTeams(): string[] {
  const namen = new Set<string>();
  for (const w of wedstrijden) {
    if (w.thuisteam.startsWith(CLUB)) namen.add(w.thuisteam);
    if (w.uitteam.startsWith(CLUB)) namen.add(w.uitteam);
  }
  return [...namen].sort(vergelijkTeamnaam);
}

/* --------------------------------------------------------------------------
   Teams indelen voor de filters
   --------------------------------------------------------------------------
   Een club van deze omvang heeft al gauw twintig teams, en een rij van twintig
   knoppen achter elkaar is geen filter meer maar een muur. De indeling
   hieronder groepeert ze zoals de club er zelf over praat.

   De indeling komt uit de teamcode achter de clubnaam en niet uit teams.json,
   want in het wedstrijdprogramma staan alleen namen. Dat is ook precies wat
   Sportlink teruggeeft, dus deze regels blijven kloppen als de echte bron
   wordt aangesloten en er ineens veel meer teams in staan.

     1, 2, 3       senioren
     VR1, VR2      vrouwen (senioren)
     JO17-1, MO9-1 jeugd, jongens en meisjes
     35+, 7x7      overig
   -------------------------------------------------------------------------- */

export type Teamgroep = 'Senioren' | 'Vrouwen' | 'Jeugd' | 'Overig';

/** De volgorde waarin de groepen in een filter staan. */
export const TEAMGROEPEN: Teamgroep[] = ['Senioren', 'Vrouwen', 'Jeugd', 'Overig'];

/** De teamcode zonder clubnaam: "Kwiek '78 JO17-1" wordt "JO17-1". */
function teamcode(naam: string): string {
  return naam.startsWith(CLUB) ? naam.slice(CLUB.length).trim() : naam.trim();
}

/** In welke groep hoort dit team thuis? */
export function getTeamgroep(naam: string): Teamgroep {
  const code = teamcode(naam).toUpperCase();
  if (/^VR\s*\d/.test(code)) return 'Vrouwen';
  if (/^(JO|MO|JM)\s*\d/.test(code)) return 'Jeugd';
  if (/^\d+$/.test(code)) return 'Senioren';
  return 'Overig';
}

/**
 * Teams op de volgorde waarin een mens ze verwacht: eerst de groep, dan het
 * getal in de code. Zonder dat laatste komt team 10 tussen 1 en 2 te staan en
 * staat JO17 voor JO9.
 */
export function vergelijkTeamnaam(a: string, b: string): number {
  const groepA = TEAMGROEPEN.indexOf(getTeamgroep(a));
  const groepB = TEAMGROEPEN.indexOf(getTeamgroep(b));
  if (groepA !== groepB) return groepA - groepB;

  const codeA = teamcode(a);
  const codeB = teamcode(b);
  const getallen = (code: string) => (code.match(/\d+/g) ?? []).map(Number);
  const letters = (code: string) => code.replace(/[\d\s-]/g, '').toUpperCase();

  // Binnen de jeugd eerst op categorie (JO voor MO), dan op leeftijd.
  if (letters(codeA) !== letters(codeB)) return letters(codeA).localeCompare(letters(codeB));

  const cijfersA = getallen(codeA);
  const cijfersB = getallen(codeB);
  for (let i = 0; i < Math.max(cijfersA.length, cijfersB.length); i++) {
    const verschil = (cijfersA[i] ?? 0) - (cijfersB[i] ?? 0);
    if (verschil !== 0) return verschil;
  }
  return codeA.localeCompare(codeB);
}

/**
 * De teams uit het programma, ingedeeld in groepen. Lege groepen vallen weg,
 * en is er maar een groep, dan geeft deze functie hem toch terug: de
 * filterbalk beslist zelf of hij de kopjes dan nog laat zien.
 */
export function getWedstrijdTeamsPerGroep(): { groep: Teamgroep; teams: string[] }[] {
  const namen = getWedstrijdTeams();
  return TEAMGROEPEN
    .map((groep) => ({ groep, teams: namen.filter((naam) => getTeamgroep(naam) === groep) }))
    .filter((rij) => rij.teams.length > 0);
}

/** Alle competitiesoorten die in de data voorkomen, voor de filters. */
export function getCompetitieSoorten(): Competitie[] {
  return [...new Set(wedstrijden.map((w) => w.competitie))];
}

/* ==========================================================================
   Teams
   ========================================================================== */

/**
 * De teams die op de site staan. Voor de demo zijn dat er zes; in productie
 * komt deze lijst uit Sportlink en filteren we op de teams die de club op de
 * site wil tonen.
 *
 * Sportlink-artikel: `clubteams`
 */
export function getTeams(): Team[] {
  return teams.map(pasPrivacyToeOpTeam);
}

/**
 * Een enkel team op id (de slug uit de URL).
 *
 * Sportlink-artikel: `clubteams` (filteren op teamcode)
 */
export function getTeam(id: string): Team | undefined {
  const team = teams.find((t) => t.id === id);
  return team ? pasPrivacyToeOpTeam(team) : undefined;
}

/** Teams gegroepeerd per categorie, voor het menu en de teamoverzichtspagina. */
export function getTeamsPerCategorie(): { categorie: TeamCategorie; label: string; teams: Team[] }[] {
  const labels: Record<TeamCategorie, string> = {
    selectie: 'Selectie',
    jeugd: 'Jeugd',
    dames: 'Dames',
  };
  const volgorde: TeamCategorie[] = ['selectie', 'jeugd', 'dames'];
  return volgorde.map((categorie) => ({
    categorie,
    label: labels[categorie],
    teams: getTeams().filter((t) => t.categorie === categorie),
  }));
}

/* ==========================================================================
   AVG
   ========================================================================== */

/**
 * Zet een spelersnaam om naar de vorm die op de site mag staan.
 *
 * Regel: bij jeugdteams tonen we nooit de volledige achternaam. Voornaam plus
 * de eerste letter van de achternaam is genoeg om je kind te herkennen en
 * verder niets.
 *
 * BELANGRIJK VOOR DE KOPPELING. Sportlink houdt per lid een `privacyniveau`
 * bij dat het lid (of de ouder) zelf instelt in de KNVB-app:
 *
 *   0  volledig zichtbaar
 *   1  beperkt zichtbaar    -> voornaam plus eerste letter achternaam
 *   2  afgeschermd          -> helemaal niet tonen
 *
 * Die instelling moet leidend zijn zodra de koppeling live gaat. Voor de
 * jeugd zetten we daar bovenop een harde ondergrens: ook als een jeugdlid op
 * niveau 0 staat, tonen we de achternaam niet. Dat is een keuze van de club
 * en niet van Sportlink, en hij hoort hier te blijven staan.
 */
export function toonNaam(speler: Speler, isJeugd: boolean): string | null {
  if (speler.privacyniveau === 2) return null;

  const volledig = [speler.voornaam, speler.tussenvoegsel, speler.achternaam]
    .filter(Boolean)
    .join(' ');

  const beperkt = `${speler.voornaam} ${speler.achternaam.charAt(0)}.`;

  if (isJeugd) return beperkt;
  return speler.privacyniveau === 1 ? beperkt : volledig;
}

/** Zelfde regel, maar dan voor een jarig lid. */
export function toonNaamVerjaardag(lid: Verjaardag): string | null {
  if (lid.privacyniveau === 2) return null;
  if (lid.privacyniveau === 1) return `${lid.voornaam} ${lid.achternaam.charAt(0)}.`;
  return [lid.voornaam, lid.tussenvoegsel, lid.achternaam].filter(Boolean).join(' ');
}

/**
 * Haalt afgeschermde leden uit de selectie. Dit gebeurt in de adapter en niet
 * in een component, zodat een afgeschermd lid nergens per ongeluk toch in de
 * HTML belandt.
 */
function pasPrivacyToeOpTeam(team: Team): Team {
  return {
    ...team,
    spelers: team.spelers.filter((s) => s.privacyniveau !== 2),
  };
}

/**
 * Hoeveel leden van dit team zijn afgeschermd? Die tellen we wel, want een
 * selectie van veertien spelers waar er vijftien in zitten roept vragen op.
 */
export function aantalAfgeschermd(teamId: string): number {
  const ruw = teams.find((t) => t.id === teamId);
  return ruw ? ruw.spelers.filter((s) => s.privacyniveau === 2).length : 0;
}

/* ==========================================================================
   Standen
   ========================================================================== */

/**
 * De poulestand van een team. Geeft null terug wanneer de KNVB voor die
 * categorie geen stand publiceert; dat is het geval voor alle pupillen onder
 * JO12, dus ook voor onze MO9-1.
 *
 * Sportlink-artikel: `poulestand`
 * Relevante velden: positie, teamnaam, gespeeldewedstrijden, winst, gelijk,
 * verlies, punten, doelpuntenvoor, doelpuntentegen.
 */
export function getPoulestand(teamId: string): Poulestand | null {
  const team = getTeam(teamId);
  if (!team) return null;
  return standen.find((s) => s.pouleId === team.pouleId) ?? null;
}

/** Alle standen van de teams die op de site staan, in menuvolgorde. */
export function getAllePoulestanden(): { team: Team; stand: Poulestand | null }[] {
  return getTeams().map((team) => ({ team, stand: getPoulestand(team.id) }));
}

/* ==========================================================================
   Verjaardagen
   ========================================================================== */

/**
 * Alle jarige leden, gesorteerd op maand en dag. Zonder geboortejaar: dag en
 * maand volstaan voor een felicitatie en schelen een herleidbaar gegeven.
 *
 * Sportlink-artikel: `verjaardagen`
 * Relevante velden: relatiecode, voornaam, tussenvoegsel, achternaam,
 * geboortedatum (waarvan we alleen dag en maand overnemen), privacyniveau.
 */
export function getVerjaardagen(): Verjaardag[] {
  return verjaardagen.filter((lid) => lid.privacyniveau !== 2);
}

/**
 * De jarigen in een venster van zeven dagen vanaf `vanaf`.
 * Loopt netjes over de jaarwisseling heen.
 *
 * Sportlink-artikel: `verjaardagen`
 */
export function getVerjaardagenDezeWeek(vanaf: Date = new Date()): Verjaardag[] {
  const dagen: string[] = [];
  for (let i = 0; i < 7; i++) {
    const dag = new Date(vanaf.getFullYear(), vanaf.getMonth(), vanaf.getDate() + i);
    dagen.push(`${dag.getMonth() + 1}-${dag.getDate()}`);
  }
  const volgorde = new Map(dagen.map((sleutel, i) => [sleutel, i]));

  return getVerjaardagen()
    .filter((lid) => volgorde.has(`${lid.maand}-${lid.dag}`))
    .sort((a, b) =>
      volgorde.get(`${a.maand}-${a.dag}`)! - volgorde.get(`${b.maand}-${b.dag}`)! ||
      a.voornaam.localeCompare(b.voornaam));
}

/** De jarigen van een maand (1 tot 12), voor de verjaardagskalender. */
export function getVerjaardagenPerMaand(maand: number): Verjaardag[] {
  return getVerjaardagen()
    .filter((lid) => lid.maand === maand)
    .sort((a, b) => a.dag - b.dag || a.voornaam.localeCompare(b.voornaam));
}

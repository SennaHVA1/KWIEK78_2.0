/**
 * ============================================================================
 *  SPORTLINK-ADAPTER
 * ============================================================================
 *
 * Dit is de enige plek waar wedstrijd-, team-, stand- en ledendata vandaan
 * komt. Geen enkele pagina importeert rechtstreeks een JSON-bestand.
 *
 * Er zijn twee bronnen, en de pagina's merken daar niets van:
 *
 *   SPORTLINK  /src/data/sportlink/*.json, geschreven door
 *              scripts/sportlink-ophalen.mjs. Dat script draait vlak voor
 *              elke `npm run build` en haalt alles op bij
 *              https://data.sportlink.com met SPORTLINK_CLIENT_ID.
 *   DEMO       /src/data/*.json. Alleen als er (nog) geen Sportlink-data is,
 *              bijvoorbeeld omdat het client_id niet is ingesteld.
 *
 * Het ophalen gebeurt bij de build en niet in de browser van de bezoeker,
 * dus het client_id komt nooit in de uitgeleverde HTML terecht. Wel moet de
 * site opnieuw gebouwd worden om bij te blijven; zie README.
 *
 * Het script zet de Sportlink-velden om naar de typen in types.ts. Boven elke
 * functie hieronder staat uit welk Sportlink-artikel de data komt.
 */

import ruweWedstrijden from '../data/wedstrijden.json';
import ruweTeams from '../data/teams.json';
import ruweStanden from '../data/standen.json';
import ruweVerjaardagen from '../data/verjaardagen.json';
import ruweTeaminfo from '../data/teaminfo.json';
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

/** KNVB-clubcode van v.v. Kwiek '78, zoals Sportlink hem teruggeeft. */
export const CLUBCODE = 'BBFW592';

/* Bestaat de map src/data/sportlink niet, dan geeft deze glob een leeg object
   en valt elke bron terug op de demodata. */
const uitSportlink = import.meta.glob<{ default: unknown }>('../data/sportlink/*.json', { eager: true });
function bron<T>(naam: string, demo: T): T {
  const live = uitSportlink[`../data/sportlink/${naam}.json`];
  return live ? (live.default as T) : demo;
}

/** Draait de site op echte Sportlink-data, of nog op de demodata? */
export const IS_SPORTLINK = Object.keys(uitSportlink).length > 0;

/* Pupillen O8 tot en met O10 spelen zonder uitslagen en standen. Van hen
   houden we alleen het programma over: een pupillenwedstrijd met een score,
   of een van voor vandaag, valt weg. Zo komt er nooit een uitslag van de
   jongste jeugd op de site, ook niet als Sportlink er toch een meestuurt. */
const vandaag = new Date().toISOString().slice(0, 10);
const wedstrijden = bron('wedstrijden', ruweWedstrijden as Wedstrijd[])
  .filter((w) => !isPupillenwedstrijd(w) || (w.uitslag === undefined && w.datum.slice(0, 10) >= vandaag));
const teams = bron('teams', ruweTeams as Team[]);
const standen = bron('standen', ruweStanden as Poulestand[]);
const verjaardagen = bron('verjaardagen', ruweVerjaardagen as Verjaardag[]);
const teaminfo = ruweTeaminfo as Record<string, Partial<Pick<Team, 'fotobijschrift' | 'omschrijving' | 'trainingen'>>>;

/* ==========================================================================
   Hulpfuncties
   ========================================================================== */

const opDatum = (a: Wedstrijd, b: Wedstrijd) =>
  new Date(a.datum).getTime() - new Date(b.datum).getTime();

/** Een wedstrijd is gespeeld zodra er een uitslag bij staat. */
const isGespeeld = (w: Wedstrijd) => w.uitslag !== undefined;

/**
 * Hoort deze wedstrijd bij dit team? Bij Sportlink-data op teamcode: het
 * futsalteam en het veldteam heten allebei "Kwiek '78 1", dus op naam gaat
 * dat mis. De demodata heeft geen teamcodes en koppelt op naam.
 */
export function isVanTeam(wedstrijd: Wedstrijd, team: Team): boolean {
  if (team.teamcode && wedstrijd.thuisteamId) {
    return wedstrijd.thuisteamId === team.teamcode || wedstrijd.uitteamId === team.teamcode;
  }
  return wedstrijd.thuisteam === team.naam || wedstrijd.uitteam === team.naam;
}

/**
 * Speelt dit team bij de pupillen van O8 tot en met O10 (ook MO en JO)? Daar
 * houdt de KNVB geen uitslagen en standen bij: het gaat om spelplezier.
 */
export function isPupillenteam(naam: string): boolean {
  return /^(JO|MO|JM|O)\s*(7|8|9|10)\b/.test(teamcode(naam).toUpperCase());
}

/** Speelt een pupillenteam van Kwiek in deze wedstrijd? */
export function isPupillenwedstrijd(wedstrijd: Wedstrijd): boolean {
  return [wedstrijd.thuisteam, wedstrijd.uitteam].some((naam) => naam.startsWith(CLUB) && isPupillenteam(naam));
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
     O17-1, MO9-1  jeugd, jongens en meisjes (ook het oude JO17-1)
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
  if (/^(JO|MO|JM|O)\s*\d/.test(code)) return 'Jeugd';
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
 * De teams die op de site staan: alle veldteams uit een bondscompetitie.
 * Futsal en lokale teams laat het ophaalscript weg; hun wedstrijden staan
 * wel in het programma.
 *
 * Sportlink-artikelen: `teams` en `team-indeling`
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
    selectie: 'Senioren',
    jeugd: 'Jeugd',
    dames: 'Dames',
  };
  const volgorde: TeamCategorie[] = ['selectie', 'dames', 'jeugd'];
  return volgorde
    .map((categorie) => ({
      categorie,
      label: labels[categorie],
      teams: getTeams().filter((t) => t.categorie === categorie),
    }))
    .filter((groep) => groep.teams.length > 0);
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
  /* Wat Sportlink niet kent, zoals trainingstijden, houdt de club bij in
     src/data/teaminfo.json. Een ingevuld veld daar gaat voor. */
  const info = teaminfo[team.id];
  return {
    ...team,
    /* De teamfoto heet altijd naar het team-id; zie IMAGES.md. */
    teamfoto: team.teamfoto ?? `/images/teams/${team.id}.webp`,
    fotobijschrift: info?.fotobijschrift || team.fotobijschrift,
    omschrijving: info?.omschrijving || team.omschrijving,
    trainingen: info?.trainingen?.length ? info.trainingen : team.trainingen,
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
 * categorie geen stand publiceert. Voor de pupillen O8 tot en met O10 geven
 * we altijd null, ook als Sportlink toch iets meestuurt.
 *
 * Sportlink-artikel: `poulestand`
 * Relevante velden: positie, teamnaam, gespeeldewedstrijden, winst, gelijk,
 * verlies, punten, doelpuntenvoor, doelpuntentegen.
 */
export function getPoulestand(teamId: string): Poulestand | null {
  const team = getTeam(teamId);
  if (!team || isPupillenteam(team.naam)) return null;
  return standen.find((s) => s.pouleId === team.pouleId) ?? null;
}

/** Alle standen van de teams die op de site staan, in menuvolgorde. De
    pupillen O8 tot en met O10 staan er niet tussen: die hebben geen stand. */
export function getAllePoulestanden(): { team: Team; stand: Poulestand | null }[] {
  return getTeams().filter((team) => !isPupillenteam(team.naam)).map((team) => ({ team, stand: getPoulestand(team.id) }));
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
  return getKomendeVerjaardagen(7, vanaf);
}

/**
 * De jarigen in de komende `aantal` dagen, in de volgorde waarin ze jarig
 * zijn. Sportlink levert zelf alleen de komende paar weken aan, dus een
 * kalender voor het hele jaar zit er niet in.
 *
 * Sportlink-artikel: `verjaardagen`
 */
export function getKomendeVerjaardagen(aantal: number, vanaf: Date = new Date()): Verjaardag[] {
  const dagen: string[] = [];
  for (let i = 0; i < aantal; i++) {
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

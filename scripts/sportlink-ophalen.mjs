/**
 * Haalt wedstrijden, teams, standen en verjaardagen op uit Sportlink en zet ze
 * in /src/data/sportlink/*.json, in precies de vorm van src/lib/types.ts.
 *
 * Draaien met: npm run sportlink   (gebeurt ook automatisch bij npm run build)
 *
 * HET CLIENT_ID
 * Komt uit de omgevingsvariabele SPORTLINK_CLIENT_ID. Lokaal staat die in
 * .env, op Cloudflare onder Settings > Variables and Secrets. Is hij niet
 * gezet, dan doet dit script niets en bouwt de site op de demodata.
 *
 * WAAROM NIET IN GIT
 * De map src/data/sportlink staat in .gitignore. De repository is openbaar en
 * hierin staan namen van leden, ook van kinderen. Die horen op de site, waar
 * de AVG-regels uit sportlink.ts eroverheen gaan, en niet in een openbare
 * git-geschiedenis. Om dezelfde reden worden achternamen van jeugdspelers hier
 * al ingekort tot een letter, voordat ze ooit op schijf staan.
 *
 * ALS SPORTLINK NIET ANTWOORDT
 * Op Cloudflare faalt de build dan, zodat de vorige versie van de site blijft
 * staan in plaats van dat er ineens demodata live gaat. Lokaal blijft de
 * vorige ophaalronde staan en gaat de build gewoon door.
 */
import { mkdir, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

try { process.loadEnvFile('.env'); } catch { /* geen .env, prima */ }

const BASIS = 'https://data.sportlink.com';
const CLIENT_ID = process.env.SPORTLINK_CLIENT_ID;
const UIT = 'src/data/sportlink';
const LOGOMAP = 'public/images/clubs/sportlink';

/** Clubcode van Kwiek in Sportlink. Voor het eigen wapen gebruiken we ons eigen bestand. */
const EIGEN_CLUBCODE = 'BBFW592';
const EIGEN_WAPEN = '/images/logos/kwiek-78-wapen.png';

if (!CLIENT_ID) {
  console.warn('SPORTLINK_CLIENT_ID is niet gezet. De site bouwt op de demodata.');
  process.exit(0);
}

/* ==========================================================================
   Ophalen
   ========================================================================== */

async function haal(artikel, parameters = {}) {
  const zoek = new URLSearchParams({ client_id: CLIENT_ID, ...parameters });
  const antwoord = await fetch(`${BASIS}/${artikel}?${zoek}`);
  if (!antwoord.ok) throw new Error(`Sportlink ${artikel}: HTTP ${antwoord.status}`);
  const data = await antwoord.json();
  if (data && data.error) throw new Error(`Sportlink ${artikel}: ${data.error.message}`);
  return data;
}

/** Een paar tegelijk, niet alles in een keer: Sportlink is geen CDN. */
async function perStuk(lijst, doe, tegelijk = 4) {
  const uitkomst = new Array(lijst.length);
  let volgende = 0;
  await Promise.all(Array.from({ length: tegelijk }, async () => {
    while (volgende < lijst.length) {
      const i = volgende++;
      uitkomst[i] = await doe(lijst[i]);
    }
  }));
  return uitkomst;
}

/* ==========================================================================
   Omzetten
   ========================================================================== */

/** Sportlink schrijft "Kwiek 78", de club zelf "Kwiek '78". Dubbele spaties eruit. */
const teamnaam = (naam) =>
  String(naam ?? '').replace(/\s+/g, ' ').trim().replace(/^Kwiek 78\b/, "Kwiek '78");

/** "2026-10-11T10:30:00+0200" wordt "2026-10-11T10:30:00+02:00". */
const isoDatum = (datum) => String(datum).replace(/([+-]\d\d)(\d\d)$/, '$1:$2');

const isJeugdnaam = (naam) => /\b(J|M)?O\d+/.test(naam);

const slug = (naam) =>
  naam.toLowerCase().replace(/'/g, '').replace(/\+/g, 'plus').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function competitieVan(ruw) {
  const tekst = [ruw.locatie, ruw.sportomschrijving, ruw.competitie, ruw.competitienaam].join(' ');
  if (/futsal|zaal/i.test(tekst)) return 'zaal';
  if (ruw.competitiesoort === 'beker') return 'beker';
  if (ruw.competitiesoort === 'regulier') return 'competitie';
  return 'oefen';
}

function uitslagVan(tekst) {
  const m = /^\s*(\d+)\s*-\s*(\d+)\s*$/.exec(tekst ?? '');
  return m ? { thuis: Number(m[1]), uit: Number(m[2]) } : undefined;
}

/* De wapens van Sportlink zijn ondertekende links die na een paar uur
   verlopen. Daarom halen we ze binnen en serveren we ze zelf. */
const logos = new Map();
async function logoVan(clubcode, url) {
  if (clubcode === EIGEN_CLUBCODE) return EIGEN_WAPEN;
  if (!clubcode || !url) return '';
  if (!logos.has(clubcode)) logos.set(clubcode, url);
  return `/images/clubs/sportlink/${clubcode}.png`;
}

async function bewaarLogos() {
  await mkdir(LOGOMAP, { recursive: true });
  const aanwezig = new Set(await readdir(LOGOMAP));
  await perStuk([...logos], async ([clubcode, url]) => {
    const bestand = `${clubcode}.png`;
    if (aanwezig.has(bestand)) return;
    try {
      const antwoord = await fetch(url);
      if (!antwoord.ok) return;
      await writeFile(join(LOGOMAP, bestand), Buffer.from(await antwoord.arrayBuffer()));
    } catch {
      /* Geen wapen is geen ramp: Clubwapen zet er dan initialen neer. */
    }
  });
}

async function naarWedstrijd(ruw) {
  const thuisteam = teamnaam(ruw.thuisteam);
  const uitteam = teamnaam(ruw.uitteam);
  const eigen = thuisteam.startsWith("Kwiek '78") ? thuisteam : uitteam;

  /* Bij jeugdwedstrijden fluit vaak een jeugdlid. Die naam laten we weg. */
  const scheids = ruw.scheidsrechter && ruw.scheidsrechter !== 'Afgeschermd' && !isJeugdnaam(eigen)
    ? [ruw.scheidsrechter]
    : undefined;

  const wedstrijd = {
    wedstrijdcode: String(ruw.wedstrijdcode),
    datum: isoDatum(ruw.wedstrijddatum),
    thuisteam,
    uitteam,
    thuisteamId: String(ruw.thuisteamid),
    uitteamId: String(ruw.uitteamid),
    thuisLogo: await logoVan(ruw.thuisteamclubrelatiecode, ruw.thuisteamlogo),
    uitLogo: await logoVan(ruw.uitteamclubrelatiecode, ruw.uitteamlogo),
    accommodatie: ruw.accommodatie ?? '',
    competitie: competitieVan(ruw),
  };
  if (ruw.veld) wedstrijd.veld = ruw.veld;
  if (scheids) wedstrijd.scheidsrechters = scheids;
  const uitslag = uitslagVan(ruw.uitslag);
  if (uitslag) wedstrijd.uitslag = uitslag;
  if (ruw.status === 'Afgelast') wedstrijd.afgelast = true;
  return wedstrijd;
}

/** Het seizoen begint op 1 juli. Zoveel weken terug halen we uitslagen op. */
function wekenSindsSeizoensstart(nu = new Date()) {
  const jaar = nu.getMonth() >= 6 ? nu.getFullYear() : nu.getFullYear() - 1;
  const start = new Date(jaar, 6, 1);
  return Math.ceil((nu - start) / (7 * 24 * 3600 * 1000));
}

/* ==========================================================================
   Wedstrijden
   ========================================================================== */

async function wedstrijden() {
  const vast = { eigenwedstrijden: 'JA', gebruiklokaleteamgegevens: 'NEE', aantalregels: '1000' };
  const weken = wekenSindsSeizoensstart();
  const [programma, uitslagen, afgelastingen] = await Promise.all([
    haal('programma', { ...vast, aantaldagen: '365' }),
    haal('uitslagen', { ...vast, weekoffset: String(-weken), aantaldagen: String(weken * 7 + 7) }),
    haal('afgelastingen', vast),
  ]);

  const vandaag = new Date();
  vandaag.setHours(0, 0, 0, 0);
  const nogNietVoorbij = (ruw) => new Date(isoDatum(ruw.wedstrijddatum)) >= vandaag;

  /* Volgorde telt: een uitslag wint van het programma, een afgelasting ook. */
  const opCode = new Map();
  for (const ruw of programma) opCode.set(ruw.wedstrijdcode, await naarWedstrijd(ruw));
  for (const ruw of afgelastingen.filter(nogNietVoorbij)) {
    const bestaand = opCode.get(ruw.wedstrijdcode);
    if (bestaand) bestaand.afgelast = true;
    else opCode.set(ruw.wedstrijdcode, await naarWedstrijd({ ...ruw, status: 'Afgelast' }));
  }
  /* Uitslagen zonder score (gestaakt, afgelast in het verleden) laten we weg. */
  for (const ruw of uitslagen.filter((r) => uitslagVan(r.uitslag))) {
    opCode.set(ruw.wedstrijdcode, await naarWedstrijd(ruw));
  }
  return [...opCode.values()].sort((a, b) => new Date(a.datum) - new Date(b.datum));
}

/* ==========================================================================
   Teams en standen
   ========================================================================== */

/**
 * De veld- en zaalteams die in een bondscompetitie spelen. Lokale teams
 * vallen weg; hun wedstrijden staan wel gewoon in het programma.
 */
function siteteams(ruweTeams) {
  const opCode = new Map();
  for (const t of ruweTeams) {
    if (t.teamsoort !== 'bond' || !['VE', 'ZA'].includes(t.kalespelsoort)) continue;
    if (t.competitiesoort !== 'regulier' || !t.poulecode) continue;
    /* Bij meerdere fases in een seizoen is de hoogste poulecode de nieuwste. */
    const bestaand = opCode.get(t.teamcode);
    if (!bestaand || t.poulecode > bestaand.poulecode) opCode.set(t.teamcode, t);
  }
  return [...opCode.values()];
}

function categorieVan(t, naam) {
  if (t.kalespelsoort === 'ZA') return 'zaal';
  /* Ook de meidenteams: een ouder van een MO9-speelster zoekt bij de jeugd. */
  if (t.leeftijdscategorie?.startsWith('Onder')) return 'jeugd';
  if (/vrouw/i.test(t.leeftijdscategorie ?? '') || /\bVR\d/.test(naam)) return 'dames';
  return 'selectie';
}

const isAfgeschermd = (lid) => lid.naam === 'Afgeschermd' || !lid.relatiecode;

const volledigeNaam = (lid) => [lid.voornaam, lid.tussenvoegsel, lid.achternaam].filter(Boolean).join(' ');

/* Volledige naam van elk jeugdlid, met de verkorte vorm en het team. De
   verjaardagenlijst van Sportlink zegt niet wie jeugdlid is; hiermee kunnen
   we ook daar de achternaam inkorten. */
const jeugdleden = new Map();

function naarTeam(t, indeling) {
  const isZaal = t.kalespelsoort === 'ZA';
  /* Het zaalteam heet in Sportlink net als het veldteam ("Kwiek 78 1"). Op de
     site zetten we er Zaal tussen; de wedstrijden koppelen op teamcode, dus
     de naam hoeft niet gelijk te zijn aan die in het programma. */
  const naam = isZaal
    ? teamnaam(t.teamnaam).replace("Kwiek '78", "Kwiek '78 Zaal")
    : teamnaam(t.teamnaam);
  const code = naam.replace("Kwiek '78", '').trim();
  const isJeugd = Boolean(t.leeftijdscategorie?.startsWith('Onder'));
  const speeldagtekst = `${t.speeldag} ${t.spelsoort} ${t.speeldagteam}`;
  const speeldag = /vrijdag/i.test(speeldagtekst) ? 'vrijdag' : /zondag/i.test(speeldagtekst) ? 'zondag' : 'zaterdag';

  const spelers = indeling
    .filter((lid) => lid.rol === 'Teamspeler')
    .map((lid, i) => {
      if (isAfgeschermd(lid)) {
        return { relatiecode: `${t.teamcode}-${i}`, voornaam: '', achternaam: '', privacyniveau: 2 };
      }
      if (isJeugd) {
        jeugdleden.set(volledigeNaam(lid), { voornaam: lid.voornaam, achternaam: lid.achternaam.charAt(0), team: code });
        /* Alleen de eerste letter bewaren; meer laat de site toch niet zien. */
        return { relatiecode: `${t.teamcode}-${i}`, voornaam: lid.voornaam, achternaam: lid.achternaam.charAt(0), privacyniveau: 1 };
      }
      const speler = { relatiecode: `${t.teamcode}-${i}`, voornaam: lid.voornaam, achternaam: lid.achternaam, privacyniveau: 0 };
      if (lid.tussenvoegsel) speler.tussenvoegsel = lid.tussenvoegsel;
      return speler;
    })
    .sort((a, b) => a.voornaam.localeCompare(b.voornaam));

  const staf = indeling
    .filter((lid) => lid.rol !== 'Teamspeler' && !isAfgeschermd(lid))
    .map((lid) => ({
      naam: volledigeNaam(lid),
      functie: lid.functie || lid.rol,
    }));

  return {
    id: slug(naam),
    teamcode: String(t.teamcode),
    naam,
    korteNaam: /^\d+$/.test(code) ? naam : code,
    categorie: categorieVan(t, naam),
    pouleId: String(t.poulecode),
    pouleNaam: t.klassepoule ?? t.competitienaam ?? '',
    speeldag,
    isJeugd,
    staf,
    trainingen: [],
    spelers,
  };
}

async function teamsEnStanden() {
  const ruweTeams = siteteams(await haal('teams'));
  const vandaag = new Date().toISOString().slice(0, 10);

  const resultaat = await perStuk(ruweTeams, async (t) => {
    const [indeling, stand] = await Promise.all([
      haal('team-indeling', { teamcode: String(t.teamcode), lokaleteamcode: String(t.lokaleteamcode) }),
      haal('poulestand', { poulecode: String(t.poulecode) }),
    ]);
    const team = naarTeam(t, indeling);
    const poulestand = Array.isArray(stand) && stand.length > 0
      ? {
          pouleId: team.pouleId,
          pouleNaam: team.pouleNaam,
          bijgewerkt: vandaag,
          regels: stand.map((r) => ({
            positie: r.positie,
            team: teamnaam(r.teamnaam),
            gespeeld: r.gespeeldewedstrijden,
            gewonnen: r.gewonnen,
            gelijk: r.gelijk,
            verloren: r.verloren,
            punten: r.punten,
            doelpuntenVoor: r.doelpuntenvoor,
            doelpuntenTegen: r.doelpuntentegen,
          })),
        }
      : null;
    return { team, poulestand };
  });

  return {
    teams: resultaat.map((r) => r.team),
    standen: resultaat.map((r) => r.poulestand).filter(Boolean),
  };
}

/* ==========================================================================
   Verjaardagen
   ========================================================================== */

const MAANDEN = {
  jan: 1, feb: 2, mar: 3, mrt: 3, apr: 4, may: 5, mei: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, okt: 10, nov: 11, dec: 12,
};

/**
 * Sportlink geeft alleen de jarigen van de komende weken, en alleen leden die
 * dat in hun privacyinstellingen toestaan. Een naam komt als een geheel; we
 * splitsen hem niet, want "Dirk Jan van der Berg" valt niet foutloos op te
 * delen. Staat iemand in een jeugdselectie, dan nemen we de verkorte naam en
 * het team over uit de teamindeling. Draai dit dus na teamsEnStanden().
 */
function verjaardagen(ruw) {
  return ruw
    .map((lid, i) => {
      const [dag, maand] = String(lid.verjaardag).trim().split(/\s+/);
      const naam = String(lid.volledigenaam ?? '').replace(/\s+/g, ' ').trim();
      const jeugd = jeugdleden.get(naam);
      return {
        relatiecode: `verjaardag-${i}`,
        ...(jeugd
          ? { voornaam: jeugd.voornaam, achternaam: jeugd.achternaam, team: jeugd.team, privacyniveau: 1 }
          : { voornaam: naam, achternaam: '', privacyniveau: 0 }),
        dag: Number(dag),
        maand: MAANDEN[maand?.slice(0, 3).toLowerCase()],
      };
    })
    .filter((lid) => lid.voornaam && lid.dag && lid.maand);
}

/* ==========================================================================
   Alles bij elkaar
   ========================================================================== */

try {
  const [alleWedstrijden, { teams, standen }, ruweJarigen] = await Promise.all([
    wedstrijden(),
    teamsEnStanden(),
    haal('verjaardagen'),
  ]);
  const jarigen = verjaardagen(ruweJarigen);
  await bewaarLogos();

  await mkdir(UIT, { recursive: true });
  const schrijf = (naam, data) => writeFile(join(UIT, `${naam}.json`), JSON.stringify(data, null, 2) + '\n');
  await Promise.all([
    schrijf('wedstrijden', alleWedstrijden),
    schrijf('teams', teams),
    schrijf('standen', standen),
    schrijf('verjaardagen', jarigen),
  ]);

  console.log(
    `Sportlink: ${alleWedstrijden.length} wedstrijden, ${teams.length} teams, ` +
    `${standen.length} standen, ${jarigen.length} jarigen, ${logos.size} clubwapens.`,
  );
} catch (fout) {
  console.error(`Sportlink ophalen mislukt: ${fout.message}`);
  if (process.env.CF_PAGES || process.env.CI) process.exit(1);
  console.warn('De vorige ophaalronde (of de demodata) blijft staan.');
}

/**
 * Haalt de laatste berichten van de Facebookpagina van de club op en zet ze in
 * /src/data/facebook/nieuws.json, met de foto's in /public/images/nieuws/facebook.
 * De evenementen van de pagina gaan naar /src/data/facebook/agenda.json; dat
 * is de clubagenda op de site.
 *
 * Draaien met: npm run facebook   (gebeurt ook automatisch bij npm run build)
 *
 * HET TOKEN
 * Komt uit FB_PAGE_ID en FB_PAGE_TOKEN. Lokaal staan die in .env, op
 * Cloudflare onder Settings > Variables and Secrets. Het is een Page Access
 * Token dat niet verloopt: afgeleid van een verlengd gebruikerstoken van een
 * beheerder van de pagina, met pages_read_engagement en
 * pages_read_user_content. Het stopt pas als die beheerder zijn wachtwoord
 * wijzigt of zijn rol op de pagina kwijtraakt. Controleren kan in de Access
 * Token Debugger op developers.facebook.com.
 *
 * Is er geen token, dan doet dit script niets en bouwt de site op
 * src/data/nieuws.json, de berichten van kwiek78.nl (zie nieuws-ophalen.mjs).
 *
 * ALS FACEBOOK NIET ANTWOORDT
 * Dan faalt de build niet, anders dan bij Sportlink. Een verlopen token zou
 * anders ook de uitslagen en afgelastingen tegenhouden. De site valt dan
 * terug op de vorige ophaalronde, of op nieuws.json als die er niet is.
 *
 * WAAROM DE FOTO'S ERUIT GEDOWNLOAD WORDEN
 * full_picture is een ondertekende url van het Facebook-CDN die na een paar
 * dagen verloopt. Rechtstreeks linken geeft dan na een week kapotte foto's.
 */
import sharp from 'sharp';
import { mkdir, writeFile, stat, readdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';

try { process.loadEnvFile('.env'); } catch { /* geen .env, prima */ }

const VERSIE = 'v26.0';
const PAGINA = process.env.FB_PAGE_ID;
const TOKEN = process.env.FB_PAGE_TOKEN;
/* Alles van het afgelopen jaar, maar niet van voor de start van de site op
   1 september 2026. Wat ouder is valt er bij de volgende build vanzelf af; op
   Facebook zelf blijft het staan. Het maximum is er voor het geval de club
   ineens heel veel post. */
const START = '2026-09-01';
const jaarGeleden = new Date();
jaarGeleden.setFullYear(jaarGeleden.getFullYear() - 1);
const VANAF = [START, jaarGeleden.toISOString().slice(0, 10)].sort().at(-1);
const MAXIMUM = 150;
const UITMAP = 'src/data/facebook';
const BEELDMAP = 'public/images/nieuws/facebook';

/* Langer dan dit en de eerste regel is geen kop meer maar een alinea. */
const MAX_KOP = 90;

if (!PAGINA || !TOKEN) {
  console.warn('FB_PAGE_ID of FB_PAGE_TOKEN is niet gezet. Het nieuws komt uit src/data/nieuws.json.');
  process.exit(0);
}

/**
 * Een Facebookpost heeft geen kop. De adapter in src/lib/nieuws.ts neemt de
 * eerste regel als titel, maar op Facebook is die eerste regel vaak een hele
 * alinea. Dan wordt de eerste zin de kop en schuift de rest naar de body, zodat
 * er geen tekst verloren gaat.
 */
function metKop(tekst) {
  const regels = tekst.trim().split('\n');
  const eerste = regels[0].trim();
  if (eerste.length <= MAX_KOP) return tekst.trim();

  const zin = eerste.match(/^(.{10,}?[.!?])\s+(.+)$/s);
  if (!zin || zin[1].length > MAX_KOP) return tekst.trim();

  return [zin[1], '', zin[2], ...regels.slice(1)].join('\n').trim();
}

/**
 * Geeft het pad en de verhouding (breedte / hoogte) terug. Op Facebook staan
 * veel staande posters en flyers; met de verhouding kan de site die heel laten
 * in plaats van de boven- en onderkant eraf te knippen.
 */
async function bewaarFoto(url, naam) {
  const doel = join(BEELDMAP, `${naam}.webp`);
  const pad = `/images/nieuws/facebook/${naam}.webp`;

  try {
    if (!(await stat(doel).catch(() => null))) {
      const antwoord = await fetch(url);
      if (!antwoord.ok) throw new Error(`HTTP ${antwoord.status}`);
      const bin = Buffer.from(await antwoord.arrayBuffer());
      await sharp(bin).rotate().resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 82 }).toFile(doel);
    }
    const { width, height } = await sharp(doel).metadata();
    return { pad, verhouding: Number((width / height).toFixed(3)) };
  } catch (fout) {
    console.warn(`  foto mislukt voor ${naam}: ${fout.message}`);
    return {};
  }
}

try {
  const zoek = new URLSearchParams({
    fields: 'id,message,created_time,full_picture,permalink_url',
    since: String(Math.floor(new Date(VANAF).getTime() / 1000)),
    limit: '50',
    access_token: TOKEN,
  });

  /* Facebook geeft de posts in pagina's; paging.next wijst naar de volgende. */
  const posts = [];
  let url = `https://graph.facebook.com/${VERSIE}/${PAGINA}/posts?${zoek}`;
  while (url && posts.length < MAXIMUM) {
    const data = await (await fetch(url)).json();
    if (data.error) throw new Error(`${data.error.type} ${data.error.code}: ${data.error.message}`);
    posts.push(...(data.data ?? []).filter((post) => post.created_time >= VANAF));
    url = data.paging?.next;
  }
  console.log(`${posts.length} posts sinds ${VANAF}`);

  await mkdir(UITMAP, { recursive: true });
  await mkdir(BEELDMAP, { recursive: true });

  const berichten = [];
  for (const post of posts.slice(0, MAXIMUM)) {
    /* Posts met alleen een foto en geen tekst hebben geen kop; die vallen af. */
    if (!post.message?.trim()) continue;

    /* Een post-id is "paginaid_postid"; het tweede deel is uniek genoeg. */
    const naam = post.id.split('_').pop();
    const foto = post.full_picture ? await bewaarFoto(post.full_picture, naam) : {};
    berichten.push({
      id: post.id,
      bron: 'facebook',
      created_time: post.created_time,
      full_picture: foto.pad,
      beeldverhouding: foto.verhouding,
      permalink_url: post.permalink_url,
      message: metKop(post.message),
    });
    console.log(`  ${berichten.length}. ${berichten.at(-1).message.split('\n')[0]}`);
  }

  await writeFile(join(UITMAP, 'nieuws.json'), JSON.stringify(berichten, null, 2) + '\n', 'utf8');

  /* Foto's van posts die zijn afgevallen of op Facebook verwijderd. Op
     Cloudflare is de map elke build leeg, lokaal zou hij anders blijven groeien. */
  const inGebruik = new Set(berichten.map((b) => b.full_picture?.split('/').pop()));
  for (const bestand of await readdir(BEELDMAP)) {
    if (!inGebruik.has(bestand)) await unlink(join(BEELDMAP, bestand));
  }
  console.log(`${berichten.length} Facebookberichten weggeschreven naar ${UITMAP}/nieuws.json`);
} catch (fout) {
  console.warn(`Facebook ophalen mislukt, de site bouwt op de vorige berichten: ${fout.message}`);
}

/* ==========================================================================
   Agenda: de evenementen van de pagina
   ========================================================================== */

/* Evenementen vanaf deze datum. Staat nu op 1 januari 2026, zodat het
   veteranenduel tegen Ajax van februari als test in de agenda staat. Bij
   de start van een nieuw seizoen gewoon vooruitzetten. */
const AGENDA_VANAF = '2026-01-01';
const MAX_OMSCHRIJVING = 240;

/** "2026-02-21T17:00:00+0100" wordt "2026-02-21T17:00:00+01:00". */
const isoDatum = (datum) => String(datum).replace(/([+-]\d\d)(\d\d)$/, '$1:$2');

/** De eerste alinea, afgekapt op een woordgrens. */
function omschrijvingVan(tekst = '') {
  const alinea = tekst.trim().split(/\n\s*\n/)[0].replace(/\s+/g, ' ').trim();
  if (alinea.length <= MAX_OMSCHRIJVING) return alinea;
  const kort = alinea.slice(0, MAX_OMSCHRIJVING);
  return kort.slice(0, kort.lastIndexOf(' ')) + '...';
}

try {
  const zoek = new URLSearchParams({
    fields: 'id,name,start_time,end_time,place,description,is_canceled',
    limit: '25',
    access_token: TOKEN,
  });

  /* Facebook geeft de evenementen van nieuw naar oud. Zodra er een van voor
     AGENDA_VANAF langskomt, hoeven we niet verder te bladeren. */
  const evenementen = [];
  let url = `https://graph.facebook.com/${VERSIE}/${PAGINA}/events?${zoek}`;
  while (url) {
    const data = await (await fetch(url)).json();
    if (data.error) throw new Error(`${data.error.type} ${data.error.code}: ${data.error.message}`);
    const pagina = data.data ?? [];
    evenementen.push(...pagina.filter((e) => e.start_time.slice(0, 10) >= AGENDA_VANAF));
    if (pagina.some((e) => e.start_time.slice(0, 10) < AGENDA_VANAF)) break;
    url = data.paging?.next;
  }

  const agenda = evenementen
    .filter((e) => !e.is_canceled)
    .map((e) => ({
      id: e.id,
      datum: isoDatum(e.start_time),
      ...(e.end_time && { eindDatum: isoDatum(e.end_time) }),
      titel: e.name.trim(),
      omschrijving: omschrijvingVan(e.description),
      locatie: e.place?.name?.trim() ?? '',
      categorie: 'club',
      url: `https://www.facebook.com/events/${e.id}`,
    }));

  await mkdir(UITMAP, { recursive: true });
  await writeFile(join(UITMAP, 'agenda.json'), JSON.stringify(agenda, null, 2) + '\n', 'utf8');
  console.log(`${agenda.length} Facebookevenementen sinds ${AGENDA_VANAF} weggeschreven naar ${UITMAP}/agenda.json`);
} catch (fout) {
  console.warn(`Facebookevenementen ophalen mislukt, de agenda blijft zoals hij was: ${fout.message}`);
}

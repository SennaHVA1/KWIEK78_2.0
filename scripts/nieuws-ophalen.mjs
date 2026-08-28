/**
 * Haalt de nieuwsberichten op van de huidige site van de club en zet ze in
 * /src/data/nieuws.json, inclusief de foto's.
 *
 * Draaien met: npm run nieuws
 *
 * WAAROM NIET RECHTSTREEKS VAN FACEBOOK
 * Facebook laat zich niet meer publiek uitlezen. De Graph API geeft zonder
 * token een OAuthException, de pagina zelf stuurt een bezoeker zonder login
 * door naar een inlogscherm en de oude RSS-feeds bestaan niet meer. De enige
 * echte weg daarheen is een Page Access Token, en daarvoor moet de club ons
 * eerst een rol geven op hun Facebookpagina.
 *
 * Maar dat is niet nodig, want dezelfde berichten staan ook op kwiek78.nl en
 * die zijn wel gewoon op te halen. Dat is bovendien de betere bron: het is de
 * plek waar de club het nieuws zelf al redigeert, er zit een echte kop op (op
 * Facebook niet) en er is geen token dat kan verlopen.
 *
 * Dit script schrijft naar hetzelfde formaat als de Facebook Graph API, dus
 * src/lib/nieuws.ts hoeft niet te veranderen als de club later toch voor de
 * Facebook-koppeling kiest. Alleen de aanlevering wisselt dan.
 */
import sharp from 'sharp';
import { mkdir, writeFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

const ARCHIEF = 'https://www.kwiek78.nl/nieuwsarchief';
const AANTAL = 12;
const BEELDMAP = 'public/images/nieuws';
const UIT = 'src/data/nieuws.json';

const haal = async (url) => {
  const antwoord = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Brand-On, nieuwsimport)' } });
  if (!antwoord.ok) throw new Error(`${antwoord.status} bij ${url}`);
  return antwoord.text();
};

/* WordPress schrijft entiteiten weg, ook in gewone lopende tekst. */
const NAMEN = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  eacute: 'e', euml: 'e', uuml: 'u', ouml: 'o', iuml: 'i', hellip: '...',
};
const decodeer = (t) => t
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&([a-z]+);/gi, (heel, naam) => NAMEN[naam.toLowerCase()] ?? heel);

/** HTML uit de body naar platte tekst met lege regels tussen de alinea's. */
function naarTekst(html) {
  return decodeer(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/(div|h[1-6]|li)>/gi, '\n\n')
      .replace(/<li[^>]*>/gi, '- ')
      .replace(/<[^>]+>/g, '')
  )
    .split('\n')
    .map((r) => r.replace(/[ \t\u00a0]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/* De url kan een ge-encodeerde emoji bevatten (RAP Cup 🏆). Die willen we niet
   terugzien in een bestandsnaam. */
const slugVanUrl = (url) =>
  decodeURIComponent(url.replace(/\/+$/, '').split('/').pop())
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/* ---------------------------------------------------------------- ophalen */
console.log(`archief ophalen: ${ARCHIEF}`);
const archief = await haal(ARCHIEF);

const stukken = archief.split('<div class="nxs-blogentry ').slice(1);
console.log(`${stukken.length} berichten in het archief gevonden`);

const berichten = [];

for (const stuk of stukken) {
  if (berichten.length >= AANTAL) break;

  const url = stuk.match(/<a href="(https:\/\/www\.kwiek78\.nl\/[^"]+)"/)?.[1];
  const titel = stuk.match(/<h4 class="nxs-title[^"]*">([\s\S]*?)<\/h4>/)?.[1];
  const beeld = stuk.match(/<img src="([^"]+)"/)?.[1];
  if (!url || !titel) continue;

  const slug = slugVanUrl(url);
  const schoneTitel = decodeer(titel.replace(/<[^>]+>/g, '')).trim();

  /* Het volledige bericht staat op de eigen pagina; in het archief staat maar
     een afgekapte samenvatting met [Lees meer] erachter. */
  const pagina = await haal(url);

  const datum = pagina.match(/<meta property="article:published_time" content="([^"]+)"/)?.[1]
    ?? stuk.match(/^[^>]*date="([^"]+)"/)?.[1]?.replace(' ', 'T');

  const blokken = [...pagina.matchAll(/<div class="nxs-default-p[^"]*"[^>]*>([\s\S]*?)<\/div>/g)]
    .map((m) => naarTekst(m[1]))
    .filter((t) => t.length > 0 && !t.includes('[Lees meer]'));

  const body = blokken.sort((a, b) => b.length - a.length)[0] ?? '';
  if (!body) {
    console.warn(`  geen tekst gevonden, overgeslagen: ${slug}`);
    continue;
  }

  /* Foto erbij. Verkleinen naar 1200 breed, want de originelen zijn wat de
     vrijwilliger toevallig uit zijn telefoon heeft geupload. */
  let fotoPad;
  if (beeld) {
    await mkdir(BEELDMAP, { recursive: true });
    const doel = join(BEELDMAP, `${slug}.webp`);
    if (await stat(doel).catch(() => null)) {
      fotoPad = `/images/nieuws/${slug}.webp`;
    } else {
      try {
        const bin = Buffer.from(await (await fetch(beeld)).arrayBuffer());
        await sharp(bin).rotate().resize({ width: 1200, withoutEnlargement: true })
          .webp({ quality: 82 }).toFile(doel);
        fotoPad = `/images/nieuws/${slug}.webp`;
      } catch (fout) {
        console.warn(`  foto mislukt voor ${slug}: ${fout.message}`);
      }
    }
  }

  berichten.push({
    id: slug,
    bron: 'website',
    created_time: datum,
    full_picture: fotoPad,
    permalink_url: url,
    /* Eerste regel is de titel: precies zoals de adapter een Facebookbericht
       leest, zodat er maar een omzetting bestaat. */
    message: `${schoneTitel}\n\n${body}`,
  });

  console.log(`  ${berichten.length}. ${schoneTitel}  (${body.length} tekens${fotoPad ? ', met foto' : ''})`);
}

await writeFile(UIT, JSON.stringify(berichten, null, 2) + '\n', 'utf8');
console.log(`\n${berichten.length} berichten weggeschreven naar ${UIT}`);

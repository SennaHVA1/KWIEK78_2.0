/**
 * Haalt de laatste berichten van de Facebookpagina van de club op en zet ze in
 * /src/data/facebook/nieuws.json, met de foto's in /public/images/nieuws/facebook.
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
import { mkdir, writeFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

try { process.loadEnvFile('.env'); } catch { /* geen .env, prima */ }

const VERSIE = 'v26.0';
const PAGINA = process.env.FB_PAGE_ID;
const TOKEN = process.env.FB_PAGE_TOKEN;
/* Alles vanaf het begin van het seizoen, met een grens voor het geval de club
   ineens heel veel post. Ouder nieuws staat op Facebook zelf nog. */
const VANAF = '2026-09-01';
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
  console.log(`${berichten.length} Facebookberichten weggeschreven naar ${UITMAP}/nieuws.json`);
} catch (fout) {
  console.warn(`Facebook ophalen mislukt, de site bouwt op de vorige berichten: ${fout.message}`);
}

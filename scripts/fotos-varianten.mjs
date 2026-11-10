/**
 * Maakt kleinere versies van de foto's in /public/images, zodat een telefoon
 * niet steeds de foto van 1800 pixels breed binnenhaalt voor een kaartje van
 * 350 pixels. De Foto-component zet ze in een srcset en de browser kiest zelf.
 *
 * Draaien met: npm run fotos (gebeurt ook bij elke build)
 *
 *   teams/kwiek-78-o9-1.webp  ->  teams/kwiek-78-o9-1-640w.webp
 *                                 teams/kwiek-78-o9-1-1200w.webp
 *
 * Welke versies er zijn, met de breedtes, komt in src/data/fotovarianten.json.
 * Een versie wordt alleen opnieuw gemaakt als de foto zelf nieuwer is.
 *
 * De Facebookfoto's slaan we over: die zijn al klein en facebook-ophalen.mjs
 * ruimt alles in die map op wat het zelf niet kent.
 */
import sharp from 'sharp';
import { readdir, stat, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const MAPPEN = ['public/images/teams', 'public/images/club', 'public/images/nieuws'];
const OVERSLAAN = ['public/images/nieuws/facebook'];
/* 1800 alleen voor de grote homepagefoto, die is 2400 breed. */
const BREEDTES = [640, 1200, 1800];
const VARIANT = /-\d+w\.webp$/;
const UIT = 'src/data/fotovarianten.json';

const tijd = async (p) => (await stat(p).catch(() => null))?.mtimeMs ?? 0;

async function fotosIn(map) {
  if (OVERSLAAN.includes(map.split(sep).join('/'))) return [];
  const items = await readdir(map, { withFileTypes: true }).catch(() => []);
  const lijst = [];
  for (const item of items) {
    const pad = join(map, item.name);
    if (item.isDirectory()) lijst.push(...(await fotosIn(pad)));
    else if (item.name.endsWith('.webp') && !VARIANT.test(item.name)) lijst.push(pad);
  }
  return lijst;
}

const overzicht = {};
let gemaakt = 0;

for (const map of MAPPEN) {
  for (const bron of await fotosIn(map)) {
    const { width } = await sharp(bron).metadata();
    const bronTijd = await tijd(bron);
    const url = '/' + relative('public', bron).split(sep).join('/');
    const versies = [];

    for (const breedte of BREEDTES) {
      /* Alleen als het echt scheelt, anders is de foto zelf al klein genoeg. */
      if (width < breedte * 1.25) continue;
      const doel = bron.replace(/\.webp$/, `-${breedte}w.webp`);
      if ((await tijd(doel)) < bronTijd) {
        await sharp(bron).resize({ width: breedte }).webp({ quality: 78 }).toFile(doel);
        gemaakt++;
      }
      versies.push({ src: url.replace(/\.webp$/, `-${breedte}w.webp`), breedte });
    }
    if (versies.length) overzicht[url] = [...versies, { src: url, breedte: width }];
  }
}

await writeFile(UIT, JSON.stringify(overzicht, null, 2) + '\n', 'utf8');
console.log(`${Object.keys(overzicht).length} foto's met kleinere versies, ${gemaakt} nieuw gemaakt (${UIT})`);

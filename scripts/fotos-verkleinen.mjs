/**
 * Verkleint de aangeleverde bronfoto's uit /_bronfotos naar webformaat in /public/images.
 * Draaien met: npm run fotos
 *
 * De originelen uit de club-map zijn 12-13 MB per stuk. Die zet je nooit rechtstreeks
 * op een site die door ouders op 4G wordt geopend. Dit script maakt er .webp van
 * met een maximale breedte, zodat de demo snel blijft.
 *
 * Sharp zit al in de Astro-installatie, dit is dus geen extra dependency.
 */
import sharp from 'sharp';
import { mkdir, readdir, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';

const BRON = '_bronfotos';
const DOEL = 'public/images';

/** Bronbestand -> doelpad (zonder extensie) + maximale breedte in pixels. */
const KAART = [
  ['Heren 1.jpg', 'teams/kwiek-78-1', 1800],
  ['Heren 2.jpg', 'teams/kwiek-78-2', 1800],
  ['Heren 3.jpg', 'club/sfeer-veld', 2000],
  ['Vrouwen 1.jpg', 'teams/kwiek-78-vr1', 1800],
  ['veteranen VE 1.jpg', 'club/veteranen', 1600],
  ['Kwiek 35+2-1.jpg', 'club/kwiek-35plus', 1600],
  ['hoofdsponsor1.jpg', 'sponsoren/kramer-keukens', 640],
  ['hoofdsponsor2.jpg', 'sponsoren/dralco', 640],
  ['hoofdsponsorjeugd.jpg', 'sponsoren/braas-en-partners', 640],
  ['logo-512.png', 'logos/kwiek-78', 512],
];

const bestaat = async (p) => !!(await stat(p).catch(() => null));

for (const [bron, doel, breedte] of KAART) {
  const bronPad = join(BRON, bron);
  if (!(await bestaat(bronPad))) {
    console.warn(`overslaan, niet gevonden: ${bronPad}`);
    continue;
  }
  const doelPad = join(DOEL, `${doel}.webp`);
  await mkdir(dirname(doelPad), { recursive: true });
  const pijp = sharp(bronPad).rotate().resize({ width: breedte, withoutEnlargement: true });
  await pijp.webp({ quality: 82 }).toFile(doelPad);
  const { size } = await stat(doelPad);
  console.log(`${bron}  ->  ${doelPad}  (${Math.round(size / 1024)} kB)`);
}

// Losse controle: wat staat er nu in /public/images?
const toon = async (map, diep = 0) => {
  for (const item of await readdir(join(DOEL, map), { withFileTypes: true }).catch(() => [])) {
    if (item.isDirectory() && diep < 2) await toon(join(map, item.name), diep + 1);
  }
};
await toon('');

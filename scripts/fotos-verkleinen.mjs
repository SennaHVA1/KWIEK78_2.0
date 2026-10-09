/**
 * Verkleint de aangeleverde bronfoto's uit /_bronfotos naar webformaat in
 * /public/images, en maakt de twee logovarianten die de site gebruikt.
 *
 * Draaien met: npm run fotos
 *
 * De originelen uit de club-map zijn 12 tot 13 MB per stuk. Die zet je nooit
 * rechtstreeks op een site die door ouders op 4G wordt geopend. Dit script
 * maakt er webp van met een maximale breedte, zodat de demo snel blijft.
 *
 * Sharp zit al in de Astro-installatie, dit is dus geen extra dependency.
 */
import sharp from 'sharp';
import { mkdir, stat, copyFile, readdir } from 'node:fs/promises';
import { join, dirname, parse } from 'node:path';

const BRON = '_bronfotos';
const DOEL = 'public/images';

/** Alle foto's in een submap van /_bronfotos, met dezelfde naam naar dezelfde
    submap van /public/images. Geen lijst om bij te houden. */
async function map(submap, breedte) {
  return (await readdir(join(BRON, submap)).catch(() => []))
    .filter((bestand) => /\.(jpe?g|png|webp)$/i.test(bestand))
    .map((bestand) => [join(submap, bestand), `${submap}/${parse(bestand).name}`, breedte]);
}

/* Teamfoto's. De bestandsnaam is het team-id uit src/data/teams.json, dus
   _bronfotos/teams/kwiek-78-jo17-1.jpg wordt teams/kwiek-78-jo17-1.webp en
   staat daarmee vanzelf op de pagina van dat team. Actiefoto's heten
   <team-id>-actie-1, -actie-2 enzovoort en komen in de strook "In actie". */
const teamfotos = await map('teams', 1800);

/* Sfeer- en clubfoto's. Waar welke foto staat, staat in IMAGES.md. */
const clubfotos = await map('club', 1800);

/** Bronbestand -> doelpad (zonder extensie) + maximale breedte in pixels. */
const FOTOS = [
  ...teamfotos,
  ...clubfotos,
  ['Heren 1 hero.png', 'club/hero-heren-1', 2400],
  ['veteranen VE 1.jpg', 'club/veteranen', 1600],
  ['Kwiek 35+2-1.jpg', 'club/kwiek-35plus', 1600],
  ['hoofdsponsor1.jpg', 'sponsoren/kramer-keukens', 640],
  ['hoofdsponsor2.jpg', 'sponsoren/dralco', 640],
  ['hoofdsponsorjeugd.jpg', 'sponsoren/braas-en-partners', 640],
];

const bestaat = async (p) => !!(await stat(p).catch(() => null));

for (const [bron, doel, breedte] of FOTOS) {
  const bronPad = join(BRON, bron);
  if (!(await bestaat(bronPad))) {
    console.warn(`overslaan, niet gevonden: ${bronPad}`);
    continue;
  }
  const doelPad = join(DOEL, `${doel}.webp`);
  await mkdir(dirname(doelPad), { recursive: true });
  await sharp(bronPad)
    .rotate()
    .resize({ width: breedte, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(doelPad);
  const { size } = await stat(doelPad);
  console.log(`${bron}  ->  ${doelPad}  (${Math.round(size / 1024)} kB)`);
}

/* ------------------------------------------------------------------------
   Logovarianten

   De site gebruikt het echte logo, zwarte lijnen op transparant. Er is geen
   omgekeerde variant: bij het omkeren klappen ook de panelen van de bal om en
   dan klopt het logo niet meer. Op de zwarte balken staat het logo daarom op
   een lichte tegel.

     kwiek-78.png        het logo zelf, transparant. Koptekst, voettekst, favicon.
     kwiek-78-wapen.png  vierkant met lichte achtergrond, voor de wedstrijdrijen
                         en als apple-touch-icon.
   ------------------------------------------------------------------------ */
const LOGOBRON = join(BRON, 'logo-512.png');

if (await bestaat(LOGOBRON)) {
  await mkdir(join(DOEL, 'logos'), { recursive: true });

  await copyFile(LOGOBRON, join(DOEL, 'logos/kwiek-78.png'));
  console.log(`logo-512.png  ->  ${join(DOEL, 'logos/kwiek-78.png')}`);

  const binnenwerk = await sharp(LOGOBRON)
    .resize({ width: 160, fit: 'inside' })
    .flatten({ background: '#FBFAF7' })
    .toBuffer();

  const wapenPad = join(DOEL, 'logos/kwiek-78-wapen.png');
  await sharp({ create: { width: 192, height: 192, channels: 4, background: '#FBFAF7' } })
    .composite([{ input: binnenwerk, gravity: 'center' }])
    .png()
    .toFile(wapenPad);
  console.log(`logo-512.png  ->  ${wapenPad}  (wapen)`);
} else {
  console.warn(`overslaan, niet gevonden: ${LOGOBRON}`);
}

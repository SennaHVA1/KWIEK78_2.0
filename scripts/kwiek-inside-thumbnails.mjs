/**
 * Haalt de thumbnails van de Kwiek Inside-afleveringen op bij YouTube en zet ze
 * als webp in /public/images/kwiek-inside.
 *
 * Draaien met: npm run thumbnails
 *
 * Waarom lokaal en niet rechtstreeks vanaf i.ytimg.com: de kaarten laden de
 * YouTube-speler pas na een klik, juist om te voorkomen dat er bij het openen
 * van de pagina al verzoeken naar Google gaan. Een thumbnail die van hun server
 * komt zou dat alsnog doen.
 *
 * Bestaande bestanden worden overgeslagen. Wil de club een eigen still
 * gebruiken, dan zet je die met dezelfde naam neer en blijft hij staan.
 */
import sharp from 'sharp';
import { mkdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import videos from '../src/data/videos.json' with { type: 'json' };

const DOEL = 'public/images/kwiek-inside';
const bestaat = async (p) => !!(await stat(p).catch(() => null));

await mkdir(DOEL, { recursive: true });

for (const video of videos) {
  if (!video.youtubeId) {
    console.warn(`overslaan, geen youtubeId: ${video.id}`);
    continue;
  }

  const doelPad = join(DOEL, `${video.id}.webp`);
  if (await bestaat(doelPad)) {
    console.log(`overslaan, staat er al: ${doelPad}`);
    continue;
  }

  /* maxresdefault is 1280x720 en dus meteen 16:9. Bestaat die niet, dan valt
     YouTube terug op een grijze plaatshouder van 120x90; daarom controleren we
     de breedte in plaats van alleen de statuscode. */
  let bron = null;
  for (const naam of ['maxresdefault', 'sddefault', 'hqdefault']) {
    const url = `https://i.ytimg.com/vi/${video.youtubeId}/${naam}.jpg`;
    const antwoord = await fetch(url);
    if (!antwoord.ok) continue;
    const buffer = Buffer.from(await antwoord.arrayBuffer());
    const { width } = await sharp(buffer).metadata();
    if (width >= 480) { bron = { buffer, naam }; break; }
  }

  if (!bron) {
    console.warn(`geen bruikbare thumbnail gevonden voor ${video.id}`);
    continue;
  }

  /* sddefault en hqdefault zijn 4:3 met zwarte balken boven en onder. Die
     snijden we eruit, zodat elke kaart dezelfde verhouding houdt. */
  await sharp(bron.buffer)
    .resize({ width: 1280, height: 720, fit: 'cover', position: 'center' })
    .webp({ quality: 80 })
    .toFile(doelPad);

  const { size } = await stat(doelPad);
  console.log(`${video.id}  <-  ${bron.naam}.jpg  (${Math.round(size / 1024)} kB)`);
}

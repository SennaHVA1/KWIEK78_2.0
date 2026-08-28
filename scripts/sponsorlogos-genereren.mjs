/**
 * Genereert tijdelijke sponsorlogo's in /public/images/sponsoren.
 * Draaien met: node scripts/sponsorlogos-genereren.mjs
 *
 * Dit zijn PLAATSHOUDERS: een nette woordmerktegel met de bedrijfsnaam, in
 * dezelfde zwart-witte taal als de rest van de site. Zodra de club de echte
 * logo's aanlevert vervang je gewoon het bestand met dezelfde naam.
 * Zie IMAGES.md voor de lijst en de gevraagde afmetingen.
 *
 * Zwarte tekst op transparant, want de sponsorvlakken op de site zijn wit.
 * In de huisletter Barlow Condensed, zodat een plaatshouder niet uit de toon
 * valt tussen de echte logo's.
 */
import { writeFile, mkdir, access } from 'node:fs/promises';
import { readFile } from 'node:fs/promises';

const sponsoren = JSON.parse(await readFile('src/data/sponsoren.json', 'utf8'));

/** Splitst een lange naam over twee regels zodat hij leesbaar blijft. */
const regels = (naam) => {
  if (naam.length <= 16) return [naam];
  const woorden = naam.split(' ');
  if (woorden.length === 1) return [naam];
  let boven = '';
  let i = 0;
  while (i < woorden.length - 1 && (boven + woorden[i]).length < naam.length / 2) {
    boven += (boven ? ' ' : '') + woorden[i];
    i++;
  }
  return [boven, woorden.slice(i).join(' ')];
};

const tegel = (naam) => {
  const r = regels(naam);
  const grootte = Math.min(30, Math.floor(560 / Math.max(...r.map((x) => x.length))));
  const startY = r.length === 1 ? 62 : 48;
  const tekst = r
    .map((regel, i) =>
      `  <text x="160" y="${startY + i * (grootte + 6)}" fill="#0C0C0D" font-family="'Barlow Condensed', 'Arial Narrow', Arial, sans-serif" font-size="${grootte}" font-weight="700" letter-spacing="-0.5" text-anchor="middle" dominant-baseline="middle">${regel}</text>`)
    .join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 120" width="320" height="120" role="img" aria-label="${naam}">
${tekst}
  <rect x="118" y="98" width="84" height="3" fill="#0C0C0D"/>
</svg>
`;
};

const bestaat = async (p) => { try { await access(p); return true; } catch { return false; } };

await mkdir('public/images/sponsoren', { recursive: true });
let gemaakt = 0;
for (const sponsor of sponsoren) {
  if (!sponsor.logo.endsWith('.svg')) continue;   // echte logo's overslaan
  const pad = `public${sponsor.logo}`;
  if (await bestaat(pad)) continue;
  await writeFile(pad, tegel(sponsor.naam), 'utf8');
  console.log(pad);
  gemaakt++;
}
console.log(`${gemaakt} plaatshouders gemaakt`);

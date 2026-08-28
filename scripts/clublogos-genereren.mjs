/**
 * Genereert tijdelijke clubwapens voor de tegenstanders in /public/images/logos.
 * Draaien met: node scripts/clublogos-genereren.mjs
 *
 * Dit zijn PLAATSHOUDERS. Zodra de Sportlink-koppeling live staat levert
 * Sportlink de echte clublogo-url mee in de velden `thuisteamlogo` en
 * `uitteamlogo`, en kan dit script weg. Zie IMAGES.md.
 *
 * Bewust een wit vlak met zwarte letters: dan werkt hetzelfde bestand op de
 * zwarte wedstrijdpanelen en op de witte roosterpagina's.
 */
import { writeFile, mkdir } from 'node:fs/promises';

const CLUBS = [
  ['rkedo', 'EDO'],
  ['dirkshorn', 'DIR'],
  ['kwadijk', 'KWA'],
  ['vrone', 'VRO'],
  ['victoria-o', 'VIC'],
  ['de-wherevogels', 'WHE'],
  ['beemster', 'BEE'],
  ['purmerend', 'PUR'],
  ['ksv', 'KSV'],
  ['koedijk', 'KOE'],
  ['oosthuizen', 'OOS'],
  ['hauwert-65', 'HAU'],
  ['spirit-30', 'SPI'],
  ['sporting-andijk', 'AND'],
  ['grasshoppers', 'GRA'],
  ['zouaven', 'ZOU'],
];

const wapen = (letters) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" role="img" aria-hidden="true">
  <rect x="0" y="0" width="96" height="96" fill="#FBFAF7"/>
  <text x="48" y="49" fill="#14161A" font-family="'Barlow Condensed', 'Arial Narrow', Arial, sans-serif"
        font-size="30" font-weight="700" letter-spacing="0.5"
        text-anchor="middle" dominant-baseline="central">${letters}</text>
</svg>
`;

await mkdir('public/images/logos', { recursive: true });
for (const [slug, letters] of CLUBS) {
  await writeFile(`public/images/logos/${slug}.svg`, wapen(letters), 'utf8');
  console.log(`public/images/logos/${slug}.svg`);
}

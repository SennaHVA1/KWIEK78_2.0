/**
 * Genereert src/data/standen.json met dummy-poulestanden.
 * Draaien met: node scripts/standen-genereren.mjs
 *
 * Waarom een script en geen handgeschreven JSON: een poulestand moet kloppen.
 * Punten = 3x gewonnen + gelijk, gespeeld = gewonnen + gelijk + verloren,
 * binnen een poule is het aantal overwinningen gelijk aan het aantal
 * nederlagen, het aantal gelijke spelen is even, en de som van alle
 * doelpunten voor is gelijk aan de som van alle doelpunten tegen.
 * Het script rekent dat na.
 *
 * Zodra de Sportlink-koppeling live is (artikel `poulestand`) kan dit weg.
 */
import { writeFile } from 'node:fs/promises';

/** [naam, gewonnen, gelijk, verloren, doelpuntenVoor, doelpuntenTegen] */
const POULES = [
  {
    pouleId: '5E-04',
    pouleNaam: 'Vijfde klasse 04 zondag',
    bijgewerkt: '2026-11-16',
    rijen: [
      ['RKEDO 2', 6, 1, 1, 22, 9],
      ['Beemster 1', 5, 2, 1, 18, 10],
      ["Kwadijk 1", 5, 0, 3, 20, 12],
      ['Victoria O 1', 4, 1, 3, 17, 12],
      ["Kwiek '78 1", 4, 1, 3, 16, 13],
      ["Hauwert '65 1", 3, 3, 2, 14, 12],
      ['Dirkshorn 1', 3, 2, 2, 13, 12],
      ['KSV 1', 3, 2, 3, 13, 13],
      ['Koedijk 4', 2, 3, 2, 11, 13],
      ['Oosthuizen 1', 2, 2, 3, 10, 14],
      ['Purmerend 3', 1, 2, 4, 8, 18],
      ['De Wherevogels 2', 1, 1, 5, 9, 17],
      ['Sporting Andijk 1', 0, 0, 7, 6, 22],
    ],
  },
  {
    pouleId: 'RES6E-02',
    pouleNaam: 'Reserve zesde klasse 02 zondag',
    bijgewerkt: '2026-11-16',
    rijen: [
      ['Beemster 3', 6, 1, 1, 24, 8],
      ["Kwiek '78 2", 5, 1, 2, 21, 10],
      ['KSV 3', 4, 2, 2, 18, 11],
      ['Oosthuizen 3', 4, 1, 3, 16, 13],
      ['Koedijk 5', 3, 2, 3, 14, 14],
      ['Zouaven 5', 2, 2, 3, 12, 16],
      ["Spirit '30 3", 2, 1, 4, 11, 18],
      ['Purmerend 4', 1, 1, 5, 9, 20],
      ['Kwadijk 2', 0, 3, 4, 7, 22],
    ],
  },
  {
    pouleId: 'JO17-4H-01',
    pouleNaam: 'Onder 17 vierde klasse 01',
    bijgewerkt: '2026-11-16',
    rijen: [
      ["Kwiek '78 JO17-1", 6, 1, 0, 28, 9],
      ['Koedijk JO17-2', 5, 1, 1, 24, 12],
      ["Spirit '30 JO17-1", 4, 2, 1, 21, 13],
      ['Sporting Andijk JO17-1', 3, 0, 4, 18, 17],
      ["Hauwert '65 JO17-1", 2, 2, 3, 14, 18],
      ['Victoria O JO17-1', 2, 1, 4, 13, 21],
      ['RKEDO JO17-2', 1, 1, 5, 10, 26],
      ['Beemster JO17-1', 0, 2, 5, 8, 20],
    ],
  },
  {
    pouleId: 'JO12-6-03',
    pouleNaam: 'Onder 12 zesde klasse 03',
    bijgewerkt: '2026-11-16',
    rijen: [
      ['Vrone JO12-1', 6, 0, 1, 31, 14],
      ["Kwiek '78 JO12-1", 5, 1, 1, 29, 15],
      ['Koedijk JO12-2', 4, 1, 2, 24, 18],
      ['Sporting Andijk JO12-1', 3, 2, 2, 22, 20],
      ["Hauwert '65 JO12-1", 3, 0, 4, 19, 23],
      ['Beemster JO12-1', 2, 1, 4, 17, 26],
      ['Kwadijk JO12-1', 1, 1, 5, 13, 29],
      ['KSV JO12-2', 0, 2, 5, 11, 21],
    ],
  },
  {
    pouleId: 'VR4-01',
    pouleNaam: 'Vierde klasse 01 vrouwen zaterdag',
    bijgewerkt: '2026-11-16',
    rijen: [
      ['Purmerend VR1', 6, 1, 0, 23, 7],
      ['Vrone VR1', 5, 1, 1, 20, 10],
      ["Kwiek '78 VR1", 4, 2, 1, 18, 11],
      ['Beemster VR1', 3, 2, 2, 15, 13],
      ['KSV VR1', 2, 1, 4, 11, 18],
      ['De Wherevogels VR1', 2, 0, 5, 14, 15],
      ['Oosthuizen VR1', 1, 1, 5, 9, 21],
      ['Sporting Andijk VR1', 0, 2, 5, 6, 21],
    ],
  },
];

// Let op: voor MO9 en alle pupillencategorieen onder JO12 publiceert de KNVB
// geen stand. Die poule staat hier daarom bewust niet in. getPoulestand()
// geeft dan null terug en de teampagina legt uit waarom.

let fouten = 0;

const uit = POULES.map((poule) => {
  const regels = poule.rijen.map(([team, g, gl, v, dpv, dpt], i) => ({
    positie: i + 1,
    team,
    gespeeld: g + gl + v,
    gewonnen: g,
    gelijk: gl,
    verloren: v,
    punten: g * 3 + gl,
    doelpuntenVoor: dpv,
    doelpuntenTegen: dpt,
  }));

  const som = (sleutel) => regels.reduce((s, r) => s + r[sleutel], 0);
  const controle = (voorwaarde, melding) => {
    if (!voorwaarde) {
      console.error(`FOUT ${poule.pouleId}: ${melding}`);
      fouten++;
    }
  };

  controle(som('gewonnen') === som('verloren'),
    `${som('gewonnen')} zeges tegenover ${som('verloren')} nederlagen`);
  controle(som('gelijk') % 2 === 0,
    `oneven aantal gelijke spelen (${som('gelijk')})`);
  controle(som('doelpuntenVoor') === som('doelpuntenTegen'),
    `${som('doelpuntenVoor')} doelpunten voor tegenover ${som('doelpuntenTegen')} tegen`);

  // Volgorde controleren: punten aflopend, bij gelijk aantal punten doelsaldo.
  for (let i = 1; i < regels.length; i++) {
    const a = regels[i - 1];
    const b = regels[i];
    const saldo = (r) => r.doelpuntenVoor - r.doelpuntenTegen;
    controle(a.punten > b.punten || (a.punten === b.punten && saldo(a) >= saldo(b)),
      `${b.team} staat boven ${a.team} maar heeft niet meer punten of saldo`);
  }

  return { pouleId: poule.pouleId, pouleNaam: poule.pouleNaam, bijgewerkt: poule.bijgewerkt, regels };
});

if (fouten > 0) {
  console.error(`\n${fouten} fout(en) gevonden. Niets weggeschreven.`);
  process.exit(1);
}

await writeFile('src/data/standen.json', JSON.stringify(uit, null, 2) + '\n', 'utf8');
console.log(`standen.json geschreven: ${uit.length} poules, alle controles akkoord`);

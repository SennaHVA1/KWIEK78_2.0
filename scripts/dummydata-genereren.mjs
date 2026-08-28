/**
 * Genereert de dummydata die te groot is om met de hand te onderhouden:
 * verjaardagen, het minutenspel en het vrijwilligersrooster.
 *
 * Draaien met: node scripts/dummydata-genereren.mjs
 *
 * Alles is deterministisch (vaste pseudo-random generator), zodat een
 * herbouw dezelfde data oplevert en de demo niet elke keer verandert.
 * Zodra Sportlink gekoppeld is verdwijnen verjaardagen.json en een deel van
 * de rest; het dienstenrooster blijft eigen data van de club.
 */
import { readFile, writeFile } from 'node:fs/promises';

/* Kleine deterministische generator (mulberry32). */
const maakRandom = (zaad) => () => {
  zaad |= 0;
  zaad = (zaad + 0x6d2b79f5) | 0;
  let t = Math.imul(zaad ^ (zaad >>> 15), 1 | zaad);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const kies = (rnd, lijst) => lijst[Math.floor(rnd() * lijst.length)];

/* ------------------------------------------------------------------ */
/* 1. Verjaardagen                                                     */
/* ------------------------------------------------------------------ */
/* Basis is het spelersbestand uit teams.json, aangevuld met kaderleden
   en niet-spelende leden. Alleen dag en maand: het geboortejaar laten we
   bewust weg, dat scheelt een herleidbaar persoonsgegeven op een publieke
   pagina. Sportlink-artikel: `verjaardagen`. */

const teams = JSON.parse(await readFile('src/data/teams.json', 'utf8'));

const EXTRA_LEDEN = [
  ['Cees', 'Balk'], ['Wilma', 'Sneekes'], ['Gerard', 'Kok'], ['Astrid', 'Klaver'],
  ['Ron', 'Kramer'], ['Carla', 'Kramer'], ['Michel', 'Bood'], ['Marloes', 'Vriend'],
  ['Erwin', 'Sneekes'], ['Sandra', 'Bood'], ['Peter', 'Bood'], ['Nico', 'Ruiter'],
  ['Ted', 'Bijl'], ['Hans', 'Wagenaar'], ['Wilma', 'Bakker'], ['Ans', 'Overtoom'],
  ['Jaap', 'Sijm'], ['Truus', 'Karsten'], ['Piet', 'Schuit'], ['Klaas', 'Neefjes'],
  ['Robert', 'Appelman'], ['Marnix', 'Sijm'], ['Nadine', 'Kuip'], ['Anja', 'Klaver'],
  ['Jeroen', 'Pronk'], ['Marcel', 'Duin'], ['Paul', 'Overtoom'], ['Ronald', 'Kuip'],
  ['Wouter', 'Klaver'], ['Cor', 'Bood'], ['Marja', 'Ligthart'], ['Wim', 'Groot'],
  ['Ans', 'Karsten'], ['Corrie', 'Neefjes'], ['Riet', 'Sijm'], ['Ger', 'Overtoom'],
  ['Jan', 'Vlaar'], ['Nico', 'Balk'], ['Piet', 'Kaandorp'], ['Dirk', 'Zwaan'],
  ['Els', 'Bregman'], ['Simone', 'Schouten'], ['Tanja', 'Broersen'], ['Ilse', 'Reijne'],
  ['Bianca', 'Groenland'], ['Ellen', 'Wagenaar'], ['Ria', 'Zwart'], ['Joke', 'Kok'],
];

const DAGEN_PER_MAAND = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const rndVerj = maakRandom(19780914);
const verjaardagen = [];
let volgnummer = 0;

const voegToe = (voornaam, achternaam, tussenvoegsel, relatiecode, team, privacyniveau) => {
  const maand = 1 + Math.floor(rndVerj() * 12);
  const dag = 1 + Math.floor(rndVerj() * DAGEN_PER_MAAND[maand - 1]);
  verjaardagen.push({
    relatiecode: relatiecode ?? `KWK-9${String(++volgnummer).padStart(3, '0')}`,
    voornaam,
    achternaam,
    ...(tussenvoegsel ? { tussenvoegsel } : {}),
    dag,
    maand,
    ...(team ? { team } : {}),
    privacyniveau,
  });
};

for (const team of teams) {
  for (const speler of team.spelers) {
    voegToe(speler.voornaam, speler.achternaam, speler.tussenvoegsel,
      speler.relatiecode, team.korteNaam, speler.privacyniveau);
  }
}
for (const [voornaam, achternaam] of EXTRA_LEDEN) {
  voegToe(voornaam, achternaam, undefined, undefined, undefined, 0);
}

verjaardagen.sort((a, b) => a.maand - b.maand || a.dag - b.dag || a.voornaam.localeCompare(b.voornaam));
await writeFile('src/data/verjaardagen.json', JSON.stringify(verjaardagen, null, 2) + '\n', 'utf8');
console.log(`verjaardagen.json: ${verjaardagen.length} leden`);

/* ------------------------------------------------------------------ */
/* 2. Minutenspel                                                      */
/* ------------------------------------------------------------------ */
/* Negentig minuten, waarvan een deel verkocht. De vrije minuten blijven
   leeg zodat de pagina kan laten zien wat nog te koop is. */

const KOPERS = [
  'Familie Overtoom', 'Familie Sijm', 'Bakkerij Klaver', 'Fam. Kaandorp',
  'Cees Balk', 'Wilma Bakker', 'Kwakman Groep', 'Fam. Bood', 'Jaap Sijm',
  'De Koggeslager', 'Fam. Nooij', 'Klaas Neefjes', 'Autoschade Karsten',
  'Fam. Beerepoot', 'Truus Karsten', 'Rijschool Molenaar', 'Fam. Groot',
  'Piet Schuit', 'Fysio Avenhorn', 'Fam. Vriend', 'Ted Bijl', 'Fam. Blank',
  'Elektro Neefjes', 'Fam. Karsten', 'Marja Ligthart', 'Fam. Koning',
  'Kapsalon Nooij', 'Fam. Molenaar', 'Cor Bood', 'Loonbedrijf Vriend',
  'Fam. Schaper', 'Hans Wagenaar', 'Fam. Ligthart', 'Ans Overtoom',
  'Tuincentrum Koggenland', 'Fam. Duin', 'Gerard Kok', 'Fam. Kuip',
  'Schildersbedrijf Blank', 'Fam. Zwart', 'Nico Ruiter', 'Fam. Broersen',
  'Bouwbedrijf Appelman', 'Fam. Reijne', 'Michel Bood', 'Fam. Bruin',
  'Transportbedrijf Groot', 'Fam. Rood', 'Sandra Bood', 'Fam. Vlaar',
  'Installatiebedrijf Sijm', 'Fam. Neefjes', 'Robert Appelman', 'Fam. Sneekes',
  'Hoveniersbedrijf Beerepoot', 'Fam. Wagenaar', 'Astrid Klaver', 'Fam. Pronk',
  'VI Travel', 'Fam. Kok', 'Anja Klaver', 'Fam. Balk',
];

const rndMin = maakRandom(631978);
const minuten = [];
const gebruikt = new Set();
for (let minuut = 1; minuut <= 90; minuut++) {
  // Ongeveer zeventig procent verkocht: dat is een realistische stand halverwege.
  if (rndMin() > 0.7) continue;
  let naam = kies(rndMin, KOPERS);
  let poging = 0;
  while (gebruikt.has(naam) && poging < 20) { naam = kies(rndMin, KOPERS); poging++; }
  gebruikt.add(naam);
  minuten.push({ minuut, naam });
}
await writeFile('src/data/minutenspel.json', JSON.stringify(minuten, null, 2) + '\n', 'utf8');
console.log(`minutenspel.json: ${minuten.length} van 90 minuten verkocht`);

/* ------------------------------------------------------------------ */
/* 3. Vrijwillige diensten                                             */
/* ------------------------------------------------------------------ */
/* Vier soorten diensten, per speelweekend ingevuld. Dit is eigen data van
   de club, geen Sportlink. In productie komt dit uit een gedeeld
   spreadsheet of uit het vrijwilligerspakket van de club. */

const VRIJWILLIGERS = [
  'Wilma Bakker', 'Ans Overtoom', 'Jaap Sijm', 'Truus Karsten', 'Ria Zwart',
  'Joke Kok', 'Els Bregman', 'Simone Schouten', 'Tanja Broersen', 'Ilse Reijne',
  'Bianca Groenland', 'Ellen Wagenaar', 'Marja Ligthart', 'Ans Karsten',
  'Corrie Neefjes', 'Marloes Vriend', 'Sandra Bood', 'Nadine Kuip',
  'Astrid Klaver', 'Anja Klaver', 'Carla Kramer', 'Riet Sijm',
];
const BESTUURSDIENST = [
  'Cees Balk', 'Wilma Sneekes', 'Gerard Kok', 'Astrid Klaver', 'Ron Kramer',
  'Michel Bood', 'Nico Ruiter', 'Piet Schuit', 'Marnix Sijm',
];
const SCHOONMAAK = [
  'Fam. Kaandorp', 'Fam. Sijm', 'Fam. Bakker', 'Fam. Overtoom', 'Fam. Klaver',
  'Fam. Groot', 'Fam. Nooij', 'Fam. Vriend', 'Fam. Molenaar', 'Fam. Beerepoot',
  'Fam. Karsten', 'Fam. Koning', 'Fam. Blank', 'Fam. Bood', 'Fam. Duin',
  'Fam. Schaper', 'Fam. Ligthart', 'Fam. Zwart',
];

const rndDienst = maakRandom(28081978);
const paar = (rnd, lijst) => {
  const a = kies(rnd, lijst);
  let b = kies(rnd, lijst);
  let poging = 0;
  while (b === a && poging < 10) { b = kies(rnd, lijst); poging++; }
  return [a, b];
};

/** Alle zaterdagen en zondagen van 29 augustus 2026 tot en met 21 maart 2027. */
const diensten = [];
const start = new Date(Date.UTC(2026, 7, 29));
const eind = new Date(Date.UTC(2027, 2, 21));
const winterstopStart = Date.UTC(2026, 11, 21);
const winterstopEind = Date.UTC(2027, 0, 10);

for (let d = new Date(start); d <= eind; d.setUTCDate(d.getUTCDate() + 1)) {
  const tijdstempel = d.getTime();
  if (tijdstempel >= winterstopStart && tijdstempel <= winterstopEind) continue;
  const dag = d.getUTCDay();
  const datum = d.toISOString().slice(0, 10);

  if (dag === 6) {
    diensten.push({
      id: `kz-${datum}`, datum, soort: 'kantine-zaterdag', tijd: '08:00 - 13:00',
      namen: paar(rndDienst, VRIJWILLIGERS),
    });
    diensten.push({
      id: `sm-${datum}`, datum, soort: 'schoonmaak', tijd: '13:00 - 15:00',
      namen: paar(rndDienst, SCHOONMAAK),
    });
  }
  if (dag === 0) {
    diensten.push({
      id: `kzo1-${datum}`, datum, soort: 'kantine-zondag', tijd: '12:00 - 16:00',
      namen: paar(rndDienst, VRIJWILLIGERS),
    });
    diensten.push({
      id: `kzo2-${datum}`, datum, soort: 'kantine-zondag', tijd: '16:00 - 20:00',
      namen: paar(rndDienst, VRIJWILLIGERS),
    });
    diensten.push({
      id: `bd-${datum}`, datum, soort: 'bestuursdienst', tijd: '12:00 - 18:00',
      namen: [kies(rndDienst, BESTUURSDIENST)],
    });
  }
}

await writeFile('src/data/diensten.json', JSON.stringify(diensten, null, 2) + '\n', 'utf8');
console.log(`diensten.json: ${diensten.length} diensten`);

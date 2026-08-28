/**
 * Datum- en tijdweergave, overal in het Nederlands en in de Nederlandse
 * tijdzone. Bewust met vaste tabellen en niet met Intl: de site wordt
 * statisch gebouwd op een server die in UTC kan staan, en dan wil je niet dat
 * "zondag 14:00" opeens "zondag 12:00" wordt.
 */

const DAGEN = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
const DAGEN_KORT = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
const MAANDEN = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
];
const MAANDEN_KORT = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

export const MAANDNAMEN = MAANDEN;

/**
 * Zet een ISO-tijd om naar de onderdelen zoals ze in Nederland gelezen worden.
 * De offset in de ISO-string (+02:00 of +01:00) is leidend.
 */
function nederlandseDelen(iso: string) {
  const overeenkomst = iso.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?(?::\d{2})?(?:([+-])(\d{2}):(\d{2})|Z)?$/,
  );
  if (!overeenkomst) {
    const terugval = new Date(iso);
    return {
      jaar: terugval.getFullYear(),
      maand: terugval.getMonth() + 1,
      dag: terugval.getDate(),
      uur: terugval.getHours(),
      minuut: terugval.getMinutes(),
      weekdag: terugval.getDay(),
      heeftTijd: true,
    };
  }
  const [, jaar, maand, dag, uur, minuut] = overeenkomst;
  // Weekdag berekenen via een UTC-datum met dezelfde kalenderwaarden, zodat de
  // tijdzone van de bouwserver er niet tussen komt.
  const weekdag = new Date(Date.UTC(+jaar, +maand - 1, +dag)).getUTCDay();
  return {
    jaar: +jaar,
    maand: +maand,
    dag: +dag,
    uur: uur ? +uur : 0,
    minuut: minuut ? +minuut : 0,
    weekdag,
    heeftTijd: uur !== undefined,
  };
}

/** "zondag 30 augustus" */
export function langeDatum(iso: string): string {
  const d = nederlandseDelen(iso);
  return `${DAGEN[d.weekdag]} ${d.dag} ${MAANDEN[d.maand - 1]}`;
}

/** "zondag 30 augustus 2026" */
export function volledigeDatum(iso: string): string {
  const d = nederlandseDelen(iso);
  return `${DAGEN[d.weekdag]} ${d.dag} ${MAANDEN[d.maand - 1]} ${d.jaar}`;
}

/** "zo 30 aug" */
export function korteDatum(iso: string): string {
  const d = nederlandseDelen(iso);
  return `${DAGEN_KORT[d.weekdag]} ${d.dag} ${MAANDEN_KORT[d.maand - 1]}`;
}

/** "30 augustus 2026" */
export function datumZonderDag(iso: string): string {
  const d = nederlandseDelen(iso);
  return `${d.dag} ${MAANDEN[d.maand - 1]} ${d.jaar}`;
}

/** "14:00" */
export function tijd(iso: string): string {
  const d = nederlandseDelen(iso);
  return `${String(d.uur).padStart(2, '0')}:${String(d.minuut).padStart(2, '0')}`;
}

/** "zondag 30 augustus, 14:00" */
export function datumEnTijd(iso: string): string {
  return `${langeDatum(iso)}, ${tijd(iso)}`;
}

/** Waarde voor het datetime-attribuut van een time-element. */
export function machineDatum(iso: string): string {
  return iso;
}

/** Sleutel om wedstrijden op speeldag te groeperen. */
export function dagSleutel(iso: string): string {
  const d = nederlandseDelen(iso);
  return `${d.jaar}-${String(d.maand).padStart(2, '0')}-${String(d.dag).padStart(2, '0')}`;
}

/** "zaterdag 29 augustus" bij een sleutel uit dagSleutel(). */
export function sleutelNaarLabel(sleutel: string): string {
  return langeDatum(`${sleutel}T00:00`);
}

/** Het jaartal, bijvoorbeeld voor de footer. */
export function huidigJaar(): number {
  return new Date().getFullYear();
}

/**
 * Groepeert een lijst objecten op speeldag, met behoud van volgorde.
 * Gebruikt op de programma-, uitslagen- en dienstenpagina.
 */
export function groepeerPerDag<T>(items: T[], haalDatum: (item: T) => string) {
  const groepen = new Map<string, T[]>();
  for (const item of items) {
    const sleutel = dagSleutel(haalDatum(item));
    if (!groepen.has(sleutel)) groepen.set(sleutel, []);
    groepen.get(sleutel)!.push(item);
  }
  return [...groepen.entries()].map(([sleutel, items]) => ({
    sleutel,
    label: sleutelNaarLabel(sleutel),
    items,
  }));
}

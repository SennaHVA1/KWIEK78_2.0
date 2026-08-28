/**
 * Kleine markdown-omzetter voor de body van nieuwsartikelen.
 *
 * Bewust zelf geschreven en geen dependency: de teksten die uit Facebook
 * komen bevatten alleen alinea's, opsommingen, vet, cursief en links. Een
 * volledige markdown-parser meeslepen voor die vijf dingen is zonde van de
 * laadtijd.
 *
 * Wat wordt ondersteund:
 *   - alinea's, gescheiden door een lege regel
 *   - koppen met ## en ###
 *   - opsommingen met - of *
 *   - genummerde opsommingen met 1.
 *   - **vet** en *cursief*
 *   - [tekst](url)
 *   - kale URL's worden klikbaar
 *
 * Alle invoer wordt eerst geescaped, dus er kan geen HTML uit een
 * Facebookbericht in de pagina belanden.
 */

const escape = (tekst: string) =>
  tekst
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Vet, cursief, links en kale URL's binnen een regel. */
function inline(tekst: string): string {
  let uit = escape(tekst);

  // [tekst](url)
  uit = uit.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" rel="noopener noreferrer" target="_blank">$1</a>');

  // Kale URL's, maar niet die al in een href staan. Leestekens aan het eind
  // horen bij de zin, niet bij de link: "kijk op rabobank.nl/clubsupport."
  // moet niet naar een adres met een punt erachter wijzen.
  uit = uit.replace(/(^|[\s(])(https?:\/\/[^\s<)]*[^\s<).,;:!?])([.,;:!?]*)/g,
    '$1<a href="$2" rel="noopener noreferrer" target="_blank">$2</a>$3');

  uit = uit.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  uit = uit.replace(/(^|[^*])\*([^*\n]+)\*($|[^*])/g, '$1<em>$2</em>$3');

  return uit;
}

/** Zet markdown om naar HTML. */
export function naarHtml(markdown: string): string {
  const blokken = markdown.trim().split(/\n\s*\n/);
  const uit: string[] = [];

  for (const blok of blokken) {
    const regels = blok.split('\n').map((r) => r.trim()).filter(Boolean);
    if (regels.length === 0) continue;

    // Kop
    const kop = regels[0].match(/^(#{2,3})\s+(.*)$/);
    if (kop && regels.length === 1) {
      const niveau = kop[1].length;
      uit.push(`<h${niveau}>${inline(kop[2])}</h${niveau}>`);
      continue;
    }

    // Opsomming
    if (regels.every((r) => /^[-*]\s+/.test(r))) {
      const punten = regels.map((r) => `<li>${inline(r.replace(/^[-*]\s+/, ''))}</li>`).join('');
      uit.push(`<ul>${punten}</ul>`);
      continue;
    }

    // Genummerde opsomming
    if (regels.every((r) => /^\d+[.)]\s+/.test(r))) {
      const punten = regels.map((r) => `<li>${inline(r.replace(/^\d+[.)]\s+/, ''))}</li>`).join('');
      uit.push(`<ol>${punten}</ol>`);
      continue;
    }

    // Gewone alinea, regeleindes binnen de alinea blijven staan
    uit.push(`<p>${regels.map(inline).join('<br>')}</p>`);
  }

  return uit.join('\n');
}

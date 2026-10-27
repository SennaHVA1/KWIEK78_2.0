/**
 * Verstuurt de formulieren van de site via Web3Forms (web3forms.com). Die
 * zetten de inzending om in een e-mail naar het adres dat bij de sleutel hoort.
 *
 * DE SLEUTEL
 * Komt uit PUBLIC_WEB3FORMS_KEY: lokaal in .env, op Cloudflare onder Settings >
 * Variables and Secrets. Hij mag openbaar zijn, Web3Forms is daarop gemaakt:
 * met de sleutel kun je alleen mail sturen naar het vaste adres erachter.
 *
 * Is er geen sleutel, dan verstuurt niets en tonen de formulieren de
 * demomelding. Aanmelden als lid gaat dan via de KNVB (zie lid-worden.astro).
 */

const SLEUTEL: string | undefined = import.meta.env.PUBLIC_WEB3FORMS_KEY;

export const WEB3FORMS_ACTIEF = Boolean(SLEUTEL);

/**
 * Een verborgen vinkje dat mensen niet zien en bots wel invullen. Web3Forms
 * gooit een inzending met botcheck aan weg.
 */
export function voegBotcheckToe(formulier: HTMLFormElement) {
  const vinkje = document.createElement('input');
  vinkje.type = 'checkbox';
  vinkje.name = 'botcheck';
  vinkje.tabIndex = -1;
  vinkje.setAttribute('aria-hidden', 'true');
  vinkje.style.display = 'none';
  formulier.append(vinkje);
}

/**
 * Stuurt het formulier op. Het onderwerp van de mail komt uit
 * data-onderwerp op het formulier. Geeft true terug als het is aangekomen.
 */
export async function verstuur(formulier: HTMLFormElement): Promise<boolean> {
  if (!SLEUTEL) return false;

  /* Meerdere vinkjes met dezelfde naam (de kantinedagen) worden een regel,
     een los aangevinkt vakje wordt "ja" in plaats van "on". */
  const velden: Record<string, string> = {};
  for (const [naam, waarde] of new FormData(formulier)) {
    if (typeof waarde !== 'string') continue;
    const tekst = waarde === 'on' ? 'ja' : waarde;
    velden[naam] = velden[naam] ? `${velden[naam]}, ${tekst}` : tekst;
  }
  if (velden.botcheck) return false;
  delete velden.botcheck;

  try {
    const antwoord = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: SLEUTEL,
        subject: formulier.dataset.onderwerp ?? "Formulier website Kwiek '78",
        from_name: "Website v.v. Kwiek '78",
        /* Zo kan de ontvanger in zijn mail gewoon op beantwoorden klikken. */
        replyto: velden.emailadres,
        ...velden,
      }),
    });
    const data = await antwoord.json().catch(() => ({}));
    return antwoord.ok && data.success === true;
  } catch {
    return false;
  }
}

/**
 * Het laatste stuk van elke submit, na de validatie: versturen en de
 * bezoeker laten weten hoe het ging. Zonder sleutel komt de demotekst in
 * beeld. De bedankt-tekst komt uit data-bedankt op het formulier.
 * Geeft true terug als het is verstuurd; het formulier is dan leeggemaakt.
 */
export async function verstuurMetMelding(
  formulier: HTMLFormElement,
  melding: HTMLElement | null,
  demotekst: string,
): Promise<boolean> {
  const toon = (tekst: string) => {
    if (!melding) return;
    melding.hidden = false;
    melding.textContent = tekst;
  };

  if (!WEB3FORMS_ACTIEF) {
    toon(demotekst);
    return false;
  }

  const knop = formulier.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (knop) knop.disabled = true;
  toon('Bezig met versturen…');

  const gelukt = await verstuur(formulier);
  if (knop) knop.disabled = false;

  if (gelukt) {
    toon(formulier.dataset.bedankt ?? 'Bedankt, het is verstuurd.');
    formulier.reset();
  } else {
    toon('Versturen is niet gelukt. Probeer het later opnieuw of mail naar info@kwiek78.nl.');
  }
  return gelukt;
}

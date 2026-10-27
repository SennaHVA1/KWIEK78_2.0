/**
 * Verstuurt de formulieren van de site via Web3Forms (web3forms.com). Die
 * zetten de inzending om in een e-mail naar het adres dat bij de sleutel hoort.
 *
 * DE SLEUTELS
 * Een sleutel hoort bij een mailbox, dus er zijn er drie:
 *
 *   PUBLIC_WEB3FORMS_KEY_LEDEN        aanmelden en wijzigen, naar de ledenadministratie
 *   PUBLIC_WEB3FORMS_KEY_SPONSORING   Club van '78 en All Stars, naar de sponsorcommissie
 *   PUBLIC_WEB3FORMS_KEY_CONTACT      het contactformulier
 *
 * Lokaal in .env, op Cloudflare onder Settings > Variables and Secrets. Ze
 * mogen openbaar zijn, Web3Forms is daarop gemaakt: met een sleutel kun je
 * alleen mail sturen naar het vaste adres erachter.
 *
 * Elk formulier zegt met data-sleutel welke het gebruikt. Ontbreekt die
 * sleutel, dan verstuurt dat formulier niets en toont het de demomelding.
 * Aanmelden als lid gaat dan via de KNVB (zie lid-worden.astro).
 */

/* Elke variabele voluit, anders kan Vite ze bij de build niet invullen. */
const SLEUTELS = {
  leden: import.meta.env.PUBLIC_WEB3FORMS_KEY_LEDEN,
  sponsoring: import.meta.env.PUBLIC_WEB3FORMS_KEY_SPONSORING,
  contact: import.meta.env.PUBLIC_WEB3FORMS_KEY_CONTACT,
} as Record<string, string | undefined>;

export type Mailbox = 'leden' | 'sponsoring' | 'contact';

/** Of de formulieren voor deze mailbox echt versturen. */
export function isActief(mailbox: Mailbox): boolean {
  return Boolean(SLEUTELS[mailbox]);
}

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
 * Stuurt het formulier op. De sleutel komt uit data-sleutel, het onderwerp
 * van de mail uit data-onderwerp. Geeft true terug als het is aangekomen.
 */
export async function verstuur(formulier: HTMLFormElement): Promise<boolean> {
  const sleutel = SLEUTELS[formulier.dataset.sleutel ?? ''];
  if (!sleutel) return false;

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
  /* Een herhaald veld (zoals Herhaal e-mail) is alleen ter controle. */
  for (const veld of formulier.querySelectorAll<HTMLInputElement>('[data-herhaal]')) delete velden[veld.name];

  try {
    const antwoord = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: sleutel,
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

/* Het hCaptcha-script van Web3Forms zet deze op window. */
declare global {
  interface Window {
    hcaptcha?: { reset: (widgetId?: string) => void };
  }
}

/**
 * Zet de captcha van dit formulier terug. Op de sponsorpagina staan er twee,
 * dus het moet met het widget-id; zonder id reset hCaptcha alleen de eerste.
 */
function resetCaptcha(formulier: HTMLFormElement) {
  const id = formulier.querySelector('.h-captcha iframe')?.getAttribute('data-hcaptcha-widget-id');
  try {
    if (id) window.hcaptcha?.reset(id);
  } catch {
    /* Geen captcha geladen, dan valt er niets te resetten. */
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

  if (!SLEUTELS[formulier.dataset.sleutel ?? '']) {
    toon(demotekst);
    return false;
  }

  /* hCaptcha staat aan in het dashboard van Web3Forms, dus zonder antwoord
     weigert de server de inzending toch. Beter meteen zeggen. */
  const captcha = formulier.querySelector<HTMLTextAreaElement>('textarea[name="h-captcha-response"]');
  if (!captcha?.value) {
    toon('Vink eerst het vakje "Ik ben een mens" aan, boven de verzendknop.');
    return false;
  }

  const knop = formulier.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (knop) knop.disabled = true;
  toon('Bezig met versturen…');

  const gelukt = await verstuur(formulier);
  if (knop) knop.disabled = false;
  /* Een captcha-antwoord is maar een keer geldig, ook als het misging. */
  resetCaptcha(formulier);

  if (gelukt) {
    toon(formulier.dataset.bedankt ?? 'Bedankt, het is verstuurd.');
    formulier.reset();
  } else {
    toon('Versturen is niet gelukt. Probeer het later opnieuw of mail naar info@kwiek78.nl.');
  }
  return gelukt;
}

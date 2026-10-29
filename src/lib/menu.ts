/**
 * De navigatiestructuur van de site. Maximaal twee niveaus, bewust kort.
 *
 * Het oude menu was zes niveaus diep. De belangrijkste taak op een clubsite is
 * "wanneer en waar speelt mijn kind zaterdag" en die moet binnen twee taps
 * vanaf de homepage bereikbaar zijn:
 *
 *   tap 1  Menu openen
 *   tap 2  Wedstrijden > Programma
 *
 * En vanaf de homepage zonder menu zelfs in een tap, via de knop
 * "Heel het programma" in het scorebord.
 */
import { getTeams } from './sportlink';
import { CLUBGEGEVENS } from './club';

export type Menu_item = {
  label: string;
  href: string;
  /** Opent in een nieuw tabblad en krijgt een extern-icoon. */
  extern?: boolean;
  omschrijving?: string;
};

export type Menu_groep = {
  label: string;
  /** Aanwezig wanneer de groep zelf ook een pagina heeft. */
  href?: string;
  kinderen?: Menu_item[];
  extern?: boolean;
};

/* Met alle jeugdteams erbij wordt dit submenu een lijst van zeventien regels.
   Daarom staan alleen de seniorenteams er los in en gaat de jeugd via het
   overzicht, waar elk team met zijn volgende wedstrijd staat. */
const seniorenteams = getTeams().filter((team) => !team.isJeugd);
const aantalJeugdteams = getTeams().length - seniorenteams.length;

const teamItems: Menu_item[] = [
  ...seniorenteams.map((team) => ({
    label: team.naam,
    href: `/teams/${team.id}`,
    omschrijving: team.pouleNaam,
  })),
  {
    label: 'Alle teams',
    href: '/teams',
    omschrijving: aantalJeugdteams > 0 ? `Ook de ${aantalJeugdteams} jeugdteams` : undefined,
  },
];

export const MENU: Menu_groep[] = [
  {
    label: 'Nieuws',
    href: '/nieuws',
    kinderen: [
      { label: 'Alle berichten', href: '/nieuws', omschrijving: 'Uit de Facebookpagina van de club' },
      { label: 'Kwiek Inside', href: '/nieuws/kwiek-inside', omschrijving: 'De videoserie van de club' },
    ],
  },
  {
    label: 'Wedstrijden',
    href: '/wedstrijden/programma',
    kinderen: [
      { label: 'Programma', href: '/wedstrijden/programma', omschrijving: 'Filterbaar op team en op thuis of uit' },
      { label: 'Uitslagen', href: '/wedstrijden/uitslagen', omschrijving: 'Gespeelde wedstrijden' },
      { label: 'Standen', href: '/wedstrijden/standen', omschrijving: 'De poules van al onze teams' },
    ],
  },
  {
    label: 'Teams',
    kinderen: teamItems,
  },
  {
    label: 'Club',
    kinderen: [
      { label: 'Bestuur en commissies', href: '/club/bestuur' },
      { label: 'Lid worden', href: '/club/lid-worden', omschrijving: 'Aanmelden en wijzigen' },
      { label: 'Agenda', href: '/club/agenda' },
      { label: 'Trainingsschema', href: '/club/trainingsschema', omschrijving: 'Wie wanneer traint' },
      { label: 'Verjaardagen', href: '/club/verjaardagen', omschrijving: 'Wie er binnenkort jarig is' },
      { label: 'Informatiebulletin', href: '/club/informatiebulletin', omschrijving: 'Huisregels, contributie en lidmaatschap' },
      { label: 'Ereleden', href: '/club/ereleden' },
      { label: 'Vrijwillige diensten', href: '/vrijwillige-diensten', omschrijving: 'Het dienstenrooster van de kantine' },
    ],
  },
  {
    label: 'Sponsoring',
    href: '/sponsoring',
    kinderen: [
      { label: 'Sponsor worden', href: '/sponsoring', omschrijving: "Bedrijven, Club van '78 en All Stars" },
      { label: 'Minutenspel', href: '/club/minutenspel', omschrijving: '25 euro voor een minuut' },
    ],
  },
  { label: 'Clubwinkel', href: CLUBGEGEVENS.clubwinkel, extern: true },
  { label: 'Contact', href: '/contact' },
];

/** Snelle links in de voettekst. */
export const SNELLE_LINKS: Menu_item[] = [
  { label: 'Programma', href: '/wedstrijden/programma' },
  { label: 'Uitslagen', href: '/wedstrijden/uitslagen' },
  { label: 'Standen', href: '/wedstrijden/standen' },
  { label: 'Vrijwillige diensten', href: '/vrijwillige-diensten' },
  { label: 'Lid worden', href: '/club/lid-worden' },
  { label: 'Sponsoring', href: '/sponsoring' },
  { label: 'Clubwinkel', href: CLUBGEGEVENS.clubwinkel, extern: true },
  { label: 'Contact', href: '/contact' },
];

/** De juridische pagina's staan alleen in de voettekst, niet in het hoofdmenu. */
export const JURIDISCH: Menu_item[] = [
  { label: 'Privacyverklaring', href: '/privacyverklaring' },
  { label: 'AVG', href: '/avg' },
];

/** Staat het huidige pad in deze groep of is het de groep zelf? */
export function isActief(pad: string, groep: Menu_groep): boolean {
  const schoon = pad.replace(/\/$/, '') || '/';
  if (groep.href && !groep.extern) {
    const doel = groep.href.replace(/\/$/, '') || '/';
    if (schoon === doel) return true;
  }
  return (groep.kinderen ?? []).some((kind) => {
    const doel = kind.href.replace(/\/$/, '') || '/';
    return schoon === doel || schoon.startsWith(doel + '/');
  });
}

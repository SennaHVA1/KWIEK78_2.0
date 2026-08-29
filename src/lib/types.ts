/**
 * Gedeelde datatypes voor de website van v.v. Kwiek '78.
 *
 * De veldnamen liggen zo dicht mogelijk tegen wat Sportlink teruggeeft aan.
 * Dat is bewust: als de koppeling live gaat, hoeft alleen de body van de
 * functies in `sportlink.ts` te worden vervangen, niet de pagina's.
 *
 * Zie ook: src/lib/sportlink.ts
 */

/** Soort wedstrijd. Sportlink noemt dit veld `competitiesoort`. */
export type Competitie = 'competitie' | 'beker' | 'oefen' | 'zaal';

/**
 * Een wedstrijd.
 *
 * Sportlink-artikel: `wedstrijdenprogramma` (toekomstig) en `uitslagen` (gespeeld).
 * De uitslag zit bij Sportlink in twee losse velden
 * (`thuisteamdoelpunten` / `uitteamdoelpunten`); de adapter vouwt die samen
 * tot het `uitslag`-object hieronder.
 */
export type Wedstrijd = {
  /** Unieke wedstrijdcode van de KNVB, bijvoorbeeld "BBKY84H-001". */
  wedstrijdcode: string;
  /** ISO 8601 met tijdzone-offset. Sportlink levert datum en aanvangstijd los aan. */
  datum: string;
  thuisteam: string;
  uitteam: string;
  thuisLogo: string;
  uitLogo: string;
  accommodatie: string;
  veld?: string;
  scheidsrechters?: string[];
  competitie: Competitie;
  uitslag?: { thuis: number; uit: number };
  afgelast?: boolean;
};

/** Categorie waarin een team op de site valt. Bepaalt het menu onder "Teams". */
export type TeamCategorie = 'selectie' | 'jeugd' | 'dames';

/**
 * Een speler.
 *
 * LET OP, AVG. Bij jeugdteams (`isJeugd` op het team) toont de site nooit de
 * volledige achternaam. Sportlink filtert dit per lid op privacyniveau
 * (veld `privacyniveau` op het lid). Die filtering moet bij de koppeling
 * worden overgenomen; zie `pasPrivacyToe()` in sportlink.ts.
 */
export type Speler = {
  /** Sportlink `relatiecode`. Nooit tonen op de site, alleen als sleutel. */
  relatiecode: string;
  voornaam: string;
  achternaam: string;
  /** Tussenvoegsel apart, zoals Sportlink het ook aanlevert. */
  tussenvoegsel?: string;
  rugnummer?: number;
  positie?: 'keeper' | 'verdediger' | 'middenvelder' | 'aanvaller';
  /** Sportlink-veld `privacyniveau`: 0 = volledig zichtbaar, 1 = beperkt, 2 = afgeschermd. */
  privacyniveau: 0 | 1 | 2;
};

/** Lid van de technische staf of teambegeleiding. */
export type Staflid = {
  naam: string;
  functie: string;
};

export type Training = {
  dag: string;
  van: string;
  tot: string;
  veld: string;
};

/**
 * Een team dat op de site staat.
 *
 * Sportlink-artikel: `clubteams` voor de lijst, `teamindeling` voor de spelers.
 */
export type Team = {
  /** Slug voor de URL, bijvoorbeeld "kwiek-78-1". */
  id: string;
  /** Exacte teamnaam zoals Sportlink hem gebruikt. Hierop koppelen we wedstrijden. */
  naam: string;
  korteNaam: string;
  categorie: TeamCategorie;
  /** Poule-identificatie, gebruikt voor getPoulestand(). */
  pouleId: string;
  pouleNaam: string;
  speeldag: 'zaterdag' | 'zondag';
  /** Bepaalt of de AVG-filtering voor jeugdleden wordt toegepast. */
  isJeugd: boolean;
  teamfoto?: string;
  fotobijschrift?: string;
  omschrijving: string;
  staf: Staflid[];
  trainingen: Training[];
  spelers: Speler[];
};

/** Een regel uit de poulestand. Sportlink-artikel: `poulestand`. */
export type Standregel = {
  positie: number;
  team: string;
  gespeeld: number;
  gewonnen: number;
  gelijk: number;
  verloren: number;
  punten: number;
  doelpuntenVoor: number;
  doelpuntenTegen: number;
};

export type Poulestand = {
  pouleId: string;
  pouleNaam: string;
  bijgewerkt: string;
  regels: Standregel[];
};

/**
 * Een jarig lid.
 *
 * Sportlink-artikel: `verjaardagen`. Het geboortejaar wordt bewust niet
 * meegenomen naar de site: dag en maand volstaan en dat scheelt een
 * herleidbaar persoonsgegeven.
 */
export type Verjaardag = {
  relatiecode: string;
  voornaam: string;
  achternaam: string;
  tussenvoegsel?: string;
  /** Dag van de maand, 1 tot 31. */
  dag: number;
  /** Maand, 1 tot 12. */
  maand: number;
  team?: string;
  privacyniveau: 0 | 1 | 2;
};

/**
 * Een nieuwsartikel.
 *
 * Zie src/lib/nieuws.ts. Productiebron wordt de Facebook Graph API.
 */
export type Artikel = {
  slug: string;
  titel: string;
  datum: string;
  samenvatting: string;
  /** Markdown. */
  body: string;
  afbeelding?: string;
  /**
   * Waar het bericht vandaan komt.
   *   website  van kwiek78.nl, de huidige site van de club
   *   facebook uit de Graph API, als de club daar ooit toegang voor geeft
   *   cms      met de hand geschreven, niet overgenomen
   */
  bron: 'website' | 'facebook' | 'cms';
  /** Het originele bericht, waar het ook vandaan komt. */
  bronUrl?: string;
};

/**
 * Sponsorniveau.
 *
 * De Club van '78 en de All Stars staan hier bewust niet tussen: dat zijn geen
 * bedrijven met een logo maar particulieren die meebetalen. Die krijgen een
 * eigen sectie op de sponsoringpagina.
 */
export type SponsorNiveau = 'hoofdsponsor' | 'partner';

export type Sponsor = {
  id: string;
  naam: string;
  niveau: SponsorNiveau;
  url: string;
  logo: string;
  /** Korte omschrijving, gebruikt op de sponsoringpagina. */
  omschrijving?: string;
  /** Alleen de hoofdsponsoren draaien mee in de carousel op de homepage. */
  inCarousel: boolean;
};

export type Bestuurslid = {
  /** Kan ook een duo zijn, bijvoorbeeld twee mensen die samen de secretaris doen. */
  naam: string;
  functie: string;
  commissie: string;
  email?: string;
  telefoon?: string;
  /** Voor een functie die niet is ingevuld. Dan staat er geen naam maar Vacant. */
  vacant?: boolean;
};

export type AgendaItem = {
  id: string;
  datum: string;
  eindDatum?: string;
  titel: string;
  omschrijving: string;
  locatie: string;
  categorie: 'club' | 'jeugd' | 'kantine' | 'sponsor' | 'onderhoud';
};

export type DienstSoort = 'kantine-zaterdag' | 'kantine-zondag' | 'bestuursdienst' | 'schoonmaak';

export type Dienst = {
  id: string;
  datum: string;
  soort: DienstSoort;
  /** Bijvoorbeeld "09:00 - 13:00". */
  tijd: string;
  namen: string[];
};

export type MinutenspelClaim = {
  minuut: number;
  naam: string;
};

export type Erelid = {
  naam: string;
  soort: 'erelid' | 'lid-van-verdienste';
  /** Overleden ereleden staan op de lijst met een kruisje erachter. */
  overleden?: boolean;
};

export type Bulletin = {
  id: string;
  titel: string;
  datum: string;
  omschrijving: string;
  bestand: string;
  /** Grootte als tekst, puur voor weergave. */
  grootte: string;
};

export type Video = {
  id: string;
  /**
   * YouTube video-id. De iframe wordt pas na een klik geladen.
   * Staat er null, dan is het id nog niet aangeleverd: de kaart linkt dan
   * naar het YouTube-kanaal van de club in plaats van in te sluiten.
   */
  youtubeId: string | null;
  titel: string;
  /** Publicatiedatum op YouTube, ISO. */
  datum: string;
  /** Lengte als mm:ss, puur voor weergave. */
  duur: string;
};

/**
 * Contributie, zoals die in het informatiebulletin staat.
 *
 * De bedragen zijn hele euro's per seizoen. Het kledingplan staat er los van:
 * dat is een vast bedrag bovenop de contributie, voor elk spelend lid.
 */
export type Contributietarief = {
  /** Leeftijdscategorie, bijvoorbeeld "O10 en O11". */
  categorie: string;
  bedrag: number;
};

export type Contributiereeks = {
  soort: 'veld' | 'zaal';
  label: string;
  tarieven: Contributietarief[];
};

export type Contributie = {
  /** Bijvoorbeeld "2026/2027". */
  seizoen: string;
  /** Bijdrage kledingplan per spelend lid, per seizoen. */
  kledingplan: number;
  reeksen: Contributiereeks[];
};

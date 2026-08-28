# v.v. Kwiek '78 — nieuwe website

Statische demo-website voor voetbalvereniging v.v. Kwiek '78 uit Avenhorn,
gebouwd door Brand-On als pitch voor het bestuur.

Alle wedstrijd-, team- en ledendata in deze demo is **voorbeeldmateriaal**. De
datastructuur is wel al de definitieve: de koppeling met Sportlink kan er later
in zonder dat er ook maar een pagina hoeft te worden herbouwd.

---

## Draaien

```bash
npm install
npm run dev        # ontwikkelserver op http://localhost:4321
npm run build      # statische site naar /dist
npm run preview    # /dist lokaal bekijken
npm run check      # TypeScript- en Astro-controle
```

Node 20 of hoger. Verder is er niets nodig: geen database, geen API-sleutel,
geen buildserver met bijzondere instellingen. De uitvoer in `/dist` is platte
HTML, CSS en een paar kilobyte JavaScript, en kan op elke statische host.

### Hulpscripts

```bash
npm run fotos                                # verkleint /_bronfotos naar /public/images
node scripts/clublogos-genereren.mjs         # tijdelijke wapens van tegenstanders
node scripts/sponsorlogos-genereren.mjs      # tijdelijke sponsorlogo's
node scripts/standen-genereren.mjs           # poulestanden, met controle op consistentie
node scripts/dummydata-genereren.mjs         # verjaardagen, minutenspel, dienstenrooster
```

Ze zijn alle vier alleen voor de demo. Zodra de echte bronnen zijn aangesloten
kunnen ze weg.

---

## Publiceren op Cloudflare Pages

De site staat op GitHub en wordt door Cloudflare Pages gebouwd. Elke push naar
`main` levert een nieuwe deploy op; elke pull request krijgt een eigen
preview-adres.

### Project aanmaken, eenmalig

In het Cloudflare-dashboard: **Workers & Pages → Create → Pages → Connect to
Git**, kies de repository `SennaHVA1/KWIEK78_2.0` en vul in:

| Instelling | Waarde |
|---|---|
| Framework preset | Astro (of None, dat maakt niet uit) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | leeg laten |

Node komt uit `.node-version` in de repo, dus daar hoef je niets voor in te
stellen.

Klaar. Er is geen adapter nodig, geen Workers-runtime en geen extra pakket: de
uitvoer is platte HTML.

### Adres van de site

`astro.config.mjs` bepaalt het adres voor de canonical-tags en de sitemap, in
deze volgorde:

1. `SITE_URL`, als je die zelf zet onder **Settings → Variables and Secrets**
2. `CF_PAGES_URL`, die Cloudflare zelf meegeeft
3. `https://www.kwiek78.nl`, de bestemming zodra de club het domein overzet

Je hoeft dus niets in te stellen: op de demo pakt hij automatisch het
`pages.dev` adres. Komt er een eigen domein, zet dan `SITE_URL` op dat domein
zodat de canonical daarnaar wijst en niet meer naar `pages.dev`.

### Meegeleverde bestanden

| Bestand | Waarvoor |
|---|---|
| `.node-version` | pint Node op 22 |
| `public/_headers` | cachekopregels voor lettertypes, CSS en beeld, plus een paar beveiligingskopregels |
| `dist/404.html` | wordt door Cloudflare automatisch als 404-pagina gebruikt |

Er staat bewust **geen Content-Security-Policy** in `_headers`. De kaart en de
video's laden een iframe van OpenStreetMap en YouTube zodra de bezoeker daarop
klikt; een CSP moet daar rekening mee houden en die stel je op zodra het eigen
domein en de definitieve embeds vaststaan.

### De demoschakelaar

Bovenin `src/lib/club.ts` staat:

```ts
export const IS_DEMO = true;
```

Zolang die op `true` staat krijgt elke pagina `noindex, nofollow` mee en zet
`robots.txt` alles op `Disallow`. Dat is met opzet: de bestaande clubsite staat
al in Google, en twee sites over dezelfde club die om dezelfde zoekwoorden
vechten kost de club posities.

**Bij oplevering zet je hem op `false`.** Dat is de enige plek waar het staat.

---

## Wat er is gebouwd

**Techniek.** Astro 5 met TypeScript, volledig statisch gegenereerd. Tailwind 4
met de tokens in `src/styles/global.css`. Geen frameworkbibliotheken: de
countdown, de sponsorcarousel, de accordeons, de tabs, de filters en het
overlaymenu zijn allemaal met de hand geschreven. Lettertypes staan lokaal in
`/public/fonts`, dus de site doet geen enkel verzoek naar een externe server.

**Vormgeving.** Zwart als chrome, wit als leesvlak, #6092b7 als enige accent in
twee trappen. Zes benoemde kleuren, een typeschaal en een spacingschaal, alles
daaruit afgeleid.

Typografie: **Anton** voor de koppen, de stem van een wedstrijdposter, en
**Barlow** voor al het andere, inclusief knoppen, labels en tabellen. Bewust
geen monospace: die gaf de site het karakter van een spreadsheet, en dit is een
voetbalclub. Foto's staan in kleur.

**Het klapbord.** De countdown naar de eerstvolgende wedstrijd is een
mechanisch splitflapbord; de cijfers klappen om. Dat is het enige echte visuele
risico op de site, en het staat op de plek waar de meeste mensen naartoe
komen. Alles eromheen is rustig. Bij `prefers-reduced-motion` wisselen de
cijfers gewoon zonder te klappen.

**Toegankelijkheid.** Zichtbare focusstates, correcte kopstructuur,
`prefers-reduced-motion` overal gerespecteerd, en contrast dat WCAG AA haalt.
`#6092b7` haalt op wit maar 3.2:1 en is dus niet geschikt voor kleine tekst;
daarvoor is er een tweede trap van dezelfde kleur (`#3D6E92`, 5.3:1). Dat is
geen tweede accent maar dezelfde kleur, donkerder gezet.

**Mobiel eerst.** De hoofdgebruiker is een ouder die zaterdagochtend om kwart
over acht op de telefoon kijkt of de wedstrijd doorgaat. De hero op de
homepage is daarom laag gehouden zodat het wedstrijdblok bijna meteen in beeld
staat, en het volledige programma is vanaf de homepage in een tik bereikbaar.
Via het menu is het er twee: Menu, dan Wedstrijden > Programma.

**De afgelast-staat.** Een afgelaste wedstrijd krijgt een blauwe balk aan de
zijkant, doorgestreepte clubnamen en een blauw label. Zichtbaar op het programma, op de wedstrijddetailpagina
en op de teampagina. Dat is het moment waarop een clubsite zich bewijst, dus
het is expliciet ontworpen en niet als randgeval afgedaan.

---

## Waar de dummydata staat

Alles in `src/data/`, als losse JSON-bestanden. Het bestuur, de commissies, de
ereleden en de sponsoren zijn **echte gegevens** die de club heeft aangeleverd.
Wedstrijden, teams, standen, verjaardagen, nieuws, agenda, diensten en het
minutenspel zijn voorbeeldmateriaal.

| Bestand | Inhoud | Toekomstige bron |
|---|---|---|
| `wedstrijden.json` | 53 wedstrijden, waarvan 3 afgelast | Sportlink |
| `teams.json` | 6 teams met selectie, staf en trainingstijden | Sportlink |
| `standen.json` | 5 poulestanden | Sportlink |
| `verjaardagen.json` | 134 leden, alleen dag en maand | Sportlink |
| `nieuws.json` | 10 berichten in Facebook-vorm | Facebook Graph API |
| `agenda.json` | 12 activiteiten | eigen beheer |
| `diensten.json` | 135 vrijwilligersdiensten | eigen beheer |
| `sponsoren.json` | 8 sponsoren, echte namen | eigen beheer |
| `bestuur.json` | 21 functies, **echte gegevens** | eigen beheer |
| `ereleden.json` | 26 namen, **echte gegevens** | eigen beheer |
| `bulletins.json` | 5 documenten | eigen beheer |
| `minutenspel.json` | 66 verkochte minuten | eigen beheer |
| `videos.json` | 9 afleveringen Kwiek Inside, echte YouTube-id's | eigen beheer |

**Geen enkele pagina importeert rechtstreeks een JSON-bestand.** Alles loopt
via drie adaptermodules, een per toekomstige bron:

```
src/lib/sportlink.ts   ->  Sportlink API       wedstrijden, teams, standen, leden
src/lib/nieuws.ts      ->  Facebook Graph API  nieuwsberichten
src/lib/club.ts        ->  eigen beheer        de rest
```

Boven elke functie in `sportlink.ts` staat in een comment bij welk
Sportlink-artikel hij hoort.

---

## De Sportlink-adapter later omzetten

Nu leest `src/lib/sportlink.ts` uit de JSON-bestanden. Straks doen dezelfde
functies een fetch naar:

```
https://data.sportlink.com/<artikel>?client_id=<CLIENT_ID>
```

De veldnamen in `src/lib/types.ts` liggen bewust zo dicht mogelijk tegen de
Sportlink-uitvoer aan. Er verandert daarom **alleen de body van de functies in
`sportlink.ts`**, en geen enkele pagina.

Zo ziet dat eruit:

```ts
const BASIS = 'https://data.sportlink.com';
const CLIENT_ID = import.meta.env.SPORTLINK_CLIENT_ID;

export async function getProgramma(): Promise<Wedstrijd[]> {
  const antwoord = await fetch(`${BASIS}/wedstrijdprogramma?client_id=${CLIENT_ID}`);
  const ruw = await antwoord.json();
  return ruw.map(naarWedstrijd);   // veldnamen omzetten
}
```

De functies worden dan `async` en de aanroepen in de pagina's krijgen een
`await`. Verder blijft alles gelijk.

Omdat de site statisch wordt gebouwd, draaien die calls tijdens
`npm run build` en niet in de browser van de bezoeker. Het `client_id` belandt
dus nooit in de uitgeleverde HTML. Wel betekent het dat de site opnieuw gebouwd
moet worden als er iets verandert. Voor een clubsite is een nachtelijke build
plus een handmatige knop bij een afgelasting ruim voldoende; bij de meeste
statische hosts is dat een webhook.

### Welke artikelen zijn nodig

| Functie | Sportlink-artikel |
|---|---|
| `getProgramma()`, `getEerstvolgendeWedstrijd()` | `wedstrijdprogramma` |
| `getUitslagen()` | `uitslagen` |
| `getPoulestand(teamId)` | `poulestand` |
| `getTeams()`, `getTeam(id)` | `clubteams`, `teamindeling` |
| `getVerjaardagen()` | `verjaardagen` |
| aanmeldformulier | `aanmeldenaspirantlid-form` |

### AVG bij de koppeling

Dit is het punt waarop het bestuur gaat letten, dus het is nu al goed gedaan.

Sportlink houdt per lid een veld `privacyniveau` bij, dat het lid of de ouder
zelf instelt in de KNVB-app:

- **0** volledig zichtbaar
- **1** beperkt zichtbaar → voornaam plus eerste letter achternaam
- **2** afgeschermd → helemaal niet tonen

Die instelling **moet** leidend blijven bij de koppeling. De functie
`toonNaam()` in `sportlink.ts` doet dat al, en zet er voor de jeugd een harde
ondergrens bovenop: ook een jeugdlid op niveau 0 krijgt nooit een volledige
achternaam op de site. Dat is een keuze van de club, niet van Sportlink, en die
hoort in de adapter te blijven staan.

Leden op niveau 2 worden in de adapter uit de selectie gefilterd, niet in een
component. Zo kan zo iemand nergens per ongeluk toch in de HTML belanden. Het
aantal afgeschermde leden wordt wel genoemd op de teampagina, want een selectie
waar zomaar iemand uit weg is roept vragen op.

---

## Nieuws uit Facebook

`src/lib/nieuws.ts` leest nu uit `src/data/nieuws.json`. Dat bestand heeft
bewust dezelfde vorm als wat de Facebook Graph API teruggeeft, zodat de
omzetting in de adapter straks ongewijzigd blijft:

```
GET https://graph.facebook.com/v21.0/{page-id}/posts
    ?fields=id,message,created_time,full_picture,permalink_url
    &access_token={page-access-token}
```

**Een Facebookpost heeft geen kop.** Er is alleen een veld `message` met de
volledige tekst. De adapter neemt daarom de eerste niet-lege regel als titel
van het artikel en alles daaronder als body, en leidt de slug af van die
titel.

Dat is het waard om aan de club te melden: **de eerste regel van een
Facebookbericht is meteen de kop op de website.** Wie post, weet dat dan.

Redactionele artikelen die niet van Facebook komen krijgen `bron: "cms"` en
gaan door precies dezelfde omzetting heen, zodat er maar een weg is.

---

## Openstaande punten

Dit zijn de dingen die nog niet geregeld kunnen worden door Brand-On alleen.

### 1. Sportlink client_id — actie: club

De club moet bij Sportlink een `client_id` aanvragen voor het domein waarop de
site komt te draaien. Zonder dat ID werkt geen enkele call en blijft de site op
dummydata staan. Aanvragen loopt via de clubbeheerder van Sportlink; de
KNVB-clubcode van Kwiek is **BBKY84H**.

Reken op een doorlooptijd van een paar werkdagen.

### 2. Facebook-adminrechten — actie: club

Om nieuws automatisch van Facebook te halen is een Page Access Token nodig.
Daarvoor moet **Brand-On admin worden gemaakt op de Facebookpagina van
v.v. Kwiek '78**. Dat kan alleen de huidige paginabeheerder doen, via Meta
Business Suite.

Dit is geen technische keuze en niets waar wij omheen kunnen: zonder die stap
kan de koppeling niet worden gebouwd. De pagina blijft eigendom van de club en
de rechten kunnen op elk moment weer worden ingetrokken.

Alternatief als de club dit liever niet doet: nieuwsberichten met de hand in
een klein CMS zetten. Dat werkt, maar dan komt er wel dubbel werk bij de
vrijwilliger die nu alleen op Facebook post.

### 3. Beeldmateriaal — actie: club

Zie **IMAGES.md** voor de volledige lijst met verwachte bestandsnamen en
formaten. Kort samengevat ontbreekt nog:

- teamfoto's van JO17-1, JO12-1 en MO9-1
- echte logo's van vijf sponsoren en van de tegenstanders
- de vijf PDF-documenten voor het informatiebulletin
- een kaartuitsnede voor de contactpagina

Voor teamfoto's met herkenbare minderjarigen is toestemming van de ouders
nodig. Bij nieuwe aanmeldingen wordt dat gevraagd via het aanmeldformulier;
voor de bestaande jeugd moet dat nog worden nagelopen.

### 4. Echte roosterdata — actie: club

Het dienstenrooster in de demo is gegenereerd. Het echte rooster wordt nu
bijgehouden in een spreadsheet. Twee mogelijkheden:

- **eenvoudig:** de club levert het rooster per seizoen aan als CSV, wij zetten
  het om naar `diensten.json`. Bijwerken tussendoor gaat via ons.
- **beter:** het rooster blijft in een gedeeld spreadsheet staan en de build
  leest het daar rechtstreeks uit. Dan kan de kantinecommissie zelf wijzigen en
  is de site na de eerstvolgende build bij.

Zelfde verhaal voor de agenda, het minutenspel en de sponsorlijst. Dat is een
gesprek over wie wat wil bijhouden, niet over techniek.

### 5. Juridische teksten — actie: bestuur

De privacyverklaring en de AVG-pagina staan er als opzet en zijn nog geen
definitieve tekst. Het bestuur moet ze nalopen, vooral de bewaartermijnen en de
lijst met verwerkers. Dit is geen juridisch advies van Brand-On.

### 6. Formulieren aansluiten — actie: Brand-On, na punt 1

Het aanmeldformulier en het wijzigingsformulier zijn volledig ontworpen en
gevalideerd, maar versturen nog niets. Het aanmeldformulier gaat straks via het
Sportlink-artikel `aanmeldenaspirantlid-form`; het wijzigings- en
contactformulier gaan naar een mailadres van de club.

---

## Structuur van de code

```
src/
  data/          losse JSON-bestanden met de dummydata
  lib/
    types.ts     alle datatypes, veldnamen dicht bij Sportlink
    sportlink.ts adapter voor wedstrijden, teams, standen, leden
    nieuws.ts    adapter voor nieuws, nu JSON, straks Facebook
    club.ts      adapter voor eigen data en de vaste clubgegevens
    datum.ts     Nederlandse datum- en tijdweergave
    markdown.ts  kleine markdown-omzetter voor artikelteksten
    fotos.ts     kijkt tijdens de build of een foto bestaat
    menu.ts      de navigatiestructuur, maximaal twee niveaus
  components/    herbruikbare bouwstenen
  layouts/       de basislayout
  pages/         een bestand per route
  styles/        tokens en componentklassen
public/
  images/        beeldmateriaal, zie IMAGES.md
  fonts/         Archivo en JetBrains Mono, lokaal gehost
scripts/         eenmalige generators voor de demodata
```

Alle comments in de code zijn in het Nederlands.

---

## Sitemap

```
/                                   home
/nieuws                             nieuwsoverzicht met paginering
/nieuws/pagina/2                    volgende pagina's
/nieuws/[slug]                      artikel
/nieuws/kwiek-inside                videoserie
/wedstrijden/programma              filterbaar op team, thuis of uit, en soort
/wedstrijden/uitslagen
/wedstrijden/standen
/wedstrijd/[wedstrijdcode]          53 wedstrijddetailpagina's
/teams                              overzicht
/teams/[id]                         6 teampagina's
/club/bestuur                       bestuur en commissies
/club/lid-worden                    aanmelden en wijzigen, met tabwissel
/club/agenda
/club/verjaardagen                  per maand
/club/minutenspel
/club/informatiebulletin            documenten en richtlijnen kunstgras
/club/ereleden
/vrijwillige-diensten               het rooster als tabel op de pagina
/sponsoring                         vier niveaus op een pagina
/contact
/privacyverklaring
/avg
/404
```

De speeldagenkalender is vervallen. De clubwinkel is geen eigen pagina maar een
menu-item dat rechtstreeks naar
[kwiek78.clubwereld.nl](https://kwiek78.clubwereld.nl/) gaat, in een nieuw
tabblad.

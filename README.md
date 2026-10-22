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

Node 22. Voor echte wedstrijddata is alleen `SPORTLINK_CLIENT_ID` nodig, in
`.env` (zie `.env.example`); zonder draait de site op demodata. Geen database,
geen buildserver met bijzondere instellingen. De uitvoer in `/dist` is platte
HTML, CSS en een paar kilobyte JavaScript, en kan op elke statische host.

### Hulpscripts

```bash
npm run nieuws                               # haalt de nieuwsberichten van kwiek78.nl
npm run thumbnails                           # haalt de thumbnails van Kwiek Inside
npm run fotos                                # verkleint /_bronfotos naar /public/images
node scripts/clublogos-genereren.mjs         # tijdelijke wapens van tegenstanders
node scripts/sponsorlogos-genereren.mjs      # tijdelijke sponsorlogo's
node scripts/standen-genereren.mjs           # poulestanden, met controle op consistentie
node scripts/dummydata-genereren.mjs         # verjaardagen, dienstenrooster
```

De onderste vier zijn alleen voor de demo en kunnen weg zodra de echte bronnen
zijn aangesloten. De bovenste twee blijven bruikbaar: die halen echte data op.

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

Er staat bewust **geen Content-Security-Policy** in `_headers`. De video's laden
een iframe van YouTube zodra de bezoeker daarop klikt; een CSP moet daar rekening mee houden en die stel je op zodra het eigen
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
Het minutenspel is de echte trekking van seizoen 2026-2027. Wedstrijden, teams,
standen, verjaardagen, nieuws, agenda en diensten zijn voorbeeldmateriaal.

| Bestand | Inhoud | Toekomstige bron |
|---|---|---|
| `wedstrijden.json` | 53 wedstrijden, waarvan 3 afgelast | Sportlink, nu aangesloten |
| `teams.json` | 6 teams met selectie, staf en trainingstijden | Sportlink |
| `standen.json` | 5 poulestanden | Sportlink |
| `verjaardagen.json` | 134 leden, alleen dag en maand | Sportlink |
| `nieuws.json` | 12 echte berichten, in Graph-API-vorm | kwiek78.nl, `npm run nieuws` |
| `agenda.json` | 12 activiteiten | eigen beheer |
| `diensten.json` | 135 vrijwilligersdiensten | eigen beheer |
| `sponsoren.json` | 8 sponsoren, echte namen | eigen beheer |
| `bestuur.json` | 21 functies, **echte gegevens** | eigen beheer |
| `ereleden.json` | 26 namen, **echte gegevens** | eigen beheer |
| `bulletins.json` | 5 documenten | eigen beheer |
| `minutenspel.json` | 90 minuten, **echte trekking** 2026-2027 | eigen beheer |
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

## De Sportlink-koppeling

De site haalt wedstrijden, teams, standen en verjaardagen live uit Sportlink.

### Hoe het werkt

```
npm run build
  1. scripts/sportlink-ophalen.mjs   haalt alles op bij data.sportlink.com
                                     en schrijft src/data/sportlink/*.json
                                     plus de clubwapens naar public/images/clubs/sportlink
  2. astro build                     src/lib/sportlink.ts leest die bestanden
```

Het client_id staat in de omgevingsvariabele `SPORTLINK_CLIENT_ID`:

- **lokaal** in `.env` (staat in `.gitignore`, zie `.env.example`)
- **op Cloudflare** onder **Settings → Variables and Secrets**, voor Production
  en Preview

Is die variabele niet gezet, dan slaat het script zich over en valt
`sportlink.ts` terug op de demodata in `src/data/*.json`. De melding
"Demo-omgeving" in de voettekst verschijnt alleen dan.

Antwoordt Sportlink niet tijdens een build op Cloudflare, dan faalt die build
met opzet. Cloudflare laat dan de vorige versie staan, in plaats van dat er
ineens demodata live gaat.

Lokaal ophalen zonder te bouwen: `npm run sportlink`.

**De opgehaalde data staat niet in git.** De repository is openbaar en de
selecties bevatten namen van leden, ook van kinderen. Daarom staan
`src/data/sportlink/` en `public/images/clubs/sportlink/` in `.gitignore` en
worden achternamen van jeugdspelers al in het script ingekort tot een letter.

### Bijblijven

De site is statisch, dus nieuwe uitslagen of een afgelasting staan er pas na
een nieuwe build. Daarvoor is `.github/workflows/herbouwen.yml`: elke ochtend
een build, en op zaterdag en zondag elk uur. Eenmalig instellen:

1. Cloudflare: **Pages → project → Settings → Builds → Deploy hooks**, hook
   aanmaken op branch `main`.
2. GitHub: **Settings → Secrets and variables → Actions**, secret
   `CF_DEPLOY_HOOK` met die url.

Een afgelasting op zaterdagochtend kan ook direct: **Actions → Site herbouwen →
Run workflow**. Dat zijn ongeveer 130 builds per maand, ruim binnen de 500 van
het gratis Cloudflare-plan.

### Welke artikelen worden gebruikt

| Functie | Sportlink-artikel |
|---|---|
| `getProgramma()`, `getEerstvolgendeWedstrijd()` | `programma`, `afgelastingen` |
| `getUitslagen()` | `uitslagen` (vanaf 1 juli van het seizoen) |
| `getPoulestand(teamId)` | `poulestand` |
| `getTeams()`, `getTeam(id)` | `teams`, `team-indeling` |
| `getVerjaardagen()` | `verjaardagen` |
| aanmeldformulier | `aanmeldenaspirantlid-form` (nog niet aangesloten) |

### Wat Sportlink anders aanlevert dan de demo

- **Clubnaam.** Sportlink schrijft "Kwiek 78"; het script maakt er overal
  "Kwiek '78" van. De clubcode is **BBFW592**.
- **Jeugdteams** heten tegenwoordig O17-1 in plaats van JO17-1.
- **Teams.** Alle veld- en zaalteams uit een bondscompetitie komen op de site,
  nu negentien. In het menu staan alleen de seniorenteams los; de jeugd (ook de
  meidenteams) staat op `/teams`, de zaalteams daar onder "Zaalvoetbal".
  Lokale teams niet; hun wedstrijden staan wel in het programma. Wedstrijden
  worden op teamcode aan een team gekoppeld, want het futsalteam en het
  veldteam heten in Sportlink allebei "Kwiek 78 1". Op de site heet het
  zaalteam "Kwiek '78 Zaal 1" (id `kwiek-78-zaal-1`).
- **Selecties** hebben geen rugnummers of posities; de teampagina laat die
  kolom dan weg. **Trainingstijden**, fotobijschriften en een introtekst levert
  Sportlink niet: die houdt de club bij in `src/data/teaminfo.json`, per
  team-id. Staat er voor een team niets, dan verwijst de pagina naar de
  trainer.
- **Clubwapens** zijn bij Sportlink links die na een paar uur verlopen. Het
  script slaat ze daarom op en de site serveert ze zelf.
- **Verjaardagen.** Sportlink geeft alleen de jarigen van de komende paar
  weken, met de naam als een geheel en zonder team. `/club/verjaardagen` is
  daarom geen maandkalender meer maar een lijst "binnenkort jarig". Staat een
  jarige in een jeugdselectie, dan neemt het script de verkorte naam en het
  team over uit de teamindeling, zodat de AVG-regel voor de jeugd ook hier
  geldt.

### AVG bij de koppeling

Dit is het punt waarop het bestuur gaat letten.

Een lid of ouder stelt in de KNVB-app zelf in hoe zichtbaar hij is. Sportlink
geeft een afgeschermd lid terug als "Afgeschermd"; het script zet die om naar
niveau 2. De site rekent met drie niveaus:

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

## Nieuws

De berichten op de site zijn **echt**: twaalf stuks, opgehaald van kwiek78.nl
met `npm run nieuws`. Inclusief de foto's, die verkleind naar
`/public/images/nieuws` worden gezet.

### Waarom niet van Facebook

Dat was het oorspronkelijke plan, maar Facebook laat zich niet meer publiek
uitlezen. Nagemeten, niet aangenomen:

| Weg | Uitkomst |
|---|---|
| Graph API zonder token | `OAuthException` code 104, token verplicht |
| De pagina zelf ophalen | 302 naar een inlogscherm, daarna 400 |
| `feeds/page.php?format=rss20` | 404, deze feeds bestaan niet meer |
| `/{id}/posts/rss` | 200, maar geeft HTML terug, geen RSS |

De enige echte weg naar Facebook is een Page Access Token, en daarvoor moet de
club ons een rol geven op hun pagina. Dat hoeft nu niet meer, want **dezelfde
berichten staan ook op kwiek78.nl** en die zijn gewoon op te halen.

Dat is bovendien de betere bron. Daar staat een echte kop boven het bericht,
op Facebook niet. Er is geen token dat verloopt of wordt ingetrokken. En de
club hoeft niets te regelen.

### Als de club later toch Facebook wil

`src/data/nieuws.json` heeft bewust dezelfde vorm als wat de Facebook Graph
API teruggeeft, dus dan hoeft alleen de aanlevering te wisselen en blijft de
adapter ongewijzigd:

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

### 1. Sportlink — geregeld

Het client_id is binnen en de koppeling werkt, zie **De Sportlink-koppeling**.
Nog te doen door Brand-On: `SPORTLINK_CLIENT_ID` in Cloudflare zetten en de
Deploy Hook plus het GitHub-secret aanmaken.

### 2. Nieuws automatisch bijwerken — actie: Brand-On

Dit punt was eerst "Facebook-adminrechten". Dat is niet meer nodig: het nieuws
komt van kwiek78.nl. Zie het hoofdstuk **Nieuws** hierboven.

Wat nog moet gebeuren is het periodiek opnieuw ophalen. De site is statisch,
dus een nieuw bericht komt er pas in bij een nieuwe build. Twee regels werk:

1. In Cloudflare Pages een **Deploy Hook** aanmaken. Dat geeft een url die met
   een POST een build start.
2. Die url een keer per dag laten aanroepen, bijvoorbeeld met een gratis
   GitHub Action op een schema.

Dan staat een bericht dat de club plaatst binnen een dag op de nieuwe site,
zonder dat iemand iets hoeft te doen.

Belangrijk voor later: `npm run nieuws` schrijft het resultaat naar
`src/data/nieuws.json` en dat bestand staat in git. Gaat kwiek78.nl een keer
plat, dan bouwt de site gewoon door met de laatste versie die er lag.

Zolang de club de oude site nog gebruikt, is dat de bron. Stopt die ooit, dan
zijn er twee wegen: alsnog de Facebook-koppeling (dan is die rol op de pagina
wel nodig) of een klein eigen beheerscherm.

### 3. Beeldmateriaal — actie: club

Zie **IMAGES.md** voor de volledige lijst met verwachte bestandsnamen en
formaten. Kort samengevat ontbreekt nog:

- teamfoto's van JO17-1, JO12-1 en MO9-1
- echte logo's van vijf sponsoren en van de tegenstanders
- de vijf PDF-documenten voor het informatiebulletin

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

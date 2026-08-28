# Beeldmateriaal v.v. Kwiek '78

Alle beeld staat in `/public/images/`. De site kijkt tijdens de build of een
bestand er staat. Ontbreekt het, dan komt er een nette plaatshouder met de
juiste verhouding en de verwachte bestandsnaam erin. Er verschijnt dus nooit
een gebroken plaatje, en je ziet in de demo meteen wat er nog mist.

**Bestandsnamen zijn exact.** Zet je een foto met de juiste naam in de juiste
map en draai je `npm run build` opnieuw, dan staat hij op de site. Er hoeft
verder niets te worden aangepast.

**Formaat.** Lever bij voorkeur `.webp` aan. Kun je alleen `.jpg` leveren, zet
het bestand dan in `_bronfotos/` en draai `npm run fotos`; dat script schaalt
de foto en zet hem als webp op de juiste plek. De originelen die de club heeft
aangeleverd waren 12 tot 13 MB per stuk; ongeschaald op een website zetten is
geen optie voor iemand die op zaterdagochtend op 4G kijkt.

**Kleur.** Lever de foto's gewoon in kleur aan. De site zet er geen grijsfilter
meer overheen; dat maakte het geheel somber, en een voetbalclub is dat niet.

> **`_bronfotos/` staat niet in git.** Die map bevat de originelen en is samen
> zo'n 38 MB; dat hoort niet in een repository die bij elke build wordt
> gekloond. De verkleinde bestanden in `public/images` staan er wel in, dus de
> site bouwt overal. Bewaar de originelen in de klantmap, niet alleen op een
> laptop.

---

## Status

| | |
|---|---|
| Aanwezig | 10 bestanden |
| Nog nodig | 17 bestanden |

---

## 1. Logo's en clubwapens

`/public/images/logos/`

| Bestand | Formaat | Status | Waarvoor |
|---|---|---|---|
| `kwiek-78.png` | 512 x 300, transparant | **aanwezig** | koptekst, voettekst, favicon |
| `kwiek-78-wapen.png` | 192 x 192 | **aanwezig** | wedstrijdrijen en apple-touch-icon |

Beide komen uit `_bronfotos/logo-512.png` en worden gemaakt door `npm run fotos`.

Er is bewust **geen omgekeerde variant** van het logo, en er is er ook geen
nodig. Het bestand bestaat uit opake witte vlakken met zwarte lijnen erin, dus
op een zwarte ondergrond blijven de bal en de banier gewoon kloppen. Het logo
staat in de koptekst en de voettekst rechtstreeks op het zwart.

Bij het omkeren zouden de panelen van de voetbal omklappen en dan klopt het
logo niet meer. Lever dus geen witte variant aan.

De wapens van de tegenstanders zijn nu **tijdelijke tegels** met de eerste
letters van de clubnaam, gegenereerd door
`node scripts/clublogos-genereren.mjs`. Zodra de Sportlink-koppeling live is
levert Sportlink de echte logo-url mee in de velden `thuisteamlogo` en
`uitteamlogo` en kan dit script weg.

Wil je ze eerder vervangen, zet dan een bestand met dezelfde naam neer
(`.svg` of `.png`, vierkant, licht vlak met donkere inhoud zodat hetzelfde
bestand werkt op de zwarte panelen en op de witte roosterpagina's):

`rkedo` · `dirkshorn` · `kwadijk` · `vrone` · `victoria-o` · `de-wherevogels` ·
`beemster` · `purmerend` · `ksv` · `koedijk` · `oosthuizen` · `hauwert-65` ·
`spirit-30` · `sporting-andijk` · `grasshoppers` · `zouaven`

---

## 2. Teamfoto's

`/public/images/teams/` verhouding **16:10**, minimaal 1600 px breed.

| Bestand | Status |
|---|---|
| `kwiek-78-1.webp` | **aanwezig** |
| `kwiek-78-2.webp` | **aanwezig** |
| `kwiek-78-vr1.webp` | **aanwezig** |
| `kwiek-78-jo17-1.webp` | nog nodig |
| `kwiek-78-jo12-1.webp` | nog nodig |
| `kwiek-78-mo9-1.webp` | nog nodig |

De bestandsnaam is altijd het team-id uit `src/data/teams.json`.

**Let op bij jeugdteams.** Voor een teamfoto met herkenbare minderjarigen is
toestemming van de ouders nodig. Bij aanmelding wordt dat gevraagd, maar voor
de bestaande jeugd moet dat nog worden nagelopen. Zie README, openstaande
punten.

---

## 3. Sfeer- en clubfoto's

`/public/images/club/`

| Bestand | Verhouding | Status | Waarvoor |
|---|---|---|---|
| `sfeer-veld.webp` | 4:3 of breder, min. 2000 px | **aanwezig** | achtergrond van de hero op de homepage |
| `veteranen.webp` | vrij | **aanwezig** | nieuwsberichten |
| `kwiek-35plus.webp` | vrij | **aanwezig** | nieuwsberichten |
| `kaart-sportpark.webp` | 4:3, min. 1200 px | nog nodig | statische kaart op de contactpagina |

De kaart is een uitsnede van de omgeving van Het Veer 92 met het sportpark in
beeld. Die wordt alleen getoond tot iemand op "Kaart laden" klikt; daarna komt
OpenStreetMap in beeld.

De hero op de homepage staat of valt met de sfeerfoto. Een volle zijlijn of een
wedstrijdmoment werkt beter dan een leeg veld.

---

## 4. Portretten bestuur en commissies

**Niet nodig.** De bestuurspagina werkt zonder foto's. De club heeft ze niet,
en gaten opvullen met plaatshouders maakt zo'n pagina onrustiger, niet
completer. Wat mensen daar komen halen is een naam en een manier om die persoon
te bereiken, en dat staat er nu zonder omweg.

Komen er ooit wel portretten, dan is dat een aparte ontwerpronde. Losse foto's
van wisselende kwaliteit door elkaar zetten valt harder op dan helemaal geen
foto's.

---

## 5. Nieuwsberichten

`/public/images/nieuws/` verhouding **16:9**, minimaal 1200 px breed.

Nu hergebruiken de dummyberichten bestaande foto's. Zodra de koppeling met de
Facebook Graph API er is, komt de afbeelding rechtstreeks uit het veld
`full_picture` van de Facebookpost en is deze map niet meer nodig.

Voor redactionele artikelen die niet van Facebook komen (`bron: "cms"`) zet je
het beeld hier neer en verwijs je ernaar in `src/data/nieuws.json`.

---

## 6. Kwiek Inside

`/public/images/kwiek-inside/` verhouding **16:9**, minimaal 1280 px breed.

| Bestand | Status |
|---|---|
| `kwiek-inside-01.webp` t/m `kwiek-inside-06.webp` | nog nodig |

Dit zijn de thumbnails. De YouTube-speler wordt pas geladen nadat er op de
thumbnail is geklikt, dus deze afbeelding is wat de bezoeker als eerste ziet.
Een still uit de aflevering werkt beter dan een titelkaart.

**Ook nog nodig:** de YouTube-video-id's zelf. Die vul je in bij `youtubeId`
in `src/data/videos.json`. Nu staat daar `null`, en dan wijst de kaart naar het
kanaal in plaats van dat hij insluit.

---

## 7. Sponsorlogo's

`/public/images/sponsoren/` liggend, ongeveer **320 x 120**, transparant of
met een witte achtergrond. De site toont ze in kleur.

| Bestand | Status |
|---|---|
| `kramer-keukens.webp` | **aanwezig** |
| `dralco.webp` | **aanwezig** |
| `braas-en-partners.webp` | **aanwezig** |

De overige vijf zijn **tijdelijke woordmerktegels**, gemaakt met
`node scripts/sponsorlogos-genereren.mjs`. Het script slaat bestaande bestanden
over, dus zodra je een echt logo neerzet met dezelfde naam blijft dat staan:

`kwakman-groep` · `wessels-rolluikenfabriek` · `vi-travel` ·
`duijn-teamsport` · `sportcafe-de-koggenhal`

Zet je een `.png` of `.webp` neer in plaats van `.svg`, pas dan het veld `logo`
aan in `src/data/sponsoren.json`.

> De Club van '78 en de All Stars staan niet in dit overzicht. Dat zijn geen
> bedrijven met een logo maar particulieren die meebetalen. Zij hebben op de
> sponsoringpagina een eigen sectie met uitleg en een aanmeldformulier.

---

## 8. Documenten

`/public/documenten/` PDF.

| Bestand | Status |
|---|---|
| `informatiebulletin-2026-2027.pdf` | nog nodig |
| `richtlijnen-kunstgras.pdf` | nog nodig |
| `huishoudelijk-reglement.pdf` | nog nodig |
| `gedragscode-vrijwilligers.pdf` | nog nodig |
| `contributie-2026-2027.pdf` | nog nodig |
| `inschrijfformulier-club-van-78.pdf` | nog nodig |

De bestandsnamen en de omschrijvingen staan in `src/data/bulletins.json`, op
het inschrijfformulier van de Club van '78 na; die link staat in
`src/pages/sponsoring.astro`.

---

## 9. Lettertypes

`/public/fonts/` Deze staan er al en hoeven niet te worden aangeleverd.

| Bestand | Rol |
|---|---|
| `anton-latin.woff2` | Anton, de koppen. De stem van een wedstrijdposter. |
| `barlow-400/500/600/700-latin.woff2` | Barlow, alle lopende tekst en de knoppen. |
| `barlow-condensed-700-latin.woff2` | Barlow Condensed, labels, namen en tabelkoppen. |

Ze worden lokaal geserveerd, dus de site doet geen enkel verzoek naar Google.

---

## Wat de site doet als een bestand ontbreekt

- **Foto's** krijgen een plaatshouder met precies dezelfde verhouding, met de
  verwachte bestandsnaam erin. De layout verschuift dus niet wanneer het echte
  beeld later binnenkomt.
- **Clubwapens** worden een tegel met de eerste letters van de clubnaam.
- **Sponsorlogo's** worden een woordmerk in de huisletter.
- **Documenten** blijven een link; die geeft een 404 tot het bestand er staat.
  Op de informatiebulletinpagina staat daarom een zin dat de bestanden nog
  worden aangeleverd.

Dat gebeurt allemaal tijdens de build, in `src/lib/fotos.ts`. Er wordt niets
aan de bezoeker gevraagd en er komt geen enkel mislukt verzoek uit voort.

# Beeldmateriaal v.v. Kwiek '78

Alle beeld staat in `/public/images/`. De site zoekt tijdens de build of een
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
| Nog nodig | 41 bestanden |

---

## 1. Logo's en clubwapens

`/public/images/logos/`

| Bestand | Formaat | Status | Waarvoor |
|---|---|---|---|
| `kwiek-78.png` | 512 x 300, transparant | **aanwezig** | favicon, zwarte varianten |
| `kwiek-78-wit.png` | 512 x 300, transparant | **aanwezig** | koptekst en voettekst, op zwart |
| `kwiek-78-wapen.png` | 192 x 192 | **aanwezig** | wedstrijdpanelen en wedstrijdrijen |

De wapens van de tegenstanders zijn nu **tijdelijke tegels** met de eerste
letters van de clubnaam, gegenereerd door
`node scripts/clublogos-genereren.mjs`. Zodra de Sportlink-koppeling live is
levert Sportlink de echte logo-url mee in de velden `thuisteamlogo` en
`uitteamlogo` en kan dit script weg.

Wil je ze eerder vervangen, zet dan een bestand met dezelfde naam neer
(`.svg` of `.png`, vierkant, wit vlak met zwarte inhoud zodat hetzelfde
bestand op de zwarte panelen en de witte roosters werkt):

`rkedo` · `dirkshorn` · `kwadijk` · `vrone` · `victoria-o` · `de-wherevogels` ·
`beemster` · `purmerend` · `ksv` · `koedijk` · `oosthuizen` · `hauwert-65` ·
`spirit-30` · `sporting-andijk` · `grasshoppers` · `zouaven`

---

## 2. Teamfoto's

`/public/images/teams/` — verhouding **16:10**, minimaal 1600 px breed.

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
beeld. Zwart-wit mag; de site zet er toch een grijsfilter overheen. Wordt
alleen getoond tot iemand op "Kaart laden" klikt; daarna komt OpenStreetMap in
beeld.

---

## 4. Portretten bestuur en commissies

`/public/images/bestuur/` — **vierkant**, minimaal 600 x 600 px.

Bestandsnaam is de naam in kleine letters met streepjes:
`Cees Balk` wordt `cees-balk.webp`.

Nodig voor 29 personen:

`cees-balk` · `wilma-sneekes` · `gerard-kok` · `astrid-klaver` · `ron-kramer` ·
`michel-bood` · `marloes-vriend` · `erwin-sneekes` · `sandra-bood` ·
`peter-bood` · `nico-ruiter` · `ted-bijl` · `hans-wagenaar` · `wilma-bakker` ·
`ans-overtoom` · `jaap-sijm` · `truus-karsten` · `piet-schuit` ·
`klaas-neefjes` · `robert-appelman` · `marnix-sijm` · `youri-sijm` ·
`femke-nooij` · `carla-kramer` · `dave-vlaar` · `nadine-kuip` · `anja-klaver` ·
`jeroen-pronk`

Alles wat ontbreekt krijgt een plaatshouder in de juiste verhouding, dus de
pagina blijft er heel uitzien terwijl de foto's binnendruppelen.

**Tip voor de fotograaf:** neem ze op een gelijke achtergrond en op gelijke
afstand. De site zet er een grijsfilter overheen, dus kleur van de kleding
maakt niet uit, maar wisselende uitsneden vallen wel op in het raster.

---

## 5. Nieuwsberichten

`/public/images/nieuws/` — verhouding **16:9**, minimaal 1200 px breed.

Nu hergebruiken de dummyberichten bestaande foto's. Zodra de koppeling met de
Facebook Graph API er is, komt de afbeelding rechtstreeks uit het veld
`full_picture` van de Facebookpost en is deze map niet meer nodig.

Voor redactionele artikelen die niet van Facebook komen (`bron: "cms"`) zet je
het beeld hier neer en verwijs je ernaar in `src/data/nieuws.json`.

---

## 6. Kwiek Inside

`/public/images/kwiek-inside/` — verhouding **16:9**, minimaal 1280 px breed.

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

`/public/images/sponsoren/` — liggend, ongeveer **320 x 120**, transparant of
witte achtergrond, zwarte of donkere inhoud. De site zet ze in de carousel in
grijstinten en toont ze in kleur bij hover.

| Bestand | Status |
|---|---|
| `kramer-keukens.webp` | **aanwezig** |
| `dralco.webp` | **aanwezig** |
| `braas-en-partners.webp` | **aanwezig** |

De overige 19 zijn nu **tijdelijke woordmerktegels**, gegenereerd door
`node scripts/sponsorlogos-genereren.mjs`. Het script slaat bestaande bestanden
over, dus zodra je een echt logo neerzet met dezelfde naam blijft dat staan:

`kwakman-groep` · `wessels-rolluikenfabriek` · `vi-travel` ·
`duijn-teamsport` · `sportcafe-de-koggenhal` · `bouwbedrijf-appelman` ·
`de-koggeslager` · `installatiebedrijf-sijm` · `hoveniersbedrijf-beerepoot` ·
`autoschade-karsten` · `kapsalon-nooij` · `transportbedrijf-groot` ·
`bakkerij-klaver` · `loonbedrijf-vriend` · `rijschool-molenaar` ·
`fysio-avenhorn` · `schildersbedrijf-blank` · `tuincentrum-koggenland` ·
`elektro-neefjes`

Zet je een `.png` of `.webp` neer in plaats van `.svg`, pas dan het veld `logo`
aan in `src/data/sponsoren.json`.

---

## 8. Documenten

`/public/documenten/` — PDF.

| Bestand | Status |
|---|---|
| `informatiebulletin-2026-2027.pdf` | nog nodig |
| `richtlijnen-kunstgras.pdf` | nog nodig |
| `huishoudelijk-reglement.pdf` | nog nodig |
| `gedragscode-vrijwilligers.pdf` | nog nodig |
| `contributie-2026-2027.pdf` | nog nodig |

De bestandsnamen en de omschrijvingen staan in `src/data/bulletins.json`.

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

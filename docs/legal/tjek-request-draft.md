# Udkast: henvendelse til Tjek om datalicens

Til: services@tjek.com
Emne: Forespørgsel om kommerciel API-adgang og datalicens til madplan-tjeneste

---

Hej Tjek

Jeg er ved at bygge foodplanr, en dansk madplan-tjeneste, der hjælper husstande med at planlægge ugens
aftensmad og handle ind efter ugens tilbud i de kæder, de selv vælger. Jeg vil gerne indgå en aftale om
adgang til jeres API og brug af tilbudsdata, som beskrevet i jeres vilkår (pkt. 8.3 om tredjeparts
kommerciel brug).

**Hvad tjenesten gør**
Brugeren svarer på fem spørgsmål (personer, butikker, budget, råvarer, kalorier), vælger en madplan fra
vores egen opskriftspulje og får en indkøbsliste pr. butik, hvor ugens tilbud er brugt, hvor det kan betale
sig. Hver tilbudslinje viser tilbuddets varenavn, pris, gyldighedsperiode og kæde. Tjenesten sender dermed
købsklare brugere videre til jeres kunders tilbud. Den viser ikke tilbudsaviser og konkurrerer ikke med
Tjek-appen.

**Hvad vi ønsker at hente og gemme**
Kun faktuelle felter pr. tilbud: forhandler-id, tilbudsavis-id, tilbuds-id, varenavn (heading), pris,
førpris, valuta, gyldighed fra/til og mængde (størrelse, enhed, antal). Vi gemmer ikke beskrivelser,
billeder, sider eller andet redaktionelt indhold, og vi viser ingen billeder fra jer.

**Hvordan data behandles**
- Tilbud gemmes i gyldighedsperioden plus 14 dage. Derefter beholder vi kun aggregerede tal
  (enhedspris pr. råvare og kæde pr. uge) som normalpris-reference.
- Varenavn og mængde sendes til en sprogmodel for at kategorisere tilbuddet til en råvare i vores egen
  ontologi. Der trænes ikke modeller på jeres data (jf. jeres pkt. 8.6). Vi beder om, at denne brug
  fremgår eksplicit af aftalen.
- Data hentes én gang dagligt (ca. kl. 06) for alle danske dagligvarekæder. Vi respekterer rate limits og
  Retry-After.
- Alle poster er mærket med kilde, så alt fra Tjek kan slettes med én operation, hvis aftalen ophører.

**Hvor data vises**
I vores web-app (PWA) og senere native app, i både en gratis og en betalt udgave. Vi viser den
kildeangivelse, I ønsker, hvor tilbud vises.

**Det vi gerne vil aftale**
1. API-adgang med nøgle til produktion.
2. Skriftlig bekræftelse af hvilke felter vi må hente, gemme og vise, og i hvilken periode.
3. Godkendelse af afledt prishistorik (kun tal).
4. Godkendelse af LLM-baseret kategorisering af varenavne.
5. Krav til kildeangivelse.
6. Pris, løbetid og opsigelse.

Vi kan vise en fungerende prototype på egne testdata, hvis det er nyttigt for jer at se, hvordan tilbud
præsenteres.

Med venlig hilsen
Kasper Brøndum
foodplanr
[telefon] · [mail]

---

## Når svaret kommer

Følg runbooken i [tjek.md](tjek.md): gem aftalen her, udfyld bekræftelsesblokken, sæt `approved` med
`agreement_ref`, læg nøglen i `.env`, verificér API-formatet, map forhandlere, kør snapshot.

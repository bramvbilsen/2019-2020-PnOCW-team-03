# ID1
- Tijd wordt nergens vermeld: geen deadlines, verwachte duur.
- Zijn al deze taken onafhankelijk? Kunnen alle taken afzonderlijk behandeld worden zonder invloed op de andere taken.
- Adam en Sebastiaan werken maar op 1 van de zes taken en UI moet enkel `made a little bit better`? Dit lijkt geen correcte werkverdeling.

# ST1.1 (Bram Vanbilsen, Adam El M'Rabet, Liam Volckerick)
- Mooie lijst met referenties!
- Niet alle referenties werden in de tekst besproken: 10, 14, 17, 21, 22, 24. Verwijder of bespreek ze.
- Plaats citaties ([x]) altijd voor het punt.
- Combineer opeenvolgende citaties: \cite{x}, \cite{y} → \cite{x,y}
- `clocks might vary depending on multiple factors [4]`: geef gerust een korte lijst met de belangrijkste invloeden. (de lijst komt 5 pagina's later)
- Gebruik een meer formele taal dan `time.is has some bugs`
- Gebruik de correct accenten. 'synchronized' (single quote) ↔ ‘ntp.UGent.be‘ (backticks). Gebruik een combinatie van backtick en single quote in de plaats.
- Opmerkingen bij average en median
  - Je zegt beide waarden te geven, maar in de figuur toon je enkel `Windows AVERAGE Chart`. Ik zou verwachten dat je juist hier median gebruikt.
  - misschien geen van beiden gebruiken als je de figuur uiteindelijk beschrijft in je teskt en alle informatie in 1 figuur kunt tonen.
- straight forward → straightforward
- `It’d`:  blijf formeel in een tekst als deze: `it would
- Chart 3 → Figure 3
- Mooie en duidelijk verwoorde conclusie

# ST2.1 (Sebastiaan Wouters, Maarten Pyck, Pieter-Jan Van den Broecke)
- Geen referenties!
- slaves’ screens → slave screens
- Zin in zin: gebruik --- ipv - in LaTeX
- In what follows we will be discussing →  discuss
- Was het niet duidelijker geweest om ook voor- zij- en bovenaanzicht te geven in plaats van enkel de boxen zelf?
- Bepaalt de kleur van een punt de inputkleur?
- Beschrijf uw database. Welke kleuren,  camera's, schremen, hoeveel samples per situatie, ...
- Geen conclusie bij §3.4
- Kun je geen conclusie maken over welk kleur het best gebruikt wordt?
- `This allowed us to start our animation at the same time across multiple devices.` Durf je nog een dergelijk eenvoudig statement maken na alle nuances die je in het vorig verslag zelf aanhaalde?


# ST1.2 (Bram Vanbilsen, Adam El M'Rabet, Liam Volckerick)
- Waarom referenties in aparte zinnen? . [1]. ⇒ [1].;  . [8]. ⇒ [8].
- We therefor decided ⇒ We therefore decided https://www.grammarly.com/blog/therefore-vs-therefor/
- Waarom leggen jullie het verschil tussen Layout, Paint en Composite uit als je daarna niet uitlegt welke van die drie technieken de animaties die jullie testen gebruikt?
- like it is shown ⇒ as is shown https://www.grammarly.com/blog/like-vs-as/
- Every strategy has its pros and cons: waar, maar vermijd het vermelden van dergelijke waarheden in een paper.
- Mooie en goed onderbouwde conclusie, beide door literatuur en testen.

# ST2.2  (Sebastiaan Wouters, Maarten Pyck, Pieter-Jan Van den Broecke)
- Slordig verslag.
- Check eens de punten die ik gaf voor ST1.1, dan hoef ik die opmerkingen niet te herhalen. Het kan ook nuttig zijn het andere deel van je team commentaar te geven voor ik dat doe.
- Median filter: eerst uitleggen wat het doet (met de referentie) en dan pas uitleggen waarom het nuttig is.
- Waarom verwijs je bij `For a given pixel we can already conclude whether or not it is adequately close to the colour we search` naar [3]. Dit mag duidelijker zijn.
- Wat als een blok minder dan 1000 pixels bevat?
- Zoals eerder besproken: ...manually surveyed..., zelfs als je in woorden uitlegt waar je op let heb ik bijvoorbeeld geen idee hoe pixels die in de mask ingebrepen zijn, maar niet in het scherm liggen bestraft worden
- Voeg de link naar de dataset toe.
- `blue images` en `close-up`: wat bedoel je hiermee? Moet uitgebreider anders heeft een buitenstander geen idee waarover je spreekt en kan je het evengoed weglaten.
- Blue and green are better [...]: wees specifiek, niet vaag. Waarin zijn die kleuren beter? (als kleuren al ergens goed in zijn)
- Referenties naar alle figuren kloppen niet, figuren zijn afwezig...  Mail werd gestuurd met link naar https://github.com/MaartenTaylor/dataset_colordetection, ik vind niet terug welke foto's in het verslag gebruikt werden.
- Zwakke conclusie:
  - `While some errant blocks are recognized, we can attempt to filter out these false positives.` Dit is veel gemakkelijker gezegd dan gedaan volgens mij.
  - `We also note that we have reliably found the corners of the screens.` je legt niet uit hoe
  - `In conjunction with a convex hull algorithm, run on the blocks, we could find the corner points of the screens with even more precision, eliminating missing areas within the screen, which can be caused by darkness or reflection.` Je hebt geen referentie noch testen die deze bewering staaft.


# ID2 (Bram Vanbilsen, Sebastiaan Wouters)
- De code review behandelt een groot stuk code en maakt duidelijk dat een heleboel ongebruikte code aanwezig is. `remove this. If it turns out to be useful after all, use git` is ook volgens mij de oplossing.
- De best practices zijn goed geargumenteerd met de nodige referenties.
- Duidelijk overzicht over de verbetering van de code na de vorige code reviews.
- Ik mis bespreking van de correctheid van de code.
- Doordat de template niet werd gebruikt mis ik de LOC. De werkuren lijken weinig. Is dit enkel de duur van het schrijven van het verslag? 

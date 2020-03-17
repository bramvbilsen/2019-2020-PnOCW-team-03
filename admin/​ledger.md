# Ledger

### Tweede semester

### 11/02:

Iedereen zijn nieuwe rol geven. Taken verdelen voor de eerste assignement en voor de TODO van code eerste semester. De eerste assignement werd ook opgestart.

### 13/02

CR1, TC3: Werkten aan de task van Browser synchronization, hebben een script gemaakt om de tests te runnen. Dinsdag zal deze worden gebruikt voor de resultaten te verkrijgen.

CEO, CR2, CTO: Werkten aan de task van color recognition, hebben een plan uitgedacht en een algoritme om te loopen over de individuele pixels van een afbeelding is reeds gemaakt. Tegen volgende zitting wordt het script vervolledigt zodat het rgb differences,... kan berekenen en automatisch opslaagt.

CEO: Plan of attack afgemaakt.

### 18/02

CR1, TC3, TC4: Zochten informatie op over NTP, hebben de NTP tests uitgevoerd op verschillende computers en zijn beginnen schrijven aan het verslag voor de eerste taak van synchronisatie.

CEO, CR2, CTO: Werkten verder aan het script voor automatische data analyse op een folder met foto's van schermen en zijn beginnen schrijven aan het verslag.

### 20/02

CR1, TC3, TC4: Werkten verder aan het verslag en CR1 maakte een app om de NTP tests te kunnen runnen op de smartphone.

CEO, CR2, CTO: Hebben verder aan het verslag geschreven + eerste bugvrije testen op een kleine dataset.

### 25/02

CR1, TC3, TC4: Maakten de data analyse en het verslag van taak 1 voor synchronisatie af.

CEO, CR2, CTO: Implementeerden HSV support voor de automatische data analyse na een onderzoek voor het verschil tussen HSV en HSL te begrijpen.

### 27/02

CR1, TC3: Zijn begonnen aan tweede taak van synchronisatie. Hebben een animatie script gemaakt m.b.v. setInterval en hebben de frame rates bestudeerd.

CEO, CR2, CTO: Hebben de dataset vergroot met foto's uit de gedeelde git repository van alle teams. Er is ook een opdeling van categoriën gebeurd om later plots te kunnen maken.

### 03/03

All: Bespreken van hoever iedereen staat met plan of attack en geupdate versie maken.

CR1, TC3, TC4: Gewerkt aan de animatie taak 2. Testen op verschillende browers gedaan met busy loops.

CEO, CR2, CTO: Opstart taak 2 van colordetection.

### 05/03

CR1, TC3, TC4: IO socket and busy loop on server tests.

CTO, CR2: Werkten median blur filter verder aan.

CEO: Code van taak 1 aanpassen voor taak 2.

### 10/03

CR1, TC3, TC4: Hebben animatie met busy loops tests gedaan op verschillende laptops en browsers. De data werkt verwerkt en in het verslag geïmplementeerd.

CEO, CR2, CTO: Voorden experimenten uit voor de tweeden taak en maakten het verslag af.

**<u>Dates:</u>**

### 30/9:

First meeting. Getting to know each other and sort out our working strategies.

Everybody refamiliarised themselves with git and installed their preferred IDE.

First hands on socket.io application made and further testing of our website (localhost:3000).

CT1: Creating the github together with our CTO.

### 5/10:

CEO and TC1 worked further on backend and js algorithms for simple things on the front end side.

Others were looking for information regarding js and task 3.

### 7/10:

CTO, TC1 & TC2 working on server side of things: Making a user list, making sure socket.io tells us when a user is connected.

Being able to differentiate between units by assigning random colors to each screen.

The CEO and Code reviewer worked on implementing camera access and uploading the image to our server from the master's machine.

### 10/10:

CT2 & code reviewer worked on implementing a pixel detection algorithm based on given algorithm from the professor.

CT1 worked on finishing the image upload to the server as a blob and png.

CEO & CTO made sure we can display arrows to the slaves from the master via the google console.

### 14/10:

Refactoring the whole build/app for readability and re-usability purposes.

TC2&code reviewer 1 worked on the algorithm.

Code reviewer 2 joined the team and got briefed about our implementation by CEO.

### 17/10:

We all worked further on the screen recognition algorithm in regards of the implementation. No real progress was made that day.

### 21/10:

Verslag beginnen schrijven.

Code reviewers: Code review.

CEO, TC1,TC2, CTO: Edge detection algoritme verder uitgewerkt en de 4 deel algoritmen samengebracht tot 1 geheel.

### 24/10:

Algoritme overlopen en meer testcases gemaakt waarin ons algoritme zou voor moeten functioneren. Wat bij overlap? Wat in andere cases? Welke soort overlappen etc etc.

TC2: Begon met het schrijven van een convex hull algoritme voor beter de hoekpunten te kunnen reduceren uit de gevonden hoeken. Deadline: 26/10 (is gelukt)

TC1: Refactoring van het oorspronkelijke corner detection algoritme. Harris corner detection en openCV libraries zijn achterwege gelaten.

CTO: Verschil tussen master en slave invoeren op front end UI. Dit was voorheen nog niet goed uitgewerkt door onvolledigheid van het complete algoritme

CEO, CR1 & CR2: Research over Triangulatie en beginselen hiervan opzoeken.

### 28/10:

CEO: Mobile UI implementeren

CTO, TC2; TC1: Bugs op de site clearen, camera werd niet gedisplayed, waiting time implementeren voor de build, zodat files niet aangesproken worden vooraleer ze gebuild zijn. Bug fixes clearen op het hele werkende systeem, van capture tot het aanspreken en returnen van het algoritme en resultaat.

CR1 & CR2: Triangulatie verder onderzoeken en een concreet algoritme uit beginnen werken.

### 31/10:

CEO & TC1: Workflow bepaald voor het algoritme in client side, hoe gaan we meerdere slaves manipuleren en handlen, making buttons for displaying different colors on the slaves en working with the next slave. First trials on the server.

CTO & TC2: Working on orientation detection algorithm.

CR1&CR2: Worked further on implementing the triangulation algorithm given the middle points of each screen.

### 04/11:

CEO, TC1: verder gewerkt aan slaveflowHandler en het schrijven van report hiervan.
TC2, CTO: Gewerkt aan het algoritme van screen orientation detection. De report hiervan uitgewerkt. Het algoritme werkt nu zoals we hadden afgesproken (display on screens, hoek meeting, return de hoek van orientatie).
CR1: Verder gewerkt aan triangulatie. **Deadline volgende week (11/11).**
CR2: Code reviewing van alles dat geschreven is afgelopen week.

### 07/11:

CEO, CR2: Een concept zitten bedenken om cat casting mogelijk te maken. Volledig concept uitwerken in een pseudo algoritme. \*\*Deadline om alles geimplementeerd te krijgen: 18/11

TC1,TC2: Hebben verder gewerkt aan screendetection & orientationdetection, alsook testen zitten schrijven voor dit stuk code.

CTO&CR1 waren afwezig door ziekte deze meeting. Ik heb vernomen dat CR1 verder heeft gewerkt aan triangulatie(debuggen).

### 11/11:

CEO, TC2, CR2: Verder opdelen van het resterende werk om cat casting mogelijk te maken. Verdere bespreking van de workflow om dit mogelijk te krijgen. **TC2 maakt de affiene transformatie algoritme tegen volgende meeting(14/11).** Report schrijven.

CTO, CR1: Werken aan synchronization.

CR1: verder gewerkt aan Triangulation

### 12/11:

CEO,TC2,CR2: Report schrijven en testen rond cat casting. Elkaar verder helpen met het slicen van de image en de transformatie van img to screen.

CTO, TC2, CR1: Testcases voor synchronizatie. TC1 en CTO hebben het verslagdeel hiervan (synchronization) geschreven ook in de latere avond.

### 14/11:

CEO, TC2, CR2: Verder werken aan cat casting algoritme in zijn geheel. Herschrijven van enkele functies alsook het creëeren van een image casting workflow voor een cohesief geheel te maken. **Deadline zondag 17/11 om middernacht om het werkende te krijgen.**

TC1: Debuggen alsook het optimaliseren van cornerdetection. Hij zal de veranderde/versimpelde ui nog werkende zien te krijgen tegen **maandag 18/11.**

CTO: Heeft het design schematic gemaakt voor ons project.

CR1: Verder gewerkt aan triangulatie.

### 18/11:

We hebben allemaal verder gewerkt aan debuggen van rotatie om dit alsnog werkende te krijgen tegen het uur van de demo(niet gelukt). Uur van samenkomst deze dag 10h 's ochtends.

### 21/11:

We hebben besloten een andere aanpak te nemen van het bijhouden van alle gewerkte uren/samenwerking te beteren wanneer we apart staan te werken. Dit resultaat kan gevonden worden binnen volgende spreadsheet: https://docs.google.com/spreadsheets/d/1blanTZo74KsYeqMdYDYGGmVxOopSQWIHU8pJkU0acM0/edit?usp=sharing

CEO&CTO: Maken van de spreadsheet(CEO) en eerste reviews samen(CEO&CTO) rond orientation detection. Dit zal herschreven moeten worden. \*\*Deadline 25/11

TC2: Perspective transformation werkende krijgen binnen ons project gegeven een afbeelding. Werkt buiten ons project in een aparte simulator, moet lukken. \*\*Deadline 25/11

TC1 & CR1: Triangulatie implementeren zonder het gebruik van img casting van voorheen op 18/11. \*\*Deadline 25/11

CR2: Simulator maken voor de random generator die zal gebruikt worden bij de final task telkens de cirkel een corner bereikt in onze triangulatie. \*\*Deadline 25/11.

### 25/11:

We hebben met zijn allen gewerkt aan het verbeteren van de code die we voorheen hadden die niet werkte. Oplossingen bedenken voor orientation detection alsook screen detection. Anderen werkten aan de beweging synchronizeren van de game.

CEO&TC1: Orientation detection ideeen en testen van de code in de test suite.

CR2 & CR1: beweging gefixt van de circel en extra classes toegevoegd.

TC2: Perspective transformation fixen, proberen de huidige problemen op te lossen

CTO absent

### 28/11:

We hebben deze dag voornamelijk verder gewerkt aan wat we de maandag voorheen waren gestart. De deadline voor orientation detection was gehaald op 25/11, maar deze werkte niet zo flawless als voorspeld ten tijde van het schrijven van de testen. We hebben orientation detection volledig moeten revisen. De code voor het spel werd ook herbekeken en verder uitgebreid. Er werden tooltips toegevoegd aan de knoppen in de UI. Bugs voor punt modificatie in de animatie werden vandaag ook resolved.

Countdown werd ook herwerkt voor een duidelijker beeld voor de demo.

CEO: testing and debuggen van orientation detection + testen herschrijven

CTO: Herwerkte Countdown om duidelijkheid te brengen alsook te eindigen met een bang.

TC1+CR1: Bug van movement in animatie opgelost + tested on server.

TC2: Bugs fixen van perspective transformation en testen via testsuite

CR2: Tooltips added + herzien van simulation voor animation

### 2/12:

Vandaag hebben we gewerkt aan het verder uitbreiden van orientation detection alsook animatie zien op te lossen met een andere manier(image casting). De oorspronkelijke manier van het casten van de game bevatte nog bugs die we hebben proberen op te lossen vandaag.

CEO: eerste stappen tot het herschrijven van angle calculation mbv orientation type detection.

TC1+CR1+CR2: Gewerkt aan animatie, CR2 heeft een manier proberen vinden om deze animatie problemen op te lossen mbv image casting. Eerste testen online via server ipv testsuite.

TC2: ? TODO

CTO: Absent

### 5/12:

We hebben ons deze dag vooral gefocust op het maken van een programma dat werkende is en kan uitgewerkt worden in het verslag. We hebben perspectief achterwege gelaten en alle problemen omtrent angle calculations en animatie oplgelost deze dag/nacht. Anderen hebben gewerkt aan het schrijven van het begin van report X.

CEO: Angle calculation resolved+Orientation detection reworked to work in all cases of orientation in 2D.

TC1+CR1: Animation and angle detection solved and gotten to work in all cases. CR1 also made sure a bug in triangulation got resolved by calculating the convex hull.

CTO + TC2: writing report

CR2: Worked with TC1+CR1 all night on animation, started on report during our session together.

### 6/12:

We hebben met zijn allen de hele tijd gewerkt aan het finaliseren van Report X zodat deze zo goed mogelijk werd vooraleer we het indienden.

ALL: werken aan report

### 9/12:

Werken aan presentatie voor DDay alsook automatisatie van het programma door het drukken van 1 knop in programma.

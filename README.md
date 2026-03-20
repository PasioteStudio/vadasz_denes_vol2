
# Vadász Dénes Informatikai Verseny
## Csapat: SzigMakik

Ez a projekt a 2026-ban megrendezett Vadász Dénes Informatikai Versenyre készült.

**Csapattagok:**
- Magi Zsolt (modellek, vágás, animációk)
- Pápa Attila (algoritmus, frontend, quality control)
- Gál Attila Péter (algoritmus, frontend, quality control)

**Iskola:** Debreceni SZC Mechwart András Gépipari és Informatikai Technikum

**Elérhetőség**: gal.attila0204@gmail.com (Gál Attila Péter)

**Felkészítő Tanár**: Nemes Tamás
## Fejlesztői környezet
**Programnyelv:** TypeScript

**Version control:** Git & GitHub

**Szerkesztő:** VS Code

**Környezet:** NextJS + React + R3F + ThreeJS 

**Futtathatóvá tétel**: Electron

**Mentális állapot:** kimerült, de büszke 

**Kapcsolattartás módja:** Discord

**Konfliktuskezelés:** _Ököljog_

## Futtatás
A fejlesztői környezet futtatásához szükséges nodeJS v22.15+ és Node Package Manager 10.9.2+.
A projekt NextJS-t használ, így a fejlesztői környezet futtatása a következkő módon érhető el:
- függőségek telepítése (a packages.json-nal egy mappában):

    ```bash
    npm install
    ```

- fejlesztői környezet futtatása:

    ```bash
    npm run dev
    ```

Az alkalmazás fejlesztői környezetben való használata a localhost:3000 címen történik a böngészőben.
A lefejlesztett alkalmazást .exe fájl formájában a FINAL mappában találják. A fordításhoz Electron-t használtunk.
## Használat
Megnyitáskor a kezkdőképernyő fogad minket, ahol választhatunk az alap térkép használata, véletlenszerű generálása és saját térkép feltöltése között. Ha kiválasztottunk egy lehetőséget, alul a jobbra nyíllal átléphetünk az idő megadására. Miután megadtuk az időmennyiséget, elérhetővé válik az Indítás gomb.

Ezt megnyomva egy töltőképernyőt láthatunk, ami után megjelenik a térkép és az algoritmus töltési ideje. Ezt az ablakot bezárva több vizuális elem fogad minket. Menjünk ezen végig.

**Akkumulátor:** A bal felső sarokban láthatjuk a töltöttségi szintet. Az egeret fölé tartva leolvashatjuk a pontos mennyiséget.

**Jelenlegi tevékenység:** A bal alsó sarokban láthatunk információt a jelenlegi tevékenységről.

**Térkép exportálása:** A jelenlegi tevékenység mellett van egy gomb, ami felettébb hasznos a véletlenszerű térképek kiírására. CSV fájl a végeredmény. A térkép kezdeti állapotát tartalmazza.

**Jelenlegi napállás:** Jobb felül láthatjuk, hogy jelenleg hol járunk a nap és a "hold" ciklusában. 

**Napló:** A jobb alsó sarokban láthatjuk az eltelt idő függvényében a naplófájlokat. Ha az egeret e fölé visszük, többet látunk. A képernyő alján középen jelennek meg a legfrissebb naplósorok. 

**Leltár:** A naplótól közvetlenül balra található a leltár. Ezt vagy a térképen lévő rovert kattintva megnyílik a jelenlegi leltár és az ércek.

**Lejátszó:** A képernyő alján középen található a lejátszó. Megállított állapotban lehet egyesével lépkedni fél órás intervallumokban a billentyűzet nyilait vagy a gombokat használva. Elintítani/megállítani a középső lejátszás/megállítás gombbal vagy a space billentyűvel lehet. Gyorsabb lejátszáshoz használjuk a dupla nyíl gombokat.

**Rover követése:** A lejátszótól közvetlenül balra található a "snap to rover" gomb, amelyre kattintással vagy a Q billentyű megnyomásával automatikusan követhetjük a rover útját lejátszás közben. Ha ez nincs bekapcsolva, akkor a WASD gombokkal lehet mozogni a térképen.

**Megtett útvonal:** A térképen megjelenő vonal kékkel jelzi a még nem bejárt útvonalat és sárgával a már megtett részt.

**Egyéb:** A kamera látóterét a görgővel tudjuk szabályozni.
## Projekt struktúra
A kezdőképernyő és az adatok megadása után a projekt működése három részre osztható.

Az algoritmus:
- Beadott paraméterek és térkép fogadása,
- Út generálása
- Delták generálása

Az összekötő réteg (Context-ek):
- A projekten végig használatos adatok kezelése
- Az algoritmus és a megjelenítés összeköttetése

A megjelenítés:
- Az összekötő réteg segítségével megkapott delták alapján lehetővé teszi a szimuláció lejátszását

Az algoritmus és a megjelenítési réteg nem avatkozik egymásba.


## Algoritmus működése
Az algoritmus a beam search ötletére épül, a szabályoknak megfelelő változtatásokkal.
Az inicializálás fázisban meghatározza, hogy egyáltalán van-e elérhető érc. Ha nincs, akkor egész egyszerűen kitölti a megteendő mozdulatokat várakozással. Ha van, akkor pedig legenerálja a mezők távolságát Breafth-first kereséssel, hogy azokat minden ponton a térképen konstans időben el tudjuk érni. Éppen ezért a mozdulatért rövid időtartamoknál ez az algoritmus gyengébben teljesíthet, viszont több száz óránál is akár egy teljesen elfogadható futási időt produkál.

Innentől a lehetséges mozdulatok számáig lépkedünk és a beam search elvének megfelelően bővítjük a sugarakat a következkő lehetőségekkel. Ha nem tudunk egy pontról hazajutni, akkor azt az ágat figyelmen kívül hagyjuk. Ellenkező esetben pontozzuk az abból a pontból lehetséges lépéseket.
Jelenleg a várakozásért nem jár pont, a bányászásért sok pont jár, illetve mozgás során a közelebb lévő ércek exponenciálisan több ponttal jutalmazzák az algoritmust, mint a távoliak. Hogy elkerüljük azt, hogy meghagyjon egy ércet, az összes érc kibányászásáért nagyon sok pont jár.

Minden bővítés után kiválasztjuk a legjobb W elemet a pontok alapján, és a többit eldobjuk. Ezzel egyidejűleg frissítjük az eddigi legjobb útvonalat.
A következő iteráció a W megtartott sugárból készít bővítményeket, ameddig kimerülünk a lehetőségekből vagy elérjük a moves mennyiséget.

Utolsó lépésként a nyertes sugárhoz hozzáfűzzük a hazautat, majd leképezzük az utat és a deltákat, amiket a többi komponens használ majd.
## Optimalizációk
- O(1) lookup a távolságokra
- GPU instancing a mezőkre
- Camera Culling a térképen
- GPU instancing a dekoratív részecskékre


## Teszt esetek

Pár egyszerű teszt eset található néhány érdekesebb szituációra a `test cases/` mappában.
A fájlok a szabálynak megfelelően 50x50-es méretű térképeket tartalmaznak, kezdő pozíciókkal, csv formátumban.
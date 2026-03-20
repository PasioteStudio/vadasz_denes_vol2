
# Vadász Dénes Informatikai Verseny
## Csapat: SzigMakik

Ez a projekt a 2026-ban megrendezett Vadász Dénes Informatikai Versenyre készült.

Csapattagok:
- Magi Zsolt (modellek, vágás, animációk)
- Pápa Attila (algoritmus, frontend, quality control)
- Gál Attila Péter (algoritmus, frontend, quality control)


## Fejlesztői környezet
- **Programnyelv:** TypeScript
- **Version control:** Git & GitHub
- **Szerkesztő:** VS Code
- **Környezet:** NextJS + React + R3F + ThreeJS 
- **Futtathatóvá tétel**: Electron
- **Mentális állapot:** kimerült, de büszke 
- **Kapcsolattartás módja:** Discord
- **Konfliktuskezelés:** _Ököljog_
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


## Futtatás
A projekt NextJS-t használ, így a fejlesztői környezet futtatása a következkő módon érhető el:
- függőségek telepítése (a packages.json-nal egy mappában):

    ```bash
    npm install
    ```

- fejlesztői környezet futtatása:

    ```bash
    npm run dev
    ```

A lefejlesztett alkalmazást .exe fájl formájában a FINAL mappában találják. A fordításhoz Electron-t használtunk.
## Algoritmus működése
Az algoritmus a beam search ötletére épül, a szabályoknak megfelelő változtatásokkal.
Az inicializálás fázisban meghatározza, hogy egyáltalán van-e elérhető érc. Ha nincs, akkor egész egyszerűen kitölti a megteendő mozdulatokat várakozással. Ha van, akkor pedig legenerálja a mezők távolságát Breafth-first kereséssel, hogy azokat minden ponton a térképen konstans időben el tudjuk érni. Éppen ezért a mozdulatért rövid időtartamoknál ez az algoritmus gyengébben teljesíthet, viszont több száz óránál is akár egy teljesen elfogadható futási időt produkál.

Innentől a lehetséges mozdulatok számáig lépkedünk és a beam search elvének megfelelően bővítjük a sugarakat a következkő lehetőségekkel. Ha nem tudunk egy pontról hazajutni, akkor azt az ágat figyelmen kívül hagyjuk. Ellenkező esetben pontozzuk az abból a pontból lehetséges lépéseket.
Jelenleg a várakozásért nem jár pont, a bányászásért sok pont jár, illetve mozgás során a közelebb lévő ércek exponenciálisan több ponttal jutalmazzák az algoritmust, mint a távoliak. Hogy elkerüljük azt, hogy meghagyjon egy ércet, az összes érc kibányászásáért nagyon sok pont jár.

Minden bővítés után kiválasztjuk a legjobb W elemet a pontok alapján, és a többit eldobjuk. Ezzel egyidejűleg frissítjük az eddigi legjobb útvonalat.
A következő iteráció a W megtartott sugárból készít bővítményeket, ameddig kimerülünk a lehetőségekből vagy elérjük a moves mennyiséget.

Utolsó lépésként a nyertes sugárhoz hozzáfűzzük a hazautat, majd leképezzük az utat és a deltákat, amiket a többi komponens használ majd.
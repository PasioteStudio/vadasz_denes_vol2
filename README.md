
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

    `npm install`

- fejlesztői környezet futtatása:

    `npm run dev`

A lefejlesztett alkalmazást .exe fájl formájában a FINAL mappában találják. A fordításhoz Electron-t használtunk.
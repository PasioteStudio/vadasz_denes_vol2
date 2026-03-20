Vadász Dénes Informatikai Verseny
Csapat: SzigMakik

Ez a projekt a 2026-ban megrendezett Vadász Dénes Informatikai Versenyre készült.

Csapattagok:
- Magi Zsolt (modellek, vágás, animációk)
- Pápa Attila (algoritmus, frontend, quality control)
- Gál Attila Péter (algoritmus, frontend, quality control)

Iskola:
Debreceni SZC Mechwart András Gépipari és Informatikai Technikum

Elérhetőség:
gal.attila0204@gmail.com (Gál Attila Péter)

Felkészítő Tanár:
Nemes Tamás


FEJLESZTŐI KÖRNYEZET

Programnyelv: TypeScript
Version control: Git & GitHub
Szerkesztő: VS Code
Környezet: NextJS + React + R3F + ThreeJS
Futtathatóvá tétel: Electron
Mentális állapot: kimerült, de büszke
Kapcsolattartás módja: Discord
Konfliktuskezelés: Ököljog


FUTTATÁS

A fejlesztői környezet futtatásához szükséges:
- NodeJS v22.15+
- Node Package Manager 10.9.2+

Lépések:

1. Függőségek telepítése (a package.json mappájában):
   npm install

2. Fejlesztői környezet futtatása:
   npm run dev

A projekt a böngészőben a localhost:3000 címen érhető el.

A kész alkalmazás .exe fájlként is elérhető (Electron segítségével).

Megjegyzés:
A self-signed certificate miatt a Windows figyelmeztetést adhat:
"Microsoft Defender SmartScreen prevented an unrecognized app from starting..."


HASZNÁLAT

Indításkor a kezdőképernyő jelenik meg, ahol választható:
- alap térkép
- véletlenszerű térkép
- saját térkép feltöltése

Ezután:
- idő beállítása
- Indítás gomb

Betöltés után megjelenik:
- térkép
- algoritmus futási ideje

Felület elemei:

Akkumulátor:
Bal felső sarok, töltöttség hoverrel.

Jelenlegi tevékenység:
Bal alsó sarok.

Térkép export:
CSV formátumban, kezdeti állapot.

Napállás:
Jobb felső sarok (nap-hold ciklus).

Napló:
Jobb alsó sarok + alsó középső sáv.

Leltár:
Napló mellett, roverre kattintva is elérhető.

Lejátszó:
Alsó középen:
- léptetés nyilakkal
- play/pause: gomb vagy Space
- gyorsítás: dupla nyilak

Rover követés:
"Snap to rover" gomb vagy Q billentyű
Mozgás: WASD

Útvonal:
- kék: még nem bejárt
- sárga: már megtett

Egyéb:
Zoom: egérgörgő


PROJEKT STRUKTÚRA

Három fő rész:

1. Algoritmus
   - bemenet feldolgozás
   - út generálás
   - delták számítása

2. Context réteg
   - állapotkezelés
   - algoritmus és UI összekötése

3. Megjelenítés
   - szimuláció lejátszása delták alapján

Az algoritmus és a megjelenítés külön működik.


ALGORITMUS MŰKÖDÉSE

Beam search alapú megközelítés.

Inicializálás:
- ellenőrzi, van-e érc
- ha nincs → várakozás
- ha van → BFS távolságszámítás

Ez lehetővé teszi:
- O(1) távolság lekérdezést

Hátrány:
- rövid időnél kevésbé hatékony

Működés:
- lépések iterálása
- sugár bővítések
- érvénytelen ágak eldobása
- pontozás:
  - bányászat: magas pont
  - közeli érc: exponenciálisan több pont
  - teljes kitermelés: extra jutalom

Minden iterációban:
- legjobb W ág megtartása
- többi eldobása

Végén:
- hazatérés hozzáadása
- út és delták generálása


OPTIMALIZÁCIÓK

- O(1) távolság lookup
- GPU instancing (mezők)
- Camera culling
- GPU instancing (részecskék)


TESZT ESETEK

A "test cases/" mappában találhatók.

Jellemzők:
- 50x50-es térképek
- kezdő pozíciók
- CSV formátum
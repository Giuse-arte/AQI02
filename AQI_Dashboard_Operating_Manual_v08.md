# Air Quality Index Dashboard — Operating Manual
## AQI Centralina Multi-Stazione | Versione 08.00 (Standard EEA 6 Classi & Medie 24h)
**Guida operativa e documentazione tecnica per la rete di monitoraggio ambientale IoT**  
*Bene Comune Vimodrone — Rete Civica Milano Smart Park*  
Link Dashboard: [https://giuse-arte.github.io/AQI02/index.html](https://giuse-arte.github.io/AQI02/index.html)

---

### Scheda Metadati e Controllo Documento

| Parametro | Valore / Riferimento |
| :--- | :--- |
| **Revisione Documento** | **08.00** (Release Ufficiale — Standard EEA 6 Classi & Medie 24h) |
| **Data di Rilascio** | 16 Ottobre 2026 |
| **Dispositivi Target** | Centralina 1 (`AQI_01` — Grove Gas V2) e Centralina 2 (`AQI_02` — MiCS-6814 V1) |
| **Integrazione Cloud** | ThingSpeak (Canali primari `3482211`, `3482910` + Canale Gas dedicato `3494571`) |
| **URL Ufficiale** | [https://giuse-arte.github.io/AQI02/index.html](https://giuse-arte.github.io/AQI02/index.html) |
| **Progetto Promotore** | Bene Comune Vimodrone & Milano Smart Park (MSP) |
| **Stato Documento** | Approvato per il deployment operativo e consultazione pubblica |

---

### Registro delle Modifiche Storiche

| Versione | Data | Descrizione Sintetica delle Modifiche |
| :--- | :--- | :--- |
| **v01.00** | 2025-01-01 | Prima release di base della dashboard e interfacciamento cloud ThingSpeak. |
| **v02.00** | 2025-03-01 | Aggiunta sezione KPI Cards, grafico VOC, calcolo standard EPA/EEA. |
| **v03.00** | 2025-04-01 | Aggiunta modalità temporali (7gg, mese, anno), griglia responsive. |
| **v04.00** | 2025-05-01 | Esportazione CSV, media mobile 24h grafico COMBO, preferenze localStorage. |
| **v05.00** | 2026-06-08 | Bug fix modalità Giorno e correzione colonne CSV per media mobile PM2.5/PM10. |
| **v06.00** | 2026-07-18 | Gestione multi-centralina avanzata con preferenze salvate per singolo device. Reset protetto via Data Inizio. |
| **v07.00** | 2026-07-27 | Reverse Geocoding OpenStreetMap, selettore data inizio con icona calendario azzurro, Tema Ocra (Scuro/Chiaro Pastello), logo 3D ufficiale. |
| **v07.50** | 2026-10-12 | RELEASE DASHBOARD 2.0 MULTIGAS: Integrazione sensori gas multicanale CO, NO2, NH3 (Grove V2 per AQI_01 e MiCS-6814 per AQI_02) con canale secondario ThingSpeak (3494571). Espansione a 13 KPI Cards su 2 righe tematiche. Espansione a 12 grafici storici (incluso RSSI Wi-Fi con soglie radio). Tracciato CSV esteso a 16 colonne. |
| **v08.00** | 2026-10-16 | **RELEASE STANDARD EEA AGGIORNATO (6 CLASSI & MEDIE 24H)**: Adozione ufficiale dello standard europeo EEA a 6 classi di qualità dell'aria (introduzione Classe 6 "Estremamente scadente" per concentrazioni > 75 µg/m³ di PM2.5 e > 150 µg/m³ di PM10). Esplicitazione rigorosa nel testo e nelle tabelle che le soglie di PM2.5 e PM10 sono calcolate sulle concentrazioni medie mobili su 24 ore (PM2.5 24h e PM10 24h). Allineamento completo tra motore di calcolo JS, finestra modale, infografica e documentazione operativa. |

---

### 1. Introduzione e Architettura della Rete
La dashboard **AQI 2.0** è un'applicazione web avanzata concepita per il monitoraggio in tempo reale e l'analisi storica della qualità dell'aria urbana, nell'ambito del progetto promosso dalla comunità Bene Comune Vimodrone in sinergia con la rete civica Milano Smart Park (MSP).

Il sistema acquisisce continuativamente i parametri ambientali da centraline IoT basate su microcontrollore Espressif ESP32 WROVER. I dati vengono trasmessi con cadenza periodica alla piattaforma cloud ThingSpeak tramite due canali sincronizzati:
- **Canale Primario**: riservato ai parametri microclimatici, alle concentrazioni di particolato atmosferico (PM1, PM2.5, PM10) e al valore RSSI del segnale Wi-Fi.
- **Canale Secondario Gas (ID 3494571)**: dedicato alle concentrazioni dei gas inquinanti (Monossido di Carbonio CO, Biossido di Azoto NO₂, Ammoniaca NH₃), misurate dai sensori gas multicanale montati sulle diverse stazioni.

La dashboard si aggiorna automaticamente al cambio di qualsiasi filtro o centralina, consentendo sia la consultazione rapida dello stato dell'aria cittadina tramite 13 KPI Cards sintetiche, sia l'approfondimento analitico mediante 12 grafici interattivi con serie temporali a breve, medio e lungo termine.

---

### 2. Sensori del Dispositivo e Dotazione Hardware
Ciascuna centralina integra un insieme coordinato di sensori fisici specializzati:

#### 2.1 Sensore Ambientale Termo-Igrometrico e VOC — Bosch Sensortec BME680
Sensore MEMS combinato di precisione su bus I2C. Rileva simultaneamente quattro grandezze fisiche:
- **Temperatura ambientale** (in °C, con risoluzione 0.1 °C).
- **Umidità relativa dell'aria** (in %, fondamentale anche per compensare le derive degli altri sensori).
- **Pressione atmosferica barometrica** (in hPa, calibrata per l'altitudine media di Milano/Vimodrone di 122 m s.l.m.).
- **Composti Organici Volatili (VOC)**: rilevati tramite una micropiastra a riscaldamento pulsato che misura la resistenza del gas superficiale in kOhm. Un valore elevato indica aria priva di esalazioni organiche, mentre una brusca discesa evidenzia la presenza di solventi, fumi o composti volatili.

#### 2.2 Sensore Particolato Atmosferico — Plantower PMS5003
Sensore ottico a diffrazione laser per il conteggio in continuo delle polveri sospese in atmosfera. Determina simultaneamente tre frazioni granulometriche:
- **PM1**: particolato ultrafine (< 1.0 µm), capace di penetrare in profondità nell'apparato respiratorio e nel circolo sanguigno.
- **PM2.5**: particolato fine (< 2.5 µm), parametro cardine delle normative sanitarie europee ed internazionali.
- **PM10**: particolato inalabile (< 10 µm), polveri toraciche e polveri sollevate dal traffico.

#### 2.3 Sensori Gas Multicanale Specializzati (Grove V2 / MiCS-6814)
- **Centralina AQI_01**: equipaggiata con modulo **Grove Multichannel Gas Sensor V2** (sensori MEMS integrati GM-102B per NO₂, GM-302B per CO, GM-502B per NH₃).
- **Centralina AQI_02**: equipaggiata con modulo **MiCS-6814 V1** (tre elementi semiconduttori ad ossido metallico MOS indipendenti per gas riducenti CO, gas ossidanti NO₂ e gas alcalini NH₃).

---

### 3. Struttura della Dashboard e Disposizione Interfaccia

#### 3.1 Header e Top Bar
- **Titolo Centralina**: denominazione pulita del dispositivo (`Device N° AQI_01` o `Device N° AQI_02`).
- **Sottotitolo Dinamico**: intervallo temporale dei dati attualmente visualizzati.
- **Geolocalizzazione e Reverse Geocoding**: coordinate Latitudine/Longitudine affiancate dal segnale radio RSSI e, nella riga inferiore, l'indirizzo civico ricavato via OpenStreetMap Nominatim API con box icona da 22px per un allineamento verticale millimetrico.
- **Pulsanti di Controllo**: selettore tema (Scuro / Chiaro Pastello), selettore layout (PC / Cellulare) e pannello controllo centraline.

#### 3.2 Key Performance Indicator Cards (13 Cards su 2 Righe)
Le card forniscono una sintesi istantanea dello stato dell'aria:
- **Riga 1 (Microclima & Polveri)**:
  1. *Umidità* (BME680, %)
  2. *Temperatura* (BME680, °C)
  3. *Pressione* (BME680, hPa)
  4. *VOC* (BME680, kOhm + Delta rispetto alla baseline 24h con freccia di trend)
  5. *PM1* (PMS5003, µg/m³ istantaneo)
  6. *PM2.5 Istantaneo* (PMS5003, µg/m³ istantaneo)
  7. *PM10 Istantaneo* (PMS5003, µg/m³ istantaneo)
- **Riga 2 (Medie Mobili 24h, Indici Sanitari & Gas Inquinanti)**:
  8. *PM2.5 (media 24h)* (PMS5003, media mobile 24h + range Min-Max 24h)
  9. *PM10 (media 24h)* (PMS5003, media mobile 24h + range Min-Max 24h)
  10. *AQI EEA / EPA (24h)*: indice sintetico della qualità dell'aria (classe da 1 a 6 per EEA o punteggio 0–500 per EPA).
  11. *Monossido di Carbonio CO* (µg/m³)
  12. *Biossido di Azoto NO₂* (µg/m³)
  13. *Ammoniaca NH₃* (µg/m³)

---

### 4. Modalità di Visualizzazione e File CSV (16 Colonne)

#### 4.1 Modalità Temporali
- **Ultime 24 ore (Live)**: campionamento continuo dei singoli feed con etichette ogni 4 ore e griglie orarie.
- **Giorno**: selezione di una giornata di calendario specifica (dalle 00:00 alle 23:59).
- **Ultimi 7 giorni**: aggregazione oraria a 1 punto/ora per evidenziare i trend settimanali.
- **Ultimo mese**: aggregazione oraria su 30 giorni.
- **Ultimo anno**: medie giornaliere su 365 giorni per lo studio dell'andamento stagionale.

#### 4.2 Struttura del File CSV Esportato (16 Colonne Excel UTF-8 BOM)
Il pulsante *Esporta CSV* genera un file compatibile con Microsoft Excel contenente:
`Date/Time`, `year`, `month`, `temp`, `hum`, `pres`, `voc`, `PM1`, `PM2_5`, `PM2_5_mavg`, `PM10`, `PM10_mavg`, `MICS_CO`, `MICS_NO2`, `MICS_NH3`, `RSSI`.

---

### 5. Standard di Qualità dell'Aria (EEA ed EPA)
Il calcolo dell'indice sintetico AQI e la colorazione dei badge avvengono secondo i due protocolli internazionali ufficiali (EEA ed EPA).

> [!IMPORTANT]
> **Specificazione Fondamentale sulle Medie a 24 Ore**:  
> In entrambi gli standard (Europeo EEA e Statunitense EPA), le concentrazioni di particolato atmosferico (PM2.5 e PM10) utilizzate per determinare la classe qualitativa e l'indice sintetico **non sono valori istantanei**, bensì **concentrazioni rigorosamente calcolate sulle medie delle 24 ore (medie mobili su 24 ore: PM2.5 24h e PM10 24h)**.  
> La classe o il punteggio finale assegnato alla centralina riflette sempre la concentrazione peggiore riscontrata tra PM2.5 e PM10 nelle ultime 24 ore.

---

#### 5.1 Standard Europeo EEA (European Environment Agency) — 6 Classi Ufficiali
L'Indice Europeo della Qualità dell'Aria (*European Air Quality Index*) dell'EEA adotta una scala ufficiale a **6 fasce di qualità**. Le soglie di concentrazione indicate in tabella fanno riferimento alle **medie calcolate su una finestra mobile continua di 24 ore** per PM2.5 e PM10:

| Classe EEA | Descrizione Qualitativa | PM2.5 (media 24h, µg/m³) | PM10 (media 24h, µg/m³) | Colore Associato | Codice Esadecimale |
| :---: | :--- | :---: | :---: | :--- | :---: |
| **1** | **Buona (Good)** | 0 – 10 | 0 – 20 | Azzurro | `#38bdf8` |
| **2** | **Accettabile (Fair)** | 10 – 20 | 20 – 40 | Verde | `#22c55e` |
| **3** | **Moderata (Moderate)** | 20 – 25 | 40 – 50 | Giallo | `#eab308` |
| **4** | **Scadente (Poor)** | 25 – 50 | 50 – 100 | Rosso | `#ef4444` |
| **5** | **Molto scadente (Very poor)** | 50 – 75 | 100 – 150 | Rosso Scuro | `#991b1b` |
| **6** | **Estremamente scadente (Extremely poor)** | > 75 | > 150 | Viola Scuro | `#a855f7` |

*Regola di calcolo: la centralina valuta la classe EEA calcolata sul PM2.5 (media 24h) e la classe EEA calcolata sul PM10 (media 24h); la classe finale corrisponde al valore massimo (peggiore) tra le due.*

---

#### 5.2 Standard Americano EPA (US Environmental Protection Agency)
L'indice numerico EPA AQI (scala da 0 a 500) viene calcolato mediante interpolazione lineare a tratti sui breakpoint ufficiali stabiliti dall'agenzia statunitense EPA. Anche per lo standard EPA, le concentrazioni di PM2.5 e PM10 impiegate nel calcolo sono **rigorosamente riferite alla media sulle 24 ore (24-hour average breakpoint)**:

| AQI (0–500) | Categoria Sanitaria | PM2.5 (media 24h, µg/m³) | PM10 (media 24h, µg/m³) | Colore Associato |
| :---: | :--- | :---: | :---: | :--- |
| **0 – 50** | **Buona (Good)** | 0.0 – 9.0 | 0 – 54 | Verde (`#22c55e`) |
| **51 – 100** | **Moderata (Moderate)** | 9.1 – 35.4 | 55 – 154 | Giallo (`#eab308`) |
| **101 – 150** | **Non salubre per gruppi sensibili** | 35.5 – 55.4 | 155 – 254 | Arancione (`#f97316`) |
| **151 – 200** | **Non salubre (Unhealthy)** | 55.5 – 150.4 | 255 – 354 | Rosso (`#ef4444`) |
| **201 – 300** | **Molto non salubre (Very Unhealthy)** | 150.5 – 250.4 | 355 – 424 | Rosso Scuro (`#991b1b`) |
| **301 – 500** | **Pericolosa (Hazardous)** | 250.5 – 500.4 | 425 – 604 | Viola Scuro (`#a855f7`) |

---

### 6. Catalogo dei 12 Grafici Storici Interattivi
Ciascun grafico può essere attivato o disattivato tramite il pannello *Contr. Centraline*:
1. **PM1 (PMS5003)**: andamento del particolato ultrafine in µg/m³.
2. **PM2.5 (PMS5003)**: concentrazione istantanea di particolato fine in µg/m³.
3. **PM10 (PMS5003)**: concentrazione istantanea di particolato grossolano in µg/m³.
4. **PM2.5 + PM10 (24h) [COMBO]**: grafico combinato delle **medie mobili a 24 ore** con soglie normative tratteggiate (EEA/EPA). Resta intenzionalmente vuoto nelle prime 24 ore da *Data Inizio* per garantire rigore statistico.
5. **Umidità (BME680)**: andamento dell'umidità relativa (%).
6. **Temperatura (BME680)**: andamento termico in °C.
7. **Pressione (BME680)**: oscillazioni barometriche locali in hPa.
8. **VOC (BME680)**: andamento del delta rispetto alla baseline 24h.
9. **Monossido di Carbonio CO (Grove V2 / MiCS-6814)**: concentrazione in µg/m³.
10. **Biossido di Azoto NO₂ (Grove V2 / MiCS-6814)**: concentrazione in µg/m³.
11. **Ammoniaca NH₃ (Grove V2 / MiCS-6814)**: concentrazione in µg/m³.
12. **Segnale Wi-Fi RSSI (ESP32)**: potenza del segnale in dBm con soglie tratteggiate colorate e pulsante informativo *"i"* per l'interpretazione della qualità della connessione.

---

### 7. Gestione Multi-Centralina e Salvataggio Preferenze
- **Persistenza Indipendente**: lo standard AQI (EEA/EPA), la data d'inizio, la modalità temporale e il giorno selezionato sono salvati singolarmente per ciascuna centralina nel `localStorage` del browser.
- **Flag 'Ricorda preferenze'**: governa la memorizzazione della selezione dei grafici visibili.
- **Riconoscimento Automatico Sensore Gas**: la dashboard legge lo stato trasmesso dal firmware e identifica in autonomia il modello di sensore gas montato sulla stazione attiva.

---

### 8. Riferimenti Firmware e Deployment
- **Firmware ESP32**: `AQI_FW_13b.ino` / `AQI_FW_13.ino` con partizioni custom (spazio OTA e logging NVS).
- **Frontend Stack**: HTML5, Vanilla JavaScript (ES6 Modules puro), Chart.js, CSS3 Responsive.
- **Repository e Hosting**: [https://giuse-arte.github.io/AQI02/index.html](https://giuse-arte.github.io/AQI02/index.html).

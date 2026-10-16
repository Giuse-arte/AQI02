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

---

### 2. Sensori del Dispositivo e Dotazione Hardware
- **Bosch Sensortec BME680**: temperatura (°C), umidità relativa (%), pressione atmosferica (hPa), resistenza VOC (kOhm).
- **Plantower PMS5003**: polveri sottili a diffrazione laser per PM1, PM2.5 e PM10 (µg/m³).
- **Sensori Gas Multicanale**: modulo **Grove Gas Sensor V2** per `AQI_01` e modulo **MiCS-6814 V1** per `AQI_02`.

---

### 3. Struttura della Dashboard e Disposizione Interfaccia
- **Header**: titolo centralina (`Device N° AQI_01` / `Device N° AQI_02`), geolocalizzazione, potenza segnale RSSI e indirizzo civico (OpenStreetMap Nominatim).
- **13 KPI Cards su 2 Righe Tematiche**:
  - *Riga 1*: Umidità, Temperatura, Pressione, VOC (kOhm + delta baseline con trend), PM1, PM2.5 Istantaneo, PM10 Istantaneo.
  - *Riga 2*: PM2.5 (media 24h), PM10 (media 24h), AQI (EEA/EPA 24h), CO, NO₂, NH₃.

---

### 4. Modalità di Visualizzazione e File CSV
- **Modalità Temporali**: Ultime 24 ore (Live), Giorno, Ultimi 7 giorni, Ultimo mese, Ultimo anno.
- **File CSV Esportato**: 16 colonne conformi con standard italiano per Excel (separatore `;`, virgola per i decimali e prefisso UTF-8 BOM).

---

### 5. Standard di Qualità dell'Aria (EEA ed EPA)
Il calcolo dell'indice sintetico AQI e la colorazione dei badge avvengono secondo i due protocolli internazionali ufficiali (EEA ed EPA).

> [!IMPORTANT]
> **Specificazione Fondamentale sulle Medie a 24 Ore**:  
> In entrambi gli standard (Europeo EEA e Statunitense EPA), le concentrazioni di particolato atmosferico (PM2.5 e PM10) utilizzate per determinare la classe qualitativa e l'indice sintetico **non sono valori istantanei**, bensì **concentrazioni rigorosamente calcolate sulle medie delle 24 ore (medie mobili su 24 ore: PM2.5 24h e PM10 24h)**.  
> La classe o il punteggio finale assegnato alla centralina riflette sempre la concentrazione peggiore riscontrata tra PM2.5 e PM10 nelle ultime 24 ore.

#### 5.1 Standard Europeo EEA (European Environment Agency) — 6 Classi Ufficiali
L'Indice Europeo della Qualità dell'Aria (*European Air Quality Index*) dell'EEA adotta la scala ufficiale a **6 fasce di qualità**. Le soglie di concentrazione fanno riferimento alle **medie calcolate su 24 ore continue** per PM2.5 e PM10:

| Classe EEA | Descrizione Qualitativa | PM2.5 (media 24h, µg/m³) | PM10 (media 24h, µg/m³) | Colore Associato | Codice Esadecimale |
| :---: | :--- | :---: | :---: | :--- | :---: |
| **1** | **Buona (Good)** | 0 – 10 | 0 – 20 | Azzurro | `#38bdf8` |
| **2** | **Accettabile (Fair)** | 10 – 20 | 20 – 40 | Verde | `#22c55e` |
| **3** | **Moderata (Moderate)** | 20 – 25 | 40 – 50 | Giallo | `#eab308` |
| **4** | **Scadente (Poor)** | 25 – 50 | 50 – 100 | Rosso | `#ef4444` |
| **5** | **Molto scadente (Very poor)** | 50 – 75 | 100 – 150 | Rosso Scuro | `#991b1b` |
| **6** | **Estremamente scadente (Extremely poor)** | > 75 | > 150 | Viola Scuro | `#a855f7` |

*Regola di calcolo: la centralina valuta la classe EEA calcolata sul PM2.5 (media 24h) e la classe EEA calcolata sul PM10 (media 24h); la classe finale corrisponde al valore massimo (peggiore) tra le due.*

#### 5.2 Standard Americano EPA (US Environmental Protection Agency)
L'indice numerico EPA AQI (scala da 0 a 500) viene calcolato mediante interpolazione lineare a tratti sui breakpoint ufficiali:

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
1. PM1 (PMS5003)
2. PM2.5 (PMS5003)
3. PM10 (PMS5003)
4. PM2.5 + PM10 (24h) [COMBO] (medie mobili 24h)
5. Umidità (BME680)
6. Temperatura (BME680)
7. Pressione (BME680)
8. VOC (BME680 - Delta baseline 24h)
9. Monossido di Carbonio CO
10. Biossido di Azoto NO₂
11. Ammoniaca NH₃
12. Segnale Wi-Fi RSSI (con soglie radio colorate)

---

### 7. Gestione Multi-Centralina e Sincronizzazione Cloud
- Impostazioni e preferenze grafici salvate per singola centralina nel `localStorage`.
- Rilevamento automatico del sensore gas in base allo status trasmesso.

---

### 8. Riferimenti Firmware e Deployment
- **Firmware ESP32**: `AQI_FW_13b.ino` / `AQI_FW_13.ino`.
- **Frontend Stack**: Vanilla JavaScript (ES6 Modules), Chart.js.
- **Repository e Hosting**: [https://giuse-arte.github.io/AQI02/index.html](https://giuse-arte.github.io/AQI02/index.html).

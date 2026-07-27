# Air Quality Index Dashboard — Operating Manual
## AQI — Centralina Multi-Stazione — Versione 07.00
**Guida all'uso per il monitoraggio della qualità dell'aria — gestione multi-centralina**  
[https://giuse-arte.github.io/AQI02/index.html](https://giuse-arte.github.io/AQI02/index.html)

---

### Registro delle modifiche

| Versione | Data | Descrizione modifiche |
| :--- | :--- | :--- |
| **v01.00** | 2025-01-01 | Prima release — struttura base della dashboard. |
| **v02.00** | 2025-03-01 | Aggiunta sezione KPI Cards, grafico VOC, standard EPA/EEA. |
| **v03.00** | 2025-04-01 | Aggiunta modalità temporali (7gg, mese, anno), griglia adattiva, pannello Controllo grafici. |
| **v04.00** | 2025-05-01 | Aggiunta esportazione CSV, media mobile 24h nel grafico COMBO, preferenze localStorage, integrazione Data inizio. |
| **v05.00** | 2026-06-08 | Bug fix modalità Giorno (F5), bug fix colonne CSV media mobile PM2.5/PM10 in tutte le modalità. |
| **v06.00** | 2026-07-18 | Gestione multi-centralina: memorizzazione indipendente della configurazione di visualizzazione per ogni centralina. Reset tramite 'Data Inizio' con conferma. Flag 'Ricorda preferenze' governa la persistenza dei grafici. Pulsante 'Applica' nel pannello grafici. Grafico COMBO vuoto nelle prime 24h da 'Data Inizio'. |
| **v07.00** | 2026-07-27 | Selezione Data Inizio con icona calendario azzurro brillante. Layout KPI Cards a 8 colonne su riga unica con font ingranditi. Reverse Geocoding dell'indirizzo stradale (OpenStreetMap) sotto le coordinate Lat/Long con allineamento verticale. Pulsante Tema Chiaro/Scuro (colore Ocra) posizionato sopra 'Contr. Centraline', con tema Chiaro Pastello ed intestazione grafici blu reale (#1b4db1). Griglie grafici orizzontali/verticali ottimizzate. Menu 'SCEGLI CENTRALINA' con diciture pulite 'Device N° AQI_01' / 'Device N° AQI_02'. Nuova Favicon con logo 3D ufficiale (LOGO_BCV_3D.png). |

---

### 1. Introduzione
La dashboard AQI è un'interfaccia web progettata per il monitoraggio in tempo reale della qualità dell'aria, in grado di gestire contemporaneamente più centraline installate in luoghi diversi. I dati vengono acquisiti da dispositivi IoT dotati di sensori ambientali e trasmessi alla piattaforma ThingSpeak, da cui la dashboard li recupera e li visualizza in modo chiaro e interattivo.

La dashboard permette di:
- Selezionare la centralina da visualizzare tra quelle configurate
- Visualizzare i valori attuali dei principali parametri ambientali
- Consultare grafici storici per analizzare l'andamento nel tempo in più modalità temporali
- Calcolare l'indice di qualità dell'aria (AQI) secondo standard europei (EEA) o americani (EPA)
- Monitorare i Composti Organici Volatili (VOC) tramite delta rispetto alla baseline
- Esportare i dati in formato CSV per analisi esterne
- Mantenere una configurazione di visualizzazione indipendente per ciascuna centralina
- Alternare istantaneamente il **Tema Scuro** ed il **Tema Chiaro Pastello**
- Rilevare automaticamente l'indirizzo stradale tramite **Reverse Geocoding** (OpenStreetMap Nominatim)

---

### 2. Sensori del dispositivo
Ogni centralina è equipaggiata con due sensori principali:
- **BME680**: Sensore ambientale multiparametrico. Misura temperatura, umidità relativa, pressione atmosferica e composti organici volatili (VOC). La misura VOC avviene tramite rilevamento della resistenza del gas in kOhm — un valore alto indica aria pulita, un valore basso indica presenza di VOC nell'aria.
- **PMS5003**: Sensore laser per il rilevamento del particolato atmosferico. Misura la concentrazione di PM1, PM2.5 e PM10 in microgrammi per metro cubo (µg/m³). Utilizza la tecnologia di diffrazione laser per contare e classificare le particelle presenti nell'aria.

*Nota: i dati rilevati non sono certificati ai fini normativi, ma permettono di misurare con sufficiente precisione la variabilità della qualità dell'aria nel tempo.*

---

### 3. Struttura della dashboard
La dashboard è organizzata in tre sezioni principali: l'Header in cima alla pagina, la sezione KPI Cards e la sezione Grafici nella parte inferiore.

#### 3.1 Header
La barra superiore contiene:
- Il titolo del dispositivo attualmente selezionato
- Il sottotitolo con l'intervallo di date dei dati visualizzati
- La geolocalizzazione (coordinate Lat/Long e segnale RSSI)
- **L'indirizzo stradale ricavato via Reverse Geocoding (OpenStreetMap)** visualizzato direttamente sotto le coordinate con slot icona 22px per un allineamento verticale perfetto
- Il pannello dei filtri di controllo ed il pulsante Tema Chiaro/Scuro (Ocra)

#### 3.2 Key Performance Indicator Cards (KPI)
La sezione KPI mostra i valori sintetici delle 8 misure fondamentali. Su schermi desktop le card si dispongono su **un'unica riga a 8 colonne**:
1. **Umidità** (BME680 - %)
2. **Temperatura** (BME680 - °C)
3. **Pressione** (BME680 - hPa)
4. **VOC** (BME680 - kOhm + trend)
5. **PM1** (PMS5003 - µg/m³)
6. **PM2.5** (PMS5003 - µg/m³ - media 24h)
7. **PM10** (PMS5003 - µg/m³ - media 24h)
8. **AQI** (Indice qualità dell'aria EEA / EPA)

#### 3.3 Filtri, Pulsante Tema Ocra e Controllo Centraline
- **Selettore Centralina**: Mostra unicamente la denominazione del dispositivo (`Device N° AQI_01`, `Device N° AQI_02`).
- **Pulsante Tema Ocra**: Posizionato sopra il pulsante *Contr. Centraline*, permette di commutare tra Tema Scuro e Tema Chiaro Pastello (`#ebf3f0`).
- **Pulsante Contr. Centraline**: Apre il pannello con i checkbox per mostrare/nascondere i grafici e la conferma tramite pulsante *Applica*.

#### 3.4 Area Grafici
Mostra i grafici storici in griglia con griglie orizzontali e verticali (orarie) ad alta visibilità in entrambi i temi. Nel Tema Chiaro Pastello, le intestazioni dei grafici utilizzano uno sfondo blu reale (`#1b4db1`) con pulsante d'informazione *"i"* visibile in bianco.

---

### 4. Note Tecniche
- Integrazione ThingSpeak via REST API
- Reverse Geocoding automatico tramite OpenStreetMap Nominatim API (con caching locale)
- Persistenza configurazione e tema nel `localStorage` del browser
- Favicon 3D ufficiale (`assets/LOGO_BCV_3D.png`)

---
*AQI Dashboard — Operating Manual — Versione 07.00*

# Guida Pratica per lo Sviluppo, Modifica e Aggiornamento della Dashboard AQI02

Questa guida fornisce tutte le istruzioni pratiche e l'architettura tecnica per personalizzare, manutenerare ed aggiornare la dashboard per il monitoraggio IoT della qualità dell'aria **AQI02**.

---

## 1. Mappa dei File e Architettura del Progetto

Il progetto è strutturato in modo modulare con codice in Vanilla JavaScript (ES6 Modules) e CSS puro per la massima velocità e pulizia senza dipendenze pesanti.

```
New_Dashboard/
├── index.html                           # Struttura HTML principale della dashboard
├── README.md                            # Guida / Manuale operativo principale su GitHub
├── AQI_Dashboard_Operating_Manual_v07.md # Manuale operativo v07 in formato Markdown
├── AQI_Dashboard_Operating_Manual_v07.docx # Manuale operativo v07 in formato Word (.docx)
├── GUIDA_SVILUPPATORE.md                # Questa guida tecnica per lo sviluppatore
├── assets/                              # Risorse grafiche e immagini
│   ├── LOGO_BCV_3D.png                  # Favicon e Logo 3D ufficiale del dispositivo
│   ├── Limiti-EEA.png                   # Immagine tabella standard europeo EEA
│   └── Limiti-EPA.png                   # Immagine tabella standard americano EPA
├── css/                                 # Fogli di stile CSS
│   ├── main.css                         # Variabili globali, reset e temi (Dark & Chiaro Pastello)
│   ├── header.css                       # Barra superiore, selettori, geolocalizzazione, pulsante Tema Ocra
│   ├── kpi.css                          # Layout a 8 colonne per le card KPI e tipografia
│   ├── charts.css                       # Stili e layout dei contenitori dei grafici Chart.js
│   └── modal.css                        # Stile delle finestre modali di aiuto e dettagli
└── js/                                  # Moduli JavaScript (ES6)
    ├── config.js                        # CONFIGURAZIONE CENTRALE (Centraline, API, Soglie)
    ├── app.js                           # Controller principale, eventi UI, init e geocoding
    ├── api.js                           # Chiamate REST API a ThingSpeak (recupero dati e RSSI)
    ├── charts.js                        # Rendering e distruzione dei grafici interattivi (Chart.js)
    ├── calculations.js                  # Algoritmi AQI (EEA/EPA), medie mobili 24h, delta VOC
    ├── storage.js                       # Salvataggio/ripristino preferenze su localStorage per centralina
    ├── csv.js                           # Logica di esportazione file CSV per Excel
    └── modal.js                         # Gestione apertura/chiusura delle finestre dialoghi modali
```

---

## 2. Come Aggiungere o Modificare una Centralina IoT

Tutte le centraline monitorate sono definite all'interno del file **[`js/config.js`](file:///c:/Users/Maria%20Luisa/Desktop/New_Dashboard/js/config.js)**.

### Per aggiungere una nuova centralina:
1. Apri il file `js/config.js`.
2. Individua l'array `STATIONS` ed aggiungi una nuova riga in coda alla lista:
```javascript
export const STATIONS = [
  { id: 2789658, apiKey: '4IMIXLC0RWW9K4PA', name: 'Device N° AQI_01', location: 'Stazione Primaria' },
  { id: 3412629, apiKey: 'HP8HM37WZ9BAVB4A', name: 'Device N° AQI_02', location: 'Stazione Secondaria' },
  { id: NUOVO_ID_CANALE, apiKey: 'NUOVA_API_KEY', name: 'Device N° AQI_03', location: 'Nuova Sede' }
];
```
> ⚠️ **IMPORTANTE**: Aggiungi le nuove centraline **sempre in coda all'array** (mai in mezzo) per evitare di disallineare le preferenze salvate dagli utenti nel `localStorage` del browser.

---

## 3. Come Modificare i Temi Grafici e lo Stile

I colori e gli elementi stilistici sono gestiti in modo centralizzato in **[`css/main.css`](file:///c:/Users/Maria%20Luisa/Desktop/New_Dashboard/css/main.css)** tramite variabili CSS e selettori di tema:

- **Tema Scuro (Default)**: Utilizza lo sfondo scuro glassmorphic `#0b1329`.
- **Tema Chiaro Pastello**: Attivato dall'attributo `[data-theme="light"]` sul tag `<body>`:
  - Sfondo principale: `#ebf3f0` (Salvia tenue)
  - Card e Contenitori: `#ffffff` con bordi `#b8d4e8`
  - Intestazione Grafici: `#1b4db1` (Blu Reale)
  - Testi principali: `#003b46` (Blu Notte)

Per cambiare i colori del Tema Chiaro o Scuro, modifica le regole corrispondenti in `css/main.css`.

---

## 4. Come Modificare gli Standard AQI o i Limiti dei Grafici

- **Soglie EEA ed EPA**: Sono definite in `js/config.js` negli oggetti `EEA_THRESHOLDS` ed `EPA_BREAKPOINTS`.
- **Limiti e Colori dei Grafici**: Sono definiti in `js/config.js` nell'oggetto `CHART_META`:
```javascript
export const CHART_META = {
  1: { title: 'Umidità', sensor: 'BME680', unit: '%', min: 0, max: 100, color: '#38bdf8' },
  2: { title: 'Temperatura', sensor: 'BME680', unit: '°C', min: -10, max: 60, color: '#f43f5e' },
  ...
};
```

---

## 5. Procedura di Test Locale

Prima di pubblicare le modifiche su GitHub:
1. Apri direttamente il file [`index.html`](file:///c:/Users/Maria%20Luisa/Desktop/New_Dashboard/index.html) in un browser web (Google Chrome, Microsoft Edge o Mozilla Firefox).
2. Apri la **Console per Sviluppatori** del browser (`F12` oppure tasto destro -> *Ispeziona* -> scheda *Console*).
3. Verifica che non siano presenti errori in rosso (es. `SyntaxError` o `ReferenceError`).
4. Prova a:
   - Cambiare centralina dal selettore *"SCEGLI CENTRALINA"*.
   - Alternare il tema con il pulsante Ocra (`[ ☼ Tema Chiaro ]` / `[ ☼ Tema Scuro ]`).
   - Selezionare una data nel campo *Data Inizio*.
   - Esportare il file CSV tramite il pulsante *Estrai CSV*.

---

## 6. Procedura per Salvare e Pubblicare su GitHub

Per sincronizzare il lavoro su GitHub e rendere pubbliche le modifiche sul sito live ([https://giuse-arte.github.io/AQI02/index.html](https://giuse-arte.github.io/AQI02/index.html)):

Apri il terminale nella cartella del progetto (`c:\Users\Maria Luisa\Desktop\New_Dashboard`) ed esegui i seguenti comandi in sequenza:

```bash
# 1. Verifica i file modificati
git status

# 2. Aggiungi tutte le modifiche alla staging area
git add .

# 3. Crea un commit con una descrizione chiara della modifica
git commit -m "Descrizione sintetica delle modifiche apportate"

# 4. Sincronizza con eventuali aggiornamenti remoti
git pull --rebase origin main

# 5. Invia le modifiche su GitHub
git push origin main
```

Una volta completato il `git push`, GitHub Pages aggiornerà automaticamente la dashboard online in circa 1-2 minuti.

---

## 7. Come Aggiornare il Manuale Operativo

Se apporti modifiche alle funzionalità della dashboard, aggiorna la documentazione:

1. **Aggiorna il file Markdown**: Modifica [`README.md`](file:///c:/Users/Maria%20Luisa/Desktop/New_Dashboard/README.md) ed [`AQI_Dashboard_Operating_Manual_v07.md`](file:///c:/Users/Maria%20Luisa/Desktop/New_Dashboard/AQI_Dashboard_Operating_Manual_v07.md).
2. **Aggiorna il documento Word `.docx`**:
   - Puoi modificare ed esportare direttamente il file [`AQI_Dashboard_Operating_Manual_v07.docx`](file:///c:/Users/Maria%20Luisa/Desktop/New_Dashboard/AQI_Dashboard_Operating_Manual_v07.docx).
3. **Commit e Push**: Esegui `git add .`, `git commit` e `git push` per pubblicare la documentazione aggiornata.

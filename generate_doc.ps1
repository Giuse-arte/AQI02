# Script PowerShell per generare il documento Word (.docx) del Progetto Bene Comune Vimodrone
$ErrorActionPreference = "Stop"

$docxPath = "c:\Users\Maria Luisa\Desktop\New_Dashboard\Documentazione_Progetto_Bene_Comune_Vimodrone.docx"

Write-Host "Avvio Word COM Application..."
$word = New-Object -ComObject Word.Application
$word.Visible = $false

$doc = $word.Documents.Add()
$selection = $word.Selection

# --- COPERTINA ---
$selection.Font.Name = "Calibri"
$selection.Font.Size = 26
$selection.Font.Bold = $true
$selection.Font.Color = [Microsoft.Office.Interop.Word.WdColor]::wdColorNavy
$selection.ParagraphFormat.SpaceAfter = 12
$selection.ParagraphFormat.Alignment = 1 # Center
$selection.TypeText("BENE COMUNE VIMODRONE`n")

$selection.Font.Size = 18
$selection.Font.Bold = $true
$selection.Font.Color = [Microsoft.Office.Interop.Word.WdColor]::wdColorDarkTeal
$selection.ParagraphFormat.SpaceAfter = 18
$selection.TypeText("Documentazione Tecnica e Descrittiva del Progetto Sito Web Dashboard AQI`n")

$selection.Font.Size = 12
$selection.Font.Bold = $false
$selection.Font.Italic = $true
$selection.Font.Color = [Microsoft.Office.Interop.Word.WdColor]::wdColorGray60
$selection.ParagraphFormat.SpaceAfter = 30
$selection.TypeText("Sistema IoT per il Monitoraggio della Qualita dell'Aria - Versione 07.00`nData Documento: Luglio 2026`n`n")

$selection.ParagraphFormat.Alignment = 0 # Left

# Separatore
$pLine = $doc.Paragraphs.Add()
$pLine.Range.Text = "_________________________________________________________________________________"
$pLine.Range.Font.Color = [Microsoft.Office.Interop.Word.WdColor]::wdColorGray40
$pLine.SpaceAfter = 18
$pLine.Range.InsertParagraphAfter()

# --- PREMESSA ---
$pHeadingP = $doc.Paragraphs.Add()
$pHeadingP.Range.Text = "PREMESSA"
$pHeadingP.Range.Font.Name = "Calibri"
$pHeadingP.Range.Font.Size = 18
$pHeadingP.Range.Font.Bold = $true
$pHeadingP.Range.Font.Color = [Microsoft.Office.Interop.Word.WdColor]::wdColorNavy
$pHeadingP.SpaceAfter = 12
$pHeadingP.Range.InsertParagraphAfter()

$p1Text = "Il progetto ""Bene Comune Vimodrone - Dashboard AQI"" nasce con l'obiettivo prioritario di fornire alla cittadinanza e all'amministrazione comunale uno strumento tecnologico moderno, trasparente e di facile consultazione per il monitoraggio in tempo reale della qualita dell'aria nel territorio cittadino."
$p1 = $doc.Paragraphs.Add()
$p1.Range.Text = $p1Text
$p1.Range.Font.Name = "Calibri"
$p1.Range.Font.Size = 11
$p1.SpaceAfter = 8
$p1.Range.InsertParagraphAfter()

$p2Text = "Attraverso l'installazione di stazioni e centraline di rilevamento IoT (Internet of Things) collocate in punti strategici della citta, il sistema acquisisce in continuo parametri microclimatici ed ambientali fondamentali, quali la concentrazione di particolato atmosferico (PM1, PM2.5, PM10), i Composti Organici Volatili (VOC), la temperatura, l'umidita e la pressione atmosferica. I dati raccolti dalle stazioni sul campo vengono trasmessi tramite rete wireless verso l'infrastruttura Cloud ThingSpeak e resi immediatamente accessibili tramite una dashboard web ad alte prestazioni."
$p2 = $doc.Paragraphs.Add()
$p2.Range.Text = $p2Text
$p2.Range.Font.Name = "Calibri"
$p2.Range.Font.Size = 11
$p2.SpaceAfter = 8
$p2.Range.InsertParagraphAfter()

$p3Text = "L'applicazione si distingue per l'adozione dei piu severi ed aggiornati standard internazionali di valutazione della qualita dell'aria, consentendo la fruizione dei dati sia secondo la classificazione europea EEA (European Environment Agency) sia secondo l'indice numerico EPA (US Environmental Protection Agency). L'interfaccia utente e stata progettata seguendo le linee guida del moderno web design, garantendo responsivita, supporto al tema scuro e tema chiaro pastello, esportazione dei report in formato CSV e geolocalizzazione dinamica dei dispositivi."
$p3 = $doc.Paragraphs.Add()
$p3.Range.Text = $p3Text
$p3.Range.Font.Name = "Calibri"
$p3.Range.Font.Size = 11
$p3.SpaceAfter = 20
$p3.Range.InsertParagraphAfter()

# --- CAPITOLO 1 ---
$pCap1 = $doc.Paragraphs.Add()
$pCap1.Range.Text = "CAPITOLO 1: Struttura del Progetto e Descrizione dei File"
$pCap1.Range.Font.Name = "Calibri"
$pCap1.Range.Font.Size = 18
$pCap1.Range.Font.Bold = $true
$pCap1.Range.Font.Color = [Microsoft.Office.Interop.Word.WdColor]::wdColorNavy
$pCap1.SpaceAfter = 12
$pCap1.Range.InsertParagraphAfter()

$cap1IntroText = "Il progetto e sviluppato con un'architettura web modulare basata su HTML5, JavaScript Moderno ES6 (con moduli nativi import/export) e Vanilla CSS organizzato in una struttura a componenti. Questa scelta architetturale assicura tempi di caricamento istantanei, assenza di dipendenze pesanti da framework esterni e la massima manutenibilita del codice nel tempo."
$pCap1Intro = $doc.Paragraphs.Add()
$pCap1Intro.Range.Text = $cap1IntroText
$pCap1Intro.Range.Font.Name = "Calibri"
$pCap1Intro.Range.Font.Size = 11
$pCap1Intro.SpaceAfter = 12
$pCap1Intro.Range.InsertParagraphAfter()

# TABELLA FILE
$pTabTitle = $doc.Paragraphs.Add()
$pTabTitle.Range.Text = "Tabella 1.1 - Prospetto sintetico dell'albero di progetto"
$pTabTitle.Range.Font.Name = "Calibri"
$pTabTitle.Range.Font.Size = 12
$pTabTitle.Range.Font.Bold = $true
$pTabTitle.Range.Font.Color = [Microsoft.Office.Interop.Word.WdColor]::wdColorDarkTeal
$pTabTitle.SpaceAfter = 6
$pTabTitle.Range.InsertParagraphAfter()

$tableData = @(
    @("Percorso File", "Tipo / Categoria", "Descrizione Sintetica"),
    @("index.html", "HTML5 Document", "Struttura portante DOM dell'applicazione e layout dell'interfaccia utente."),
    @("js/app.js", "JavaScript Module", "Controller principale, gestione dello stato, eventi UI e ciclo di refresh."),
    @("js/config.js", "JavaScript Module", "Configurazione centraline, costanti, soglie EEA/EPA e metadata dei grafici."),
    @("js/api.js", "JavaScript Module", "Integrazione REST ThingSpeak API, geolocalizzazione OSM e dati demo di fallback."),
    @("js/calculations.js", "JavaScript Module", "Algoritmi di calcolo AQI (EEA/EPA), medie mobili 24h e aggregazioni dati."),
    @("js/charts.js", "JavaScript Module", "Motore grafico interattivo basato su Chart.js e plugin griglia oraria custom."),
    @("js/storage.js", "JavaScript Module", "Gestione della persistenza delle preferenze utente nel LocalStorage."),
    @("js/csv.js", "JavaScript Module", "Motore di esportazione report in formato CSV (compatibile Excel con UTF-8 BOM)."),
    @("js/modal.js", "JavaScript Module", "Gestione finestre modali informative (soglie AQI, grafico COMBO) e conferme."),
    @("css/main.css", "CSS Stylesheet", "Design System globale, variabili CSS, utility glassmorphism e tema Chiaro Pastello."),
    @("css/header.css", "CSS Stylesheet", "Stili per l'Header di navigazione, titolo, badge e barra di geolocalizzazione."),
    @("css/kpi.css", "CSS Stylesheet", "Layout e formattazione per la griglia delle 8 Key Performance Indicator Cards."),
    @("css/charts.css", "CSS Stylesheet", "Stili per i contenitori dei grafici storici, schede e intestazioni cromatiche."),
    @("css/modal.css", "CSS Stylesheet", "Stili per l'overlay di sfondo, finestre modali e tabelle delle soglie."),
    @("assets/LOGO_BCV_3D.png", "Image Asset", "Favicon 3D ufficiale del progetto Bene Comune Vimodrone."),
    @("assets/Limiti-EEA.png", "Image Asset", "Infografica rappresentativa delle soglie di qualita dell'aria europee."),
    @("assets/Limiti-EPA.png", "Image Asset", "Infografica rappresentativa degli intervalli di qualita dell'aria americani."),
    @("README.md", "Documentation", "Manuale operativo e registro storico delle versioni (dalla v01.00 alla v07.00).")
)

$numRows = $tableData.Length
$numCols = 3
$tableRange = $doc.Paragraphs.Add().Range
$wordTable = $doc.Tables.Add($tableRange, $numRows, $numCols)
$wordTable.Borders.Enable = 1
$wordTable.Borders.InsideLineStyle = 1
$wordTable.Borders.OutsideLineStyle = 1

for ($r = 0; $r -lt $numRows; $r++) {
    for ($c = 0; $c -lt $numCols; $c++) {
        $cell = $wordTable.Cell($r + 1, $c + 1)
        $cell.Range.Text = $tableData[$r][$c]
        $cell.Range.Font.Name = "Calibri"
        if ($r -eq 0) {
            $cell.Range.Font.Bold = $true
            $cell.Range.Font.Size = 11
            $cell.Range.Font.Color = [Microsoft.Office.Interop.Word.WdColor]::wdColorWhite
            $cell.Shading.BackgroundPatternColor = [Microsoft.Office.Interop.Word.WdColor]::wdColorNavy
        } else {
            $cell.Range.Font.Size = 10
            if ($r % 2 -eq 0) {
                $cell.Shading.BackgroundPatternColor = [Microsoft.Office.Interop.Word.WdColor]::wdColorGray05
            }
        }
    }
}

$pSpace = $doc.Paragraphs.Add()
$pSpace.SpaceAfter = 18
$pSpace.Range.InsertParagraphAfter()

# SEZIONI FILE
$filesList = @(
    @{
        Name = "index.html";
        Role = "Struttura HTML5 semantica e layout dell'interfaccia utente (Single Page Application)";
        Desc = "Il file index.html costituisce l'unico punto d'accesso (DOM) della dashboard. Include i metadati di pagina, il collegamento alle librerie grafiche esterne (Chart.js e chartjs-adapter-date-fns tramite CDN) ed i collegamenti ai moduli CSS del progetto. La struttura e suddivisa in tre blocchi semantici principali: 1) Header e Control Bar: contiene il titolo della stazione attiva (#mainTitle), la barra di geolocalizzazione (#geoAddress) integrata con l'icona ed il testo per l'indirizzo stradale ricavato via Reverse Geocoding, ed i filtri di controllo (selettore modalita temporale 'live', 'day', 'week', 'month', 'year', selettore data inizio, standard AQI EEA/EPA, pulsante estrazione CSV, pulsante Tema Ocra e menu a tendina 'Contr. Centraline'). 2) Sezione KPI Cards (#humValue, #tempValue, #pressValue, #vocValue, #pm1Value, #pm25Value, #pm10Value, #aqiVal): disponibili su un'unica riga a 8 colonne su desktop. 3) Sezione Grafici Storici (#chartsContainer): contenitore dinamico nel quale vengono iniettati i canvas dei grafici da charts.js."
    },
    @{
        Name = "js/app.js";
        Role = "Controller applicativo principale, orchestrazione dello stato ed eventi UI";
        Desc = "Il file app.js gestisce la logica di controllo globale della dashboard. Inizializza lo stato dell'applicazione caricando le preferenze salvate per la centralina attiva, configura i listener per tutti gli elementi interattivi (cambio stazione, cambio modalita di visualizzazione, pulsante tema chiaro/scuro, estrazione CSV, apertura modali), calcola gli intervalli temporali tramite getTimeRange() e controlla il ciclo di refresh dei dati (refreshDashboard). Include inoltre la funzione updateGeoAddressUI() che implementa una chiamata asincrona al servizio OpenStreetMap Nominatim per ricavare l'indirizzo stradale esatto dalle coordinate della centralina, memorizzando i risultati in una cache locale (geocodeCache) per ridurre il carico di rete."
    },
    @{
        Name = "js/config.js";
        Role = "Costanti di configurazione, parametri stazioni e soglie normative";
        Desc = "Contiene le definizioni delle costanti globali del progetto. Nel dettaglio definisce: 1) STATIONS: l'array delle stazioni IoT configurate, contenente gli ID di canale ThingSpeak, le chiavi API di lettura ed i nomi descrittivi ('Device N AQI_01', 'Device N AQI_02'). 2) EEA_THRESHOLDS: le soglie ed i colori ufficiali dell'Agenzia Europea dell'Ambiente per i livelli di qualita da 1 (Buona) a 5 (Molto scarsa) per PM2.5 e PM10. 3) EPA_BREAKPOINTS: gli intervalli numerici (0-500) e le fasce di salute definite dall'US EPA. 4) CHART_META: i metadati descrittivi per ciascun grafico (titolo, sensore di provenienza, unita di misura, colori delle serie). 5) DEFAULT_PREFERENCES: la configurazione predefinita di fabbrica per le nuove stazioni."
    },
    @{
        Name = "js/api.js";
        Role = "Interfaccia verso il Cloud ThingSpeak REST API e parsing della geolocalizzazione";
        Desc = "Integrazione dei servizi web per il recupero dei dati ambientali. Contiene la funzione fetchChannelFeeds() per l'estrazione delle letture storiche da ThingSpeak per canale e intervallo di date, con meccanismo di sicurezza fallback su fetchLatestChannelFeeds() (fino a 8000 feed storici) in caso di intervallo vuoto. Implementa la funzione parseGeoAndRssi() che estrae con precisione le coordinate Latitudine/Longitudine e la potenza del segnale radio RSSI dal campo field8 dei feed Thingspeak o dalle impostazioni del canale. Fornisce inoltre la funzione getDemoData() per generare serie temporali sintetiche di emergenza in caso di totale indisponibilita della rete."
    },
    @{
        Name = "js/calculations.js";
        Role = "Algoritmi matematici, calcolo indici AQI e aggregazione temporale";
        Desc = "Contiene la logica matematica e computazionale del sistema: 1) computeEEAAQI(): calcola la classe di qualita dell'aria EEA valutando il valore peggiore tra le medie mobili 24h di PM2.5 e PM10. 2) computeEPAAQI(): esegue l'interpolazione lineare a tratti sui breakpoint EPA restituendo un indice numerico compreso tra 0 e 500. 3) aggregateHourly() ed aggregateDaily(): aggregano le letture grezze del sensore in medie orarie e giornaliere per ottimizzare la visualizzazione su archi temporali estesi (settimana, mese, anno). 4) calculateVOCBaselineAndDelta(): calcola la baseline di resistenza del gas (kOhm) nelle ultime 24h e determina il delta relativo per la rilevazione di picchi VOC. 5) calculateMovingAverageSeries(): calcola la media mobile continua su finestra temporale scorrevole di 24 ore per le polveri sottili."
    },
    @{
        Name = "js/charts.js";
        Role = "Motore di rendering grafico Chart.js e plugin griglia oraria personalizzata";
        Desc = "Gestisce la creazione, l'aggiornamento e la distruzione dei grafici canvas tramite l'integrazione di Chart.js. Registra il plugin custom hourGrid che disegna linee di griglia verticali orarie e giornaliere ad alta contrastivita adattate al tema visivo attivo. Gestisce il rendering del grafico COMBO (PM2.5 e PM10 in media mobile 24h) inserendo linee di soglia tratteggiate dinamiche per i limiti normativi EEA (25 e 50 ug/m3) ed EPA (35 e 150 ug/m3), e mostrando una schermata d'avviso nelle prime 24 ore da un reset della data inizio. Gestisce inoltre il grafico speciale per il Delta VOC e la scala dell'asse temporale X."
    },
    @{
        Name = "js/storage.js";
        Role = "Gestione della persistenza locale e memorizzazione preferenze per centralina";
        Desc = "Gestisce il salvataggio e la lettura delle preferenze di visualizzazione all'interno del LocalStorage del browser web. Implementa il salvataggio indipendente per singola centralina (chiavi aqi_dashboard_preferences_N), garantendo che ogni dispositivo IoT mantenga i propri filtri attivi, standard AQI selezionato e lista grafici abilitati. Include la funzione resetStationPreferencesKeepField() per il reset sicuro delle preferenze a seguito della modifica della 'Data Inizio' e la funzione migrateLegacyPreferences() per la migrazione automatica delle vecchie impostazioni."
    },
    @{
        Name = "js/csv.js";
        Role = "Modulo di esportazione dati in formato CSV per analisi avanzate";
        Desc = "Fornisce la funzione exportCSVData() che converte lo storico dei dati della centralina in un file CSV scaricabile direttamente dal browser. Il file generato adotta gli standard italiani/europei per Excel: separatore di colonna punto e virgola (;), separatore decimale virgola (,) ed intestazione dinamica contenente nome stazione, modalita e data. Le colonne esportate includono: Date/Time, year, month, temp, hum, pres, voc, PM1, PM2_5, PM2_5_mavg, PM10, PM10_mavg. Il file viene codificato inserendo il prefisso UTF-8 BOM (\uFEFF) per la corretta apertura automatica in Microsoft Excel senza problemi di accenti."
    },
    @{
        Name = "js/modal.js";
        Role = "Sistema di finestre modali dialogiche ed informative";
        Desc = "Gestisce l'interfaccia delle finestre sovrapposte (modal container). Fornisce: 1) openAQIInfoModal(): finestra modale interattiva a schede (Tab EEA / Tab EPA) che mostra le tabelle di classificazione dei livelli di inquinamento e carica le immagini infografiche esplicative. 2) openCOMBOInfoModal(): modale informativa di dettaglio sulle soglie di legge del grafico COMBO. 3) showResetConfirmationModal(): modale di conferma in stile vetro scuro che avvisa l'utente che la modifica della 'Data Inizio' comportera il reset delle preferenze memorizzate per la centralina attiva."
    },
    @{
        Name = "css/main.css";
        Role = "Design System centrale, variabili CSS globale e tema Chiaro Pastello";
        Desc = "Costituisce la spina dorsale stilistica dell'applicazione. Definisce le variabili cromatiche ed i token di design nella sezione :root (palette scura slate, colori accentati neon, font Google Inter ed Outfit, effetti di sfocatura vetro glassmorphism, ombreggiature e raggio dei bordi). Contiene inoltre l'intero set di regole sovrascritte per la modalita [data-theme='light'] (Tema Chiaro Pastello), definendo lo sfondo sfumato salvia/pastello (#ebf3f0), le schede bianche con bordo azzurro (#b8d4e8) e le intestazioni dei grafici in colore Blu Reale (#1b4db1)."
    },
    @{
        Name = "css/header.css";
        Role = "Stili per la barra superiore, badge di marca e pannello di controllo";
        Desc = "Definisce lo stile ed il layout responsive dell'Header. Regola il posizionamento del badge di marca, del titolo principale con gradiente cromatico, della riga di geolocalizzazione con lo slot icona da 22px per l'allineamento perfetto dell'indirizzo stradale. Gestisce la formattazione dei pulsanti di azione (pulsante Ocra per il cambio tema, pulsante Blu per l'apertura pannello) ed il posizionamento del menu a tendina drop-down 'Contr. Centraline' per la selezione rapida delle stazioni e dei grafici visibili."
    },
    @{
        Name = "css/kpi.css";
        Role = "Layout griglia a 8 colonne e formattazione delle Key Performance Indicator Cards";
        Desc = "Regola la struttura a griglia flessibile (CSS Grid / Flexbox) delle 8 KPI Cards. Su schermi desktop ad alta risoluzione forza la disposizione delle card su un'unica riga orizzontale a 8 colonne uguali. Definisce la dimensione dei font numerici in evidenza, le etichette dei sensori (BME680 e PMS5003), i badge colorati per l'indice AQI, le frecce per gli indicatori di trend dei VOC e lo stile per il pulsante informativo 'i'."
    },
    @{
        Name = "css/charts.css";
        Role = "Layout dei contenitori dei grafici storici e bande cromatiche";
        Desc = "Regola la disposizione della griglia dei grafici storici sensori (.charts-grid). Gestisce lo stile delle schede (.chart-card), il rettangolo di disegno dei canvas di Chart.js, la legenda personalizzata e la barra di intestazione. Nel tema chiaro pastello, imposta lo sfondo dell'intestazione al colore Blu Reale (#1b4db1) rendendo i testi bianchi ed il pulsante d'informazione perfettamente leggibile."
    },
    @{
        Name = "css/modal.css";
        Role = "Stili per lo strato di sovrapposizione (overlay) e le finestre modali";
        Desc = "Gestisce l'aspetto estetico delle finestre dialogiche (.modal-overlay e .modal-container). Regola la sfocatura dello sfondo, la transizione d'ingresso a comparsa, la tabella delle soglie (.threshold-table) con righe alternate, le immagini delle infografiche (Limiti-EEA e Limiti-EPA) ed i pulsanti di conferma e chiusura."
    },
    @{
        Name = "assets/ e File di Documentazione";
        Role = "Risorse grafiche del brand e documentazione di supporto";
        Desc = "La cartella assets racchiude le risorse visive utilizzate dalla dashboard: 1) LOGO_BCV_3D.png: logo 3D ufficiale del progetto utilizzato come Favicon della pagina web. 2) Limiti-EEA.png e Limiti-EPA.png: immagini infografiche esplicative visualizzate all'interno della finestra modale AQI. Il file README.md costituisce il manuale operativo completo di registro modifiche della dashboard (versione v07.00)."
    }
)

$idx = 1
foreach ($f in $filesList) {
    $pHead = $doc.Paragraphs.Add()
    $pHead.Range.Text = "1." + $idx + " File: " + $f.Name
    $pHead.Range.Font.Name = "Calibri"
    $pHead.Range.Font.Size = 14
    $pHead.Range.Font.Bold = $true
    $pHead.Range.Font.Color = [Microsoft.Office.Interop.Word.WdColor]::wdColorDarkTeal
    $pHead.SpaceAfter = 4
    $pHead.Range.InsertParagraphAfter()

    $pRole = $doc.Paragraphs.Add()
    $pRole.Range.Text = "Ruolo nel sistema: " + $f.Role
    $pRole.Range.Font.Name = "Calibri"
    $pRole.Range.Font.Size = 11
    $pRole.Range.Font.Bold = $true
    $pRole.Range.Font.Italic = $true
    $pRole.SpaceAfter = 6
    $pRole.Range.InsertParagraphAfter()

    $pDet = $doc.Paragraphs.Add()
    $pDet.Range.Text = $f.Desc
    $pDet.Range.Font.Name = "Calibri"
    $pDet.Range.Font.Size = 11
    $pDet.SpaceAfter = 14
    $pDet.Range.InsertParagraphAfter()

    $idx++
}

# Salva documento
$doc.SaveAs([ref]$docxPath)
$doc.Close()
$word.Quit()

Write-Host "SUCCESS: Documento creato con successo in: $docxPath"

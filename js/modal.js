/* ==========================================================================
   AQI DASHBOARD 2.0 - CUSTOM MODAL DIALOGS
   ========================================================================== */

/**
 * Remove any active modal overlays
 */
function closeModal() {
  document.querySelectorAll('.modal-overlay, .modal-container').forEach(el => el.remove());
}

/**
 * Opens AQI Threshold Info Modal with interactive tabs (EEA vs EPA)
 */
function openAQIInfoModal(activeMode = 'EEA') {
  closeModal();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.onclick = closeModal;

  const modal = document.createElement('div');
  modal.className = 'modal-container';

  modal.innerHTML = `
    <div class="modal-header">
      <div class="modal-title">
        <span>Soglie e Standard AQI</span>
      </div>
      <button class="modal-close-btn" id="modalCloseBtn">&times;</button>
    </div>
    <div class="modal-body">
      <div class="modal-tabs">
        <button class="modal-tab-btn ${activeMode === 'EEA' ? 'active' : ''}" id="tabEEA">Standard EEA (Europa)</button>
        <button class="modal-tab-btn ${activeMode === 'EPA' ? 'active' : ''}" id="tabEPA">Standard EPA (Stati Uniti)</button>
      </div>

      <div id="modalTabContent"></div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(modal);

  document.getElementById('modalCloseBtn').onclick = closeModal;

  const renderContent = (mode) => {
    const tabContent = document.getElementById('modalTabContent');
    const isEEA = mode === 'EEA';
    
    document.getElementById('tabEEA').className = `modal-tab-btn ${isEEA ? 'active' : ''}`;
    document.getElementById('tabEPA').className = `modal-tab-btn ${!isEEA ? 'active' : ''}`;

    const imgSrc = isEEA ? 'assets/Limiti-EEA.png' : 'assets/Limiti-EPA.png';

    if (isEEA) {
      tabContent.innerHTML = `
        <p style="color: var(--text-muted); margin-bottom: 1rem; line-height: 1.5; font-size: 0.9rem;">
          L'Indice Europeo della Qualità dell'Aria (European Air Quality Index) dell'EEA classifica lo stato dell'aria basandosi sulle <strong>medie calcolate sulle 24 ore (media mobile 24h)</strong> di PM2,5 e PM10 suddivise in 6 fasce ufficiali di qualità. Il valore e la classe finale assegnata all'indice AQI corrispondono alla concentrazione peggiore tra PM2.5 e PM10 nelle ultime 24 ore.
        </p>

        <table class="threshold-table">
          <thead>
            <tr>
              <th>Categoria EEA</th>
              <th>Colore associato</th>
              <th>PM2,5 (µg/m³ - media 24h)</th>
              <th>PM10 (µg/m³ - media 24h)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Buona (Good)</td>
              <td><span style="color:#38bdf8; font-weight:700;">Azzurro</span></td>
              <td>0 – 10</td>
              <td>0 – 20</td>
            </tr>
            <tr>
              <td>Accettabile (Fair)</td>
              <td><span style="color:#22c55e; font-weight:700;">Verde</span></td>
              <td>10 – 20</td>
              <td>20 – 40</td>
            </tr>
            <tr>
              <td>Moderata (Moderate)</td>
              <td><span style="color:#eab308; font-weight:700;">Giallo</span></td>
              <td>20 – 25</td>
              <td>40 – 50</td>
            </tr>
            <tr>
              <td>Scadente (Poor)</td>
              <td><span style="color:#ef4444; font-weight:700;">Rosso</span></td>
              <td>25 – 50</td>
              <td>50 – 100</td>
            </tr>
            <tr>
              <td>Molto scadente (Very poor)</td>
              <td><span style="color:#991b1b; font-weight:700;">Rosso Scuro</span></td>
              <td>50 – 75</td>
              <td>100 – 150</td>
            </tr>
            <tr>
              <td>Estremamente scadente (Extremely poor)</td>
              <td><span style="color:#a855f7; font-weight:700;">Viola Scuro</span></td>
              <td>&gt; 75</td>
              <td>&gt; 150</td>
            </tr>
          </tbody>
        </table>
      `;
    } else {
      tabContent.innerHTML = `
        <p style="color: var(--text-muted); margin-bottom: 1rem; line-height: 1.5; font-size: 0.9rem;">
          L'<strong>US EPA (Environmental Protection Agency)</strong> calcola un indice numerico da 0 a 500 tramite interpolazione lineare sui breakpoint ufficiali di concentrazione mediata sulle 24 ore di PM2.5 e PM10. Il valore peggiore determina l'AQI finale.
        </p>

        <table class="threshold-table">
          <thead>
            <tr>
              <th>AQI (Valore)</th>
              <th>PM2.5 (µg/m³ - media 24h)</th>
              <th>PM10 (µg/m³ - media 24h)</th>
              <th>Fascia di Salute</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>0 – 50</td>
              <td>0 – 9.0 µg/m³</td>
              <td>0 – 54 µg/m³</td>
              <td><strong style="color:#22c55e;">Buona</strong></td>
            </tr>
            <tr>
              <td>51 – 100</td>
              <td>9.1 – 35.4 µg/m³</td>
              <td>55 – 154 µg/m³</td>
              <td><strong style="color:#eab308;">Moderata</strong></td>
            </tr>
            <tr>
              <td>101 – 150</td>
              <td>35.5 – 55.4 µg/m³</td>
              <td>155 – 254 µg/m³</td>
              <td><strong style="color:#f97316;">Sensibile</strong></td>
            </tr>
            <tr>
              <td>151 – 200</td>
              <td>55.5 – 150.4 µg/m³</td>
              <td>255 – 354 µg/m³</td>
              <td><strong style="color:#ef4444;">Non salubre</strong></td>
            </tr>
            <tr>
              <td>201 – 300</td>
              <td>150.5 – 250.4 µg/m³</td>
              <td>355 – 424 µg/m³</td>
              <td><strong style="color:#991b1b;">Molto non salubre</strong></td>
            </tr>
            <tr>
              <td>301 – 500</td>
              <td>250.5 – 500.4 µg/m³</td>
              <td>425 – 604 µg/m³</td>
              <td><strong style="color:#a855f7;">Pericolosa</strong></td>
            </tr>
          </tbody>
        </table>
      `;
    }
  };

  document.getElementById('tabEEA').onclick = () => renderContent('EEA');
  document.getElementById('tabEPA').onclick = () => renderContent('EPA');

  renderContent(activeMode);
}

/**
 * Opens COMBO Chart Info Modal detailing thresholds
 */
function openCOMBOInfoModal() {
  closeModal();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.onclick = closeModal;

  const modal = document.createElement('div');
  modal.className = 'modal-container';
  modal.style.maxWidth = '680px';

  modal.innerHTML = `
    <div class="modal-header">
      <div class="modal-title">Info Grafico COMBO (Soglie PM2.5 / PM10)</div>
      <button class="modal-close-btn" id="modalCloseBtn">&times;</button>
    </div>
    <div class="modal-body">
      <p style="color: var(--text-muted); margin-bottom: 1rem; line-height: 1.5; font-size: 0.9rem;">
        Il grafico COMBO visualizza l'andamento delle medie mobili a 24 ore di PM2.5 e PM10 confrontate con le soglie normative ufficiali.
        Le linee tratteggiate di limite sono <strong>dinamiche</strong> e si impostano automaticamente sulla soglia pertinente al periodo temporale selezionato:
      </p>

      <!-- 1. MODALITA GIORNALIERE E BREVE/MEDIO TERMINE -->
      <div style="background: rgba(30,41,59,0.5); padding: 0.9rem 1rem; border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.08); margin-bottom: 0.85rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.4rem;">
          <h4 style="color: var(--primary); margin: 0; font-size: 0.92rem;">1. Modalità Breve/Medio Termine (Live 24h, Giorno, 7gg, Mese)</h4>
          <span style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 2px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 600;">Limiti Giornalieri (24h)</span>
        </div>
        <p style="color: var(--text-muted); font-size: 0.84rem; margin-bottom: 0.5rem; line-height: 1.4;">
          Nel grafico compare <strong>una sola linea di soglia per ciascun inquinante</strong>, posizionata sul limite massimo giornaliero calcolato sulle 24 ore:
        </p>
        <div style="font-size: 0.86rem; line-height: 1.6;">
          <p style="margin: 0.2rem 0;">
            <strong style="color:#f97316;">— — Linea Arancione a 50 µg/m³:</strong> Limite giornaliero EEA per <strong>PM10</strong> (soglia di legge D.Lgs. 155/2010).
          </p>
          <p style="margin: 0.2rem 0;">
            <strong style="color:#eab308;">— — Linea Gialla a 25 µg/m³:</strong> Limite giornaliero EEA per <strong>PM2.5</strong> (obiettivo nuova Direttiva UE / soglia qualità EEA).
          </p>
          <p style="margin: 0.4rem 0 0 0; color: var(--text-muted); font-size: 0.8rem;">
            <em>Se impostato su Standard EPA (USA):</em> Linea Rosso Scuro a <strong>150 µg/m³</strong> (PM10) e Linea Rossa a <strong>35 µg/m³</strong> (PM2.5).
          </p>
        </div>
      </div>

      <!-- 2. MODALITA ANNO -->
      <div style="background: rgba(30,41,59,0.5); padding: 0.9rem 1rem; border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.08); margin-bottom: 0.85rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.4rem;">
          <h4 style="color: var(--accent-purple); margin: 0; font-size: 0.92rem;">2. Modalità Lungo Termine (Anno)</h4>
          <span style="background: rgba(168, 85, 247, 0.15); color: #c084fc; padding: 2px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 600;">Limiti Annuali</span>
        </div>
        <p style="color: var(--text-muted); font-size: 0.84rem; margin-bottom: 0.5rem; line-height: 1.4;">
          Selezionando la modalità <strong>Anno</strong>, le linee tratteggiate si riposizionano automaticamente sulle soglie medie annuali da non superare nel lungo periodo:
        </p>
        <div style="font-size: 0.86rem; line-height: 1.6;">
          <p style="margin: 0.2rem 0;">
            <strong style="color:#f97316;">— — Linea Arancione a 40 µg/m³:</strong> Limite medio annuale di legge per <strong>PM10</strong>.
          </p>
          <p style="margin: 0.2rem 0;">
            <strong style="color:#eab308;">— — Linea Gialla a 20 µg/m³:</strong> Limite medio annuale di legge per <strong>PM2.5</strong>.
          </p>
          <p style="margin: 0.4rem 0 0 0; color: var(--text-muted); font-size: 0.8rem;">
            <em>Se impostato su Standard EPA (USA):</em> Linea Rosso Scuro a <strong>50 µg/m³</strong> (PM10) e Linea Rossa a <strong>15 µg/m³</strong> (PM2.5).
          </p>
        </div>
      </div>

      <div style="background: rgba(56, 189, 248, 0.08); border-left: 3px solid #0284c7; padding: 0.65rem 0.9rem; border-radius: 4px; font-size: 0.82rem; line-height: 1.45; color: var(--text-muted);">
        <strong style="color: var(--text-main);">Perché sul grafico vedi una sola linea per inquinante?</strong><br>
        Per garantire la massima leggibilità e non affollare il tracciato con 4 linee tratteggiate contemporanee, la dashboard visualizza esclusivamente la soglia coerente con la finestra temporale osservata (giornaliera nelle viste brevi, annuale nella vista a 365 giorni).
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(modal);

  document.getElementById('modalCloseBtn').onclick = closeModal;
}

/**
 * Opens PM2.5 & PM10 Single Charts Limits Info Modal
 */
function openPMLimitsInfoModal() {
  closeModal();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.onclick = closeModal;

  const modal = document.createElement('div');
  modal.className = 'modal-container';
  modal.style.maxWidth = '780px';

  modal.innerHTML = `
    <div class="modal-header">
      <div class="modal-title">Limiti e Soglie Giornaliere PM2.5 e PM10</div>
      <button class="modal-close-btn" id="modalCloseBtn">&times;</button>
    </div>
    <div class="modal-body">
      <p style="color: var(--text-muted); margin-bottom: 1rem; line-height: 1.5; font-size: 0.9rem;">
        I limiti giornalieri (calcolati sulle 24 ore) per le polveri sottili PM10 e PM2,5 variano in modo significativo a seconda che si considerino i limiti di legge attuali (D.Lgs. 155/2010), i nuovi obiettivi europei al 2030, o le soglie di protezione della salute raccomandate dall'Organizzazione Mondiale della Sanità (OMS).
      </p>

      <table class="threshold-table" style="margin-bottom: 1rem;">
        <thead>
          <tr>
            <th>Inquinante</th>
            <th>Normativa Italiana / UE Attuale</th>
            <th>Nuova Direttiva UE (Obiettivo 2030)</th>
            <th>Linee Guida OMS (Raccomandazioni)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>PM10</strong></td>
            <td>50 µg/m³ <br><small style="color:var(--text-muted);">(max 35 superamenti/anno)</small></td>
            <td>45 µg/m³ <br><small style="color:var(--text-muted);">(max 18 superamenti/anno)</small></td>
            <td>45 µg/m³ <br><small style="color:var(--text-muted);">(non da superare più di 3-4 giorni/anno)</small></td>
          </tr>
          <tr>
            <td><strong>PM2,5</strong></td>
            <td>Nessun limite giornaliero previsto*</td>
            <td>25 µg/m³ <br><small style="color:var(--text-muted);">(max 18 superamenti/anno)</small></td>
            <td>15 µg/m³ <br><small style="color:var(--text-muted);">(non da superare più di 3-4 giorni/anno)</small></td>
          </tr>
        </tbody>
      </table>

      <p style="font-size: 0.82rem; color: var(--text-muted); font-style: italic; line-height: 1.4;">
        *La normativa europea/italiana attuale (D.Lgs. 155/2010) fissa per il PM2,5 unicamente un limite medio annuale (20 µg/m³), senza prevedere una soglia specifica di blocco o sforamento sulle 24 ore.
      </p>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(modal);

  document.getElementById('modalCloseBtn').onclick = closeModal;
}

/**
 * Opens PM2.5 & PM10 Annual Limits Info Modal (used when viewMode === 'year')
 */
function openPMAnnualLimitsInfoModal() {
  closeModal();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.onclick = closeModal;

  const modal = document.createElement('div');
  modal.className = 'modal-container';
  modal.style.maxWidth = '780px';

  modal.innerHTML = `
    <div class="modal-header">
      <div class="modal-title">Limiti e Soglie Annuali PM2.5 e PM10</div>
      <button class="modal-close-btn" id="modalCloseBtn">&times;</button>
    </div>
    <div class="modal-body">
      <p style="color: var(--text-muted); margin-bottom: 0.75rem; line-height: 1.5; font-size: 0.9rem;">
        La Normativa Italiana /Europea e quella dell’Organizzazione Mondiale della sanità (OMS) stabiliscono dei limiti annuali per indicare le soglie di pericolosità all’esposizione per gli esseri umani per PM10 e PM2,5. Non viene normato il PM1.
      </p>
      <p style="color: var(--text-muted); margin-bottom: 1.25rem; line-height: 1.5; font-size: 0.9rem;">
        I dati da noi rilevati e di seguito riportati non sono certificati, ma permettono di misurare in modo sufficientemente preciso la variabilità rispetto ad uno standard al variare del tempo in luoghi predefiniti.
      </p>

      <table class="threshold-table" style="margin-bottom: 1rem;">
        <thead>
          <tr>
            <th>Inquinante</th>
            <th>Normativa Italiana / UE Attuale (D.Lgs. 155/2010)</th>
            <th>Nuova Direttiva UE (Obiettivo 2030)</th>
            <th>Linee Guida OMS (Raccomandazioni 2021)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>PM10</strong> <br><small style="color:#f97316; font-weight:600;">(Linea arancione/rossa)</small></td>
            <td><strong>40 µg/m³</strong></td>
            <td><strong>20 µg/m³</strong></td>
            <td><strong>15 µg/m³</strong></td>
          </tr>
          <tr>
            <td><strong>PM2,5</strong> <br><small style="color:#eab308; font-weight:600;">(Linea gialla)</small></td>
            <td><strong>20 µg/m³</strong></td>
            <td><strong>10 µg/m³</strong></td>
            <td><strong>5 µg/m³</strong></td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(modal);

  document.getElementById('modalCloseBtn').onclick = closeModal;
}

/**
 * Opens Wi-Fi RSSI Signal Levels Info Modal
 */
function openRSSIInfoModal() {
  closeModal();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.onclick = closeModal;

  const modal = document.createElement('div');
  modal.className = 'modal-container modal-rssi';
  modal.style.maxWidth = '780px';

  modal.innerHTML = `
    <div class="modal-header">
      <div class="modal-title">Livelli di Potenza del Segnale Wi-Fi (RSSI)</div>
      <button class="modal-close-btn" id="modalCloseBtn">&times;</button>
    </div>
    <div class="modal-body">
      <p style="color: var(--text-muted); margin-bottom: 0.75rem; line-height: 1.5; font-size: 0.9rem;">
        L'<strong>RSSI</strong> (<em>Received Signal Strength Indicator</em>) misura la potenza del segnale radio Wi-Fi ricevuto dalla centralina (modulo ESP32) dal punto di accesso (Access Point o Router).
      </p>
      <p style="color: var(--text-muted); margin-bottom: 1.25rem; line-height: 1.5; font-size: 0.9rem;">
        Il valore è espresso in <strong>dBm</strong> (decibel-milliwatt) su scala logaritmica negativa: 
        <strong>più il valore è vicino allo zero (meno negativo), più il segnale è potente e stabile</strong>. 
        Al contrario, valori inferiori a -80 dBm indicano un segnale degradato con elevato rischio di disconnessione e ritardo nella sincronizzazione.
      </p>

      <table class="threshold-table" style="margin-bottom: 1.25rem;">
        <thead>
          <tr>
            <th>Livello</th>
            <th>Intervallo RSSI</th>
            <th>Qualità Segnale</th>
            <th>Stato Operativo Centralina (ESP32)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <span class="legend-color-pill" style="background:#10b981; width:10px; height:10px; border-radius:50%; display:inline-block; margin-right:6px; vertical-align:middle;"></span>
              <strong style="color: #10b981;">Eccellente</strong>
            </td>
            <td><strong>&ge; -50 dBm</strong><br><small style="color:var(--text-muted);">(da -30 a -50 dBm)</small></td>
            <td>Massima intensità, minima latenza e assenza di interferenze.</td>
            <td>Invio dati istantaneo e fluido su ThingSpeak, massima affidabilità operativa.</td>
          </tr>
          <tr>
            <td>
              <span class="legend-color-pill" style="background:#06b6d4; width:10px; height:10px; border-radius:50%; display:inline-block; margin-right:6px; vertical-align:middle;"></span>
              <strong style="color: #06b6d4;">Buono</strong>
            </td>
            <td><strong>-51 a -67 dBm</strong></td>
            <td>Segnale forte e costante; standard raccomandato per connessioni continuative.</td>
            <td>Nessuna perdita di pacchetti, sincronizzazione regolare senza ritardi.</td>
          </tr>
          <tr>
            <td>
              <span class="legend-color-pill" style="background:#f59e0b; width:10px; height:10px; border-radius:50%; display:inline-block; margin-right:6px; vertical-align:middle;"></span>
              <strong style="color: #f59e0b;">Discreto</strong>
            </td>
            <td><strong>-68 a -75 dBm</strong></td>
            <td>Segnale sufficiente; attenuazione causata da muri, ostacoli o distanza media.</td>
            <td>Funzionamento idoneo per telemetria IoT, ma vulnerabile a peggioramenti o interferenze.</td>
          </tr>
          <tr>
            <td>
              <span class="legend-color-pill" style="background:#ef4444; width:10px; height:10px; border-radius:50%; display:inline-block; margin-right:6px; vertical-align:middle;"></span>
              <strong style="color: #ef4444;">Scarso</strong>
            </td>
            <td><strong>-76 a -85 dBm</strong></td>
            <td>Segnale debole; frequenti ritrasmissioni e instabilità della portante radio.</td>
            <td>Possibili ritardi nelle letture, pacchetti persi e occasionali buchi temporali nei grafici.</td>
          </tr>
          <tr>
            <td>
              <span class="legend-color-pill" style="background:#991b1b; width:10px; height:10px; border-radius:50%; display:inline-block; margin-right:6px; vertical-align:middle;"></span>
              <strong style="color: #dc2626;">Pessimo / Critico</strong>
            </td>
            <td><strong>&lt; -85 dBm</strong><br><small style="color:var(--text-muted);">(fino a -100 dBm)</small></td>
            <td>Segnale al limite della sensibilità del ricevitore Wi-Fi ESP32.</td>
            <td>Frequenti disconnessioni, prolungati tentativi di riconnessione e perdita di dati.</td>
          </tr>
        </tbody>
      </table>

      <div style="background: rgba(56, 189, 248, 0.08); border-left: 3px solid #0284c7; padding: 0.75rem 1rem; border-radius: 4px; font-size: 0.82rem; line-height: 1.45; color: var(--text-muted);">
        <strong style="color: var(--text-main);">Raccomandazione di installazione:</strong>
        Per garantire un flusso di rilevamento continuo senza interruzioni, è consigliabile posizionare la centralina in una zona in cui il segnale rimanga stabilmente sopra i <strong>-75 dBm</strong> (idealmente superiore a <strong>-67 dBm</strong>).
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(modal);

  document.getElementById('modalCloseBtn').onclick = closeModal;
}

/**
 * Custom Dark Glass Confirmation Modal for "Data Inizio" field changes
 */
function showResetConfirmationModal(fieldName, newValue, onConfirm, onCancel) {
  closeModal();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal-container';
  modal.style.maxWidth = '480px';

  modal.innerHTML = `
    <div class="modal-header">
      <div class="modal-title" style="color: var(--accent-amber);">Attenzione: Reset Preferenze</div>
    </div>
    <div class="modal-body">
      <div class="confirm-dialog-content">
        <div class="confirm-icon">&#9888;</div>
        <p style="font-size: 0.95rem;">
          La modifica di <strong>Data Inizio</strong> azzera le preferenze salvate per la centralina attiva (grafici selezioni, filtri, standard) ripristinando il setup di default.
        </p>
        <p style="font-size: 0.85rem; color: var(--text-muted);">
          Vuoi continuare applicando la nuova data selezionata?
        </p>
        
        <div class="confirm-actions">
          <button class="btn btn-primary" id="btnConfirmReset" style="background: var(--accent-rose);">Conferma e Resetta</button>
          <button class="btn" id="btnCancelReset" style="background: rgba(255,255,255,0.1); color: var(--text-main);">Annulla</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(modal);

  document.getElementById('btnConfirmReset').onclick = () => {
    closeModal();
    onConfirm();
  };

  document.getElementById('btnCancelReset').onclick = () => {
    closeModal();
    onCancel();
  };
}

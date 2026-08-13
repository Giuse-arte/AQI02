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
          L'Indice Europeo della Qualità dell'Aria (European Air Quality Index) dell'EEA misura le concentrazioni orarie (o medie calcolate su 24 ore) di PM2,5 e PM10 basandosi su 6 fasce di qualità. Definisce l'Indice di Qualità dell'Aria basandosi sulla concentrazione peggiore tra PM2.5 e PM10 nelle ultime 24 ore.
        </p>

        <table class="threshold-table">
          <thead>
            <tr>
              <th>Categoria EEA</th>
              <th>Colore associato</th>
              <th>Concentrazione PM2,5 (µg/m³)</th>
              <th>Concentrazione PM10 (µg/m³)</th>
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
          L'<strong>US EPA (Environmental Protection Agency)</strong> calcola un indice numerico da 0 a 500 tramite interpolazione lineare sui breakpoint ufficiali di PM2.5 e PM10. Il valore peggiore determina l'AQI finale.
        </p>

        <table class="threshold-table">
          <thead>
            <tr>
              <th>AQI (Valore)</th>
              <th>PM2.5 (24h)</th>
              <th>PM10 (24h)</th>
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
  modal.style.maxWidth = '650px';

  modal.innerHTML = `
    <div class="modal-header">
      <div class="modal-title">Info Grafico COMBO (Soglie PM2.5 / PM10)</div>
      <button class="modal-close-btn" id="modalCloseBtn">&times;</button>
    </div>
    <div class="modal-body">
      <p style="color: var(--text-muted); margin-bottom: 1rem;">
        La normativa Italiana/Europea (EEA) e quella Statunitense (EPA) stabiliscono sia <strong>limiti giornalieri (24h)</strong> per prevenire picchi acuti, sia <strong>limiti annuali (365 giorni)</strong> per tutelare la salute nel lungo termine.
      </p>

      <div style="background: rgba(30,41,59,0.5); padding: 1rem; border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.08); margin-bottom: 1rem;">
        <h4 style="color: var(--primary); margin-bottom: 0.4rem;">Standard EEA (Europa)</h4>
        <p><span style="color:#f97316; font-weight:700;">Linea Arancione:</span> 50 µg/m³ (Limite giornaliero PM10) | 40 µg/m³ (Limite annuale PM10)</p>
        <p><span style="color:#eab308; font-weight:700;">Linea Gialla:</span> 25 µg/m³ (Limite giornaliero PM2.5) | 20 µg/m³ (Limite annuale PM2.5)</p>
      </div>

      <div style="background: rgba(30,41,59,0.5); padding: 1rem; border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.08);">
        <h4 style="color: var(--accent-purple); margin-bottom: 0.4rem;">Standard EPA (USA)</h4>
        <p><span style="color:#7f1d1d; font-weight:700;">Linea Rosso Scuro:</span> 150 µg/m³ (Limite giornaliero PM10) | 50 µg/m³ (Limite annuale PM10)</p>
        <p><span style="color:#ef4444; font-weight:700;">Linea Rossa:</span> 35 µg/m³ (Limite giornaliero PM2.5) | 15 µg/m³ (Limite annuale PM2.5)</p>
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

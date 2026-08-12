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
        <span>Soglie e Standard AQI — ${activeMode}</span>
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
        <p style="color: var(--text-muted); margin-bottom: 0.8rem;">
          L'<strong>Agenzia Europea dell'Ambiente (EEA)</strong> definisce l'Indice di Qualità dell'Aria basandosi sulla concentrazione peggiore tra PM2.5 e PM10 nelle ultime 24 ore. L'indice non restituisce un valore numerico ma 5 classi di qualità.
        </p>
        <img src="${imgSrc}" class="infographic-img" alt="Limiti EEA" onerror="this.style.display='none'">
        
        <table class="threshold-table">
          <thead>
            <tr>
              <th>Classe</th>
              <th>PM2.5 (24h)</th>
              <th>PM10 (24h)</th>
              <th>Qualità Aria</th>
            </tr>
          </thead>
          <tbody>
            <tr><td><span style="color:#16a34a; font-weight:700;">Livello 1</span></td><td>0 – 10 µg/m³</td><td>0 – 20 µg/m³</td><td><strong style="color:#16a34a;">Buona</strong></td></tr>
            <tr><td><span style="color:#65a30d; font-weight:700;">Livello 2</span></td><td>10.1 – 20 µg/m³</td><td>20.1 – 40 µg/m³</td><td><strong style="color:#65a30d;">Discreta</strong></td></tr>
            <tr><td><span style="color:#eab308; font-weight:700;">Livello 3</span></td><td>20.1 – 25 µg/m³</td><td>40.1 – 50 µg/m³</td><td><strong style="color:#eab308;">Moderata</strong></td></tr>
            <tr><td><span style="color:#f97316; font-weight:700;">Livello 4</span></td><td>25.1 – 50 µg/m³</td><td>50.1 – 100 µg/m³</td><td><strong style="color:#f97316;">Scarsa</strong></td></tr>
            <tr><td><span style="color:#dc2626; font-weight:700;">Livello 5</span></td><td>&gt; 50 µg/m³</td><td>&gt; 100 µg/m³</td><td><strong style="color:#dc2626;">Molto scarsa</strong></td></tr>
          </tbody>
        </table>
      `;
    } else {
      tabContent.innerHTML = `
        <p style="color: var(--text-muted); margin-bottom: 0.8rem;">
          L'<strong>US EPA (Environmental Protection Agency)</strong> calcola un indice numerico da 0 a 500 tramite interpolazione lineare sui breakpoint ufficiali di PM2.5 e PM10. Il valore peggiore determina l'AQI finale.
        </p>
        <img src="${imgSrc}" class="infographic-img" alt="Limiti EPA" onerror="this.style.display='none'">

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
            <tr><td>0 – 50</td><td>0 – 12.0 µg/m³</td><td>0 – 54 µg/m³</td><td><strong style="color:#16a34a;">Buona</strong></td></tr>
            <tr><td>51 – 100</td><td>12.1 – 35.4 µg/m³</td><td>55 – 154 µg/m³</td><td><strong style="color:#f59e0b;">Moderata</strong></td></tr>
            <tr><td>101 – 150</td><td>35.5 – 55.4 µg/m³</td><td>155 – 254 µg/m³</td><td><strong style="color:#f97316;">Sensibile</strong></td></tr>
            <tr><td>151 – 200</td><td>55.5 – 150.4 µg/m³</td><td>255 – 354 µg/m³</td><td><strong style="color:#dc2626;">Non salubre</strong></td></tr>
            <tr><td>201 – 300</td><td>150.5 – 250.4 µg/m³</td><td>355 – 424 µg/m³</td><td><strong style="color:#7c2d12;">Molto non salubre</strong></td></tr>
            <tr><td>301 – 500</td><td>250.5 – 500.4 µg/m³</td><td>425 – 604 µg/m³</td><td><strong style="color:#4c0519;">Pericolosa</strong></td></tr>
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

/* ==========================================================================
   AQI DASHBOARD 2.0 - MAIN CONTROLLER & APPLICATION ENTRY POINT
   ========================================================================== */

import { STATIONS } from './config.js';
import { fetchChannelFeeds, fetchLive24hFeeds, parseGeoAndRssi, getDemoData } from './api.js';
import { fmt0, fmt1, computeEEAAQI, computeEPAAQI, calculateVOCBaselineAndDelta } from './calculations.js';
import { loadStationPreferences, saveStationPreferences, resetStationPreferencesKeepField, migrateLegacyPreferences } from './storage.js';
import { exportCSVData } from './csv.js';
import { openAQIInfoModal, showResetConfirmationModal } from './modal.js';
import { registerHourGridPlugin, renderActiveCharts } from './charts.js';

// Application State
let activeStationIdx = 0;
let currentStation = STATIONS[0];
let state = { ...loadStationPreferences(0) };
let rawFeedsStore = [];
let live24hFeedsStore = [];
let refreshTimer = null;
let lastFieldTracker = { startDate: '', viewMode: 'live', day: '' };

/**
 * Calculates time range bounds from active view mode and custom Start Date filter
 */
function getTimeRange() {
  const now = new Date();
  let start = now;
  let end = now;

  if (state.viewMode === 'live') {
    start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  } else if (state.viewMode === 'day' && state.day) {
    const selected = new Date(state.day);
    start = new Date(selected); start.setHours(0, 0, 0, 0);
    end = new Date(selected); end.setHours(23, 59, 59, 999);
  } else if (state.viewMode === 'week') {
    start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (state.viewMode === 'month') {
    start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (state.viewMode === 'year') {
    start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  }

  // Hard Start Date filter override
  if (state.startDate) {
    const hardStart = new Date(`${state.startDate}T00:00:00`);
    if (start < hardStart) start = hardStart;
  }

  return { start, end };
}

/**
 * Updates header text (Station Name, RSSI, Geolocation status, Date Range Subtitle)
 */
function updateHeaderUI(geoInfo, tStart, tEnd) {
  document.getElementById('mainTitle').textContent = `Air Quality Index Device — ${currentStation.name}`;
  
  const subtitleEl = document.getElementById('dateSubtitle');
  if (subtitleEl) {
    subtitleEl.textContent = `Inizio rilevamento dati: ${tStart.toLocaleDateString('it-IT')} | Fine: ${tEnd.toLocaleDateString('it-IT')}`;
  }

  const geoRssiEl = document.getElementById('geoRssiStatus');
  if (geoRssiEl && geoInfo) {
    geoRssiEl.innerHTML = `
      <span class="geo-led ${geoInfo.ledClass}"></span>
      GeoLocation (${geoInfo.geoLabel}): ${geoInfo.geoStr} | RSSI: ${geoInfo.rssiStr} (dBm)
    `;
  }
}

/**
 * Updates 8 synthetic KPI Cards using strictly real last 24h feeds
 */
function updateKPICards(kpiFeeds, allRangeFeeds) {
  if (!kpiFeeds || !kpiFeeds.length) {
    applyDemoKPIs();
    return;
  }

  const lastFeed = kpiFeeds.at(-1);

  // 1. Last Update Timestamp
  const lastDate = new Date(lastFeed.created_at);
  document.getElementById('lastUpdate').textContent = `Ultima rilevazione: ${lastDate.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${lastDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;

  // Helper for Min/Max range string across current view mode window
  const evalFeeds = allRangeFeeds.length ? allRangeFeeds : kpiFeeds;
  const getMinMaxStr = (fieldKey, unit) => {
    const validVals = evalFeeds.map(x => Number(x[fieldKey])).filter(v => !isNaN(v));
    if (!validVals.length) return '—';
    const min = Math.min(...validVals);
    const max = Math.max(...validVals);
    const isFloat = fieldKey === 'field1' || fieldKey === 'field2' || fieldKey === 'field3';
    return isFloat ? `${fmt1(min)} ${unit} — ${fmt1(max)} ${unit}` : `${fmt0(min)} ${unit} — ${fmt0(max)} ${unit}`;
  };

  // Card 1: Umidità
  document.getElementById('humValue').textContent = `${fmt1(lastFeed.field1)} %`;
  document.getElementById('humMM').textContent = getMinMaxStr('field1', '%');

  // Card 2: Temperatura
  document.getElementById('tempValue').textContent = `${fmt1(lastFeed.field2)} °C`;
  document.getElementById('tempMM').textContent = getMinMaxStr('field2', '°C');

  // Card 3: Pressione
  document.getElementById('pressValue').textContent = `${fmt1(lastFeed.field3)} hPa`;
  document.getElementById('pressMM').textContent = getMinMaxStr('field3', 'hPa');

  // Card 4: VOC (Absolute last value + Delta relative to 24h baseline with trend arrow)
  const { points: vocPoints } = calculateVOCBaselineAndDelta(kpiFeeds, kpiFeeds);
  if (vocPoints.length) {
    const lastVoc = vocPoints.at(-1);
    const prevVoc = vocPoints.length > 1 ? vocPoints.at(-2) : lastVoc;

    document.getElementById('vocValue').textContent = `${fmt1(lastVoc.yAbs)} kOhm`;

    const delta = lastVoc.yDelta;
    const trend = delta - prevVoc.yDelta;
    const arrow = trend >= 0 ? ' ↑' : ' ↓';
    const colorClass = trend >= 0 ? 'trend-positive' : 'trend-negative';
    const sign = delta >= 0 ? '+' : '';

    const deltaEl = document.getElementById('vocDelta');
    deltaEl.textContent = `${sign}${fmt1(delta)} kOhm${arrow}`;
    deltaEl.className = `kpi-subtext ${colorClass}`;
  }

  // Card 5: PM1
  document.getElementById('pm1Value').textContent = `${fmt0(lastFeed.field5)} µg/m³`;
  document.getElementById('pm1MM').textContent = getMinMaxStr('field5', 'µg/m³');

  // Card 6: PM2.5 (Instantaneous + 24h Moving Average subtext)
  const avg24PM25 = kpiFeeds.reduce((s, x) => s + Number(x.field6 || 0), 0) / kpiFeeds.length;
  document.getElementById('pm25Value').textContent = `${fmt0(lastFeed.field6)} µg/m³`;
  document.getElementById('pm25avg').textContent = `media 24h: ${fmt0(avg24PM25)} µg/m³`;

  // Card 7: PM10 (Instantaneous + 24h Moving Average subtext)
  const avg24PM10 = kpiFeeds.reduce((s, x) => s + Number(x.field7 || 0), 0) / kpiFeeds.length;
  document.getElementById('pm10Value').textContent = `${fmt0(lastFeed.field7)} µg/m³`;
  document.getElementById('pm10avg').textContent = `media 24h: ${fmt0(avg24PM10)} µg/m³`;

  // Card 8: AQI Index
  const aqiInfo = state.mode === 'EEA' ? computeEEAAQI(avg24PM25, avg24PM10) : computeEPAAQI(avg24PM25, avg24PM10);
  document.getElementById('aqiTitle').textContent = `AQI (${state.mode} 24h)`;
  document.getElementById('aqiVal').textContent = aqiInfo.valueStr;
  
  const badgeEl = document.getElementById('aqiBadge');
  badgeEl.textContent = aqiInfo.label;
  badgeEl.style.backgroundColor = aqiInfo.color;
}

/**
 * Fallback to demo KPI values if API fails
 */
function applyDemoKPIs() {
  const demo = getDemoData();
  updateKPICards(demo.feeds, demo.feeds);
}

/**
 * Main Data Fetcher & Dashboard Refresh Controller
 */
async function refreshDashboard() {
  if (refreshTimer) clearTimeout(refreshTimer);

  refreshTimer = setTimeout(async () => {
    const { start: tStart, end: tEnd } = getTimeRange();

    // 1. Fetch range feeds for historical charts
    const rangeData = await fetchChannelFeeds(currentStation.id, currentStation.apiKey, tStart, tEnd);
    
    // 2. Fetch live 24h feeds for KPI cards
    const live24hData = await fetchLive24hFeeds(currentStation.id, currentStation.apiKey);

    const feedsRange = rangeData ? (rangeData.feeds || []) : [];
    const feeds24h = live24hData ? (live24hData.feeds || []) : feedsRange;

    rawFeedsStore = feedsRange;
    live24hFeedsStore = feeds24h;

    const channelInfo = (live24hData && live24hData.channel) ? live24hData.channel : (rangeData ? rangeData.channel : {});
    const geoInfo = parseGeoAndRssi(channelInfo, feeds24h.at(-1) || feedsRange.at(-1));

    updateHeaderUI(geoInfo, tStart, tEnd);
    updateKPICards(feeds24h, feedsRange);

    const chartsContainer = document.getElementById('chartsContainer');
    renderActiveCharts(chartsContainer, feedsRange, state.charts, state.viewMode, state.day, state.mode, tStart);
  }, 250);
}

/**
 * Sync UI control inputs with active state
 */
function syncControlsUI() {
  document.getElementById('stationSelect').value = activeStationIdx.toString();
  document.getElementById('viewMode').value = state.viewMode;
  document.getElementById('day').value = state.day || '';
  document.getElementById('startDate').value = state.startDate || '';
  document.getElementById('mode').value = state.mode;
  document.getElementById('remember').checked = state.remember;

  // Day picker visibility toggle
  const isDayMode = state.viewMode === 'day';
  document.getElementById('dayGroup').style.display = isDayMode ? 'flex' : 'none';
  if (isDayMode && !state.day) {
    state.day = new Date().toISOString().slice(0, 10);
    document.getElementById('day').value = state.day;
  }

  // Sync checkboxes
  document.querySelectorAll('input[data-chart-id]').forEach(cb => {
    cb.checked = state.charts.includes(cb.dataset.chartId);
  });

  lastFieldTracker = {
    startDate: state.startDate,
    viewMode: state.viewMode,
    day: state.day
  };
}

/**
 * Handles Start Date change with custom Confirmation Modal
 */
function handleResettableFieldChange(fieldName, newValue, el) {
  showResetConfirmationModal(
    fieldName,
    newValue,
    () => {
      // Confirmed -> Reset preferences except for new date
      state = resetStationPreferencesKeepField(activeStationIdx, fieldName, newValue);
      syncControlsUI();
      saveStationPreferences(activeStationIdx, state);
      refreshDashboard();
    },
    () => {
      // Cancelled -> Revert element to previous tracker value
      el.value = lastFieldTracker[fieldName];
      state[fieldName] = lastFieldTracker[fieldName];
    }
  );
}

/**
 * Initialize application events & bindings
 */
function initApp() {
  migrateLegacyPreferences();
  registerHourGridPlugin();

  // Populate Station Switcher Select options
  const stationSelect = document.getElementById('stationSelect');
  stationSelect.innerHTML = '';
  STATIONS.forEach((st, idx) => {
    const opt = document.createElement('option');
    opt.value = idx.toString();
    opt.textContent = `${st.name} — ${st.location}`;
    stationSelect.appendChild(opt);
  });

  // Restore saved station selection from previous session
  const savedIdx = localStorage.getItem('aqi_station_idx');
  if (savedIdx !== null && STATIONS[savedIdx]) {
    activeStationIdx = Number(savedIdx);
  }
  currentStation = STATIONS[activeStationIdx];
  state = loadStationPreferences(activeStationIdx);
  syncControlsUI();

  // Station Select Listener
  stationSelect.addEventListener('change', (e) => {
    const newIdx = Number(e.target.value);
    activeStationIdx = newIdx;
    currentStation = STATIONS[newIdx];
    localStorage.setItem('aqi_station_idx', newIdx.toString());

    state = loadStationPreferences(newIdx);
    syncControlsUI();
    refreshDashboard();

    document.getElementById('panelDropdown').style.display = 'none';
  });

  // View Mode Change
  document.getElementById('viewMode').addEventListener('change', (e) => {
    state.viewMode = e.target.value;
    syncControlsUI();
    saveStationPreferences(activeStationIdx, state);
    refreshDashboard();
  });

  // Day Picker Change
  document.getElementById('day').addEventListener('change', (e) => {
    state.day = e.target.value;
    saveStationPreferences(activeStationIdx, state);
    refreshDashboard();
  });

  // Start Date Change with confirmation
  document.getElementById('startDate').addEventListener('change', (e) => {
    handleResettableFieldChange('startDate', e.target.value, e.target);
  });

  // AQI Standard Change
  document.getElementById('mode').addEventListener('change', (e) => {
    state.mode = e.target.value;
    saveStationPreferences(activeStationIdx, state);
    refreshDashboard();
  });

  // Remember Preferences Checkbox
  document.getElementById('remember').addEventListener('change', (e) => {
    state.remember = e.target.checked;
    saveStationPreferences(activeStationIdx, state);
  });

  // CSV Export Button
  document.getElementById('exportCsvBtn').addEventListener('click', () => {
    exportCSVData(currentStation.name, state.viewMode, state.day, rawFeedsStore);
  });

  // Control Panel Dropdown Toggle
  const togglePanelBtn = document.getElementById('togglePanelBtn');
  const panelDropdown = document.getElementById('panelDropdown');

  togglePanelBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = panelDropdown.style.display === 'flex';
    panelDropdown.style.display = isOpen ? 'none' : 'flex';
  });

  document.addEventListener('click', () => {
    panelDropdown.style.display = 'none';
  });

  panelDropdown.addEventListener('click', (e) => e.stopPropagation());

  // Select All / Deselect All Chart Checkboxes
  document.getElementById('selectAllBtn').addEventListener('click', () => {
    document.querySelectorAll('input[data-chart-id]').forEach(cb => cb.checked = true);
  });

  document.getElementById('deselectAllBtn').addEventListener('click', () => {
    document.querySelectorAll('input[data-chart-id]').forEach(cb => cb.checked = false);
  });

  // Apply Chart Selections
  document.getElementById('applyChartsBtn').addEventListener('click', () => {
    state.charts = [...document.querySelectorAll('input[data-chart-id]:checked')].map(cb => cb.dataset.chartId);
    saveStationPreferences(activeStationIdx, state);
    panelDropdown.style.display = 'none';
    refreshDashboard();
  });

  // AQI Info Modal Button
  document.getElementById('aqiInfoBtn').addEventListener('click', () => {
    openAQIInfoModal(state.mode);
  });

  // Initial Load
  refreshDashboard();
}

// Run init on DOM ready
document.addEventListener('DOMContentLoaded', initApp);

/* ==========================================================================
   AQI DASHBOARD 2.0 - MAIN CONTROLLER & APPLICATION ENTRY POINT
   ========================================================================== */

// Application State
let activeStationIdx = 0;
let currentStation = STATIONS[0];
let state = { ...loadStationPreferences(0) };
let rawFeedsStore = [];
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

// Geocoding cache to prevent repetitive Nominatim API calls
const geocodeCache = new Map();

async function updateGeoAddressUI(lat, lon) {
  const textEl = document.getElementById('geoAddressText');
  const containerEl = document.getElementById('geoAddress');
  if (!textEl && !containerEl) return;

  const setAddrText = (msg) => {
    if (textEl) {
      textEl.textContent = msg;
    } else if (containerEl) {
      containerEl.innerHTML = `<span class="geo-icon-box">📍</span><span id="geoAddressText">${msg}</span>`;
    }
  };

  if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) {
    setAddrText('Indirizzo: non disponibile per queste coordinate');
    return;
  }

  const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  if (geocodeCache.has(cacheKey)) {
    setAddrText(`Indirizzo: ${geocodeCache.get(cacheKey)}`);
    return;
  }

  setAddrText('Ricerca indirizzo in corso...');

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data && data.address) {
      const road = data.address.road || data.address.pedestrian || data.address.street || '';
      const suburb = data.address.suburb || data.address.neighbourhood || '';
      const city = data.address.city || data.address.town || data.address.village || data.address.municipality || '';
      
      // Estrazione e formattazione Provincia (es. MI) senza Regione né Italia
      let prov = data.address.province || data.address.county || data.address['ISO3166-2-lvl6'] || '';
      if (prov) {
        prov = prov.replace(/^IT-/i, '');
        if (prov.toLowerCase().includes('milano') || prov === 'MI') {
          prov = '(MI)';
        } else {
          prov = `(${prov.replace(/^Provincia di /i, '').replace(/^Città Metropolitana di /i, '')})`;
        }
      }

      // Costruzione Indirizzo: Via, Quartiere, Città, (Provincia)
      const parts = [road, suburb, city, prov].filter(Boolean);
      const formatted = parts.length ? parts.join(', ') : data.display_name;
      geocodeCache.set(cacheKey, formatted);
      setAddrText(`Indirizzo: ${formatted}`);
    } else {
      setAddrText('Indirizzo non identificato');
    }
  } catch (err) {
    console.warn('[Geocoding] Reverse geocode error:', err);
    setAddrText(`Coord: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
  }
}

/**
 * Updates header text (Station Name, RSSI, Geolocation status, Date Range Subtitle)
 */
function updateHeaderUI(geoInfo, tStart, tEnd) {
  document.getElementById('mainTitle').textContent = `Air Quality Index — ${currentStation.name}`;
  
  const subtitleEl = document.getElementById('dateSubtitle');
  if (subtitleEl) {
    subtitleEl.textContent = `Inizio rilevamento dati: ${tStart.toLocaleDateString('it-IT')} | Fine: ${tEnd.toLocaleDateString('it-IT')}`;
  }

  const mainLineEl = document.getElementById('geoMainLine');
  if (mainLineEl && geoInfo) {
    mainLineEl.innerHTML = `
      <span class="geo-icon-box"><span class="geo-led ${geoInfo.ledClass}"></span></span>
      <span>GeoLocation (${geoInfo.geoLabel}): ${geoInfo.geoStr} | RSSI: ${geoInfo.rssiStr} (dBm)</span>
    `;
  }

  if (geoInfo) {
    updateGeoAddressUI(geoInfo.lat, geoInfo.lon);
  }
}

/**
 * Updates 8 synthetic KPI Cards using the latest real feeds from the IoT station
 */
function updateKPICards(allAvailableFeeds) {
  if (!allAvailableFeeds || !allAvailableFeeds.length) {
    applyDemoKPIs();
    return;
  }

  // 1. Get the absolute latest real feed recorded by this station
  const lastFeed = allAvailableFeeds.at(-1);

  // Update "Ultima rilevazione" with exact date and time of the latest reading
  const lastDate = new Date(lastFeed.created_at);
  document.getElementById('lastUpdate').textContent = `Ultima rilevazione: ${lastDate.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${lastDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;

  // 2. Determine if the active operational session preceding lastDate has accumulated at least 24h of continuous history
  const parsedFeeds = allAvailableFeeds.map(f => new Date(f.created_at).getTime());
  let currentSessionStartTs = parsedFeeds.length ? parsedFeeds[0] : lastDate.getTime();
  
  for (let i = parsedFeeds.length - 1; i > 0; i--) {
    if (parsedFeeds[i] - parsedFeeds[i - 1] > 24 * 3600 * 1000) {
      currentSessionStartTs = parsedFeeds[i];
      break;
    }
  }

  const sessionDurationMs = lastDate.getTime() - currentSessionStartTs;
  const hasFull24h = sessionDurationMs >= 24 * 60 * 60 * 1000;

  // 3. Compute the 24-hour window preceding the last recorded reading
  const cutoff24h = new Date(lastDate.getTime() - 24 * 60 * 60 * 1000);
  const feeds24h = allAvailableFeeds.filter(f => {
    const d = new Date(f.created_at);
    return d >= cutoff24h && d <= lastDate;
  });

  const feedsForAvg = feeds24h.length ? feeds24h : allAvailableFeeds;

  // Helper for Min/Max range string
  const getMinMaxStr = (fieldKey, unit) => {
    const validVals = allAvailableFeeds.map(x => Number(x[fieldKey])).filter(v => !isNaN(v));
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
  const { points: vocPoints } = calculateVOCBaselineAndDelta(feedsForAvg, feedsForAvg);
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
  } else {
    document.getElementById('vocValue').textContent = `${fmt1(lastFeed.field4)} kOhm`;
    document.getElementById('vocDelta').textContent = `—`;
  }

  // Card 5: PM1
  document.getElementById('pm1Value').textContent = `${fmt0(lastFeed.field5)} µg/m³`;
  document.getElementById('pm1MM').textContent = getMinMaxStr('field5', 'µg/m³');

  // Card 6: PM2.5 (24h Moving Average as main value + 24h Min-Max range as subtext)
  if (hasFull24h) {
    const avg24PM25 = feedsForAvg.reduce((s, x) => s + Number(x.field6 || 0), 0) / feedsForAvg.length;
    document.getElementById('pm25Value').textContent = `${fmt0(avg24PM25)} µg/m³`;
    document.getElementById('pm25avg').textContent = getMinMaxStr('field6', 'µg/m³');
  } else {
    document.getElementById('pm25Value').textContent = `—`;
    document.getElementById('pm25avg').textContent = `in attesa 24h...`;
  }

  // Card 7: PM10 (24h Moving Average as main value + 24h Min-Max range as subtext)
  if (hasFull24h) {
    const avg24PM10 = feedsForAvg.reduce((s, x) => s + Number(x.field7 || 0), 0) / feedsForAvg.length;
    document.getElementById('pm10Value').textContent = `${fmt0(avg24PM10)} µg/m³`;
    document.getElementById('pm10avg').textContent = getMinMaxStr('field7', 'µg/m³');
  } else {
    document.getElementById('pm10Value').textContent = `—`;
    document.getElementById('pm10avg').textContent = `in attesa 24h...`;
  }

  // Card 8: AQI Index (Requires full 24h history for EEA/EPA compliance)
  document.getElementById('aqiTitle').textContent = `AQI (${state.mode} 24h)`;
  const badgeEl = document.getElementById('aqiBadge');

  if (hasFull24h) {
    const avg24PM25 = feedsForAvg.reduce((s, x) => s + Number(x.field6 || 0), 0) / feedsForAvg.length;
    const avg24PM10 = feedsForAvg.reduce((s, x) => s + Number(x.field7 || 0), 0) / feedsForAvg.length;
    const aqiInfo = state.mode === 'EEA' ? computeEEAAQI(avg24PM25, avg24PM10) : computeEPAAQI(avg24PM25, avg24PM10);

    document.getElementById('aqiVal').textContent = aqiInfo.valueStr;
    badgeEl.textContent = aqiInfo.label;
    badgeEl.style.backgroundColor = aqiInfo.color;
  } else {
    document.getElementById('aqiVal').textContent = `—`;
    badgeEl.textContent = `In attesa 24h`;
    badgeEl.style.backgroundColor = `#64748b`;
  }
}

/**
 * Fallback to demo KPI values if API network call fails completely
 */
function applyDemoKPIs() {
  const demo = getDemoData();
  updateKPICards(demo.feeds);
}

/**
 * Main Data Fetcher & Dashboard Refresh Controller
 */
async function refreshDashboard() {
  if (refreshTimer) clearTimeout(refreshTimer);

  refreshTimer = setTimeout(async () => {
    const { start: tStart, end: tEnd } = getTimeRange();

    // 1. Fetch range feeds for historical charts (with automatic fallback to latest historical feeds if range is empty)
    let channelData = await fetchChannelFeeds(currentStation.id, currentStation.apiKey, tStart, tEnd);

    // If channelData is missing or empty, fetch latest historical feeds directly
    if (!channelData || !channelData.feeds || !channelData.feeds.length) {
      channelData = await fetchLatestChannelFeeds(currentStation.id, currentStation.apiKey);
    }

    const feeds = channelData ? (channelData.feeds || []) : [];
    rawFeedsStore = feeds;

    const channelInfo = channelData ? (channelData.channel || {}) : {};
    
    // Parse GeoLocation & RSSI strictly from the latest real feed recorded by the station
    const lastRealFeed = feeds.at(-1);
    const geoInfo = parseGeoAndRssi(channelInfo, lastRealFeed);

    updateHeaderUI(geoInfo, tStart, tEnd);
    updateKPICards(feeds);

    const chartsContainer = document.getElementById('chartsContainer');
    renderActiveCharts(chartsContainer, feeds, state.charts, state.viewMode, state.day, state.mode, tStart, tEnd);
  }, 250);
}

/**
 * Sync UI control inputs with active state
 */
function syncControlsUI() {
  const stationSelect = document.getElementById('stationSelect');
  if (stationSelect) stationSelect.value = activeStationIdx.toString();
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
      state = resetStationPreferencesKeepField(activeStationIdx, fieldName, newValue);
      syncControlsUI();
      saveStationPreferences(activeStationIdx, state);
      refreshDashboard();
    },
    () => {
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

  // Theme Toggle (Dark / Pastel Light)
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeToggleText = document.getElementById('themeToggleText');
  const iconDark = themeToggleBtn ? themeToggleBtn.querySelector('.theme-icon-dark') : null;
  const iconLight = themeToggleBtn ? themeToggleBtn.querySelector('.theme-icon-light') : null;

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('aqi_theme', theme);
    } catch (e) {}

    if (theme === 'light') {
      if (themeToggleText) themeToggleText.textContent = 'Tema Scuro';
      if (iconDark) iconDark.style.display = 'none';
      if (iconLight) iconLight.style.display = 'inline-block';
    } else {
      if (themeToggleText) themeToggleText.textContent = 'Tema Chiaro';
      if (iconDark) iconDark.style.display = 'inline-block';
      if (iconLight) iconLight.style.display = 'none';
    }
  }

  let savedTheme = 'dark';
  try {
    savedTheme = localStorage.getItem('aqi_theme') || 'dark';
  } catch (e) {}
  applyTheme(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.body.getAttribute('data-theme') || 'dark';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      applyTheme(newTheme);
      refreshDashboard();
    });
  }

  // Layout Toggle (PC Grid / Mobile Single Column)
  const layoutToggleBtn = document.getElementById('layoutToggleBtn');
  const iconGrid = layoutToggleBtn ? layoutToggleBtn.querySelector('.layout-icon-grid') : null;
  const iconColumn = layoutToggleBtn ? layoutToggleBtn.querySelector('.layout-icon-column') : null;

  function applyLayoutMode(mode) {
    if (mode === 'column') {
      document.body.classList.add('layout-column');
      if (iconGrid) iconGrid.style.display = 'inline-block';
      if (iconColumn) iconColumn.style.display = 'none';
      if (layoutToggleBtn) layoutToggleBtn.setAttribute('title', 'Vista Cellulare attiva (Clicca per vista PC)');
    } else {
      document.body.classList.remove('layout-column');
      if (iconGrid) iconGrid.style.display = 'none';
      if (iconColumn) iconColumn.style.display = 'inline-block';
      if (layoutToggleBtn) layoutToggleBtn.setAttribute('title', 'Vista PC attiva (Clicca per vista Cellulare)');
    }
    try {
      localStorage.setItem('aqi_layout_mode', mode);
    } catch (e) {}

    setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
  }

  let savedLayout = 'grid';
  try {
    savedLayout = localStorage.getItem('aqi_layout_mode') || 'grid';
  } catch (e) {}
  applyLayoutMode(savedLayout);

  if (layoutToggleBtn) {
    layoutToggleBtn.addEventListener('click', () => {
      const isColumn = document.body.classList.contains('layout-column');
      applyLayoutMode(isColumn ? 'grid' : 'column');
    });
  }

  const stationSelect = document.getElementById('stationSelect');
  if (stationSelect) {
    stationSelect.innerHTML = '';
    STATIONS.forEach((st, idx) => {
      const opt = document.createElement('option');
      opt.value = idx.toString();
      opt.textContent = st.name;
      stationSelect.appendChild(opt);
    });
  }

  let savedIdx = null;
  try {
    savedIdx = localStorage.getItem('aqi_station_idx');
  } catch (e) {}
  if (savedIdx !== null && STATIONS[savedIdx]) {
    activeStationIdx = Number(savedIdx);
  }
  currentStation = STATIONS[activeStationIdx];
  state = loadStationPreferences(activeStationIdx);
  syncControlsUI();

  // Station Select Listener
  if (stationSelect) {
    stationSelect.addEventListener('change', (e) => {
      const newIdx = Number(e.target.value);
      activeStationIdx = newIdx;
      currentStation = STATIONS[newIdx];
      try {
        localStorage.setItem('aqi_station_idx', newIdx.toString());
      } catch (err) {}

      state.charts = loadStationPreferences(newIdx).charts;
      syncControlsUI();
      refreshDashboard();

      document.getElementById('panelDropdown').style.display = 'none';
    });
  }

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

  if (togglePanelBtn && panelDropdown) {
    togglePanelBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = panelDropdown.style.display === 'flex';
      panelDropdown.style.display = isOpen ? 'none' : 'flex';
    });

    document.addEventListener('click', () => {
      panelDropdown.style.display = 'none';
    });

    panelDropdown.addEventListener('click', (e) => e.stopPropagation());
  }

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
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

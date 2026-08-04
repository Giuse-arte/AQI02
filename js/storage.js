/* ==========================================================================
   AQI DASHBOARD 2.0 - LOCALSTORAGE PREFERENCES MANAGER
   ========================================================================== */

function getStationPrefKey(stationIdx) {
  return `aqi_dashboard_preferences_${stationIdx}`;
}

/**
 * Saves active visualization state into localStorage for a specific station
 */
function saveStationPreferences(stationIdx, stateObj) {
  const prefKey = getStationPrefKey(stationIdx);

  const prefs = {
    mode: stateObj.mode,
    startDate: stateObj.startDate,
    viewMode: stateObj.viewMode,
    day: stateObj.day,
    remember: stateObj.remember
  };

  // Persist chart checklist ONLY if "remember" is explicitly enabled by user
  if (stateObj.remember && Array.isArray(stateObj.charts)) {
    prefs.charts = stateObj.charts;
  }

  try {
    localStorage.setItem(prefKey, JSON.stringify(prefs));
  } catch (err) {
    console.error(`[Storage] Failed to save preferences for station ${stationIdx}:`, err);
  }
}

/**
 * Loads preferences for a station index, falling back to defaults if unconfigured
 */
function loadStationPreferences(stationIdx) {
  const prefKey = getStationPrefKey(stationIdx);
  let savedStr = null;
  try {
    savedStr = localStorage.getItem(prefKey);
  } catch (e) {}

  if (!savedStr) {
    return { ...DEFAULT_PREFERENCES };
  }

  try {
    const parsed = JSON.parse(savedStr);
    return {
      mode: parsed.mode || DEFAULT_PREFERENCES.mode,
      startDate: parsed.startDate || '',
      viewMode: parsed.viewMode || DEFAULT_PREFERENCES.viewMode,
      day: parsed.day || '',
      remember: !!parsed.remember,
      charts: (parsed.remember && Array.isArray(parsed.charts))
        ? parsed.charts
        : [...DEFAULT_PREFERENCES.charts]
    };
  } catch (err) {
    console.error(`[Storage] Failed to parse preferences for station ${stationIdx}:`, err);
    return { ...DEFAULT_PREFERENCES };
  }
}

/**
 * Resets station preferences in localStorage, keeping a newly modified field value
 */
function resetStationPreferencesKeepField(stationIdx, fieldName, newValue) {
  const prefKey = getStationPrefKey(stationIdx);
  try {
    localStorage.removeItem(prefKey);
  } catch (e) {}

  const newDefaults = {
    ...DEFAULT_PREFERENCES,
    remember: false,
    charts: [...DEFAULT_PREFERENCES.charts]
  };

  if (fieldName === 'startDate') newDefaults.startDate = newValue;
  if (fieldName === 'viewMode') newDefaults.viewMode = newValue;
  if (fieldName === 'day') newDefaults.day = newValue;

  return newDefaults;
}

/**
 * One-time legacy preferences migration from single key to station 0 index
 */
function migrateLegacyPreferences() {
  const key0 = getStationPrefKey(0);
  try {
    if (localStorage.getItem(key0) !== null) return;

    const legacy = localStorage.getItem('aqi_dashboard_preferences');
    if (!legacy) return;

    const prefs = JSON.parse(legacy);
    prefs.viewMode = prefs.viewMode || localStorage.getItem('aqi_viewMode') || 'live';
    prefs.day = prefs.day || localStorage.getItem('aqi_day') || '';
    prefs.remember = true;
    localStorage.setItem(key0, JSON.stringify(prefs));

    localStorage.removeItem('aqi_dashboard_preferences');
    localStorage.removeItem('aqi_viewMode');
    localStorage.removeItem('aqi_day');
  } catch (e) {
    console.error('[Storage] Legacy preference migration failed:', e);
  }
}

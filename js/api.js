/* ==========================================================================
   AQI DASHBOARD 2.0 - THINGSPEAK API & DEMO DATA FETCHER
   ========================================================================== */

/**
 * Format local JS Date to ThingSpeak API string format (YYYY-MM-DD HH:mm:ss)
 */
export function formatLocalDateTime(d) {
  const pad = n => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * Fallback demo data used when ThingSpeak API fails or is offline
 */
export function getDemoData() {
  const now = new Date();
  const feeds = [];
  
  // Generate 48 synthetic feeds over 24h
  for (let i = 48; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 30 * 60 * 1000);
    feeds.push({
      created_at: t.toISOString(),
      field1: (50 + Math.sin(i / 5) * 10 + Math.random() * 2).toFixed(1), // Humidity
      field2: (22 + Math.cos(i / 5) * 4 + Math.random()).toFixed(1),      // Temp
      field3: (1013 + Math.sin(i / 10) * 5).toFixed(1),                  // Pressure
      field4: (45 + Math.sin(i / 3) * 15 + Math.random() * 5).toFixed(1), // VOC
      field5: Math.round(6 + Math.random() * 5).toString(),              // PM1
      field6: Math.round(12 + Math.random() * 8).toString(),             // PM2.5
      field7: Math.round(18 + Math.random() * 12).toString(),            // PM10
      field8: "-68;45.465421,9.185924"                                    // RSSI;lat,lon
    });
  }
  
  return { feeds, channel: { latitude: "0.0", longitude: "0.0" } };
}

/**
 * Fetch feeds from ThingSpeak REST API for a given station channel & date range
 */
export async function fetchChannelFeeds(channelId, apiKey, tStart, tEnd) {
  // Pre-buffer start by 24h for rolling calculations if needed
  const startBuffer = new Date(tStart.getTime() - 24 * 60 * 60 * 1000);
  const startStr = formatLocalDateTime(startBuffer);
  const endStr = formatLocalDateTime(tEnd);

  const url = `https://api.thingspeak.com/channels/${channelId}/feeds.json?start=${encodeURIComponent(startStr)}&end=${encodeURIComponent(endStr)}&results=8000&api_key=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn(`[API] Fetch failed for channel ${channelId}:`, error);
    return null;
  }
}

/**
 * Fetch dedicated live 24h feeds strictly for synthetic KPI cards
 */
export async function fetchLive24hFeeds(channelId, apiKey) {
  const now = new Date();
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const url = `https://api.thingspeak.com/channels/${channelId}/feeds.json?start=${encodeURIComponent(formatLocalDateTime(since24h))}&end=${encodeURIComponent(formatLocalDateTime(now))}&results=8000&api_key=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn(`[API] Live 24h KPI fetch failed:`, error);
    return null;
  }
}

/**
 * Parses Geolocation metadata and RSSI from ThingSpeak payload
 */
export function parseGeoAndRssi(channelObj, lastFeed) {
  let manualGeo = { lat: null, lon: null };
  const chLat = parseFloat(channelObj?.latitude);
  const chLon = parseFloat(channelObj?.longitude);

  if (!isNaN(chLat) && !isNaN(chLon) && (chLat !== 0 || chLon !== 0)) {
    manualGeo = { lat: chLat, lon: chLon };
  }

  const f8 = lastFeed?.field8;
  let rssi = NaN;
  if (f8 !== undefined && f8 !== null && f8 !== '') {
    rssi = Number(String(f8).split(';')[0]);
  }

  let geoStr = '-';
  let geoLabel = 'Non disponibile';
  let ledClass = 'non-disponibile';

  if (manualGeo.lat !== null) {
    geoStr = `${manualGeo.lat.toFixed(6)},${manualGeo.lon.toFixed(6)}`;
    geoLabel = 'Configurata';
    ledClass = 'configurata';
  } else if (f8 !== undefined && f8 !== null && f8 !== '') {
    const semiParts = String(f8).split(';');
    if (semiParts[1]) {
      const geoParts = semiParts[1].split(',');
      const lat = Number(geoParts[0]);
      const lon = Number(geoParts[1]);
      if (!isNaN(lat) && !isNaN(lon)) {
        geoStr = `${lat.toFixed(6)},${lon.toFixed(6)}`;
        geoLabel = 'Automatica';
        ledClass = 'automatica';
      }
    }
  }

  return {
    rssiStr: isNaN(rssi) ? '—' : `${rssi.toFixed(0)}`,
    geoStr,
    geoLabel,
    ledClass
  };
}

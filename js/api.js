/* ==========================================================================
   AQI DASHBOARD 2.0 - THINGSPEAK API & DEMO DATA FETCHER
   ========================================================================== */

/**
 * Format local JS Date to ThingSpeak API string format (YYYY-MM-DD HH:mm:ss)
 */
function formatLocalDateTime(d) {
  const pad = n => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * Fallback demo data used ONLY when network/HTTP request completely fails
 */
function getDemoData() {
  const now = new Date();
  const feeds = [];
  
  for (let i = 48; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 30 * 60 * 1000);
    feeds.push({
      created_at: t.toISOString(),
      field1: (50 + Math.sin(i / 5) * 10 + Math.random() * 2).toFixed(1),
      field2: (22 + Math.cos(i / 5) * 4 + Math.random()).toFixed(1),
      field3: (1013 + Math.sin(i / 10) * 5).toFixed(1),
      field4: (45 + Math.sin(i / 3) * 15 + Math.random() * 5).toFixed(1),
      field5: Math.round(6 + Math.random() * 5).toString(),
      field6: Math.round(12 + Math.random() * 8).toString(),
      field7: Math.round(18 + Math.random() * 12).toString(),
      field8: "-68;45.465421,9.185924"
    });
  }
  
  return { feeds, channel: { latitude: "0.0", longitude: "0.0" } };
}

/**
 * Fetch latest historical feeds from ThingSpeak without date restrictions (up to 8000 latest feeds)
 */
async function fetchLatestChannelFeeds(channelId, apiKey) {
  const url = `https://api.thingspeak.com/channels/${channelId}/feeds.json?results=8000&api_key=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn(`[API] Fetch latest feeds failed for channel ${channelId}:`, error);
    return null;
  }
}

/**
 * Fetch feeds from ThingSpeak REST API for a given station channel & date range
 */
async function fetchChannelFeeds(channelId, apiKey, tStart, tEnd) {
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
    
    // If range query returns feeds, return them; otherwise fallback to fetching latest historical channel feeds
    if (data && data.feeds && data.feeds.length > 0) {
      return data;
    }

    const fallbackData = await fetchLatestChannelFeeds(channelId, apiKey);
    return fallbackData || data;
  } catch (error) {
    console.warn(`[API] Fetch failed for channel ${channelId}:`, error);
    const fallbackData = await fetchLatestChannelFeeds(channelId, apiKey);
    return fallbackData;
  }
}

/**
 * Parses Geolocation metadata and RSSI strictly from the latest feed reading and channel settings
 */
function parseGeoAndRssi(channelObj, lastFeed) {
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
  let latNum = null;
  let lonNum = null;

  if (manualGeo.lat !== null) {
    latNum = manualGeo.lat;
    lonNum = manualGeo.lon;
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
        latNum = lat;
        lonNum = lon;
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
    ledClass,
    lat: latNum,
    lon: lonNum
  };
}

/* ==========================================================================
   AQI DASHBOARD 2.0 - CALCULATIONS & DATA AGGREGATION
   ========================================================================== */

import { EEA_THRESHOLDS, EPA_BREAKPOINTS } from './config.js';

/**
 * Format helper: 1 decimal string or '—' if invalid
 */
export const fmt1 = v => (v == null || isNaN(v) ? '—' : Number(v).toFixed(1));

/**
 * Format helper: integer string or '—' if invalid
 */
export const fmt0 = v => (v == null || isNaN(v) ? '—' : Math.round(Number(v)).toString());

/**
 * Compute EEA AQI category badge & color based on PM2.5 and PM10 24h moving averages
 */
export function computeEEAAQI(pm25_24, pm10_24) {
  const clsPM25 = pm25_24 <= EEA_THRESHOLDS.PM25[0] ? 1 :
                  pm25_24 <= EEA_THRESHOLDS.PM25[1] ? 2 :
                  pm25_24 <= EEA_THRESHOLDS.PM25[2] ? 3 :
                  pm25_24 <= EEA_THRESHOLDS.PM25[3] ? 4 : 5;

  const clsPM10 = pm10_24 <= EEA_THRESHOLDS.PM10[0] ? 1 :
                  pm10_24 <= EEA_THRESHOLDS.PM10[1] ? 2 :
                  pm10_24 <= EEA_THRESHOLDS.PM10[2] ? 3 :
                  pm10_24 <= EEA_THRESHOLDS.PM10[3] ? 4 : 5;

  const worstCls = Math.max(clsPM25, clsPM10);
  const info = EEA_THRESHOLDS.CLASSES[worstCls] || EEA_THRESHOLDS.CLASSES[1];

  return {
    valueStr: '—',
    label: info.label,
    color: info.color,
    bg: info.bg,
    standard: 'EEA'
  };
}

/**
 * Compute EPA numerical AQI value (0-500) and color band via piecewise linear interpolation
 */
export function computeEPAAQI(pm25_24, pm10_24) {
  const calcSegment = (c, breakpoints) => {
    for (const [Clo, Chi, Ilo, Ihi] of breakpoints) {
      if (c >= Clo && c <= Chi) {
        return Math.round(((Ihi - Ilo) / (Chi - Clo)) * (c - Clo) + Ilo);
      }
    }
    return 0;
  };

  const aqi25 = calcSegment(pm25_24, EPA_BREAKPOINTS.PM25);
  const aqi10 = calcSegment(pm10_24, EPA_BREAKPOINTS.PM10);
  const finalAQI = Math.max(aqi25, aqi10);

  let band = EPA_BREAKPOINTS.BANDS[0];
  for (const b of EPA_BREAKPOINTS.BANDS) {
    if (finalAQI <= b.max) {
      band = b;
      break;
    }
  }

  return {
    valueStr: finalAQI.toString(),
    label: band.label,
    color: band.color,
    standard: 'EPA'
  };
}

/**
 * Aggregate feeds into hourly points (averaging consecutive feeds per hour)
 */
export function aggregateHourly(feeds, field) {
  const valid = feeds.filter(f => !isNaN(Number(f[field])));
  if (!valid.length) return [];

  const map = {};
  valid.forEach(f => {
    const d = new Date(f.created_at);
    const hourTs = Math.floor(d.getTime() / 3600000) * 3600000;
    if (!map[hourTs]) map[hourTs] = [];
    map[hourTs].push(Number(f[field]));
  });

  return Object.entries(map)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([hourTs, vals]) => ({
      x: new Date(Number(hourTs)),
      y: vals.reduce((s, v) => s + v, 0) / vals.length
    }));
}

/**
 * Aggregate feeds into daily points (calendar day averages)
 */
export function aggregateDaily(feeds, field) {
  const map = {};
  feeds.forEach(f => {
    const d = new Date(f.created_at);
    const key = d.toISOString().slice(0, 10);
    if (!map[key]) map[key] = [];
    const val = Number(f[field]);
    if (!isNaN(val)) map[key].push(val);
  });

  return Object.entries(map)
    .sort()
    .map(([dateStr, vals]) => ({
      x: new Date(`${dateStr}T12:00:00`),
      y: vals.reduce((s, v) => s + v, 0) / vals.length
    }));
}

/**
 * Calculate VOC 24h baseline and relative deltas
 */
export function calculateVOCBaselineAndDelta(allFeeds, feedsInRange) {
  const now = new Date();
  const cutoff24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Baseline = average of valid VOC values in real last 24h
  const valid24h = allFeeds.filter(f => new Date(f.created_at) >= cutoff24h && !isNaN(Number(f.field4)));
  
  let baseline = 0;
  if (valid24h.length) {
    baseline = valid24h.reduce((s, f) => s + Number(f.field4), 0) / valid24h.length;
  } else {
    const allValid = allFeeds.filter(f => !isNaN(Number(f.field4)));
    if (allValid.length) {
      baseline = allValid.reduce((s, f) => s + Number(f.field4), 0) / allValid.length;
    }
  }

  const points = feedsInRange.map(f => {
    const valAbs = Number(f.field4);
    return {
      x: new Date(f.created_at),
      yAbs: valAbs,
      yDelta: valAbs - baseline
    };
  });

  return { baseline, points };
}

/**
 * Calculate 24h rolling moving average series for PM fields
 */
export function calculateMovingAverageSeries(feeds, field) {
  return feeds.map((f, i) => {
    const ts = new Date(f.created_at).getTime();
    const cutoff = ts - 24 * 60 * 60 * 1000;
    
    const windowFeeds = feeds.filter(x => {
      const t = new Date(x.created_at).getTime();
      return t >= cutoff && t <= ts && !isNaN(Number(x[field]));
    });

    const avg = windowFeeds.length
      ? windowFeeds.reduce((s, x) => s + Number(x[field]), 0) / windowFeeds.length
      : Number(f[field]);

    return { x: new Date(f.created_at), y: avg };
  });
}

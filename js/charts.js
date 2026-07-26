/* ==========================================================================
   AQI DASHBOARD 2.0 - CHART.JS RENDERING ENGINE
   ========================================================================== */

import { CHART_META } from './config.js';
import { aggregateHourly, aggregateDaily, calculateVOCBaselineAndDelta } from './calculations.js';
import { openCOMBOInfoModal } from './modal.js';

// Active chart instances store
const chartInstances = {};

/**
 * Custom Hour Grid plugin for drawing background grid lines on time axes
 */
export function registerHourGridPlugin() {
  if (Chart.registry.plugins.get('hourGrid')) return;

  Chart.register({
    id: 'hourGrid',
    afterDraw(chart) {
      const xScale = chart.scales.x;
      if (!xScale) return;

      const ctx = chart.ctx;
      const top = chart.chartArea.top;
      const bottom = chart.chartArea.bottom;
      const min = xScale.min;
      const max = xScale.max;

      const viewModeEl = document.getElementById('viewMode');
      const vm = viewModeEl ? viewModeEl.value : 'live';

      if (vm === 'year') return;

      const isLight = document.body.getAttribute('data-theme') === 'light';

      if (vm === 'month' || vm === 'week') {
        let t = Math.ceil(min / 3600000) * 3600000;
        while (t <= max) {
          const hour = new Date(t).getHours();
          let strokeStyle = null;
          let lineWidth = 0;

          if (hour === 0) {
            strokeStyle = isLight ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.22)';
            lineWidth = 1.2;
          } else if (vm === 'month' && (hour === 8 || hour === 16)) {
            strokeStyle = isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.08)';
            lineWidth = 0.8;
          } else if (vm === 'week' && (hour === 6 || hour === 12 || hour === 18)) {
            strokeStyle = isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.08)';
            lineWidth = 0.8;
          }

          if (strokeStyle) {
            const x = xScale.getPixelForValue(t);
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x, top);
            ctx.lineTo(x, bottom);
            ctx.strokeStyle = strokeStyle;
            ctx.lineWidth = lineWidth;
            ctx.stroke();
            ctx.restore();
          }
          t += 3600000;
        }
        return;
      }

      // Live & Day modes - vertical line for every hour
      let tLive = Math.ceil(min / 3600000) * 3600000;
      while (tLive <= max) {
        const x = xScale.getPixelForValue(tLive);
        const hour = new Date(tLive).getHours();
        const isMajor = hour % 4 === 0;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.lineTo(x, bottom);
        ctx.strokeStyle = isMajor
          ? (isLight ? 'rgba(0, 0, 0, 0.22)' : 'rgba(255, 255, 255, 0.20)')
          : (isLight ? 'rgba(0, 0, 0, 0.11)' : 'rgba(255, 255, 255, 0.08)');
        ctx.lineWidth = isMajor ? 1.2 : 0.8;
        ctx.stroke();
        ctx.restore();
        tLive += 3600000;
      }
    }
  });
}

/**
 * Standard dark theme tooltip configuration
 */
export const getTooltipConfig = () => ({
  enabled: true,
  backgroundColor: 'rgba(15, 23, 42, 0.95)',
  titleColor: '#38bdf8',
  bodyColor: '#f8fafc',
  borderColor: 'rgba(255, 255, 255, 0.15)',
  borderWidth: 1,
  padding: 12,
  cornerRadius: 8,
  intersect: false,
  mode: 'nearest',
  titleFont: { size: 12, weight: 'bold', family: 'Inter' },
  bodyFont: { size: 12, family: 'Inter' },
  callbacks: {
    title: function (items) {
      if (!items.length) return '';
      const date = new Date(items[0].parsed.x);
      return `Data e Ora: ${date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;
    },
    label: function (item) {
      const label = item.dataset.label || '';
      const value = item.parsed.y;
      if (value == null || isNaN(value)) return '';
      if (label.includes('Limite')) return '';
      return ` ${label ? label + ': ' : ''}${Number(value).toFixed(2)}`;
    }
  }
});

/**
 * Generates X-Axis scale configuration based on active view mode
 */
export function getXAxisConfig(viewMode, dayVal) {
  const now = new Date();

  if (viewMode === 'year') {
    return {
      type: 'time',
      time: { unit: 'month', stepSize: 1 },
      ticks: {
        autoSkip: false,
        maxRotation: 45,
        color: '#94a3b8',
        callback: function (val) {
          const d = new Date(val);
          if (d.getMonth() === 0) return d.getFullYear().toString();
          return d.toLocaleDateString('en-US', { month: 'short' });
        }
      },
      grid: { color: 'rgba(255,255,255,0.05)', lineWidth: 1 }
    };
  }

  if (viewMode === 'month') {
    const axisStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    axisStart.setHours(0, 0, 0, 0);
    const axisEnd = new Date(now);
    axisEnd.setHours(23, 59, 59, 999);

    return {
      type: 'time',
      min: axisStart,
      max: axisEnd,
      time: { unit: 'hour', stepSize: 1 },
      afterBuildTicks: function (axis) {
        const ticks = [];
        let t = new Date(axisStart).getTime();
        while (t <= axisEnd.getTime()) {
          ticks.push({ value: t });
          t += 3600000;
        }
        axis.ticks = ticks;
      },
      ticks: {
        autoSkip: false,
        maxRotation: 45,
        color: '#94a3b8',
        callback: function (val) {
          const d = new Date(val);
          const hrs = d.getHours();
          const day = d.getDate();
          if (hrs !== 0) return null;
          if (day === 1) return d.toLocaleDateString('en-US', { month: 'long' });
          if (day % 2 === 0) return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
          return null;
        }
      },
      grid: { display: false }
    };
  }

  if (viewMode === 'week') {
    const axisEnd = new Date(now);
    axisEnd.setHours(23, 59, 59, 999);
    const axisStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      type: 'time',
      min: axisStart,
      max: axisEnd,
      time: { unit: 'hour', stepSize: 1 },
      afterBuildTicks: function (axis) {
        const ticks = [];
        let t = Math.ceil(axisStart.getTime() / 3600000) * 3600000;
        while (t <= axisEnd.getTime()) {
          ticks.push({ value: t });
          t += 3600000;
        }
        axis.ticks = ticks;
      },
      ticks: {
        autoSkip: false,
        maxRotation: 45,
        color: '#94a3b8',
        callback: function (val) {
          const d = new Date(val);
          if (d.getHours() === 0) {
            return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
          }
          return null;
        }
      },
      grid: { display: false }
    };
  }

  // Live / Day modes
  const liveMin = viewMode === 'live' ? new Date(now.getTime() - 24 * 60 * 60 * 1000) : undefined;
  const liveMax = viewMode === 'live' ? now : undefined;

  return {
    type: 'time',
    min: viewMode === 'day' && dayVal ? new Date(`${dayVal}T00:00:00`) : liveMin,
    max: viewMode === 'day' && dayVal ? new Date(`${dayVal}T23:59:59`) : liveMax,
    time: { unit: 'hour', stepSize: 1 },
    afterBuildTicks: function (axis) {
      if (!axis.min || !axis.max) return;
      const ticks = [];
      let t = Math.ceil(axis.min / 3600000) * 3600000;
      while (t <= axis.max) {
        ticks.push({ value: t });
        t += 3600000;
      }
      axis.ticks = ticks;
    },
    ticks: {
      autoSkip: false,
      maxRotation: 45,
      color: '#94a3b8',
      callback: function (val) {
        const d = new Date(val);
        const hrs = d.getHours();
        if (hrs === 0) return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
        if (hrs % 4 === 0) return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        return null;
      }
    },
    grid: { display: false }
  };
}

/**
 * Destroys all active chart instances
 */
export function destroyAllCharts() {
  Object.keys(chartInstances).forEach(k => {
    if (chartInstances[k]) {
      chartInstances[k].destroy();
      delete chartInstances[k];
    }
  });
}

/**
 * Main Chart Rendering Orchestrator
 */
export function renderActiveCharts(containerEl, feeds, selectedChartIds, viewMode, dayVal, aqiMode, tStart) {
  destroyAllCharts();
  containerEl.innerHTML = '';

  const isExtended = ['week', 'month', 'year'].includes(viewMode);
  const aggFn = viewMode === 'year' ? aggregateDaily : isExtended ? aggregateHourly : null;

  // Fixed display order: 5 (PM1), 6 (PM2.5), 7 (PM10), combo, 1 (Hum), 2 (Temp), 3 (Pres), 4 (VOC)
  const renderOrder = ['5', '6', '7', 'combo', '1', '2', '3', '4'];

  renderOrder.forEach(chartId => {
    if (!selectedChartIds.includes(chartId)) return;

    if (chartId === 'combo') {
      renderComboChart(containerEl, feeds, viewMode, dayVal, aqiMode, tStart);
      return;
    }

    if (chartId === '4') {
      renderVOCChart(containerEl, feeds, viewMode, dayVal);
      return;
    }

    const meta = CHART_META[chartId];
    if (!meta) return;

    const fieldKey = `field${chartId}`;
    const points = aggFn ? aggFn(feeds, fieldKey) : feeds.map(f => ({ x: new Date(f.created_at), y: Number(f[fieldKey]) }));

    const card = document.createElement('div');
    card.className = 'chart-card';
    card.id = `card_${chartId}`;
    card.innerHTML = `
      <div class="chart-card-header">
        <div class="chart-title-group">
          <span class="chart-card-title">${meta.title}</span>
          <span class="chart-card-sensor">${meta.sensor}</span>
        </div>
      </div>
      <div class="chart-canvas-container">
        <canvas id="chart_canvas_${chartId}"></canvas>
      </div>
    `;
    containerEl.appendChild(card);

    const ctx = card.querySelector('canvas').getContext('2d');
    chartInstances[chartId] = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [{
          label: meta.title,
          data: points,
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 1,
          borderColor: meta.color,
          backgroundColor: meta.color
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: getTooltipConfig()
        },
export function getGridColor() {
  const isLight = document.body.getAttribute('data-theme') === 'light';
  return isLight ? 'rgba(0, 0, 0, 0.14)' : 'rgba(255, 255, 255, 0.12)';
}

        scales: {
          x: getXAxisConfig(viewMode, dayVal),
          y: {
            beginAtZero: false,
            title: { display: true, text: meta.unit, color: '#94a3b8' },
            ticks: { color: '#94a3b8' },
            grid: { color: getGridColor(), lineWidth: 0.9 }
          }
        }
      }
    });
  });
}

/**
 * Render VOC Delta Chart
 */
function renderVOCChart(containerEl, feeds, viewMode, dayVal) {
  const { points } = calculateVOCBaselineAndDelta(feeds, feeds);

  const card = document.createElement('div');
  card.className = 'chart-card';
  card.id = 'card_4';
  card.innerHTML = `
    <div class="chart-card-header">
      <div class="chart-title-group">
        <span class="chart-card-title">VOC — Delta rispetto baseline 24h</span>
        <span class="chart-card-sensor">BME680</span>
      </div>
    </div>
    <div class="chart-canvas-container">
      <canvas id="chart_canvas_4"></canvas>
    </div>
  `;
  containerEl.appendChild(card);

  const ctx = card.querySelector('canvas').getContext('2d');
  chartInstances['4'] = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [{
        label: 'VOC Delta',
        data: points.map(p => ({ x: p.x, y: p.yDelta })),
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 1,
        borderColor: '#3b82f6',
        backgroundColor: '#3b82f6'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: getTooltipConfig()
      },
      scales: {
        x: getXAxisConfig(viewMode, dayVal),
        y: {
          beginAtZero: false,
          title: { display: true, text: 'Delta kOhm', color: '#94a3b8' },
          ticks: { color: '#94a3b8' },
          grid: { color: getGridColor(), lineWidth: 0.9 }
        }
      }
    }
  });
}

/**
 * Render COMBO Chart (PM2.5 + PM10 24h Moving Averages + Dynamic Threshold Lines)
 */
function renderComboChart(containerEl, feeds, viewMode, dayVal, aqiMode, tStart) {
  const card = document.createElement('div');
  card.className = 'chart-card';
  card.id = 'card_combo';
  card.innerHTML = `
    <div class="chart-card-header">
      <div class="chart-title-group">
        <span class="chart-card-title">PM10 / PM2.5 media mobile 24h — Standard ${aqiMode}</span>
        <span class="chart-card-sensor">PMS5003</span>
      </div>
      <div class="chart-legend">
        <span class="legend-item"><span class="legend-color-pill" style="background:#ec4899;"></span>PM2.5</span>
        <span class="legend-item"><span class="legend-color-pill" style="background:#10b981;"></span>PM10</span>
        <button class="kpi-info-btn" id="comboInfoBtn" style="position:static; margin-left: 0.5rem;">i</button>
      </div>
    </div>
    <div class="chart-canvas-container" id="comboCanvasContainer">
      <canvas id="chart_canvas_combo"></canvas>
    </div>
  `;
  containerEl.appendChild(card);

  card.querySelector('#comboInfoBtn').onclick = openCOMBOInfoModal;

  // 24h Moving Average Availability Rule
  const firstFeedTs = feeds.length ? new Date(feeds[0].created_at).getTime() : tStart.getTime();
  const availableFromTs = firstFeedTs + 24 * 60 * 60 * 1000;

  const validFeeds = feeds.filter(f => new Date(f.created_at).getTime() >= availableFromTs);

  // If < 24h of historical data exist after start, show empty canvas frame with warning text
  if (!validFeeds.length) {
    const warning = document.createElement('div');
    warning.className = 'combo-empty-warning';
    warning.textContent = 'In attesa di 24 ore di storico dati per il calcolo della media mobile.';
    card.querySelector('#comboCanvasContainer').appendChild(warning);
  }

  // Calculate 24h rolling moving averages
  const pm25Points = [];
  const pm10Points = [];

  feeds.forEach(f => {
    const ts = new Date(f.created_at).getTime();
    if (ts < availableFromTs) return;

    const cutoff = ts - 24 * 60 * 60 * 1000;

    const win25 = feeds.filter(x => {
      const t = new Date(x.created_at).getTime();
      return t >= cutoff && t <= ts && !isNaN(Number(x.field6));
    });
    if (win25.length) {
      pm25Points.push({ x: new Date(f.created_at), y: win25.reduce((s, x) => s + Number(x.field6), 0) / win25.length });
    }

    const win10 = feeds.filter(x => {
      const t = new Date(x.created_at).getTime();
      return t >= cutoff && t <= ts && !isNaN(Number(x.field7));
    });
    if (win10.length) {
      pm10Points.push({ x: new Date(f.created_at), y: win10.reduce((s, x) => s + Number(x.field7), 0) / win10.length });
    }
  });

  const datasets = [
    {
      label: 'PM2.5 (24h)',
      data: pm25Points,
      tension: 0.3,
      borderWidth: 2,
      pointRadius: 2,
      borderColor: '#ec4899',
      backgroundColor: '#ec4899'
    },
    {
      label: 'PM10 (24h)',
      data: pm10Points,
      tension: 0.3,
      borderWidth: 2,
      pointRadius: 2,
      borderColor: '#10b981',
      backgroundColor: '#10b981'
    }
  ];

  // Dynamic Dotted Threshold Lines
  const sampleTimePoints = pm25Points.length ? pm25Points.map(p => p.x) : [new Date()];

  if (aqiMode === 'EEA') {
    datasets.push(
      { label: 'Limite EEA PM2.5 (25)', data: sampleTimePoints.map(x => ({ x, y: 25 })), borderDash: [6, 4], borderColor: '#eab308', borderWidth: 1.5, pointRadius: 0 },
      { label: 'Limite EEA PM10 (50)', data: sampleTimePoints.map(x => ({ x, y: 50 })), borderDash: [6, 4], borderColor: '#f97316', borderWidth: 1.5, pointRadius: 0 }
    );
  } else {
    datasets.push(
      { label: 'Limite EPA PM2.5 (35)', data: sampleTimePoints.map(x => ({ x, y: 35 })), borderDash: [6, 4], borderColor: '#ef4444', borderWidth: 1.5, pointRadius: 0 },
      { label: 'Limite EPA PM10 (150)', data: sampleTimePoints.map(x => ({ x, y: 150 })), borderDash: [6, 4], borderColor: '#7f1d1d', borderWidth: 1.5, pointRadius: 0 }
    );
  }

  const ctx = card.querySelector('canvas').getContext('2d');
  chartInstances['combo'] = new Chart(ctx, {
    type: 'line',
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: getTooltipConfig()
      },
      scales: {
        x: getXAxisConfig(viewMode, dayVal),
        y: {
          beginAtZero: false,
          title: { display: true, text: 'µg/m³', color: '#94a3b8' },
          ticks: { color: '#94a3b8' },
          grid: { color: getGridColor(), lineWidth: 0.9 }
        }
      }
    }
  });
}

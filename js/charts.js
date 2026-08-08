/* ==========================================================================
   AQI DASHBOARD 2.0 - CHART.JS RENDERING ENGINE
   ========================================================================== */

// Active chart instances store
const chartInstances = {};

/**
 * Helper to check whether Light Theme is active
 */
function isLightTheme() {
  const t = document.body.getAttribute('data-theme') || document.documentElement.getAttribute('data-theme');
  return t === 'light';
}

/**
 * Inserts null gap points when consecutive data readings are separated by > maxGapMs (default 2 hours)
 * This prevents Chart.js from drawing diagonal interpolation lines across long periods of station inactivity.
 */
function addNullGapsToPoints(rawPoints, maxGapMs = 2 * 3600 * 1000) {
  if (!rawPoints || rawPoints.length < 2) return rawPoints || [];

  const result = [];
  for (let i = 0; i < rawPoints.length; i++) {
    if (i > 0) {
      const prevTs = new Date(rawPoints[i - 1].x).getTime();
      const currTs = new Date(rawPoints[i].x).getTime();
      if (currTs - prevTs > maxGapMs && rawPoints[i - 1].y !== null) {
        result.push({ x: new Date(prevTs + 60000), y: null });
      }
    }
    result.push(rawPoints[i]);
  }
  return result;
}

/**
 * Custom Hour Grid plugin for drawing background grid lines on time axes
 */
function registerHourGridPlugin() {
  if (typeof Chart === 'undefined' || Chart.registry.plugins.get('hourGrid')) return;

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

      const isLight = isLightTheme();
      const majorColor = isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.15)';
      const minorColor = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';
      const liveMajor = isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.12)';
      const liveMinor = isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.04)';

      if (vm === 'month' || vm === 'week') {
        let t = Math.ceil(min / 3600000) * 3600000;
        while (t <= max) {
          const hour = new Date(t).getHours();
          let strokeStyle = null;
          let lineWidth = 0;

          if (hour === 0) {
            strokeStyle = majorColor;
            lineWidth = 1.2;
          } else if (vm === 'month' && (hour === 8 || hour === 16)) {
            strokeStyle = minorColor;
            lineWidth = 0.8;
          } else if (vm === 'week' && (hour === 6 || hour === 12 || hour === 18)) {
            strokeStyle = minorColor;
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

      // Live & Day modes
      let tLive = Math.ceil(min / 3600000) * 3600000;
      while (tLive <= max) {
        const x = xScale.getPixelForValue(tLive);
        const hour = new Date(tLive).getHours();
        const isMajor = hour % 4 === 0;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.lineTo(x, bottom);
        ctx.strokeStyle = isMajor ? liveMajor : liveMinor;
        ctx.lineWidth = isMajor ? 1.2 : 0.8;
        ctx.stroke();
        ctx.restore();
        tLive += 3600000;
      }
    }
  });
}

/**
 * Standard dark/light theme tooltip configuration
 */
function getTooltipConfig() {
  const isLight = isLightTheme();
  return {
    enabled: true,
    backgroundColor: isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(15, 23, 42, 0.95)',
    titleColor: isLight ? '#0284c7' : '#38bdf8',
    bodyColor: isLight ? '#0f172a' : '#f8fafc',
    borderColor: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.15)',
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
  };
}

/**
 * Generates X-Axis scale configuration based on active view mode, reference end date, and active theme
 */
function getXAxisConfig(viewMode, dayVal, refEnd) {
  const referenceEnd = refEnd || new Date();
  const isLight = isLightTheme();
  const tickColor = isLight ? '#475569' : '#94a3b8';
  const gridColor = isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)';

  if (viewMode === 'year') {
    const axisStart = new Date(referenceEnd.getTime() - 365 * 24 * 60 * 60 * 1000);
    return {
      type: 'time',
      min: axisStart,
      max: referenceEnd,
      time: { unit: 'month', stepSize: 1 },
      ticks: {
        autoSkip: false,
        maxRotation: 45,
        color: tickColor,
        callback: function (val) {
          const d = new Date(val);
          if (d.getMonth() === 0) return d.getFullYear().toString();
          return d.toLocaleDateString('en-US', { month: 'short' });
        }
      },
      grid: { color: gridColor, lineWidth: 1 }
    };
  }

  if (viewMode === 'month') {
    const axisStart = new Date(referenceEnd.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      type: 'time',
      min: axisStart,
      max: referenceEnd,
      time: { unit: 'hour', stepSize: 1 },
      afterBuildTicks: function (axis) {
        const ticks = [];
        let t = Math.ceil(axisStart.getTime() / 3600000) * 3600000;
        while (t <= referenceEnd.getTime()) {
          ticks.push({ value: t });
          t += 3600000;
        }
        axis.ticks = ticks;
      },
      ticks: {
        autoSkip: false,
        maxRotation: 45,
        color: tickColor,
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
    const axisStart = new Date(referenceEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      type: 'time',
      min: axisStart,
      max: referenceEnd,
      time: { unit: 'hour', stepSize: 1 },
      afterBuildTicks: function (axis) {
        const ticks = [];
        let t = Math.ceil(axisStart.getTime() / 3600000) * 3600000;
        while (t <= referenceEnd.getTime()) {
          ticks.push({ value: t });
          t += 3600000;
        }
        axis.ticks = ticks;
      },
      ticks: {
        autoSkip: false,
        maxRotation: 45,
        color: tickColor,
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
  const liveMin = viewMode === 'live' ? new Date(referenceEnd.getTime() - 24 * 60 * 60 * 1000) : undefined;
  const liveMax = viewMode === 'live' ? referenceEnd : undefined;

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
      color: tickColor,
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
function destroyAllCharts() {
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
function renderActiveCharts(containerEl, feeds, selectedChartIds, viewMode, dayVal, aqiMode, tStart, refEnd) {
  destroyAllCharts();
  containerEl.innerHTML = '';

  const activeFeeds = feeds.length > 1500 ? feeds.slice(-1500) : feeds;
  const isExtended = ['week', 'month', 'year'].includes(viewMode);
  const aggFn = viewMode === 'year' ? aggregateDaily : isExtended ? aggregateHourly : null;

  const isLight = isLightTheme();
  const yTickColor = isLight ? '#475569' : '#94a3b8';
  const yGridColor = isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.06)';

  // Fixed display order: 5 (PM1), 6 (PM2.5), 7 (PM10), combo, 1 (Hum), 2 (Temp), 3 (Pres), 4 (VOC)
  const renderOrder = ['5', '6', '7', 'combo', '1', '2', '3', '4'];

  renderOrder.forEach(chartId => {
    if (!selectedChartIds.includes(chartId)) return;

    if (chartId === 'combo') {
      renderComboChart(containerEl, activeFeeds, viewMode, dayVal, aqiMode, tStart, refEnd);
      return;
    }

    if (chartId === '4') {
      renderVOCChart(containerEl, activeFeeds, viewMode, dayVal, refEnd);
      return;
    }

    const meta = CHART_META[chartId];
    if (!meta) return;

    const fieldKey = `field${chartId}`;
    const rawPoints = aggFn ? aggFn(activeFeeds, fieldKey) : activeFeeds.map(f => ({ x: new Date(f.created_at), y: Number(f[fieldKey]) }));
    const points = addNullGapsToPoints(rawPoints);

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
          spanGaps: false,
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
        scales: {
          x: getXAxisConfig(viewMode, dayVal, refEnd),
          y: {
            beginAtZero: false,
            grace: '10%',
            title: { display: true, text: meta.unit, color: yTickColor },
            ticks: { color: yTickColor },
            grid: { color: yGridColor, lineWidth: 0.8 }
          }
        }
      }
    });
  });
}

/**
 * Render VOC Delta Chart
 */
function renderVOCChart(containerEl, feeds, viewMode, dayVal, refEnd) {
  const { points: rawVocPoints } = calculateVOCBaselineAndDelta(feeds, feeds);
  const points = addNullGapsToPoints(rawVocPoints.map(p => ({ x: p.x, y: p.yDelta })));

  const isLight = isLightTheme();
  const yTickColor = isLight ? '#475569' : '#94a3b8';
  const yGridColor = isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.06)';

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
        data: points,
        spanGaps: false,
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
        x: getXAxisConfig(viewMode, dayVal, refEnd),
        y: {
          beginAtZero: false,
          grace: '10%',
          title: { display: true, text: 'Delta kOhm', color: yTickColor },
          ticks: { color: yTickColor },
          grid: { color: yGridColor, lineWidth: 0.8 }
        }
      }
    }
  });
}

/**
 * Render COMBO Chart (PM2.5 + PM10 24h Moving Averages + Dynamic Threshold Lines)
 */
function renderComboChart(containerEl, feeds, viewMode, dayVal, aqiMode, tStart, refEnd) {
  const isLight = isLightTheme();
  const yTickColor = isLight ? '#475569' : '#94a3b8';
  const yGridColor = isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.06)';

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

  const parsed = feeds.map(f => ({
    ts: new Date(f.created_at).getTime(),
    date: new Date(f.created_at),
    v25: Number(f.field6),
    v10: Number(f.field7)
  }));

  const pm25RawPoints = [];
  const pm10RawPoints = [];

  let win25Sum = 0, win25Count = 0, win25Start = 0;
  let win10Sum = 0, win10Count = 0, win10Start = 0;

  for (let i = 0; i < parsed.length; i++) {
    const p = parsed[i];
    const cutoff = p.ts - 24 * 60 * 60 * 1000;

    if (!isNaN(p.v25)) { win25Sum += p.v25; win25Count++; }
    if (!isNaN(p.v10)) { win10Sum += p.v10; win10Count++; }

    while (win25Start < i && parsed[win25Start].ts < cutoff) {
      if (!isNaN(parsed[win25Start].v25)) { win25Sum -= parsed[win25Start].v25; win25Count--; }
      win25Start++;
    }
    while (win10Start < i && parsed[win10Start].ts < cutoff) {
      if (!isNaN(parsed[win10Start].v10)) { win10Sum -= parsed[win10Start].v10; win10Count--; }
      win10Start++;
    }

    if (win25Count > 0) pm25RawPoints.push({ x: p.date, y: win25Sum / win25Count });
    if (win10Count > 0) pm10RawPoints.push({ x: p.date, y: win10Sum / win10Count });
  }

  const pm25Points = addNullGapsToPoints(pm25RawPoints);
  const pm10Points = addNullGapsToPoints(pm10RawPoints);

  const datasets = [
    {
      label: 'PM2.5 (24h)',
      data: pm25Points,
      spanGaps: false,
      tension: 0.3,
      borderWidth: 2,
      pointRadius: 2,
      borderColor: '#ec4899',
      backgroundColor: '#ec4899'
    },
    {
      label: 'PM10 (24h)',
      data: pm10Points,
      spanGaps: false,
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
        x: getXAxisConfig(viewMode, dayVal, refEnd),
        y: {
          beginAtZero: false,
          grace: '10%',
          title: { display: true, text: 'µg/m³', color: yTickColor },
          ticks: { color: yTickColor },
          grid: { color: yGridColor, lineWidth: 0.8 }
        }
      }
    }
  });
}

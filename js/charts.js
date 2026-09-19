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
 * Inserts null gap points when consecutive data readings are separated by > maxGapMs (default 24 hours)
 * This breaks line charts ONLY when station inactivity exceeds 24 hours.
 */
function addNullGapsToPoints(rawPoints, maxGapMs = 24 * 3600 * 1000) {
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
 * Calculates start and end Date bounds for the X-axis across all view modes
 */
function getXAxisBounds(viewMode, dayVal, refEnd, tStart) {
  const referenceEnd = refEnd || new Date();
  let minDate;
  if (viewMode === 'year') {
    minDate = new Date(referenceEnd.getTime() - 365 * 24 * 60 * 60 * 1000);
  } else if (viewMode === 'month') {
    minDate = new Date(referenceEnd.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (viewMode === 'week') {
    minDate = new Date(referenceEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (viewMode === 'day' && dayVal) {
    return { min: new Date(`${dayVal}T00:00:00`), max: new Date(`${dayVal}T23:59:59`) };
  } else {
    minDate = new Date(referenceEnd.getTime() - 24 * 60 * 60 * 1000);
  }

  if (tStart && tStart > minDate) {
    minDate = tStart;
  }
  return { min: minDate, max: referenceEnd };
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
function getXAxisConfig(viewMode, dayVal, refEnd, tStart) {
  const referenceEnd = refEnd || new Date();
  const isLight = isLightTheme();
  const tickColor = isLight ? '#475569' : '#94a3b8';
  const gridColor = isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)';

  if (viewMode === 'year') {
    let axisStart = new Date(referenceEnd.getTime() - 365 * 24 * 60 * 60 * 1000);
    if (tStart && tStart > axisStart) axisStart = tStart;
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
    let axisStart = new Date(referenceEnd.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (tStart && tStart > axisStart) axisStart = tStart;

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
    let axisStart = new Date(referenceEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (tStart && tStart > axisStart) axisStart = tStart;

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
  let liveMin = viewMode === 'live' ? new Date(referenceEnd.getTime() - 24 * 60 * 60 * 1000) : undefined;
  if (viewMode === 'live' && tStart && tStart > liveMin) {
    liveMin = tStart;
  }
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
function renderActiveCharts(containerEl, feeds, micsFeeds, selectedChartIds, viewMode, dayVal, aqiMode, tStart, refEnd, currentStation) {
  // Gracefully handle legacy argument ordering if micsFeeds is omitted
  if (Array.isArray(micsFeeds) && micsFeeds.length > 0 && typeof micsFeeds[0] === 'string') {
    currentStation = refEnd;
    refEnd = tStart;
    tStart = aqiMode;
    aqiMode = dayVal;
    dayVal = viewMode;
    viewMode = selectedChartIds;
    selectedChartIds = micsFeeds;
    micsFeeds = [];
  }

  destroyAllCharts();
  containerEl.innerHTML = '';

  const filteredFeeds = tStart ? feeds.filter(f => new Date(f.created_at) >= tStart) : feeds;
  const activeFeeds = filteredFeeds.length > 1500 ? filteredFeeds.slice(-1500) : filteredFeeds;

  const filteredMicsFeeds = tStart ? (micsFeeds || []).filter(f => new Date(f.created_at) >= tStart) : (micsFeeds || []);
  const activeMicsFeeds = filteredMicsFeeds.length > 1500 ? filteredMicsFeeds.slice(-1500) : filteredMicsFeeds;

  // Show clear user-friendly banner if station has no data or channel is offline
  if ((!activeFeeds || !activeFeeds.length) && (!activeMicsFeeds || !activeMicsFeeds.length)) {
    const emptyNotice = document.createElement('div');
    emptyNotice.style.cssText = 'grid-column: 1 / -1; padding: 3rem 1.5rem; text-align: center; color: var(--text-muted); background: var(--card-bg); border: 1px dashed var(--card-border); border-radius: var(--radius-md); margin: 1rem 0;';
    emptyNotice.innerHTML = `
      <div style="font-size: 2.2rem; margin-bottom: 0.6rem;">📡</div>
      <h3 style="color: var(--text-main); font-size: 1.15rem; margin-bottom: 0.5rem; font-weight: 600;">Nessun dato disponibile per ${currentStation?.name || 'questa centralina'}</h3>
      <p style="font-size: 0.88rem; color: var(--text-dim); max-width: 520px; margin: 0 auto; line-height: 1.5;">Il canale ThingSpeak configurato (ID: <strong>${currentStation?.id || '—'}</strong>) non risponde o non contiene rilevazioni per il periodo selezionato.</p>
    `;
    containerEl.appendChild(emptyNotice);
    return;
  }
  const isExtended = ['week', 'month', 'year'].includes(viewMode);
  const aggFn = viewMode === 'year' ? aggregateDaily : isExtended ? aggregateHourly : null;

  const isLight = isLightTheme();
  const yTickColor = isLight ? '#475569' : '#94a3b8';
  const yGridColor = isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.06)';
  const isYearMode = viewMode === 'year';
  const bounds = getXAxisBounds(viewMode, dayVal, refEnd, tStart);
  const fullRangePoints = [bounds.min, bounds.max];

  // Fixed display order: 5 (PM1), 6 (PM2.5), 7 (PM10), combo, 1 (Hum), 2 (Temp), 3 (Pres), 4 (VOC), mics_co, mics_no2, mics_nh3
  const renderOrder = ['5', '6', '7', 'combo', '1', '2', '3', '4', 'mics_co', 'mics_no2', 'mics_nh3'];

  renderOrder.forEach(chartId => {
    if (!selectedChartIds.includes(chartId)) return;

    if (chartId === 'combo') {
      renderComboChart(containerEl, feeds, viewMode, dayVal, aqiMode, tStart, refEnd);
      return;
    }

    if (chartId === '4') {
      renderVOCChart(containerEl, activeFeeds, viewMode, dayVal, refEnd, tStart);
      return;
    }

    if (chartId.startsWith('mics_')) {
      const meta = CHART_META[chartId];
      if (!meta) return;

      const gasSensor = getStationGasSensor(currentStation, feeds, micsFeeds);
      const sensorLabel = gasSensor?.chart || meta.sensor;

      if (!currentStation?.hasMics || !currentStation?.micsFields) {
        const card = document.createElement('div');
        card.className = 'chart-card';
        card.id = `card_${chartId}`;
        card.innerHTML = `
          <div class="chart-card-header">
            <div class="chart-title-group">
              <span class="chart-card-title">${meta.title}</span>
              <span class="chart-card-sensor">${sensorLabel}</span>
            </div>
          </div>
          <div class="chart-canvas-container" style="display: flex; align-items: center; justify-content: center; text-align: center; min-height: 220px; padding: 2rem;">
            <div style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.5;">
              <div style="font-size: 1.6rem; margin-bottom: 0.4rem;">ℹ️</div>
              <strong>${sensorLabel} non presente</strong><br/>
              <span style="font-size: 0.85rem; color: var(--text-dim);">Questo sensore non è installato su ${currentStation?.name || 'questa centralina'}.</span>
            </div>
          </div>
        `;
        containerEl.appendChild(card);
        return;
      }

      const micsFields = currentStation.micsFields;
      let gasField = null;
      if (chartId === 'mics_co') gasField = micsFields.co;
      else if (chartId === 'mics_no2') gasField = micsFields.no2;
      else if (chartId === 'mics_nh3') gasField = micsFields.nh3;

      if (!gasField) return;

      const validMicsFeeds = activeMicsFeeds.filter(f => f[gasField] !== null && f[gasField] !== undefined && f[gasField] !== '' && !isNaN(Number(f[gasField])));
      const rawPoints = aggFn ? aggFn(validMicsFeeds, gasField) : validMicsFeeds.map(f => ({ x: new Date(f.created_at), y: Number(f[gasField]) }));
      const points = addNullGapsToPoints(rawPoints);

      const datasets = [{
        label: meta.title,
        data: points,
        spanGaps: false,
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 2,
        borderColor: meta.color,
        backgroundColor: meta.color
      }];

      const card = document.createElement('div');
      card.className = 'chart-card';
      card.id = `card_${chartId}`;
      card.innerHTML = `
        <div class="chart-card-header">
          <div class="chart-title-group">
            <span class="chart-card-title">${meta.title}</span>
            <span class="chart-card-sensor">${sensorLabel}</span>
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
        data: { datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: getTooltipConfig()
          },
          scales: {
            x: getXAxisConfig(viewMode, dayVal, refEnd, tStart),
            y: {
              beginAtZero: true,
              grace: '10%',
              title: { display: true, text: meta.unit, color: yTickColor },
              ticks: { color: yTickColor },
              grid: { color: yGridColor, lineWidth: 0.8 }
            }
          }
        }
      });
      return;
    }

    const meta = CHART_META[chartId];
    if (!meta) return;

    const fieldKey = `field${chartId}`;
    const rawPoints = aggFn ? aggFn(activeFeeds, fieldKey) : activeFeeds.map(f => ({ x: new Date(f.created_at), y: Number(f[fieldKey]) }));
    const points = addNullGapsToPoints(rawPoints);

    const datasets = [{
      label: meta.title,
      data: points,
      spanGaps: false,
      tension: 0.3,
      borderWidth: 2,
      pointRadius: 1,
      borderColor: meta.color,
      backgroundColor: meta.color
    }];

    // Add threshold reference line to individual PM2.5 and PM10 charts across full canvas width
    if (chartId === '6') { // PM2.5
      const limitVal = aqiMode === 'EEA' ? (isYearMode ? 20 : 25) : (isYearMode ? 15 : 35);
      const limitLabel = `Limite ${isYearMode ? 'Annuale' : 'Giornaliero'} ${aqiMode} PM2.5 (${limitVal})`;
      const limitColor = aqiMode === 'EEA' ? '#eab308' : '#ef4444';
      datasets.push({
        label: limitLabel,
        data: fullRangePoints.map(x => ({ x, y: limitVal })),
        borderDash: [6, 4],
        borderColor: limitColor,
        borderWidth: 1.5,
        pointRadius: 0
      });
    } else if (chartId === '7') { // PM10
      const limitVal = aqiMode === 'EEA' ? (isYearMode ? 40 : 50) : (isYearMode ? 50 : 150);
      const limitLabel = `Limite ${isYearMode ? 'Annuale' : 'Giornaliero'} ${aqiMode} PM10 (${limitVal})`;
      const limitColor = aqiMode === 'EEA' ? '#f97316' : '#7f1d1d';
      datasets.push({
        label: limitLabel,
        data: fullRangePoints.map(x => ({ x, y: limitVal })),
        borderDash: [6, 4],
        borderColor: limitColor,
        borderWidth: 1.5,
        pointRadius: 0
      });
    }

    const isPMChart = chartId === '6' || chartId === '7';
    const infoBtnHtml = isPMChart ? `<button class="kpi-info-btn" id="pmInfoBtn_${chartId}" style="position:static; margin-left: 0.5rem;" title="Info Limiti e Soglie PM">i</button>` : '';

    const card = document.createElement('div');
    card.className = 'chart-card';
    card.id = `card_${chartId}`;
    card.innerHTML = `
      <div class="chart-card-header">
        <div class="chart-title-group">
          <span class="chart-card-title">${meta.title}</span>
          <span class="chart-card-sensor">${meta.sensor}</span>
        </div>
        ${isPMChart ? `<div class="chart-legend">${infoBtnHtml}</div>` : ''}
      </div>
      <div class="chart-canvas-container">
        <canvas id="chart_canvas_${chartId}"></canvas>
      </div>
    `;
    containerEl.appendChild(card);

    if (isPMChart) {
      const pmBtn = card.querySelector(`#pmInfoBtn_${chartId}`);
      if (pmBtn) {
        pmBtn.onclick = () => {
          if (viewMode === 'year') {
            openPMAnnualLimitsInfoModal();
          } else {
            openPMLimitsInfoModal();
          }
        };
      }
    }

    const ctx = card.querySelector('canvas').getContext('2d');
    chartInstances[chartId] = new Chart(ctx, {
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
          x: getXAxisConfig(viewMode, dayVal, refEnd, tStart),
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
function renderVOCChart(containerEl, feeds, viewMode, dayVal, refEnd, tStart) {
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
        x: getXAxisConfig(viewMode, dayVal, refEnd, tStart),
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
 * Render COMBO Chart (PM2.5 + PM10 Moving Averages + Dynamic Full-Span Dotted Threshold Lines)
 */
function renderComboChart(containerEl, feeds, viewMode, dayVal, aqiMode, tStart, refEnd) {
  const isLight = isLightTheme();
  const yTickColor = isLight ? '#475569' : '#94a3b8';
  const yGridColor = isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.06)';

  const isYearMode = viewMode === 'year';
  const comboTitleText = isYearMode
    ? `PM10 / PM2.5 media annuale — Standard ${aqiMode} (Limiti Annuali)`
    : `PM10 / PM2.5 media mobile 24h — Standard ${aqiMode}`;

  const card = document.createElement('div');
  card.className = 'chart-card';
  card.id = 'card_combo';
  card.innerHTML = `
    <div class="chart-card-header">
      <div class="chart-title-group">
        <span class="chart-card-title">${comboTitleText}</span>
        <span class="chart-card-sensor">PMS5003</span>
      </div>
      <div class="chart-legend">
        <span class="legend-item"><span class="legend-color-pill" style="background:#ec4899;"></span>PM2.5</span>
        <span class="legend-item"><span class="legend-color-pill" style="background:#10b981;"></span>PM10</span>
        <button class="kpi-info-btn" id="comboInfoBtn" style="position:static; margin-left: 0.5rem;">i</button>
      </div>
    </div>
    <div class="chart-canvas-container" id="comboCanvasContainer" style="position: relative;">
      <canvas id="chart_canvas_combo"></canvas>
    </div>
  `;
  containerEl.appendChild(card);

  card.querySelector('#comboInfoBtn').onclick = () => {
    if (viewMode === 'year') {
      openPMAnnualLimitsInfoModal();
    } else {
      openCOMBOInfoModal();
    }
  };

    const parsed = (feeds || [])
    .filter(f => f && f.created_at)
    .map(f => ({
      ts: new Date(f.created_at).getTime(),
      date: new Date(f.created_at),
      v25: Number(f.field6),
      v10: Number(f.field7)
    }))
    .sort((a, b) => a.ts - b.ts);

  if (!parsed.length) {
    const warning = document.createElement('div');
    warning.className = 'combo-empty-warning';
    warning.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(15, 23, 42, 0.92); color: #f59e0b; padding: 1.2rem 1.8rem; border-radius: 10px; border: 1px solid rgba(245, 158, 11, 0.4); text-align: center; font-size: 0.92rem; font-weight: 500; z-index: 10; pointer-events: none; max-width: 90%; box-shadow: 0 8px 25px rgba(0,0,0,0.5);';
    warning.textContent = '⚠️ Nessun dato disponibile per il periodo selezionato.';
    card.querySelector('#comboCanvasContainer').appendChild(warning);
    return;
  }

  // Identify current active session start after any gap > 24 hours
  let currentSessionStartTs = parsed[0].ts;
  for (let i = parsed.length - 1; i > 0; i--) {
    if (parsed[i].ts - parsed[i - 1].ts > 24 * 3600 * 1000) {
      currentSessionStartTs = parsed[i].ts;
      break;
    }
  }

  const latestFeedTs = parsed[parsed.length - 1].ts;
  const sessionDurationMs = latestFeedTs - currentSessionStartTs;
  const has24hHistory = sessionDurationMs >= 24 * 60 * 60 * 1000;

  // Se la centralina ha accumulato meno di 24h, mostra un badge discreto non bloccante in alto a destra
  if (!has24hHistory && sessionDurationMs > 0) {
    const hoursAccum = Math.max(1, Math.round(sessionDurationMs / (3600 * 1000)));
    const badge = document.createElement('div');
    badge.style.cssText = 'position: absolute; top: 8px; right: 12px; background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.35); padding: 3px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 500; z-index: 5; pointer-events: none;';
    badge.textContent = `Media progressiva (${hoursAccum}h accumulate)`;
    card.querySelector('#comboCanvasContainer').appendChild(badge);
  }

  const pm25RawPoints = [];
  const pm10RawPoints = [];

  let win25Sum = 0, win25Count = 0, win25Start = 0;
  let win10Sum = 0, win10Count = 0, win10Start = 0;

  const tStartMs = tStart ? tStart.getTime() : 0;

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

    // Inserisce i punti visibili nella finestra [tStart, refEnd]
    if (p.ts >= tStartMs) {
      if (win25Count > 0) pm25RawPoints.push({ x: p.date, y: win25Sum / win25Count });
      if (win10Count > 0) pm10RawPoints.push({ x: p.date, y: win10Sum / win10Count });
    }
  }

  const pm25Points = addNullGapsToPoints(pm25RawPoints);
  const pm10Points = addNullGapsToPoints(pm10RawPoints);

  const datasets = [
    {
      label: isYearMode ? 'PM2.5 (Media Giorno)' : 'PM2.5 (24h)',
      data: pm25Points,
      spanGaps: false,
      tension: 0.3,
      borderWidth: 2,
      pointRadius: 2,
      borderColor: '#ec4899',
      backgroundColor: '#ec4899'
    },
    {
      label: isYearMode ? 'PM10 (Media Giorno)' : 'PM10 (24h)',
      data: pm10Points,
      spanGaps: false,
      tension: 0.3,
      borderWidth: 2,
      pointRadius: 2,
      borderColor: '#10b981',
      backgroundColor: '#10b981'
    }
  ];

  // Dynamic Dotted Threshold Lines spanning FULL width of the X-axis bounds even when feeds are missing
  const bounds = getXAxisBounds(viewMode, dayVal, refEnd, tStart);
  const fullRangePoints = [bounds.min, bounds.max];

  if (aqiMode === 'EEA') {
    if (isYearMode) {
      // Annual EEA Limits (20 µg/m³ for PM2.5, 40 µg/m³ for PM10)
      datasets.push(
        { label: 'Limite Annuale EEA PM2.5 (20)', data: fullRangePoints.map(x => ({ x, y: 20 })), borderDash: [6, 4], borderColor: '#eab308', borderWidth: 1.5, pointRadius: 0 },
        { label: 'Limite Annuale EEA PM10 (40)', data: fullRangePoints.map(x => ({ x, y: 40 })), borderDash: [6, 4], borderColor: '#f97316', borderWidth: 1.5, pointRadius: 0 }
      );
    } else {
      // Daily EEA Limits (25 µg/m³ for PM2.5, 50 µg/m³ for PM10)
      datasets.push(
        { label: 'Limite Giornaliero EEA PM2.5 (25)', data: fullRangePoints.map(x => ({ x, y: 25 })), borderDash: [6, 4], borderColor: '#eab308', borderWidth: 1.5, pointRadius: 0 },
        { label: 'Limite Giornaliero EEA PM10 (50)', data: fullRangePoints.map(x => ({ x, y: 50 })), borderDash: [6, 4], borderColor: '#f97316', borderWidth: 1.5, pointRadius: 0 }
      );
    }
  } else {
    if (isYearMode) {
      // Annual EPA Limits (15 µg/m³ for PM2.5, 50 µg/m³ for PM10)
      datasets.push(
        { label: 'Limite Annuale EPA PM2.5 (15)', data: fullRangePoints.map(x => ({ x, y: 15 })), borderDash: [6, 4], borderColor: '#ef4444', borderWidth: 1.5, pointRadius: 0 },
        { label: 'Limite Annuale EPA PM10 (50)', data: fullRangePoints.map(x => ({ x, y: 50 })), borderDash: [6, 4], borderColor: '#7f1d1d', borderWidth: 1.5, pointRadius: 0 }
      );
    } else {
      // Daily EPA Limits (35 µg/m³ for PM2.5, 150 µg/m³ for PM10)
      datasets.push(
        { label: 'Limite Giornaliero EPA PM2.5 (35)', data: fullRangePoints.map(x => ({ x, y: 35 })), borderDash: [6, 4], borderColor: '#ef4444', borderWidth: 1.5, pointRadius: 0 },
        { label: 'Limite Giornaliero EPA PM10 (150)', data: fullRangePoints.map(x => ({ x, y: 150 })), borderDash: [6, 4], borderColor: '#7f1d1d', borderWidth: 1.5, pointRadius: 0 }
      );
    }
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
        x: getXAxisConfig(viewMode, dayVal, refEnd, tStart),
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

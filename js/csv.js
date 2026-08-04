/* ==========================================================================
   AQI DASHBOARD 2.0 - CSV EXPORTER
   ========================================================================== */

/**
 * Generates and triggers browser download of CSV file according to specs:
 * - Separator: ';'
 * - Decimal separator: ','
 * - Columns: date;time;year;month;temp;hum;pres;voc;PM1;PM2_5;PM2_5_mavg;PM10;PM10_mavg
 */
function exportCSVData(stationName, viewMode, dayVal, rawFeedsStore) {
  if (!rawFeedsStore || !rawFeedsStore.length) {
    alert('Nessun dato disponibile da esportare.');
    return;
  }

  const sep = ';';
  const modeLabels = {
    live: 'Ultime24h',
    day: 'Giorno',
    week: 'Ultimi7gg',
    month: 'UltimoMese',
    year: 'UltimoAnno'
  };

  let dateTag = '';
  if (viewMode === 'day' && dayVal) {
    dateTag = dayVal.split('-').reverse().join('-');
  } else {
    dateTag = new Date().toLocaleDateString('it-IT', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    }).replace(/\//g, '-');
  }

  const filename = `${stationName}_${modeLabels[viewMode] || viewMode}_${dateTag}.csv`;

  // Sort feeds chronologically
  const feeds = [...rawFeedsStore].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  // Compute 24h rolling moving average map for PM2.5 and PM10
  const mavg25Map = {};
  const mavg10Map = {};

  feeds.forEach((f) => {
    const ts = new Date(f.created_at).getTime();
    const cutoff = ts - 24 * 60 * 60 * 1000;

    const window25 = feeds.filter(x => {
      const t = new Date(x.created_at).getTime();
      return t >= cutoff && t <= ts && !isNaN(Number(x.field6));
    });
    if (window25.length) {
      mavg25Map[ts] = window25.reduce((s, x) => s + Number(x.field6), 0) / window25.length;
    }

    const window10 = feeds.filter(x => {
      const t = new Date(x.created_at).getTime();
      return t >= cutoff && t <= ts && !isNaN(Number(x.field7));
    });
    if (window10.length) {
      mavg10Map[ts] = window10.reduce((s, x) => s + Number(x.field7), 0) / window10.length;
    }
  });

  const rows = [];
  rows.push(filename.replace('.csv', ''));
  rows.push('');

  // Fixed Header Specification
  const header = ['date', 'time', 'year', 'month', 'temp', 'hum', 'pres', 'voc', 'PM1', 'PM2_5', 'PM2_5_mavg', 'PM10', 'PM10_mavg'];
  rows.push(header.join(sep));

  const formatNum = (v) => {
    if (v == null || isNaN(v) || v === '') return '';
    return Number(v).toFixed(2).replace('.', ',');
  };

  // Build rows descending (latest first)
  const sortedDesc = [...feeds].reverse();

  sortedDesc.forEach(f => {
    const dateObj = new Date(f.created_at);
    const ts = dateObj.getTime();

    const dateFormatted = dateObj.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeFormatted = dateObj.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) + ':00';
    const yearStr = dateObj.getFullYear().toString();
    const monthStr = (dateObj.getMonth() + 1).toString();

    const row = [
      dateFormatted,
      timeFormatted,
      yearStr,
      monthStr,
      formatNum(f.field2),         // temp
      formatNum(f.field1),         // hum
      formatNum(f.field3),         // pres
      formatNum(f.field4),         // voc
      formatNum(f.field5),         // PM1
      formatNum(f.field6),         // PM2_5
      formatNum(mavg25Map[ts]),    // PM2_5_mavg
      formatNum(f.field7),         // PM10
      formatNum(mavg10Map[ts])     // PM10_mavg
    ];

    rows.push(row.join(sep));
  });

  // Download Trigger with UTF-8 BOM for Excel compatibility
  const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/* ==========================================================================
   AQI DASHBOARD 2.0 - CSV EXPORTER
   ========================================================================== */

/**
 * Generates and triggers browser download of CSV file according to specs:
 * - Separator: ';'
 * - Decimal separator: ','
 * - Columns: Date/Time;year;month;temp;hum;pres;voc;PM1;PM2_5;PM2_5_mavg;PM10;PM10_mavg
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

  // Compute 24h rolling moving average map for PM2.5 and PM10 in O(N) linear time
  const mavg25Map = {};
  const mavg10Map = {};

  const parsed = feeds.map(f => ({
    ts: new Date(f.created_at).getTime(),
    v25: Number(f.field6),
    v10: Number(f.field7)
  }));

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

    mavg25Map[p.ts] = win25Count > 0 ? win25Sum / win25Count : NaN;
    mavg10Map[p.ts] = win10Count > 0 ? win10Sum / win10Count : NaN;
  }

  const rows = [];
  rows.push(filename.replace('.csv', ''));
  rows.push('');

  // Fixed Header Specification
  const header = ['Date/Time', 'year', 'month', 'temp', 'hum', 'pres', 'voc', 'PM1', 'PM2_5', 'PM2_5_mavg', 'PM10', 'PM10_mavg'];
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
    const dateTimeFormatted = `${dateFormatted} ${timeFormatted}`;
    const yearStr = dateObj.getFullYear().toString();
    const monthStr = (dateObj.getMonth() + 1).toString();

    const row = [
      dateTimeFormatted,
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

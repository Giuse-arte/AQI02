/* ==========================================================================
   AQI DASHBOARD 2.0 - CONFIGURATION & CONSTANTS
   ========================================================================== */

// MiCS-6814 Secondary Gas Channel Configuration
const MICS_CHANNEL = {
  id: 3494571,
  apiKey: '2HGOW99264LPWOIP'
};

// Externalized Stations Configuration - Add new stations here effortlessly
const STATIONS = [
  { 
    id: 3482211, 
    apiKey: 'G704K57NEFAVC0FW', 
    name: 'Device Nº AQI_01', 
    location: 'Stazione Primaria',
    hasMics: true,
    micsFields: { co: 'field1', no2: 'field2', nh3: 'field3' },
    gasSensor: {
      card: 'Grove Gas V2',
      chart: 'GROVE - GAS SENSOR V2(MULTICHANNEL)'
    }
  },
  { 
    id: 3482910, 
    apiKey: 'DIH2HZ9B5AFO3Y40', 
    name: 'Device Nº AQI_02', 
    location: 'Stazione Secondaria',
    hasMics: true,
    micsFields: { co: 'field4', no2: 'field5', nh3: 'field6' },
    gasSensor: {
      card: 'MiCS-6814 V1',
      chart: 'GROVE MULTICHANNEL GAS SENSOR V1 (MiCS-6814)'
    }
  }
];

// Helper per determinare dinamicamente il sensore gas:
// 1. Legge l'ultimo 'status' trasmesso su ThingSpeak dalla centralina
//    (es. "AQI_02 [AQI_FW_13]: Gas MiCS-6814 (0x04)" o "AQI_02: Sensore Gas MiCS-6814 (I2C 0x04)")
// 2. Se non presente, usa la configurazione della stazione (STATIONS)
function getStationGasSensor(station, primaryFeeds, micsFeeds) {
  const isStation01 = station?.id === 3482211 || station?.name?.includes('01');
  const isStation02 = station?.id === 3482910 || station?.name?.includes('02');
  const stationTag = isStation01 ? 'AQI_01' : (isStation02 ? 'AQI_02' : '');

  // 1. Controlla prima i feed del canale primario (esclusivi della stazione corrente)
  if (primaryFeeds && primaryFeeds.length) {
    for (let i = primaryFeeds.length - 1; i >= 0; i--) {
      const st = primaryFeeds[i]?.status;
      if (typeof st === 'string' && st.trim().length > 0) {
        if (st.includes('MiCS-6814') || st.includes('0x04')) {
          return {
            card: 'MiCS-6814 V1',
            chart: 'GROVE MULTICHANNEL GAS SENSOR V1 (MiCS-6814)'
          };
        }
        if (st.includes('Grove V2') || st.includes('0x08')) {
          return {
            card: 'Grove Gas V2',
            chart: 'GROVE - GAS SENSOR V2(MULTICHANNEL)'
          };
        }
      }
    }
  }

  // 2. Controlla il canale gas secondario (condiviso) SOLO per i feed di QUESTA specifica stazione
  if (micsFeeds && micsFeeds.length && stationTag) {
    for (let i = micsFeeds.length - 1; i >= 0; i--) {
      const st = micsFeeds[i]?.status;
      if (typeof st === 'string' && st.includes(stationTag)) {
        if (st.includes('MiCS-6814') || st.includes('0x04')) {
          return {
            card: 'MiCS-6814 V1',
            chart: 'GROVE MULTICHANNEL GAS SENSOR V1 (MiCS-6814)'
          };
        }
        if (st.includes('Grove V2') || st.includes('0x08')) {
          return {
            card: 'Grove Gas V2',
            chart: 'GROVE - GAS SENSOR V2(MULTICHANNEL)'
          };
        }
      }
    }
  }

  // 3. Fallback sulla configurazione statica della stazione (STATIONS)
  if (station?.gasSensor) {
    return station.gasSensor;
  }

  if (isStation02) {
    return {
      card: 'MiCS-6814 V1',
      chart: 'GROVE MULTICHANNEL GAS SENSOR V1 (MiCS-6814)'
    };
  }

  return {
    card: 'Grove Gas V2',
    chart: 'GROVE - GAS SENSOR V2(MULTICHANNEL)'
  };
}

// EEA (European Environment Agency) Classifications & Thresholds
const EEA_THRESHOLDS = {
  PM25: [10, 20, 25, 50],
  PM10: [20, 40, 50, 100],
  CLASSES: {
    1: { label: 'Buona', color: '#16a34a', bg: 'rgba(22, 163, 74, 0.2)' },
    2: { label: 'Discreta', color: '#65a30d', bg: 'rgba(101, 163, 13, 0.2)' },
    3: { label: 'Moderata', color: '#eab308', bg: 'rgba(234, 179, 8, 0.2)' },
    4: { label: 'Scarsa', color: '#f97316', bg: 'rgba(249, 115, 22, 0.2)' },
    5: { label: 'Molto scarsa', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.2)' }
  }
};

// EPA (US Environmental Protection Agency) Breakpoints & Colors
const EPA_BREAKPOINTS = {
  PM25: [
    [0, 12.0, 0, 50],
    [12.1, 35.4, 51, 100],
    [35.5, 55.4, 101, 150],
    [55.5, 150.4, 151, 200],
    [150.5, 250.4, 201, 300],
    [250.5, 500.4, 301, 500]
  ],
  PM10: [
    [0, 54, 0, 50],
    [55, 154, 51, 100],
    [155, 254, 101, 150],
    [255, 354, 151, 200],
    [355, 424, 201, 300],
    [425, 604, 301, 500]
  ],
  BANDS: [
    { max: 50, label: 'Buona', color: '#16a34a' },
    { max: 100, label: 'Moderata', color: '#f59e0b' },
    { max: 150, label: 'Non salubre per gruppi sensibili', color: '#f97316' },
    { max: 200, label: 'Non salubre', color: '#dc2626' },
    { max: 300, label: 'Molto non salubre', color: '#7c2d12' },
    { max: 500, label: 'Pericolosa', color: '#4c0519' }
  ]
};

// Chart Metadata Mapping
const CHART_META = {
  1: { title: 'Umidità', sensor: 'BME680', unit: '%', min: 0, max: 100, color: '#38bdf8' },
  2: { title: 'Temperatura', sensor: 'BME680', unit: '°C', min: -10, max: 60, color: '#f43f5e' },
  3: { title: 'Pressione', sensor: 'BME680', unit: 'hPa', min: 900, max: 1100, color: '#c084fc' },
  4: { title: 'VOC - Delta rispetto baseline 24h', sensor: 'BME680', unit: 'Delta kOhm', min: 0, max: 500, color: '#3b82f6' },
  5: { title: 'PM1', sensor: 'PMS5003', unit: 'µg/m³', min: 0, max: 100, color: '#a855f7' },
  6: { title: 'PM2.5', sensor: 'PMS5003', unit: 'µg/m³', min: 0, max: 100, color: '#ec4899' },
  7: { title: 'PM10', sensor: 'PMS5003', unit: 'µg/m³', min: 0, max: 100, color: '#10b981' },
  mics_co: { title: 'Monossido di Carbonio (CO)', sensor: 'Gas Sensor', unit: 'µg/m³', color: '#f59e0b' },
  mics_no2: { title: 'Biossido di Azoto (NO₂)', sensor: 'Gas Sensor', unit: 'µg/m³', color: '#06b6d4' },
  mics_nh3: { title: 'Ammoniaca (NH₃)', sensor: 'Gas Sensor', unit: 'µg/m³', color: '#8b5cf6' }
};

// Default Factory Visualization Preferences
const DEFAULT_PREFERENCES = {
  viewMode: 'live',
  day: '',
  startDate: '',
  mode: 'EEA',
  remember: false,
  charts: ['5', '6', '7', 'combo', '1', '2', '3', '4', 'mics_co', 'mics_no2', 'mics_nh3']
};
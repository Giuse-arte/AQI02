/* ==========================================================================
   AQI DASHBOARD 2.0 - CONFIGURATION & CONSTANTS
   ========================================================================== */

// Externalized Stations Configuration - Add new stations here effortlessly
const STATIONS = [
  { id: 2789658, apiKey: '4IMIXLC0RWW9K4PA', name: 'Device N° AQI_01', location: 'Stazione Primaria' },
  { id: 3412629, apiKey: 'HP8HM37WZ9BAVB4A', name: 'Device N° AQI_02', location: 'Stazione Secondaria' }
];

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
  4: { title: 'VOC — Delta rispetto baseline 24h', sensor: 'BME680', unit: 'Delta kOhm', min: 0, max: 500, color: '#3b82f6' },
  5: { title: 'PM1', sensor: 'PMS5003', unit: 'µg/m³', min: 0, max: 100, color: '#a855f7' },
  6: { title: 'PM2.5', sensor: 'PMS5003', unit: 'µg/m³', min: 0, max: 100, color: '#ec4899' },
  7: { title: 'PM10', sensor: 'PMS5003', unit: 'µg/m³', min: 0, max: 100, color: '#10b981' }
};

// Default Factory Visualization Preferences
const DEFAULT_PREFERENCES = {
  viewMode: 'live',
  day: '',
  startDate: '',
  mode: 'EEA',
  remember: false,
  charts: ['1', '2', '3', '4', '5', '6', '7', 'combo']
};

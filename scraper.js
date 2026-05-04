// Scraper prezzi valutazione iPhone — fonte: wefix.it (negozio Roma Monti, store 365)
// Output: prezzi.json (struttura compatibile col widget di ifixroma.com)

const fs = require('fs');

const STORE_ID = 365;
const BRAND_ID = 1;
const CATEGORY_ID = 'mnZ7oze2wHCnN1HRbNFJRXxX6UxKc8WK';
const BASE_URL = 'https://wefix.it/v2/booking-modules';

const RICARICO_BASE = 5; // €5 sopra il prezzo wefix

const COLORS_FILE = 'colors.json';
const OUTPUT_FILE = 'prezzi.json';

// Mappatura nome wefix → nome usato sul sito ifixroma
const MAPPA_NOMI = {
  'iPhone 11': 'iPhone 11',
  'iPhone 11 Pro': 'iPhone 11 Pro',
  'iPhone 11 Pro Max': 'iPhone 11 Pro Max',
  'iPhone SE (3a gen.)': 'iPhone SE (3ª gen 2022)',
  'iPhone 12': 'iPhone 12',
  'iPhone 12 mini': 'iPhone 12 mini',
  'iPhone 12 Pro': 'iPhone 12 Pro',
  'iPhone 12 Pro Max': 'iPhone 12 Pro Max',
  'iPhone 13': 'iPhone 13',
  'iPhone 13 mini': 'iPhone 13 mini',
  'iPhone 13 Pro': 'iPhone 13 Pro',
  'iPhone 13 Pro Max': 'iPhone 13 Pro Max',
  'iPhone 14': 'iPhone 14',
  'iPhone 14 Plus': 'iPhone 14 Plus',
  'iPhone 14 Pro': 'iPhone 14 Pro',
  'iPhone 14 Pro Max': 'iPhone 14 Pro Max',
  'iPhone 15': 'iPhone 15',
  'iPhone 15 Plus': 'iPhone 15 Plus',
  'iPhone 15 Pro': 'iPhone 15 Pro',
  'iPhone 15 Pro Max': 'iPhone 15 Pro Max',
  'iPhone 16': 'iPhone 16',
  'iPhone 16 Plus': 'iPhone 16 Plus',
  'iPhone 16 Pro': 'iPhone 16 Pro',
  'iPhone 16 Pro Max': 'iPhone 16 Pro Max',
};

// Colori da mostrare per ogni modello sul widget
const COLORI = {
  'iPhone 11': ['Black','White','Green','Yellow','Purple','PRODUCT(RED)'],
  'iPhone 11 Pro': ['Midnight Green','Space Gray','Silver','Gold'],
  'iPhone 11 Pro Max': ['Midnight Green','Space Gray','Silver','Gold'],
  'iPhone SE (3ª gen 2022)': ['Midnight','Starlight','PRODUCT(RED)'],
  'iPhone 12': ['Black','White','Green','Blue','Purple','PRODUCT(RED)'],
  'iPhone 12 mini': ['Black','White','Green','Blue','Purple','PRODUCT(RED)'],
  'iPhone 12 Pro': ['Graphite','Silver','Gold','Pacific Blue'],
  'iPhone 12 Pro Max': ['Graphite','Silver','Gold','Pacific Blue'],
  'iPhone 13': ['Midnight','Starlight','Pink','Blue','Green','PRODUCT(RED)'],
  'iPhone 13 mini': ['Midnight','Starlight','Pink','Blue','Green','PRODUCT(RED)'],
  'iPhone 13 Pro': ['Graphite','Gold','Silver','Sierra Blue','Alpine Green'],
  'iPhone 13 Pro Max': ['Graphite','Gold','Silver','Sierra Blue','Alpine Green'],
  'iPhone 14': ['Midnight','Starlight','Blue','Purple','Yellow','PRODUCT(RED)'],
  'iPhone 14 Plus': ['Midnight','Starlight','Blue','Purple','Yellow','PRODUCT(RED)'],
  'iPhone 14 Pro': ['Space Black','Silver','Gold','Deep Purple'],
  'iPhone 14 Pro Max': ['Space Black','Silver','Gold','Deep Purple'],
  'iPhone 15': ['Black','Blue','Green','Pink','Yellow'],
  'iPhone 15 Plus': ['Black','Blue','Green','Pink','Yellow'],
  'iPhone 15 Pro': ['Black Titanium','White Titanium','Blue Titanium','Natural Titanium'],
  'iPhone 15 Pro Max': ['Black Titanium','White Titanium','Blue Titanium','Natural Titanium'],
  'iPhone 16': ['Black','Blue','Green','Pink','Yellow'],
  'iPhone 16 Plus': ['Black','Blue','Green','Pink','Yellow'],
  'iPhone 16 Pro': ['Black Titanium','White Titanium','Blue Titanium','Natural Titanium'],
  'iPhone 16 Pro Max': ['Black Titanium','White Titanium','Blue Titanium','Natural Titanium'],
  'iPhone 16e': ['Black','White'],
  'iPhone 17': ['Black','Blue','Green','Pink','Yellow'],
  'iPhone 17 Pro': ['Black Titanium','White Titanium','Blue Titanium','Natural Titanium'],
  'iPhone 17 Pro Max': ['Black Titanium','White Titanium','Blue Titanium','Natural Titanium'],
  'iPhone Air': ['Black Titanium','White Titanium','Blue Titanium','Natural Titanium'],
};

// Modelli che wefix non ha — gestiti manualmente. Modifica qui i prezzi.
const MANUALI = {
  'iPhone 16e': {
    '128 GB': 395,
    '256 GB': 450,
    '512 GB': 590,
  },
  'iPhone 17': {
    '256 GB': 'Prossimamente',
    '512 GB': 'Prossimamente',
  },
  'iPhone 17 Pro': {
    '256 GB': 'Prossimamente',
    '512 GB': 'Prossimamente',
    '1 TB':   'Prossimamente',
  },
  'iPhone 17 Pro Max': {
    '256 GB': 'Prossimamente',
    '512 GB': 'Prossimamente',
    '1 TB':   'Prossimamente',
    '2 TB':   'Prossimamente',
  },
  'iPhone Air': {
    '256 GB': 'Prossimamente',
    '512 GB': 'Prossimamente',
    '1 TB':   'Prossimamente',
  },
};

// Ordine di visualizzazione nel dropdown del sito
const ORDINE = [
  'iPhone 11','iPhone 11 Pro','iPhone 11 Pro Max',
  'iPhone SE (3ª gen 2022)',
  'iPhone 12','iPhone 12 mini','iPhone 12 Pro','iPhone 12 Pro Max',
  'iPhone 13','iPhone 13 mini','iPhone 13 Pro','iPhone 13 Pro Max',
  'iPhone 14','iPhone 14 Plus','iPhone 14 Pro','iPhone 14 Pro Max',
  'iPhone 15','iPhone 15 Plus','iPhone 15 Pro','iPhone 15 Pro Max',
  'iPhone 16','iPhone 16 Plus','iPhone 16 Pro','iPhone 16 Pro Max',
  'iPhone 16e',
  'iPhone 17','iPhone 17 Pro','iPhone 17 Pro Max',
  'iPhone Air',
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ifix-prezzi-bot)',
      'Accept': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function getDevices() {
  const url = `${BASE_URL}/stores/${STORE_ID}/brands/${BRAND_ID}/devices?categoryId=${CATEGORY_ID}&isUsed=true`;
  const data = await fetchJson(url);
  return data.result || [];
}

async function getCapacities(deviceId) {
  const url = `${BASE_URL}/stores/${STORE_ID}/brands/${BRAND_ID}/devices/${deviceId}/storage-capacities`;
  const data = await fetchJson(url);
  return data.result || [];
}

async function getPrice(deviceId, capacityId, colorId) {
  const url = `${BASE_URL}/stores/${STORE_ID}/brands/${BRAND_ID}/devices/${deviceId}/storage-capacities/${capacityId}/colors/${colorId}/price`;
  try {
    const data = await fetchJson(url);
    if (data.result && data.result.price) return parseFloat(data.result.price);
    return null;
  } catch {
    return null;
  }
}

async function discoverColor(deviceId, capacityId) {
  const probe = [78, 1, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  for (const id of probe) {
    if (await getPrice(deviceId, capacityId, id) !== null) return id;
    await sleep(80);
  }
  for (let id = 1; id <= 200; id++) {
    if (probe.includes(id)) continue;
    if (await getPrice(deviceId, capacityId, id) !== null) return id;
    await sleep(50);
  }
  return null;
}

function loadJson(file, fallback) {
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  return fallback;
}

(async () => {
  const colorsCache = loadJson(COLORS_FILE, {});
  const dati = {};

  console.log('→ Scarico lista modelli...');
  const devices = await getDevices();
  console.log(`  ${devices.length} modelli su wefix\n`);

  for (const device of devices) {
    const userName = MAPPA_NOMI[device.nameDevice];
    if (!userName) continue;

    console.log(`→ ${userName}`);
    const capacities = await getCapacities(device.idDevice);
    if (!capacities.length) { console.log('  ⊘ niente capacità'); continue; }

    const firstCap = capacities[0];
    let colorId = colorsCache[device.idDevice];

    if (colorId && await getPrice(device.idDevice, firstCap.id, colorId) === null) {
      console.log('  ⊙ colore in cache non più valido');
      colorId = null;
    }

    if (!colorId) {
      console.log('  ⊙ ricerca colore valido...');
      colorId = await discoverColor(device.idDevice, firstCap.id);
      if (!colorId) { console.log('  ⊘ nessun colore trovato'); continue; }
      colorsCache[device.idDevice] = colorId;
      fs.writeFileSync(COLORS_FILE, JSON.stringify(colorsCache, null, 2));
      console.log(`  ✓ colore ${colorId}`);
    }

    const colors = COLORI[userName] || [];
    if (!colors.length) continue;

    dati[userName] = {};
    for (const cap of capacities) {
      const wefixPrice = await getPrice(device.idDevice, cap.id, colorId);
      await sleep(40);
      if (wefixPrice === null) continue;
      const final = Math.round(wefixPrice + RICARICO_BASE);
      console.log(`  ${cap.capacity}: ${wefixPrice}€ → ${final}€`);
      dati[userName][cap.capacity] = {};
      for (const c of colors) dati[userName][cap.capacity][c] = final;
    }
  }

  // Aggiunge i modelli manuali (16e, 17, Air)
  for (const [model, caps] of Object.entries(MANUALI)) {
    const colors = COLORI[model] || [];
    if (!colors.length) continue;
    dati[model] = {};
    for (const [cap, price] of Object.entries(caps)) {
      dati[model][cap] = {};
      for (const c of colors) dati[model][cap][c] = price;
    }
  }

  // Riordina secondo ORDINE
  const ordinato = {};
  for (const m of ORDINE) if (dati[m]) ordinato[m] = dati[m];
  for (const m of Object.keys(dati)) if (!ordinato[m]) ordinato[m] = dati[m];

  // Verifica che lo scrape sia andato a buon fine
  const conteggio = Object.keys(ordinato).length;
  if (conteggio < 10) {
    console.error(`✗ Solo ${conteggio} modelli — abort, non sovrascrivo prezzi.json`);
    process.exit(1);
  }

  const output = {
    aggiornato: new Date().toISOString(),
    fonte: 'wefix.it negozio Roma Monti (store 365)',
    formula: 'prezzo wefix + 5€ (+20€ se supervaluta perfetto+accessori)',
    dati: ordinato,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`\n✓ ${OUTPUT_FILE} aggiornato — ${conteggio} modelli`);
})().catch(err => {
  console.error('Errore fatale:', err);
  process.exit(1);
});

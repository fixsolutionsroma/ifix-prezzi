// Scraper prezzi valutazione iPhone — fonte primaria: wefix.it (store 365)
// Fallback: tabella interna FALLBACK_PRICES (modificabile a mano per prezzi manuali)

const fs = require('fs');

const STORE_ID = 365;
const BRAND_ID = 1;
const CATEGORY_ID = 'mnZ7oze2wHCnN1HRbNFJRXxX6UxKc8WK';
const BASE_URL = 'https://wefix.it/v2/booking-modules';

const RICARICO_BASE = 5;
const REQUEST_DELAY_MS = 500;
const MAX_DISCOVERY_ATTEMPTS = 60;
const MAX_429_RETRIES = 5;

const COLORS_FILE = 'colors.json';
const OUTPUT_FILE = 'prezzi.json';

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

// PREZZI MANUALI / FALLBACK
// Modifica i numeri qui sotto per cambiare i prezzi manuali a mano
const FALLBACK_PRICES = {
  'iPhone 11': { '64 GB': 120, '128 GB': 145, '256 GB': 160 },
  'iPhone 11 Pro': { '64 GB': 150, '256 GB': 195, '512 GB': 230 },
  'iPhone 11 Pro Max': { '64 GB': 185, '256 GB': 235, '512 GB': 265 },
  'iPhone SE (3ª gen 2022)': { '64 GB': 115, '128 GB': 140, '256 GB': 180 },
  'iPhone 12': { '64 GB': 160, '128 GB': 180, '256 GB': 220 },
  'iPhone 12 mini': { '64 GB': 120, '128 GB': 155, '256 GB': 170 },
  'iPhone 12 Pro': { '128 GB': 245, '256 GB': 270, '512 GB': 295 },
  'iPhone 12 Pro Max': { '128 GB': 290, '256 GB': 320, '512 GB': 335 },
  'iPhone 13': { '128 GB': 245, '256 GB': 270, '512 GB': 315 },
  'iPhone 13 mini': { '128 GB': 205, '256 GB': 240, '512 GB': 290 },
  'iPhone 13 Pro': { '128 GB': 335, '256 GB': 365, '512 GB': 390, '1 TB': 460 },
  'iPhone 13 Pro Max': { '128 GB': 380, '256 GB': 400, '512 GB': 435, '1 TB': 500 },
  'iPhone 14': { '128 GB': 300, '256 GB': 335, '512 GB': 385 },
  'iPhone 14 Plus': { '128 GB': 335, '256 GB': 380, '512 GB': 420 },
  'iPhone 14 Pro': { '128 GB': 435, '256 GB': 480, '512 GB': 545, '1 TB': 600 },
  'iPhone 14 Pro Max': { '128 GB': 500, '256 GB': 540, '512 GB': 585, '1 TB': 630 },
  'iPhone 15': { '128 GB': 410, '256 GB': 450, '512 GB': 500 },
  'iPhone 15 Plus': { '128 GB': 430, '256 GB': 495, '512 GB': 570 },
  'iPhone 15 Pro': { '128 GB': 540, '256 GB': 610, '512 GB': 680, '1 TB': 765 },
  'iPhone 15 Pro Max': { '256 GB': 625, '512 GB': 675, '1 TB': 785 },
  'iPhone 16': { '128 GB': 530, '256 GB': 595, '512 GB': 680 },
  'iPhone 16 Plus': { '128 GB': 625, '256 GB': 705, '512 GB': 775 },
  'iPhone 16 Pro': { '128 GB': 705, '256 GB': 745, '512 GB': 880, '1 TB': 980 },
  'iPhone 16 Pro Max': { '256 GB': 785, '512 GB': 890, '1 TB': 1000 },
  'iPhone 16e': { '128 GB': 395, '256 GB': 450, '512 GB': 590 },
  'iPhone 17': { '256 GB': 'Prossimamente', '512 GB': 'Prossimamente' },
  'iPhone 17 Pro': { '256 GB': 'Prossimamente', '512 GB': 'Prossimamente', '1 TB': 'Prossimamente' },
  'iPhone 17 Pro Max': { '256 GB': 'Prossimamente', '512 GB': 'Prossimamente', '1 TB': 'Prossimamente', '2 TB': 'Prossimamente' },
  'iPhone Air': { '256 GB': 'Prossimamente', '512 GB': 'Prossimamente', '1 TB': 'Prossimamente' },
};

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

async function fetchJson(url, attempt = 0) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ifix-prezzi-bot)',
      'Accept': 'application/json',
    },
  });
  if (res.status === 429) {
    if (attempt >= MAX_429_RETRIES) throw new Error('Rate limited');
    const wait = Math.min(60000, 2000 * Math.pow(2, attempt));
    console.log(`    ! 429 — aspetto ${wait/1000}s`);
    await sleep(wait);
    return fetchJson(url, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function getDevices() {
  const url = `${BASE_URL}/stores/${STORE_ID}/brands/${BRAND_ID}/devices?categoryId=${CATEGORY_ID}&isUsed=true`;
  return (await fetchJson(url)).result || [];
}

async function getCapacities(deviceId) {
  const url = `${BASE_URL}/stores/${STORE_ID}/brands/${BRAND_ID}/devices/${deviceId}/storage-capacities`;
  return (await fetchJson(url)).result || [];
}

async function getPrice(deviceId, capacityId, colorId) {
  const url = `${BASE_URL}/stores/${STORE_ID}/brands/${BRAND_ID}/devices/${deviceId}/storage-capacities/${capacityId}/colors/${colorId}/price`;
  try {
    const data = await fetchJson(url);
    if (data.result && data.result.price) return parseFloat(data.result.price);
    return null;
  } catch { return null; }
}

async function discoverColor(deviceId, capacityId) {
  const probe = [78, 1, 5, 10, 20, 30, 50, 70, 80, 90, 100];
  for (let id = 15; id <= 300; id += 5) if (!probe.includes(id)) probe.push(id);
  const probes = probe.slice(0, MAX_DISCOVERY_ATTEMPTS);
  for (const id of probes) {
    if (await getPrice(deviceId, capacityId, id) !== null) return id;
    await sleep(REQUEST_DELAY_MS);
  }
  return null;
}

function loadJson(file, fallback) {
  if (fs.existsSync(file)) {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
  }
  return fallback;
}

function expandPrices(model, prices) {
  const colors = COLORI[model] || [];
  const out = {};
  for (const [cap, price] of Object.entries(prices)) {
    out[cap] = {};
    for (const c of colors) out[cap][c] = price;
  }
  return out;
}

(async () => {
  const colorsCache = loadJson(COLORS_FILE, {});
  const wefixData = {};
  let okCount = 0;

  let devices = [];
  try {
    console.log('→ Lista modelli...');
    devices = await getDevices();
    console.log(`  ${devices.length} modelli wefix\n`);
  } catch (e) {
    console.error('  ✗', e.message);
  }

  for (const device of devices) {
    const userName = MAPPA_NOMI[device.nameDevice];
    if (!userName) continue;

    console.log(`→ ${userName}`);
    try {
      const capacities = await getCapacities(device.idDevice);
      await sleep(REQUEST_DELAY_MS);
      if (!capacities.length) { console.log('  ⊘ no capacità → fallback'); continue; }

      const firstCap = capacities[0];
      let colorId = colorsCache[device.idDevice];

      if (colorId) {
        const test = await getPrice(device.idDevice, firstCap.id, colorId);
        await sleep(REQUEST_DELAY_MS);
        if (test === null) { colorId = null; delete colorsCache[device.idDevice]; }
      }

      if (!colorId) {
        console.log('  ⊙ ricerca colore...');
        colorId = await discoverColor(device.idDevice, firstCap.id);
        if (!colorId) { console.log('  ⊘ no colore → fallback'); continue; }
        colorsCache[device.idDevice] = colorId;
        fs.writeFileSync(COLORS_FILE, JSON.stringify(colorsCache, null, 2));
        console.log(`  ✓ colore ${colorId}`);
      }

      const colors = COLORI[userName] || [];
      const modelData = {};
      for (const cap of capacities) {
        const price = await getPrice(device.idDevice, cap.id, colorId);
        await sleep(REQUEST_DELAY_MS);
        if (price === null) continue;
        const final = Math.round(price + RICARICO_BASE);
        console.log(`  ${cap.capacity}: ${price}€ → ${final}€`);
        modelData[cap.capacity] = {};
        for (const c of colors) modelData[cap.capacity][c] = final;
      }

      if (Object.keys(modelData).length > 0) { wefixData[userName] = modelData; okCount++; }
      else console.log('  ⊘ nessun prezzo → fallback');
    } catch (e) {
      console.log(`  ✗ ${e.message} → fallback`);
    }
  }

  // Merge: fallback come base, wefix sovrascrive dove disponibile
  const final = {};
  const allModels = new Set([...ORDINE, ...Object.keys(FALLBACK_PRICES), ...Object.keys(wefixData)]);
  for (const model of allModels) {
    if (wefixData[model] && Object.keys(wefixData[model]).length > 0) {
      const fb = FALLBACK_PRICES[model] ? expandPrices(model, FALLBACK_PRICES[model]) : {};
      final[model] = { ...fb, ...wefixData[model] };
    } else if (FALLBACK_PRICES[model]) {
      final[model] = expandPrices(model, FALLBACK_PRICES[model]);
    }
  }

  const ordinato = {};
  for (const m of ORDINE) if (final[m]) ordinato[m] = final[m];
  for (const m of Object.keys(final)) if (!ordinato[m]) ordinato[m] = final[m];

  const output = {
    aggiornato: new Date().toISOString(),
    fonte: 'wefix.it store 365 + fallback manuale',
    formula: 'wefix +5€ (+20€ supervaluta)',
    statistiche: {
      modelli_da_wefix: okCount,
      totale: Object.keys(ordinato).length,
    },
    dati: ordinato,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`\n✓ ${OUTPUT_FILE} — ${okCount} da wefix, totale ${Object.keys(ordinato).length}`);
})().catch(err => {
  console.error('Errore fatale:', err);
  process.exit(1);
});

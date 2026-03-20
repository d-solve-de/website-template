/**
 * Website Template – Main Application Script
 *
 * Loads all company-specific data from a Google Sheets document:
 *   - Contract Information (company name, address, phone, etc.)
 *   - Prices (menu items with categories)
 *   - Opening Hours (daily hours, supports midnight wrap & multiple slots)
 *   - News (announcements)
 *
 * Features:
 *   - German / English i18n (German default)
 *   - Dark / Light theme toggle
 *   - Live open/closed status calculation
 *   - Clickable phone number (tel: link)
 *   - Google Maps navigation link
 *   - Impressum & Datenschutz modals (generated from company data)
 *   - Easter egg in footer (password = company house number)
 *   - No cookies used
 */

'use strict';

/* =============================================
   CONFIGURATION
   ============================================= */

const SHEET_ID  = '1TBz3oGn5b6mI8FH6s6f1L831WddQgvinrH3EQsanr00';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;

function gvizUrl(sheetName) {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
}

/** Maps day abbreviations (DE & EN) to JS getDay() indices. */
const DAY_MAP = {
  mo:1, di:2, mi:3, do:4, fr:5, sa:6, so:0,
  mon:1, tue:2, wed:3, thu:4, fri:5, sat:6, sun:0,
  montag:1, dienstag:2, mittwoch:3, donnerstag:4, freitag:5, samstag:6, sonntag:0,
  monday:1, tuesday:2, wednesday:3, thursday:4, friday:5, saturday:6, sunday:0,
};

/** Category → emoji fallback for menu cards without images. */
const CAT_EMOJI = {
  'döner': '🥙', 'kebab': '🥙', 'döner & kebab': '🥙', 'kebab gerichte': '🥙',
  'falafel': '🧆',
  'lahmacun': '🫓',
  'pizza': '🍕', 'pizzen': '🍕',
  'burger': '🍔',
  'salat': '🥗', 'salate': '🥗', 'salads': '🥗',
  'vegetarische gerichte': '🥗', 'vegan': '🌱',
  'suppe': '🍲', 'suppen': '🍲',
  'pasta': '🍝',
  'teig gerichte': '🥟',
  'getränke': '🥤', 'drinks': '🥤', 'beverages': '🥤',
  'alkoholische getränke': '🍺', 'alkoholfreie getränke': '🥤',
  'dessert': '🍰', 'desserts': '🍰', 'nachspeisen': '🍰',
  'vorspeisen': '🥗', 'starters': '🥗',
  'hauptgerichte': '🍽️', 'main courses': '🍽️',
  'beilagen': '🥔', 'sides': '🥔',
  'frühstück': '🍳', 'breakfast': '🍳',
  'snacks': '🍿',
};
const DEFAULT_EMOJI = '🍽️';

/** Known keys for Contract Information sheet (normalized). */
const INFO_ALIASES = {
  company_name: 'companyName', firmenname: 'companyName', name: 'companyName', firma: 'companyName',
  street: 'street', straße: 'street', strasse: 'street',
  house_number: 'houseNumber', hausnummer: 'houseNumber',
  zip: 'zip', plz: 'zip', postleitzahl: 'zip',
  city: 'city', stadt: 'city', ort: 'city',
  country: 'country', land: 'country',
  phone: 'phone', telefon: 'phone', tel: 'phone',
  phone_display: 'phoneDisplay', telefon_anzeige: 'phoneDisplay',
  email: 'email', 'e-mail': 'email',
  owner: 'owner', inhaber: 'owner', betreiber: 'owner', owner_name: 'owner', geschäftsführer: 'owner',
  tax_id: 'taxId', steuernummer: 'taxId', ust_id: 'taxId', steuer_id: 'taxId', 'ust-id': 'taxId', 'ust-idnr': 'taxId',
  logo_emoji: 'logoEmoji', logo: 'logoEmoji',
  subtitle_de: 'subtitleDe', untertitel_de: 'subtitleDe', slogan_de: 'subtitleDe',
  subtitle_en: 'subtitleEn', untertitel_en: 'subtitleEn', slogan_en: 'subtitleEn',
  subtitle: 'subtitleDe', untertitel: 'subtitleDe', slogan: 'subtitleDe',
  maps_query: 'mapsQuery', google_maps: 'mapsQuery', maps: 'mapsQuery',
  maps_embed: 'mapsEmbed', maps_embed_url: 'mapsEmbed',
  website: 'website', webseite: 'website',
  register_court: 'registerCourt', registergericht: 'registerCourt',
  register_number: 'registerNumber', registernummer: 'registerNumber', handelsregister: 'registerNumber',
};

/* =============================================
   TRANSLATIONS (i18n)
   ============================================= */

const I18N = {
  de: {
    'nav.menu': 'Speisekarte',
    'nav.hours': 'Öffnungszeiten',
    'nav.contact': 'Kontakt',
    'nav.call': '📞 Anrufen',
    'hero.menuBtn': 'Zur Speisekarte',
    'hero.routeBtn': '📍 Route starten',
    'menu.heading': 'Speisekarte',
    'menu.subtitle': 'Unser Angebot für dich',
    'menu.all': 'Alle',
    'menu.loading': 'Speisekarte wird geladen…',
    'menu.error': '⚠️ Die Speisekarte konnte leider nicht geladen werden. Bitte kontaktiere uns direkt.',
    'menu.noEntries': 'Keine Einträge gefunden.',
    'hours.heading': 'Öffnungszeiten',
    'hours.subtitle': 'Wann du uns besuchen kannst',
    'hours.closed': 'Geschlossen',
    'hours.openNow': 'Jetzt geöffnet – bis',
    'hours.closedNow': 'Aktuell geschlossen – öffnet um',
    'hours.closedGeneral': 'Aktuell geschlossen',
    'hours.uhr': 'Uhr',
    'hours.error': '⚠️ Die Öffnungszeiten konnten nicht geladen werden. Bitte kontaktiere uns direkt.',
    'hours.todayOpen': 'geöffnet',
    'hours.todayClosed': 'geschlossen',
    'contact.heading': 'Kontakt & Anfahrt',
    'contact.subtitle': 'Wir freuen uns auf deinen Besuch',
    'contact.address': 'Adresse',
    'contact.phone': 'Telefon',
    'contact.today': 'Heute',
    'contact.loading': 'Wird geladen…',
    'contact.navBtn': '🗺️ Navigation starten',
    'contact.unavailable': 'Kontaktinformationen konnten nicht geladen werden.',
    'footer.legal': 'Rechtliches',
    'footer.impressum': 'Impressum',
    'footer.datenschutz': 'Datenschutzerklärung',
    'footer.copyright': 'Alle Rechte vorbehalten.',
    'status.open': '✅ Geöffnet',
    'status.closed': '❌ Geschlossen',
    'status.loading': '⏳ Status wird geladen…',
    'day.0': 'Sonntag', 'day.1': 'Montag', 'day.2': 'Dienstag', 'day.3': 'Mittwoch',
    'day.4': 'Donnerstag', 'day.5': 'Freitag', 'day.6': 'Samstag',
  },
  en: {
    'nav.menu': 'Menu',
    'nav.hours': 'Hours',
    'nav.contact': 'Contact',
    'nav.call': '📞 Call Us',
    'hero.menuBtn': 'View Menu',
    'hero.routeBtn': '📍 Get Directions',
    'menu.heading': 'Menu',
    'menu.subtitle': 'Our offerings for you',
    'menu.all': 'All',
    'menu.loading': 'Loading menu…',
    'menu.error': '⚠️ The menu could not be loaded. Please contact us directly.',
    'menu.noEntries': 'No entries found.',
    'hours.heading': 'Opening Hours',
    'hours.subtitle': 'When you can visit us',
    'hours.closed': 'Closed',
    'hours.openNow': 'Open now – until',
    'hours.closedNow': 'Currently closed – opens at',
    'hours.closedGeneral': 'Currently closed',
    'hours.uhr': '',
    'hours.error': '⚠️ Opening hours could not be loaded. Please contact us directly.',
    'hours.todayOpen': 'open',
    'hours.todayClosed': 'closed',
    'contact.heading': 'Contact & Directions',
    'contact.subtitle': 'We look forward to your visit',
    'contact.address': 'Address',
    'contact.phone': 'Phone',
    'contact.today': 'Today',
    'contact.loading': 'Loading…',
    'contact.navBtn': '🗺️ Start Navigation',
    'contact.unavailable': 'Contact information could not be loaded.',
    'footer.legal': 'Legal',
    'footer.impressum': 'Legal Notice',
    'footer.datenschutz': 'Privacy Policy',
    'footer.copyright': 'All rights reserved.',
    'status.open': '✅ Open',
    'status.closed': '❌ Closed',
    'status.loading': '⏳ Loading status…',
    'day.0': 'Sunday', 'day.1': 'Monday', 'day.2': 'Tuesday', 'day.3': 'Wednesday',
    'day.4': 'Thursday', 'day.5': 'Friday', 'day.6': 'Saturday',
  },
};

/* =============================================
   STATE
   ============================================= */

let lang = 'de';
let company = {};          // populated from Contract Information sheet
let hoursData = null;      // { dayIndex: [[open, close], …] }
let allMenuItems = [];

/* =============================================
   HELPERS
   ============================================= */

function t(key) {
  return I18N[lang]?.[key] ?? I18N.de?.[key] ?? key;
}

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Parses a time value from a Google Sheet cell into a fractional hour number.
 *   "Date(1899,11,30,11,30,0)" → 11.5
 *   "11:30" or "11:30:00"     → 11.5
 *   11 or "11"                → 11
 */
function parseTime(val) {
  if (val == null) return null;
  const s = String(val).trim();
  if (!s) return null;
  const dm = s.match(/^Date\(\d+,\d+,\d+,(\d+),(\d+),(\d+)\)$/);
  if (dm) return parseInt(dm[1], 10) + parseInt(dm[2], 10) / 60;
  if (s.includes(':')) {
    const p = s.split(':');
    return parseInt(p[0], 10) + parseInt(p[1], 10) / 60;
  }
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

/** Formats fractional hours (possibly > 24) as HH:MM. */
function fmtTime(h) {
  const norm = h >= 24 ? h - 24 : h;
  const totalMin = Math.round(norm * 60);
  const hrs = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  return String(hrs).padStart(2, '0') + ':' + String(mins).padStart(2, '0');
}

function catEmoji(kategorie) {
  return CAT_EMOJI[(kategorie || '').toLowerCase().trim()] || DEFAULT_EMOJI;
}

function formatPrice(price) {
  if (price == null || isNaN(price)) return '';
  const locale = lang === 'en' ? 'en-US' : 'de-DE';
  return Number(price).toLocaleString(locale, { style: 'currency', currency: 'EUR' });
}

/** Builds the full address string from company info. */
function fullAddress() {
  const parts = [];
  if (company.street || company.houseNumber) {
    parts.push([company.street, company.houseNumber].filter(Boolean).join(' '));
  }
  if (company.zip || company.city) {
    parts.push([company.zip, company.city].filter(Boolean).join(' '));
  }
  return parts.join(', ');
}

/** Returns +49... formatted phone for tel: href, or raw value. */
function phoneHref() {
  const p = company.phone || '';
  if (p.startsWith('+')) return 'tel:' + p.replace(/[\s\-\/]/g, '');
  // Try to build from display format: 06131 2165510 → +496131...
  const cleaned = p.replace(/[\s\-\/()]/g, '');
  if (cleaned.startsWith('0')) return 'tel:+49' + cleaned.slice(1);
  return 'tel:' + cleaned;
}

function phoneDisplay() {
  return company.phoneDisplay || company.phone || '';
}

function mapsNavUrl() {
  const q = company.mapsQuery || fullAddress();
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}&travelmode=driving`;
}

/* =============================================
   GOOGLE SHEETS – FETCH HELPER
   ============================================= */

/**
 * Fetches and parses a Google Sheets gviz/tq JSON response.
 * Returns the parsed table object: { cols: [...], rows: [...] }
 */
async function fetchSheet(sheetName) {
  const res = await fetch(gvizUrl(sheetName));
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  const jsonStr = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
  const data = JSON.parse(jsonStr);
  if (!data?.table?.rows?.length) throw new Error('Empty sheet: ' + sheetName);
  return data.table;
}

/* =============================================
   LOAD: CONTRACT INFORMATION
   ============================================= */

async function loadCompanyInfo() {
  try {
    const table = await fetchSheet('Contract Information');
    const rows = table.rows;
    const info = {};

    rows.forEach(row => {
      if (!row.c || !row.c[0] || row.c[0].v == null) return;
      const rawKey = String(row.c[0].v).trim();
      const val = row.c[1]?.v != null ? String(row.c[1].v).trim() : '';
      const normKey = rawKey.toLowerCase().replace(/[\s\-]+/g, '_');
      const mappedKey = INFO_ALIASES[normKey];
      if (mappedKey) {
        info[mappedKey] = val;
      } else {
        // Store unknown keys under their normalized name
        info[normKey] = val;
      }
    });

    company = info;
  } catch (err) {
    console.warn('[Company Info] Could not load:', err);
  }
}

/* =============================================
   LOAD: PRICES / MENU
   ============================================= */

async function loadPrices() {
  const loading = document.getElementById('menuLoading');
  const errorEl = document.getElementById('menuError');
  const grid = document.getElementById('menuGrid');

  try {
    const table = await fetchSheet('Prices');
    const items = table.rows
      .filter(row => row.c && row.c[0]?.v && row.c[1]?.v)
      .map(row => ({
        kategorie: String(row.c[0].v).trim(),
        gericht:   String(row.c[1].v).trim(),
        preis:     row.c[2]?.v != null ? parseFloat(row.c[2].v) : null,
        bildUrl:   row.c[3]?.v ? String(row.c[3].v).trim() : '',
      }))
      .filter(item => item.gericht);

    if (loading) loading.classList.add('hidden');
    renderMenu(items);
  } catch (err) {
    console.warn('[Prices] Could not load:', err);
    if (loading) loading.classList.add('hidden');
    if (errorEl) errorEl.classList.remove('hidden');
    if (grid) grid.innerHTML = '';
  }
}

/* =============================================
   LOAD: OPENING HOURS
   ============================================= */

async function loadHours() {
  const loading = document.getElementById('hoursLoading');
  const errorEl = document.getElementById('hoursError');
  const tableEl = document.getElementById('hoursTable');

  try {
    const table = await fetchSheet('Opening Hours');
    const hours = {};

    table.rows
      .filter(row => row.c && row.c[0]?.v)
      .forEach(row => {
        const dayStr = String(row.c[0].v).trim().toLowerCase();
        const dayIdx = DAY_MAP[dayStr];
        if (dayIdx === undefined) return;

        const openCell = row.c[1];
        const closeCell = row.c[2];
        if (!openCell && !closeCell) return;

        const open = parseTime(openCell?.f ?? openCell?.v);
        let close = parseTime(closeCell?.f ?? closeCell?.v);
        if (open == null || close == null) return;
        if (open === 0 && close === 0) return;

        // Wrap past midnight
        if (close <= open) close += 24;

        if (!hours[dayIdx]) hours[dayIdx] = [];
        hours[dayIdx].push([open, close]);
      });

    hoursData = hours;

    if (loading) loading.classList.add('hidden');
    if (tableEl) tableEl.classList.remove('hidden');
    renderHoursTable(hours);
    renderHoursStatus(hours);
  } catch (err) {
    console.warn('[Hours] Could not load:', err);
    if (loading) loading.classList.add('hidden');
    if (errorEl) errorEl.classList.remove('hidden');
  }
}

/* =============================================
   LOAD: NEWS
   ============================================= */

async function loadNews() {
  try {
    const table = await fetchSheet('News');
    const items = table.rows
      .filter(row => row.c && row.c[0]?.v)
      .map(row => ({
        title: String(row.c[0].v).trim(),
        text:  row.c[1]?.v ? String(row.c[1].v).trim() : '',
      }));

    if (!items.length) return;

    const container = document.getElementById('newsContainer');
    if (!container) return;

    container.innerHTML = '';
    items.forEach(item => {
      const article = document.createElement('article');
      article.className = 'news-item';
      article.innerHTML = `
        <h3 class="news-title">${esc(item.title)}</h3>
        ${item.text ? `<p class="news-text">${esc(item.text)}</p>` : ''}
      `;
      container.appendChild(article);
    });
    container.hidden = false;
  } catch (err) {
    console.warn('[News] Could not load:', err);
  }
}

/* =============================================
   RENDER: COMPANY INFO → PAGE
   ============================================= */

function applyCompanyInfo() {
  const name = company.companyName || '';
  const emoji = company.logoEmoji || '🏪';
  const subtitle = (lang === 'en' && company.subtitleEn) ? company.subtitleEn : (company.subtitleDe || '');
  const addr = fullAddress();
  const phone = phoneDisplay();
  const pHref = phoneHref();
  const navUrl = mapsNavUrl();

  // Page title + meta
  if (name) {
    document.getElementById('pageTitle').textContent = name;
    const metaDesc = document.getElementById('metaDesc');
    if (metaDesc) metaDesc.setAttribute('content', `${name} – ${subtitle || addr}`);
    const ogTitle = document.getElementById('ogTitle');
    if (ogTitle) ogTitle.setAttribute('content', name);
    const ogDesc = document.getElementById('ogDesc');
    if (ogDesc) ogDesc.setAttribute('content', subtitle || addr);
  }

  // Logos
  setText('logoIcon', emoji);
  setText('logoText', name);
  setText('footerLogoIcon', emoji);
  setText('footerLogoText', name);
  setText('footerCompanyName', name);

  // Hero
  setText('heroTitle', name);
  setText('heroSubtitle', subtitle);

  // Phone links
  if (phone) {
    setPhoneLink('navPhone', pHref, `📞 ${phone}`);
    setPhoneLink('contactPhone', pHref, phone);
    setPhoneLink('footerPhone', pHref, `📞 ${phone}`);
  }

  // Address
  const contactAddr = document.getElementById('contactAddress');
  if (contactAddr && addr) {
    contactAddr.innerHTML = `${esc(name)}<br/>${esc(company.street || '')} ${esc(company.houseNumber || '')}<br/>${esc(company.zip || '')} ${esc(company.city || '')}`;
  } else if (contactAddr && !addr) {
    contactAddr.innerHTML = `<span>${t('contact.unavailable')}</span>`;
  }

  const footerAddr = document.getElementById('footerAddress');
  if (footerAddr) footerAddr.textContent = addr;

  // Navigation buttons
  setLink('heroNavBtn', navUrl);
  setLink('contactNavBtn', navUrl);

  // Google Maps embed
  if (addr || company.mapsEmbed) {
    const mapWrap = document.getElementById('contactMapWrap');
    if (mapWrap) {
      const embedSrc = company.mapsEmbed ||
        `https://maps.google.com/maps?q=${encodeURIComponent(company.mapsQuery || addr)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
      mapWrap.innerHTML = `<iframe title="Standort auf Google Maps" src="${esc(embedSrc)}" width="100%" height="350" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
      mapWrap.classList.add('contact-map');
    }
  }


}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el && text) el.textContent = text;
}

function setPhoneLink(id, href, display) {
  const el = document.getElementById(id);
  if (!el) return;
  el.setAttribute('href', href);
  el.textContent = display;
  el.setAttribute('aria-label', `Anrufen: ${display}`);
}

function setLink(id, href) {
  const el = document.getElementById(id);
  if (el) el.setAttribute('href', href);
}

/* =============================================
   RENDER: MENU
   ============================================= */

function renderMenu(items) {
  const grid = document.getElementById('menuGrid');
  const filterBar = document.getElementById('filterBar');
  if (!grid) return;

  allMenuItems = items;
  const categories = [...new Set(items.map(i => i.kategorie))];

  // Build filter buttons
  if (filterBar) {
    filterBar.querySelectorAll('[data-filter]:not([data-filter="all"])').forEach(b => b.remove());
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.setAttribute('data-filter', cat);
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', 'false');
      btn.textContent = cat;
      filterBar.appendChild(btn);
    });

    filterBar.addEventListener('click', e => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      filterBar.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      renderMenuItems(grid, btn.getAttribute('data-filter'));
    });
  }

  renderMenuItems(grid, 'all');
}

function renderMenuItems(grid, filter) {
  grid.innerHTML = '';
  const filtered = filter === 'all' ? allMenuItems : allMenuItems.filter(i => i.kategorie === filter);

  if (!filtered.length) {
    grid.innerHTML = `<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;">${t('menu.noEntries')}</p>`;
    return;
  }

  if (filter === 'all') {
    const categories = [...new Set(filtered.map(i => i.kategorie))];
    categories.forEach(cat => {
      const catItems = filtered.filter(i => i.kategorie === cat);
      const section = document.createElement('div');
      section.className = 'menu-category-section';

      const title = document.createElement('h3');
      title.className = 'menu-category-title';
      title.textContent = cat;
      section.appendChild(title);

      const row = document.createElement('div');
      row.className = 'menu-items-row';
      catItems.forEach(item => row.appendChild(createMenuCard(item)));
      section.appendChild(row);

      grid.appendChild(section);
    });
  } else {
    filtered.forEach(item => grid.appendChild(createMenuCard(item)));
  }
}

function createMenuCard(item) {
  const card = document.createElement('article');
  card.className = 'menu-card';
  const priceText = formatPrice(item.preis);
  card.setAttribute('aria-label', `${item.gericht}${priceText ? ' – ' + priceText : ''}`);

  const imgPart = item.bildUrl
    ? `<img class="menu-card-img" src="${esc(item.bildUrl)}" alt="${esc(item.gericht)}" loading="lazy" />`
    : `<div class="menu-card-img-placeholder" aria-hidden="true">${catEmoji(item.kategorie)}</div>`;

  card.innerHTML = `
    ${imgPart}
    <div class="menu-card-body">
      <h4 class="menu-card-name">${esc(item.gericht)}</h4>
      <p class="menu-card-price">${priceText}</p>
    </div>`;

  return card;
}

/* =============================================
   RENDER: OPENING HOURS TABLE
   ============================================= */

function renderHoursTable(hours) {
  const tbody = document.getElementById('hoursTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const today = new Date().getDay();
  const dayOrder = [1, 2, 3, 4, 5, 6, 0]; // Mon … Sun

  dayOrder.forEach(dayIdx => {
    const slots = hours[dayIdx];
    const tr = document.createElement('tr');
    tr.className = 'hours-row';
    if (dayIdx === today) tr.classList.add('today');

    const uhr = t('hours.uhr');
    const timeText = (slots && slots.length)
      ? slots.map(([o, c]) => `${fmtTime(o)} – ${fmtTime(c)}${uhr ? ' ' + uhr : ''}`).join(' / ')
      : t('hours.closed');

    tr.innerHTML = `
      <td class="hours-day">${t('day.' + dayIdx)}</td>
      <td class="hours-time">${timeText}</td>`;
    tbody.appendChild(tr);
  });
}

/* =============================================
   RENDER: OPEN / CLOSED STATUS
   ============================================= */

function renderHoursStatus(hours) {
  const statusEl = document.getElementById('hoursStatus');
  const todayEl = document.getElementById('todayHours');
  const badgeEl = document.getElementById('statusBadge');

  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours() + now.getMinutes() / 60;

  // For times past midnight (e.g. 2 AM), check if previous day's late-night slot covers now
  const adjustedHour = hour < 6 ? hour + 24 : hour;

  // Check current day slots
  let slots = hours[day] || [];
  let currentSlot = slots.find(([o, c]) => adjustedHour >= o && adjustedHour < c);

  // If not found and hour < 6, check previous day's slots (for cross-midnight)
  if (!currentSlot && hour < 6) {
    const prevDay = (day + 6) % 7;
    const prevSlots = hours[prevDay] || [];
    currentSlot = prevSlots.find(([o, c]) => c > 24 && (hour + 24) >= o && (hour + 24) < c);
    if (!currentSlot) {
      // Also check with the adjusted hour against the previous day
      currentSlot = prevSlots.find(([o, c]) => c > 24 && hour < (c - 24));
    }
  }

  const isOpen = !!currentSlot;
  const uhr = t('hours.uhr');

  // Hero badge
  if (badgeEl) {
    badgeEl.className = `status-badge ${isOpen ? 'open' : 'closed'}`;
    if (isOpen) {
      badgeEl.textContent = `${t('status.open')} · ${t('hours.openNow')} ${fmtTime(currentSlot[1])}${uhr ? ' ' + uhr : ''}`;
    } else {
      badgeEl.textContent = t('status.closed');
    }
  }

  // Hours section status
  if (statusEl) {
    statusEl.className = `hours-status ${isOpen ? 'open' : 'closed'}`;
    if (isOpen) {
      statusEl.textContent = `✅ ${t('hours.openNow')} ${fmtTime(currentSlot[1])}${uhr ? ' ' + uhr : ''}`;
    } else {
      const nextSlot = slots.find(([o]) => adjustedHour < o);
      if (nextSlot) {
        statusEl.textContent = `❌ ${t('hours.closedNow')} ${fmtTime(nextSlot[0])}${uhr ? ' ' + uhr : ''}`;
      } else {
        statusEl.textContent = `❌ ${t('hours.closedGeneral')}`;
      }
    }
  }

  // Contact section today hours
  if (todayEl) {
    const todaySlots = hours[day] || [];
    const slotsText = todaySlots.length
      ? todaySlots.map(([o, c]) => `${fmtTime(o)} – ${fmtTime(c)}${uhr ? ' ' + uhr : ''}`).join(', ')
      : t('hours.closed');
    todayEl.textContent = `${slotsText} – ${isOpen ? t('hours.todayOpen') : t('hours.todayClosed')}`;
    todayEl.style.color = isOpen ? '#4ecdc4' : 'var(--primary)';
  }
}



/* =============================================
   THEME
   ============================================= */

function initTheme() {
  const saved = localStorage.getItem('theme');
  setTheme(saved || 'dark');

  const btn = document.getElementById('themeToggle');
  if (btn) {
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      setTheme(current === 'dark' ? 'light' : 'dark');
    });
  }
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  updateThemeBtn();
}

function updateThemeBtn() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

/* =============================================
   LANGUAGE (i18n)
   ============================================= */

function initLang() {
  lang = localStorage.getItem('lang') || 'de';
  applyLang(true);

  const btn = document.getElementById('langToggle');
  if (btn) {
    btn.addEventListener('click', () => {
      lang = lang === 'de' ? 'en' : 'de';
      localStorage.setItem('lang', lang);
      document.documentElement.lang = lang;
      applyLang(false);
    });
  }
}

function applyLang(isInit) {
  document.documentElement.lang = lang;

  // Update all data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
  });

  // Toggle button label
  const btn = document.getElementById('langToggle');
  if (btn) btn.textContent = lang === 'de' ? 'EN' : 'DE';

  updateThemeBtn();

  if (!isInit) {
    // Re-render dynamic content for the new language
    applyCompanyInfo();
    if (hoursData) {
      renderHoursTable(hoursData);
      renderHoursStatus(hoursData);
    }
  }
}

/* =============================================
   NAVBAR
   ============================================= */

function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* =============================================
   MOBILE NAV
   ============================================= */

function initMobileNav() {
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    toggle.classList.toggle('open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && links.classList.contains('open')) {
      links.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      toggle.focus();
    }
  });
}

/* =============================================
   MODALS
   ============================================= */

function initModals() {
  const triggers = {
    openImpressum: 'impressumModal',
    openDatenschutz: 'datenschutzModal',
  };

  Object.entries(triggers).forEach(([btnId, modalId]) => {
    const btn = document.getElementById(btnId);
    const modal = document.getElementById(modalId);
    if (!btn || !modal) return;
    btn.addEventListener('click', () => openModal(modal));
  });

  document.querySelectorAll('[data-close]').forEach(el => {
    el.addEventListener('click', () => {
      const modal = document.getElementById(el.getAttribute('data-close'));
      if (modal) closeModal(modal);
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal:not([hidden])').forEach(m => closeModal(m));
    }
  });
}

function openModal(modal) {
  modal.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';
  const focusable = modal.querySelector('button, a, input');
  if (focusable) focusable.focus();
}

function closeModal(modal) {
  modal.setAttribute('hidden', '');
  document.body.style.overflow = '';
}

/* =============================================
   PARTICLES
   ============================================= */

function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;

  const ITEMS = ['✨', '⭐', '🌟', '💫', '🔮', '🎯'];
  const COUNT = 10;

  for (let i = 0; i < COUNT; i++) {
    const el = document.createElement('span');
    el.className = 'particle';
    el.textContent = ITEMS[i % ITEMS.length];
    el.style.cssText = `
      left: ${Math.random() * 100}%;
      font-size: ${1 + Math.random() * 2}rem;
      animation-duration: ${8 + Math.random() * 12}s;
      animation-delay: ${Math.random() * 10}s;
      opacity: 0.15;
    `;
    container.appendChild(el);
  }
}

/* =============================================
   EASTER EGG
   ============================================= */

function initEasterEgg() {
  const el = document.getElementById('footerCopyright');
  if (!el) return;

  const houseNum = company.houseNumber;

  const handler = () => {
    const pwd = window.prompt('🔑 Passwort / Password:');
    if (pwd === null) return; // cancelled
    if (houseNum && pwd.trim() === houseNum.trim()) {
      window.open(SHEET_URL, '_blank', 'noopener,noreferrer');
    }
  };

  el.addEventListener('click', handler);
  el.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
  });
}

/* =============================================
   AUTO-REFRESH STATUS
   ============================================= */

function startStatusRefresh() {
  // Refresh open/closed status every 60 seconds
  setInterval(() => {
    if (hoursData) renderHoursStatus(hoursData);
  }, 60000);
}

/* =============================================
   INIT
   ============================================= */

document.addEventListener('DOMContentLoaded', async () => {
  // Synchronous inits
  initTheme();
  initLang();
  initNavbar();
  initMobileNav();
  initModals();
  initParticles();

  // Footer year
  const yearEl = document.getElementById('footerYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Show loading state on hero badge
  const badge = document.getElementById('statusBadge');
  if (badge) {
    badge.className = 'status-badge loading';
    badge.textContent = t('status.loading');
  }

  // Load company info first (needed by other renderers), then everything else in parallel
  await loadCompanyInfo();
  applyCompanyInfo();

  await Promise.allSettled([
    loadPrices(),
    loadHours(),
    loadNews(),
  ]);

  // If hours didn't load, update hero badge
  if (!hoursData && badge) {
    badge.className = 'status-badge closed';
    badge.textContent = t('status.closed');
  }

  // Easter egg (needs company.houseNumber)
  initEasterEgg();

  // Auto-refresh status
  startStatusRefresh();
});

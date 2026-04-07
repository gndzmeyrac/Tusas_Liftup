'use strict';

/**
 * Gerçek eğitim bağlantılarını dış kaynaklardan toplar ve
 * src/data/input/etkinlik_listesi.json dosyasını tamamen yeniden üretir.
 *
 * Kaynaklar:
 * - ODTÜ SEM
 * - Boğaziçi Enstitüsü
 * - BTK Akademi
 * - HEMBA
 * - Global Enstitü
 *
 * Çalıştır: node scripts/sync-dis-egitimler.cjs
 */

const fs = require('fs');
const path = require('path');

const fetch = global.fetch;
const root = path.join(__dirname, '..');
const outPath = path.join(root, 'src', 'data', 'input', 'etkinlik_listesi.json');

const UA = { 'User-Agent': 'TusasLiftupCourseSync/1.0 (+internal)' };

const COMP_KEYS = {
  iletisim: 'acik_iletisim_ve_bilgi_paylasimi',
  analitik: 'problem_cozme_ve_analitik_dusunme',
  teknik: 'teknik_uzmanlik_ve_alan_bilgisi',
  yonetsel: 'yonetsel_cesaret_ve_karar_kalitesi',
  isbirligi: 'isbirligi_ve_kapsayici_calisma',
  surec: 'surec_ve_prosedur_disiplini',
  emniyet: 'emniyet_kalite_ve_risk_farkindaligi',
  etik: 'etik_durus_ve_mesleki_cesaret',
  stratejik: 'stratejik_dusunme_ve_vizyon_olusturma',
};

const THEME_BY_COMP = {
  [COMP_KEYS.iletisim]: 'iletisim_gelistirme',
  [COMP_KEYS.analitik]: 'analitik_atolye',
  [COMP_KEYS.teknik]: 'teknik_egitim',
  [COMP_KEYS.yonetsel]: 'yonetsel_gelisim',
  [COMP_KEYS.isbirligi]: 'takim_calismasi',
  [COMP_KEYS.surec]: 'surec_yonetimi',
  [COMP_KEYS.emniyet]: 'is_gucu_guvenligi',
  [COMP_KEYS.etik]: 'etik_farkindalik',
  [COMP_KEYS.stratejik]: 'stratejik_gelisim',
};

const SOURCE_PRIORITY = {
  'ODTÜ SEM': 1,
  'Boğaziçi Enstitüsü': 2,
  'BTK Akademi': 3,
  HEMBA: 4,
  'Global Enstitü': 5,
};

function decodeHtml(text) {
  return String(text || '')
    .replace(/&#8217;|&#039;/g, "'")
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#8211;/g, '-')
    .replace(/&#8212;/g, '-')
    .replace(/&#8230;/g, '...')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalize(text) {
  return decodeHtml(text)
    .replace(/İ/g, 'I')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

function slugifyBtkTitle(title) {
  return normalize(title)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function titleFromHembaPath(p) {
  const slug = p.replace(/^\/egitim-detay\//, '').replace(/-\d+$/, '');
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function classifyCompetencies(title) {
  const t = normalize(title);
  const flat = t.replace(/[^a-z0-9]+/g, '');
  const matches = new Set();
  const has = (...terms) =>
    terms.some((term) => {
      const n = normalize(term);
      const compact = n.replace(/[^a-z0-9]+/g, '');
      return t.includes(n) || flat.includes(compact);
    });

  if (has('a1', 'a2', 'b1', 'b2', 'c1', 'c2', 'ingilizce', 'almanca', 'fransizca', 'ispanyolca', 'arapca', 'litvanca', 'mogolca', 'telugu', 'tacikce', 'dil egitimi', 'dil kursu')) {
    return [];
  }

  if (has('iletisim', 'diksiyon', 'hitabet', 'sunum', 'beden dili', 'etkili konusma', 'musteri iletisimi', 'yazili iletisim', 'ikna')) {
    matches.add(COMP_KEYS.iletisim);
  }

  if (has('problem cozme', 'analitik', 'veri odakli', 'veri bilimi', 'veri analizi', 'istatistik', 'power bi', 'kok neden', 'arastirma ciktisi', 'bibliyometrik')) {
    matches.add(COMP_KEYS.analitik);
  }

  if (has('python', 'programlama', 'yazilim', 'bilisim', 'siber guvenlik', 'aglari', 'network', 'iot', 'mikroelektronik', 'elektrik', 'elektronik', 'teknoloji', 'yapay zeka', 'sql', 'web', 'mobil', 'ccna', 'ccnp', 'bilgi teknolojileri', 'mikroskobu')) {
    matches.add(COMP_KEYS.teknik);
  }

  if (has('liderlik', 'delegasyon', 'geri bildirim', 'karar alma', 'yoneticilik', 'performans yonetimi', 'ekip yonetimi', 'yonetim becerileri', 'yonetim', 'yonetimi')) {
    matches.add(COMP_KEYS.yonetsel);
  }

  if (has('takim', 'isbirligi', 'is birligi', 'catisma', 'kapsayici', 'sosyal beceriler', 'gonullu yonetimi', 'bagliligi')) {
    matches.add(COMP_KEYS.isbirligi);
  }

  if (has('surec', 'standardizasyon', 'iso 9001', 'kalite yonetim sistemi', 'operasyon', 'proses kontrol', 'yalin')) {
    matches.add(COMP_KEYS.surec);
  }

  if (has('is sagligi', 'is guvenligi', 'emniyet', 'afet', 'risk yonetimi', 'safety', 'kalite guvencesi', 'ramak kala')) {
    matches.add(COMP_KEYS.emniyet);
  }

  if (has('etik', 'uyum', 'kvkk', 'gizlilik', 'veri koruma', 'meslek etigi', 'compliance')) {
    matches.add(COMP_KEYS.etik);
  }

  if (has('strateji', 'vizyon', 'inovasyon', 'yenilik', 'degisim yonetimi', 'grand strategy', 'uzun vadeli', 'teknolojik inovasyon')) {
    matches.add(COMP_KEYS.stratejik);
  }

  return [...matches];
}

function makeRow({ title, url, source, date = 'Sürekli açık (platform)', location = 'Online', price = '' }) {
  const cleanTitle = decodeHtml(title);
  const yetkinlikler = classifyCompetencies(cleanTitle);
  if (!cleanTitle || !url || yetkinlikler.length === 0) return null;

  return {
    'Etkinlik Adı': cleanTitle,
    Tema: THEME_BY_COMP[yetkinlikler[0]] || 'genel_gelisim',
    Yetkinlikler: yetkinlikler,
    Tarih: date,
    Lokasyon: location,
    'Ücret (TL)': price,
    Link: url,
    Kaynak: source,
  };
}

function uniqRows(rows) {
  const seen = new Set();
  return rows
    .filter(Boolean)
    .filter((item) => typeof item.Link === 'string' && /^https?:\/\//i.test(item.Link))
    .filter((item) => {
      const key = `${item.Kaynak}::${normalize(item['Etkinlik Adı'])}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => {
      const pa = SOURCE_PRIORITY[a.Kaynak] || 99;
      const pb = SOURCE_PRIORITY[b.Kaynak] || 99;
      if (pa !== pb) return pa - pb;
      return a['Etkinlik Adı'].localeCompare(b['Etkinlik Adı'], 'tr');
    });
}

async function fetchText(url) {
  return (await fetch(url, { headers: UA })).text();
}

async function fetchBtkCourses() {
  const html = await fetchText('https://www.btkakademi.gov.tr/portal/catalog?sf=popular');
  const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!m) return [];
  const j = JSON.parse(m[1]);
  const docs = j?.props?.pageProps?.coursesResponse?.documents || [];

  return docs
    .map((d) =>
      makeRow({
        title: d.title,
        url: `https://www.btkakademi.gov.tr/portal/course/${slugifyBtkTitle(d.title)}-${d.id}`,
        source: 'BTK Akademi',
        price: '0',
      })
    )
    .filter(Boolean);
}

async function fetchHembaCourses() {
  const html = await fetchText('https://www.hemba.gov.tr/egitim-listeleme');
  const re = /\/egitim-detay\/[a-z0-9-]+-\d+/gi;
  const seen = new Set();
  const rows = [];
  let m;
  while ((m = re.exec(html))) {
    const p = m[0];
    if (seen.has(p)) continue;
    seen.add(p);
    rows.push(
      makeRow({
        title: titleFromHembaPath(p),
        url: `https://www.hemba.gov.tr${p}`,
        source: 'HEMBA',
        price: '0',
      })
    );
  }
  return rows.filter(Boolean);
}

function extractAnchorPairs(html, filterFn) {
  return [...html.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]{0,500}?)<\/a>/gi)]
    .map((m) => ({
      href: m[1],
      title: decodeHtml(m[2]),
    }))
    .filter((x) => x.title.length > 8)
    .filter(filterFn);
}

async function fetchBoenstituCourses() {
  const pages = [
    'https://boenstitu.com/sertifika-programlari',
    'https://boenstitu.com/sertifika-programlari?sayfa=2',
  ];
  const rows = [];

  for (const page of pages) {
    const html = await fetchText(page);
    const pairs = extractAnchorPairs(
      html,
      (x) => {
        const n = normalize(x.title);
        return (
          /^online-egitimler\//i.test(x.href) &&
          /(egitimi|kursu|sertifika programi)/i.test(n) &&
          !/(sertifika sorgula|ornek sertifikalar|sertifika programlari|kurumsal)/i.test(n)
        );
      }
    );

    for (const pair of pairs) {
      rows.push(
        makeRow({
          title: pair.title,
          url: `https://boenstitu.com/${pair.href.replace(/^\//, '')}`,
          source: 'Boğaziçi Enstitüsü',
          price: 'Değişken',
        })
      );
    }
  }

  return rows.filter(Boolean);
}

async function fetchOdtuSemCourses() {
  const html = await fetchText('https://sem.metu.edu.tr/odtusem');
  const pairs = extractAnchorPairs(
    html,
    (x) => {
      const n = normalize(x.title);
      return (
        /(^|\/)(egitim|sinif)\//i.test(x.href) &&
        /(egitimi|programi|kursu|modul)/i.test(n) &&
        !/(sertifika sorgulama|egitim onerileriniz|kurumsal egitim talepleri)/i.test(n)
      );
    }
  );

  return pairs
    .map((pair) =>
      makeRow({
        title: pair.title,
        url: pair.href.startsWith('http') ? pair.href : `https://sem.metu.edu.tr/${pair.href.replace(/^\//, '')}`,
        source: 'ODTÜ SEM',
        price: 'Değişken',
      })
    )
    .filter(Boolean);
}

async function fetchGlobalCourses() {
  const pages = [
    'https://globalenstitu.com/egitim-kategori/professional-development/education/',
    'https://globalenstitu.com/egitim-kategori/bilisim/programlama/',
  ];

  const rows = [];
  for (const page of pages) {
    const html = await fetchText(page);
    const pairs = extractAnchorPairs(
      html,
      (x) => {
        const n = normalize(x.title);
        return (
          /https:\/\/globalenstitu\.com\/egitim\//i.test(x.href) &&
          /(sertifika|egitimi|kursu|programlama|cozme|iletisim|veri|yonetim|etik|risk|kalite|strateji|inovasyon)/i.test(n)
        );
      }
    );

    for (const pair of pairs) {
      rows.push(
        makeRow({
          title: pair.title,
          url: pair.href,
          source: 'Global Enstitü',
          price: '0',
        })
      );
    }
  }

  return rows.filter(Boolean);
}

(async () => {
  const all = [];

  const providers = [
    ['ODTÜ SEM', fetchOdtuSemCourses],
    ['Boğaziçi Enstitüsü', fetchBoenstituCourses],
    ['BTK Akademi', fetchBtkCourses],
    ['HEMBA', fetchHembaCourses],
    ['Global Enstitü', fetchGlobalCourses],
  ];

  for (const [label, fn] of providers) {
    try {
      const rows = await fn();
      console.log(`${label}:`, rows.length, 'eşleşen eğitim');
      all.push(...rows);
    } catch (err) {
      console.warn(`${label} hata:`, err.message);
    }
  }

  const merged = uniqRows(all);
  fs.writeFileSync(outPath, JSON.stringify(merged, null, 2) + '\n', 'utf8');
  console.log('Yazıldı:', outPath, 'toplam', merged.length, 'satır');
})();

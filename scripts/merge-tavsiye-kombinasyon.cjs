'use strict';
/**
 * tavsiye_kurallari.json: alt_kirilimlar sadeleştirir, kombinasyon_metinleri ekler, _kombinasyon_politikasi yazar.
 * Çalıştır: node scripts/merge-tavsiye-kombinasyon.cjs
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const tpath = path.join(root, 'src/data/lookup/tavsiye_kurallari.json');
const p1 = require('./data/kombo-part-a.json');
const p2 = require('./data/kombo-part-b.json');
const p3 = require('./data/kombo-part-c.json');

const KOMBINED = { ...p1, ...p2, ...p3 };

const POL = {
  weak_threshold: 3,
  zayif_tanimi: 'Soru bazli agirlikli ortalama < weak_threshold ise o alt soru zayif sayilir (Okuma kilavuzu ile uyumlu).',
  anahtar_kurali:
    "alt_kirilimlar anahtarlari alfabetik siralanir. Zayif olan question_id'ler yine alfabetik siralanip '+' ile birlestirilerek kombinasyon_metinleri anahtari olusturulur (ornek: iletisim_q1_dinleme+iletisim_q3_yazili).",
  eksik_skor_politikasi:
    'Uc alt sorunun tamami icin sayisal skor yoksa kombinasyon yolu kullanilmaz; genel_tavsiye doner.',
};

function slimAlt(alt) {
  const o = {};
  for (const [qid, v] of Object.entries(alt || {})) {
    o[qid] = { etiket: v.etiket, davranis_ozeti: v.davranis_ozeti };
  }
  return o;
}

const raw = JSON.parse(fs.readFileSync(tpath, 'utf8'));
const out = { _kombinasyon_politikasi: POL };

for (const k of Object.keys(raw)) {
  if (k.startsWith('_')) continue;
  const block = KOMBINED[k];
  if (!block) {
    throw new Error(`kombo eksik: ${k}`);
  }
  const entry = {
    genel_tavsiye: raw[k].genel_tavsiye,
    alt_kirilimlar: slimAlt(raw[k].alt_kirilimlar),
    kombinasyon_metinleri: block,
  };
  if (raw[k].guclu_yon_tavsiyesi) {
    entry.guclu_yon_tavsiyesi = raw[k].guclu_yon_tavsiyesi;
  }
  out[k] = entry;
}

fs.writeFileSync(tpath, JSON.stringify(out, null, 2), 'utf8');
console.log('tavsiye_kurallari.json guncellendi.');

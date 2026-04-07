import tavsiyeKurallari from '../data/lookup/tavsiye_kurallari.json';
import etkinlikListesi from '../data/input/etkinlik_listesi.json';

/** Okuma kılavuzu ile uyumlu: soru ortalaması bunun altındaysa "zayıf" kabul edilir. */
const WEAK_THRESHOLD = 3.0;

/** Yetkinlik anahtarı → etkinlik listesinde aranacak terimler */
const COMPETENCY_ACTIVITY_TERMS = {
  acik_iletisim_ve_bilgi_paylasimi: ['iletisim'],
  problem_cozme_ve_analitik_dusunme: ['analitik', 'problem'],
  teknik_uzmanlik_ve_alan_bilgisi: ['teknik'],
  yonetsel_cesaret_ve_karar_kalitesi: ['karar', 'takim', 'kritik'],
  isbirligi_ve_kapsayici_calisma: ['takim', 'isbirligi', 'catisma'],
  surec_ve_prosedur_disiplini: ['surec'],
  emniyet_kalite_ve_risk_farkindaligi: ['guvenlik', 'emniyet', 'risk'],
  etik_durus_ve_mesleki_cesaret: ['etik'],
  stratejik_dusunme_ve_vizyon_olusturma: ['analitik', 'sistem', 'stratejik'],
};

const ACTIVITY_SOURCE_SCORES = {
  'ODTÜ SEM': 40,
  'Boğaziçi Enstitüsü': 30,
  'BTK Akademi': 20,
  HEMBA: 15,
  'Global Enstitü': 10,
};

const COMPETENCY_ACTIVITY_SIGNALS = {
  acik_iletisim_ve_bilgi_paylasimi: {
    positive: ['etkili iletisim', 'iletisim teknikleri', 'diksiyon', 'beden dili', 'sunum', 'hitabet', 'yazili iletisim'],
    negative: ['ingilizce', 'almanca', 'fransizca', 'dil kursu'],
  },
  problem_cozme_ve_analitik_dusunme: {
    positive: ['problem cozme', 'analitik', 'kok neden', 'veri analizi', 'veri bilimi', 'istatistik', 'power bi'],
    // Analitik tarafta teknik programlama kurslari (Python vb.) istenmiyor.
    negative: ['bibliyometrik', 'arastirma ciktilari', 'python', 'programlama', 'yazilim', 'sql', 'web', 'mobil'],
  },
  teknik_uzmanlik_ve_alan_bilgisi: {
    positive: ['python', 'programlama', 'yapay zeka', 'siber guvenlik', 'bilgi teknolojileri', 'sql', 'web'],
    negative: [],
  },
  yonetsel_cesaret_ve_karar_kalitesi: {
    positive: ['liderlik', 'karar', 'yonetim', 'geri bildirim', 'ekip yonetimi'],
    negative: ['yasam koclugu', 'ogrenci koclugu'],
  },
  isbirligi_ve_kapsayici_calisma: {
    positive: ['is birligi', 'isbirligi', 'takim', 'catisma', 'sosyal beceriler', 'kapsayici'],
    negative: [],
  },
  surec_ve_prosedur_disiplini: {
    positive: ['surec', 'kalite yonetim sistemi', 'iso', 'proses kontrol', 'operasyon'],
    // "süreç" kelimesi yüzünden alakasız eğitimler eşleşebiliyor (örn. psikolojik destek süreçleri).
    negative: ['psikolojik', 'destek', 'terapi', 'danismanlik', 'sanal gerceklik', 'vr'],
  },
  emniyet_kalite_ve_risk_farkindaligi: {
    positive: ['is guvenligi', 'is sagligi', 'emniyet', 'risk', 'afet'],
    negative: ['siber guvenlik'],
  },
  etik_durus_ve_mesleki_cesaret: {
    positive: ['etik', 'uyum', 'kvkk', 'gizlilik', 'veri koruma'],
    negative: [],
  },
  stratejik_dusunme_ve_vizyon_olusturma: {
    positive: ['strateji', 'vizyon', 'inovasyon', 'degisim yonetimi', 'uzun vadeli'],
    negative: [],
  },
};

function normalizeActivityText(value) {
  return String(value || '')
    .replace(/İ/g, 'I')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function activityMatchesCompetency(compKey, act) {
  if (Array.isArray(act.Yetkinlikler) && act.Yetkinlikler.length > 0) {
    return act.Yetkinlikler.includes(compKey);
  }
  const terms = COMPETENCY_ACTIVITY_TERMS[compKey];
  if (!terms?.length) return false;
  const tema = (act.Tema || '').toLowerCase();
  const ad = (act['Etkinlik Adı'] || '').toLowerCase();
  return terms.some((t) => tema.includes(t) || ad.includes(t));
}

function activityRelevance(compKey, act) {
  const text = normalizeActivityText(`${act['Etkinlik Adı'] || ''} ${act.Tema || ''}`);
  const signals = COMPETENCY_ACTIVITY_SIGNALS[compKey] || { positive: [], negative: [] };

  let score = ACTIVITY_SOURCE_SCORES[act.Kaynak] || 0;

  if (Array.isArray(act.Yetkinlikler) && act.Yetkinlikler.includes(compKey)) {
    score += 100;
  }

  signals.positive.forEach((term, index) => {
    if (text.includes(normalizeActivityText(term))) {
      score += 30 - index;
    }
  });

  signals.negative.forEach((term) => {
    if (text.includes(normalizeActivityText(term))) {
      // Negatif sinyaller güçlü eleme amaçlıdır (yanlış eşleşmeleri bastırmak için).
      score -= 120;
    }
  });

  return score;
}

/**
 * alt_kirilimlar anahtarlarını alfabetik sıralar (canonical sıra).
 * Üç sorunun skoru da sayısal değilse null (kombinasyon yolu kullanılmaz).
 * Hiç zayıf yoksa key null (genel tavsiye).
 */
function resolveWeakCombination(altMap, perQ) {
  const altKeysSorted = Object.keys(altMap).sort();
  if (altKeysSorted.length !== 3) return { incomplete: true };

  for (const qid of altKeysSorted) {
    const v = perQ[qid];
    if (typeof v !== 'number' || Number.isNaN(v)) return { incomplete: true };
  }

  const weak = altKeysSorted.filter((qid) => perQ[qid] < WEAK_THRESHOLD);
  if (weak.length === 0) return { allStrong: true, weak: [] };

  const key = weak.join('+');
  return { allStrong: false, weak, key };
}

/**
 * @param {Object} finalScores - calculators summary
 * @param {Object} questionScoresByCompetency - { [compKey]: { [questionId]: number } }
 */
export const generateDevelopmentPlan = (finalScores, questionScoresByCompetency = {}) => {
  const plan = [];

  Object.entries(finalScores).forEach(([compKey, score]) => {
    const numScore = parseFloat(score);
    const rules = tavsiyeKurallari[compKey];

    if (!rules || compKey.startsWith('_')) return;

    let level = 'strong';
    let label = 'GÜÇLÜ YÖN';
    if (numScore < 3.0) {
      level = 'weak';
      label = 'ÖNCELİKLİ GELİŞİM';
    } else if (numScore < 3.5) {
      level = 'medium';
      label = 'İYİLEŞTİRME FIRSATI';
    }

    const altMap = rules.alt_kirilimlar || {};
    const perQ = questionScoresByCompetency[compKey] || {};
    const comboMap = rules.kombinasyon_metinleri || {};

    let specificTavsiye = rules.genel_tavsiye;
    const eylemMaddeleri = [];
    let odakAlani = null;
    let odakAlanlari = [];

    const resolved = resolveWeakCombination(altMap, perQ);

    const gucluMetin =
      typeof rules.guclu_yon_tavsiyesi === 'string' && rules.guclu_yon_tavsiyesi.trim()
        ? rules.guclu_yon_tavsiyesi.trim()
        : null;

    if (resolved.incomplete) {
      specificTavsiye = rules.genel_tavsiye;
    } else if (resolved.allStrong) {
      specificTavsiye =
        level === 'strong' && gucluMetin ? gucluMetin : rules.genel_tavsiye;
    } else {
      const entry = comboMap[resolved.key];
      if (entry && typeof entry.tavsiye === 'string' && entry.tavsiye.trim()) {
        specificTavsiye = entry.tavsiye.trim();
      } else {
        specificTavsiye = rules.genel_tavsiye;
      }

      odakAlanlari = resolved.weak.map((qid) => altMap[qid]?.etiket).filter(Boolean);
      odakAlani = odakAlanlari.length > 0 ? odakAlanlari.join(' · ') : null;
    }

    const suggestedActivities = etkinlikListesi
      .filter((act) => activityMatchesCompetency(compKey, act))
      .map((act) => ({ act, score: activityRelevance(compKey, act) }))
      // Net uyum icin taban esik (negatif sinyalli / zayif eslesenleri ele)
      .filter((x) => x.score >= 80)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .map((x) => x.act);

    plan.push({
      yetkinlik: compKey,
      skor: numScore,
      seviye: level,
      etiket: label,
      tavsiye: specificTavsiye,
      odakAlani,
      odakAlanlari,
      eylemMaddeleri,
      egitimler: suggestedActivities.map((act) => ({
        ad: act['Etkinlik Adı'],
        lokasyon: act.Lokasyon,
        tarih: act.Tarih,
        link: act.Link,
        kaynak: act.Kaynak || null,
      })),
    });
  });

  return plan;
};

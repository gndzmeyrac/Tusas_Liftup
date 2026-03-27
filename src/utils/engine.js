import tavsiyeKurallari from '../data/lookup/tavsiye_kurallari.json';
import etkinlikListesi from '../data/input/etkinlik_listesi.json';

/**
 * Puanlara göre gelişim planı ve eğitim önerileri üretir.
 * @param {Object} finalScores - calculators.js'den gelen özet puanlar
 * @param {Object} subScores - (Opsiyonel) Soru bazlı detay puanlar
 */
export const generateDevelopmentPlan = (finalScores, subScores = {}) => {
  const plan = [];

  // Her bir yetkinlik için kuralları işlet
  Object.entries(finalScores).forEach(([compKey, score]) => {
    const numScore = parseFloat(score);
    const rules = tavsiyeKurallari[compKey];

    if (!rules) return; // JSON'da tanımlı olmayan yetkinliği geç

    // 1. Seviye Belirle
    let level = 'strong';
    let label = 'GÜÇLÜ YÖN';
    if (numScore < 3.0) {
      level = 'weak';
      label = 'ÖNCELİKLİ GELİŞİM';
    } else if (numScore < 3.5) {
      level = 'medium';
      label = 'İYİLEŞTİRME FIRSATI';
    }

    // 2. Detaylı Odak Alanı Bul (Python'daki TavsiyeMotoru mantığı)
    // Eğer alt kırılımlar (soru puanları) varsa, o yetkinliğin en düşük sorusunu bulur
    let focusArea = "Genel Bakış";
    let specificTavsiye = rules.genel_tavsiye;

    if (rules.alt_kirilimlar && subScores) {
      const relatedSubScores = Object.entries(subScores).filter(([id]) => id.startsWith(compKey.split('_')[0]));
      
      if (relatedSubScores.length > 0) {
        // En düşük puanlı soruyu bul
        const worstSub = relatedSubScores.sort((a, b) => a[1] - b[1])[0];
        const subRule = rules.alt_kirilimlar[worstSub[0]];
        
        if (subRule) {
          focusArea = `Odak Alanı: ${subRule.etiket}`;
          specificTavsiye = subRule.tavsiye;
        }
      }
    }

    // 3. Eğitim Eşleştirme (EtkinlikKaziyici mantığı)
    // Yetkinlik isminin ilk kelimesine göre (Örn: "iletisim") eğitim listesini filtreler
    const keyword = compKey.split('_')[0].toLowerCase();
    const suggestedActivities = etkinlikListesi.filter(act => 
      act.Tema.toLowerCase().includes(keyword) || 
      act["Etkinlik Adı"].toLowerCase().includes(keyword)
    ).slice(0, 2); // En alakalı 2 eğitimi al

    plan.push({
      yetkinlik: compKey,
      skor: numScore,
      seviye: level,
      etiket: label,
      tavsiye: specificTavsiye,
      odakAlani: focusArea,
      egitimler: suggestedActivities.map(act => ({
        ad: act["Etkinlik Adı"],
        lokasyon: act.Lokasyon,
        link: act.Link || "#"
      }))
    });
  });

  return plan;
};
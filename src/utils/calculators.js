import agirlikKurallari from '../data/lookup/agirlik_kurallari.json';
import yetkinlikler from '../data/lookup/yetkinlikler.json';

/**
 * @param {Array} allData - JSON'a çevrilmiş ham CSV verisi (faz0_sentetik_veri.json)
 * @param {String} employeeName - Seçilen çalışanın adı
 */
export const calculateScores = (allData, employeeName) => {
  // 1. Çalışan verilerini filtrele
  const userRows = allData.filter(row => row.employee_name === employeeName);
  if (userRows.length === 0) return null;

  // 2. Yaka Tipini Belirle (Python'daki mantık: unvanda mühendis geçiyorsa beyaz yaka)
  const role = userRows[0].role.toLowerCase().includes('mühendis') || 
               userRows[0].role.toLowerCase().includes('uzman') ? 'beyaz_yaka' : 'mavi_yaka';
  
  // agirlik_kurallari.json'dan ilgili yakanın ağırlıklarını al
  const weights = agirlikKurallari[role].default_weights;

  // 3. yetkinlikler.json dosyasındaki anahtarları baz alarak gruplandırma yap
  // Bu sayede CSV'deki veriler yetkinlikler.json'daki kategorilere tam oturur
  const finalScores = {};
  const heatmapData = [];

  Object.keys(yetkinlikler).forEach(compKey => {
    // CSV'deki 'competency' sütunu ile yetkinlikler.json'daki anahtarı eşleştir
    const compRows = userRows.filter(row => row.competency === compKey);
    
    if (compRows.length > 0) {
      // Değerlendirici gruplarına göre puanları topla (yonetici1, ekip, ast vb.)
      const groupAverages = compRows.reduce((acc, r) => {
        if (!acc[r.evaluator_group]) acc[r.evaluator_group] = { sum: 0, count: 0 };
        acc[r.evaluator_group].sum += parseFloat(r.score);
        acc[r.evaluator_group].count++;
        return acc;
      }, {});

      let weightedSum = 0;
      let totalWeightUsed = 0;

      // agirlik_kurallari.json'daki oranları uygula
      Object.keys(groupAverages).forEach(group => {
        const avg = groupAverages[group].sum / groupAverages[group].count;
        const weight = weights[group] || 0;
        
        weightedSum += avg * weight;
        totalWeightUsed += weight;

        // Isı haritası (Heatmap) için veriyi buraya ekliyoruz
        heatmapData.push({ 
          competency: compKey, 
          group: group, 
          score: avg.toFixed(1) 
        });
      });

      // Ağırlıklı ortalamayı hesapla (Toplam ağırlığa bölerek normalize et)
      finalScores[compKey] = totalWeightUsed > 0 ? (weightedSum / totalWeightUsed).toFixed(2) : 0;
    }
  });

  return { 
    summary: finalScores, // Radar grafiği için
    heatmap: heatmapData, // Isı haritası tablosu için
    details: {
      name: userRows[0].employee_name,
      role: userRows[0].role,
      id: userRows[0].employee_id,
      yaka: role
    }
  };
};
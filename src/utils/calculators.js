import agirlikKurallari from '../data/lookup/agirlik_kurallari.json';
import yetkinlikler from '../data/lookup/yetkinlikler.json';

const SELF_GROUP = 'oz_degerlendirme';

/**
 * Aynı satır kümesi için değerlendirici grubu ortalamalarını ağırlıklandırır (yetkinlik veya tek soru satırları).
 */
function weightedGroupAverage(rows, weights) {
  if (!rows.length) return null;
  const groupAverages = rows.reduce((acc, r) => {
    const g = r.evaluator_group;
    if (!acc[g]) acc[g] = { sum: 0, count: 0 };
    acc[g].sum += parseFloat(r.score);
    acc[g].count++;
    return acc;
  }, {});

  let weightedSum = 0;
  let totalWeightUsed = 0;

  Object.keys(groupAverages).forEach((group) => {
    const avg = groupAverages[group].sum / groupAverages[group].count;
    const weight = weights[group] || 0;
    weightedSum += avg * weight;
    totalWeightUsed += weight;
  });

  return totalWeightUsed > 0 ? weightedSum / totalWeightUsed : null;
}

/**
 * @param {Array} allData - JSON'a çevrilmiş ham CSV verisi (faz0_sentetik_veri.json)
 * @param {String} employeeName - Seçilen çalışanın adı
 */
export const calculateScores = (allData, employeeName) => {
  const userRows = allData.filter((row) => row.employee_name === employeeName);
  if (userRows.length === 0) return null;

  const feedbackRows = userRows.filter((row) => row.evaluator_group !== SELF_GROUP);
  const selfRows = userRows.filter((row) => row.evaluator_group === SELF_GROUP);

  const role =
    userRows[0].role.toLowerCase().includes('mühendis') ||
    userRows[0].role.toLowerCase().includes('uzman')
      ? 'beyaz_yaka'
      : 'mavi_yaka';

  const weights = agirlikKurallari[role].default_weights;

  const finalScores = {};
  const selfScores = {};
  const heatmapData = [];
  const questionScores = {};

  Object.keys(yetkinlikler).forEach((compKey) => {
    const compRows = feedbackRows.filter((row) => row.competency === compKey);
    const selfCompRows = selfRows.filter((row) => row.competency === compKey);

    if (compRows.length > 0) {
      const compAvg = weightedGroupAverage(compRows, weights);
      finalScores[compKey] = compAvg != null ? compAvg.toFixed(2) : 0;

      const groupAverages = compRows.reduce((acc, r) => {
        if (!acc[r.evaluator_group]) acc[r.evaluator_group] = { sum: 0, count: 0 };
        acc[r.evaluator_group].sum += parseFloat(r.score);
        acc[r.evaluator_group].count++;
        return acc;
      }, {});

      Object.keys(groupAverages).forEach((group) => {
        const avg = groupAverages[group].sum / groupAverages[group].count;
        heatmapData.push({
          competency: compKey,
          group,
          score: avg.toFixed(1),
        });
      });

      const qIds = [...new Set(compRows.map((r) => r.question_id))];
      questionScores[compKey] = {};
      qIds.forEach((qid) => {
        const qRows = compRows.filter((r) => r.question_id === qid);
        const qAvg = weightedGroupAverage(qRows, weights);
        if (qAvg != null) questionScores[compKey][qid] = qAvg;
      });
    }

    if (selfCompRows.length > 0) {
      const selfAvg =
        selfCompRows.reduce((sum, row) => sum + parseFloat(row.score), 0) / selfCompRows.length;
      selfScores[compKey] = selfAvg.toFixed(2);
    }
  });

  const selfScoreValues = Object.values(selfScores).map(Number).filter((n) => Number.isFinite(n));
  const selfAverage =
    selfScoreValues.length > 0
      ? (selfScoreValues.reduce((a, b) => a + b, 0) / selfScoreValues.length).toFixed(2)
      : null;

  return {
    summary: finalScores,
    selfSummary: selfScores,
    selfAverage,
    heatmap: heatmapData,
    questionScores,
    details: {
      name: userRows[0].employee_name,
      role: userRows[0].role,
      id: userRows[0].employee_id,
      yaka: role,
    },
  };
};

/**
 * Tüm çalışanlar için calculateScores ile aynı yöntemle üretilmiş özetlerden
 * yetkinlik bazlı şirket kıyasını ve genel ortalamayı hesaplar.
 *
 * @param {Array} allData - faz0_sentetik_veri.json satırları
 * @returns {{ byCompetency: Record<string, number>, overallAverage: number, employeeCount: number }}
 */
export const calculateCompanyBenchmarks = (allData) => {
  const names = [...new Set(allData.map((d) => d.employee_name))];
  const compKeys = Object.keys(yetkinlikler);

  const perCompSum = Object.fromEntries(compKeys.map((k) => [k, 0]));
  const perCompCnt = Object.fromEntries(compKeys.map((k) => [k, 0]));
  const employeeOverallMeans = [];

  for (const name of names) {
    const res = calculateScores(allData, name);
    if (!res) continue;

    const vals = Object.values(res.summary)
      .map(Number)
      .filter((n) => Number.isFinite(n));
    if (vals.length > 0) {
      employeeOverallMeans.push(vals.reduce((a, b) => a + b, 0) / vals.length);
    }

    for (const k of compKeys) {
      const s = res.summary[k];
      if (s !== undefined && s !== null && s !== '') {
        const n = parseFloat(s);
        if (Number.isFinite(n)) {
          perCompSum[k] += n;
          perCompCnt[k] += 1;
        }
      }
    }
  }

  const byCompetency = {};
  for (const k of compKeys) {
    if (perCompCnt[k] > 0) {
      byCompetency[k] = perCompSum[k] / perCompCnt[k];
    }
  }

  const overallAverage =
    employeeOverallMeans.length > 0
      ? employeeOverallMeans.reduce((a, b) => a + b, 0) / employeeOverallMeans.length
      : null;

  return {
    byCompetency,
    overallAverage: overallAverage != null ? overallAverage : 3.6,
    employeeCount: names.length,
  };
};

/**
 * faz0_sentetik_veri.json: her çalışan × yetkinlik için 3 alt sorunun tamamı
 * ve mevcut değerlendirici grupları için eksik satırları üretir.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dataPath = path.join(root, 'src', 'data', 'input', 'faz0_sentetik_veri.json');
const tavsiyePath = path.join(root, 'src', 'data', 'lookup', 'tavsiye_kurallari.json');

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const tavsiye = JSON.parse(fs.readFileSync(tavsiyePath, 'utf8'));

const compKeys = Object.keys(tavsiye).filter((k) => !k.startsWith('_'));

function altQids(compKey) {
  return Object.keys(tavsiye[compKey].alt_kirilimlar || {}).sort();
}

const SELF_GROUP = 'oz_degerlendirme';
const GROUP_ORDER = [SELF_GROUP, 'yonetici1', 'yonetici2', 'ekip', 'ortak', 'ast'];
function sortGroups(groups) {
  return [...new Set(groups)].sort(
    (a, b) => GROUP_ORDER.indexOf(a) - GROUP_ORDER.indexOf(b)
  );
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function scoreDelta(emp, qid, group) {
  let h = 0;
  const s = `${emp}|${qid}|${group}`;
  for (let i = 0; i < s.length; i++) h = (h + s.charCodeAt(i) * (i + 1)) % 7;
  return (h % 3) - 1;
}

function averageScore(rows) {
  const nums = rows
    .map((r) => Number(r.score))
    .filter((n) => Number.isFinite(n));
  if (nums.length === 0) return null;
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}

const byName = new Map();
for (const row of data) {
  if (!byName.has(row.employee_name)) byName.set(row.employee_name, []);
  byName.get(row.employee_name).push(row);
}

const additions = [];

for (const [name, rows] of byName) {
  const existingGroups = sortGroups(rows.map((r) => r.evaluator_group).filter((g) => g !== SELF_GROUP));
  if (existingGroups.length === 0) continue;
  const groups = sortGroups([SELF_GROUP, ...existingGroups]);

  const meta = rows[0];

  for (const compKey of compKeys) {
    const needQ = altQids(compKey);
    const sub = rows.filter((r) => r.competency === compKey);
    const feedbackSub = sub.filter((r) => r.evaluator_group !== SELF_GROUP);
    const compAvg = averageScore(feedbackSub);

    for (const qid of needQ) {
      for (const g of groups) {
        const exists = sub.some((r) => r.question_id === qid && r.evaluator_group === g);
        if (exists) continue;

        let evaluatorName = name;
        let sc = 3;

        if (g === SELF_GROUP) {
          const sameQuestion = feedbackSub.filter((r) => r.question_id === qid);
          const base =
            averageScore(sameQuestion) ??
            compAvg ??
            averageScore(rows.filter((r) => r.evaluator_group !== SELF_GROUP)) ??
            3;
          const shifted = Math.round(base + scoreDelta(name, `${compKey}|${qid}`, g));
          sc = clamp(shifted, 2, 5);
          evaluatorName = name;
        } else {
          const ref =
            sub.find((r) => r.question_id === qid && r.evaluator_group === g) ||
            sub.find((r) => r.evaluator_group === g) ||
            rows.find((r) => r.evaluator_group === g);
          if (!ref) {
            console.warn(`No ref for ${name} ${compKey} group ${g}, skip`);
            continue;
          }
          const base = parseInt(ref.score, 10);
          const n = Number.isFinite(base) ? base : 3;
          sc = clamp(n + scoreDelta(name, qid, g), 2, 5);
          evaluatorName = ref.evaluator_name;
        }

        additions.push({
          employee_id: meta.employee_id,
          employee_name: name,
          role: meta.role,
          evaluator_name: evaluatorName,
          evaluator_group: g,
          competency: compKey,
          question_id: qid,
          score: String(sc),
        });
      }
    }
  }
}

const merged = data.concat(additions);

function sortKey(r) {
  const ci = compKeys.indexOf(r.competency);
  const qids = altQids(r.competency);
  const qi = qids.indexOf(r.question_id);
  const gi = GROUP_ORDER.indexOf(r.evaluator_group);
  return [r.employee_name, ci, qi, gi].join('\0');
}

merged.sort((a, b) => sortKey(a).localeCompare(sortKey(b)));

fs.writeFileSync(dataPath, JSON.stringify(merged, null, 2) + '\n', 'utf8');

console.log('Eklendi:', additions.length, 'satır');
console.log('Toplam:', merged.length);

for (const name of [...byName.keys()].sort()) {
  const n = merged.filter((r) => r.employee_name === name).length;
  const g = sortGroups(merged.filter((r) => r.employee_name === name).map((r) => r.evaluator_group));
  const expected = 9 * 3 * g.length;
  if (n !== expected) console.warn('Satır sayısı beklenenden farklı:', name, n, 'beklenen', expected, 'gruplar', g.join(','));
}

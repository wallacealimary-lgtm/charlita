// Answer checking (spec §6). Spelling is never penalised.
export function norm(s) {
  return (s || '').toLowerCase().normalize('NFC')
    .replace(/[¿?¡!.,;:"“”«»()\[\]…]/g, ' ').replace(/[’']/g, "'")
    .replace(/\s+/g, ' ').trim();
}
export function strip(s) {
  return norm(s).normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC');
}
export function dist(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j), cur = new Array(n + 1);
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      // transposition
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) cur[j] = Math.min(cur[j], prev[j - 1]);
    }
    [prev, cur] = [cur, prev];
  }
  return prev[n];
}
export const tolerance = len => (len <= 5 ? 1 : 2);

/**
 * check(answer, targets, altForms)
 *  targets: array of accepted strings (first = canonical)
 *  altForms: [{form, label}] other valid forms of the same verb (different person/tense)
 * returns {grade:'ok'|'casi'|'no'|'empty', shown, note, alt}
 */
export function check(answer, targets, altForms = []) {
  const a = norm(answer);
  const canon = targets[0];
  if (!a) return { grade: 'empty', shown: canon };
  const T = targets.map(norm);
  // 2. exact
  const ei = T.indexOf(a);
  if (ei >= 0) return { grade: 'ok', shown: targets[ei], exact: true };
  const sa = strip(a);
  const ST = T.map(t => strip(t));
  const altsExact = altForms.filter(x => norm(x.form) === a && !T.includes(norm(x.form)));
  // 3. match ignoring accents
  const si = ST.indexOf(sa);
  if (si >= 0) {
    if (altsExact.length) return { grade: 'casi', shown: targets[si], alt: altsExact[0], note: 'accent' };
    return { grade: 'ok', shown: targets[si], corrected: true };
  }
  // another valid form of the same verb (by letters)
  const altLoose = altForms.find(x => strip(x.form) === sa && !ST.includes(strip(x.form)));
  if (altLoose) return { grade: 'casi', shown: canon, alt: altLoose };
  // 4. edit distance
  for (let i = 0; i < ST.length; i++) {
    if (dist(sa, ST[i]) <= tolerance(ST[i].length)) return { grade: 'ok', shown: targets[i], corrected: true };
  }
  // typo of another form of the same verb -> casi (teaching moment)
  const altTypo = altForms.find(x => { const f = strip(x.form); return f.length > 3 && dist(sa, f) <= 1 && !ST.includes(f); });
  if (altTypo) return { grade: 'casi', shown: canon, alt: altTypo };
  return { grade: 'no', shown: canon };
}

// English answers (translation targets). Accept any sense; ignore "to", articles, brackets.
const EN_STOP = /^(to|a|an|the)\s+/;
export function enVariants(en) {
  const out = new Set();
  const base = en.replace(/\(([^)]*)\)/g, ' ');
  base.split(/[\/;,]| or /).forEach(p => {
    let x = norm(p); if (!x) return;
    out.add(x); out.add(x.replace(EN_STOP, ''));
    out.add(x.replace(/\bsomeone\b|\bsomething\b|\bone's\b|\boneself\b/g, '').replace(/\s+/g, ' ').trim());
  });
  norm(en.replace(/[()]/g, ' ')).split(' ');
  return [...out].filter(Boolean);
}
export function checkEnglish(answer, variants) {
  let a = norm(answer).replace(EN_STOP, '').replace(/^(i'm|i am|it's|it is)\s+/, '');
  if (!a) return { grade: 'empty' };
  const V = variants.map(v => norm(v).replace(EN_STOP, ''));
  if (V.includes(a)) return { grade: 'ok' };
  for (const v of V) if (dist(a, v) <= tolerance(v.length)) return { grade: 'ok', corrected: true, shown: v };
  // word-overlap for multi-word senses
  for (const v of V) {
    const w = v.split(' ').filter(x => x.length > 2);
    if (w.length >= 2) {
      const hit = w.filter(x => a.split(' ').some(y => dist(x, y) <= 1)).length;
      if (hit / w.length >= 0.75) return { grade: 'ok', corrected: true, shown: v };
    }
  }
  return { grade: 'no' };
}

// Free translation (sentences): content-word overlap, spelling tolerant.
const FUNC = new Set('the a an to of and i you he she it we they is are was were be been am do does did have has had will would in on at for with my your his her our their that this me him us them not no so if as by or but'.split(' '));
export function overlap(answer, reference) {
  const words = s => norm(s).replace(/[^a-z' ]/g, ' ').split(/\s+/).filter(w => w && !FUNC.has(w));
  const R = words(reference), A = words(answer);
  if (!R.length) return 0;
  const hit = R.filter(r => A.some(x => dist(x, r) <= (r.length > 5 ? 2 : 1))).length;
  return hit / R.length;
}

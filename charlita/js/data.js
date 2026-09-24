// Static datasets + derived helpers (verbs, English meanings, tense cards).
export const D = { verbs: [], V: {}, tenses: [], persons: [], words: [], W: {}, det: [], formIndex: null };

export const PERSON_LABEL = ['yo', 'tú', 'él / ella / usted', 'nosotros', 'vosotros', 'ellos / ustedes'];
export const PERSON_SHORT = ['yo', 'tú', 'él', 'nosotros', 'vosotros', 'ellos'];
export const TENSE_ORDER = ['ind_presente', 'ind_perfecto', 'ind_indefinido', 'ind_imperfecto', 'ind_futuro', 'ind_condicional',
  'sub_presente', 'imp_afirmativo', 'ind_pluscuam', 'ind_condicional_comp', 'ind_futuro_comp', 'sub_imperfecto', 'sub_perfecto', 'imp_negativo', 'sub_pluscuam'];
export const TENSE_SHORT = {
  ind_presente: 'Presente', ind_perfecto: 'Perfecto', ind_indefinido: 'Indefinido', ind_imperfecto: 'Imperfecto',
  ind_pluscuam: 'Pluscuamperfecto', ind_futuro: 'Futuro', ind_futuro_comp: 'Futuro compuesto', ind_condicional: 'Condicional',
  ind_condicional_comp: 'Condicional compuesto', sub_presente: 'Subj. presente', sub_perfecto: 'Subj. perfecto',
  sub_imperfecto: 'Subj. imperfecto', sub_pluscuam: 'Subj. pluscuamperfecto', imp_afirmativo: 'Imperativo', imp_negativo: 'Imperativo negativo',
};
export const tenseLabel = id => (D.tenses.find(t => t.id === id) || {}).label || id;

// English anchor cards — the one place English explanations are allowed (tense detective).
export const TENSE_CARD = {
  ind_presente: ['Presente', 'what you do / what is true now (also near future)', 'hablo = I speak'],
  ind_perfecto: ['Pretérito perfecto', 'have + done — today, this week, ever, yet (Spain)', 'he hablado = I have spoken'],
  ind_indefinido: ['Pretérito indefinido', 'did — finished moment in the past (yesterday, in 2019)', 'hablé = I spoke'],
  ind_imperfecto: ['Pretérito imperfecto', 'used to / was doing — background, habits, descriptions', 'hablaba = I used to speak / I was speaking'],
  ind_pluscuam: ['Pluscuamperfecto', 'had + done — before another past moment', 'había hablado = I had spoken'],
  ind_futuro: ['Futuro simple', 'will — also guesses about now (¿dónde estará? = where can it be?)', 'hablaré = I will speak'],
  ind_futuro_comp: ['Futuro compuesto', 'will have done — or a guess about the past', 'habré hablado = I will have spoken'],
  ind_condicional: ['Condicional', 'would + verb — also polite requests and advice (deberías = you should)', 'hablaría = I would speak'],
  ind_condicional_comp: ['Condicional compuesto', 'would have + done', 'habría hablado = I would have spoken'],
  sub_presente: ['Subjuntivo presente', 'after wishes, doubts, emotions, "when" (future), que + another subject', 'espero que hables = I hope you speak'],
  sub_perfecto: ['Subjuntivo perfecto', 'have done — after wishes/doubts', 'espero que hayas hablado = I hope you have spoken'],
  sub_imperfecto: ['Subjuntivo imperfecto', 'si + past (if I had / if I were), ojalá, past wishes', 'si hablara = if I spoke'],
  sub_pluscuam: ['Subjuntivo pluscuamperfecto', 'if I had done… (impossible past)', 'si hubiera hablado = if I had spoken'],
  imp_afirmativo: ['Imperativo', 'do it! — commands, invitations', '¡habla! = speak!'],
  imp_negativo: ['Imperativo negativo', "don't do it! — no + subjunctive", '¡no hables! = don\'t speak!'],
};

// ---------- English generation for ¿Qué significa? ----------
const SUBJ = ['I', 'you', 'he/she', 'we', 'you (all)', 'they'];
const DOUBLE = new Set(['stop', 'run', 'swim', 'get', 'sit', 'put', 'begin', 'set', 'shop', 'travel', 'plan', 'chat', 'hit', 'cut', 'win', 'forget', 'prefer', 'rob', 'nod', 'hug', 'scrub', 'grab', 'drop', 'dig']);
function third(v) {
  const [h, ...rest] = v.split(' ');
  let x;
  if (h === 'be') x = 'is'; else if (h === 'have') x = 'has'; else if (h === 'can' || h === 'must') x = h;
  else if (/(s|x|z|ch|sh|o)$/.test(h)) x = h + 'es';
  else if (/[^aeiou]y$/.test(h)) x = h.slice(0, -1) + 'ies';
  else x = h + 's';
  return [x, ...rest].join(' ');
}
function ing(v) {
  const [h, ...rest] = v.split(' ');
  let x;
  if (h === 'be') x = 'being'; else if (/ie$/.test(h)) x = h.slice(0, -2) + 'ying';
  else if (/[^e]e$/.test(h) && h !== 'be') x = h.slice(0, -1) + 'ing';
  else if (DOUBLE.has(h)) x = h + h.slice(-1) + 'ing';
  else x = h + 'ing';
  return [x, ...rest].join(' ');
}
function beForm(p, past) {
  if (past) return p === 0 || p === 2 ? 'was' : 'were';
  return p === 0 ? 'am' : p === 2 ? 'is' : 'are';
}
// Returns [displayString, ...acceptedVariants] for one sense, tense, person.
export function englishFor(sense, tense, p, inf) {
  const S = SUBJ[p];
  const has = p === 2 ? 'has' : 'have';
  const { base, past, pp } = sense;
  const isBe = base === 'be' || base.startsWith('be ');
  const rest = isBe ? base.slice(3) : '';
  const pres = isBe ? `${beForm(p)}${rest ? ' ' + rest : ''}` : (p === 2 ? third(base) : base);
  if (inf === 'poder') {
    const M = {
      ind_presente: ['can', 'am able to'], ind_indefinido: ['could', 'was able to', 'managed to'], ind_imperfecto: ['could', 'used to be able to'],
      ind_perfecto: [`${has} been able to`], ind_pluscuam: ['had been able to'], ind_futuro: ['will be able to'],
      ind_futuro_comp: ['will have been able to'], ind_condicional: ['could', 'would be able to'], ind_condicional_comp: ['could have', 'would have been able to'],
    }[tense];
    return M ? M.map(m => `${S} ${m}`) : null;
  }
  const pastBe = isBe ? `${beForm(p, true)}${rest ? ' ' + rest : ''}` : past;
  const T = {
    ind_presente: [`${S} ${pres}`, `${S} ${isBe ? pres : (p === 2 ? 'is' : p === 0 ? 'am' : 'are') + ' ' + ing(base)}`],
    ind_perfecto: [`${S} ${has} ${pp}`],
    ind_indefinido: [`${S} ${pastBe}`],
    ind_imperfecto: [`${S} used to ${base}`, `${S} ${isBe ? pastBe : beForm(p, true) + ' ' + ing(base)}`, `${S} ${pastBe}`],
    ind_pluscuam: [`${S} had ${pp}`],
    ind_futuro: [`${S} will ${base}`, `${S}'ll ${base}`],
    ind_futuro_comp: [`${S} will have ${pp}`],
    ind_condicional: [`${S} would ${base}`, `${S}'d ${base}`],
    ind_condicional_comp: [`${S} would have ${pp}`],
  }[tense];
  return T || null;
}
export const SIG_TENSES = ['ind_presente', 'ind_perfecto', 'ind_indefinido', 'ind_imperfecto', 'ind_pluscuam', 'ind_futuro', 'ind_futuro_comp', 'ind_condicional', 'ind_condicional_comp'];

export function allReadings(form) {
  // every (verb, tense, person) that produces this form, across all verbs
  if (!D.formIndex) {
    D.formIndex = new Map();
    for (const v of D.verbs) {
      if (v.tags.includes('nosig')) continue;
      for (const t of SIG_TENSES) v.t[t].forEach((f, p) => {
        if (!f) return;
        const k = f.toLowerCase();
        if (!D.formIndex.has(k)) D.formIndex.set(k, []);
        D.formIndex.get(k).push({ inf: v.inf, t, p });
      });
    }
  }
  return D.formIndex.get(form.toLowerCase()) || [];
}
export function englishReadings(form) {
  const out = [];
  for (const r of allReadings(form)) {
    const v = D.V[r.inf];
    for (const s of v.en) { const e = englishFor(s, r.t, r.p, r.inf); if (e) out.push(...e); }
  }
  return [...new Set(out)];
}

// All other valid forms of a verb (for "casi" detection), with Spanish labels
export function altForms(inf, exceptTense, exceptPerson) {
  const v = D.V[inf]; const out = [];
  for (const [t, arr] of Object.entries(v.t)) arr.forEach((f, p) => {
    if (!f || (t === exceptTense && p === exceptPerson)) return;
    out.push({ form: f.replace(/^no /, ''), t, p, label: `${PERSON_SHORT[p]} · ${TENSE_SHORT[t]}` });
  });
  return out;
}
export function targetsFor(inf, t, p) {
  const v = D.V[inf]; const f = v.t[t][p]; if (!f) return null;
  const out = [f];
  if (v.alt && v.alt[t] && v.alt[t][p]) out.push(v.alt[t][p]);
  const acc = v.accept && v.accept[t] && v.accept[t][String(p)];
  if (acc) out.push(...acc);
  if (t === 'imp_negativo') out.push(...out.map(x => x.replace(/^no /, '')));
  return out;
}

export async function loadData() {
  const [v, w, d] = await Promise.all(['data/verbs.json', 'data/words.json', 'data/detective.json'].map(u => fetch(u).then(r => r.json())));
  D.tenses = v.tenses; D.persons = v.persons; D.verbs = v.verbs;
  D.verbs.forEach(x => D.V[x.inf] = x);
  D.words = w; w.forEach(x => D.W[x.id] = x);
  D.det = d;
}

// Learner profile, settings, progress log, Leitner scheduling, frustration handling, refresh, planner.
import { db } from './db.js';
import { D, TENSE_ORDER } from './data.js';

const DAY = 86400000;
export const INTERVALS = [0, 0, 1, 3, 7, 21]; // index = box (1..5)
export const MAX_REPEATS = 3;

export const DEFAULT_PROFILE = {
  name: 'Ali', native_language: 'en', variety: 'es-ES',
  level_now: 'B1', level_targets: [{ level: 'B2', by: '2026-12', exam: null }, { level: 'C1', by: '2027-12', exam: null }],
  main_goal: 'Responder rápido y con confianza cuando alguien me habla en español.',
  weaknesses: ['significado de los tiempos verbales', 'condicional', 'ortografía (nunca penalizar)', 'bloquearse al hablar'],
  weak_tenses: ['ind_condicional', 'ind_condicional_comp', 'sub_imperfecto'],
  frustrations: ['sentir que no aprende', 'que le vaya mal', 'repetir lo mismo sin avanzar'],
  life_context: 'Vive en Barcelona. Trabaja como consultor de soluciones (tecnología para la construcción).',
  interests: ['animales', 'construcción y tecnología', 'Barcelona', 'viajes'], dislikes: ['redes sociales', 'culpa por rachas perdidas'],
  rules: { spelling_tolerant: true, ui_language: 'es', user_may_write_en: true },
  daily_minutes: 10,
  progress: { weak_items: [], mastered_count: {}, tense_accuracy: {} },
  liked_content: [], disliked_content: [],
  // Orchestrator memory (P3 coach reads/writes these). Kept in the profile so it survives every app update.
  coach_notes: [],      // [{at, note}] durable things the coach has learned about the learner
  goals_history: [],    // [{at, change, by}] every goal/profile change, who made it
};
export const DEFAULT_SETTINGS = { theme: 'auto', fontSize: 17, sessionSize: 10 };

export const S = { profile: null, settings: null, deck: null, log: null, meta: null, items: new Map(), userWords: [] };

// ---------- data continuity across app updates ----------
// SCHEMA increments whenever stored data changes shape. Each migration upgrades in place, never deletes progress.
export const SCHEMA = 1;
const MIGRATIONS = {
  // 2: async () => { ... },  // example: add a field to every item
};
// Add any new default fields without overwriting what the learner (or coach) already set.
function fillDefaults(target, defaults) {
  for (const [k, v] of Object.entries(defaults)) {
    if (!(k in target)) target[k] = structuredClone(v);
    else if (v && typeof v === 'object' && !Array.isArray(v) && target[k] && typeof target[k] === 'object') fillDefaults(target[k], v);
  }
  return target;
}

export async function loadState() {
  const stored = await db.get('kv', 'profile');
  S.profile = fillDefaults(stored || structuredClone(DEFAULT_PROFILE), DEFAULT_PROFILE);
  S.settings = { ...DEFAULT_SETTINGS, ...((await db.get('kv', 'settings')) || {}) };
  S.deck = (await db.get('kv', 'deck')) || { reserveWords: [], reserveVerbs: [] };
  S.log = fillDefaults((await db.get('kv', 'log')) || {}, { days: {}, sessions: [], tense: {}, answers: 0 });
  S.meta = (await db.get('kv', 'meta')) || { schema: stored ? 1 : SCHEMA, installedAt: Date.now(), lastBackup: 0 };
  for (let v = S.meta.schema + 1; v <= SCHEMA; v++) { if (MIGRATIONS[v]) await MIGRATIONS[v](); S.meta.schema = v; }
  S.items = new Map((await db.all('items')).map(i => [i.key, i]));
  S.userWords = await db.all('words');
  await db.put('kv', S.profile, 'profile');
  await db.put('kv', S.meta, 'meta');
}
export const saveMeta = () => db.put('kv', S.meta, 'meta');
export function backupDue() {
  const week = 7 * 86400000;
  return S.log.answers >= 40 && Date.now() - (S.meta.lastBackup || S.meta.installedAt) > week;
}
export const saveProfile = () => db.put('kv', S.profile, 'profile');
export const saveSettings = () => db.put('kv', S.settings, 'settings');
export const saveDeck = () => db.put('kv', S.deck, 'deck');
export const saveLog = () => db.put('kv', S.log, 'log');

export function item(key) {
  return S.items.get(key) || { key, box: 0, due: 0, passes5: 0, seen: 0, ok: 0, casi: 0, miss: 0, last: 0, restUntil: 0, easy: false, retired: false, mastered: false };
}
export const now = () => Date.now();
export const localDay = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const isNew = it => !it.seen;
export const isResting = it => it.restUntil > now();

export async function grade(key, g, extra = {}) {
  const it = { ...item(key) };
  const t = now();
  const wasNew = !it.seen;
  it.seen++; it.last = t;
  if (g === 'ok') {
    it.ok++;
    if (it.box === 5) { it.passes5++; if (it.passes5 >= 2) it.mastered = true; }
    it.box = Math.min(5, Math.max(1, it.box) + 1);
    if (wasNew) it.box = 2;
    it.easy = false;
  } else if (g === 'casi') {
    it.casi++; it.box = Math.max(1, it.box);
  } else if (g === 'no') {
    it.miss++; it.box = 1;
  }
  it.due = t + INTERVALS[it.box] * DAY;
  Object.assign(it, extra);
  S.items.set(key, it);
  await db.put('items', it);
  // day + tense log
  const d = localDay();
  S.log.days[d] = (S.log.days[d] || 0) + 1;
  S.log.answers++;
  if (extra._tense) {
    const tt = S.log.tense[extra._tense] || { ok: 0, n: 0 };
    tt.n++; if (g === 'ok') tt.ok++; if (g === 'casi') tt.ok += 0.5;
    S.log.tense[extra._tense] = tt;
    S.profile.progress.tense_accuracy[extra._tense] = Math.round(100 * tt.ok / tt.n);
  }
  delete it._tense;
  await saveLog();
  return it;
}
export async function rest(key, days = 3) {
  const it = { ...item(key), restUntil: now() + days * DAY, easy: true };
  S.items.set(key, it); await db.put('items', it);
  const w = S.profile.progress.weak_items;
  if (!w.includes(key)) { w.push(key); if (w.length > 50) w.shift(); await saveProfile(); }
}

// ---------- pools ----------
export function activeWords() {
  const reserve = new Set(S.deck.reserveWords);
  const core = D.words.filter(w => w.source === 'core' || reserve.has(w.id));
  return [...S.userWords, ...core];
}
export function activeVerbs() {
  const r = new Set(S.deck.reserveVerbs);
  return D.verbs.filter(v => v.pool === 'core' || r.has(v.inf));
}
export const wordById = id => D.W[id] || S.userWords.find(w => w.id === id);

function pick(pool, n, keyOf) {
  // due first (oldest due), skip resting & retired
  const t = now();
  const due = [], fresh = [];
  for (const x of pool) {
    const it = item(keyOf(x));
    if (it.retired || isResting(it)) continue;
    if (it.seen && it.due <= t) due.push([x, it]);
    else if (!it.seen) fresh.push([x, it]);
  }
  due.sort((a, b) => a[1].box - b[1].box || a[1].due - b[1].due);
  return { due, fresh };
}

// Target ~75–85% success: adapt the share of new items to recent accuracy.
export function recentAccuracy() {
  const s = S.log.sessions.slice(-5);
  if (!s.length) return 0.8;
  const ok = s.reduce((a, x) => a + x.ok, 0), n = s.reduce((a, x) => a + x.n, 0);
  return n ? ok / n : 0.8;
}
export function newShare() {
  const acc = recentAccuracy();
  if (acc > 0.85) return 0.45;
  if (acc < 0.7) return 0.15;
  return 0.3;
}

export function wordQueue(n) {
  const { due, fresh } = pick(activeWords(), n, w => 'w:' + w.id);
  const nNew = Math.max(1, Math.round(n * newShare()));
  fresh.sort((a, b) => (a[0].source === 'core' || a[0].source === 'reserve' ? 1 : 0) - (b[0].source === 'core' || b[0].source === 'reserve' ? 1 : 0) || (a[0].freq_rank || 0) - (b[0].freq_rank || 0));
  const out = [...due.slice(0, n - Math.min(nNew, fresh.length)), ...fresh.slice(0, nNew)].map(([w]) => w);
  if (out.length < n) out.push(...fresh.slice(nNew, nNew + n - out.length).map(([w]) => w));
  return out.slice(0, n);
}

// Next tabla items: due first, then new (verb × tense) interleaved by tense stage, weak tenses boosted.
export function tablaQueue(n, onlyTense) {
  const verbs = activeVerbs().filter(v => v.inf !== 'haber' || true);
  const keys = [];
  for (const v of verbs) for (const t of TENSE_ORDER) {
    if (onlyTense && t !== onlyTense) continue;
    if (!v.t[t].some(Boolean)) continue;
    keys.push({ inf: v.inf, t, rank: v.rank });
  }
  const { due, fresh } = pick(keys, n, k => `tabla:${k.inf}:${k.t}`);
  const introduced = {};
  for (const [k, it] of S.items) if (k.startsWith('tabla:') && it.seen) { const t = k.split(':')[2]; introduced[t] = (introduced[t] || 0) + 1; }
  const weak = new Set(S.profile.weak_tenses || []);
  const score = k => (introduced[k.t] || 0) + TENSE_ORDER.indexOf(k.t) * 4 - (weak.has(k.t) ? 6 : 0) + k.rank * 0.05;
  fresh.sort((a, b) => score(a[0]) - score(b[0]));
  const nNew = Math.max(1, Math.round(n * newShare()));
  const chosen = [...due.slice(0, n - Math.min(nNew, fresh.length)).map(x => x[0])];
  const seenT = {};
  for (const [k] of fresh) { if (chosen.length >= n) break; if ((seenT[k.t] || 0) >= 2) continue; seenT[k.t] = (seenT[k.t] || 0) + 1; chosen.push(k); }
  return chosen.slice(0, n);
}
export function detQueue(n, onlyTense) {
  const pool = D.det.filter(d => !onlyTense || d.t === onlyTense);
  const { due, fresh } = pick(pool, n, d => 'det:' + d.id);
  const weak = new Set(S.profile.weak_tenses || []);
  fresh.sort((a, b) => (weak.has(b[0].t) - weak.has(a[0].t)) || Math.random() - .5);
  return [...due.map(x => x[0]), ...fresh.map(x => x[0])].slice(0, n);
}
export function sigQueue(n) {
  const SIG = ['ind_presente', 'ind_perfecto', 'ind_indefinido', 'ind_imperfecto', 'ind_futuro', 'ind_condicional', 'ind_pluscuam', 'ind_condicional_comp', 'ind_futuro_comp'];
  const keys = [];
  for (const v of activeVerbs()) { if (v.tags.includes('nosig')) continue; for (const t of SIG) keys.push({ inf: v.inf, t, rank: v.rank }); }
  const { due, fresh } = pick(keys, n, k => `sig:${k.inf}:${k.t}`);
  fresh.sort((a, b) => (a[0].rank + SIG.indexOf(a[0].t) * 12) - (b[0].rank + SIG.indexOf(b[0].t) * 12));
  const nNew = Math.max(2, Math.round(n * newShare()));
  return [...due.slice(0, n - nNew).map(x => x[0]), ...fresh.slice(0, n).map(x => x[0])].slice(0, n);
}

// Wins: items the learner knows well (box>=3) or retired — for frustration recovery.
export function winKeys(prefix, n = 3) {
  const c = [];
  for (const [k, it] of S.items) if (k.startsWith(prefix) && !isResting(it) && (it.box >= 3 || it.retired)) c.push(k);
  c.sort(() => Math.random() - .5);
  return c.slice(0, n);
}

// ---------- refresh (Actualizar) — works offline from bundled reserve ----------
export async function refresh(kind) {
  let retired = 0, added = [];
  const upd = [];
  for (const [k, it] of S.items) {
    const match = kind === 'words' ? k.startsWith('w:') : (k.startsWith('tabla:') || k.startsWith('sig:') || k.startsWith('det:'));
    if (match && it.mastered && !it.retired) { const n = { ...it, retired: true }; S.items.set(k, n); upd.push(n); retired++; }
  }
  await db.putMany('items', upd);
  if (kind === 'words') {
    const have = new Set(S.deck.reserveWords);
    const next = D.words.filter(w => w.source === 'reserve' && !have.has(w.id)).slice(0, retired);
    S.deck.reserveWords.push(...next.map(w => w.id)); added = next.map(w => w.es);
  } else {
    // one new reserve verb for every verb whose tablas are all retired, at least one if anything retired
    const done = activeVerbs().filter(v => Object.keys(v.t).every(t => !v.t[t].some(Boolean) || item(`tabla:${v.inf}:${t}`).retired)).length;
    const want = retired ? Math.max(1, done - S.deck.reserveVerbs.length) : 0;
    const have = new Set(S.deck.reserveVerbs);
    const next = D.verbs.filter(v => v.pool === 'reserve' && !have.has(v.inf)).slice(0, want);
    S.deck.reserveVerbs.push(...next.map(v => v.inf)); added = next.map(v => v.inf);
  }
  await saveDeck();
  return { retired, added };
}

// ---------- stats ----------
export function stats() {
  const month = localDay().slice(0, 7);
  const daysThisMonth = Object.keys(S.log.days).filter(d => d.startsWith(month)).length;
  let words = 0, tablas = 0, mastered = 0;
  for (const [k, it] of S.items) {
    if (k.startsWith('w:') && (it.box >= 3 || it.retired)) words++;
    if (k.startsWith('tabla:') && (it.box >= 3 || it.retired)) tablas++;
    if (it.mastered) mastered++;
  }
  const today = S.log.days[localDay()] || 0;
  return { daysThisMonth, words, tablas, mastered, today };
}
export function dueCounts() {
  const t = now(); let words = 0, verbs = 0;
  for (const [k, it] of S.items) {
    if (it.retired || isResting(it) || !it.seen || it.due > t) continue;
    if (k.startsWith('w:')) words++; else verbs++;
  }
  return { words, verbs };
}
export function weakestTense() {
  let worst = null, wv = 2;
  for (const [t, x] of Object.entries(S.log.tense)) { if (x.n < 4) continue; const a = x.ok / x.n; if (a < wv) { wv = a; worst = t; } }
  return worst || (S.profile.weak_tenses || [])[0] || 'ind_condicional';
}
export async function logSession(kind, ok, n) {
  S.log.sessions.push({ at: now(), kind, ok, n });
  if (S.log.sessions.length > 200) S.log.sessions.shift();
  await saveLog();
}

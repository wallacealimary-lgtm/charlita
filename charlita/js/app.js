import { db } from './db.js';
import { D, loadData, TENSE_ORDER, TENSE_SHORT } from './data.js';
import { localDay, backupDue, saveMeta, S, loadState, grade, rest, item, isResting, wordQueue, tablaQueue, detQueue, sigQueue, winKeys, refresh, stats, dueCounts,
  weakestTense, logSession, activeWords, wordById, saveSettings, saveProfile, MAX_REPEATS, recentAccuracy } from './store.js';
import { tablaCard, detCard, sigCard, vtrCard, flashCard, adivinaCard, wtrCard, matchCard } from './cards.js';
import { animal, react, MODULE_ANIMAL } from './animals.js';

export const VERSION = '0.2.0';
const $app = document.getElementById('app');
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const rnd = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

const LINES = {
  ok: ['¡Genial!', '¡Eso es!', '¡Muy bien!', '¡Olé!', '¡Perfecto!', '¡Toma ya!', '¡Qué crack!'],
  casi: ['¡Casi!', '¡Muy cerca!', 'Por un pelo.', 'Casi, casi.'],
  no: ['Todavía no — ya saldrá.', 'Apuntado. Volverá pronto.', 'Tranqui, la próxima.', 'Así se aprende.'],
  ease: ['Este se resiste. Lo dejamos descansar y vamos con algo que dominas.', 'Paso a paso. Aquí va uno fácil.', 'No pasa nada — tu cerebro está trabajando. Un respiro.', 'Cambiamos de aire: uno que ya sabes.'],
  start: ['¡Vamos allá!', '¿Listo? Poco a poco.', 'Un ratito y listo.'],
};

// ---------- theme & shell ----------
function applySettings() {
  const r = document.documentElement;
  if (S.settings.theme === 'auto') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', S.settings.theme);
  r.style.setProperty('--fs', S.settings.fontSize + 'px');
}
function nav(active) {
  let n = document.querySelector('.nav');
  if (!n) { n = document.createElement('nav'); n.className = 'nav'; document.body.appendChild(n); }
  n.innerHTML = `<div class="inner">${[['home', 'Inicio'], ['progreso', 'Progreso'], ['ajustes', 'Ajustes']].map(([k, l]) => `<button class="${k === active ? 'on' : ''}" data-go="${k}">${l}</button>`).join('')}</div>`;
  n.querySelectorAll('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
}
function toast(msg, action, fn) {
  document.querySelector('.toast')?.remove();
  const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button>${esc(action)}</button>` : ''}`;
  document.body.appendChild(t); if (action) t.querySelector('button').onclick = () => { t.remove(); fn(); };
  setTimeout(() => t.remove(), action ? 12000 : 3200);
}
function modal(html, buttons) {
  return new Promise(res => {
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal">${html}<div class="btnrow">${buttons.map((b, i) => `<button class="btn ${b.soft ? 'soft' : ''}" data-i="${i}">${esc(b.label)}</button>`).join('')}</div></div>`;
    document.body.appendChild(bg);
    bg.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { bg.remove(); res(buttons[+b.dataset.i].value); });
  });
}
const screen = (html, cls = '') => { $app.innerHTML = `<div class="screen ${cls}">${html}</div>`; window.scrollTo(0, 0); return $app.firstElementChild; };
const topbar = (title, back = 'home') => `<div class="topbar"><button class="back" data-back aria-label="Volver">←</button><h1>${esc(title)}</h1></div>`;
function wireBack(el, to = 'home') { el.querySelector('[data-back]')?.addEventListener('click', () => go(to)); }

const ROUTES = {};
export function go(name, arg) { document.body.classList.remove('practicing'); location.hash = name === 'home' ? '' : name; (ROUTES[name] || ROUTES.home)(arg); }

// ---------- HOME ----------
function greeting() { const h = new Date().getHours(); return h < 6 ? 'Buenas noches' : h < 14 ? 'Buenos días' : h < 21 ? 'Buenas tardes' : 'Buenas noches'; }
ROUTES.home = () => {
  nav('home');
  const st = stats(); const due = dueCounts(); const wt = weakestTense();
  const date = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  const plan = [due.words + due.verbs ? `${due.words + due.verbs} repasos` : 'palabras nuevas', TENSE_SHORT[wt].toLowerCase(), 'un poco de todo'];
  const soon = (k, t, d) => `<button class="module m-${k} soon" data-soon="${k}"><span class="badge">Muy pronto</span>${animal(MODULE_ANIMAL[k], '')}<h3>${t}</h3><p>${d}</p></button>`;
  const el = screen(`
    <p class="muted small" style="margin:0 4px 2px">${esc(date[0].toUpperCase() + date.slice(1))}</p>
    <h1 style="margin:0 4px 16px">${greeting()}, ${esc(S.profile.name || '')}</h1>
    <div class="card hero"><div class="dots"></div><div class="hero-row">${animal('erizo')}
      <div style="flex:1"><div class="label" style="color:#5b524a">Tu sesión de hoy</div>
      <h2 style="margin:4px 0 2px">~${S.profile.daily_minutes || 10} minutos</h2>
      <p class="muted small">${esc(plan.join(' · '))}</p></div></div>
      <div class="btnrow"><button class="btn block" data-today>Empezar</button></div></div>
    <div class="stats">
      <div class="stat s1"><b>${st.daysThisMonth}</b><span>días practicados este mes</span></div>
      <div class="stat s2"><b>${st.words}</b><span>palabras aprendidas</span></div>
      <div class="stat s3"><b>${st.tablas}</b><span>tablas verbales aprendidas</span></div>
      <div class="stat s4"><b>${st.today}</b><span>respuestas hoy</span></div>
    </div>
    <div class="section-title">Sin conexión</div>
    <div class="modules">
      <button class="module m-verbos" data-go="verbos">${animal('erizo', '')}<h3>Verbos</h3><p>Tablas, detective de tiempos y más</p></button>
      <button class="module m-palabras" data-go="palabras">${animal('ardilla', '')}<h3>Palabras</h3><p>${activeWords().length} palabras en tu mazo</p></button>
      ${soon('rapidas', 'Respuestas rápidas', 'Responder sin bloquearte')}
    </div>
    <div class="section-title">Con conexión</div>
    <div class="modules">
      ${soon('charla', 'Charla', 'Conversaciones y escenas')}
      ${soon('explora', 'Explora', 'Datos curiosos en español')}
      ${soon('lector', 'Lector', 'Textos a tu nivel')}
      ${soon('escucha', 'Escucha', 'Voz y pódcasts')}
    </div>`);
  el.querySelector('[data-today]').onclick = () => startSession('hoy');
  if (backupDue()) setTimeout(() => toast('¿Guardamos una copia de tu progreso?', 'Guardar', exportBackup), 900);
  el.querySelectorAll('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
  el.querySelectorAll('[data-soon]').forEach(b => b.onclick = () => toast(b.dataset.soon === 'rapidas' ? 'Llega en la próxima fase.' : 'Llega pronto — necesitará conexión.'));
};

// ---------- VERBOS ----------
let verbTense = null;
ROUTES.verbos = () => {
  nav('home');
  const acc = S.log.tense;
  const chips = [['', 'Mezcla'], ...TENSE_ORDER.map(t => [t, TENSE_SHORT[t]])];
  const el = screen(`${topbar('Verbos')}
    <div class="card" style="display:flex;gap:14px;align-items:center;background:color-mix(in srgb,var(--mustard) 22%,var(--card))">${animal('erizo')}<div><h3>¿Qué practicamos?</h3><p class="muted small">${D.verbs.filter(v => v.pool === 'core').length} verbos, 15 tiempos. Sin prisa.</p></div></div>
    <div class="label" style="margin:6px 4px">Tiempo</div>
    <div class="chips">${chips.map(([t, l]) => `<button class="chip ${(verbTense || '') === t ? 'on' : ''}" data-t="${t}">${esc(l)}</button>`).join('')}</div>
    <div class="list">
      ${row('tabla', '▦', 'Tabla', 'Completa la conjugación', 'var(--mustard)')}
      ${row('det', '🔍', 'Detective de tiempos', 'Elige el tiempo que encaja', 'var(--lavender)')}
      ${row('sig', '💭', '¿Qué significa?', 'Una forma, su significado', 'var(--powder)')}
      ${row('vtr', '✎', 'Traduce', 'Frases con el verbo', 'var(--blush)')}
    </div>
    <div class="section-title">Cómo vas por tiempos</div>
    <div class="card"><div class="bars">${TENSE_ORDER.filter(t => acc[t]).map(t => { const p = Math.round(100 * acc[t].ok / acc[t].n); return `<div class="bar"><span>${TENSE_SHORT[t]}</span><span>${p}%</span><div class="track"><i style="width:${p}%"></i></div></div>`; }).join('') || '<p class="muted">Aquí verás tu progreso en cada tiempo.</p>'}</div></div>
    <div class="btnrow"><button class="btn soft block" data-refresh>Actualizar verbos</button></div>
    <p class="muted small" style="text-align:center">Retira lo que ya dominas y trae verbos nuevos. Funciona sin conexión.</p>`);
  wireBack(el);
  el.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { verbTense = b.dataset.t || null; ROUTES.verbos(); });
  el.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => startSession(b.dataset.mode));
  el.querySelector('[data-refresh]').onclick = async () => {
    const r = await refresh('verbs');
    toast(r.retired ? `${r.retired} retirados · nuevos: ${r.added.join(', ') || '—'}` : 'Aún no hay nada dominado. ¡Sigue así!');
  };
};
function row(mode, ico, t, d, col) { return `<button class="row" data-mode="${mode}"><span class="ico" style="background:color-mix(in srgb,${col} 45%,var(--card))">${ico}</span><span class="grow"><b>${t}</b><small>${d}</small></span><span>›</span></button>`; }

// ---------- PALABRAS ----------
ROUTES.palabras = () => {
  nav('home');
  const el = screen(`${topbar('Palabras')}
    <div class="card" style="display:flex;gap:14px;align-items:center;background:color-mix(in srgb,var(--blush) 38%,var(--card))">${animal('ardilla')}<div><h3>Tu mazo</h3><p class="muted small">${activeWords().length} palabras · ${stats().words} aprendidas</p></div></div>
    <div class="list">
      ${row('emparejar', '⇄', 'Emparejar', 'Cinco parejas cada vez', 'var(--sage)')}
      ${row('adivina', '?', 'Adivina la palabra', 'Definición en español', 'var(--lavender)')}
      ${row('tarjetas', '❏', 'Tarjetas', 'Mira, piensa, gira', 'var(--blush)')}
      ${row('wtr', '✎', 'Traduce', 'En las dos direcciones', 'var(--powder)')}
    </div>
    <div class="list" style="margin-top:14px">
      <button class="row" data-banco><span class="ico" style="background:var(--neutral)">☰</span><span class="grow"><b>Mi banco de palabras</b><small>Buscar y añadir palabras</small></span><span>›</span></button>
    </div>
    <div class="btnrow"><button class="btn soft block" data-refresh>Actualizar palabras</button></div>
    <p class="muted small" style="text-align:center">Retira las que ya dominas y trae nuevas de la reserva. Sin conexión.</p>`);
  wireBack(el);
  el.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => startSession(b.dataset.mode));
  el.querySelector('[data-banco]').onclick = () => go('banco');
  el.querySelector('[data-refresh]').onclick = async () => {
    const r = await refresh('words');
    toast(r.retired ? `${r.retired} retiradas · ${r.added.length} nuevas` : 'Aún no hay ninguna dominada. ¡Sigue así!');
  };
};

ROUTES.banco = () => {
  nav('home');
  const el = screen(`${topbar('Mi banco')}
    <input class="answer search" placeholder="Buscar…" autocomplete="off" autocapitalize="off" spellcheck="false">
    <button class="btn soft block" data-add style="margin-bottom:14px">+ Añadir palabra</button>
    <div class="list wordlist" data-list></div>`);
  wireBack(el, 'palabras');
  const list = el.querySelector('[data-list]'); const q = el.querySelector('.search');
  const draw = () => {
    const s = q.value.toLowerCase().trim();
    const ws = activeWords().filter(w => !s || w.es.toLowerCase().includes(s) || w.en.toLowerCase().includes(s)).slice(0, 80);
    list.innerHTML = ws.map(w => { const it = item('w:' + w.id); const lvl = it.retired ? 'dominada' : it.seen ? `caja ${it.box}` : 'nueva';
      return `<div class="row"><span class="grow"><b>${esc(w.es)}</b><small lang="en">${esc(w.en)}</small></span><span class="chip">${lvl}</span></div>`; }).join('');
  };
  q.oninput = draw; draw();
  el.querySelector('[data-add]').onclick = async () => {
    const v = await modal(`<h2>Nueva palabra</h2><div class="field" style="margin-top:12px"><label>En español</label><input class="answer" id="nw-es" autocapitalize="off"></div>
      <div class="field"><label>Traducción</label><input class="answer" id="nw-en" lang="en" autocapitalize="off"></div>
      <div class="field"><label>Definición o ejemplo (opcional)</label><input class="answer" id="nw-def" autocapitalize="off"></div>`,
      [{ label: 'Cancelar', value: null, soft: true }, { label: 'Guardar', value: 'save' }]);
    // modal removed; values read before removal via listener below
  };
};
// capture modal inputs before removal
document.addEventListener('click', async e => {
  const b = e.target.closest('.modal [data-i]'); if (!b) return;
  const es = document.getElementById('nw-es'); if (!es || b.textContent !== 'Guardar') return;
  const w = { id: 'u' + Date.now(), es: es.value.trim(), en: document.getElementById('nw-en').value.trim(), def_es: document.getElementById('nw-def').value.trim(),
    example_es: '', pos: 'n', gender: null, variety: 'all', latam_alt: null, topic: ['mías'], freq_rank: 0, source: 'manual' };
  if (!w.es || !w.en) return;
  if (!w.def_es) w.def_es = `(${w.es})`;
  await db.put('words', w); S.userWords.push(w); toast('¡Guardada! Aparecerá en tus prácticas.'); setTimeout(() => ROUTES.banco(), 50);
}, true);

// ---------- SESSION ----------
function cardsFor(mode) {
  const n = S.settings.sessionSize || 10;
  const pool = activeWords();
  switch (mode) {
    case 'tabla': return tablaQueue(Math.max(4, Math.round(n * .6)), verbTense).map(k => tablaCard(k.inf, k.t));
    case 'det': return detQueue(n, verbTense).map(detCard);
    case 'sig': return sigQueue(n).map(k => sigCard(k.inf, k.t));
    case 'vtr': return shuffle(detQueue(n * 2, verbTense)).slice(0, Math.round(n * .7)).map(vtrCard);
    case 'emparejar': { const ws = wordQueue(15); const out = []; for (let i = 0; i + 5 <= ws.length; i += 5) out.push(matchCard(ws.slice(i, i + 5))); return out; }
    case 'adivina': return wordQueue(n).map(w => adivinaCard(w, pool));
    case 'tarjetas': return wordQueue(n + 2).map(flashCard);
    case 'wtr': return wordQueue(n).map(w => wtrCard(w));
    case 'hoy': default: {
      const words = wordQueue(7).map(w => { const it = item('w:' + w.id); return !it.seen ? flashCard(w) : it.box <= 2 || it.easy ? adivinaCard(w, pool) : wtrCard(w); });
      const wt = weakestTense();
      const det = detQueue(2, wt).map(detCard);
      const tab = tablaQueue(2).map(k => tablaCard(k.inf, k.t));
      const sig = sigQueue(2).map(k => sigCard(k.inf, k.t));
      const out = []; const lists = [words, [...det, ...sig], tab];
      while (lists.some(l => l.length)) for (const l of lists) { if (l.length) out.push(l.shift()); if (l === words && words.length) out.push(words.shift()); }
      return out;
    }
  }
}
function cardFromKey(k) {
  const [kind, a, b] = k.split(':');
  if (kind === 'w') { const w = wordById(a); return w ? adivinaCard(w, activeWords(), true) : null; }
  if (kind === 'tabla') return tablaCard(a, b);
  if (kind === 'sig') return sigCard(a, b);
  if (kind === 'det') { const d = D.det.find(x => x.id === a); return d ? detCard(d) : null; }
  if (kind === 'vtr') { const d = D.det.find(x => x.id === a); return d ? vtrCard(d) : null; }
  return null;
}
const TITLES = { hoy: 'Sesión de hoy', tabla: 'Tabla', det: 'Detective', sig: '¿Qué significa?', vtr: 'Traduce', emparejar: 'Emparejar', adivina: 'Adivina', tarjetas: 'Tarjetas', wtr: 'Traduce' };
const ANIMAL_FOR = m => (['emparejar', 'adivina', 'tarjetas', 'wtr'].includes(m) ? 'ardilla' : 'erizo');

async function startSession(mode) {
  const queue = cardsFor(mode);
  if (!queue.length) { toast('¡Todo repasado por ahora! Prueba otro modo.'); return; }
  document.body.classList.add('practicing');
  const who = ANIMAL_FOR(mode);
  const sess = { mode, queue, i: 0, ok: 0, n: 0, misses: {}, repeats: {}, skipStreak: 0, rapid: 0, total: queue.length, eased: 0, learned: new Set() };
  const el = screen(`<div class="practice-head"><button class="back" data-back aria-label="Salir">✕</button><div class="grow"><div class="label">${esc(TITLES[mode] || '')}</div><div class="progress"><i style="width:0%"></i></div></div></div>
    <div class="card" data-stage></div>
    <div class="companion">${animal(who)}<div class="bubble" data-bubble>${rnd(LINES.start)}</div></div>`);
  el.querySelector('[data-back]').onclick = () => endSession(sess, true);
  const stage = el.querySelector('[data-stage]'); const bubble = el.querySelector('[data-bubble]'); const comp = el.querySelector('.companion');
  const say = (txt, kind) => { bubble.textContent = txt; if (kind) react(comp, kind); };

  const show = () => {
    if (sess.i >= sess.queue.length) return endSession(sess);
    el.querySelector('.progress i').style.width = Math.round(100 * sess.i / sess.queue.length) + '%';
    const card = sess.queue[sess.i]; const t0 = performance.now();
    if (window.__charlita) window.__charlita.card = card;
    stage.innerHTML = '';
    const inner = document.createElement('div'); stage.appendChild(inner);
    const restBtn = document.createElement('button'); restBtn.className = 'rest'; restBtn.textContent = 'Déjalo descansar';
    restBtn.onclick = async () => { for (const k of card.keys || [card.key]) await rest(k); await ease(card, 'Descansando unos días. Vamos con otra cosa.'); sess.i++; show(); };
    stage.appendChild(restBtn);
    card.render(inner, {
      react: k => react(comp, k),
      done: async (results) => {
        const dt = performance.now() - t0;
        let main = 'ok';
        for (const r of results) {
          if (r.grade === 'skip') { main = 'skip'; continue; }
          await grade(r.key, r.grade, r.tense ? { _tense: r.tense } : {});
          sess.n++; if (r.grade === 'ok') { sess.ok++; sess.learned.add(r.key); } else if (r.grade === 'casi') sess.ok += .5;
          if (r.grade !== 'ok') main = r.grade === 'no' || main === 'no' ? 'no' : 'casi';
        }
        // frustration signals
        if (main === 'skip') sess.skipStreak++; else sess.skipStreak = 0;
        if (main === 'no' && dt < 2500) sess.rapid++; else if (main !== 'no') sess.rapid = 0;
        let eased = false;
        for (const r of results) if (r.grade === 'no') {
          sess.misses[r.key] = (sess.misses[r.key] || 0) + 1;
          if (sess.misses[r.key] >= 3) { await rest(r.key); await ease(card, rnd(LINES.ease)); eased = true; }
          else if ((sess.repeats[r.key] || 0) < MAX_REPEATS - 1 && card.kind !== 'match') {
            sess.repeats[r.key] = (sess.repeats[r.key] || 0) + 1;
            const again = cardFromKey(r.key) || card;
            sess.queue.splice(Math.min(sess.queue.length, sess.i + 3), 0, again);
          }
        }
        if (!eased && (sess.skipStreak >= 3 || sess.rapid >= 3)) { sess.skipStreak = 0; sess.rapid = 0; await ease(card, rnd(LINES.ease)); eased = true; }
        if (!eased) say(main === 'skip' ? 'Vale, saltamos.' : rnd(LINES[main]), main === 'ok' ? 'cheer' : main === 'skip' ? null : 'shrug');
        sess.i++; show();
      },
    });
  };
  async function ease(card, line) {
    sess.eased++;
    const wins = winKeys(card.family || 'w:', 3).map(cardFromKey).filter(Boolean);
    let extra = wins;
    if (extra.length < 2) extra = extra.concat(wordQueue(3).filter(w => item('w:' + w.id).seen).map(w => adivinaCard(w, activeWords(), true)));
    if (extra.length < 2) extra = extra.concat(D.det.slice(0, 40).filter(d => !item('det:' + d.id).seen).slice(0, 2).map(detCard));
    sess.queue.splice(sess.i + 1, 0, ...extra.slice(0, 3));
    say(line, 'shrug');
  }
  show();
}

async function endSession(sess, early) {
  if (sess.n) await logSession(sess.mode, sess.ok, sess.n);
  document.body.classList.remove('practicing');
  if (early && !sess.n) return go('home');
  const pct = sess.n ? Math.round(100 * sess.ok / sess.n) : 0;
  const st = stats();
  const el = screen(`<div class="celebrate">${animal(ANIMAL_FOR(sess.mode), 'cheer')}
    <h1 style="margin-top:10px">${pct >= 85 ? '¡Qué máquina!' : pct >= 70 ? '¡Muy bien!' : '¡Hecho!'}</h1>
    <p class="muted">${sess.n} respuestas · ${Math.round(sess.ok)} bien</p>
    <div class="stats" style="margin-top:18px;text-align:left">
      <div class="stat s1"><b>${st.daysThisMonth}</b><span>días practicados este mes ✓</span></div>
      <div class="stat s2"><b>${st.words}</b><span>palabras aprendidas</span></div>
      <div class="stat s3"><b>${st.tablas}</b><span>tablas aprendidas</span></div>
      <div class="stat s4"><b>${st.today}</b><span>respuestas hoy</span></div>
    </div>
    <div class="btnrow"><button class="btn soft" data-more>Otra ronda</button><button class="btn" data-home>Inicio</button></div></div>`);
  if (pct >= 70) confetti();
  el.querySelector('[data-home]').onclick = () => go('home');
  el.querySelector('[data-more]').onclick = () => startSession(sess.mode);
}
function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('div'); c.className = 'confetti';
  const cols = ['#EBB7B5', '#A8B98B', '#E6A93C', '#C8DCE2', '#D8CEF0'];
  c.innerHTML = Array.from({ length: 40 }, () => `<i style="left:${Math.random() * 100}%;background:${rnd(cols)};animation-delay:${Math.random() * .6}s;animation-duration:${1.4 + Math.random()}s"></i>`).join('');
  document.body.appendChild(c); setTimeout(() => c.remove(), 3000);
}

// ---------- PROGRESO ----------
ROUTES.progreso = () => {
  nav('progreso');
  const st = stats(); const d = new Date(); const y = d.getFullYear(), m = d.getMonth();
  const first = new Date(y, m, 1); const pad = (first.getDay() + 6) % 7; const days = new Date(y, m + 1, 0).getDate();
  const month = d.toLocaleDateString('es-ES', { month: 'long' });
  const cal = Array.from({ length: pad }, () => '<span class="pad"></span>').join('') + Array.from({ length: days }, (_, i) => {
    const k = `${y}-${String(m + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
    return `<span class="${S.log.days[k] ? 'on' : ''} ${i + 1 === d.getDate() ? 'today' : ''}">${i + 1}</span>`; }).join('');
  const acc = S.log.tense;
  const accPct = Math.round(recentAccuracy() * 100);
  const el = screen(`<h1 style="margin:4px 4px 16px">Tu progreso</h1>
    <div class="stats">
      <div class="stat s1"><b>${st.daysThisMonth}</b><span>días en ${month}</span></div>
      <div class="stat s2"><b>${st.words}</b><span>palabras aprendidas</span></div>
      <div class="stat s3"><b>${st.tablas}</b><span>tablas aprendidas</span></div>
      <div class="stat s4"><b>${st.mastered}</b><span>dominadas del todo</span></div>
    </div>
    <div class="card"><h3 style="text-transform:capitalize">${month}</h3><div class="cal">${['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(x => `<span class="pad" style="font-weight:900">${x}</span>`).join('')}${cal}</div></div>
    <div class="card"><h3>Tiempos verbales</h3><div class="bars" style="margin-top:10px">${TENSE_ORDER.filter(t => acc[t]).map(t => { const p = Math.round(100 * acc[t].ok / acc[t].n); return `<div class="bar"><span>${TENSE_SHORT[t]}</span><span>${p}%</span><div class="track"><i style="width:${p}%"></i></div></div>`; }).join('') || '<p class="muted">Practica un poco de verbos y aquí aparecerán.</p>'}</div></div>
    <div class="card"><h3>Últimas sesiones</h3><p class="muted small">Acierto medio: ${accPct}% · la app se ajusta para que estés entre 75 y 85%.</p></div>`);
};

async function exportBackup() {
  const data = await db.exportAll();
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const name = `charlita-copia-${localDay()}.json`;
  const file = new File([blob], name, { type: 'application/json' });
  const mark = async () => { S.meta.lastBackup = Date.now(); await saveMeta(); toast('Copia guardada. ¡Tu progreso está a salvo!'); };
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'Charlita' }); await mark(); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  await mark();
}

// ---------- AJUSTES ----------
ROUTES.ajustes = () => {
  nav('ajustes');
  const s = S.settings, p = S.profile;
  const seg = (name, opts, cur) => `<div class="seg" data-seg="${name}">${opts.map(([v, l]) => `<button data-v="${v}" class="${String(cur) === String(v) ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  const el = screen(`<h1 style="margin:4px 4px 16px">Ajustes</h1>
    <div class="card">
      <div class="field"><label>Tu nombre</label><input class="answer" data-name value="${esc(p.name)}" autocapitalize="words"></div>
      <div class="field"><label>Minutos al día</label>${seg('minutes', [[5, '5'], [10, '10'], [15, '15'], [20, '20']], p.daily_minutes)}</div>
      <div class="field"><label>Tarjetas por sesión</label>${seg('size', [[6, '6'], [10, '10'], [14, '14']], s.sessionSize)}</div>
      <div class="field"><label>Tema</label>${seg('theme', [['auto', 'Automático'], ['light', 'Claro'], ['dark', 'Oscuro']], s.theme)}</div>
      <div class="field" style="margin:0"><label>Tamaño de letra</label>${seg('font', [[15, 'A−'], [17, 'A'], [19, 'A+']], s.fontSize)}</div>
    </div>
    <div class="card"><h3>Copia de seguridad</h3><p class="muted small">Todo se guarda en este dispositivo. Exporta para llevarlo a otro.</p>
      <div class="btnrow"><button class="btn soft" data-export>Exportar</button><button class="btn soft" data-import>Importar</button></div>
      <input type="file" accept="application/json,.json" data-file hidden></div>
    <div class="card"><h3>Tu perfil</h3><p class="muted small">${esc(p.main_goal)}</p>
      <p class="small"><b>Nivel:</b> ${esc(p.level_now)} → ${p.level_targets.map(t => esc(t.level)).join(' → ')}</p>
      <p class="small"><b>Variedad:</b> ${esc(p.variety)} · <b>Ortografía:</b> sin penalizar</p>
      <p class="small"><b>Tiempos a reforzar:</b> ${(p.weak_tenses || []).map(t => TENSE_SHORT[t]).join(', ')}</p></div>
    <div class="card"><h3>Conexión e IA</h3><p class="muted small">Charla, Explora, Lector y Escucha llegarán en la próxima fase. Usarás tu propia clave (Claude o ChatGPT).</p></div>
    <button class="btn ghost block" data-wipe>Borrar todos los datos</button>
    <p class="muted small" style="text-align:center">Charlita v${VERSION}</p>`);
  el.querySelector('[data-name]').onchange = e => { p.name = e.target.value.trim(); saveProfile(); };
  el.querySelectorAll('[data-seg]').forEach(sg => sg.querySelectorAll('button').forEach(b => b.onclick = async () => {
    const v = b.dataset.v;
    if (sg.dataset.seg === 'minutes') { p.daily_minutes = +v; await saveProfile(); }
    if (sg.dataset.seg === 'size') { s.sessionSize = +v; }
    if (sg.dataset.seg === 'theme') s.theme = v;
    if (sg.dataset.seg === 'font') s.fontSize = +v;
    await saveSettings(); applySettings(); ROUTES.ajustes();
  }));
  el.querySelector('[data-export]').onclick = exportBackup;
  const fileIn = el.querySelector('[data-file]');
  el.querySelector('[data-import]').onclick = () => fileIn.click();
  fileIn.onchange = async () => {
    const f = fileIn.files[0]; if (!f) return;
    try { await db.importAll(JSON.parse(await f.text())); await loadState(); applySettings(); toast('¡Copia restaurada!'); go('home'); }
    catch { toast('Ese archivo no parece una copia de Charlita.'); }
  };
  el.querySelector('[data-wipe]').onclick = async () => {
    const ok = await modal('<h2>¿Borrar todo?</h2><p class="muted">Se borra tu progreso en este dispositivo. Exporta una copia antes si la quieres.</p>', [{ label: 'Cancelar', value: false, soft: true }, { label: 'Borrar', value: true }]);
    if (!ok) return; await db.wipe(); await loadState(); applySettings(); toast('Datos borrados.'); go('home');
  };
};

// ---------- boot ----------
async function boot() {
  $app.innerHTML = `<div style="display:grid;place-items:center;min-height:70vh">${animal('erizo')}</div>`;
  await Promise.all([loadData(), loadState()]);
  applySettings();
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  const h = location.hash.slice(1);
  go(ROUTES[h] && h !== 'session' ? h : 'home');
  window.__charlita = { S, D, db, refresh, go };
}
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').then(reg => {
    reg.addEventListener('updatefound', () => {
      const nw = reg.installing;
      nw && nw.addEventListener('statechange', () => {
        if (nw.state === 'installed' && navigator.serviceWorker.controller) toast('Hay una versión nueva.', 'Actualizar', () => nw.postMessage('skip'));
      });
    });
  }).catch(() => {});
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloaded) { reloaded = true; location.reload(); } });
}
boot();

// Practice card renderers. Each card: { key, keys?, kind, render(el, api) } ; api.done(results, meta)
import { D, PERSON_LABEL, PERSON_SHORT, TENSE_SHORT, TENSE_CARD, tenseLabel, altForms, targetsFor, englishFor, englishReadings, allReadings } from './data.js';
import { check, checkEnglish, enVariants, overlap, norm, strip } from './checker.js';
import { item } from './store.js';

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const rnd = a => a[Math.floor(Math.random() * a.length)];
const inputAttrs = 'autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="done"';
export const firstSense = en => en.split(/\s\/\s|;/)[0].replace(/\s*\(.*?\)\s*/g, ' ').trim();
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;

function tenseCardHTML(t) {
  const c = TENSE_CARD[t]; if (!c) return '';
  return `<div class="tensecard" lang="en"><b lang="es">${esc(c[0])}</b><div>${esc(c[1])}</div><div class="eg">${esc(c[2])}</div></div>`;
}
function feedback(kind, html) { return `<div class="feedback ${kind}">${html}</div>`; }
function nextBtn() { return `<div class="btnrow"><button class="btn block" data-next>Siguiente</button></div>`; }
function wireNext(el, fn) { const b = el.querySelector('[data-next]'); if (b) { b.onclick = fn; setTimeout(() => b.focus(), 50); } }

// ---------------- VERBOS ----------------
export function tablaCard(inf, t) {
  const key = `tabla:${inf}:${t}`;
  return {
    key, kind: 'tabla', family: 'tabla:',
    render(el, api) {
      const v = D.V[inf]; const easy = item(key).easy;
      const rows = v.t[t].map((f, p) => f ? `<div class="p">${PERSON_SHORT[p]}</div><div class="cell" data-p="${p}"><input class="answer" ${inputAttrs} ${easy ? `placeholder="${esc(f.replace(/^no /, '').slice(0, 2))}…"` : ''}><div class="fix"></div></div>` : '').join('');
      el.innerHTML = `<div class="label">Tabla · ${esc(tenseLabel(t))}</div>
        <div class="prompt">${esc(inf)}</div>
        ${t === 'imp_negativo' ? '<p class="muted small">Con o sin «no», como prefieras.</p>' : ''}
        <div class="grid6" style="margin-top:12px">${rows}</div>
        <div class="btnrow"><button class="btn" data-check>Comprobar</button><button class="btn soft" data-show>Ver respuesta</button></div>
        <div class="btnrow" style="margin-top:6px"><button class="btn ghost" data-skip>Saltar</button></div><div data-fb></div>`;
      const inputs = [...el.querySelectorAll('input')];
      inputs.forEach((inp, i) => inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); if (inputs[i + 1]) inputs[i + 1].focus(); else el.querySelector('[data-check]')?.click(); } }));
      setTimeout(() => inputs[0]?.focus(), 80);
      const finish = (g, show) => {
        el.querySelectorAll('.btnrow').forEach(b => b.remove());
        el.querySelector('[data-fb]').innerHTML = feedback(g, g === 'ok' ? '¡Tabla completa!' : g === 'casi' ? 'Casi toda — mira las correcciones.' : show ? 'Aquí la tienes. Volverá pronto.' : 'Todavía no — aquí están las formas.') + nextBtn();
        wireNext(el, () => api.done([{ key, grade: g, tense: t }]));
      };
      el.querySelector('[data-check]').onclick = () => {
        let score = 0, n = 0;
        el.querySelectorAll('.cell').forEach(c => {
          const p = +c.dataset.p; const inp = c.querySelector('input'); n++;
          const tg = targetsFor(inf, t, p);
          const alts = altForms(inf, t, p).filter(a => !tg.map(strip).includes(strip(a.form)));
          const r = check(inp.value.replace(/^\s*no\s+/i, ''), tg.map(x => x.replace(/^no /, '')), alts);
          const gr = r.grade === 'empty' ? 'no' : r.grade; c.classList.add(gr); inp.readOnly = true;
          const right = tg[0].replace(/^no /, '');
          const fix = c.querySelector('.fix');
          if (gr === 'ok') { score++; if (r.corrected || !r.exact) fix.textContent = '✓ ' + right; }
          else if (gr === 'casi') { score += .5; fix.textContent = r.alt ? `Eso es «${r.alt.label}» — aquí: ${right}` : `Casi: ${right}`; }
          else fix.textContent = right;
        });
        const ratio = score / n;
        finish(ratio >= .99 ? 'ok' : ratio >= .5 ? 'casi' : 'no');
      };
      el.querySelector('[data-show]').onclick = () => {
        el.querySelectorAll('.cell').forEach(c => { const p = +c.dataset.p; const inp = c.querySelector('input'); inp.value = targetsFor(inf, t, p)[0].replace(/^no /, ''); inp.readOnly = true; c.classList.add('no'); });
        finish('no', true);
      };
      el.querySelector('[data-skip]').onclick = () => api.done([{ key, grade: 'skip' }]);
    },
  };
}

export function detCard(d) {
  const key = 'det:' + d.id;
  return {
    key, kind: 'det', family: 'det:',
    render(el, api) {
      const fill = (f) => { let s = d.es.replace('{}', `<b>${esc(f)}</b>`); return s.startsWith('<b>') ? s.replace(/<b>(.)/, (m, c) => '<b>' + c.toUpperCase()) : s; };
      const opts = shuffle([{ f: d.ok, t: d.t, right: true }, ...d.wrong.map(w => ({ ...w, right: false }))]);
      el.innerHTML = `<div class="label">Detective de tiempos</div>
        <div class="prompt en" lang="en">${esc(d.en)}</div>
        <p class="muted small">¿Qué frase encaja mejor?</p>
        <div class="options">${opts.map((o, i) => `<button class="opt" data-i="${i}">${fill(o.f)}</button>`).join('')}</div><div data-fb></div>`;
      el.querySelectorAll('.opt').forEach(b => b.onclick = () => {
        const o = opts[+b.dataset.i];
        el.querySelectorAll('.opt').forEach((x, i) => { x.disabled = true; if (opts[i].right) x.classList.add('ok'); else if (x === b) x.classList.add('no'); else x.classList.add('dim'); });
        const g = o.right ? 'ok' : 'no';
        el.querySelector('[data-fb]').innerHTML = feedback(g, o.right ? '¡Exacto!' : `Esa forma es ${esc(TENSE_SHORT[o.t].toLowerCase())}. Aquí buscamos ${esc(TENSE_SHORT[d.t].toLowerCase())}.`) + tenseCardHTML(d.t) + nextBtn();
        wireNext(el, () => api.done([{ key, grade: g, tense: d.t }]));
      });
    },
  };
}

export function sigCard(inf, t) {
  const key = `sig:${inf}:${t}`;
  return {
    key, kind: 'sig', family: 'sig:',
    render(el, api) {
      const v = D.V[inf];
      const persons = v.t[t].map((f, p) => f ? p : null).filter(p => p !== null);
      const p = rnd(persons); const form = v.t[t][p];
      const valid = englishReadings(form);
      const validN = new Set(valid.map(norm));
      const main = englishFor(v.en[0], t, p, inf)[0];
      const typed = item(key).box >= 3 && !item(key).easy;
      const readings = allReadings(form);
      const who = [...new Set(readings.map(r => r.inf))];
      const allLine = readings.map(r => englishFor(D.V[r.inf].en[0], r.t, r.p, r.inf)?.[0]).filter(Boolean);
      const reveal = `<span lang="en">${esc([...new Set(allLine)].join(' · '))}</span>${who.length > 1 ? `<br><span class="small">(${who.map(esc).join(' / ')})</span>` : `<br><span class="small">(${esc(inf)})</span>`}`;
      el.innerHTML = `<div class="label">¿Qué significa?</div><div class="prompt">${esc(form)}</div>` + (typed
        ? `<input class="answer" ${inputAttrs} lang="en" placeholder="Escribe en inglés"><div class="btnrow"><button class="btn" data-check>Comprobar</button><button class="btn soft" data-skip>Saltar</button></div><div data-fb></div>`
        : `<div class="options"></div><div data-fb></div>`);
      if (typed) {
        const inp = el.querySelector('input'); setTimeout(() => inp.focus(), 80);
        const variants = [...valid, ...valid.map(x => x.replace(/^(i|you \(all\)|you|he\/she|we|they)\s+/i, '')), ...valid.map(x => x.replace('he/she', 'he')), ...valid.map(x => x.replace('he/she', 'she'))];
        const go = () => {
          const r = checkEnglish(inp.value, variants); const g = r.grade === 'ok' ? 'ok' : 'no';
          inp.readOnly = true; el.querySelector('.btnrow').remove();
          el.querySelector('[data-fb]').innerHTML = feedback(g, (g === 'ok' ? '¡Eso es!' : 'Todavía no.') + `<span class="big">${reveal}</span>`) + nextBtn();
          wireNext(el, () => api.done([{ key, grade: g, tense: t }]));
        };
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
        el.querySelector('[data-check]').onclick = go;
        el.querySelector('[data-skip]').onclick = () => api.done([{ key, grade: 'skip' }]);
      } else {
        const dis = [];
        const tryAdd = s => { if (s && !validN.has(norm(s)) && !dis.includes(s) && dis.length < 3) dis.push(s); };
        shuffle(['ind_presente', 'ind_indefinido', 'ind_imperfecto', 'ind_futuro', 'ind_condicional', 'ind_perfecto', 'ind_pluscuam']).forEach(tt => tt !== t && tryAdd(englishFor(v.en[0], tt, p, inf)?.[0]));
        shuffle([0, 1, 2, 3, 4, 5]).forEach(pp => tryAdd(englishFor(v.en[0], t, pp, inf)?.[0]));
        const opts = shuffle([main, ...dis]);
        const box = el.querySelector('.options');
        box.innerHTML = opts.map((o, i) => `<button class="opt" lang="en" data-i="${i}">${esc(o)}</button>`).join('');
        box.querySelectorAll('.opt').forEach(b => b.onclick = () => {
          const pickd = opts[+b.dataset.i]; const ok = validN.has(norm(pickd));
          box.querySelectorAll('.opt').forEach((x, i) => { x.disabled = true; if (validN.has(norm(opts[i]))) x.classList.add('ok'); else if (x === b) x.classList.add('no'); else x.classList.add('dim'); });
          el.querySelector('[data-fb]').innerHTML = feedback(ok ? 'ok' : 'no', (ok ? '¡Eso es!' : 'Todavía no.') + `<span class="big">${reveal}</span>`) + nextBtn();
          wireNext(el, () => api.done([{ key, grade: ok ? 'ok' : 'no', tense: t }]));
        });
      }
    },
  };
}

export function vtrCard(d) {
  const key = 'vtr:' + d.id;
  return {
    key, kind: 'vtr', family: 'vtr:',
    render(el, api) {
      let es = d.es.replace('{}', d.ok); es = es[0] === '¿' || es[0] === '¡' ? es[0] + es[1].toUpperCase() + es.slice(2) : cap(es);
      el.innerHTML = `<div class="label">Traduce</div><div class="prompt">${esc(es)}</div>
        <textarea class="answer" rows="2" ${inputAttrs} lang="en" placeholder="Escribe en inglés"></textarea>
        <div class="btnrow"><button class="btn" data-check>Comprobar</button><button class="btn soft" data-skip>Saltar</button></div><div data-fb></div>`;
      const ta = el.querySelector('textarea'); setTimeout(() => ta.focus(), 80);
      ta.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); el.querySelector('[data-check]')?.click(); } });
      el.querySelector('[data-skip]').onclick = () => api.done([{ key, grade: 'skip' }]);
      el.querySelector('[data-check]').onclick = () => {
        const sc = overlap(ta.value, d.en); ta.readOnly = true; el.querySelector('.btnrow').remove();
        const fb = el.querySelector('[data-fb]');
        if (sc >= .7) {
          fb.innerHTML = feedback('ok', `¡Muy bien!<span class="big" lang="en">${esc(d.en)}</span>`) + tenseCardHTML(d.t) + nextBtn();
          wireNext(el, () => api.done([{ key, grade: 'ok', tense: d.t }]));
        } else {
          fb.innerHTML = `<div class="feedback no">Una traducción posible:<span class="big" lang="en">${esc(d.en)}</span></div>${tenseCardHTML(d.t)}
            <p class="muted small" style="margin-top:12px">¿Cómo te ha ido?</p>
            <div class="btnrow"><button class="btn soft" data-g="ok">Lo tenía</button><button class="btn soft" data-g="casi">Casi</button><button class="btn soft" data-g="no">Aún no</button></div>`;
          fb.querySelectorAll('[data-g]').forEach(b => b.onclick = () => api.done([{ key, grade: b.dataset.g, tense: d.t }]));
        }
      };
    },
  };
}

// ---------------- PALABRAS ----------------
const artOf = w => w.pos === 'n' && w.gender ? (w.gender === 'f' ? 'la ' : w.gender === 'm' ? 'el ' : '') : '';
const latamTag = w => w.latam_alt ? ` <span class="tag">LatAm: ${esc(w.latam_alt)}</span>` : '';

export function flashCard(w) {
  const key = 'w:' + w.id;
  return {
    key, kind: 'flash', family: 'w:',
    render(el, api) {
      el.innerHTML = `<div class="label">Tarjetas</div>
        <div class="card flash" data-flip><div class="word">${esc(artOf(w) + w.es)}</div>
        <div class="def" hidden>${esc(w.def_es || '')}</div><div class="ex" hidden>${esc(w.example_es || '')}</div>
        <div class="en" lang="en" hidden>${esc(w.en)}</div><div class="small muted" data-hint style="margin-top:14px">Toca para ver</div></div>
        <div data-rate hidden><div class="btnrow"><button class="btn soft" data-g="no">Otra vez</button><button class="btn soft" data-g="casi">Casi</button><button class="btn" data-g="ok">Me la sé</button></div></div>`;
      let stage = 0; const f = el.querySelector('[data-flip]');
      f.onclick = () => {
        stage++;
        if (stage === 1) { f.querySelector('.def').hidden = false; f.querySelector('.ex').hidden = false; f.querySelector('[data-hint]').textContent = 'Toca otra vez para la traducción'; el.querySelector('[data-rate]').hidden = false; }
        if (stage === 2) { f.querySelector('.en').hidden = false; f.querySelector('[data-hint]').innerHTML = latamTag(w); }
      };
      el.querySelectorAll('[data-g]').forEach(b => b.onclick = () => api.done([{ key, grade: b.dataset.g }]));
    },
  };
}

function blankOut(ex, word) {
  const lw = word.toLowerCase();
  if (ex.toLowerCase().includes(lw)) return ex.replace(new RegExp(lw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '_____');
  if (lw.includes(' ')) return '';
  const stem = strip(lw).replace(/(ar|er|ir|arse|erse|irse|o|a|e|os|as)$/, '').slice(0, Math.max(4, lw.length - 3));
  if (stem.length < 3) return '';
  let hit = false;
  const out = ex.replace(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g, t => (!hit && strip(t).startsWith(stem) ? (hit = true, '_____') : t));
  return hit ? out : '';
}
export function adivinaCard(w, pool, forceChoice) {
  const key = 'w:' + w.id;
  return {
    key, kind: 'adivina', family: 'w:',
    render(el, api) {
      const it = item(key); const choice = forceChoice || it.easy || it.box <= 1;
      let ex = blankOut(w.example_es || '', w.es);
      el.innerHTML = `<div class="label">Adivina la palabra</div><div class="prompt" style="font-size:1.35rem">${esc(w.def_es)}</div>
        ${ex ? `<p class="muted" style="font-style:italic">${esc(ex)}</p>` : ''}
        ${choice ? '<div class="options"></div>' : `<input class="answer" ${inputAttrs} placeholder="La palabra…"><div class="btnrow"><button class="btn" data-check>Comprobar</button><button class="btn soft" data-skip>Saltar</button></div>`}<div data-fb></div>`;
      const answerLine = `<span class="big">${esc(artOf(w) + w.es)}</span><span class="small" lang="en">${esc(w.en)}</span>${latamTag(w)}`;
      if (choice) {
        const others = shuffle(pool.filter(x => x.id !== w.id && x.pos === w.pos && x.es !== w.es)).slice(0, 3);
        const opts = shuffle([w, ...others]); const box = el.querySelector('.options');
        box.innerHTML = opts.map((o, i) => `<button class="opt" data-i="${i}">${esc(o.es)}</button>`).join('');
        box.querySelectorAll('.opt').forEach(b => b.onclick = () => {
          const ok = opts[+b.dataset.i].id === w.id;
          box.querySelectorAll('.opt').forEach((x, i) => { x.disabled = true; if (opts[i].id === w.id) x.classList.add('ok'); else if (x === b) x.classList.add('no'); else x.classList.add('dim'); });
          el.querySelector('[data-fb]').innerHTML = feedback(ok ? 'ok' : 'no', (ok ? '¡Bien!' : 'Era esta:') + answerLine) + nextBtn();
          wireNext(el, () => api.done([{ key, grade: ok ? (it.easy ? 'casi' : 'ok') : 'no' }]));
        });
      } else {
        const inp = el.querySelector('input'); setTimeout(() => inp.focus(), 80);
        const go = () => {
          const tg = [w.es, ...(w.latam_alt ? [w.latam_alt] : [])];
          const r = check(inp.value, tg); const g = r.grade === 'empty' ? 'no' : r.grade;
          inp.readOnly = true; el.querySelector('.btnrow')?.remove();
          const note = r.corrected ? ` <span class="small">(se escribe así)</span>` : (r.shown === w.latam_alt ? ` <span class="small">En España: ${esc(w.es)}</span>` : '');
          el.querySelector('[data-fb]').innerHTML = feedback(g, (g === 'ok' ? '¡Eso es!' + note : 'Todavía no.') + answerLine) + nextBtn();
          wireNext(el, () => api.done([{ key, grade: g }]));
        };
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
        el.querySelector('[data-check]').onclick = go;
        el.querySelector('[data-skip]').onclick = () => api.done([{ key, grade: 'skip' }]);
      }
    },
  };
}

export function wtrCard(w, dir) {
  const key = 'w:' + w.id;
  dir = dir || (Math.random() < .5 ? 'en-es' : 'es-en');
  return {
    key, kind: 'wtr', family: 'w:',
    render(el, api) {
      const toEs = dir === 'en-es';
      el.innerHTML = `<div class="label">Traduce</div>
        <div class="prompt ${toEs ? 'en' : ''}" ${toEs ? 'lang="en"' : ''}>${esc(toEs ? w.en : artOf(w) + w.es)}</div>
        <input class="answer" ${inputAttrs} ${toEs ? '' : 'lang="en"'} placeholder="${toEs ? 'En español…' : 'En inglés…'}">
        <div class="btnrow"><button class="btn" data-check>Comprobar</button><button class="btn soft" data-skip>Saltar</button></div><div data-fb></div>`;
      const inp = el.querySelector('input'); setTimeout(() => inp.focus(), 80);
      const go = () => {
        let g, note = '';
        if (toEs) {
          let a = inp.value.replace(/^(el|la|los|las|un|una)\s+/i, '');
          const r = check(a, [w.es, ...(w.latam_alt ? [w.latam_alt] : [])]); g = r.grade === 'empty' ? 'no' : r.grade;
          if (g === 'ok' && w.latam_alt && strip(a) === strip(w.latam_alt)) note = ` <span class="small">En España se dice más «${esc(w.es)}».</span>`;
        } else {
          g = checkEnglish(inp.value, enVariants(w.en)).grade; if (g === 'empty') g = 'no';
        }
        inp.readOnly = true; el.querySelector('.btnrow')?.remove();
        el.querySelector('[data-fb]').innerHTML = feedback(g, (g === 'ok' ? '¡Eso es!' + note : 'Todavía no.') + `<span class="big">${esc(artOf(w) + w.es)}</span><span class="small" lang="en">${esc(w.en)}</span>`) + nextBtn();
        wireNext(el, () => api.done([{ key, grade: g }]));
      };
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
      el.querySelector('[data-check]').onclick = go;
      el.querySelector('[data-skip]').onclick = () => api.done([{ key, grade: 'skip' }]);
    },
  };
}

export function matchCard(words) {
  const keys = words.map(w => 'w:' + w.id);
  return {
    key: keys[0], keys, kind: 'match', family: 'w:',
    render(el, api) {
      const L = shuffle(words), R = shuffle(words);
      el.innerHTML = `<div class="label">Emparejar</div><p class="muted small">Toca una palabra y su pareja.</p>
        <div class="match"><div class="col">${L.map(w => `<button class="tile" data-id="${w.id}" data-side="es">${esc(w.es)}</button>`).join('')}</div>
        <div class="col">${R.map(w => `<button class="tile" lang="en" data-id="${w.id}" data-side="en">${esc(firstSense(w.en))}</button>`).join('')}</div></div><div data-fb></div>`;
      let sel = null; const mistakes = {}; let done = 0;
      el.querySelectorAll('.tile').forEach(t => t.onclick = () => {
        if (!sel || sel.dataset.side === t.dataset.side) { el.querySelectorAll('.tile.sel').forEach(x => x.classList.remove('sel')); sel = t; t.classList.add('sel'); return; }
        if (sel.dataset.id === t.dataset.id) {
          [sel, t].forEach(x => { x.classList.remove('sel'); x.classList.add('done'); }); sel = null; done++;
          api.react('cheer');
          if (done === words.length) {
            const res = words.map(w => ({ key: 'w:' + w.id, grade: !mistakes[w.id] ? 'ok' : mistakes[w.id] === 1 ? 'casi' : 'no' }));
            el.querySelector('[data-fb]').innerHTML = feedback('ok', '¡Todas emparejadas!') + nextBtn();
            wireNext(el, () => api.done(res));
          }
        } else {
          [sel, t].forEach(x => { x.classList.remove('sel'); x.classList.add('shake'); setTimeout(() => x.classList.remove('shake'), 400); });
          mistakes[sel.dataset.id] = (mistakes[sel.dataset.id] || 0) + 1; sel = null;
        }
      });
    },
  };
}

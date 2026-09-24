const U='http://localhost:8765/';
const log=(ok,n,x='')=>console.log((ok?'PASS':'FAIL')+' '+n+(x?' — '+x:''));
module.exports = async (p, ctx) => {
  await p.goto(U); await p.waitForTimeout(1500);
  await p.evaluate(()=>navigator.serviceWorker.ready); await p.waitForTimeout(1500);
  // ---- OFFLINE ----
  await ctx.setOffline(true);
  await p.reload(); await p.waitForTimeout(1500);
  const homeOk = await p.$('[data-today]'); log(!!homeOk,'offline: app loads in airplane mode');
  let answered=0;
  for (const [scr,m] of [['verbos','tabla'],['verbos','det'],['verbos','sig'],['verbos','vtr'],['palabras','emparejar'],['palabras','adivina'],['palabras','tarjetas'],['palabras','wtr']]) {
    await p.evaluate(s=>window.__charlita.go(s), scr); await p.waitForTimeout(300);
    await p.click(`[data-mode="${m}"]`); await p.waitForTimeout(300);
    // answer 2 cards generically
    for (let k=0;k<2;k++){
      if (await p.$('.tile')) { const ids=await p.$$eval('.tile[data-side="es"]',b=>b.map(x=>x.dataset.id)); for(const id of ids){await p.click(`.tile[data-side="es"][data-id="${id}"]`);await p.click(`.tile[data-side="en"][data-id="${id}"]`);} }
      else if (await p.$('[data-flip]')) { await p.click('[data-flip]'); await p.click('[data-g="ok"]'); answered++; continue; }
      else if (await p.$('.cell input')) { for (const i of await p.$$('.cell input')) await i.fill('x'); await p.click('[data-check]'); }
      else if (await p.$('.opt')) await p.click('.opt >> nth=0');
      else if (await p.$('input.answer, textarea.answer')) { await p.fill('input.answer, textarea.answer','hola'); await p.click('[data-check]'); if (await p.$('[data-g]')) { await p.click('[data-g="casi"]'); answered++; continue; } }
      await p.waitForTimeout(150); if (await p.$('[data-next]')) { await p.click('[data-next]'); answered++; }
      await p.waitForTimeout(150);
    }
  }
  const n = await p.evaluate(()=>window.__charlita.S.log.answers); log(n>=14,'offline: all 8 offline modes answer and save',`${n} answers stored`);
  // ---- FRUSTRATION: 3 misses on the same item -> rested + win follows ----
  const res = await p.evaluate(async()=>{
    const {S}=window.__charlita; const st=await import('./js/store.js');
    // seed some well-known items so wins exist
    for (const id of ['w0010','w0011','w0012']) await st.grade('w:'+id,'ok'), await st.grade('w:'+id,'ok');
    return true;});
  await p.evaluate(s=>window.__charlita.go(s),'palabras'); await p.waitForTimeout(200);
  await p.click('[data-mode="wtr"]'); await p.waitForTimeout(300);
  const target = await p.evaluate(()=>window.__charlita.card.key);
  let rested=false, bubble='', nextKind='', misses=0;
  for (let k=0;k<30;k++){
    if (!(await p.$('.prompt'))) break;
    const key = await p.evaluate(()=>window.__charlita.card.key);
    if (key===target){ if (await p.$('input.answer')) { await p.fill('input.answer','qqqqqqq'); await p.click('[data-check]'); } else { const wrong = await p.evaluate(()=>{const w=window.__charlita.D.W[window.__charlita.card.key.slice(2)].es; return [...document.querySelectorAll('.opt')].findIndex(b=>b.textContent!==w);}); await p.click(`.opt >> nth=${wrong}`); } await p.click('[data-next]'); misses++; await p.waitForTimeout(200);
      if (misses===3){ rested = await p.evaluate(t=>window.__charlita.S.items.get(t).restUntil>Date.now(), target); bubble=await p.textContent('[data-bubble]');
        nextKind = await p.evaluate(()=>{const c=window.__charlita.card; const it=window.__charlita.S.items.get(c.key); return c.kind+' box='+(it?it.box:0);}); break; }
      continue; }
    if (!(await p.$('input.answer'))) { const dbg = await p.evaluate(()=>window.__charlita.card.kind+' '+window.__charlita.card.key+' '+document.querySelector('[data-bubble]').textContent); console.log('  non-typed card:', dbg); if (await p.$('.opt')) { await p.click('.opt >> nth=0'); await p.click('[data-next]'); } else if (await p.$('[data-flip]')) { await p.click('[data-flip]'); await p.click('[data-g="ok"]'); } await p.waitForTimeout(150); continue; }
    const ans = await p.evaluate(()=>{const {card,D,S}=window.__charlita; const w=D.W[card.key.slice(2)]; const en=document.querySelector('.prompt').getAttribute('lang')==='en'; return en? w.es : w.en.split('/')[0];});
    await p.fill('input.answer', ans); await p.click('[data-check]'); await p.click('[data-next]'); await p.waitForTimeout(150);
  }
  log(rested,'frustration: 3 misses rests the item', bubble);
  log(/box=[345]/.test(nextKind), 'frustration: a known "win" item is served next', nextKind);
  // ---- REFRESH OFFLINE ----
  const rf = await p.evaluate(async()=>{
    const {S,refresh,db}=window.__charlita;
    const before=S.deck.reserveWords.length;
    let c=0; for (const [k,it] of S.items) if (k.startsWith('w:') && c<3){ const n={...it,mastered:true}; S.items.set(k,n); c++; }
    const r=await refresh('words');
    const retired=[...S.items.values()].filter(i=>i.retired).length;
    // verbs
    for (const v of ['ser']) for (const t of Object.keys(window.__charlita.D.V[v].t)) S.items.set(`tabla:${v}:${t}`, {key:`tabla:${v}:${t}`,box:5,seen:3,mastered:true,due:0,restUntil:0});
    const rv=await refresh('verbs');
    return {r,rv,before,after:S.deck.reserveWords.length,retired,verbs:S.deck.reserveVerbs};
  });
  log(rf.r.retired===3 && rf.after===rf.before+3,'refresh (offline): mastered words retired, reserve words pulled in', JSON.stringify(rf.r));
  log(rf.rv.added.length>=1,'refresh (offline): reserve verb pulled in', JSON.stringify(rf.rv));
  // ---- EXPORT -> WIPE -> IMPORT ----
  const ex = await p.evaluate(async()=>{
    const {db,S}=window.__charlita; const st=await import('./js/store.js');
    const dump=await db.exportAll(); const nItems=dump.stores.items.length; const ans=dump.stores.kv.log.answers;
    await db.wipe(); await st.loadState(); const wiped=S.items.size;
    await db.importAll(JSON.parse(JSON.stringify(dump))); await st.loadState();
    return {nItems, wiped, restored:S.items.size, ans, ans2:S.log.answers, deck:S.deck.reserveWords.length};
  });
  log(ex.wiped===0 && ex.restored===ex.nItems && ex.ans===ex.ans2,'export → wipe → import restores everything', JSON.stringify(ex));
  await ctx.setOffline(false);
};

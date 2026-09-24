const U='http://localhost:8765/';
module.exports = async (p) => {
  await p.goto(U); await p.waitForTimeout(1500);
  const r = await p.evaluate(async()=>{ const d=await import('./js/data.js'); return d.englishReadings('fui'); });
  const ok = r.includes('I went') && r.includes('I was');
  console.log((ok?'PASS':'FAIL')+' fui → "I went" and "I was" both accepted', JSON.stringify(r));
  const EN = /\b(the|and|you|your|what|with|this|next|check|skip|show|answer|settings|progress|home|start|word|words|back|save|cancel|delete|export|import|today|correct|wrong|try|again|good|great)\b/i;
  const bad=[];
  const scan = async (name) => { const t = await p.evaluate(()=>{ const out=[]; const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT); let n; while(n=w.nextNode()){ const s=n.textContent.trim(); if(!s) continue; if(n.parentElement.closest('[lang="en"]')) continue; if(n.parentElement.closest('script,style')) continue; out.push(s);} return out;}); t.forEach(s=>{ if(EN.test(s)) bad.push(name+': '+s); }); };
  const screens=['home','verbos','palabras','banco','progreso','ajustes'];
  for (const s of screens){ await p.evaluate(x=>window.__charlita.go(x),s); await p.waitForTimeout(300); await scan(s); }
  for (const [s,m] of [['verbos','tabla'],['verbos','det'],['verbos','sig'],['verbos','vtr'],['palabras','emparejar'],['palabras','adivina'],['palabras','tarjetas'],['palabras','wtr']]) {
    await p.evaluate(x=>window.__charlita.go(x),s); await p.waitForTimeout(200); await p.click(`[data-mode="${m}"]`); await p.waitForTimeout(250); await scan(m);
    if (await p.$('.opt')) { await p.click('.opt >> nth=0'); await p.waitForTimeout(150); await scan(m+'-fb'); }
  }
  console.log(bad.length?'FAIL English UI text:\n  '+bad.join('\n  '):'PASS no English UI text outside translation targets / tense cards');
};

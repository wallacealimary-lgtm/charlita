module.exports = async (p) => {
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(1500);
  const r = await p.evaluate(async()=>{
    const {db}=window.__charlita; const st=await import('./js/store.js');
    // simulate data saved by an older app version: profile without coach fields, custom goal, some progress
    const old = await db.get('kv','profile'); delete old.coach_notes; delete old.goals_history; old.main_goal='MI META PROPIA';
    await db.put('kv', old, 'profile'); await st.grade('w:w0001','ok');
    await st.loadState();
    return { goal: st.S.profile.main_goal, notes: Array.isArray(st.S.profile.coach_notes), hist: Array.isArray(st.S.profile.goals_history), item: st.S.items.get('w:w0001')?.box, schema: st.S.meta.schema };
  });
  const ok = r.goal==='MI META PROPIA' && r.notes && r.hist && r.item===2 && r.schema===1;
  console.log((ok?'PASS':'FAIL')+' update keeps progress + custom goals and adds new fields', JSON.stringify(r));
};

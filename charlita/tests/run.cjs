const { chromium, devices } = require('playwright');
const steps = require(process.argv[2]);
(async()=>{const b=await chromium.launch();
const ctx=await b.newContext({...devices['iPhone 13'], deviceScaleFactor:2});
const p=await ctx.newPage(); const errs=[];
p.on('pageerror',e=>errs.push('PAGEERR '+e.message)); p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text())});
try { await steps(p, ctx); } catch(e){ errs.push('STEP '+e.message); }
console.log(errs.length?errs.join('\n'):'no errors'); await b.close();})();

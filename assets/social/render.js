// Renders the X images: serve the repo root on port 8765 (python3 -m http.server 8765), then `node render.js`.
const {chromium}=require('playwright');
const at=(season,day,hour)=>((season*7+day-1+28*1000)+hour/24-0.3)*240*1000;
(async()=>{
 const b=await chromium.launch();
 for (const [name,season,hour] of [['x-header',0,10.5],['x-header-fall',2,17.6],['x-header-night',1,22]]) {
  const p=await b.newPage({viewport:{width:1500,height:500}});
  await p.addInitScript(t=>{Date.now=()=>t;},at(season,3,hour));
  await p.goto('http://localhost:8765/assets/social/header.html'); await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(2500);
  await p.screenshot({path:`/home/user/norita/assets/social/${name}.png`}); await p.close();
 }
 const a=await b.newPage({viewport:{width:400,height:400}});
 await a.goto('http://localhost:8765/assets/social/avatar.html'); await a.waitForTimeout(300);
 await a.screenshot({path:'/home/user/norita/assets/social/x-avatar.png'});
 await b.close(); console.log('ok');
})();

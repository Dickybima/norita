// Records assets/norita-gameplay.mp4 from the live game with Playwright.
// Serve the repo root on port 8765 (python3 -m http.server 8765), run `node record-gameplay.js`,
// then encode: ffmpeg -ss 0.8 -i raw.webm -an -c:v libx264 -crf 23 -pix_fmt yuv420p -movflags +faststart norita-gameplay.mp4
const {chromium}=require('playwright');
const fs=require('fs');
const BASE='http://localhost:8765';
const at=(season,day,hour)=>((season*7+day-1+28*1000)+hour/24-0.3)*240*1000;
(async()=>{
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:1280,height:720},recordVideo:{dir:'vid',size:{width:1280,height:720}}});
 await ctx.route('**/farm/config.js', async r=>{const res=await r.fetch();let t=await res.text();t=t.replace('enabled: true,','enabled: false,');r.fulfill({response:res,body:t});});
 await ctx.addInitScript(start=>{
   // controllable clock
   let last=performance.now(), virt=+sessionStorage.getItem('virt')||start; window.__speed=1;
   const tick=()=>{const n=performance.now(); virt+=(n-last)*window.__speed; last=n; sessionStorage.setItem('virt',virt); return virt;};
   Date.now=()=>Math.floor(tick()); window.__jump=(ms)=>{tick(); virt+=ms;};
   // captions + cursor overlay
   addEventListener('DOMContentLoaded',()=>{
     const st=document.createElement('style'); st.textContent=`
     #cap{position:fixed;left:50%;bottom:34px;transform:translate(-50%,20px);opacity:0;transition:opacity .35s,transform .35s;z-index:5000;
       font:400 34px 'Jersey 10',sans-serif;color:#fff4dc;background:rgba(59,36,18,.92);border:4px solid #f2b53a;border-radius:8px;padding:8px 22px;white-space:nowrap;
       box-shadow:0 6px 0 rgba(0,0,0,.4)}
     #cap.on{opacity:1;transform:translate(-50%,0)}
     #cur{position:fixed;z-index:6000;width:30px;height:30px;left:640px;top:360px;transition:left .55s ease-in-out,top .55s ease-in-out,transform .12s;pointer-events:none;image-rendering:pixelated}
     #cur.down{transform:scale(.8)}
     #end{position:fixed;inset:0;z-index:7000;display:grid;place-items:center;align-content:center;gap:18px;background:rgba(20,12,4,.94);opacity:0;transition:opacity .6s;text-align:center}
     #end.on{opacity:1} #end img{width:200px;image-rendering:pixelated}
     #end h1{font:44px 'Press Start 2P',monospace;color:#fff4dc;text-shadow:4px 4px 0 #3b2412} #end h1 b{color:#f2b53a}
     #end p{font:400 36px 'Jersey 10',sans-serif;color:#fff4dc}`;
     document.head.append(st);
     const cap=document.createElement('div'); cap.id='cap'; document.body.append(cap);
     const cur=document.createElement('img'); cur.id='cur';
     cur.src='data:image/svg+xml;base64,'+btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" shape-rendering="crispEdges"><path d="M0 0h1v1h1v1h1v1h1v1h1v1h1v1h1v1H4v1H3v1H2v1H1v-1H0z" fill="#000"/><path d="M1 2h1v1h1v1h1v1h1v1h1v1H4v1H3v1H2v-1H1z" fill="#fff"/></svg>');
     const pos=JSON.parse(sessionStorage.getItem('cur')||'[640,360]'); cur.style.left=pos[0]+'px'; cur.style.top=pos[1]+'px';
     document.body.append(cur);
     window.__cap=(t)=>{ if(!t){cap.classList.remove('on');return;} cap.textContent=t; cap.classList.add('on'); };
     window.__move=(x,y)=>{cur.style.left=x+'px';cur.style.top=y+'px';sessionStorage.setItem('cur',JSON.stringify([x,y]));};
     window.__press=()=>{cur.classList.add('down');setTimeout(()=>cur.classList.remove('down'),150);};
     window.__end=()=>{const e=document.createElement('div');e.id='end';e.innerHTML='<img src="/assets/logo.svg"><h1>Nori<b>ta</b></h1><p>A cozy pixel farm on Robinhood Chain</p><p>Join the whitelist on X · Early access soon</p>';document.body.append(e);requestAnimationFrame(()=>e.classList.add('on'));};
   });
 }, at(0,2,8.2));
 await ctx.addInitScript(()=>{
   const svg=(c,t)=>'data:image/svg+xml;base64,'+btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="${c}"/><text x="16" y="22" font-size="16" font-family="sans-serif" font-weight="700" fill="#fff" text-anchor="middle">${t}</text></svg>`);
   const mk=(name,rdns,c,t)=>{const p={request:async()=>[],on(){},removeListener(){}};
     const ann=()=>window.dispatchEvent(new CustomEvent('eip6963:announceProvider',{detail:Object.freeze({info:{uuid:rdns,name,icon:svg(c,t),rdns},provider:p})}));
     window.addEventListener('eip6963:requestProvider',ann);};
   mk('MetaMask','io.metamask','#f6851b','M'); mk('Rabby Wallet','io.rabby','#7084ff','R'); mk('OKX Wallet','com.okex.wallet','#111','O');
 });
 const p=await ctx.newPage();
 const W=ms=>p.waitForTimeout(ms);
 const fonts=()=>p.evaluate(()=>document.fonts.ready.then(()=>true));
 const cap=t=>p.evaluate(t=>window.__cap(t),t);
 async function tap(sel,{click=true,wait=650}={}){
   const bx=await p.locator(sel).first().boundingBox();
   await p.evaluate(([x,y])=>window.__move(x,y),[bx.x+bx.width*0.55,bx.y+bx.height*0.6]); await W(wait);
   if(click){ await p.evaluate(()=>window.__press()); await p.locator(sel).first().click(); }
 }
 // A. home
 await p.goto(BASE+'/'); await p.evaluate(()=>{localStorage.clear()}); await fonts(); await W(700);
 await cap('Norita: a cozy pixel farm on Robinhood Chain'); await W(3200);
 await tap('.app[href="farm/"]',{click:false}); await W(300); await cap(''); await W(300);
 await p.evaluate(()=>window.__press()); await p.click('.app[href="farm/"]');
 // B. start
 await p.waitForSelector('#join'); await fonts(); await W(400);
 await cap('Start with 6 plots of land and 20 NRT'); await W(1600);
 await tap('#join'); await W(1200);
 // C. plant
 await cap('Pick a seed, then tap a plot to plant it'); await W(600);
 await tap('[data-seed="0"]'); await W(300);
 for (const i of [0,1,2,3]) { await tap(`[data-plot="${i}"]`,{wait:420}); await W(150); }
 await W(900);
 // D. grow
 await cap('Crops grow in real time'); await p.evaluate(()=>window.__speed=7); await W(4600); await p.evaluate(()=>window.__speed=1);
 // E. harvest
 await cap('Harvest them for NRT and XP'); await W(500);
 await tap('#harvestAll'); await W(2200);
 // F. mid game
 await cap(''); await W(300);
 await p.evaluate(()=>{const n=Math.floor(Date.now()/1000);
   localStorage.setItem('norita:farm:guest',JSON.stringify({joined:true,bal:760,xp:255,count:8,plots:[
     {crop:2,plantedAt:n-200},{crop:2,plantedAt:n-130},{crop:3,plantedAt:n-120},{crop:3,plantedAt:n-60},
     {crop:1,plantedAt:n-40},{crop:0,plantedAt:0},{crop:0,plantedAt:0},{crop:0,plantedAt:0}]}));
   localStorage.setItem('norita:log:guest',JSON.stringify([{t:Date.now(),text:'Harvested 6 Potatoes (+168 NRT)'},{t:Date.now(),text:'Bought plot 7 (−50 NRT)'},{t:Date.now(),text:'Planted 2 Corns (−80 NRT)'}]));});
 await p.reload(); await p.waitForSelector('#plots .plot'); await fonts(); await W(400);
 await cap('Level up to unlock better seeds'); await W(900);
 await tap('[data-seed="2"]'); await W(400);
 await tap('#plantAll'); await W(1500);
 // G. buy land
 await cap('Grow your farm with more land'); await W(300);
 await tap('#buyPlot'); await W(1800);
 // H. wallet
 await cap('Connect MetaMask, Rabby, OKX and more'); await W(300);
 await tap('#connect'); await W(2400); await p.keyboard.press('Escape'); await W(400);
 // I. time-lapse on home
 await cap(''); await W(200);
 await p.goto(BASE+'/'); await fonts(); await W(300);
 await cap('Day and night, four seasons: the farm never sleeps');
 await p.evaluate(()=>window.__speed=160); await W(3200);
 await p.evaluate(()=>window.__jump(7*240*1000)); await W(2300);
 await p.evaluate(()=>window.__jump(7*240*1000)); await W(2300);
 await p.evaluate(()=>window.__jump(7*240*1000)); await W(2300);
 await p.evaluate(()=>window.__speed=1); await cap('');
 // J. end card
 await p.evaluate(()=>window.__end()); await W(4200);
 const v=p.video(); await ctx.close(); fs.renameSync(await v.path(),'raw.webm'); await b.close(); console.log('done');
})();

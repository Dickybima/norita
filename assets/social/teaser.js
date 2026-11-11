// Records the Norita teaser (assets/social/norita-teaser.mp4). Serve the repo root on port 8765
// (python3 -m http.server 8765), run `node teaser.js`, then encode teaser.webm with ffmpeg to H.264 MP4.
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
   Date.now=()=>Math.floor(tick()); window.__jump=(ms)=>{tick(); virt+=ms; sessionStorage.setItem('virt',virt);};
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
 }, at(0,2,9));
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
 const hideCursor=()=>p.evaluate(()=>{const c=document.getElementById('cur'); if(c) c.style.display='none';});
 async function tap(sel,{click=true,wait=450}={}){
   const bx=await p.locator(sel).first().boundingBox();
   await p.evaluate(([x,y])=>window.__move(x,y),[bx.x+bx.width*0.55,bx.y+bx.height*0.6]); await W(wait);
   if(click){ await p.evaluate(()=>window.__press()); await p.locator(sel).first().click(); }
 }
 // 1. title card
 await p.goto(BASE+'/assets/social/promo.html?title'); await hideCursor(); await fonts(); await W(3600);
 // 2. gameplay
 await p.goto(BASE+'/farm/'); await p.evaluate(()=>localStorage.clear()); await p.reload(); await p.waitForSelector('#join'); await fonts(); await W(200);
 await tap('#join'); await W(500);
 await cap('Plant seeds'); await tap('[data-seed="0"]',{wait:350});
 for (const i of [0,1,2,3,4,5]) { await tap(`[data-plot="${i}"]`,{wait:260}); }
 await W(300);
 await cap('Watch them grow'); await p.evaluate(()=>window.__speed=9); await W(3400); await p.evaluate(()=>window.__speed=1);
 await cap('Harvest $NORITA'); await tap('#harvestAll'); await W(1500);
 await cap(''); await W(150);
 await p.evaluate(()=>{const n=Math.floor(Date.now()/1000);
   localStorage.setItem('norita:farm:guest',JSON.stringify({joined:true,bal:760,xp:255,count:8,plots:[
     {crop:2,plantedAt:n-200},{crop:2,plantedAt:n-130},{crop:3,plantedAt:n-120},{crop:3,plantedAt:n-60},
     {crop:1,plantedAt:n-40},{crop:0,plantedAt:0},{crop:0,plantedAt:0},{crop:0,plantedAt:0}]}));});
 await p.reload(); await p.waitForSelector('#plots .plot'); await fonts(); await W(200);
 await cap('Level up and unlock new crops'); await tap('[data-seed="2"]',{wait:400}); await tap('#plantAll',{wait:350}); await W(900);
 await cap('Buy more land'); await tap('#buyPlot',{wait:350}); await W(1300);
 await cap('');
 // 3. time-lapse, no UI
 await p.goto(BASE+'/assets/social/promo.html?lapse'); await hideCursor(); await fonts();
 await cap('Day, night and four seasons');
 await p.evaluate(()=>window.__speed=200); await W(2200);
 for (let k=0;k<3;k++){ await p.evaluate(()=>window.__jump(7*240*1000)); await W(1500); }
 await p.evaluate(()=>window.__speed=1); await cap('');
 // 4. call to action
 await p.evaluate(()=>{const h=window.farmScene.clock().hour; window.__jump(((24-h+8.5)%24)*10000);});
 await p.goto(BASE+'/assets/social/promo.html?cta'); await hideCursor(); await fonts(); await W(4800);
 const v=p.video(); await ctx.close(); fs.renameSync(await v.path(),'teaser.webm'); await b.close(); console.log('done');
})();

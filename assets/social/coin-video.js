// Renders the spinning $NRTA coin frame by frame. Serve the repo root on port 8765, run
// `node coin-video.js ["tag line"] [outdir]`, then: ffmpeg -framerate 30 -i outdir/f%04d.png -c:v libx264 -crf 18 -pix_fmt yuv420p out.mp4
const {chromium}=require('playwright');const fs=require('fs');
const tag=process.argv[2]||''; const out=process.argv[3]||'cf';
(async()=>{fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out);
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1080}});
await p.goto('http://localhost:8765/assets/social/coin.html?render'+(tag?'&tag='+encodeURIComponent(tag):''));
await p.waitForFunction(()=>window.coinReady);await p.evaluate(()=>document.fonts.ready);
const FPS=30,LOOP=6;
for(let i=0;i<FPS*LOOP;i++){await p.evaluate(t=>window.drawFrame(t),i/FPS);await p.screenshot({path:`${out}/f${String(i).padStart(4,'0')}.png`});}
await b.close();console.log('frames',FPS*LOOP);})();

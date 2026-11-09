// Animated pixel-art farm drawn behind the page: a day/night cycle, four seasons,
// a farmer walking the path, chickens, a windmill, clouds, birds and fireflies.
// The world clock follows real time, so every visitor sees the same hour and season.
// Exposes window.farmScene.clock() for the page's in-game clock.
(() => {
  const PX = 4;            // CSS pixels per scene pixel
  const DAY = 240;         // real seconds per in-game day
  const SEASON_DAYS = 7;   // in-game days per season
  const SEASONS = ["Spring", "Summer", "Fall", "Winter"];

  const PAL = [
    { grass: "#72c04a", speck: "#5ea83a", far: "#8cc07a", near: "#66aa4a", tree: "#3f9a3a", treeHi: "#5fbf4a", crop: "#3f9a3a", cropHi: "#8bd84a", path: "#d9b779", fx: "#f6b6d0" },
    { grass: "#5fb83c", speck: "#4c9d30", far: "#79b56a", near: "#55a03d", tree: "#2f8a2f", treeHi: "#4fb03f", crop: "#2f8a2f", cropHi: "#5fbf4a", path: "#dcb874", fx: null },
    { grass: "#a9b84c", speck: "#8f9d3a", far: "#b7a86c", near: "#9aa64a", tree: "#c8702a", treeHi: "#e8a33a", crop: "#c99a2e", cropHi: "#ecc04a", path: "#d2ad72", fx: "#e07a2a" },
    { grass: "#e9f0f5", speck: "#cfdbe5", far: "#d5e2ec", near: "#e3ecf2", tree: "#3f6f55", treeHi: "#f4f8fb", crop: null, cropHi: null, path: "#d8d0c4", fx: "#ffffff" },
  ];

  const SKY = [[0, "#0e1433", "#26305e"], [5, "#121a40", "#2c3566"], [6, "#4a5fa8", "#f7b27a"], [8, "#4aa8f0", "#bfe6ff"],
    [16, "#4aa8f0", "#bfe6ff"], [18, "#5b6fc0", "#f59a5b"], [19.5, "#1f2758", "#5a4a85"], [21, "#0e1433", "#26305e"], [24, "#0e1433", "#26305e"]];
  const DARK = [[0, .55], [5, .55], [6.5, .2], [8, 0], [16.5, 0], [18.3, .18], [19.8, .42], [21, .55], [24, .55]];

  // ---------------------------------------------------------------- helpers
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join(""); };
  const seg = (table, h) => { for (let i = 1; i < table.length; i++) if (h <= table[i][0]) { const a = table[i - 1], b = table[i]; return [a, b, (h - a[0]) / (b[0] - a[0])]; } return [table[0], table[0], 0]; };
  let seed = 1;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  function clock(now = Date.now() / 1000) {
    const days = now / DAY + 0.3;
    const index = Math.floor(days), hour = (days - index) * 24;
    const season = Math.floor(index / SEASON_DAYS) % 4;
    const [a, b, t] = seg(DARK, hour);
    return { hour, season, seasonName: SEASONS[season], day: (index % SEASON_DAYS) + 1, dark: a[1] + (b[1] - a[1]) * t };
  }

  function sprite(rows, pal) {
    const c = document.createElement("canvas");
    c.width = rows[0].length; c.height = rows.length;
    const x = c.getContext("2d");
    rows.forEach((r, y) => [...r].forEach((ch, i) => { if (pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(i, y, 1, 1); } }));
    return c;
  }

  const FP = { h: "#e8c25a", H: "#b0802a", s: "#f2c29a", e: "#3a2414", c: "#d9534f", C: "#a83a36", p: "#7a5230", k: "#3a2414" };
  const farmerTop = ["...hhhh...", "..hhhhhh..", "..HHHHHH..", "hhhhhhhhhh", "..ssssss..", "..sssses..", "..ssssss..", ".cccccccc.", "scCccccCcs", ".cccccccc.", "..pppppp.."];
  const FARMER = [
    sprite([...farmerTop, "..pp..pp..", "..pp..pp..", "..kk..kk.."], FP),
    sprite([...farmerTop, ".pp....pp.", ".pp....pp.", ".kk....kk."], FP),
  ];
  const CP = { w: "#f7f3ea", W: "#d9d2c2", r: "#e0362c", o: "#f08a24", y: "#e8a630" };
  const CHICKEN = [
    sprite([".....r.", "....ww.", "w..wwwo", "wwWwww.", ".wwww..", "..y.y.."], CP),
    sprite([".......", ".......", "w...r..", "wwWwww.", ".wwwwwo", "..y.y.."], CP),
  ];

  // ---------------------------------------------------------------- canvas
  const cv = document.createElement("canvas");
  cv.className = "scene";
  cv.setAttribute("aria-hidden", "true");
  document.body.prepend(cv);
  const ctx = cv.getContext("2d");
  const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const disc = (cx, cy, r, c) => { ctx.fillStyle = c; for (let dy = -r; dy <= r; dy++) { const w = Math.floor(Math.sqrt(r * r - dy * dy)); ctx.fillRect(cx - w, cy + dy, 2 * w + 1, 1); } };

  let W = 0, H = 0, HZ = 0, farTop = [], nearTop = [], B = {};
  let stars = [], specks = [], trees = [], clouds = [], chickens = [], flies = [], drift = [], birds = [], smoke = [];
  const farmer = { x: 20, dir: 1, target: 40, wait: 0, step: 0 };
  let blade = 0, smokeT = 0, time = 0;

  function layout() {
    W = Math.ceil(innerWidth / PX); H = Math.ceil(innerHeight / PX);
    cv.width = W; cv.height = H;
    HZ = Math.round(H * 0.42);
    farTop = Array.from({ length: W }, (_, x) => HZ - Math.round(14 + 7 * Math.sin(x * 0.021 + 1) + 5 * Math.sin(x * 0.053 + 2.3)));
    nearTop = Array.from({ length: W }, (_, x) => HZ - Math.round(5 + 4 * Math.sin(x * 0.034 + 4) + 2 * Math.sin(x * 0.11 + 1)));
    seed = 7;
    stars = Array.from({ length: Math.round((W * HZ) / 120) }, () => ({ x: (rnd() * W) | 0, y: (rnd() * HZ * 0.8) | 0, p: rnd() * 6 }));
    specks = Array.from({ length: Math.round((W * (H - HZ)) / 30) }, () => ({ x: (rnd() * W) | 0, y: HZ + ((rnd() * (H - HZ)) | 0) }));
    trees = [];
    for (let x = 4; x < W - 2; x += 10 + ((rnd() * 16) | 0)) trees.push({ x, r: 3 + ((rnd() * 2) | 0) });
    clouds = Array.from({ length: Math.max(2, Math.round(W / 60)) }, () => ({ x: rnd() * W, y: 6 + rnd() * HZ * 0.35, s: 2 + ((rnd() * 3) | 0), v: 1 + rnd() * 2 }));
    chickens = Array.from({ length: W < 170 ? 1 : 3 }, () => ({ x: 4 + rnd() * (W - 12), y: HZ + 26 + ((rnd() * 4) | 0), dir: 1, target: rnd() * W, wait: 0, f: 0 }));
    flies = Array.from({ length: Math.round(W / 10) }, () => ({ x: rnd() * W, y: HZ + 8 + rnd() * (H - HZ - 10), p: rnd() * 6 }));
    drift = Array.from({ length: Math.round(W / 4) }, () => ({ x: rnd() * W, y: rnd() * H, v: 4 + rnd() * 6, p: rnd() * 6 }));
    // Put buildings in the margins beside the page content when there is room.
    const m = Math.floor((W - Math.min(W, Math.ceil(1112 / PX))) / 2), r0 = W - m;
    if (m >= 32) B = { barn: Math.round((m - 28) / 2), house: m >= 64 ? r0 + 34 : r0 + Math.round((m - 24) / 2), mill: m >= 64 ? r0 + 12 : null };
    else if (W < 170) B = { barn: null, house: Math.round(W * 0.06), mill: Math.round(W * 0.7) };
    else B = { barn: Math.round(W * 0.1), house: Math.round(W * 0.57), mill: Math.round(W * 0.84) };
    farmer.x = Math.min(farmer.x, W - 12); farmer.target = Math.min(farmer.target, W - 12);
  }

  // ---------------------------------------------------------------- buildings
  const base = () => HZ + 6;

  function barn(x) {
    const b = base(), w = 28;
    R(x, b - 14, w, 14, "#b8432f");
    for (let i = 0; i < 9; i++) R(x - 1 + i, b - 15 - i, w + 2 - 2 * i, 1, i % 3 ? "#7a2a1f" : "#68221a");
    R(x + 9, b - 10, 10, 10, "#f1e6d0"); R(x + 10, b - 9, 8, 9, "#8a2f22");
    for (let i = 0; i < 8; i++) { R(x + 10 + i, b - 9 + i, 1, 1, "#f1e6d0"); R(x + 17 - i, b - 9 + i, 1, 1, "#f1e6d0"); }
    R(x + 12, b - 21, 4, 3, "#f1e6d0"); R(x + 13, b - 20, 2, 2, "#3a2414");
  }

  function houseWindows(x, lit) {
    const b = base(), c = lit ? "#ffd86b" : "#8ec5e8";
    for (const wx of [x + 3, x + 17]) { R(wx, b - 10, 4, 4, c); R(wx + 2, b - 10, 1, 4, "#f1e3c4"); R(wx, b - 8, 4, 1, "#f1e3c4"); }
  }

  function house(x) {
    const b = base(), w = 24;
    R(x + 17, b - 24, 3, 7, "#8a4a32");
    R(x, b - 13, w, 13, "#f1e3c4"); R(x, b - 13, w, 1, "#d8c49c");
    for (let i = 0; i < 8; i++) R(x - 2 + i, b - 14 - i, w + 4 - 2 * i, 1, i % 3 ? "#3f6fa8" : "#2f5688");
    R(x + 10, b - 8, 5, 8, "#7a4a24"); R(x + 13, b - 4, 1, 1, "#e8c25a");
    houseWindows(x, false);
  }

  function mill(x) {
    const b = base();
    for (let i = 0; i < 26; i++) { const w = 10 - Math.round((i * 5) / 26); R(x + ((10 - w) >> 1), b - 1 - i, w, 1, i % 6 ? "#e8dcc0" : "#cbbd9c"); }
    R(x + 3, b - 6, 4, 6, "#7a4a24");
    R(x + 2, b - 30, 6, 4, "#8a4a32");
    const hx = x + 5, hy = b - 28;
    for (let k = 0; k < 4; k++) {
      const a = blade + (k * Math.PI) / 2, c = Math.cos(a), s = Math.sin(a);
      for (let d = 2; d <= 13; d++) {
        R(Math.round(hx + c * d), Math.round(hy + s * d), 1, 1, "#5c3a1a");
        if (d > 4) for (let o = 1; o <= 2; o++) R(Math.round(hx + c * d - s * o), Math.round(hy + s * d + c * o), 1, 1, "#f7f2e6");
      }
    }
    R(hx - 1, hy - 1, 2, 2, "#3a2414");
  }

  // ---------------------------------------------------------------- update
  function walker(o, speed, minX, maxX, dt) {
    if (o.wait > 0) { o.wait -= dt; return; }
    const d = o.target - o.x;
    if (Math.abs(d) < 1) { o.wait = 1 + Math.random() * 3; o.target = minX + Math.random() * (maxX - minX); return; }
    o.dir = Math.sign(d);
    o.x += o.dir * Math.min(Math.abs(d), speed * dt);
    o.step = (o.step || 0) + dt;
  }

  function update(dt) {
    time += dt;
    const k = clock(), pal = PAL[k.season];
    blade += dt * 1.1;
    clouds.forEach((c) => { c.x += c.v * dt; if (c.x - c.s * 8 > W) c.x = -c.s * 8; });
    walker(farmer, 9, 4, W - 14, dt);
    chickens.forEach((c) => { walker(c, 5, 2, W - 9, dt); c.f += dt; });
    if (k.dark < 0.3 && Math.random() < dt * 0.04) {
      const dir = Math.random() < 0.5 ? 1 : -1, y = 6 + Math.random() * HZ * 0.4;
      for (let i = 0; i < 3; i++) birds.push({ x: dir > 0 ? -6 - i * 6 : W + 6 + i * 6, y: y + (i % 2) * 3, dir, p: i });
    }
    birds.forEach((b) => (b.x += b.dir * 14 * dt));
    birds = birds.filter((b) => b.x > -30 && b.x < W + 30);
    smokeT += dt;
    if (smokeT > 0.35) { smokeT = 0; smoke.push({ x: B.house + 18, y: base() - 25, life: 0 }); }
    smoke.forEach((s) => { s.y -= 3 * dt; s.x += 1.5 * dt; s.life += dt; });
    smoke = smoke.filter((s) => s.life < 3);
    if (pal.fx) drift.forEach((d) => {
      d.y += d.v * dt * (k.season === 3 ? 1 : 0.7);
      d.x += Math.sin(time * 1.5 + d.p) * dt * 3 + dt * 2;
      if (d.y > H) { d.y = -2; d.x = Math.random() * W; }
      if (d.x > W) d.x = 0;
    });
    flies.forEach((f) => { f.x += Math.sin(time * 0.7 + f.p) * dt * 3; f.y += Math.cos(time * 0.9 + f.p) * dt * 2; });
  }

  // ---------------------------------------------------------------- draw
  function draw() {
    const k = clock(), pal = PAL[k.season], night = Math.min(1, k.dark / 0.5);
    const [a, b, t] = seg(SKY, k.hour);
    const top = mix(a[1], b[1], t), bottom = mix(a[2], b[2], t);

    // sky
    for (let y = 0; y < HZ; y++) R(0, y, W, 1, mix(top, bottom, y / HZ));
    if (night > 0.2) stars.forEach((s) => {
      ctx.globalAlpha = night * (0.5 + 0.5 * Math.sin(time * 2 + s.p));
      R(s.x, s.y, 1, 1, "#fff8d8");
    });
    ctx.globalAlpha = 1;

    // sun & moon
    if (k.hour >= 5.5 && k.hour <= 19.5) {
      const p = (k.hour - 5.5) / 14, x = Math.round(p * (W + 20) - 10), y = Math.round(HZ - Math.sin(p * Math.PI) * HZ * 0.75);
      ctx.globalAlpha = 0.25; disc(x, y, 9, "#fff2a8"); ctx.globalAlpha = 1;
      disc(x, y, 6, "#ffe066"); disc(x - 1, y - 1, 3, "#fff4b0");
    }
    if (k.hour >= 18.5 || k.hour <= 6.5) {
      const p = ((k.hour - 18.5 + 24) % 24) / 12, x = Math.round(p * (W + 20) - 10), y = Math.round(HZ - Math.sin(p * Math.PI) * HZ * 0.75);
      disc(x, y, 5, "#f2f0d8"); disc(x + 2, y - 1, 4, mix(top, bottom, Math.max(0, y) / HZ));
    }

    // clouds & birds
    const cloudC = mix("#ffffff", top, 0.15 + night * 0.55);
    clouds.forEach((c) => {
      const x = Math.round(c.x), y = Math.round(c.y), s = c.s;
      disc(x, y, s + 1, cloudC); disc(x + s * 2, y - 1, s + 2, cloudC); disc(x + s * 4, y, s + 1, cloudC);
      R(x - s, y, s * 6, s + 1, cloudC);
    });
    birds.forEach((bd) => {
      const up = Math.floor(time * 6 + bd.p) % 2, x = Math.round(bd.x), y = Math.round(bd.y), c = "#2b2b3a";
      if (up) { R(x, y, 1, 1, c); R(x + 1, y + 1, 2, 1, c); R(x + 3, y, 1, 1, c); }
      else { R(x, y + 1, 1, 1, c); R(x + 1, y, 2, 1, c); R(x + 3, y + 1, 1, 1, c); }
    });

    // hills
    for (let x = 0; x < W; x++) R(x, farTop[x], 1, HZ - farTop[x] + 1, pal.far);
    for (let x = 0; x < W; x++) R(x, nearTop[x], 1, HZ - nearTop[x] + 1, pal.near);
    trees.forEach((tr) => {
      const y = nearTop[tr.x] + 1;
      R(tr.x, y - 2, 1, 3, "#6b3f1f");
      disc(tr.x, y - tr.r - 2, tr.r, pal.tree);
      R(tr.x - 1, y - 2 * tr.r - 2, 2, 1, pal.treeHi);
      if (k.season === 3) R(tr.x - tr.r + 1, y - 2 * tr.r - 1, tr.r * 2 - 1, 1, pal.treeHi);
    });

    // ground, path, buildings
    R(0, HZ, W, H - HZ, pal.grass);
    specks.forEach((s) => R(s.x, s.y, 1, 1, pal.speck));
    R(0, HZ + 5, W, 9, pal.path); R(0, HZ + 5, W, 1, mix(pal.path, "#6b3f1f", 0.3)); R(0, HZ + 13, W, 1, mix(pal.path, "#6b3f1f", 0.3));
    if (B.barn !== null) barn(B.barn);
    if (B.mill !== null) mill(B.mill);
    house(B.house);
    smoke.forEach((s) => { ctx.globalAlpha = 0.7 * (1 - s.life / 3); R(Math.round(s.x), Math.round(s.y), s.life > 1.5 ? 2 : 1, s.life > 1.5 ? 2 : 1, "#e8e8e8"); });
    ctx.globalAlpha = 1;

    // fence
    R(0, HZ + 16, W, 1, "#a8794a"); R(0, HZ + 19, W, 1, "#a8794a");
    for (let x = 1; x < W; x += 6) { R(x, HZ + 15, 1, 6, "#8a5e34"); R(x, HZ + 15, 1, 1, "#c2925a"); }

    // fields
    const FY = HZ + 34;
    for (let y = FY, row = 0; y < H; y += 5, row++) {
      R(0, y, W, 3, k.season === 3 ? "#cfc8bd" : "#8a5a2e"); R(0, y, W, 1, k.season === 3 ? "#ffffff" : "#6e4522");
      if (!pal.crop) continue;
      for (let x = 2 + (row % 2) * 2; x < W; x += 4) {
        const lean = Math.sin(time * 2 + x * 0.3 + row) > 0.6 ? 1 : 0;
        R(x + lean, y - 2, 1, 2, pal.crop); R(x - 1 + lean, y - 2, 1, 1, pal.cropHi); R(x + 1 + lean, y - 3, 1, 1, pal.cropHi);
      }
    }

    // animals & farmer
    chickens.forEach((c) => {
      const f = c.wait > 0 ? Math.floor(c.f * 3) % 2 : 0;
      blit(CHICKEN[f], Math.round(c.x), c.y - 6, c.dir < 0);
    });
    const fr = farmer.wait > 0 ? 0 : Math.floor(farmer.step * 6) % 2;
    blit(FARMER[fr], Math.round(farmer.x), HZ + 12 - 13, farmer.dir < 0);

    // night: darken the land, then draw lights
    if (k.dark > 0.01) {
      ctx.fillStyle = `rgba(16,20,58,${k.dark})`;
      for (let x = 0; x < W; x++) ctx.fillRect(x, farTop[x], 1, H - farTop[x]);
    }
    if (k.dark > 0.25) {
      houseWindows(B.house, true);
      ctx.globalAlpha = 0.18; disc(B.house + 5, base() - 8, 4, "#ffd86b"); disc(B.house + 19, base() - 8, 4, "#ffd86b"); ctx.globalAlpha = 1;
      if (k.season !== 3) flies.forEach((f) => {
        const on = Math.sin(time * 3 + f.p * 5);
        if (on > 0.3) { ctx.globalAlpha = night * on; R(Math.round(f.x), Math.round(f.y), 1, 1, "#f6ff8a"); }
      });
      ctx.globalAlpha = 1;
    }

    // petals, leaves or snow
    if (pal.fx) {
      ctx.globalAlpha = k.season === 3 ? 0.9 : 0.8;
      drift.slice(0, k.season === 3 ? drift.length : drift.length / 3).forEach((d) => R(Math.round(d.x), Math.round(d.y), 1, 1, pal.fx));
      ctx.globalAlpha = 1;
    }
  }

  function blit(img, x, y, flip) {
    if (!flip) return ctx.drawImage(img, x, y);
    ctx.save(); ctx.translate(x + img.width, y); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0); ctx.restore();
  }

  // ---------------------------------------------------------------- loop
  layout();
  let resizeT;
  addEventListener("resize", () => { clearTimeout(resizeT); resizeT = setTimeout(() => { layout(); draw(); }, 120); });

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    draw();
    setInterval(draw, 10000);
  } else {
    let last = 0;
    const frame = (ms) => {
      requestAnimationFrame(frame);
      if (ms - last < 33) return; // ~30 fps is plenty for pixel art
      update(Math.min(0.1, (ms - last) / 1000 || 0));
      last = ms;
      draw();
    };
    requestAnimationFrame(frame);
  }

  window.farmScene = { clock };
})();

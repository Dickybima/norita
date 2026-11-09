(() => {
  const C = window.FARM_CONFIG, NET = C.network, CROPS = C.crops;
  const $ = (id) => document.getElementById(id);
  const isDemo = !C.farmContract;
  const now = () => Math.floor(Date.now() / 1000);
  const fmt = (v, d = 2) => Number(v).toLocaleString("en-US", { maximumFractionDigits: d });
  const short = (a) => a.slice(0, 6) + "…" + a.slice(-4);
  const levelOf = (xp) => Math.floor(xp / C.xpPerLevel) + 1;
  const plotPrice = (count) => C.firstPlotPrice * 2 ** (Math.max(count, C.startPlots) - C.startPlots);
  const dur = (s) => {
    s = Math.max(0, Math.ceil(s));
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
    return `${Math.floor(s / 3600)}h ${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}m`;
  };

  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };

  const SPR = window.FARM_SPRITES || {};
  const img = (name, cls = "") => `<img class="px ${cls}" src="${SPR[name]}" alt="">`;
  const plural = (n, name) => `${n} ${name}${n === 1 ? "" : name.endsWith("o") ? "es" : "s"}`;

  const ui = { account: null, farm: null, seed: store.get("norita:seed") ?? 0, busy: false, log: [] };

  // ---------------------------------------------------------------- engines
  // Both engines expose the same actions and return the farm as
  // { joined, bal, xp, count, plots: [{ crop /* id+1, 0 = empty */, plantedAt }] }.

  // Demo: same rules as contracts/NoritaFarm.sol, saved in localStorage.
  const local = {
    key: () => "norita:farm:" + (ui.account || "guest").toLowerCase(),
    async load() {
      return store.get(this.key()) || { joined: false, bal: 0, xp: 0, count: 0, plots: [] };
    },
    save(f) { store.set(this.key(), f); },
    async join() {
      const f = await this.load();
      if (f.joined) throw new Error("Already joined");
      Object.assign(f, { joined: true, bal: C.starterGrant, count: C.startPlots,
        plots: Array.from({ length: C.startPlots }, () => ({ crop: 0, plantedAt: 0 })) });
      this.save(f);
    },
    plantOn(f, i, c) {
      const crop = CROPS[c], p = f.plots[i];
      if (!p) throw new Error("No such plot");
      if (p.crop) throw new Error("Plot in use");
      if (levelOf(f.xp) < crop.minLevel) throw new Error(`${crop.name} needs level ${crop.minLevel}`);
      if (f.bal < crop.cost) throw new Error("Not enough NRT");
      f.bal -= crop.cost;
      p.crop = c + 1; p.plantedAt = now();
    },
    async plantMany(ids, c) {
      const f = await this.load();
      ids.forEach((i) => this.plantOn(f, i, c)); // all or nothing, like the contract
      this.save(f);
    },
    harvestOn(f, i) {
      const p = f.plots[i];
      if (!p || !p.crop) return null;
      const crop = CROPS[p.crop - 1];
      if (now() < p.plantedAt + crop.growTime) return null;
      p.crop = 0; p.plantedAt = 0;
      f.xp += crop.xp; f.bal += crop.reward;
      return crop;
    },
    async harvestAll() {
      const f = await this.load();
      const got = f.plots.map((_, i) => this.harvestOn(f, i)).filter(Boolean);
      if (!got.length) throw new Error("Nothing is ready to harvest yet");
      this.save(f);
      return got;
    },
    async buyPlot() {
      const f = await this.load();
      if (f.count >= C.maxPlots) throw new Error("No more land for sale");
      const price = plotPrice(f.count);
      if (f.bal < price) throw new Error("Not enough NRT");
      f.bal -= price; f.count += 1; f.plots.push({ crop: 0, plantedAt: 0 });
      this.save(f);
    },
  };

  // Live: reads and writes the NoritaFarm contract on Elysium.
  const chain = {
    reader() {
      if (!NET.rpcUrls[0]) throw new Error("Elysium RPC URL is not configured yet.");
      this._r ||= new ethers.Contract(C.farmContract, C.abi,
        new ethers.JsonRpcProvider(NET.rpcUrls[0], NET.chainId || undefined, { staticNetwork: !!NET.chainId }));
      return this._r;
    },
    async load() {
      if (!ui.account) return null;
      const r = this.reader();
      const [joined, f] = await Promise.all([r.joined(ui.account), r.getFarm(ui.account)]);
      return {
        joined, xp: Number(f.playerXp), count: Number(f.count),
        bal: Number(ethers.formatUnits(f.balance, 18)),
        plots: f.crop.map((c, i) => ({ crop: Number(c), plantedAt: Number(f.plantedAt[i]) })),
      };
    },
    async send(method, ...args) {
      await ensureChain();
      const signer = await new ethers.BrowserProvider(Wallet.provider).getSigner();
      const c = new ethers.Contract(C.farmContract, C.abi, signer);
      msg("Confirm in your wallet…");
      const tx = await c[method](...args);
      msg("Waiting for Elysium…");
      await tx.wait();
      return tx.hash;
    },
    join() { return this.send("join"); },
    plantMany(ids, c) { return ids.length === 1 ? this.send("plant", ids[0], c) : this.send("plantMany", ids, c); },
    async harvestAll() {
      const before = ui.farm;
      await this.send("harvestAll");
      return before.plots.filter((p) => p.crop && ready(p)).map((p) => CROPS[p.crop - 1]);
    },
    buyPlot() { return this.send("buyPlot"); },
  };

  const engine = isDemo ? local : chain;

  async function ensureChain() {
    const eth = Wallet.provider;
    if (!eth) throw new Error("Connect a wallet first.");
    if (!NET.chainId) throw new Error("Elysium chain ID is not configured yet.");
    const hex = "0x" + NET.chainId.toString(16);
    if ((await eth.request({ method: "eth_chainId" })).toLowerCase() === hex) return;
    try {
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hex }] });
    } catch (e) {
      if (e.code !== 4902) throw e;
      await eth.request({ method: "wallet_addEthereumChain", params: [{
        chainId: hex, chainName: NET.name, rpcUrls: NET.rpcUrls, nativeCurrency: NET.nativeCurrency,
        blockExplorerUrls: NET.explorer ? [NET.explorer] : undefined }] });
    }
  }

  // ---------------------------------------------------------------- helpers
  const ready = (p) => p.crop && now() >= p.plantedAt + CROPS[p.crop - 1].growTime;
  const emptyPlots = () => ui.farm.plots.map((p, i) => (p.crop ? -1 : i)).filter((i) => i >= 0);

  function msg(text, cls = "") { $("msg").textContent = text; $("msg").className = "msg " + cls; }

  function addLog(text, hash) {
    ui.log.unshift({ t: Date.now(), text, hash });
    ui.log = ui.log.slice(0, 30);
    store.set("norita:log:" + (ui.account || "guest").toLowerCase(), ui.log);
    renderLog();
  }

  async function act(fn, okText) {
    if (ui.busy) return;
    ui.busy = true; render();
    try {
      const res = await fn();
      const text = typeof okText === "function" ? okText(res) : okText;
      msg(text, "ok");
      addLog(text, typeof res === "string" ? res : null);
      await refresh();
    } catch (e) {
      msg(e.shortMessage || e.reason || e.message || "Something went wrong", "err");
    } finally {
      ui.busy = false; render();
    }
  }

  // ---------------------------------------------------------------- actions
  function plantOn(ids) {
    const c = ui.seed, crop = CROPS[c];
    const level = levelOf(ui.farm.xp);
    if (level < crop.minLevel) return msg(`${crop.name} unlocks at level ${crop.minLevel}.`, "err");
    const afford = Math.floor(ui.farm.bal / crop.cost);
    if (!afford) return msg(`Not enough NRT for ${crop.name} (${crop.cost} NRT).`, "err");
    ids = ids.slice(0, afford);
    act(() => engine.plantMany(ids, c),
      `Planted ${plural(ids.length, crop.name)} (−${fmt(crop.cost * ids.length)} NRT)`);
  }

  function harvestAll() {
    act(() => engine.harvestAll(), (got) => {
      const total = got.reduce((s, c) => s + c.reward, 0);
      const counts = {};
      got.forEach((c) => (counts[c.name] = (counts[c.name] || 0) + 1));
      const what = Object.entries(counts).map(([n, k]) => plural(k, n)).join(", ");
      return `Harvested ${what} (+${fmt(total)} NRT)`;
    });
  }

  function clickPlot(i) {
    const p = ui.farm.plots[i];
    if (!p.crop) return plantOn([i]);
    if (ready(p)) return harvestAll(); // one tx collects everything that is ready
    const crop = CROPS[p.crop - 1];
    msg(`${crop.name} is ready in ${dur(p.plantedAt + crop.growTime - now())}.`);
  }

  // Wallet.open() shows the wallet picker; the onChange hook below updates the page.
  const connect = () => Wallet.open();

  async function setAccount(acc) {
    ui.account = acc || null;
    $("connect").textContent = acc ? short(acc) : "Connect wallet";
    $("connect").title = acc && Wallet.info ? `${Wallet.info.name}: ${acc}` : "";
    ui.log = store.get("norita:log:" + (ui.account || "guest").toLowerCase()) || [];
    renderLog();
    await refresh();
  }

  async function refresh() {
    try { ui.farm = await engine.load(); }
    catch (e) { ui.farm = null; msg(e.message, "err"); }
    render();
  }

  // ---------------------------------------------------------------- rendering
  function render() {
    const f = ui.farm, needWallet = !isDemo && !ui.account;
    $("demo").hidden = !isDemo;
    $("startCard").hidden = !(needWallet || (f && !f.joined));
    $("game").hidden = !(f && f.joined);
    $("join").textContent = needWallet ? "Connect wallet to start farming" : `Start farming · get ${C.starterGrant} NRT`;
    $("join").disabled = ui.busy;

    if (!f || !f.joined) {
      ["bal", "lvl", "plotsStat"].forEach((id) => ($(id).textContent = "–"));
      $("xpfill").style.width = "0"; $("xptext").textContent = "";
      return;
    }
    const level = levelOf(f.xp), into = f.xp % C.xpPerLevel;
    $("bal").textContent = `${fmt(f.bal)} NRT`;
    $("lvl").textContent = level;
    $("xpfill").style.width = `${(into / C.xpPerLevel) * 100}%`;
    $("xptext").textContent = `${into} / ${C.xpPerLevel} XP`;
    $("plotsStat").textContent = `${f.count} / ${C.maxPlots}`;

    renderSeeds(level);
    renderPlots();

    const empties = emptyPlots().length, readyCount = f.plots.filter(ready).length;
    $("plantAll").disabled = ui.busy || !empties;
    $("plantAll").textContent = empties ? `Plant all empty (${empties})` : "No empty plots";
    $("harvestAll").disabled = ui.busy || !readyCount;
    $("harvestAll").textContent = readyCount ? `Harvest all (${readyCount})` : "Nothing to harvest";
    const maxed = f.count >= C.maxPlots;
    $("buyPlot").disabled = ui.busy || maxed;
    $("buyPlot").textContent = maxed ? "No more land for sale" : `Buy land · ${fmt(plotPrice(f.count))} NRT`;
  }

  function renderSeeds(level) {
    $("seeds").innerHTML = CROPS.map((c, i) => {
      const locked = level < c.minLevel;
      return `<li><button class="seed${i === ui.seed ? " sel" : ""}${locked ? " locked" : ""}" data-seed="${i}">
        <span class="icon">${img(c.sprite)}${locked ? `<span class="lock">Lv${c.minLevel}</span>` : ""}</span>
        <span class="info"><b>${c.name}</b><small>${locked ? `Unlocks at level ${c.minLevel}` : `${dur(c.growTime)} · +${c.xp} XP`}</small></span>
        <span class="price"><span>${c.cost}</span><small>→ ${c.reward}</small></span>
      </button></li>`;
    }).join("");
  }

  function renderPlots() {
    const t = now();
    $("plots").innerHTML = ui.farm.plots.map((p, i) => {
      if (!p.crop) {
        return `<button class="plot empty" data-plot="${i}" ${ui.busy ? "disabled" : ""}>
          ${img(CROPS[ui.seed].sprite, "ghost")}<span class="label">Plant</span></button>`;
      }
      const crop = CROPS[p.crop - 1], left = p.plantedAt + crop.growTime - t;
      const pct = Math.min(1, (t - p.plantedAt) / crop.growTime);
      if (left <= 0) {
        return `<button class="plot ready" data-plot="${i}" ${ui.busy ? "disabled" : ""}>
          ${img(crop.sprite, "crop")}<span class="sparkle"></span><span class="label">Harvest!</span></button>`;
      }
      return `<button class="plot growing" data-plot="${i}">
        ${img(pct < 0.4 ? "sprout" : pct < 0.8 ? "young" : crop.sprite, "crop sway")}
        <span class="label">${dur(left)}</span><span class="bar"><i style="width:${pct * 100}%"></i></span></button>`;
    }).join("");
  }

  function renderLog() {
    const explorer = NET.explorer && !isDemo ? NET.explorer.replace(/\/$/, "") : "";
    $("log").innerHTML = ui.log.length
      ? ui.log.map((l) => `<li><span>${l.text}</span><span class="when">${
          l.hash && explorer ? `<a href="${explorer}/tx/${l.hash}" target="_blank" rel="noopener">${short(l.hash)}</a>`
            : new Date(l.t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></li>`).join("")
      : `<li class="empty">No entries yet.</li>`;
  }

  // ---------------------------------------------------------------- events
  $("connect").onclick = connect;
  function renderClock() {
    const k = window.farmScene?.clock();
    if (!k) return;
    const h = Math.floor(k.hour), m = Math.floor((k.hour % 1) * 6) * 10;
    const night = k.hour < 6 || k.hour >= 19;
    $("clock").textContent = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    $("season").textContent = `${k.seasonName} ${k.day} · ${night ? "Night" : "Day"}`;
  }

  $("join").onclick = () => (!isDemo && !ui.account ? connect() : act(() => engine.join(), `Welcome to Norita! +${C.starterGrant} NRT`));
  $("plantAll").onclick = () => plantOn(emptyPlots());
  $("harvestAll").onclick = harvestAll;
  $("buyPlot").onclick = () => {
    const price = plotPrice(ui.farm.count);
    if (ui.farm.bal < price) return msg(`A new plot costs ${fmt(price)} NRT.`, "err");
    act(() => engine.buyPlot(), `Bought plot ${ui.farm.count + 1} (−${fmt(price)} NRT)`);
  };
  $("seeds").onclick = (e) => {
    const b = e.target.closest("[data-seed]");
    if (!b) return;
    ui.seed = Number(b.dataset.seed);
    store.set("norita:seed", ui.seed);
    msg(""); render();
  };
  $("plots").onclick = (e) => {
    const b = e.target.closest("[data-plot]");
    if (b && !ui.busy) clickPlot(Number(b.dataset.plot));
  };

  Wallet.init({ onChange: (w) => { if ((w.account || null) !== ui.account) setAccount(w.account); } });

  // Timers tick every second; growing plots re-render without touching the chain.
  setInterval(() => { renderClock(); if (ui.farm?.joined) render(); }, 1000);
  renderClock();
  $("heroCrop").src = SPR.pumpkin || "";
  setAccount(null);
})();

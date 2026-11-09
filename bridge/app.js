(() => {
  const C = window.BRIDGE_CONFIG, N = C.networks;
  const $ = (id) => document.getElementById(id);
  const state = { dir: "hype", account: null, provider: null, asset: C.assets[0], balFrom: null };
  const from = () => N[state.dir];
  const to = () => N[state.dir === "hype" ? "elysium" : "hype"];
  const isDemo = () => !from().bridgeContract;
  const fmt = (v, d = 6) => Number(v).toLocaleString("en-US", { maximumFractionDigits: d });
  const short = (a) => a.slice(0, 6) + "…" + a.slice(-4);

  // ---------- rendering ----------
  const netHTML = (n) =>
    `<span class="dot" style="background:${n.color}">${n.short[0]}</span><span class="name">${n.name}</span>`;

  function render() {
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.dir === state.dir));
    $("netFrom").innerHTML = netHTML(from());
    $("netTo").innerHTML = netHTML(to());
    $("destName").textContent = to().name;
    $("demo").hidden = !isDemo();
    $("eta").textContent = `~${C.etaMinutes[to().key]} min`;
    updateQuote();
    updateButton();
  }

  function updateQuote() {
    const amt = parseFloat($("amount").value);
    const sym = state.asset.symbol;
    if (!amt || amt <= 0) { $("receive").textContent = "0.0"; $("fee").textContent = "–"; $("youGet").textContent = "–"; return; }
    const fee = (amt * C.feeBps) / 10000, out = amt - fee;
    $("fee").textContent = `${fmt(fee)} ${sym} (${C.feeBps / 100}%)`;
    $("youGet").textContent = `${fmt(out)} ${sym}`;
    $("receive").textContent = fmt(out);
  }

  function validRecipient() {
    const r = $("recipient").value.trim();
    return !r || (window.ethers && ethers.isAddress(r));
  }

  function updateButton() {
    const b = $("submit"), amt = parseFloat($("amount").value);
    b.disabled = false;
    if (!state.account) return (b.textContent = "Connect wallet");
    if (!amt || amt <= 0) { b.disabled = true; return (b.textContent = "Enter an amount"); }
    if (!validRecipient()) { b.disabled = true; return (b.textContent = "Invalid recipient address"); }
    if (state.balFrom !== null && amt > state.balFrom) { b.disabled = true; return (b.textContent = `Insufficient ${state.asset.symbol}`); }
    b.textContent = `Bridge to ${to().name}`;
  }

  function msg(text, cls = "") { $("msg").textContent = text; $("msg").className = "msg " + cls; }

  // ---------- wallet ----------
  // Wallet.open() shows the wallet picker; onWallet() below updates the page.
  const connect = () => Wallet.open();

  function onWallet(w) {
    state.account = w.account;
    state.provider = w.provider ? new ethers.BrowserProvider(w.provider) : null;
    $("connect").textContent = w.account ? short(w.account) : "Connect wallet";
    $("connect").title = w.account && w.info ? `${w.info.name}: ${w.account}` : "";
    msg("");
    refreshBalances();
    updateButton();
  }

  async function balanceOn(net) {
    if (!state.account || !net.rpcUrls[0]) return null;
    const assetAddr = state.asset.address[net.key];
    if (!assetAddr) return null;
    const rpc = new ethers.JsonRpcProvider(net.rpcUrls[0], net.chainId || undefined, { staticNetwork: !!net.chainId });
    if (assetAddr === "native") return Number(ethers.formatUnits(await rpc.getBalance(state.account), 18));
    const erc = new ethers.Contract(assetAddr, ["function balanceOf(address) view returns (uint256)"], rpc);
    return Number(ethers.formatUnits(await erc.balanceOf(state.account), state.asset.decimals));
  }

  async function refreshBalances() {
    const sym = state.asset.symbol;
    const [a, b] = await Promise.all([balanceOn(from()).catch(() => null), balanceOn(to()).catch(() => null)]);
    state.balFrom = a;
    $("balFrom").textContent = a === null ? "–" : `${fmt(a, 4)} ${sym}`;
    $("balTo").textContent = b === null ? "–" : `${fmt(b, 4)} ${sym}`;
    updateButton();
  }

  async function ensureChain(net) {
    if (!net.chainId) throw new Error(`${net.name} chain ID is not configured yet.`);
    const hex = "0x" + net.chainId.toString(16);
    const eth = Wallet.provider;
    if (!eth) throw new Error("Connect a wallet first.");
    const current = await eth.request({ method: "eth_chainId" });
    if (current.toLowerCase() === hex) return;
    try {
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hex }] });
    } catch (e) {
      if (e.code !== 4902) throw e;
      await eth.request({ method: "wallet_addEthereumChain", params: [{
        chainId: hex, chainName: net.name, rpcUrls: net.rpcUrls, nativeCurrency: net.nativeCurrency,
        blockExplorerUrls: net.explorer ? [net.explorer] : undefined }] });
    }
    state.provider = new ethers.BrowserProvider(eth);
  }

  // ---------- bridge ----------
  async function bridge() {
    if (!state.account) return connect();
    const amount = $("amount").value.trim();
    const recipient = $("recipient").value.trim() || state.account;
    const src = from(), dst = to(), a = state.asset;
    const entry = { id: Date.now(), from: src.key, to: dst.key, amount, symbol: a.symbol, recipient, status: "pending", hash: null, demo: isDemo() };
    $("submit").disabled = true;

    try {
      if (isDemo()) {
        msg("Simulating transfer…");
        await new Promise((r) => setTimeout(r, 1200));
        entry.hash = "0x" + [...crypto.getRandomValues(new Uint8Array(32))].map((x) => x.toString(16).padStart(2, "0")).join("");
        addHistory(entry);
        msg(`Demo: ${amount} ${a.symbol} sent to ${dst.name}.`, "ok");
        setTimeout(() => setStatus(entry.id, "done"), 3000);
      } else {
        msg(`Switching to ${src.name}…`);
        await ensureChain(src);
        const signer = await state.provider.getSigner();
        const bridgeC = new ethers.Contract(src.bridgeContract, C.abi, signer);
        const value = ethers.parseUnits(amount, a.decimals);
        const tokenAddr = a.address[src.key];
        let tx;
        if (tokenAddr === "native") {
          msg("Confirm the transfer in your wallet…");
          tx = await bridgeC.deposit(recipient, { value });
        } else {
          const erc = new ethers.Contract(tokenAddr, ["function allowance(address,address) view returns (uint256)", "function approve(address,uint256) returns (bool)"], signer);
          if ((await erc.allowance(state.account, src.bridgeContract)) < value) {
            msg(`Approve ${a.symbol} in your wallet…`);
            await (await erc.approve(src.bridgeContract, value)).wait();
          }
          msg("Confirm the transfer in your wallet…");
          tx = await bridgeC.depositToken(tokenAddr, value, recipient);
        }
        entry.hash = tx.hash;
        addHistory(entry);
        msg("Transaction sent, waiting for confirmation…");
        await tx.wait();
        setStatus(entry.id, "confirmed");
        msg(`Sent. Funds arrive on ${dst.name} in ~${C.etaMinutes[dst.key]} min.`, "ok");
      }
      $("amount").value = "";
      updateQuote();
      refreshBalances();
    } catch (e) {
      msg(e.shortMessage || e.message || "Transfer failed", "err");
    }
    updateButton();
  }

  // ---------- history (stored per browser) ----------
  const KEY = "kelpbook-bridge-history";
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  const save = (h) => { try { localStorage.setItem(KEY, JSON.stringify(h.slice(0, 20))); } catch {} };
  function addHistory(e) { const h = load(); h.unshift(e); save(h); renderHistory(); }
  function setStatus(id, s) { const h = load(); const e = h.find((x) => x.id === id); if (e) { e.status = s; save(h); renderHistory(); } }

  function renderHistory() {
    const h = load(), ul = $("history");
    if (!h.length) return (ul.innerHTML = '<li class="empty">No transfers yet.</li>');
    ul.innerHTML = "";
    for (const e of h) {
      const li = document.createElement("li");
      const exp = N[e.from].explorer;
      const link = e.hash && exp && !e.demo ? `<a href="${exp}/tx/${e.hash}" target="_blank" rel="noopener">${short(e.hash)}</a>` : e.hash ? `<span>${short(e.hash)}</span>` : "";
      const label = e.status === "pending" ? "pending" : e.status === "confirmed" ? "confirmed" : "delivered";
      li.innerHTML = `<div><b>${fmt(e.amount)} ${e.symbol}</b> · ${N[e.from].name} → ${N[e.to].name}${e.demo ? " (demo)" : ""}<br>${link}</div><span class="status ${e.status !== "pending" ? "done" : ""}">${label}</span>`;
      ul.appendChild(li);
    }
  }

  // ---------- events ----------
  function setDir(d) { state.dir = d; state.balFrom = null; render(); refreshBalances(); }
  document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => setDir(t.dataset.dir)));
  $("flip").addEventListener("click", () => setDir(state.dir === "hype" ? "elysium" : "hype"));
  $("amount").addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
    updateQuote(); updateButton();
  });
  $("recipient").addEventListener("input", updateButton);
  $("max").addEventListener("click", () => {
    if (state.balFrom === null) return;
    // leave a little native balance for gas
    const v = Math.max(0, state.balFrom - (state.asset.address[from().key] === "native" ? 0.01 : 0));
    $("amount").value = v ? String(Math.floor(v * 1e6) / 1e6) : "";
    updateQuote(); updateButton();
  });
  $("connect").addEventListener("click", connect);
  $("submit").addEventListener("click", bridge);
  const sel = $("asset");
  C.assets.forEach((a, i) => sel.add(new Option(a.symbol, i)));
  sel.addEventListener("change", () => { state.asset = C.assets[sel.value]; render(); refreshBalances(); });

  Wallet.init({ onChange: onWallet });
  render();
  renderHistory();
})();

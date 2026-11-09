// Wallet picker shared by the Farm and Bridge pages.
//
// Finds every installed browser wallet through EIP-6963 (MetaMask, Rabby, OKX,
// Coinbase, Trust, Phantom, Brave, ...), lets the player choose one, and remembers
// the choice. Wallets that are not installed get an install link, and on a phone
// without a wallet browser they get an "open this page in the wallet app" link.
//
//   Wallet.init({ onChange })  start discovery; reconnects the last wallet silently
//   Wallet.open()              show the picker; resolves with the account or null
//   Wallet.disconnect()
//   Wallet.provider            the chosen EIP-1193 provider (or null)
//   Wallet.account             the connected address (or null)
//   Wallet.info                { name, icon, rdns } of the chosen wallet
//
// Theme it with CSS variables on :root: --w-bg, --w-card, --w-text, --w-dim, --w-line,
// --w-accent, --w-accent-text, --w-radius, --w-font, --w-shadow, --w-backdrop.
(() => {
  const LAST = "wallet:last";
  const store = {
    get() { try { return localStorage.getItem(LAST); } catch { return null; } },
    set(v) { try { v ? localStorage.setItem(LAST, v) : localStorage.removeItem(LAST); } catch {} },
  };

  const here = () => location.href.replace(/^https?:\/\//, "");
  // Popular wallets, shown with an install link when they are not detected.
  const KNOWN = [
    { rdns: "io.metamask", name: "MetaMask", color: "#f6851b", install: "https://metamask.io/download/",
      app: () => `https://metamask.app.link/dapp/${here()}` },
    { rdns: "io.rabby", name: "Rabby", color: "#7084ff", install: "https://rabby.io/" },
    { rdns: "com.okex.wallet", name: "OKX Wallet", color: "#111111", install: "https://www.okx.com/web3",
      app: () => `okx://wallet/dapp/url?dappUrl=${encodeURIComponent(location.href)}` },
    { rdns: "com.coinbase.wallet", name: "Coinbase Wallet", color: "#0052ff", install: "https://www.coinbase.com/wallet/downloads",
      app: () => `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(location.href)}` },
    { rdns: "com.trustwallet.app", name: "Trust Wallet", color: "#3375bb", install: "https://trustwallet.com/download",
      app: () => `https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(location.href)}` },
    { rdns: "app.phantom", name: "Phantom", color: "#ab9ff2", install: "https://phantom.com/download",
      app: () => `https://phantom.app/ul/browse/${encodeURIComponent(location.href)}?ref=${encodeURIComponent(location.origin)}` },
  ];
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const found = new Map(); // rdns -> { info, provider }
  const W = { provider: null, account: null, info: null };
  let onChange = () => {};
  let unbind = () => {};

  // ---------------------------------------------------------------- discovery
  window.addEventListener("eip6963:announceProvider", (e) => {
    const { info, provider } = e.detail || {};
    if (!info?.rdns || !provider) return;
    found.set(info.rdns, { info, provider });
    if (modal && !modal.hidden) renderList();
  });
  const discover = () => window.dispatchEvent(new Event("eip6963:requestProvider"));

  // Wallets that only inject window.ethereum (older ones) still work.
  function legacy() {
    const eth = window.ethereum;
    if (!eth || [...found.values()].some((w) => w.provider === eth)) return null;
    const name = eth.isRabby ? "Rabby" : eth.isOkxWallet ? "OKX Wallet" : eth.isCoinbaseWallet ? "Coinbase Wallet"
      : eth.isTrust ? "Trust Wallet" : eth.isMetaMask ? "MetaMask" : "Browser wallet";
    return { info: { rdns: "injected", name, icon: "" }, provider: eth };
  }

  const wallets = () => {
    const list = [...found.values()];
    const l = legacy();
    if (l) list.push(l);
    return list;
  };

  // ---------------------------------------------------------------- connect
  function bind(provider) {
    unbind();
    const acc = (a) => { W.account = a?.[0] || null; if (!W.account) clear(); onChange(W); };
    const disc = () => { clear(); onChange(W); };
    provider.on?.("accountsChanged", acc);
    provider.on?.("disconnect", disc);
    unbind = () => { provider.removeListener?.("accountsChanged", acc); provider.removeListener?.("disconnect", disc); };
  }

  function clear() {
    unbind(); unbind = () => {};
    Object.assign(W, { provider: null, account: null, info: null });
  }

  async function use(w, ask) {
    const accounts = await w.provider.request({ method: ask ? "eth_requestAccounts" : "eth_accounts" });
    if (!accounts?.[0]) return null;
    Object.assign(W, { provider: w.provider, account: accounts[0], info: w.info });
    store.set(w.info.rdns);
    bind(w.provider);
    onChange(W);
    return W.account;
  }

  async function disconnect() {
    const p = W.provider;
    clear();
    store.set(null);
    onChange(W);
    // Not every wallet supports this; it only makes the next connect ask again.
    try { await p?.request({ method: "wallet_revokePermissions", params: [{ eth_accounts: {} }] }); } catch {}
  }

  // ---------------------------------------------------------------- picker UI
  let modal, resolveOpen;

  const CSS = `
  .wm{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:16px;background:var(--w-backdrop,rgba(4,10,20,.6));backdrop-filter:blur(3px)}
  .wm[hidden]{display:none}
  .wm-box{width:100%;max-width:380px;max-height:calc(100vh - 32px);overflow:auto;background:var(--w-bg,#0d2430);color:var(--w-text,#eafff8);
    border:var(--w-border,1px solid rgba(127,245,214,.2));border-radius:var(--w-radius,18px);box-shadow:var(--w-shadow,0 20px 60px rgba(0,0,0,.45));
    font-family:var(--w-font,system-ui,sans-serif);padding:18px}
  .wm-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
  .wm-head h3{font:var(--w-title-font,600 18px system-ui,sans-serif);margin:0}
  .wm-x{background:none;border:0;color:var(--w-dim,#8fb9b0);font-size:26px;line-height:1;cursor:pointer;padding:2px 6px}
  .wm-sec{font-size:var(--w-small,13px);color:var(--w-dim,#8fb9b0);margin:14px 2px 6px}
  .wm-list{list-style:none;padding:0;margin:0;display:grid;gap:8px}
  .wm-item{width:100%;display:flex;align-items:center;gap:12px;padding:10px 12px;cursor:pointer;text-align:left;text-decoration:none;
    background:var(--w-card,rgba(255,255,255,.05));color:inherit;font:inherit;border:var(--w-item-border,1px solid rgba(127,245,214,.15));border-radius:var(--w-item-radius,12px)}
  .wm-item:hover{border-color:var(--w-accent,#7ff5d6)}
  .wm-item:disabled{opacity:.6;cursor:wait}
  .wm-ico{width:34px;height:34px;border-radius:9px;flex:none;display:grid;place-items:center;font:700 16px system-ui,sans-serif;color:#fff;overflow:hidden}
  .wm-ico img{width:100%;height:100%;object-fit:contain}
  .wm-name{flex:1;min-width:0}
  .wm-tag{font-size:var(--w-small,13px);color:var(--w-dim,#8fb9b0);white-space:nowrap}
  .wm-tag.on{color:var(--w-accent,#7ff5d6)}
  .wm-acct{display:flex;align-items:center;gap:10px;padding:12px;border-radius:var(--w-item-radius,12px);background:var(--w-card,rgba(255,255,255,.05));border:var(--w-item-border,1px solid rgba(127,245,214,.15))}
  .wm-acct code{flex:1;font-size:var(--w-small,13px);word-break:break-all}
  .wm-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}
  .wm-btn{padding:9px;border-radius:var(--w-item-radius,10px);cursor:pointer;font:inherit;background:var(--w-card,rgba(255,255,255,.06));color:inherit;border:var(--w-item-border,1px solid rgba(127,245,214,.2))}
  .wm-btn.danger{color:var(--w-danger,#ff8a8a)}
  .wm-msg{min-height:1.2em;margin-top:10px;font-size:var(--w-small,13px);color:var(--w-dim,#8fb9b0);text-align:center}
  .wm-msg.err{color:var(--w-danger,#ff8a8a)}
  .wm-note{margin-top:12px;font-size:var(--w-small,12px);color:var(--w-dim,#8fb9b0);text-align:center;line-height:1.4}
  `;

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function icon(src, name, color) {
    const box = el("span", "wm-ico");
    if (typeof src === "string" && /^data:image\/(svg\+xml|png|webp|jpeg|gif)[;,]/.test(src)) {
      const img = el("img"); img.src = src; img.alt = ""; box.append(img);
    } else {
      box.style.background = color || "#555";
      box.textContent = (name || "?")[0].toUpperCase();
    }
    return box;
  }

  function build() {
    const style = el("style"); style.textContent = CSS; document.head.append(style);
    modal = el("div", "wm");
    modal.hidden = true;
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "Connect a wallet");
    modal.innerHTML = `<div class="wm-box"><div class="wm-head"><h3></h3><button class="wm-x" aria-label="Close">×</button></div>
      <div class="wm-body"></div><p class="wm-msg"></p></div>`;
    modal.addEventListener("click", (e) => { if (e.target === modal || e.target.closest(".wm-x")) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) close(); });
    document.body.append(modal);
  }

  function msg(text, err) {
    const m = modal.querySelector(".wm-msg");
    m.textContent = text || ""; m.className = "wm-msg" + (err ? " err" : "");
  }

  function renderList() {
    const body = modal.querySelector(".wm-body");
    body.textContent = "";
    modal.querySelector("h3").textContent = W.account ? "Your wallet" : "Connect a wallet";

    if (W.account) {
      const acct = el("div", "wm-acct");
      acct.append(icon(W.info?.icon, W.info?.name), el("code", "", W.account));
      const row = el("div", "wm-row");
      const copy = el("button", "wm-btn", "Copy address");
      copy.onclick = async () => { try { await navigator.clipboard.writeText(W.account); msg("Address copied."); } catch { msg("Could not copy.", true); } };
      const out = el("button", "wm-btn danger", "Disconnect");
      out.onclick = async () => { await disconnect(); renderList(); msg("Disconnected."); };
      row.append(copy, out);
      body.append(acct, row, el("p", "wm-sec", "Switch wallet"));
    }

    const installed = wallets();
    const list = el("ul", "wm-list");
    installed.forEach((w) => {
      const li = el("li");
      const b = el("button", "wm-item");
      const current = W.provider === w.provider && W.account;
      b.append(icon(w.info.icon, w.info.name), el("span", "wm-name", w.info.name), el("span", "wm-tag" + (current ? " on" : ""), current ? "Connected" : "Detected"));
      b.onclick = async () => {
        list.querySelectorAll("button").forEach((x) => (x.disabled = true));
        msg(`Open ${w.info.name} to continue…`);
        try {
          const acc = await use(w, true);
          if (acc) { msg(""); close(acc); } else msg("No account was shared.", true);
        } catch (e) {
          msg(e?.code === 4001 ? "Request rejected in the wallet." : e?.message || "Could not connect.", true);
        } finally { list.querySelectorAll("button").forEach((x) => (x.disabled = false)); }
      };
      li.append(b); list.append(li);
    });
    if (!W.account) body.append(el("p", "wm-sec", installed.length ? "Installed" : "No wallet found in this browser"));
    if (installed.length) body.append(list);

    // Wallets that were not detected
    const have = new Set(installed.map((w) => w.info.rdns));
    const names = new Set(installed.map((w) => w.info.name.toLowerCase()));
    const missing = KNOWN.filter((k) => !have.has(k.rdns) && !names.has(k.name.toLowerCase()));
    if (missing.length) {
      const phone = isMobile && !installed.length;
      body.append(el("p", "wm-sec", phone ? "Open this page in a wallet app" : "Get a wallet"));
      const more = el("ul", "wm-list");
      missing.filter((k) => !phone || k.app).forEach((k) => {
        const li = el("li");
        const a = el("a", "wm-item");
        a.href = phone ? k.app() : k.install;
        if (!phone) { a.target = "_blank"; a.rel = "noopener"; }
        a.append(icon(null, k.name, k.color), el("span", "wm-name", k.name), el("span", "wm-tag", phone ? "Open app" : "Install"));
        li.append(a); more.append(li);
      });
      body.append(more);
    }
    if (!installed.length) body.append(el("p", "wm-note", isMobile
      ? "Tapping a wallet opens this page in that app's browser. Install the app first if you don't have it."
      : "After installing a wallet, reload this page."));
  }

  function open() {
    if (!modal) build();
    discover();
    msg("");
    renderList();
    modal.hidden = false;
    modal.querySelector(".wm-item, .wm-btn, .wm-x")?.focus();
    return new Promise((r) => (resolveOpen = r));
  }

  function close(account = W.account) {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    resolveOpen?.(account || null);
    resolveOpen = null;
  }

  // ---------------------------------------------------------------- start
  async function init(opts = {}) {
    onChange = opts.onChange || onChange;
    discover();
    const last = store.get();
    if (!last) return;
    // Give wallets a moment to announce themselves, then reconnect without a prompt.
    await new Promise((r) => setTimeout(r, 300));
    const w = wallets().find((x) => x.info.rdns === last);
    if (w) { try { await use(w, false); } catch {} }
  }

  Object.assign(W, { init, open, disconnect, close });
  window.Wallet = W;
})();

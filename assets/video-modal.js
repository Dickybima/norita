// Gameplay video player in a pop-up.
// Any element with data-video-open opens it. The video file comes from that
// element's data-video-src (an .mp4) and data-video-poster (an image).
// Theme it with CSS variables: --v-bg, --v-border, --v-radius, --v-shadow,
// --v-text, --v-title-font, --v-backdrop.
(() => {
  const CSS = `
  .vm{margin:auto;padding:0;border:0;background:transparent;max-width:min(960px,calc(100vw - 24px));width:100%;overflow:visible}
  .vm::backdrop{background:var(--v-backdrop,rgba(20,12,4,.7));backdrop-filter:blur(3px)}
  .vm-box{background:var(--v-bg,#fbeccb);border:var(--v-border,4px solid #5c3a1a);border-radius:var(--v-radius,8px);
    box-shadow:var(--v-shadow,0 8px 0 rgba(40,20,5,.5));padding:14px;color:var(--v-text,#3b2412)}
  .vm-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px}
  .vm-head h3{margin:0;font:var(--v-title-font,600 18px system-ui,sans-serif)}
  .vm-x{background:none;border:0;color:inherit;font-size:28px;line-height:1;cursor:pointer;padding:0 6px}
  .vm video{display:block;width:100%;aspect-ratio:16/9;background:#000;border-radius:4px}
  `;
  let dlg, video;

  function build() {
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.append(style);
    dlg = document.createElement("dialog");
    dlg.className = "vm";
    dlg.setAttribute("aria-label", "Gameplay video");
    dlg.innerHTML = `<div class="vm-box"><div class="vm-head"><h3>Norita gameplay</h3>
      <button class="vm-x" aria-label="Close">×</button></div>
      <video controls playsinline preload="none"></video></div>`;
    video = dlg.querySelector("video");
    dlg.querySelector(".vm-x").onclick = () => dlg.close();
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener("close", () => video.pause());
    document.body.append(dlg);
  }

  function open(src, poster) {
    if (!dlg) build();
    if (video.getAttribute("src") !== src) {
      video.src = src;
      if (poster) video.poster = poster;
    }
    dlg.showModal();
    video.play().catch(() => {}); // browsers may block autoplay with sound; the controls still work
  }

  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-video-open]");
    if (!b) return;
    e.preventDefault();
    open(b.dataset.videoSrc, b.dataset.videoPoster);
  });

  window.NoritaVideo = { open };
})();

function getTargetTime() {
    const t = new Date();
    t.setHours(23, 59, 59, 0);
    return t.getTime();
}
let cdInterval = null;
function startCountdown() {
    const el = document.getElementById("countdown");
    if (!el) return;
    const target = getTargetTime();
    clearInterval(cdInterval);
    cdInterval = setInterval(() => {
        const diff = target - Date.now();
        if (diff <= 0) { el.innerHTML = `<div class="cd-num" style="color:#16c784">ĐÃ KẾT THÚC</div>`; clearInterval(cdInterval); return; }
        const h = Math.floor(diff / 3600000);
        const m = Math.floor(diff % 3600000 / 60000);
        const s = Math.floor(diff % 60000 / 1000);
        const pad = n => String(n).padStart(2, "0");
        el.innerHTML = `
      <div class="cd-box"><div class="cd-num">${pad(h)}</div><div class="cd-label">Giờ</div></div>
      <span class="cd-sep">:</span>
      <div class="cd-box"><div class="cd-num">${pad(m)}</div><div class="cd-label">Phút</div></div>
      <span class="cd-sep">:</span>
      <div class="cd-box"><div class="cd-num">${pad(s)}</div><div class="cd-label">Giây</div></div>`;
    }, 1000);
}
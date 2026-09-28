let currentProduct = null;
let currentQty = 1;
let ytPlayer = null;

function getIdFromURL() {
  return parseInt(new URLSearchParams(location.search).get("id"));
}

function renderProductDetail() {
  const id = getIdFromURL();
  const p = getProductById(id);
  const box = document.getElementById("productContainer");

  if (!p) {
    box.innerHTML = `
      <div class="not-found">
        <h1 style="font-size:80px">🦊</h1>
        <h2 style="color:var(--text);margin:16px 0">Không tìm thấy sản phẩm</h2>
        <a href="category.html" class="btn" style="margin-top:20px">← Về danh mục</a>
      </div>`;
    return;
  }

  currentProduct = p;
  document.title = p.name + " - Fox Store";
  if (typeof addToViewed === "function") addToViewed(p.id);

  const badgeMap = { new: "Sản phẩm mới", hot: "Bán chạy", sale: "Khuyến mãi" };
  const badgeClass = { new: "badge-new", hot: "badge-hot", sale: "badge-sale" };
  const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  const catName = getCategories().find(c => c.slug === p.category)?.name || "Sản phẩm";
  const videoId = p.videoId || "";

  let thumbs = (p.images && p.images.length) ? p.images : [p.image];
  while (thumbs.length < 4) thumbs.push(thumbs[0]);

  box.innerHTML = `
    <div class="breadcrumb">
      <a href="index.html">Trang chủ</a> /
      <a href="category.html">Sản phẩm</a> /
      <a href="category.html?cat=${p.category}">${catName}</a> /
      <span>${p.name}</span>
    </div>

    <div class="product-detail">
      <div class="detail-gallery">
        <div class="detail-img-main">
          <img id="mainImg" src="${thumbs[0]}" alt="${p.name}">
        </div>
        <div class="detail-thumbs">
          ${thumbs.map((t, i) => `
            <div class="detail-thumb ${i === 0 ? 'active' : ''}" onclick="switchThumb(this, '${t}')">
              <img src="${t}" alt="thumb ${i + 1}">
            </div>`).join("")}
        </div>
      </div>

      <div class="detail-info">
        <span class="detail-badge ${badgeClass[p.group]}">${badgeMap[p.group]}</span>
        <h1 class="detail-title">${p.name}</h1>

        <div class="detail-meta">
          <span>Thương hiệu: <b>${p.brand}</b></span>
          <span>Danh mục: <b>${catName}</b></span>
          <span>Còn lại: <b>${p.stock}</b></span>
        </div>

        <div class="detail-price">
          <span class="now">${fmt(p.price)}</span>
          ${p.oldPrice ? `<span class="old">${fmt(p.oldPrice)}</span>` : ""}
          ${discount ? `<span class="discount">-${discount}%</span>` : ""}
        </div>

        <div class="detail-desc">${p.desc}</div>

        <div class="detail-qty">
          <label>Số lượng:</label>
          <div class="qty-control-lg">
            <button class="qty-btn" onclick="changeQtyDetail(-1)">−</button>
            <span class="qty-num" id="detailQty">1</span>
            <button class="qty-btn" onclick="changeQtyDetail(1)">+</button>
          </div>
        </div>

        <div class="detail-actions">
          <button class="btn btn-outline" onclick="handleAddCart()">🛒 Thêm vào giỏ</button>
          <button class="btn btn-buynow" onclick="handleBuyNow()">⚡ Mua ngay</button>
        </div>

        <div class="detail-policies">
          <div class="policy-item"><span class="ic">🚚</span>Miễn phí ship<br>đơn từ 500K</div>
          <div class="policy-item"><span class="ic">🛡️</span>Bảo hành<br>24 tháng</div>
          <div class="policy-item"><span class="ic">🔄</span>Đổi trả<br>7 ngày</div>
        </div>
      </div>
    </div>

    ${videoId ? `
      <div class="video-section">
        <h3>🎬 Video review sản phẩm</h3>
        <div class="video-wrap">
          <div id="ytPlayer"></div>
        </div>
        <div class="video-controls">
          <button onclick="playerAction('play')" id="btnPlay">▶ Play</button>
          <button onclick="playerAction('pause')" id="btnPause">⏸ Pause</button>
          <button onclick="playerAction('stop')">⏹ Stop</button>
          <button onclick="playerAction('rewind')" title="Tua ngược 10 giây">⏪ -10s</button>
          <button onclick="playerAction('forward')" title="Tua tới 10 giây">⏩ +10s</button>
          <button onclick="playerAction('mute')" id="btnMute">🔊 Mute</button>

          <div class="volume-wrap" title="Âm lượng">
            <span>🔉</span>
            <input type="range" id="volumeSlider" min="0" max="100" value="100"
                   oninput="setVolume(this.value)" class="volume-slider">
            <span id="volumeValue" style="color:var(--accent);font-size:12px;min-width:36px">100%</span>
          </div>

          <label class="cc-toggle" title="Bật/tắt phụ đề">
            <input type="checkbox" id="ccToggle" onchange="toggleCC(this.checked)">
            <span>💬 Phụ đề (CC)</span>
          </label>

          <button onclick="toggleFullscreen()" id="btnFull">⛶ Toàn màn hình</button>
        </div>
      </div>` : ""}

    <div class="tabs">
      <button class="tab active" onclick="switchTabDetail(this, 'tabDesc')">Mô tả chi tiết</button>
      <button class="tab" onclick="switchTabDetail(this, 'tabSpec')">Thông số</button>
      <button class="tab" onclick="switchTabDetail(this, 'tabPolicy')">Bảo hành & Đổi trả</button>
    </div>

    <div class="tab-panel active" id="tabDesc">
      <p>${p.desc}</p>
      <h4>Điểm nổi bật</h4>
      <ul>
        <li>Thiết kế cao cấp, độ bền cao.</li>
        <li>Thương hiệu ${p.brand} uy tín toàn cầu.</li>
        <li>Bảo hành chính hãng 24 tháng tại Fox Store.</li>
        <li>Hỗ trợ đổi trả trong 7 ngày nếu lỗi từ nhà sản xuất.</li>
      </ul>
    </div>

    <div class="tab-panel" id="tabSpec">
      <h4>Thông số kỹ thuật</h4>
      <ul>
        <li><b>Thương hiệu:</b> ${p.brand}</li>
        <li><b>Danh mục:</b> ${catName}</li>
        <li><b>Mã sản phẩm:</b> FOX-${String(p.id).padStart(4, "0")}</li>
        <li><b>Tình trạng:</b> Mới 100%, nguyên seal</li>
        <li><b>Xuất xứ:</b> Chính hãng</li>
      </ul>
    </div>

    <div class="tab-panel" id="tabPolicy">
      <h4>Chính sách bảo hành</h4>
      <ul>
        <li>Bảo hành <b>24 tháng</b> theo tiêu chuẩn nhà sản xuất.</li>
        <li>1 đổi 1 trong <b>30 ngày</b> nếu lỗi kỹ thuật từ NSX.</li>
      </ul>
      <h4>Chính sách đổi trả</h4>
      <ul>
        <li>Đổi trả trong <b>7 ngày</b> kể từ khi nhận hàng.</li>
        <li>Sản phẩm còn nguyên hộp, đầy đủ phụ kiện.</li>
      </ul>
    </div>

    <div id="relatedSection" style="margin-top:60px">
      <div class="section-head">
        <h2 class="section-title">Sản phẩm liên quan</h2>
      </div>
      <div class="product-grid" id="gridRelated"></div>
    </div>
  `;

  renderRelated(p);
  if (videoId) initYouTube(videoId);
}

function switchThumb(el, src) {
  document.getElementById("mainImg").src = src;
  document.querySelectorAll(".detail-thumb").forEach(t => t.classList.remove("active"));
  el.classList.add("active");
}

function changeQtyDetail(delta) {
  currentQty = Math.max(1, currentQty + delta);
  document.getElementById("detailQty").textContent = currentQty;
}

function handleAddCart() {
  if (currentProduct) addToCart(currentProduct.id, currentQty);
}

function handleBuyNow() {
  if (!currentProduct) return;
  addToCart(currentProduct.id, currentQty);
  setTimeout(() => location.href = "cart.html", 400);
}

function switchTabDetail(btn, panelId) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById(panelId).classList.add("active");
}

function renderRelated(p) {
  const list = getProducts().filter(x => x.category === p.category && x.id !== p.id).slice(0, 4);
  const box = document.getElementById("gridRelated");
  if (!list.length) {
    document.getElementById("relatedSection").style.display = "none";
    return;
  }
  box.innerHTML = list.map(productCardHTML).join("");
}

function initYouTube(videoId) {
  function createPlayer() {
    ytPlayer = new YT.Player("ytPlayer", {
      height: "100%",
      width: "100%",
      videoId: videoId,
      playerVars: {
        controls: 0,
        modestbranding: 1,
        rel: 0,
        origin: window.location.origin,
        cc_load_policy: 0,
        cc_lang_pref: "vi"
      },
      events: {
        onReady: () => {
          console.log("✅ YouTube Player ready");
          ytPlayer.setVolume(100);
        }
      }
    });
  }
  if (window.YT && window.YT.Player) createPlayer();
  else window.onYouTubeIframeAPIReady = createPlayer;
}

function playerAction(action) {
  if (!ytPlayer || !ytPlayer.getPlayerState) return;

  switch (action) {
    case "play":
      ytPlayer.playVideo();
      setActiveBtn("btnPlay");
      break;

    case "pause":
      ytPlayer.pauseVideo();
      setActiveBtn("btnPause");
      break;

    case "stop":
      ytPlayer.stopVideo();
      setActiveBtn(null);
      break;

    case "rewind": {
      const current = ytPlayer.getCurrentTime() || 0;
      const target = Math.max(0, current - 10);
      ytPlayer.seekTo(target, true);
      showToast("⏪ Tua ngược 10 giây");
      break;
    }

    case "forward": {
      const current = ytPlayer.getCurrentTime() || 0;
      const duration = ytPlayer.getDuration() || 0;
      const target = Math.min(duration, current + 10);
      ytPlayer.seekTo(target, true);
      showToast("⏩ Tua tới 10 giây");
      break;
    }

    case "mute": {
      const muted = ytPlayer.isMuted();
      muted ? ytPlayer.unMute() : ytPlayer.mute();
      document.getElementById("btnMute").textContent = muted ? "🔊 Mute" : "🔇 Unmute";
      const slider = document.getElementById("volumeSlider");
      const lbl = document.getElementById("volumeValue");
      if (!muted) {
        slider.value = 0;
        lbl.textContent = "0%";
      } else {
        const v = ytPlayer.getVolume();
        slider.value = v;
        lbl.textContent = v + "%";
      }
      break;
    }
  }
}

function setVolume(val) {
  if (!ytPlayer || !ytPlayer.setVolume) return;
  const v = Number(val);
  ytPlayer.setVolume(v);
  document.getElementById("volumeValue").textContent = v + "%";
  if (v > 0 && ytPlayer.isMuted()) {
    ytPlayer.unMute();
    document.getElementById("btnMute").textContent = "🔊 Mute";
  }
  if (v === 0) {
    ytPlayer.mute();
    document.getElementById("btnMute").textContent = "🔇 Unmute";
  }
}

function toggleCC(enabled) {
  if (!ytPlayer || !ytPlayer.loadModule) return;
  if (enabled) {
    ytPlayer.loadModule("captions");
    ytPlayer.setOption("captions", "track", { languageCode: "vi" });
    showToast("💬 Đã bật phụ đề");
  } else {
    ytPlayer.unloadModule("captions");
    ytPlayer.setOption("captions", "track", {});
    showToast("💬 Đã tắt phụ đề");
  }
}

function toggleFullscreen() {
  if (!ytPlayer || !ytPlayer.getIframe) return;
  const iframe = ytPlayer.getIframe();
  const wrap = iframe.parentElement;

  if (document.fullscreenElement) {
    document.exitFullscreen();
    document.getElementById("btnFull").textContent = "⛶ Toàn màn hình";
  } else {
    wrap.requestFullscreen?.().then(() => {
      document.getElementById("btnFull").textContent = "⛶ Thoát fullscreen";
    }).catch(() => iframe.requestFullscreen?.());
  }
}

document.addEventListener("fullscreenchange", () => {
  const btn = document.getElementById("btnFull");
  if (btn) btn.textContent = document.fullscreenElement ? "⛶ Thoát fullscreen" : "⛶ Toàn màn hình";
});

function setActiveBtn(id) {
  document.querySelectorAll(".video-controls button").forEach(b => b.classList.remove("active"));
  if (id) document.getElementById(id)?.classList.add("active");
}

document.addEventListener("DOMContentLoaded", () => {
  injectLayout("category");
  renderProductDetail();
});
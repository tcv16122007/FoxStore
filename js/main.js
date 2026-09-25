/* ═══ RENDER SẢN PHẨM ═══ */
function productCardHTML(p) {
  const badgeMap = { new: "MỚI", hot: "HOT", sale: "SALE" };
  const badgeClass = { new: "badge-new", hot: "badge-hot", sale: "badge-sale" };
  const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  const inCompare = (typeof getCompareList === "function") && getCompareList().includes(p.id);
  const outOfStock = p.stock === 0;

  if (outOfStock) {
    return `
      <div class="product-card out-of-stock">
        <div class="product-img">
          <span class="badge-tag badge-out">HẾT HÀNG</span>
          <img src="${p.image}" alt="${p.name}" loading="lazy">
        </div>
        <div class="product-info">
          <div class="product-name">${p.name}</div>
          <div class="product-price">
            <span class="price-now">${fmt(p.price)}</span>
          </div>
          <div class="product-actions">
            <button class="btn-sm btn-out" disabled>🚫 Đã bán hết</button>
          </div>
        </div>
      </div>`;
  }

  return `
    <div class="product-card" onclick="location.href='product.html?id=${p.id}'">
      <div class="product-img">
        <span class="badge-tag ${badgeClass[p.group]}">${badgeMap[p.group]}${discount ? ` -${discount}%` : ""}</span>
        <img src="${p.image}" alt="${p.name}" loading="lazy">
      </div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-price">
          <span class="price-now">${fmt(p.price)}</span>
          ${p.oldPrice ? `<span class="price-old">${fmt(p.oldPrice)}</span>` : ""}
        </div>
        <div class="product-actions">
          <button class="btn-sm btn-cart" onclick="event.stopPropagation();addToCart(${p.id})">🛒 Thêm vào giỏ</button>
          <button class="btn-sm ${inCompare ? 'btn-compare-active' : 'btn-compare'}"
                  onclick="event.stopPropagation();addToCompareAndGo(${p.id})">
            ⚖️ So sánh
          </button>
        </div>
      </div>
    </div>`;
}

function renderGroup(group, containerId) {
  const box = document.getElementById(containerId);
  if (!box) return;
  const list = getProducts().filter(p => p.group === group && p.stock > 0);
  box.innerHTML = list.map(productCardHTML).join("");
}

function renderOutOfStock() {
  const box = document.getElementById("gridOut");
  const wrap = document.getElementById("outSection");
  if (!box || !wrap) return;
  const list = getProducts().filter(p => p.stock === 0);
  if (!list.length) { wrap.style.display = "none"; return; }
  wrap.style.display = "block";
  box.innerHTML = list.map(productCardHTML).join("");
}

function renderHomeGroups() {
  renderGroup("new", "gridNew");
  renderGroup("hot", "gridHot");
  renderGroup("sale", "gridSale");
  renderOutOfStock();
  renderViewed();
}

/* ═══ TÌM KIẾM REALTIME ═══ */
function handleSearch(e) {
  const keyword = e.target.value.toLowerCase().trim();
  const box = document.getElementById("searchResult");
  if (!box) return;
  if (!keyword) { box.style.display = "none"; return; }
  const results = getProducts().filter(p =>
    p.name.toLowerCase().includes(keyword) ||
    p.brand.toLowerCase().includes(keyword) ||
    p.category.toLowerCase().includes(keyword)
  ).slice(0, 6);
  if (!results.length) {
    box.innerHTML = `<div style="padding:16px;color:var(--muted)">Không tìm thấy sản phẩm nào.</div>`;
  } else {
    box.innerHTML = results.map(p => `
      <a href="product.html?id=${p.id}" class="search-result-item">
        <img src="${p.image}" alt="">
        <div>
          <div style="font-size:13px;font-weight:600">${p.name}</div>
          <div style="color:var(--accent);font-weight:700;font-size:13px">${fmt(p.price)}</div>
        </div>
      </a>`).join("");
  }
  box.style.display = "block";
}
document.addEventListener("click", e => {
  if (!e.target.closest(".search-box")) {
    const box = document.getElementById("searchResult");
    if (box) box.style.display = "none";
  }
});

/* ═══ SẢN PHẨM ĐÃ XEM ═══ */
const VIEWED_KEY = "fox_viewed";
function addToViewed(id) {
  let list = JSON.parse(localStorage.getItem(VIEWED_KEY)) || [];
  list = list.filter(x => x !== id);
  list.unshift(id);
  list = list.slice(0, 6);
  localStorage.setItem(VIEWED_KEY, JSON.stringify(list));
}
function renderViewed() {
  const wrap = document.getElementById("viewedSection");
  const box = document.getElementById("gridViewed");
  if (!wrap || !box) return;
  const ids = JSON.parse(localStorage.getItem(VIEWED_KEY)) || [];
  const list = ids.map(id => getProductById(id)).filter(Boolean);
  if (!list.length) { wrap.style.display = "none"; return; }
  wrap.style.display = "block";
  box.innerHTML = list.map(productCardHTML).join("");
}

/* ═══ TOAST ═══ */
function showToast(msg) {
  let t = document.getElementById("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.className = "toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 2200);
}

/* ═══ INIT ═══ */
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("slider")) renderSlider();
  if (document.getElementById("countdown")) startCountdown();
  if (document.getElementById("gridNew")) renderHomeGroups();
  updateCartBadge();
  if (typeof updateCompareBadge === "function") updateCompareBadge();
});
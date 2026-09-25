const CART_KEY = "fox_cart";

function getCart() {
    const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    const valid = cart.filter(i => getProductById(i.id));
    if (valid.length !== cart.length) saveCart(valid);
    return valid;
}
function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    if (typeof updateCartBadge === "function") updateCartBadge();
}
function addToCart(productId, qty = 1) {
    const cart = getCart();
    const item = cart.find(i => i.id === productId);
    if (item) item.qty += qty;
    else {
        const p = getProductById(productId);
        if (!p) return;
        cart.push({ id: p.id, name: p.name, price: p.price, image: p.image, qty });
    }
    saveCart(cart);
    if (typeof showToast === "function") showToast("✅ Đã thêm vào giỏ hàng!");
}
function removeFromCart(id) {
    saveCart(getCart().filter(i => i.id !== id));
    if (document.getElementById("cartList")) renderCartPage();
}
function changeQty(id, delta) {
    const cart = getCart();
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) return removeFromCart(id);
    saveCart(cart);
    if (document.getElementById("cartList")) renderCartPage();
}
function clearCart() { saveCart([]); }
function getCartCount() { return getCart().reduce((s, i) => s + i.qty, 0); }
function getCartTotal() { return getCart().reduce((s, i) => s + i.price * i.qty, 0); }

function updateCartBadge() {
    const badge = document.getElementById("cartBadge");
    if (!badge) return;
    const count = getCartCount();
    badge.textContent = count;
    badge.style.display = count ? "grid" : "none";
}

function renderCartPage() {
    const box = document.getElementById("cartList");
    if (!box) return;
    const cart = getCart();
    const guestNotice = document.getElementById("guestNotice");
    const user = getCurrentUser();

    if (guestNotice) guestNotice.style.display = user ? "none" : "block";

    if (!cart.length) {
        box.innerHTML = `<div class="empty-state"><div class="icon">🛒</div><h3 style="color:var(--text);margin-bottom:8px">Giỏ hàng trống</h3><p><a href="category.html" style="color:var(--accent)">Mua sắm ngay →</a></p></div>`;
        const summary = document.getElementById("cartSummary");
        if (summary) summary.style.display = "none";
        return;
    }
    document.getElementById("cartSummary").style.display = "block";
    box.innerHTML = cart.map(i => `
    <div class="cart-item">
      <img src="${i.image}" alt="${i.name}">
      <div>
        <div style="font-weight:600;margin-bottom:6px">${i.name}</div>
        <div style="color:var(--accent);font-weight:700">${fmt(i.price)}</div>
      </div>
      <div class="qty-control">
        <button class="qty-btn" onclick="changeQty(${i.id}, -1)">−</button>
        <span class="qty-num">${i.qty}</span>
        <button class="qty-btn" onclick="changeQty(${i.id}, 1)">+</button>
      </div>
      <button class="btn-remove" onclick="removeFromCart(${i.id})" title="Xóa">🗑️</button>
    </div>`).join("");
    const subEl = document.getElementById("subtotal");
    const totalEl = document.getElementById("total");
    if (subEl) subEl.textContent = fmt(getCartTotal());
    if (totalEl) totalEl.textContent = fmt(getCartTotal());
}

/* ═══ MỞ FORM CHECKOUT ═══ */
function openCheckout() {
    if (!getCart().length) return showToast("❌ Giỏ hàng trống!");
    if (isGuest()) {
        showToast("🔐 Vui lòng đăng nhập để thanh toán!");
        sessionStorage.setItem("fox_redirect", "cart.html");
        setTimeout(() => location.href = "login.html", 800);
        return;
    }
    const modal = document.getElementById("checkoutModal");
    if (modal) {
        modal.classList.add("show");
        fillCitySelect();
        if (isUser() && !document.getElementById("ckName").value) {
            document.getElementById("ckName").value = getCurrentUser().name || "";
            document.getElementById("ckEmail").value = getCurrentUser().email || "";
        }
    }
}

/* ═══ ĐIỀN ĐỊA CHỈ ═══ */
function fillCitySelect() {
    const sel = document.getElementById("ckCity");
    if (!sel) return;
    sel.innerHTML = `<option value="">-- Chọn thành phố --</option>` +
        Object.keys(CITIES).map(c => `<option value="${c}">${c}</option>`).join("");
}

function onCityChange() {
    const city = document.getElementById("ckCity").value;
    const sel = document.getElementById("ckDistrict");
    if (!city) { sel.innerHTML = `<option value="">-- Chọn quận/huyện --</option>`; return; }
    sel.innerHTML = `<option value="">-- Chọn quận/huyện --</option>` +
        CITIES[city].map(d => `<option value="${d}">${d}</option>`).join("");
}

/* ═══ ĐỊNH VỊ ĐỊA CHỈ ═══ */
function fillAddressByGeo() {
    if (!navigator.geolocation) return showToast("❌ Trình duyệt không hỗ trợ Geolocation!");
    showToast("📍 Đang xác định vị trí...");
    navigator.geolocation.getCurrentPosition(
        pos => {
            const { latitude: lat, longitude: lng } = pos.coords;
            // Tâm Đà Nẵng: 16.0544, 108.2022
            const distDaNang = distanceKm(lat, lng, 16.0544, 108.2022);
            if (distDaNang < 40) {
                document.getElementById("ckCity").value = "Đà Nẵng";
                onCityChange();
                // Tìm quận gần nhất
                const districts = [
                    { name: "Hải Châu", lat: 16.0544, lng: 108.2022 },
                    { name: "Thanh Khê", lat: 16.0678, lng: 108.1904 },
                    { name: "Sơn Trà", lat: 16.0951, lng: 108.2461 },
                    { name: "Ngũ Hành Sơn", lat: 16.0037, lng: 108.2621 },
                    { name: "Liên Chiểu", lat: 16.0748, lng: 108.1517 },
                    { name: "Cẩm Lệ", lat: 16.0154, lng: 108.1997 },
                    { name: "Hòa Vang", lat: 15.9872, lng: 108.1385 }
                ];
                const nearest = districts.map(d => ({ ...d, dist: distanceKm(lat, lng, d.lat, d.lng) })).sort((a, b) => a.dist - b.dist)[0];
                document.getElementById("ckDistrict").value = nearest.name;
                showToast(`📍 Đã tự chọn ${nearest.name}, Đà Nẵng (cách ${nearest.dist.toFixed(1)} km)`);
            } else {
                showToast(`📍 Bạn cách Đà Nẵng ${distDaNang.toFixed(0)} km – vui lòng chọn thành phố thủ công.`);
            }
        },
        () => showToast("❌ Không lấy được vị trí!"),
        { timeout: 10000 }
    );
}

/* ═══ XỬ LÝ ĐẶT HÀNG ═══ */
function handleCheckoutSubmit(e) {
    e.preventDefault();
    const name = document.getElementById("ckName").value.trim();
    const phone = document.getElementById("ckPhone").value.trim();
    const city = document.getElementById("ckCity").value;
    const district = document.getElementById("ckDistrict").value;
    const detail = document.getElementById("ckDetail").value.trim();

    if (!name) return showToast("❌ Vui lòng nhập họ tên!");
    if (!validatePhone(phone)) return showToast("❌ Số điện thoại không hợp lệ!");
    if (!city) return showToast("❌ Vui lòng chọn thành phố!");
    if (!district) return showToast("❌ Vui lòng chọn quận/huyện!");
    if (!detail) return showToast("❌ Vui lòng nhập địa chỉ chi tiết!");

    const items = getCart();
    const total = getCartTotal();
    const order = createOrder(items, total, { name, phone, city, district, detail });

    clearCart();
    document.getElementById("checkoutModal").classList.remove("show");
    showToast(`✅ Đặt hàng thành công! Mã đơn: ${order.id}`);
    setTimeout(() => location.href = "orders.html", 1200);
}
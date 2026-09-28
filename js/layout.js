function getHeaderHTML(active) {
  const u = getCurrentUser();
  let roleTag = `<span style="color:var(--muted);font-size:11px">GUEST</span>`;
  if (u) {
    if (u.role === "admin") roleTag = `<span style="color:#000;background:var(--accent);padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700">ADMIN</span>`;
    else if (u.shipperStatus === "approved") roleTag = `<span style="color:#000;background:#00a8ff;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700">SHIPPER</span>`;
    else if (u.shipperStatus === "pending") roleTag = `<span style="color:#ffb020;background:rgba(255,176,32,.15);padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700">⏳ CHỜ DUYỆT</span>`;
    else roleTag = `<span style="color:var(--accent);font-size:11px;font-weight:600">USER</span>`;
  }

  const adminBtn = isAdmin() ? `<a href="admin.html" class="icon-btn" title="Quản trị">⚙</a>` : "";
  const shipperBtn = isShipper() ? `<a href="shipper.html" class="icon-btn" title="Đơn giao" style="color:#00a8ff;border-color:#00a8ff">🚚</a>` : "";
  const ordersBtn = u ? `<a href="orders.html" class="icon-btn" title="Đơn hàng">📦</a>` : "";
  const notifBtn = u ? `<a href="notifications.html" class="icon-btn" title="Thông báo">🔔<span class="badge" id="notifBadge" style="display:none">0</span></a>` : "";
  const msgBtn = u ? `<a href="messages.html" class="icon-btn" title="Tin nhắn">💬<span class="badge" id="msgBadge" style="display:none">0</span></a>` : "";

  const authBtn = u
    ? `<span class="user-info">${u.name} ${roleTag}</span>${ordersBtn}${shipperBtn}${adminBtn}<button class="icon-btn" onclick="logout()" title="Đăng xuất">⎋</button>`
    : `<a href="login.html" class="icon-btn" title="Đăng nhập">👤</a>`;
  const link = (href, label, key) => `<a href="${href}" class="${active === key ? 'active' : ''}">${label}</a>`;

  return `
    <header class="header">
      <div class="header-inner">
        <a href="index.html" class="logo">🦊 FOX<span>STORE</span></a>
        <nav class="nav">
          ${link("index.html", "Trang chủ", "home")}
          ${link("category.html", "Sản phẩm", "category")}
          ${link("compare.html", "So sánh", "compare")}
          ${link("contact.html", "Liên hệ", "contact")}
          ${u ? link("orders.html", "Đơn hàng", "orders") : ""}
        </nav>
        <div class="search-box">
          <input type="text" id="searchInput" placeholder="Tìm chuột, bàn phím..." oninput="handleSearch(event)">
          <div class="search-result-box" id="searchResult"></div>
        </div>
        <div class="header-actions" id="authArea">${authBtn}</div>
        ${notifBtn}${msgBtn}
        <a href="cart.html" class="icon-btn" title="Giỏ hàng">🛒<span class="badge" id="cartBadge" style="display:none">0</span></a>
      </div>
    </header>`;
}

function getFooterHTML() {
  return `
    <footer class="footer">
      <div class="footer-inner">
        <div>
          <div class="logo" style="margin-bottom:12px">🦊 FOX<span>STORE</span></div>
          <p>Hệ thống bán lẻ phụ kiện PC/Laptop chính hãng. Bảo hành 24 tháng.</p>
        </div>
        <div>
          <h4>Danh mục</h4>
          <a href="category.html?cat=chuot">Chuột</a><br>
          <a href="category.html?cat=banphim">Bàn phím</a><br>
          <a href="category.html?cat=tainghe">Tai nghe</a>
        </div>
        <div>
          <h4>Hỗ trợ</h4>
          <a href="contact.html">Liên hệ</a><br>
          <a href="#">Chính sách bảo hành</a>
        </div>
        <div>
          <h4>Liên hệ</h4>
          <p>📞 0987654321</p>
          <p>✉️ contact@foxstore.com</p>
          <p>📍 Đà Nẵng</p>
        </div>
      </div>
      <div class="footer-bottom">© 2026 Fox Store - Assignment WEB1044</div>
    </footer>`;
}

function injectLayout(active) {
  const h = document.getElementById("header");
  const f = document.getElementById("footer");
  if (h) h.innerHTML = getHeaderHTML(active);
  if (f) f.innerHTML = getFooterHTML();
  updateCartBadge();
  if (typeof updateCompareBadge === "function") updateCompareBadge();
  if (typeof updateMsgBadge === "function") updateMsgBadge();
  if (typeof updateNotifBadge === "function") updateNotifBadge();
}

function injectAdminLayout() {
  const h = document.getElementById("header");
  const f = document.getElementById("footer");
  if (h) h.innerHTML = `
    <header class="admin-topbar">
      <div class="admin-topbar-inner">
        <a href="admin.html" class="logo">
          🦊 FOX<span>STORE</span>
          <span class="role-badge admin-badge">ADMIN</span>
        </a>
        <div class="admin-topbar-actions">
          <a href="index.html" class="topbar-btn" title="Xem shop">🏠 Shop</a>
          <a href="messages.html" class="topbar-btn" title="Tin nhắn">💬 <span class="topbar-badge" id="msgBadge" style="display:none">0</span></a>
          <a href="notifications.html" class="topbar-btn" title="Thông báo">🔔 <span class="topbar-badge" id="notifBadge" style="display:none">0</span></a>
          <button class="topbar-btn danger" onclick="logout()" title="Đăng xuất">⎋ Đăng xuất</button>
        </div>
      </div>
    </header>`;
  if (f) f.innerHTML = `<div class="admin-footer">© 2026 Fox Store Admin Panel - WEB1044</div>`;
  if (typeof updateMsgBadge === "function") updateMsgBadge();
  if (typeof updateNotifBadge === "function") updateNotifBadge();
}

function injectShipperLayout() {
  const h = document.getElementById("header");
  const f = document.getElementById("footer");
  if (h) h.innerHTML = `
    <header class="admin-topbar shipper-topbar">
      <div class="admin-topbar-inner">
        <a href="shipper.html" class="logo">
          🦊 FOX<span>STORE</span>
          <span class="role-badge shipper-badge">SHIPPER</span>
        </a>
        <div class="admin-topbar-actions">
          <a href="index.html" class="topbar-btn" title="Xem shop">🏠 Shop</a>
          <a href="messages.html" class="topbar-btn" title="Tin nhắn">💬 <span class="topbar-badge" id="msgBadge" style="display:none">0</span></a>
          <a href="notifications.html" class="topbar-btn" title="Thông báo">🔔 <span class="topbar-badge" id="notifBadge" style="display:none">0</span></a>
          <button class="topbar-btn danger" onclick="logout()" title="Đăng xuất">⎋ Đăng xuất</button>
        </div>
      </div>
    </header>`;
  if (f) f.innerHTML = `<div class="admin-footer shipper-footer">© 2026 Fox Store Shipper Panel - WEB1044</div>`;
  if (typeof updateMsgBadge === "function") updateMsgBadge();
  if (typeof updateNotifBadge === "function") updateNotifBadge();
}
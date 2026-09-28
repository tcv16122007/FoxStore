let editingId = null;
let adminSort = { field: "id", dir: "asc" };

function switchAdminTab(tab) {
  document.querySelectorAll(".admin-tabs button").forEach(b =>
    b.classList.toggle("active", b.dataset.tab === tab)
  );

  ["products", "orders", "shippers", "analytics", "reviews", "broadcasts"].forEach(t => {
    const el = document.getElementById("tab" + t.charAt(0).toUpperCase() + t.slice(1));
    if (el) el.style.display = t === tab ? "block" : "none";
  });

  if (tab === "orders") renderAdminOrders();
  else if (tab === "shippers") renderAdminShippers();
  else if (tab === "analytics") renderAnalytics();
  else if (tab === "reviews") renderAdminReviews();
  else if (tab === "broadcasts") renderBroadcasts();
  else renderAdminTable();
}

function changeAdminSort() {
  adminSort.field = document.getElementById("adminSortField").value;
  adminSort.dir = document.getElementById("adminSortDir").value;
  renderAdminTable();
}

function getSortedProducts() {
  const list = [...getProducts()];
  const f = adminSort.field;
  const d = adminSort.dir === "asc" ? 1 : -1;
  if (f === "id") list.sort((a, b) => (a.id - b.id) * d);
  if (f === "name") list.sort((a, b) => a.name.localeCompare(b.name, "vi") * d);
  if (f === "price") list.sort((a, b) => (a.price - b.price) * d);
  if (f === "stock") list.sort((a, b) => (a.stock - b.stock) * d);
  if (f === "group") list.sort((a, b) => a.group.localeCompare(b.group) * d);
  if (f === "rating") {
    list.sort((a, b) => {
      const ra = typeof getProductAvgStars === "function" ? getProductAvgStars(a.id) : 0;
      const rb = typeof getProductAvgStars === "function" ? getProductAvgStars(b.id) : 0;
      return (ra - rb) * d;
    });
  }
  return list;
}

function renderAdminTable() {
  const list = getSortedProducts();
  const tbody = document.getElementById("adminTbody");
  if (!tbody) return;

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--muted)">Chưa có sản phẩm.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(p => {
    const avg = typeof getProductAvgStars === "function" ? getProductAvgStars(p.id) : 0;
    const cnt = typeof getProductReviewCount === "function" ? getProductReviewCount(p.id) : 0;
    const ratingHTML = cnt
      ? `<div style="text-align:center">${starsDisplay(avg, 12)}<br><b style="color:#ffb020;font-size:12px">${avg.toFixed(1)}</b> <span style="color:var(--muted);font-size:11px">(${cnt})</span></div>`
      : `<div style="color:var(--muted);font-size:12px;text-align:center">—</div>`;

    return `
      <tr>
        <td><b>#${p.id}</b></td>
        <td><img src="${p.image}" style="width:56px;height:56px" alt=""></td>
        <td>
          <div style="font-weight:600;max-width:240px">${p.name}</div>
          <div style="color:var(--muted);font-size:12px">${p.brand}</div>
        </td>
        <td>
          <span style="color:var(--accent);font-weight:700">${fmt(p.price)}</span>
          ${p.oldPrice ? `<br><span style="color:var(--muted);text-decoration:line-through;font-size:12px">${fmt(p.oldPrice)}</span>` : ""}
        </td>
        <td>
          ${p.stock === 0
        ? `<span class="tag" style="background:#666;color:#fff">🚫 Hết hàng</span>`
        : `<span class="tag tag-${p.group}">${p.group}</span>`}
        </td>
        <td>${p.stock === 0 ? '<b style="color:#ff3b3b">0</b>' : p.stock}</td>
        <td>${ratingHTML}</td>
        <td>
          <div class="row-actions">
            <button onclick="openEdit(${p.id})">✏️ Sửa</button>
            <button class="danger" onclick="handleDelete(${p.id})">🗑️ Xóa</button>
          </div>
        </td>
      </tr>`;
  }).join("");

  const totalEl = document.getElementById("statTotal");
  const newEl = document.getElementById("statNew");
  const hotEl = document.getElementById("statHot");
  const saleEl = document.getElementById("statSale");
  if (totalEl) totalEl.textContent = getProducts().length;
  if (newEl) newEl.textContent = getProducts().filter(p => p.group === "new" && p.stock > 0).length;
  if (hotEl) hotEl.textContent = getProducts().filter(p => p.group === "hot" && p.stock > 0).length;
  if (saleEl) saleEl.textContent = getProducts().filter(p => p.group === "sale" && p.stock > 0).length;
}

function reindexIDs() {
  if (!confirm("Đánh lại ID từ #1, #2, #3... cho TẤT CẢ sản phẩm?\n\nThao tác này KHÔNG thể hoàn tác!")) return;
  const list = getProducts();
  list.forEach((p, i) => { p.id = i + 1; });
  saveProducts(list);
  showToast("✅ Đã đánh lại ID từ #1");
  renderAdminTable();
}

function exportDataJS() {
  const products = getProducts();
  const code =
    "// ============ DÁN ĐOẠN NÀY VÀO js/data.js ============\n" +
    "const DEFAULT_PRODUCTS = " +
    JSON.stringify(products, null, 2).replace(/"([^"]+)":/g, "$1:") +
    ";\n";
  const ta = document.getElementById("exportCode");
  if (!ta) return;
  ta.value = code;
  document.getElementById("exportOverlay").classList.add("show");
  setTimeout(() => { ta.focus(); ta.select(); }, 100);
}

function closeExport() {
  document.getElementById("exportOverlay").classList.remove("show");
}

function copyExportCode() {
  const ta = document.getElementById("exportCode");
  ta.focus();
  ta.select();
  ta.setSelectionRange(0, 999999);
  try {
    document.execCommand("copy");
    showToast("✅ Đã copy! Mở js/data.js và paste vào.");
  } catch (e) {
    navigator.clipboard.writeText(ta.value).then(
      () => showToast("✅ Đã copy vào clipboard!"),
      () => showToast("❌ Không copy được. Hãy tự Ctrl+A, Ctrl+C.")
    );
  }
}

function renderAdminOrders() {
  const orders = getOrders();
  const shippers = getAllShippers();
  const tbody = document.getElementById("adminOrdersTbody");
  if (!tbody) return;

  if (!orders.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--muted)">Chưa có đơn hàng.</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(o => {
    const st = ORDER_STATUS[o.status];
    const shipper = o.shipperEmail ? getUsers().find(u => u.email === o.shipperEmail) : null;
    const shipperInfo = shipper
      ? `<b style="color:#00a8ff;font-size:13px">🚚 ${shipper.name}</b><br><span style="color:var(--muted);font-size:12px">📞 ${shipper.phone}</span>`
      : `<span style="color:var(--muted);font-size:12px">Chưa gán</span>`;

    return `
      <tr>
        <td><b style="color:var(--accent)">${o.id}</b></td>
        <td>
          ${o.userName}<br>
          <span style="color:var(--muted);font-size:12px">${o.userEmail}</span>
        </td>
        <td>
          ${o.items.length} SP<br>
          <span style="color:var(--muted);font-size:12px">${fmt(o.total)}</span>
        </td>
        <td>
          <div style="max-width:220px;font-size:12px">
            ${formatAddress(o.address)}<br>
            <b>📞 ${o.address.phone}</b>
          </div>
        </td>
        <td>${shipperInfo}</td>
        <td>
          <span class="tag" style="background:${st.color};color:#000">${st.icon} ${st.label}</span>
        </td>
        <td style="font-size:12px;color:var(--muted)">${formatDate(o.createdAt)}</td>
        <td style="min-width:180px">
          <select onchange="adminAssignShipper('${o.id}', this.value)" style="padding:6px 8px;background:var(--bg-2);border:1px solid var(--border);color:var(--text);border-radius:6px;margin-bottom:6px;width:100%;font-size:12px">
            <option value="">-- Chưa gán --</option>
            ${shippers.map(s => `<option value="${s.email}" ${o.shipperEmail === s.email ? "selected" : ""}>${s.name} (${s.phone})</option>`).join("")}
          </select>
          <select onchange="adminChangeOrderStatus('${o.id}', this.value)" style="padding:6px 8px;background:var(--bg-2);border:1px solid var(--border);color:var(--text);border-radius:6px;width:100%;font-size:12px">
            ${Object.keys(ORDER_STATUS).map(s => `<option value="${s}" ${o.status === s ? "selected" : ""}>${ORDER_STATUS[s].label}</option>`).join("")}
          </select>
        </td>
      </tr>`;
  }).join("");
}

function adminAssignShipper(id, email) {
  if (assignShipper(id, email)) {
    showToast("✅ Đã gán shipper");
    renderAdminOrders();
  }
}

function adminChangeOrderStatus(id, status) {
  if (updateOrderStatus(id, status)) {
    showToast("✅ Đã cập nhật trạng thái");
    renderAdminOrders();
  }
}

function renderAdminShippers() {
  const pending = getPendingShippers();
  const approved = getAllShippers();
  const tbody = document.getElementById("adminShippersTbody");
  if (!tbody) return;

  if (!pending.length && !approved.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--muted)">Không có shipper nào.</td></tr>`;
    return;
  }

  const ratingCell = (email) => {
    const avg = typeof getShipperAvgStars === "function" ? getShipperAvgStars(email) : 0;
    const cnt = typeof getShipperReviewCount === "function" ? getShipperReviewCount(email) : 0;
    if (!cnt) return `<span style="color:var(--muted);font-size:12px">Chưa có</span>`;
    return `
      <div>
        ${starsDisplay(avg, 14)}<br>
        <b style="color:#ffb020;font-size:12px">${avg.toFixed(1)}</b>
        <span style="color:var(--muted);font-size:11px">(${cnt} đơn)</span>
      </div>`;
  };

  tbody.innerHTML =
    pending.map(u => `
      <tr>
        <td><b>${u.name}</b></td>
        <td>${u.email}</td>
        <td>${u.phone}</td>
        <td>${ratingCell(u.email)}</td>
        <td><span class="tag" style="background:#ffb020;color:#000">⏳ Chờ duyệt</span></td>
        <td>
          <div class="row-actions">
            <button onclick="handleApproveShipper('${u.email}')" style="border-color:#16c784;color:#16c784">✅ Duyệt</button>
            <button class="danger" onclick="handleRejectShipper('${u.email}')">❌ Từ chối</button>
          </div>
        </td>
      </tr>`).join("") +
    approved.map(u => `
      <tr>
        <td><b>${u.name}</b></td>
        <td>${u.email}</td>
        <td>${u.phone}</td>
        <td>${ratingCell(u.email)}</td>
        <td><span class="tag" style="background:#00a8ff;color:#000">🚚 Đã duyệt</span></td>
        <td><button class="danger" onclick="handleRejectShipper('${u.email}')">🚫 Thu hồi</button></td>
      </tr>`).join("");
}

function handleApproveShipper(email) {
  if (!confirm("Duyệt user này làm shipper?")) return;
  if (approveShipper(email)) {
    showToast("✅ Đã duyệt shipper");
    renderAdminShippers();
  }
}

function handleRejectShipper(email) {
  if (!confirm("Từ chối / thu hồi quyền shipper?")) return;
  if (rejectShipper(email)) {
    showToast("🚫 Đã cập nhật");
    renderAdminShippers();
  }
}

function renderAnalytics() {
  const box = document.getElementById("analyticsContent");
  if (!box) return;

  const products = getProducts();
  const orders = getOrders();

  const prodsWithRating = products.map(p => ({
    ...p,
    avg: typeof getProductAvgStars === "function" ? getProductAvgStars(p.id) : 0,
    count: typeof getProductReviewCount === "function" ? getProductReviewCount(p.id) : 0
  }));

  const topRated = [...prodsWithRating].filter(p => p.count > 0).sort((a, b) => b.avg - a.avg).slice(0, 5);
  const worstRated = [...prodsWithRating].filter(p => p.count > 0).sort((a, b) => a.avg - b.avg).slice(0, 5);

  const shippers = getAllShippers().map(s => ({
    ...s,
    avg: typeof getShipperAvgStars === "function" ? getShipperAvgStars(s.email) : 0,
    count: typeof getShipperReviewCount === "function" ? getShipperReviewCount(s.email) : 0
  })).sort((a, b) => b.avg - a.avg);

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const shippingOrders = orders.filter(o => o.status === "shipping").length;
  const deliveredOrders = orders.filter(o => o.status === "delivered").length;
  const cancelledOrders = orders.filter(o => o.status === "cancelled").length;
  const revenue = orders.filter(o => o.status === "delivered").reduce((s, o) => s + o.total, 0);

  box.innerHTML = `
    <div class="admin-stats">
      <div class="stat-card"><div class="label">Tổng đơn</div><div class="value">${totalOrders}</div></div>
      <div class="stat-card"><div class="label">⏳ Chờ</div><div class="value" style="color:#ffb020">${pendingOrders}</div></div>
      <div class="stat-card"><div class="label">🚚 Đang giao</div><div class="value" style="color:#00a8ff">${shippingOrders}</div></div>
      <div class="stat-card"><div class="label">✅ Đã giao</div><div class="value" style="color:#16c784">${deliveredOrders}</div></div>
      <div class="stat-card"><div class="label">❌ Đã hủy</div><div class="value" style="color:#ff3b3b">${cancelledOrders}</div></div>
      <div class="stat-card"><div class="label">💰 Doanh thu</div><div class="value" style="font-size:20px">${fmt(revenue)}</div></div>
    </div>

    <div class="analytics-row">
      <div class="analytics-box">
        <h3 style="color:#16c784">🏆 Top sản phẩm tốt nhất</h3>
        ${topRated.length
      ? topRated.map((p, i) => `
            <div class="analytics-item">
              <span class="analytics-rank">${i + 1}</span>
              <img src="${p.image}" alt="">
              <div style="flex:1;min-width:0">
                <div style="font-weight:600;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.name}</div>
                <div style="font-size:12px;color:var(--muted)">${p.brand}</div>
              </div>
              <div style="text-align:right;flex-shrink:0">
                ${starsDisplay(p.avg, 14)}<br>
                <b style="color:#ffb020">${p.avg.toFixed(1)}</b>
                <span style="color:var(--muted);font-size:11px">(${p.count})</span>
              </div>
            </div>`).join("")
      : `<p style="color:var(--muted);text-align:center;padding:30px">Chưa có đánh giá</p>`}
      </div>

      <div class="analytics-box">
        <h3 style="color:#ff3b3b">⚠️ Sản phẩm cần cải thiện</h3>
        ${worstRated.length
      ? worstRated.map((p, i) => `
            <div class="analytics-item">
              <span class="analytics-rank" style="background:#ff3b3b;color:#fff">${i + 1}</span>
              <img src="${p.image}" alt="">
              <div style="flex:1;min-width:0">
                <div style="font-weight:600;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.name}</div>
                <div style="font-size:12px;color:var(--muted)">${p.brand}</div>
              </div>
              <div style="text-align:right;flex-shrink:0">
                ${starsDisplay(p.avg, 14)}<br>
                <b style="color:#ff3b3b">${p.avg.toFixed(1)}</b>
                <span style="color:var(--muted);font-size:11px">(${p.count})</span>
              </div>
            </div>`).join("")
      : `<p style="color:var(--muted);text-align:center;padding:30px">Chưa có đánh giá</p>`}
      </div>
    </div>

    <div class="analytics-row" style="grid-template-columns:1fr">
      <div class="analytics-box">
        <h3 style="color:#00a8ff">🚚 Bảng xếp hạng shipper</h3>
        ${shippers.length
      ? shippers.map((s, i) => `
            <div class="analytics-item">
              <span class="analytics-rank" style="background:#00a8ff;color:#000">${i + 1}</span>
              <div style="width:44px;height:44px;background:rgba(0,168,255,.15);border-radius:50%;display:grid;place-items:center;font-size:20px;flex-shrink:0">🚚</div>
              <div style="flex:1;min-width:0">
                <div style="font-weight:600;font-size:13px">${s.name}</div>
                <div style="font-size:12px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${s.email} • ${s.phone}</div>
              </div>
              <div style="text-align:right;flex-shrink:0">
                ${s.count
          ? `${starsDisplay(s.avg, 14)}<br><b style="color:#ffb020">${s.avg.toFixed(1)}</b> <span style="color:var(--muted);font-size:11px">(${s.count} đơn)</span>`
          : `<span style="color:var(--muted);font-size:12px">Chưa có đánh giá</span>`}
              </div>
            </div>`).join("")
      : `<p style="color:var(--muted);text-align:center;padding:30px">Chưa có shipper</p>`}
      </div>
    </div>
  `;
}

function renderAdminReviews() {
  const box = document.getElementById("reviewsContent");
  if (!box) return;

  const reviews = typeof getReviews === "function" ? getReviews().sort((a, b) => b.createdAt - a.createdAt) : [];
  const shipReviews = typeof getShipperReviews === "function" ? getShipperReviews().sort((a, b) => b.createdAt - a.createdAt) : [];

  box.innerHTML = `
    <div class="analytics-box" style="margin-bottom:20px">
      <h3 style="color:var(--accent)">⭐ Đánh giá sản phẩm (${reviews.length})</h3>
      ${reviews.length
      ? reviews.slice(0, 30).map(r => {
        const p = getProductById(r.productId);
        return `
              <div class="review-row">
                <img src="${p?.image || ''}" alt="">
                <div style="flex:1;min-width:0">
                  <div style="font-weight:600;font-size:13px;color:var(--text)">${p?.name || "SP #" + r.productId}</div>
                  <div style="font-size:12px;color:var(--muted);margin:4px 0">👤 ${r.userName} • ${formatDate(r.createdAt)}</div>
                  ${r.comment ? `<div style="font-style:italic;color:var(--muted);font-size:13px">"${r.comment}"</div>` : ""}
                </div>
                <div style="text-align:right;flex-shrink:0">
                  ${starsDisplay(r.stars, 16)}
                  <div style="color:#ffb020;font-weight:700;font-size:14px">${r.stars}/5</div>
                </div>
              </div>`;
      }).join("")
      : `<p style="color:var(--muted);text-align:center;padding:40px">Chưa có đánh giá sản phẩm nào</p>`}
    </div>

    <div class="analytics-box">
      <h3 style="color:#00a8ff">🚚 Đánh giá shipper (${shipReviews.length})</h3>
      ${shipReviews.length
      ? shipReviews.slice(0, 30).map(r => {
        const s = getUsers().find(u => u.email === r.shipperEmail);
        return `
              <div class="review-row">
                <div style="width:56px;height:56px;background:rgba(0,168,255,.15);border-radius:50%;display:grid;place-items:center;font-size:24px;flex-shrink:0">🚚</div>
                <div style="flex:1;min-width:0">
                  <div style="font-weight:600;font-size:13px;color:var(--text)">${s?.name || r.shipperEmail}</div>
                  <div style="font-size:12px;color:var(--muted);margin:4px 0">👤 ${r.userName} • ${formatDate(r.createdAt)}</div>
                  ${r.comment ? `<div style="font-style:italic;color:var(--muted);font-size:13px">"${r.comment}"</div>` : ""}
                </div>
                <div style="text-align:right;flex-shrink:0">
                  ${starsDisplay(r.stars, 16)}
                  <div style="color:#ffb020;font-weight:700;font-size:14px">${r.stars}/5</div>
                </div>
              </div>`;
      }).join("")
      : `<p style="color:var(--muted);text-align:center;padding:40px">Chưa có đánh giá shipper nào</p>`}
    </div>
  `;
}

function renderBroadcasts() {
  const box = document.getElementById("broadcastContent");
  if (!box) return;
  const list = typeof getBroadcasts === "function" ? getBroadcasts() : [];

  box.innerHTML = `
    <div class="analytics-box" style="margin-bottom:20px">
      <h3 style="color:var(--accent)">📢 Gửi thông báo mới</h3>
      <div class="form-group">
        <label>Tiêu đề *</label>
        <input type="text" class="form-control" id="bcTitle" placeholder="VD: Flash Sale cuối tuần">
      </div>
      <div class="form-group">
        <label>Nội dung *</label>
        <textarea class="form-control" id="bcText" rows="3" placeholder="VD: Giảm 40% toàn bộ chuột gaming từ 20-22/10..."></textarea>
      </div>
      <div class="form-group">
        <label>Biểu tượng</label>
        <select class="form-control" id="bcIcon">
          <option value="📢">📢 Thông báo</option>
          <option value="🎉">🎉 Ưu đãi</option>
          <option value="🔥">🔥 Flash Sale</option>
          <option value="🚚">🚚 Vận chuyển</option>
          <option value="⚠️">⚠️ Cảnh báo</option>
          <option value="💎">💎 VIP</option>
        </select>
      </div>
      <button class="btn" style="width:100%" onclick="handleSendBroadcast()">📤 Gửi đến tất cả user & shipper</button>
    </div>

    <div class="analytics-box">
      <h3>📜 Đã gửi (${list.length})</h3>
      ${list.length ? list.map(b => `
        <div style="display:flex;gap:14px;padding:14px 0;border-bottom:1px solid var(--border);align-items:flex-start">
          <div style="font-size:28px;flex-shrink:0">${b.icon || "📢"}</div>
          <div style="flex:1;min-width:0">
            <div style="font-weight:600;font-size:14px;color:var(--accent)">${b.title}</div>
            <div style="font-size:13px;color:var(--text);margin:4px 0">${b.text}</div>
            <div style="font-size:12px;color:var(--muted)">${formatDate(b.createdAt)}</div>
          </div>
          <button onclick="handleDeleteBroadcast(${b.id})"
                  style="padding:6px 12px;border-radius:6px;border:1px solid var(--border);background:var(--bg-2);color:var(--danger);cursor:pointer;flex-shrink:0">
            🗑️
          </button>
        </div>
      `).join("") : `<p style="color:var(--muted);text-align:center;padding:30px">Chưa có thông báo nào</p>`}
    </div>
  `;
}

function handleSendBroadcast() {
  const title = document.getElementById("bcTitle").value.trim();
  const text = document.getElementById("bcText").value.trim();
  const icon = document.getElementById("bcIcon").value;
  if (!title || !text) return showToast("❌ Nhập đủ tiêu đề và nội dung!");
  if (typeof sendBroadcast === "function" && sendBroadcast(title, text, icon)) {
    showToast("✅ Đã gửi thông báo đến tất cả!");
    renderBroadcasts();
  } else {
    showToast("❌ Không thể gửi (kiểm tra quyền admin)");
  }
}

function handleDeleteBroadcast(id) {
  if (!confirm("Xóa thông báo này?")) return;
  if (typeof deleteBroadcast === "function" && deleteBroadcast(id)) {
    showToast("🗑️ Đã xóa");
    renderBroadcasts();
  }
}

function openAdd() {
  editingId = null;
  document.getElementById("modalTitle").textContent = "➕ Thêm sản phẩm";
  document.getElementById("productForm").reset();

  [1, 2, 3, 4].forEach(i => {
    const el = document.getElementById("prevImg" + i);
    if (el) { el.style.display = "none"; el.removeAttribute("src"); }
  });

  document.getElementById("fOldPrice").value = "0";
  document.getElementById("fStock").value = "10";
  document.getElementById("modalOverlay").classList.add("show");
}

function openEdit(id) {
  const p = getProductById(id);
  if (!p) return;

  editingId = id;
  document.getElementById("modalTitle").textContent = "✏️ Sửa sản phẩm #" + id;

  document.getElementById("fName").value = p.name;
  document.getElementById("fPrice").value = p.price;
  document.getElementById("fOldPrice").value = p.oldPrice || 0;
  document.getElementById("fCategory").value = p.category;
  document.getElementById("fGroup").value = p.group;
  document.getElementById("fBrand").value = p.brand;
  document.getElementById("fStock").value = p.stock;
  document.getElementById("fVideoId").value = p.videoId || "";
  document.getElementById("fDesc").value = p.desc;

  const imgs = (p.images && p.images.length) ? p.images : [p.image, "", "", ""];
  for (let i = 1; i <= 4; i++) {
    document.getElementById("fImage" + i).value = imgs[i - 1] || "";
    updatePreview(i, imgs[i - 1] || "");
  }

  document.getElementById("modalOverlay").classList.add("show");
}

function closeModal() {
  document.getElementById("modalOverlay").classList.remove("show");
  editingId = null;
}

function updatePreview(idx, url) {
  const img = document.getElementById("prevImg" + idx);
  if (!img) return;
  if (!url || !url.trim()) {
    img.style.display = "none";
    img.removeAttribute("src");
    return;
  }
  img.onerror = null;
  img.src = url;
  img.style.display = "block";
  img.onerror = () => { img.style.display = "none"; };
}

function handleSave(e) {
  e.preventDefault();

  const img1 = document.getElementById("fImage1").value.trim();
  const img2 = document.getElementById("fImage2").value.trim();
  const img3 = document.getElementById("fImage3").value.trim();
  const img4 = document.getElementById("fImage4").value.trim();

  if (!img1) return showToast("❌ Cần ít nhất ảnh chính (Ảnh 1)!");

  const images = [img1, img2, img3, img4].filter(Boolean);

  const data = {
    name: document.getElementById("fName").value.trim(),
    price: Number(document.getElementById("fPrice").value),
    oldPrice: Number(document.getElementById("fOldPrice").value) || 0,
    image: img1,
    images: images,
    category: document.getElementById("fCategory").value,
    group: document.getElementById("fGroup").value,
    brand: document.getElementById("fBrand").value.trim(),
    stock: Number(document.getElementById("fStock").value) || 0,
    videoId: document.getElementById("fVideoId").value.trim(),
    desc: document.getElementById("fDesc").value.trim()
  };

  if (!data.name || !data.price || !data.brand) {
    return showToast("❌ Nhập đủ Tên, Giá, Thương hiệu!");
  }

  if (editingId) {
    updateProduct(editingId, data);
    showToast("✅ Cập nhật sản phẩm #" + editingId + " thành công!");
  } else {
    const n = addProduct(data);
    showToast("✅ Đã thêm sản phẩm #" + n.id);
  }

  closeModal();
  renderAdminTable();
}

function handleDelete(id) {
  const p = getProductById(id);
  if (!p) return;
  if (!confirm(`Xóa "${p.name}"?`)) return;
  deleteProduct(id);
  showToast("🗑️ Đã xóa");
  renderAdminTable();
}

function fillCategorySelect() {
  const sel = document.getElementById("fCategory");
  if (!sel) return;
  sel.innerHTML = getCategories().map(c => `<option value="${c.slug}">${c.name}</option>`).join("");
}

document.addEventListener("click", e => {
  if (e.target.id === "modalOverlay") closeModal();
  if (e.target.id === "exportOverlay") closeExport();
  if (e.target.id === "reviewExportOverlay" && typeof closeReviewExport === "function") closeReviewExport();
});

document.addEventListener("DOMContentLoaded", () => {
  if (!requireAdmin()) return;

  fillCategorySelect();
  renderAdminTable();

  const form = document.getElementById("productForm");
  if (form) form.addEventListener("submit", handleSave);

  [1, 2, 3, 4].forEach(i => {
    const input = document.getElementById("fImage" + i);
    if (input) input.addEventListener("input", e => updatePreview(i, e.target.value));
  });
});
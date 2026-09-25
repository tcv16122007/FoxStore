// js/chat.js
const MSG_KEY = "fox_messages";
const BROADCAST_KEY = "fox_broadcasts";

/* ═══ STORAGE ═══ */
function getMessages() { return JSON.parse(localStorage.getItem(MSG_KEY)) || []; }
function saveMessages(list) { localStorage.setItem(MSG_KEY, JSON.stringify(list)); }

/* ═══ ROOM ═══ */
function getRoomId(a, b) { return [a, b].sort().join("::"); }

function sendMessage(from, to, text) {
    text = String(text || "").trim();
    if (!text) return false;
    const msgs = getMessages();
    msgs.push({
        id: Date.now() + Math.random(),
        room: getRoomId(from, to),
        from, to, text,
        timestamp: Date.now(),
        read: false
    });
    saveMessages(msgs);
    return true;
}

function getRoomMessages(a, b) {
    const room = getRoomId(a, b);
    return getMessages().filter(m => m.room === room).sort((x, y) => x.timestamp - y.timestamp);
}

function markRoomRead(currentEmail, otherEmail) {
    const room = getRoomId(currentEmail, otherEmail);
    const msgs = getMessages();
    let changed = false;
    msgs.forEach(m => {
        if (m.room === room && m.to === currentEmail && !m.read) {
            m.read = true;
            changed = true;
        }
    });
    if (changed) saveMessages(msgs);
}

function getUnreadCount(email) {
    return getMessages().filter(m => m.to === email && !m.read).length;
}
function getUnreadCountFrom(email, fromEmail) {
    return getMessages().filter(m => m.to === email && m.from === fromEmail && !m.read).length;
}

/* ═══ DANH SÁCH LIÊN HỆ — CHỈ theo yêu cầu ═══ */
function getContactsFor(email) {
    const user = getUsers().find(u => u.email === email);
    if (!user) return [];
    const contacts = [];

    // 1. Owner LUÔN đầu tiên (nếu không phải chính mình)
    const admin = getUsers().find(u => u.role === "admin");
    if (admin && admin.email !== email) contacts.push(admin);

    if (user.role === "admin") {
        // 2a. Admin → CHỈ shipper (không user, không bản thân)
        const shippers = getUsers().filter(u =>
            u.shipperStatus === "approved" && u.email !== email
        );
        contacts.push(...shippers);
    } else if (user.shipperStatus === "approved") {
        // 2b. Shipper → owner (đã push) + shipper khác (không user)
        const otherShippers = getUsers().filter(u =>
            u.shipperStatus === "approved" && u.email !== email
        );
        contacts.push(...otherShippers);
    } else {
        // 2c. User thường → owner (đã push) + shipper
        const shippers = getUsers().filter(u =>
            u.shipperStatus === "approved" && u.email !== email
        );
        contacts.push(...shippers);
    }

    // Loại bỏ trùng email
    const seen = new Set();
    return contacts.filter(c => {
        if (seen.has(c.email)) return false;
        seen.add(c.email);
        return true;
    });
}

function getLastMessage(a, b) {
    const list = getRoomMessages(a, b);
    return list.length ? list[list.length - 1] : null;
}

/* ═══ BROADCAST ═══ */
function getBroadcasts() { return JSON.parse(localStorage.getItem(BROADCAST_KEY)) || []; }
function saveBroadcasts(list) { localStorage.setItem(BROADCAST_KEY, JSON.stringify(list)); }

function sendBroadcast(title, text, icon = "📢") {
    if (!isAdmin()) return false;
    title = String(title || "").trim();
    text = String(text || "").trim();
    if (!title || !text) return false;
    const list = getBroadcasts();
    list.unshift({
        id: Date.now(),
        title, text, icon,
        from: "Fox Store Admin",
        createdAt: Date.now()
    });
    saveBroadcasts(list);
    return true;
}
function deleteBroadcast(id) {
    if (!isAdmin()) return false;
    saveBroadcasts(getBroadcasts().filter(b => b.id !== id));
    return true;
}

/* ═══ THÔNG BÁO ═══ */
function getNotifications(email) {
    const notifs = [];
    const user = getUsers().find(u => u.email === email);
    if (!user) return [];

    // 1. Broadcast — hiện cho tất cả (trừ admin)
    if (user.role !== "admin") {
        getBroadcasts().forEach(b => {
            notifs.push({
                id: "bc_" + b.id,
                type: "broadcast",
                icon: b.icon || "📢",
                title: b.title,
                text: b.text,
                timestamp: b.createdAt,
                link: "#"
            });
        });
    }

    // 2. Tin nhắn chưa đọc
    getMessages()
        .filter(m => m.to === email && !m.read)
        .forEach(m => {
            const sender = getUsers().find(u => u.email === m.from);
            notifs.push({
                id: "msg_" + m.id,
                type: "message",
                icon: "💬",
                title: `Tin nhắn từ ${sender?.name || m.from}`,
                text: m.text,
                timestamp: m.timestamp,
                link: `messages.html?contact=${m.from}`
            });
        });

    // 3. Đơn hàng theo vai trò
    const orders = JSON.parse(localStorage.getItem("fox_orders")) || [];
    if (user.role === "admin") {
        orders.filter(o => o.status === "pending").forEach(o => {
            notifs.push({
                id: "order_" + o.id,
                type: "order",
                icon: "📦",
                title: `Đơn hàng mới #${o.id}`,
                text: `Từ ${o.userName} – ${formatPriceShort(o.total)}`,
                timestamp: o.createdAt,
                link: "admin.html"
            });
        });
    } else if (user.shipperStatus === "approved") {
        orders.filter(o => o.shipperEmail === email && o.status === "shipping").forEach(o => {
            notifs.push({
                id: "ship_" + o.id,
                type: "order",
                icon: "🚚",
                title: `Đơn cần giao #${o.id}`,
                text: `Giao cho ${o.address.name} – ${o.address.phone}`,
                timestamp: o.updatedAt,
                link: "shipper.html"
            });
        });
    } else {
        orders.filter(o => o.userEmail === email).forEach(o => {
            const st = (typeof ORDER_STATUS !== "undefined" && ORDER_STATUS[o.status]) || { label: o.status, icon: "📦" };
            notifs.push({
                id: "ord_" + o.id,
                type: "order",
                icon: st.icon,
                title: `Đơn #${o.id}: ${st.label}`,
                text: `Tổng: ${formatPriceShort(o.total)}`,
                timestamp: o.updatedAt,
                link: "orders.html"
            });
        });
    }

    return notifs.sort((a, b) => b.timestamp - a.timestamp);
}

function formatPriceShort(n) {
    return Number(n).toLocaleString("vi-VN") + "₫";
}

/* ═══ BADGE — ẨN KHI = 0 ═══ */
function updateMsgBadge() {
    const badge = document.getElementById("msgBadge");
    if (!badge) return;
    const u = getCurrentUser();
    if (!u) { badge.style.display = "none"; return; }
    const count = getUnreadCount(u.email);
    if (count > 0) {
        badge.textContent = count > 99 ? "99+" : count;
        badge.style.display = "grid";
    } else {
        badge.style.display = "none";
    }
}
function updateNotifBadge() {
    const badge = document.getElementById("notifBadge");
    if (!badge) return;
    const u = getCurrentUser();
    if (!u) { badge.style.display = "none"; return; }
    const count = getNotifications(u.email).length;
    if (count > 0) {
        badge.textContent = count > 99 ? "99+" : count;
        badge.style.display = "grid";
    } else {
        badge.style.display = "none";
    }
}

/* ═══ EXPORT ═══ */
function exportChatJS() {
    const msgs = getMessages();
    const bcs = getBroadcasts();
    const code =
        "// ============ DÁN VÀO js/data.js ============\n" +
        "const DEFAULT_MESSAGES = " + JSON.stringify(msgs, null, 2).replace(/"([^"]+)":/g, "$1:") + ";\n" +
        "const DEFAULT_BROADCASTS = " + JSON.stringify(bcs, null, 2).replace(/"([^"]+)":/g, "$1:") + ";\n";
    const ta = document.getElementById("chatExportCode");
    if (!ta) return;
    ta.value = code;
    document.getElementById("chatExportOverlay").classList.add("show");
    setTimeout(() => { ta.focus(); ta.select(); }, 100);
}
function closeChatExport() {
    document.getElementById("chatExportOverlay").classList.remove("show");
}
function copyChatExport() {
    const ta = document.getElementById("chatExportCode");
    ta.focus(); ta.select(); ta.setSelectionRange(0, 999999);
    try {
        document.execCommand("copy");
        showToast("✅ Đã copy! Paste vào js/data.js");
    } catch (e) {
        navigator.clipboard.writeText(ta.value).then(
            () => showToast("✅ Đã copy!"),
            () => showToast("❌ Ctrl+A rồi Ctrl+C thủ công")
        );
    }
}
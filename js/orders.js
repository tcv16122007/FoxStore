const ORDER_KEY = "fox_orders";

const ORDER_STATUS = {
    pending: { label: "Chờ xác nhận", color: "#ffb020", icon: "⏳" },
    shipping: { label: "Đang giao", color: "#00a8ff", icon: "🚚" },
    delivered: { label: "Đã giao", color: "#16c784", icon: "✅" },
    cancelled: { label: "Đã hủy", color: "#ff3b3b", icon: "❌" }
};
const STATUS_FLOW = ["pending", "shipping", "delivered"];

function getOrders() {
    const all = JSON.parse(localStorage.getItem(ORDER_KEY)) || [];
    if (isAdmin()) return all;
    if (isShipper()) return all.filter(o => o.shipperEmail === getCurrentUser().email);
    const user = getCurrentUser();
    if (!user) return [];
    return all.filter(o => o.userEmail === user.email);
}
function saveOrders(list) { localStorage.setItem(ORDER_KEY, JSON.stringify(list)); }

function createOrder(items, total, address) {
    const user = getCurrentUser();
    if (!user) return null;

    const products = getProducts();
    for (const it of items) {
        const p = products.find(x => x.id === it.id);
        if (!p) return { error: "Sản phẩm không tồn tại!" };
        if (p.stock < it.qty) return { error: `"${p.name}" chỉ còn ${p.stock} sản phẩm!` };
    }

    items.forEach(it => {
        const p = products.find(x => x.id === it.id);
        if (p) p.stock -= it.qty;
    });
    saveProducts(products);

    const all = JSON.parse(localStorage.getItem(ORDER_KEY)) || [];
    const order = {
        id: "FOX" + Date.now().toString().slice(-8),
        userEmail: user.email,
        userName: user.name,
        items: items.map(i => ({ id: i.id, name: i.name, price: i.price, image: i.image, qty: i.qty })),
        total,
        address,
        status: "pending",
        shipperEmail: "",
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    all.unshift(order);
    saveOrders(all);
    return order;
}

function updateOrderStatus(orderId, status) {
    const user = getCurrentUser();
    if (!user) return false;
    if (user.role !== "admin" && user.shipperStatus !== "approved") return false;

    const all = JSON.parse(localStorage.getItem(ORDER_KEY)) || [];
    const o = all.find(x => x.id === orderId);
    if (!o) return false;

    if (user.shipperStatus === "approved" && user.role !== "admin") {
        if (o.shipperEmail !== user.email) return false;
        if (status !== "delivered") return false;
    }

    if (status === "cancelled" && o.status !== "cancelled") {
        const products = getProducts();
        o.items.forEach(it => {
            const p = products.find(x => x.id === it.id);
            if (p) p.stock += it.qty;
        });
        saveProducts(products);
    }
    if (o.status === "cancelled" && status !== "cancelled") {
        const products = getProducts();
        o.items.forEach(it => {
            const p = products.find(x => x.id === it.id);
            if (p) p.stock = Math.max(0, p.stock - it.qty);
        });
        saveProducts(products);
    }

    o.status = status;
    o.updatedAt = Date.now();
    saveOrders(all);
    return true;
}

function assignShipper(orderId, shipperEmail) {
    if (!isAdmin()) return false;
    const all = JSON.parse(localStorage.getItem(ORDER_KEY)) || [];
    const o = all.find(x => x.id === orderId);
    if (!o) return false;
    o.shipperEmail = shipperEmail;
    if (shipperEmail && o.status === "pending") o.status = "shipping";
    o.updatedAt = Date.now();
    saveOrders(all);
    return true;
}

function getOrderById(id) {
    return (JSON.parse(localStorage.getItem(ORDER_KEY)) || []).find(o => o.id === id);
}
function formatAddress(addr) {
    if (!addr) return "";
    return [addr.detail, addr.district, addr.city].filter(Boolean).join(", ");
}
function shipperClaimOrder(orderId) {
    const user = getCurrentUser();
    if (!user || user.shipperStatus !== "approved") return false;

    const all = JSON.parse(localStorage.getItem(ORDER_KEY)) || [];
    const o = all.find(x => x.id === orderId);
    if (!o) return false;
    if (o.shipperEmail) return { error: "Đơn đã có shipper khác nhận!" };

    o.shipperEmail = user.email;
    o.status = "shipping";
    o.updatedAt = Date.now();
    saveOrders(all);
    return true;
}

function getUnclaimedOrders(cityFilter = "") {
    const all = JSON.parse(localStorage.getItem(ORDER_KEY)) || [];
    let list = all.filter(o => !o.shipperEmail && o.status === "pending");
    if (cityFilter) list = list.filter(o => o.address.city === cityFilter);
    return list;
}
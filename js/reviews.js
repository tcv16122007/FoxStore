// js/reviews.js
const REVIEW_KEY = "fox_reviews";
const SHIP_REVIEW_KEY = "fox_shipper_reviews";

/* ═══ PRODUCT REVIEWS ═══ */
function getReviews() { return JSON.parse(localStorage.getItem(REVIEW_KEY)) || []; }
function saveReviews(list) { localStorage.setItem(REVIEW_KEY, JSON.stringify(list)); }

function addReview(orderId, productId, userId, userName, stars, comment) {
    const reviews = getReviews();
    reviews.push({
        id: Date.now() + Math.random(),
        orderId, productId, userId, userName,
        stars: Number(stars),
        comment: comment.trim(),
        createdAt: Date.now()
    });
    saveReviews(reviews);
}

function getReviewByOrderProduct(orderId, productId) {
    return getReviews().find(r => r.orderId === orderId && r.productId === productId);
}
function getProductReviews(productId) {
    return getReviews().filter(r => r.productId === productId).sort((a, b) => b.createdAt - a.createdAt);
}
function getProductAvgStars(productId) {
    const list = getProductReviews(productId);
    if (!list.length) return 0;
    return list.reduce((s, r) => s + r.stars, 0) / list.length;
}
function getProductReviewCount(productId) {
    return getProductReviews(productId).length;
}

/* ═══ SHIPPER REVIEWS ═══ */
function getShipperReviews() { return JSON.parse(localStorage.getItem(SHIP_REVIEW_KEY)) || []; }
function saveShipperReviews(list) { localStorage.setItem(SHIP_REVIEW_KEY, JSON.stringify(list)); }

function addShipperReview(orderId, shipperEmail, userId, userName, stars, comment) {
    const reviews = getShipperReviews();
    reviews.push({
        id: Date.now() + Math.random(),
        orderId, shipperEmail, userId, userName,
        stars: Number(stars),
        comment: comment.trim(),
        createdAt: Date.now()
    });
    saveShipperReviews(reviews);
}
function getShipperReviewByOrder(orderId) {
    return getShipperReviews().find(r => r.orderId === orderId);
}
function getShipperAvgStars(email) {
    const list = getShipperReviews().filter(r => r.shipperEmail === email);
    if (!list.length) return 0;
    return list.reduce((s, r) => s + r.stars, 0) / list.length;
}
function getShipperReviewCount(email) {
    return getShipperReviews().filter(r => r.shipperEmail === email).length;
}

/* ═══ STAR HELPERS ═══ */
function starsDisplay(stars, size = 16) {
    const full = Math.floor(stars);
    const hasHalf = stars - full >= 0.25 && stars - full < 0.75;
    const rounded = stars - full >= 0.75 ? full + 1 : full;
    let html = `<span class="stars-display" style="font-size:${size}px">`;
    for (let i = 1; i <= 5; i++) {
        if (i <= rounded) html += `<span style="color:#ffb020">★</span>`;
        else if (i === rounded + 1 && hasHalf) html += `<span style="color:#ffb020">⯪</span>`;
        else html += `<span style="color:#444">★</span>`;
    }
    html += `</span>`;
    return html;
}

function starPickerHTML(name, currentValue = 0) {
    let html = `<div class="star-picker" data-name="${name}" data-value="${currentValue}">`;
    for (let i = 1; i <= 5; i++) {
        html += `<span class="star ${i <= currentValue ? 'active' : ''}" data-val="${i}" onclick="setStar('${name}', ${i})">★</span>`;
    }
    html += `<span class="star-label" id="${name}Label">${currentValue ? currentValue + '/5' : 'Chưa chọn'}</span>`;
    html += `</div>`;
    return html;
}

function setStar(name, val) {
    const picker = document.querySelector(`.star-picker[data-name="${name}"]`);
    if (!picker) return;
    picker.dataset.value = val;
    picker.querySelectorAll(".star").forEach(s => {
        const v = Number(s.dataset.val);
        s.classList.toggle("active", v <= val);
    });
    const label = document.getElementById(name + "Label");
    if (label) label.textContent = val + "/5";
}

function getStarValue(name) {
    const picker = document.querySelector(`.star-picker[data-name="${name}"]`);
    return picker ? Number(picker.dataset.value) : 0;
}

/* ═══ EXPORT CHO ADMIN ═══ */
function exportReviewsJS() {
    const reviews = getReviews();
    const shipReviews = getShipperReviews();
    const code =
        "// ============ DÁN VÀO js/data.js ============\n" +
        "const DEFAULT_REVIEWS = " + JSON.stringify(reviews, null, 2).replace(/"([^"]+)":/g, "$1:") + ";\n" +
        "const DEFAULT_SHIPPER_REVIEWS = " + JSON.stringify(shipReviews, null, 2).replace(/"([^"]+)":/g, "$1:") + ";\n";
    const ta = document.getElementById("reviewExportCode");
    if (!ta) return;
    ta.value = code;
    document.getElementById("reviewExportOverlay").classList.add("show");
    setTimeout(() => { ta.focus(); ta.select(); }, 100);
}
function closeReviewExport() {
    document.getElementById("reviewExportOverlay").classList.remove("show");
}
function copyReviewExport() {
    const ta = document.getElementById("reviewExportCode");
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
const COMPARE_KEY = "fox_compare";
const COMPARE_MAX = 2;

function getCompareList() {
    return JSON.parse(localStorage.getItem(COMPARE_KEY)) || [];
}
function saveCompareList(list) {
    localStorage.setItem(COMPARE_KEY, JSON.stringify(list));
    updateCompareBadge();
}

// Thêm vào so sánh + chuyển trang (dùng cho nút ⚖️ trên card)
function addToCompareAndGo(id) {
    let list = getCompareList();
    if (!list.includes(id)) {
        if (list.length >= COMPARE_MAX) list.shift(); // Bỏ cái cũ nhất
        list.push(id);
        saveCompareList(list);
    }
    location.href = "compare.html";
}

// Dùng cho picker trong trang compare
function setCompareSlot(slotIndex, id) {
    let list = getCompareList();
    while (list.length < COMPARE_MAX) list.push("");
    list[slotIndex] = id;
    saveCompareList(list);
}

function toggleCompare(id) {
    let list = getCompareList();
    const idx = list.indexOf(id);
    if (idx >= 0) {
        list.splice(idx, 1);
        showToast("➖ Đã bỏ khỏi so sánh");
    } else {
        if (list.filter(Boolean).length >= COMPARE_MAX) {
            showToast(`❌ Chỉ so sánh tối đa ${COMPARE_MAX} sản phẩm!`);
            return;
        }
        list.push(id);
        showToast("⚖️ Đã thêm vào so sánh");
    }
    saveCompareList(list);
    refreshAllCards();
}
function clearCompare() {
    saveCompareList([]);
    refreshAllCards();
}
function updateCompareBadge() {
    const badge = document.getElementById("compareBadge");
    if (!badge) return;
    const count = getCompareList().filter(Boolean).length;
    badge.textContent = count;
    badge.style.display = count ? "grid" : "none";
}

function refreshAllCards() {
    if (typeof filterAndRender === "function" && document.getElementById("categoryGrid")) {
        filterAndRender();
        return;
    }
    ["new", "hot", "sale"].forEach(g => {
        const box = document.getElementById(`grid${g.charAt(0).toUpperCase() + g.slice(1)}`);
        if (box && typeof renderGroup === "function") renderGroup(g, box.id);
    });
    if (typeof renderOutOfStock === "function") renderOutOfStock();
    if (typeof renderViewed === "function" && document.getElementById("gridViewed")) renderViewed();
}
let currentFilter = { group: "", category: "", brands: [], priceMin: 0, priceMax: Infinity, sort: "default", keyword: "" };

function readURLParams() {
    const defaultGroup = document.querySelector('input[name="group"][value=""]');
    if (defaultGroup) defaultGroup.checked = true;
    const defaultCat = document.querySelector('input[name="cat"][value=""]');
    if (defaultCat) defaultCat.checked = true;

    const params = new URLSearchParams(location.search);
    if (params.get("group")) currentFilter.group = params.get("group");
    if (params.get("cat")) currentFilter.category = params.get("cat");
    if (params.get("brand")) currentFilter.brands = [params.get("brand")];
    if (params.get("search")) currentFilter.keyword = params.get("search");

    if (currentFilter.group) {
        const g = document.querySelector(`input[name="group"][value="${currentFilter.group}"]`);
        if (g) g.checked = true;
    }
    if (currentFilter.category) {
        const c = document.querySelector(`input[name="cat"][value="${currentFilter.category}"]`);
        if (c) c.checked = true;
    }
}

function renderSidebar() {
    const catBox = document.getElementById("categoryList");
    catBox.innerHTML = `
    <label class="filter-option ${!currentFilter.category ? 'active' : ''}">
      <input type="radio" name="cat" value="" onchange="applyFilter()" ${!currentFilter.category ? 'checked' : ''}>
      Tất cả danh mục
    </label>` + getCategories().map(c => `
    <label class="filter-option ${currentFilter.category === c.slug ? 'active' : ''}">
      <input type="radio" name="cat" value="${c.slug}" onchange="applyFilter()" ${currentFilter.category === c.slug ? 'checked' : ''}>
      ${c.name}
    </label>`).join("");

    const brands = [...new Set(getProducts().map(p => p.brand))].sort();
    const brandBox = document.getElementById("brandList");
    brandBox.innerHTML = brands.map(b => `
    <label class="filter-option ${currentFilter.brands.includes(b) ? 'active' : ''}">
      <input type="checkbox" value="${b}" onchange="toggleBrand('${b}', this.checked)" ${currentFilter.brands.includes(b) ? 'checked' : ''}>
      ${b}
    </label>`).join("");
}

function toggleBrand(brand, checked) {
    if (checked) { if (!currentFilter.brands.includes(brand)) currentFilter.brands.push(brand); }
    else currentFilter.brands = currentFilter.brands.filter(b => b !== brand);
    applyFilter();
}

function applyFilter() {
    const g = document.querySelector('input[name="group"]:checked');
    currentFilter.group = g ? g.value : "";
    const c = document.querySelector('input[name="cat"]:checked');
    currentFilter.category = c ? c.value : "";
    currentFilter.priceMin = parseInt(document.getElementById("priceMin").value) || 0;
    currentFilter.priceMax = parseInt(document.getElementById("priceMax").value) || Infinity;
    currentFilter.sort = document.getElementById("sortSelect").value;

    document.querySelectorAll(".filter-option").forEach(el => el.classList.remove("active"));
    document.querySelectorAll('input:checked').forEach(inp => inp.closest(".filter-option")?.classList.add("active"));

    filterAndRender();
    renderActiveChips();
}

function resetFilter() {
    currentFilter = { group: "", category: "", brands: [], priceMin: 0, priceMax: Infinity, sort: "default", keyword: "" };
    document.getElementById("priceMin").value = "";
    document.getElementById("priceMax").value = "";
    document.getElementById("sortSelect").value = "default";
    document.querySelector('input[name="group"][value=""]').checked = true;
    renderSidebar();
    readURLParams();
    applyFilter();
}

function filterAndRender() {
    let list = [...getProducts()];

    // Group filter (đặc biệt cho "out")
    if (currentFilter.group === "out") {
        list = list.filter(p => p.stock === 0);
    } else if (currentFilter.group) {
        list = list.filter(p => p.group === currentFilter.group && p.stock > 0);
    } else {
        list = list.filter(p => p.stock > 0); // Mặc định ẩn hết hàng
    }

    if (currentFilter.category) list = list.filter(p => p.category === currentFilter.category);
    if (currentFilter.brands.length) list = list.filter(p => currentFilter.brands.includes(p.brand));
    list = list.filter(p => p.price >= currentFilter.priceMin && p.price <= currentFilter.priceMax);
    if (currentFilter.keyword) {
        const k = currentFilter.keyword.toLowerCase();
        list = list.filter(p => p.name.toLowerCase().includes(k) || p.brand.toLowerCase().includes(k));
    }
    switch (currentFilter.sort) {
        case "price-asc": list.sort((a, b) => a.price - b.price); break;
        case "price-desc": list.sort((a, b) => b.price - a.price); break;
        case "name-asc": list.sort((a, b) => a.name.localeCompare(b.name)); break;
        case "name-desc": list.sort((a, b) => b.name.localeCompare(a.name)); break;
    }
    const grid = document.getElementById("categoryGrid");
    const empty = document.getElementById("emptyState");
    document.getElementById("resultCount").textContent = list.length;
    if (!list.length) { grid.innerHTML = ""; empty.style.display = "block"; }
    else { grid.innerHTML = list.map(productCardHTML).join(""); empty.style.display = "none"; }
    updateBreadcrumb();
}

function renderActiveChips() {
    const box = document.getElementById("activeFilters");
    const chips = [];
    if (currentFilter.group) {
        const map = { new: "Sản phẩm mới", hot: "Sản phẩm hot", sale: "Khuyến mãi", out: "Hết hàng" };
        chips.push({ label: map[currentFilter.group], action: "clearGroup()" });
    }
    if (currentFilter.category) {
        const cat = getCategories().find(c => c.slug === currentFilter.category);
        if (cat) chips.push({ label: cat.name, action: "clearCategory()" });
    }
    currentFilter.brands.forEach(b => chips.push({ label: b, action: `clearBrand('${b}')` }));
    if (currentFilter.priceMin > 0 || currentFilter.priceMax !== Infinity) {
        const minTxt = currentFilter.priceMin > 0 ? fmt(currentFilter.priceMin) : "0₫";
        const maxTxt = currentFilter.priceMax !== Infinity ? fmt(currentFilter.priceMax) : "∞";
        chips.push({ label: `${minTxt} – ${maxTxt}`, action: "clearPrice()" });
    }
    box.innerHTML = chips.map(c => `<span class="chip" onclick="${c.action}">${c.label} ✕</span>`).join("");
}

function clearGroup() {
    document.querySelector('input[name="group"][value=""]').checked = true;
    applyFilter();
}
function clearCategory() {
    document.querySelector('input[name="cat"][value=""]').checked = true;
    applyFilter();
}
function clearBrand(b) {
    currentFilter.brands = currentFilter.brands.filter(x => x !== b);
    renderSidebar();
    applyFilter();
}
function clearPrice() {
    document.getElementById("priceMin").value = "";
    document.getElementById("priceMax").value = "";
    applyFilter();
}

function updateBreadcrumb() {
    const el = document.getElementById("breadcrumbCurrent");
    if (currentFilter.group) {
        const map = { new: "Sản phẩm mới", hot: "Sản phẩm hot", sale: "Khuyến mãi", out: "Sản phẩm hết hàng" };
        el.textContent = map[currentFilter.group];
    } else if (currentFilter.category) {
        const cat = getCategories().find(c => c.slug === currentFilter.category);
        el.textContent = cat ? cat.name : "Danh mục";
    } else {
        el.textContent = "Tất cả sản phẩm";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    injectLayout("category");
    renderSidebar();
    readURLParams();
    applyFilter();
});
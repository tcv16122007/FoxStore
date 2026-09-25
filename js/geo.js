const FOX_STORES = [
  { name: "Fox Store Hải Châu", lat: 16.0544, lng: 108.2022, addr: "123 Nguyễn Văn Linh, Hải Châu, Đà Nẵng" },
  { name: "Fox Store Thanh Khê", lat: 16.0678, lng: 108.1904, addr: "456 Điện Biên Phủ, Thanh Khê, Đà Nẵng" },
  { name: "Fox Store Sơn Trà", lat: 16.0951, lng: 108.2461, addr: "789 Ngô Quyền, Sơn Trà, Đà Nẵng" },
  { name: "Fox Store Ngũ Hành Sơn", lat: 16.0037, lng: 108.2621, addr: "101 Lê Văn Hiến, Ngũ Hành Sơn, Đà Nẵng" }
];

function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371, toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestStore() {
  const box = document.getElementById("geoResult");
  if (!box) return;
  box.innerHTML = `<p style="color:var(--muted)">📍 Đang xác định vị trí...</p>`;
  if (!navigator.geolocation) {
    box.innerHTML = `<p style="color:var(--danger)">Trình duyệt không hỗ trợ Geolocation.</p>`;
    return;
  }
  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      const sorted = FOX_STORES.map(s => ({ ...s, dist: distanceKm(lat, lng, s.lat, s.lng) })).sort((a, b) => a.dist - b.dist);
      const nearest = sorted[0];
      box.innerHTML = `
        <div style="background:rgba(255,107,0,.08);border:1px solid var(--accent);border-radius:12px;padding:20px;margin-bottom:16px">
          <h4 style="color:var(--accent);margin-bottom:8px">🏪 Cửa hàng gần bạn nhất</h4>
          <p><b>${nearest.name}</b></p>
          <p style="color:var(--muted)">${nearest.addr}</p>
          <p style="margin-top:8px">📏 Cách bạn <b style="color:var(--accent)">${nearest.dist.toFixed(2)} km</b></p>
        </div>
        <h4 style="margin-bottom:12px">Tất cả cửa hàng</h4>
        ${sorted.map(s => `
          <div class="geo-store-item">
            <div><b>${s.name}</b><br><span style="color:var(--muted);font-size:13px">${s.addr}</span></div>
            <span class="dist">${s.dist.toFixed(2)} km</span>
          </div>`).join("")}`;
    },
    err => {
      box.innerHTML = `
        <p style="color:var(--danger);margin-bottom:12px">❌ Không lấy được vị trí: ${err.message}</p>
        <p style="color:var(--muted);margin-bottom:12px">Xem tất cả cửa hàng bên dưới:</p>
        ${FOX_STORES.map(s => `
          <div class="geo-store-item">
            <div><b>${s.name}</b><br><span style="color:var(--muted);font-size:13px">${s.addr}</span></div>
          </div>`).join("")}`;
    },
    { timeout: 10000 }
  );
}
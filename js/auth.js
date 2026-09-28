const USER_KEY = "fox_users";
const CURRENT_KEY = "fox_current";
const REDIRECT_KEY = "fox_redirect";

function getUsers() { return JSON.parse(localStorage.getItem(USER_KEY)) || []; }
function saveUsers(u) { localStorage.setItem(USER_KEY, JSON.stringify(u)); }
function getCurrentUser() { return JSON.parse(localStorage.getItem(CURRENT_KEY)); }

function getCurrentRole() { return getCurrentUser()?.role || "guest"; }
function isAdmin() { return getCurrentUser()?.role === "admin"; }
function isUser() { return getCurrentUser()?.role === "user" && getCurrentUser()?.shipperStatus !== "approved"; }
function isShipper() { return getCurrentUser()?.shipperStatus === "approved"; }
function isPendingShipper() { return getCurrentUser()?.shipperStatus === "pending"; }
function isGuest() { return !getCurrentUser(); }
function isOwner() { return isAdmin(); }

function register(name, email, phone, password, wantShipper = false) {
    const users = getUsers();
    email = String(email || "").trim();
    phone = String(phone || "").trim();
    password = String(password || "").trim();

    if (users.find(u => u.email === email)) return { ok: false, msg: "Email đã tồn tại!" };
    if (users.find(u => u.phone === phone)) return { ok: false, msg: "SĐT đã được sử dụng!" };

    users.push({
        name: String(name || "").trim(),
        email, phone, password,
        username: email.split("@")[0],
        role: "user",
        shipperStatus: wantShipper ? "pending" : "none",
        createdAt: Date.now()
    });
    saveUsers(users);
    return {
        ok: true,
        msg: wantShipper
            ? "Đăng ký thành công! Đang chờ admin duyệt làm shipper."
            : "Đăng ký thành công!"
    };
}

function login(identifier, password) {
    const users = getUsers();
    const raw = String(identifier || "").trim();
    const idf = raw.toLowerCase();
    const pwClean = String(password || "").trim();

    const u = users.find(u => {
        const matchEmail = u.email && u.email.toLowerCase() === idf;
        const matchUsername = u.username && u.username.toLowerCase() === idf;
        const matchPhone = u.phone && String(u.phone).trim() === raw;
        return (matchEmail || matchUsername || matchPhone) && String(u.password).trim() === pwClean;
    });

    if (!u) return { ok: false, msg: "Sai tài khoản hoặc mật khẩu!" };
    localStorage.setItem(CURRENT_KEY, JSON.stringify(u));
    return {
        ok: true,
        msg: "Đăng nhập thành công!",
        role: u.role,
        shipper: u.shipperStatus === "approved"
    };
}

function resetPassword(name, email, phone, newPw) {
    const users = getUsers();
    const u = users.find(u =>
        String(u.name).toLowerCase() === String(name).toLowerCase().trim() &&
        u.email === String(email).trim() &&
        u.phone === String(phone).trim()
    );
    if (!u) return { ok: false, msg: "Thông tin không khớp tài khoản nào!" };
    u.password = String(newPw).trim();
    saveUsers(users);
    return { ok: true, msg: "Đổi mật khẩu thành công! Vui lòng đăng nhập lại." };
}

function logout() {
    localStorage.removeItem(CURRENT_KEY);
    location.href = "index.html";
}

function approveShipper(email) {
    if (!isAdmin()) return false;
    const users = getUsers();
    const u = users.find(x => x.email === email);
    if (!u) return false;
    u.shipperStatus = "approved";
    saveUsers(users);
    return true;
}
function rejectShipper(email) {
    if (!isAdmin()) return false;
    const users = getUsers();
    const u = users.find(x => x.email === email);
    if (!u) return false;
    u.shipperStatus = "rejected";
    saveUsers(users);
    return true;
}
function getPendingShippers() { return getUsers().filter(u => u.shipperStatus === "pending"); }
function getAllShippers() { return getUsers().filter(u => u.shipperStatus === "approved"); }

function requireAdmin() {
    if (!isAdmin()) { alert("Bạn không có quyền truy cập!"); location.href = "login.html"; return false; }
    return true;
}
function requireUser(redirectBack = false) {
    if (!getCurrentUser()) {
        if (redirectBack) sessionStorage.setItem(REDIRECT_KEY, location.pathname + location.search);
        alert("Vui lòng đăng nhập để tiếp tục!");
        location.href = "login.html";
        return false;
    }
    return true;
}
function requireShipper() {
    if (!getCurrentUser() || !isShipper()) {
        alert("Bạn không phải shipper hoặc chưa được duyệt!");
        location.href = "index.html";
        return false;
    }
    return true;
}
function redirectAfterLogin() {
    const back = sessionStorage.getItem(REDIRECT_KEY);
    if (back) { sessionStorage.removeItem(REDIRECT_KEY); location.href = back; return true; }
    return false;
}

function togglePw(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === "password") {
        input.type = "text";
        btn.textContent = "🙈";
        btn.title = "Ẩn mật khẩu";
    } else {
        input.type = "password";
        btn.textContent = "👁️";
        btn.title = "Hiện mật khẩu";
    }
}
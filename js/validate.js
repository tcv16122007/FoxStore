function validateEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim()); }
function validatePhone(v) { return /^(0|\+84)\d{9,10}$/.test(String(v).replace(/\s/g, "")); }
function validateUsername(v) { return /^[a-zA-Z0-9_]{3,30}$/.test(String(v).trim()); }
function isAllDigits(v) { return /^\d+$/.test(String(v).replace(/\s/g, "")); }

function showError(id, msg) {
    const el = document.getElementById(id + "Error");
    const input = document.getElementById(id);
    if (el) { el.textContent = msg; el.classList.add("show"); }
    if (input) input.classList.add("error");
}
function clearError(id) {
    const el = document.getElementById(id + "Error");
    const input = document.getElementById(id);
    if (el) el.classList.remove("show");
    if (input) input.classList.remove("error");
}

function handleContact(e) {
    e.preventDefault();
    let ok = true;
    const name = document.getElementById("contactName").value.trim();
    const email = document.getElementById("contactEmail").value.trim();
    const phone = document.getElementById("contactPhone").value.trim();
    const msg = document.getElementById("contactMsg").value.trim();
    ["contactName", "contactEmail", "contactPhone", "contactMsg"].forEach(clearError);
    if (!name) { showError("contactName", "Vui lòng nhập họ tên"); ok = false; }
    if (!email) { showError("contactEmail", "Vui lòng nhập email"); ok = false; }
    else if (!validateEmail(email)) { showError("contactEmail", "Email không hợp lệ"); ok = false; }
    if (!phone) { showError("contactPhone", "Vui lòng nhập SĐT"); ok = false; }
    else if (!validatePhone(phone)) { showError("contactPhone", "SĐT không hợp lệ"); ok = false; }
    if (!msg) { showError("contactMsg", "Vui lòng nhập nội dung"); ok = false; }
    if (ok) { showToast("✅ Gửi liên hệ thành công!"); e.target.reset(); }
}

function handleLogin(e) {
    e.preventDefault();
    const idf = document.getElementById("loginEmail").value.trim();
    const pw = document.getElementById("loginPassword").value.trim();
    ["loginEmail", "loginPassword"].forEach(clearError);

    if (!idf) {
        showError("loginEmail", "Vui lòng nhập Email / SĐT / Username");
        return;
    }

    if (idf.includes("@")) {
        if (!validateEmail(idf)) { showError("loginEmail", "Email không hợp lệ"); return; }
    } else if (isAllDigits(idf)) {
        if (!validatePhone(idf)) { showError("loginEmail", "SĐT không hợp lệ (VD: 0901234567)"); return; }
    }

    if (!pw) { showError("loginPassword", "Vui lòng nhập mật khẩu"); return; }

    const res = login(idf, pw);
    showToast(res.ok ? "✅ " + res.msg : "❌ " + res.msg);
    if (res.ok) {
        setTimeout(() => {
            if (redirectAfterLogin()) return;
            if (res.role === "admin") location.href = "admin.html";
            else if (res.shipper) location.href = "shipper.html";
            else location.href = "index.html";
        }, 800);
    }
}

function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const phone = document.getElementById("regPhone").value.trim();
    const pw = document.getElementById("regPassword").value.trim();
    const pw2 = document.getElementById("regPassword2").value.trim();
    const wantShipper = document.getElementById("regShipper")?.checked || false;

    ["regName", "regEmail", "regPhone", "regPassword", "regPassword2"].forEach(clearError);

    if (!name) { showError("regName", "Vui lòng nhập họ tên"); return; }
    if (!email) { showError("regEmail", "Vui lòng nhập email"); return; }
    if (!validateEmail(email)) { showError("regEmail", "Email không hợp lệ"); return; }
    if (!phone) { showError("regPhone", "Vui lòng nhập SĐT"); return; }
    if (!validatePhone(phone)) { showError("regPhone", "SĐT không hợp lệ (VD: 0901234567)"); return; }
    if (pw.length < 6) { showError("regPassword", "Mật khẩu ≥ 6 ký tự"); return; }
    if (pw !== pw2) { showError("regPassword2", "Mật khẩu không khớp"); return; }

    const res = register(name, email, phone, pw, wantShipper);
    showToast(res.ok ? "✅ " + res.msg : "❌ " + res.msg);
    if (res.ok) {
        const lr = login(email, pw);
        if (lr.ok) {
            setTimeout(() => {
                if (redirectAfterLogin()) return;
                location.href = "index.html";
            }, 900);
        } else {
            setTimeout(() => switchTab("login"), 900);
        }
    }
}

function handleForgot(e) {
    e.preventDefault();
    const name = document.getElementById("forgotName").value.trim();
    const email = document.getElementById("forgotEmail").value.trim();
    const phone = document.getElementById("forgotPhone").value.trim();
    const newPw = document.getElementById("forgotNewPw").value.trim();
    const newPw2 = document.getElementById("forgotNewPw2").value.trim();

    ["forgotName", "forgotEmail", "forgotPhone", "forgotNewPw", "forgotNewPw2"].forEach(clearError);

    if (!name) { showError("forgotName", "Vui lòng nhập họ tên"); return; }
    if (!email) { showError("forgotEmail", "Vui lòng nhập email"); return; }
    if (!validateEmail(email)) { showError("forgotEmail", "Email không hợp lệ"); return; }
    if (!phone) { showError("forgotPhone", "Vui lòng nhập SĐT"); return; }
    if (!validatePhone(phone)) { showError("forgotPhone", "SĐT không hợp lệ"); return; }
    if (newPw.length < 6) { showError("forgotNewPw", "Mật khẩu mới ≥ 6 ký tự"); return; }
    if (newPw !== newPw2) { showError("forgotNewPw2", "Mật khẩu nhập lại không khớp"); return; }

    const res = resetPassword(name, email, phone, newPw);
    showToast(res.ok ? "✅ " + res.msg : "❌ " + res.msg);
    if (res.ok) setTimeout(() => { switchTab("login"); e.target.reset(); }, 900);
}

function switchTab(tab) {
    document.querySelectorAll(".auth-tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".auth-form").forEach(f => f.classList.remove("active"));
    document.querySelector(`[data-tab="${tab}"]`).classList.add("active");
    document.getElementById(tab + "Form").classList.add("active");
}
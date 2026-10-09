// =====================================================
// WANSTEKNIK ADMIN PANEL (admin.js)
// =====================================================

const SUPABASE_URL = "https://kxdqviatkjonsfqywgwy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_cdjpVfFpB7WK36DrVKlr6g_E4b9XM-2";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const loginForm = document.querySelector("#loginForm");
const loginCard = document.querySelector("#loginCard");
const adminApp = document.querySelector("#adminApp");
const loginStatus = document.querySelector("#loginStatus");
const logoutBtn = document.querySelector("#logout");

// 1. CEK SESI LOGIN SUPABASE OTOMATIS
async function checkAuthSession() {
  const { data: { session } } = await db.auth.getSession();
  if (session) {
    if (loginCard) loginCard.classList.add("hidden");
    if (adminApp) adminApp.classList.remove("hidden");
  } else {
    if (loginCard) loginCard.classList.remove("hidden");
    if (adminApp) adminApp.classList.add("hidden");
  }
}
checkAuthSession();

// 2. HANDLER FORM LOGIN
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.querySelector("#email").value.trim();
    const password = document.querySelector("#password").value;

    if (loginStatus) {
      loginStatus.className = "status loading";
      loginStatus.textContent = "Memeriksa data masuk...";
    }

    try {
      const { data, error } = await db.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (loginStatus) {
        loginStatus.className = "status success";
        loginStatus.textContent = "Berhasil masuk!";
      }

      if (loginCard) loginCard.classList.add("hidden");
      if (adminApp) adminApp.classList.remove("hidden");
    } catch (err) {
      console.error("Login gagal:", err);
      if (loginStatus) {
        loginStatus.className = "status error";
        loginStatus.textContent = "Login gagal: " + (err.message || "Email / password salah.");
      }
    }
  });
}

// 3. HANDLER LOGOUT
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await db.auth.signOut();
    if (adminApp) adminApp.classList.add("hidden");
    if (loginCard) loginCard.classList.remove("hidden");
    if (loginForm) loginForm.reset();
  });
}

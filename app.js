const SUPABASE_URL = "https://kxdqviatkjonsfqywgwy.supabase.co";
const SUPABASE_KEY = "sb_publishable_cdjpVfFpB7WK36DrVKlr6g_E4b9XM-2";

const GOOGLE_FORM_PEMASUKAN =
  "https://docs.google.com/forms/d/e/1FAIpQLSccon3ljevYDcKWZTKpTjEoNzcf7NMDPxADMG-Wm9uuw4tmKA/viewform";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let alarmTimer = null;

function openPage(page) {
  const content = document.getElementById("content");

  if (page === "home") {
    content.innerHTML = "<h3>🏠 Home</h3><p>Selamat datang di sistem WansTeknik.</p>";
  }

  if (page === "jadwal") showJadwal();

  if (page === "pengajuan") {
    content.innerHTML = "<h3>📝 Pengajuan</h3><p>Area khusus admin untuk melihat data pengajuan.</p>";
  }

  if (page === "galeri") {
    content.innerHTML = "<h3>🗂️ Galeri & Arsip</h3><p>Sejarah WansTeknik, logo, foto dan dokumen penting.</p>";
  }
}

function openPemasukan() {
  window.open(GOOGLE_FORM_PEMASUKAN, "_blank");
}

async function showJadwal() {
  const content = document.getElementById("content");

  content.innerHTML = `
    <h3>📅 Jadwal & Alarm</h3>
    <p>Jadwal tersimpan di Supabase.</p>

    <form class="schedule-form" id="scheduleForm">
      <input id="judul" type="text" placeholder="Contoh: Service AC Eva" required>
      <input id="waktu" type="datetime-local" required>
      <textarea id="catatan" placeholder="Catatan pekerjaan"></textarea>
      <label><input id="alarm" type="checkbox" checked> Aktifkan alarm</label>
      <button class="primary-btn" type="submit">💾 Simpan Jadwal</button>
    </form>

    <div id="scheduleStatus"></div>
    <div id="scheduleList"><p>Memuat...</p></div>
  `;

  document.getElementById("scheduleForm").addEventListener("submit", saveJadwal);
  await loadJadwal();
}

async function saveJadwal(event) {
  event.preventDefault();

  const status = document.getElementById("scheduleStatus");
  const waktu = new Date(document.getElementById("waktu").value).toISOString();

  const { error } = await db.from("jadwal").insert({
    judul: document.getElementById("judul").value.trim(),
    waktu: waktu,
    alarm: document.getElementById("alarm").checked,
    catatan: document.getElementById("catatan").value.trim()
  });

  if (error) {
    status.innerHTML = `<div class="status error">Gagal: ${escapeHtml(error.message)}</div>`;
    return;
  }

  status.innerHTML = '<div class="status ok">Jadwal tersimpan di Supabase.</div>';
  document.getElementById("scheduleForm").reset();
  document.getElementById("alarm").checked = true;
  await loadJadwal();
}

async function loadJadwal() {
  const list = document.getElementById("scheduleList");
  if (!list) return;

  const { data, error } = await db
    .from("jadwal")
    .select("*")
    .order("waktu", { ascending: true });

  if (error) {
    list.innerHTML = `<div class="status error">Supabase: ${escapeHtml(error.message)}</div>`;
    return;
  }

  if (!data.length) {
    list.innerHTML = '<div class="status">Belum ada jadwal.</div>';
    return;
  }

  list.innerHTML = data.map(item => `
    <div class="schedule-item">
      <strong>📌 ${escapeHtml(item.judul)}</strong>
      <div class="schedule-meta">
        🕐 ${new Date(item.waktu).toLocaleString("id-ID")}<br>
        🔔 Alarm: ${item.alarm ? "Aktif" : "Tidak aktif"}
        ${item.catatan ? "<br>📝 " + escapeHtml(item.catatan) : ""}
      </div>
      <button class="delete-btn" onclick="hapusJadwal('${item.id}')">Hapus</button>
    </div>
  `).join("");

  setAlarm(data);
}

async function hapusJadwal(id) {
  if (!confirm("Hapus jadwal ini?")) return;

  const { error } = await db.from("jadwal").delete().eq("id", id);

  if (error) {
    alert("Gagal menghapus: " + error.message);
    return;
  }

  await loadJadwal();
}

function setAlarm(data) {
  if (alarmTimer) clearTimeout(alarmTimer);

  const next = data
    .filter(item => item.alarm && new Date(item.waktu).getTime() > Date.now())
    .sort((a, b) => new Date(a.waktu) - new Date(b.waktu))[0];

  if (!next) return;

  const delay = new Date(next.waktu).getTime() - Date.now();

  alarmTimer = setTimeout(() => {
    alert("🔔 WansTeknik\n\nSaatnya: " + next.judul);
  }, Math.min(delay, 2147483647));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

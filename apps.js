// WansTeknik V1 - fungsi menu + Supabase Jadwal
const SUPABASE_URL = "https://kxdqviatkjonsfqywgwy.supabase.co";
const SUPABASE_KEY = "sb_publishable_cdjpVfFpB7WK36DrVKlr6g_E4b9XM-2";
const GOOGLE_FORM_PEMASUKAN = "https://docs.google.com/forms/d/e/1FAIpQLSccon3ljevYDcKWZTKpTjEoNzcf7NMDPxADMG-Wm9uuw4tmKA/viewform";

let db = null;
let alarmTimer = null;

// Supabase hanya diinisialisasi kalau library berhasil dimuat.
if (window.supabase && window.supabase.createClient) {
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

function setContent(html) {
  document.getElementById("content").innerHTML = html;
}

function openHome() {
  setContent(`
    <h3>🏠 Home</h3>
    <p>Selamat datang di sistem WansTeknik.</p>
    <p>Semua menu sudah siap digunakan.</p>
  `);
}

function openPemasukan() {
  window.open(GOOGLE_FORM_PEMASUKAN, "_blank");
}

function openPengajuan() {
  setContent(`
    <h3>📝 Pengajuan</h3>
    <p>Menu pengajuan WansTeknik.</p>
    <p>Bagian ini akan kita hubungkan ke Google Sheet pada tahap berikutnya.</p>
  `);
}

function openGaleri() {
  setContent(`
    <h3>🗂️ Galeri & Arsip</h3>
    <p>Tempat sejarah WansTeknik, logo, foto dan dokumen penting.</p>
    <p>Akses admin akan ditambahkan pada tahap berikutnya.</p>
  `);
}

async function openJadwal() {
  setContent(`
    <h3>📅 Jadwal & Alarm</h3>
    <p>Data jadwal tersimpan di Supabase.</p>

    <form id="jadwalForm" class="form">
      <input id="judul" type="text" placeholder="Contoh: Service AC Eva" required>
      <input id="waktu" type="datetime-local" required>
      <textarea id="catatan" placeholder="Catatan pekerjaan"></textarea>
      <label><input id="alarm" type="checkbox" checked> Aktifkan alarm</label>
      <button type="submit">💾 Simpan Jadwal</button>
    </form>

    <div id="jadwalStatus"></div>
    <div id="jadwalList"><p>Memuat jadwal...</p></div>
  `);

  document.getElementById("jadwalForm").addEventListener("submit", simpanJadwal);
  await muatJadwal();
}

async function simpanJadwal(e) {
  e.preventDefault();

  if (!db) {
    tampilStatus("Supabase belum termuat. Coba refresh aplikasi.", true);
    return;
  }

  const judul = document.getElementById("judul").value.trim();
  const waktuInput = document.getElementById("waktu").value;
  const catatan = document.getElementById("catatan").value.trim();
  const alarm = document.getElementById("alarm").checked;

  const waktu = new Date(waktuInput).toISOString();

  tampilStatus("Menyimpan...");

  const { error } = await db.from("jadwal").insert({
    judul: judul,
    waktu: waktu,
    alarm: alarm,
    catatan: catatan
  });

  if (error) {
    tampilStatus("Gagal menyimpan: " + error.message, true);
    return;
  }

  tampilStatus("Jadwal berhasil disimpan ke Supabase.");
  document.getElementById("jadwalForm").reset();
  document.getElementById("alarm").checked = true;
  await muatJadwal();
}

async function muatJadwal() {
  const list = document.getElementById("jadwalList");
  if (!list) return;

  if (!db) {
    list.innerHTML = '<div class="status error">Supabase belum terhubung.</div>';
    return;
  }

  const { data, error } = await db
    .from("jadwal")
    .select("*")
    .order("waktu", { ascending: true });

  if (error) {
    list.innerHTML = '<div class="status error">Tidak bisa membaca jadwal: ' + escapeHtml(error.message) + '</div>';
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = '<div class="status">Belum ada jadwal.</div>';
    return;
  }

  list.innerHTML = data.map(item => `
    <div class="schedule">
      <strong>📌 ${escapeHtml(item.judul)}</strong>
      <div class="meta">
        🕐 ${new Date(item.waktu).toLocaleString("id-ID")}<br>
        🔔 Alarm: ${item.alarm ? "Aktif" : "Tidak aktif"}
        ${item.catatan ? "<br>📝 " + escapeHtml(item.catatan) : ""}
      </div>
      <button class="delete" type="button" onclick="hapusJadwal('${item.id}')">Hapus</button>
    </div>
  `).join("");

  pasangAlarm(data);
}

async function hapusJadwal(id) {
  if (!db) return;
  if (!confirm("Hapus jadwal ini?")) return;

  const { error } = await db.from("jadwal").delete().eq("id", id);

  if (error) {
    alert("Gagal menghapus: " + error.message);
    return;
  }

  await muatJadwal();
}

function pasangAlarm(data) {
  if (alarmTimer) clearTimeout(alarmTimer);

  const berikutnya = data
    .filter(x => x.alarm && new Date(x.waktu).getTime() > Date.now())
    .sort((a,b) => new Date(a.waktu) - new Date(b.waktu))[0];

  if (!berikutnya) return;

  const delay = new Date(berikutnya.waktu).getTime() - Date.now();

  alarmTimer = setTimeout(function() {
    alert("🔔 WansTeknik\n\nSaatnya: " + berikutnya.judul);
  }, Math.min(delay, 2147483647));
}

function tampilStatus(pesan, error = false) {
  const el = document.getElementById("jadwalStatus");
  if (!el) return;
  el.innerHTML = '<div class="status ' + (error ? 'error' : 'ok') + '">' + escapeHtml(pesan) + '</div>';
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

const GOOGLE_FORM_PEMASUKAN =
  "https://docs.google.com/forms/d/e/1FAIpQLSccon3ljevYDcKWZTKpTjEoNzcf7NMDPxADMG-Wm9uuw4tmKA/viewform";

function openPage(page) {

  const content = document.getElementById("content");

  if (page === "home") {
    content.innerHTML = `
      <h3>🏠 Home</h3>
      <p>Selamat datang di sistem WansTeknik.</p>
    `;
  }

  if (page === "jadwal") {
    content.innerHTML = `
      <h3>📅 Jadwal & Alarm</h3>
      <p>Modul jadwal akan kita hubungkan ke database Supabase pada tahap berikutnya.</p>
    `;
  }

  if (page === "pengajuan") {
    content.innerHTML = `
      <h3>📝 Pengajuan</h3>
      <p>Area khusus admin untuk melihat data pengajuan.</p>
      <p>Google Sheet akan kita hubungkan pada tahap berikutnya.</p>
    `;
  }

  if (page === "galeri") {
    content.innerHTML = `
      <h3>🗂️ Galeri & Arsip</h3>
      <p>Sejarah WansTeknik, logo, foto dan dokumen penting.</p>
      <p>Area ini akan diberi akses admin.</p>
    `;
  }
}

function openPemasukan() {
  window.open(GOOGLE_FORM_PEMASUKAN, "_blank");
}

const SUPABASE_URL="https://kxdqviatkjonsfqywgwy.supabase.co";
const SUPABASE_KEY="sb_publishable_cdjpVfFpB7WK36DrVKlr6g_E4b9XM-2";
const GOOGLE_FORM_PEMASUKAN="https://docs.google.com/forms/d/e/1FAIpQLSccon3ljevYDcKWZTKpTjEoNzcf7NMDPxADMG-Wm9uuw4tmKA/viewform";
const HOME_URL="https://wangaviss.github.io/WansTeknik/";
let db=window.supabase?.createClient(SUPABASE_URL,SUPABASE_KEY);

function content(html){document.getElementById("content").innerHTML=html}
function openHome(){
  window.open(HOME_URL,"_blank");
}
function openPemasukan(){
  window.open(GOOGLE_FORM_PEMASUKAN,"_blank");
}
function openJadwal(){
  content(`<h2>📅 Jadwal & Alarm</h2>
  <p>Modul jadwal sedang disiapkan untuk koneksi Supabase dan alarm Android.</p>
  <div class="status">V2.1: tampilan siap • V2.2: database + alarm</div>`);
}
function openPengajuan(){
  const pass=prompt("Masukkan password admin:");
  if(pass===null)return;
  content(`<h2>📝 Pengajuan</h2><p>Akses admin terdeteksi.</p>
  <div class="status">Modul pengajuan akan dihubungkan ke sistem admin/Supabase.</div>`);
}
function openGaleri(){
  content(`<h2>🗂️ Galeri & Arsip</h2>
  <p>Sejarah WansTeknik, dokumen penting, foto dan arsip akan dikelola melalui modul Storage.</p>
  <div class="status">V2.1: kerangka siap • Storage menyusul</div>`);
}

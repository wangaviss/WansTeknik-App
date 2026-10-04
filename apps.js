const SUPABASE_URL="https://kxdqviatkjonsfqywgwy.supabase.co";
const SUPABASE_KEY="sb_publishable_cdjpVfFpB7WK36DrVKlr6g_E4b9XM-2";
const GOOGLE_FORM_PEMASUKAN="https://docs.google.com/forms/d/e/1FAIpQLSccon3ljevYDcKWZTKpTjEoNzcf7NMDPxADMG-Wm9uuw4tmKA/viewform";
const HOME_URL="https://wangaviss.github.io/WansTeknik/";
let db=window.supabase?.createClient(SUPABASE_URL,SUPABASE_KEY);
let scheduleCache=[];

function content(html){document.getElementById("content").innerHTML=html}
function esc(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}

function openHome(){ window.location.href=HOME_URL; }
function openPemasukan(){ window.location.href=GOOGLE_FORM_PEMASUKAN; }

async function openJadwal(){
  content(`<h2>📅 Jadwal & Alarm</h2>
  <p>Jadwal tersimpan di Supabase. Alarm browser akan digunakan bila tersedia; untuk alarm saat aplikasi benar-benar tertutup, APK perlu bridge AlarmManager Android.</p>
  <div id="alarmStatus" class="status warn">Memeriksa dukungan notifikasi...</div>
  <form id="jadwalForm" class="form">
    <input id="judul" type="text" placeholder="Contoh: Service AC Eva" required>
    <input id="waktu" type="datetime-local" required>
    <textarea id="catatan" placeholder="Catatan pekerjaan"></textarea>
    <label><input id="alarm" type="checkbox" checked> Aktifkan alarm</label>
    <button type="submit">💾 Simpan Jadwal</button>
  </form>
  <div id="jadwalStatus"></div>
  <h3 class="section-title">Daftar Jadwal</h3>
  <div id="jadwalList">Memuat...</div>`);
  document.getElementById("jadwalForm").addEventListener("submit",simpanJadwal);
  await cekNotifikasi();
  await muatJadwal();
}

async function cekNotifikasi(){
  const el=document.getElementById("alarmStatus"); if(!el)return;
  if(!("Notification" in window)){
    el.className="status warn";
    el.textContent="Notifikasi browser tidak tersedia. APK Android tetap memerlukan AlarmManager untuk alarm saat app tertutup.";
    return;
  }
  if(Notification.permission==="granted"){
    el.className="status ok"; el.textContent="Notifikasi sudah diizinkan.";
  }else{
    el.className="status warn";
    el.innerHTML=`Notifikasi belum diizinkan. <button class="action" type="button" onclick="izinNotifikasi()">Izinkan Notifikasi</button>`;
  }
}
async function izinNotifikasi(){
  if(!("Notification" in window))return;
  const p=await Notification.requestPermission();
  const el=document.getElementById("alarmStatus");
  if(el){el.className=p==="granted"?"status ok":"status warn";el.textContent=p==="granted"?"Notifikasi diizinkan.":"Notifikasi belum diizinkan."}
}

async function simpanJadwal(e){
  e.preventDefault();
  if(!db){statusJadwal("Supabase belum termuat.",true);return}
  const judul=document.getElementById("judul").value.trim();
  const waktuInput=document.getElementById("waktu").value;
  const catatan=document.getElementById("catatan").value.trim();
  const alarm=document.getElementById("alarm").checked;
  const waktu=new Date(waktuInput).toISOString();
  statusJadwal("Menyimpan...");
  const {error}=await db.from("jadwal").insert({judul,waktu,alarm,catatan});
  if(error){statusJadwal("Gagal menyimpan: "+error.message,true);return}
  statusJadwal("Jadwal berhasil disimpan.");
  document.getElementById("jadwalForm").reset();
  document.getElementById("alarm").checked=true;
  await muatJadwal();
}
async function muatJadwal(){
  const list=document.getElementById("jadwalList"); if(!list)return;
  if(!db){list.innerHTML='<div class="status error">Supabase belum terhubung.</div>';return}
  const {data,error}=await db.from("jadwal").select("*").order("waktu",{ascending:true});
  if(error){list.innerHTML='<div class="status error">Gagal membaca jadwal: '+esc(error.message)+'</div>';return}
  scheduleCache=data||[];
  if(!scheduleCache.length){list.innerHTML='<div class="status">Belum ada jadwal.</div>';return}
  list.innerHTML=scheduleCache.map(x=>`
    <div class="schedule">
      <strong>📌 ${esc(x.judul)}</strong>
      <div class="meta">🕐 ${new Date(x.waktu).toLocaleString("id-ID")}<br>🔔 Alarm: ${x.alarm?"Aktif":"Tidak aktif"}${x.catatan?"<br>📝 "+esc(x.catatan):""}</div>
      <button class="delete" type="button" onclick="hapusJadwal('${x.id}')">Hapus</button>
    </div>`).join("");
  jadwalkanNotifikasi(scheduleCache);
}
async function hapusJadwal(id){
  if(!db||!confirm("Hapus jadwal ini?"))return;
  const {error}=await db.from("jadwal").delete().eq("id",id);
  if(error){alert("Gagal menghapus: "+error.message);return}
  await muatJadwal();
}
function statusJadwal(msg,error=false){
  const el=document.getElementById("jadwalStatus");if(!el)return;
  el.innerHTML='<div class="status '+(error?"error":"ok")+'">'+esc(msg)+'</div>';
}
function jadwalkanNotifikasi(data){
  const now=Date.now();
  data.filter(x=>x.alarm&&new Date(x.waktu).getTime()>now).forEach(x=>{
    const delay=new Date(x.waktu).getTime()-now;
    if(delay<=2147483647){
      setTimeout(async()=>{
        if("Notification" in window&&Notification.permission==="granted"){
          new Notification("WansTeknik",{body:"Saatnya: "+x.judul});
        }else{alert("🔔 WansTeknik\n\nSaatnya: "+x.judul)}
      },delay);
    }
  });
}

async function openPengajuan(){
  const {data:{session}}=await db.auth.getSession();
  if(session){return tampilPengajuan(session)}
  content(`<h2>📝 Pengajuan Admin</h2>
  <p>Login admin menggunakan Supabase Auth. Password tidak disimpan di kode aplikasi.</p>
  <form id="loginForm" class="form">
    <input id="adminEmail" type="email" placeholder="Email admin" required>
    <input id="adminPassword" type="password" placeholder="Password admin" required>
    <button type="submit">🔐 Login Admin</button>
  </form>
  <div id="loginStatus"></div>`);
  document.getElementById("loginForm").addEventListener("submit",loginAdmin);
}
async function loginAdmin(e){
  e.preventDefault();
  const email=document.getElementById("adminEmail").value.trim();
  const password=document.getElementById("adminPassword").value;
  const el=document.getElementById("loginStatus");el.innerHTML='<div class="status">Memproses login...</div>';
  const {data,error}=await db.auth.signInWithPassword({email,password});
  if(error){el.innerHTML='<div class="status error">'+esc(error.message)+'</div>';return}
  tampilPengajuan(data.session);
}
async function tampilPengajuan(session){
  content(`<h2>📝 Pengajuan</h2>
  <p>Login admin aktif: ${esc(session.user.email)}</p>
  <div class="inline">
    <button class="action" type="button" onclick="muatPengajuan()">🔄 Muat Data</button>
    <button class="action secondary" type="button" onclick="logoutAdmin()">Keluar</button>
  </div>
  <div id="pengajuanList"><div class="status">Memuat data...</div></div>`);
  await muatPengajuan();
}
async function muatPengajuan(){
  const list=document.getElementById("pengajuanList");if(!list)return;
  // Tabel pengajuan belum dibuat pada schema V1; tempat ini siap untuk tabel pengajuan.
  list.innerHTML='<div class="status warn">Tabel <b>pengajuan</b> belum dibuat. Jalankan SQL V2.2 yang ada di README.txt setelah login admin siap.</div>';
}
async function logoutAdmin(){await db.auth.signOut();openPengajuan()}

async function openGaleri(){
  if(!db){
    content('<h2>🗂️ Galeri & Arsip</h2><div class="status error">Supabase belum terhubung.</div>');
    return;
  }

  const {data:{session}} = await db.auth.getSession();

  if(session){
    return tampilGaleri(session);
  }

  content(`<h2>🔒 Galeri & Arsip</h2>
    <p>Bagian ini khusus admin. Silakan login menggunakan akun admin Supabase.</p>
    <form id="galeriLoginForm" class="form">
      <input id="galeriEmail" type="email" placeholder="Email admin" required>
      <input id="galeriPassword" type="password" placeholder="Password admin" required>
      <button type="submit">🔐 Masuk Galeri</button>
    </form>
    <div id="galeriLoginStatus"></div>`);
  document.getElementById("galeriLoginForm").addEventListener("submit", loginGaleri);
}

async function loginGaleri(e){
  e.preventDefault();
  const email=document.getElementById("galeriEmail").value.trim();
  const password=document.getElementById("galeriPassword").value;
  const el=document.getElementById("galeriLoginStatus");
  el.innerHTML='<div class="status">Memproses login...</div>';

  const {data,error}=await db.auth.signInWithPassword({email,password});

  if(error){
    el.innerHTML='<div class="status error">Login gagal: '+esc(error.message)+'</div>';
    return;
  }

  tampilGaleri(data.session);
}

async function tampilGaleri(session){
  content(`<h2>🗂️ Galeri & Arsip</h2>
    <p>Admin aktif: ${esc(session.user.email)}</p>
    <div class="inline">
      <button class="action" type="button" onclick="cekStorage()">🔎 Cek Storage</button>
      <button class="action secondary" type="button" onclick="logoutGaleri()">Keluar</button>
    </div>
    <div class="status">🔐 Akses galeri berhasil dibuka.</div>
    <div id="storageStatus"></div>`);
}

async function logoutGaleri(){
  await db.auth.signOut();
  openGaleri();
}
async function cekStorage(){
  const el=document.getElementById("storageStatus");if(!el)return;
  const {data,error}=await db.storage.from("arsip").list("",{limit:20});
  if(error)el.innerHTML='<div class="status error">'+esc(error.message)+'</div>';
  else el.innerHTML='<div class="status ok">Bucket arsip terdeteksi. File tingkat awal: '+(data?.length||0)+'</div>';
}

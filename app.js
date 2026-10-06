// WansTeknik Customer Portal - Supabase configuration
const SUPABASE_URL = "https://kxdqviatkjonsfqywgwy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_cdjpVfFpB7WK36DrVKlr6g_E4b9XM-2";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const form = document.querySelector("#customerForm");
const statusEl = document.querySelector("#status");
const result = document.querySelector("#result");
const submitBtn = document.querySelector("#submitBtn");

function normalizePhone(v){
  let p = v.replace(/[^\d+]/g, "");
  if (p.startsWith("+62")) p = "0" + p.slice(3);
  else if (p.startsWith("62")) p = "0" + p.slice(2);
  return p;
}
function normalizeCode(v){
  return v.trim().toUpperCase().replace(/\s+/g, "");
}
function esc(v=""){
  return String(v).replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}
function formatDate(v){
  if(!v) return "-";
  return new Date(v + "T00:00:00").toLocaleDateString("id-ID", {day:"2-digit",month:"long",year:"numeric"});
}
function formatRupiah(v){
  if(v === null || v === undefined || v === "" || Number(v) === 0) return "";
  return new Intl.NumberFormat("id-ID", {style:"currency",currency:"IDR",maximumFractionDigits:0}).format(v);
}

form.addEventListener("submit", async e => {
  e.preventDefault();
  result.classList.add("hidden");
  statusEl.className = "status loading";
  statusEl.textContent = "Mencari riwayat service...";
  submitBtn.disabled = true;
  submitBtn.textContent = "Mencari...";

  const phone = normalizePhone(document.querySelector("#phone").value);
  const code = normalizeCode(document.querySelector("#code").value);

  if(!phone || !code){
    statusEl.className = "status error";
    statusEl.textContent = "No. HP dan kode WT wajib diisi.";
    submitBtn.disabled = false;
    submitBtn.textContent = "Lihat Riwayat Service";
    return;
  }

  const {data,error} = await db.rpc("customer_service_history", {p_phone:phone,p_code:code});

  if(error){
    console.error(error);
    statusEl.className = "status error";
    statusEl.textContent = "Sistem belum terhubung atau konfigurasi Supabase belum selesai.";
  } else if(!data?.length){
    statusEl.className = "status error";
    statusEl.textContent = "Data tidak ditemukan. Pastikan No. HP dan Kode WT benar.";
  } else {
    const customer = data[0];
    document.querySelector("#customerName").textContent = customer.customer_name || "Nama belum diisi";
    document.querySelector("#customerAddress").textContent = customer.customer_address || "Alamat belum diisi";
    document.querySelector("#customerCode").textContent = customer.wt_code || code;
    document.querySelector("#historyCount").textContent = `${data.length} riwayat service`;
    document.querySelector("#history").innerHTML = data.map(r => `
      <article class="service">
        <div class="service-top">
          <div><span class="date">${formatDate(r.service_date)}</span><h3>${esc(r.checked || "Service")}</h3></div>
          ${r.cost ? `<strong class="cost">${formatRupiah(r.cost)}</strong>` : ""}
        </div>
        <div class="service-grid">
          <div><b>KENDALA</b><span>${esc(r.problem || "-")}</span></div>
          <div><b>DIPERBAIKI</b><span>${esc(r.repair || "-")}</span></div>
        </div>
        ${r.notes ? `<p class="notes">${esc(r.notes)}</p>` : ""}
      </article>`).join("");
    statusEl.className = "status success";
    statusEl.textContent = "Riwayat ditemukan.";
    result.classList.remove("hidden");
    result.scrollIntoView({behavior:"smooth", block:"start"});
  }

  submitBtn.disabled = false;
  submitBtn.textContent = "Lihat Riwayat Service";
});

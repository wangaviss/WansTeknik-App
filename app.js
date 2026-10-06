// Isi dua nilai ini dari Supabase Project Settings > API
const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.querySelector("#customerForm");
const statusEl = document.querySelector("#status");
const result = document.querySelector("#result");

function normalizePhone(v){
  return v.replace(/[^\d+]/g,"").replace(/^(\+62|62)/,"0");
}
function esc(v=""){
  return String(v).replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}
form.addEventListener("submit", async e=>{
  e.preventDefault();
  statusEl.textContent = "Mencari riwayat...";
  result.classList.add("hidden");
  const phone = normalizePhone(document.querySelector("#phone").value.trim());
  const code = document.querySelector("#code").value.trim().toUpperCase();

  const {data,error} = await db.rpc("customer_service_history",{p_phone:phone,p_code:code});
  if(error){ statusEl.textContent = "Terjadi kesalahan. Periksa konfigurasi Supabase."; return; }
  if(!data?.length){ statusEl.textContent = "Data tidak ditemukan. Periksa No. HP dan kode WT."; return; }

  const customer = data[0];
  document.querySelector("#customerName").textContent = customer.customer_name || "-";
  document.querySelector("#customerAddress").textContent = customer.customer_address || "Alamat belum diisi";
  document.querySelector("#customerCode").textContent = customer.wt_code;
  document.querySelector("#history").innerHTML = data.map(r=>`
    <article class="service">
      <div class="service-top"><div><h3>${esc(r.checked || "Service")}</h3><span class="date">${new Date(r.service_date+"T00:00:00").toLocaleDateString("id-ID",{day:"2-digit",month:"long",year:"numeric"})}</span></div><strong>${r.cost?new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(r.cost):""}</strong></div>
      <div class="service-grid">
        <div><b>KENDALA</b>${esc(r.problem || "-")}</div>
        <div><b>DIPERBAIKI</b>${esc(r.repair || "-")}</div>
      </div>
      ${r.notes?`<p class="muted">${esc(r.notes)}</p>`:""}
    </article>`).join("");
  statusEl.textContent = "";
  result.classList.remove("hidden");
});

// WansTeknik Customer Portal - Supabase configuration
const SUPABASE_URL = "https://kxdqviatkjonsfqywgwy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_cdjpVfFpB7WK36DrVKlr6g_E4b9XM-2";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

console.log("Supabase berhasil dibuat:", db);

const form = document.querySelector("#customerForm");
const statusEl = document.querySelector("#status");
const result = document.querySelector("#result");
const submitBtn = document.querySelector("#submitBtn");

function normalizePhone(v) {
  let p = v.replace(/[^\d+]/g, "");

  if (p.startsWith("+62")) {
    p = "0" + p.slice(3);
  } else if (p.startsWith("62")) {
    p = "0" + p.slice(2);
  }

  return p;
}

function normalizeCode(v) {
  return v.trim().toUpperCase().replace(/\s+/g, "");
}

function esc(v = "") {
  return String(v).replace(
    /[&<>"']/g,
    m => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[m])
  );
}

function formatDate(v) {
  if (!v) return "-";

  return new Date(v + "T00:00:00").toLocaleDateString(
    "id-ID",
    {
      day: "2-digit",
      month: "long",
      year: "numeric"
    }
  );
}

function formatRupiah(v) {
  if (
    v === null ||
    v === undefined ||
    v === "" ||
    Number(v) === 0
  ) {
    return "";
  }

  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }
  ).format(v);
}

form.addEventListener("submit", async e => {
  e.preventDefault();

  result.classList.add("hidden");

  statusEl.className = "status loading";
  statusEl.textContent = "Mencari riwayat service...";

  submitBtn.disabled = true;
  submitBtn.textContent = "Mencari...";

  const phone = normalizePhone(
    document.querySelector("#phone").value
  );

  const code = normalizeCode(
    document.querySelector("#code").value
  );

  if (!phone || !code) {
    statusEl.className = "status error";
    statusEl.textContent =
      "No. HP dan kode WT wajib diisi.";

    submitBtn.disabled = false;
    submitBtn.textContent =
      "Lihat Riwayat Service";

    return;
  }

  // Ambil data riwayat dari Supabase
  const { data, error } = await db.rpc(
    "cek_riwayat_konsumen",
    {
      p_wt_code: code,
      p_phone: phone
    }
  );

  if (error) {
    console.error("Supabase Error:", error);

    statusEl.className = "status error";
    statusEl.textContent =
      "Sistem belum terhubung atau konfigurasi Supabase belum selesai.";

    submitBtn.disabled = false;
    submitBtn.textContent =
      "Lihat Riwayat Service";

    return;
  }

  if (!data || data.length === 0) {
    statusEl.className = "status error";
    statusEl.textContent =
      "Data tidak ditemukan. Pastikan No. HP dan Kode WT benar.";

    submitBtn.disabled = false;
    submitBtn.textContent =
      "Lihat Riwayat Service";

    return;
  }

  // Ambil data customer langsung dari Supabase
  const {
    data: customerData,
    error: customerError
  } = await db
    .from("customers")
    .select("wt_code, name, address")
    .eq("wt_code", code)
    .eq("phone", phone)
    .maybeSingle();

  if (customerError) {
    console.error(
      "Customer Error:",
      customerError
    );

    statusEl.className = "status error";
    statusEl.textContent =
      "Data pelanggan gagal dimuat.";

    submitBtn.disabled = false;
    submitBtn.textContent =
      "Lihat Riwayat Service";

    return;
  }

  if (!customerData) {
    statusEl.className = "status error";
    statusEl.textContent =
      "Data pelanggan tidak ditemukan.";

    submitBtn.disabled = false;
    submitBtn.textContent =
      "Lihat Riwayat Service";

    return;
  }

  // Tampilkan data pelanggan
  document.querySelector("#customerName").textContent =
    customerData.name || "Nama belum diisi";

  document.querySelector("#customerAddress").textContent =
    customerData.address || "Alamat belum diisi";

  document.querySelector("#customerCode").textContent =
    customerData.wt_code || code;

  document.querySelector("#historyCount").textContent =
    `${data.length} riwayat service`;

  // Tampilkan riwayat
document.querySelector("#history").innerHTML = data.map(r => `
  <article class="service">
    <div class="service-top">
      <div>
        <span class="date">${formatDate(r.service_date)}</span>
        <h3>${esc(r.checked || "Service")}</h3>
        ${r.invoice_no ? `<small class="invoice-no">Nota: ${esc(r.invoice_no)}</small>` : ""}
      </div>

      ${r.cost ? `<strong class="cost">${formatRupiah(r.cost)}</strong>` : ""}
    </div>

    <div class="service-grid">
      <div>
        <b>KENDALA</b>
        <span>${esc(r.problem || "-")}</span>
      </div>

      <div>
        <b>DIPERBAIKI</b>
        <span>${esc(r.repair || "-")}</span>
      </div>
    </div>

    ${r.notes ? `<p class="notes">${esc(r.notes)}</p>` : ""}
  </article>
`).join("");

  statusEl.className = "status success";
  statusEl.textContent =
    "Riwayat ditemukan.";

  result.classList.remove("hidden");

  result.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  submitBtn.disabled = false;
  submitBtn.textContent =
    "Lihat Riwayat Service";
});

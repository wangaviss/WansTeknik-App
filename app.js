// =====================================================
// WANSTEKNIK CUSTOMER PORTAL (app.js)
// =====================================================

// =====================================================
// SUPABASE CONFIGURATION
// =====================================================

const SUPABASE_URL = "https://kxdqviatkjonsfqywgwy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_cdjpVfFpB7WK36DrVKlr6g_E4b9XM-2";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

console.log("Supabase berhasil dibuat:", db);

// =====================================================
// DOM ELEMENTS
// =====================================================

const form = document.querySelector("#customerForm");
const statusEl = document.querySelector("#status");
const result = document.querySelector("#result");
const submitBtn = document.querySelector("#submitBtn");
const historyEl = document.querySelector("#history");

const customerNameEl = document.querySelector("#customerName");
const customerAddressEl = document.querySelector("#customerAddress");
const customerCodeEl = document.querySelector("#customerCode");
const historyCountEl = document.querySelector("#historyCount");
const totalServiceEl = document.querySelector("#totalService");
const lastServiceEl = document.querySelector("#lastService");

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function normalizePhone(v) {
  let p = String(v || "").replace(/[^\d+]/g, "");
  if (p.startsWith("+62")) {
    p = "0" + p.slice(3);
  } else if (p.startsWith("62")) {
    p = "0" + p.slice(2);
  }
  return p;
}

function normalizeCode(v) {
  return String(v || "").trim().toUpperCase().replace(/\s+/g, "");
}

function esc(v = "") {
  return String(v).replace(
    /[&<>"']/g,
    (m) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      }[m])
  );
}

function formatDate(v) {
  if (!v) return "-";
  return new Date(`${v}T00:00:00`).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatRupiah(v) {
  if (v === null || v === undefined || v === "" || Number(v) === 0) {
    return "";
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(v);
}

function withTimeout(promise, ms = 15000) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error("Waktu pencarian habis. Periksa koneksi internet lalu coba lagi."));
    }, ms);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// =====================================================
// CUSTOMER INVOICE / NOTA (COMPATIBLE WITH APP/WEBVIEW)
// =====================================================

function openCustomerInvoice(record, customer) {
  if (!record) return alert("Data nota tidak ditemukan.");
  if (!record.invoice_no) return alert("Nomor nota belum tersedia.");

  const invoiceNo = record.invoice_no || "-";
  const customerCode = customer.wt_code ? `WT-${customer.wt_code}` : "-";
  const customerName = customer.name || "-";
  const customerPhone = customer.phone || "-";
  const customerAddress = customer.address || "-";
  const formattedDate = formatDate(record.service_date);
  const cost = Number(record.cost || 0).toLocaleString("id-ID");

  const logoWtUrl = new URL("./logo-wt-nota.png", window.location.href).href;
  const logoBrandUrl = new URL("./logo-brand-nota.png", window.location.href).href;

  const printWindow = window.open("", "_blank", "width=800,height=900");

  if (!printWindow) {
    alert("Popup diblokir aplikasi/browser. Izinkan popup untuk membuka nota.");
    return;
  }

  const notaHTML = `
<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Nota ${esc(invoiceNo)}</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"><\/script>
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #111;
      background: #fff;
      padding: 20px;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .nota-wrapper { width: 100%; max-width: 750px; margin: 0 auto; background: #fff; }
    .print-bar { display: flex; justify-content: center; align-items: center; gap: 10px; margin-bottom: 20px; }
    .print-btn, .download-btn, .close-btn {
      border: none; padding: 12px 18px; border-radius: 7px; font-size: 14px; font-weight: bold; cursor: pointer; color: #fff;
    }
    .print-btn { background: #111; }
    .print-btn:hover { background: #333; }
    .download-btn { background: #0284c7; }
    .download-btn:hover { background: #0369a1; }
    .close-btn { background: #64748b; }
    .close-btn:hover { background: #475569; }

    .header { display: grid; grid-template-columns: 80px 1fr 80px; align-items: center; gap: 10px; padding-bottom: 15px; border-bottom: 2px solid #111; }
    .logo-box { width: 80px; height: 65px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .logo-box img { max-width: 75px; max-height: 60px; object-fit: contain; }
    .brand-center { text-align: center; }
    .brand-center h1 { margin: 0; font-size: 24px; font-weight: 800; color: #111; letter-spacing: 1px; }
    .brand-center p { margin: 4px 0 0; font-size: 12px; color: #555; }
    
    .invoice-info { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
    .info-box { border: 1px solid #ddd; padding: 10px; border-radius: 6px; }
    .label { font-size: 10px; color: #666; text-transform: uppercase; margin-bottom: 4px; }
    .value { font-size: 14px; font-weight: bold; }
    
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    td { border: 1px solid #ddd; padding: 10px; font-size: 13px; vertical-align: top; }
    td:first-child { width: 160px; font-weight: bold; background: #f8fafc; }
    
    .total-box { display: flex; justify-content: flex-end; margin-top: 15px; }
    .total { min-width: 220px; border: 2px solid #111; padding: 12px; text-align: right; font-size: 18px; font-weight: bold; }
    .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; text-align: center; font-size: 11px; color: #555; line-height: 1.5; }

    @media (max-width: 600px) {
      body { padding: 12px; }
      .print-bar { flex-direction: column; }
      .print-btn, .download-btn, .close-btn { width: 100%; }
      .header { grid-template-columns: 60px 1fr 60px; }
      .brand-center h1 { font-size: 18px; }
      .invoice-info { grid-template-columns: 1fr; gap: 8px; }
      td:first-child { width: 120px; }
    }

    @media print {
      .print-bar { display: none !important; }
      body { padding: 0 !important; }
      .nota-wrapper { width: 100% !important; max-width: none !important; }
    }
  </style>
</head>
<body>

  <div class="print-bar">
    <button type="button" class="print-btn" id="printButton">🖨️ Cetak / Print</button>
    <button type="button" class="download-btn" id="downloadButton">📥 Unduh PDF</button>
    <button type="button" class="close-btn" id="closeButton">✕ Tutup</button>
  </div>

  <div id="notaArea" class="nota-wrapper">
    <div class="header">
      <div class="logo-box">
        <img src="${logoWtUrl}" alt="Logo WT" onerror="this.style.display='none'">
      </div>
      <div class="brand-center">
        <h1>WansTeknik</h1>
        <p>Service, Maintenance & Repair</p>
      </div>
      <div class="logo-box">
        <img src="${logoBrandUrl}" alt="Brand WT" onerror="this.style.display='none'">
      </div>
    </div>

    <div class="invoice-info">
      <div class="info-box">
        <div class="label">No. Nota</div>
        <div class="value">${esc(invoiceNo)}</div>
      </div>
      <div class="info-box">
        <div class="label">Tanggal Service</div>
        <div class="value">${esc(formattedDate)}</div>
      </div>
    </div>

    <table>
      <tr><td>Kode Pelanggan</td><td>${esc(customerCode)}</td></tr>
      <tr><td>Nama Pelanggan</td><td>${esc(customerName)}</td></tr>
      <tr><td>No. HP</td><td>${esc(customerPhone)}</td></tr>
      <tr><td>Alamat</td><td>${esc(customerAddress)}</td></tr>
      <tr><td>Unit / Dicek</td><td>${esc(record.checked || "-")}</td></tr>
      <tr><td>Kendala</td><td>${esc(record.problem || "-")}</td></tr>
      <tr><td>Tindakan / Perbaikan</td><td>${esc(record.repair || "-")}</td></tr>
      <tr><td>Catatan</td><td>${esc(record.notes || "-")}</td></tr>
    </table>

    <div class="total-box">
      <div class="total">Total: Rp ${cost}</div>
    </div>

    <div class="footer">
      <strong>WansTeknik</strong><br>
      Terima kasih telah menggunakan layanan WansTeknik.<br>
      Nota ini merupakan bukti transaksi service resmi.
    </div>
  </div>

  <script>
    (function() {
      const printBtn = document.getElementById("printButton");
      const downloadBtn = document.getElementById("downloadButton");
      const closeBtn = document.getElementById("closeButton");

      if (printBtn) {
        printBtn.addEventListener("click", function() {
          try {
            window.focus();
            setTimeout(() => window.print(), 150);
          } catch (e) {
            alert("Sistem cetak tidak didukung aplikasi ini. Silakan gunakan tombol Unduh PDF.");
          }
        });
      }

      if (downloadBtn) {
        downloadBtn.addEventListener("click", function() {
          downloadBtn.disabled = true;
          downloadBtn.textContent = "Mengunduh...";

          const element = document.getElementById("notaArea");
          const opt = {
            margin:       0.3,
            filename:     'Nota-${esc(invoiceNo)}.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
          };

          if (typeof html2pdf !== "undefined") {
            html2pdf().set(opt).from(element).save().then(() => {
              downloadBtn.disabled = false;
              downloadBtn.textContent = "📥 Unduh PDF";
            }).catch(err => {
              alert("Gagal mengunduh PDF: " + err.message);
              downloadBtn.disabled = false;
              downloadBtn.textContent = "📥 Unduh PDF";
            });
          } else {
            alert("Pustaka PDF belum dimuat sepenuhnya. Coba lagi dalam beberapa detik.");
            downloadBtn.disabled = false;
            downloadBtn.textContent = "📥 Unduh PDF";
          }
        });
      }

      if (closeBtn) {
        closeBtn.addEventListener("click", function() {
          window.close();
        });
      }

      document.addEventListener("keydown", function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
          e.preventDefault();
          window.print();
        }
      });
    })();
  <\/script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(notaHTML);
  printWindow.document.close();

  setTimeout(() => {
    try {
      printWindow.focus();
    } catch (e) {
      console.warn("Tidak dapat focus ke window nota:", e);
    }
  }, 500);
}

// =====================================================
// RENDER RIWAYAT
// =====================================================

function renderHistory(data, customer) {
  if (!historyEl) return;

  historyEl.innerHTML = data
    .map(
      (r, index) => `
      <article class="service">
        <div class="service-top">
          <div>
            <span class="date">${formatDate(r.service_date)}</span>
            <h3>${esc(r.checked || "Service")}</h3>
            ${
              r.invoice_no
                ? `<small class="invoice-no">Nota: ${esc(r.invoice_no)}</small>`
                : ""
            }
          </div>
          ${
            r.cost
              ? `<strong class="cost">${formatRupiah(r.cost)}</strong>`
              : ""
          }
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

        ${
          r.invoice_no
            ? `
              <button
                type="button"
                class="invoice-button"
                data-index="${index}"
              >
                🧾 Lihat / Cetak Nota
              </button>
            `
            : ""
        }
      </article>
    `
    )
    .join("");

  // Bind event tombol nota
  historyEl.querySelectorAll(".invoice-button").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.index);
      const record = data[index];
      openCustomerInvoice(record, customer);
    });
  });
}

// =====================================================
// SUBMIT CUSTOMER
// =====================================================

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (result) {
      result.classList.add("hidden");
    }

    if (statusEl) {
      statusEl.className = "status loading";
      statusEl.textContent = "Mencari riwayat service...";
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Mencari...";
    }

    const phoneInput = document.querySelector("#phone");
    const codeInput = document.querySelector("#code");

    const phone = normalizePhone(phoneInput ? phoneInput.value : "");
    const code = normalizeCode(codeInput ? codeInput.value : "");

    if (!phone || !code) {
      if (statusEl) {
        statusEl.className = "status error";
        statusEl.textContent = "No. HP dan kode WT wajib diisi.";
      }
      resetSubmitButton();
      return;
    }

    // 1. RPC Cari Riwayat Service
    let data;
    let error;

    try {
      const response = await withTimeout(
        db.rpc("cek_riwayat_konsumen", {
          p_wt_code: code,
          p_phone: phone,
        }),
        15000
      );

      data = response.data;
      error = response.error;
    } catch (err) {
      console.error("Gagal mencari riwayat:", err);
      if (statusEl) {
        statusEl.className = "status error";
        statusEl.textContent =
          err.message || "Pencarian gagal. Periksa koneksi internet.";
      }
      resetSubmitButton();
      return;
    }

    if (error) {
      console.error("Supabase Error:", error);
      if (statusEl) {
        statusEl.className = "status error";
        statusEl.textContent =
          "Riwayat gagal dimuat. Periksa koneksi atau konfigurasi Supabase.";
      }
      resetSubmitButton();
      return;
    }

    if (!data || data.length === 0) {
      if (statusEl) {
        statusEl.className = "status error";
        statusEl.textContent =
          "Data tidak ditemukan. Pastikan No. HP dan Kode WT benar.";
      }
      resetSubmitButton();
      return;
    }

    // 2. RPC Cari Data Pelanggan
    let customerData;
    let customerError;

    try {
      const response = await withTimeout(
        db.rpc("cek_data_pelanggan", {
          p_wt_code: code,
          p_phone: phone,
        }),
        15000
      );

      customerError = response.error;
      customerData =
        Array.isArray(response.data) && response.data.length > 0
          ? response.data[0]
          : null;
    } catch (err) {
      console.error("Gagal memuat pelanggan:", err);
      if (statusEl) {
        statusEl.className = "status error";
        statusEl.textContent = "Data pelanggan gagal dimuat. Periksa koneksi.";
      }
      resetSubmitButton();
      return;
    }

    if (customerError) {
      console.error("Customer RPC Error:", customerError);
      if (statusEl) {
        statusEl.className = "status error";
        statusEl.textContent =
          "Data pelanggan gagal dimuat. Periksa konfigurasi Supabase.";
      }
      resetSubmitButton();
      return;
    }

    if (!customerData) {
      if (statusEl) {
        statusEl.className = "status error";
        statusEl.textContent =
          "Data pelanggan tidak ditemukan. Periksa No. HP dan Kode WT.";
      }
      resetSubmitButton();
      return;
    }

    // Populate Info Pelanggan
    if (customerNameEl) customerNameEl.textContent = customerData.name || "Nama belum diisi";
    if (customerAddressEl) customerAddressEl.textContent = customerData.address || "Alamat belum diisi";
    if (customerCodeEl) customerCodeEl.textContent = customerData.wt_code ? `WT-${customerData.wt_code}` : code;
    if (historyCountEl) historyCountEl.textContent = `${data.length} riwayat service`;
    if (totalServiceEl) totalServiceEl.textContent = data.length;

    const latestService = data[0];
    if (lastServiceEl && latestService) {
      lastServiceEl.textContent = formatDate(latestService.service_date);
    }

    renderHistory(data, customerData);

    if (statusEl) {
      statusEl.className = "status success";
      statusEl.textContent = "Riwayat ditemukan.";
    }

    if (result) {
      result.classList.remove("hidden");
      result.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }

    resetSubmitButton();
  });
}

function resetSubmitButton() {
  if (!submitBtn) return;
  submitBtn.disabled = false;
  submitBtn.textContent = "Lihat Riwayat Service";
}

console.log("WansTeknik Customer Portal siap.");

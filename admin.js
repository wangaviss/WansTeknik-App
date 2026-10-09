// =====================================================
// WANSTEKNIK ADMIN PANEL
// =====================================================

const SUPABASE_URL = "https://kxdqviatkjonsfqywgwy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_cdjpVfFpB7WK36DrVKlr6g_E4b9XM-2";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function esc(v = "") {
  return String(v).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

function formatDate(v) {
  if (!v) return "-";
  return new Date(`${v}T00:00:00`).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function formatRupiah(v) {
  if (v === null || v === undefined || v === "" || Number(v) === 0) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(v);
}

// =====================================================
// FUNGSI NOTA ADMIN (PRINT & UNDUH PDF COMPATIBLE)
// =====================================================

function openAdminInvoice(record, customer) {
  if (!record) return alert("Data transaksi tidak ditemukan.");
  if (!record.invoice_no) return alert("Nomor nota belum dibuat untuk transaksi ini.");

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
    alert("Popup diblokir browser/aplikasi. Harap izinkan popup untuk melihat nota.");
    return;
  }

  const notaHTML = `
<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Nota Admin ${esc(invoiceNo)}</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"><\/script>
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; color: #111; background: #fff; padding: 20px; }
    .nota-wrapper { width: 100%; max-width: 750px; margin: 0 auto; background: #fff; }
    .print-bar { display: flex; justify-content: center; align-items: center; gap: 10px; margin-bottom: 20px; }
    .print-btn, .download-btn, .close-btn { border: none; padding: 12px 18px; border-radius: 7px; font-size: 14px; font-weight: bold; cursor: pointer; color: #fff; }
    .print-btn { background: #111; }
    .download-btn { background: #0284c7; }
    .close-btn { background: #64748b; }
    .header { display: grid; grid-template-columns: 80px 1fr 80px; align-items: center; gap: 10px; padding-bottom: 15px; border-bottom: 2px solid #111; }
    .logo-box img { max-width: 75px; max-height: 60px; object-fit: contain; }
    .brand-center { text-align: center; }
    .brand-center h1 { margin: 0; font-size: 24px; font-weight: 800; }
    .brand-center p { margin: 4px 0 0; font-size: 12px; color: #555; }
    .invoice-info { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
    .info-box { border: 1px solid #ddd; padding: 10px; border-radius: 6px; }
    .label { font-size: 10px; color: #666; text-transform: uppercase; }
    .value { font-size: 14px; font-weight: bold; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    td { border: 1px solid #ddd; padding: 10px; font-size: 13px; }
    td:first-child { width: 160px; font-weight: bold; background: #f8fafc; }
    .total-box { display: flex; justify-content: flex-end; margin-top: 15px; }
    .total { min-width: 220px; border: 2px solid #111; padding: 12px; text-align: right; font-size: 18px; font-weight: bold; }
    .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; text-align: center; font-size: 11px; color: #666; }
    @media print { .print-bar { display: none !important; } body { padding: 0 !important; } }
  </style>
</head>
<body>
  <div class="print-bar">
    <button type="button" class="print-btn" id="printBtn">🖨️ Cetak / Print</button>
    <button type="button" class="download-btn" id="downloadBtn">📥 Unduh PDF</button>
    <button type="button" class="close-btn" id="closeBtn">✕ Tutup</button>
  </div>

  <div id="notaArea" class="nota-wrapper">
    <div class="header">
      <div class="logo-box"><img src="${logoWtUrl}" alt="WT" onerror="this.style.display='none'"></div>
      <div class="brand-center">
        <h1>WansTeknik</h1>
        <p>Service, Maintenance & Repair</p>
      </div>
      <div class="logo-box"><img src="${logoBrandUrl}" alt="WT" onerror="this.style.display='none'"></div>
    </div>

    <div class="invoice-info">
      <div class="info-box"><div class="label">No. Nota</div><div class="value">${esc(invoiceNo)}</div></div>
      <div class="info-box"><div class="label">Tanggal Service</div><div class="value">${esc(formattedDate)}</div></div>
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
      <strong>WansTeknik Admin System</strong><br>Dokumen Resmi Bukti Service.
    </div>
  </div>

  <script>
    (function() {
      const printBtn = document.getElementById("printBtn");
      const downloadBtn = document.getElementById("downloadBtn");
      const closeBtn = document.getElementById("closeBtn");

      if (printBtn) {
        printBtn.addEventListener("click", function() {
          try {
            window.focus();
            window.print();
          } catch (e) {
            alert("Mode cetak langsung tidak didukung. Silakan unduh PDF.");
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
            filename:     'Nota-Admin-${esc(invoiceNo)}.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
          };

          html2pdf().set(opt).from(element).save().then(() => {
            downloadBtn.disabled = false;
            downloadBtn.textContent = "📥 Unduh PDF";
          }).catch(err => {
            alert("Gagal mengunduh: " + err.message);
            downloadBtn.disabled = false;
            downloadBtn.textContent = "📥 Unduh PDF";
          });
        });
      }

      if (closeBtn) {
        closeBtn.addEventListener("click", function() {
          window.close();
        });
      }
    })();
  <\/script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(notaHTML);
  printWindow.document.close();
}

// Global binding untuk dipanggil dari aksi baris tabel di JS Admin
window.openAdminInvoice = openAdminInvoice;

console.log("WansTeknik Admin System Siap.");

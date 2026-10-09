// =====================================================
// WANSTEKNIK CUSTOMER PORTAL
// =====================================================


// =====================================================
// SUPABASE
// =====================================================

const SUPABASE_URL =
  "https://kxdqviatkjonsfqywgwy.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_cdjpVfFpB7WK36DrVKlr6g_E4b9XM-2";

const db =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );

console.log(
  "Supabase berhasil dibuat:",
  db
);

// =====================================================
// ELEMENT
// =====================================================

const form =
  document.querySelector("#customerForm");

const statusEl =
  document.querySelector("#status");

const result =
  document.querySelector("#result");

const submitBtn =
  document.querySelector("#submitBtn");

const historyEl =
  document.querySelector("#history");

const customerNameEl =
  document.querySelector("#customerName");

const customerAddressEl =
  document.querySelector("#customerAddress");

const customerCodeEl =
  document.querySelector("#customerCode");

const historyCountEl =
  document.querySelector("#historyCount");

const totalServiceEl =
  document.querySelector("#totalService");

const lastServiceEl =
  document.querySelector("#lastService");




// =====================================================
// NORMALIZE PHONE
// =====================================================

function normalizePhone(v) {

  let p =
    String(v || "")
      .replace(/[^\d+]/g, "");

  if (p.startsWith("+62")) {

    p =
      "0" +
      p.slice(3);

  } else if (p.startsWith("62")) {

    p =
      "0" +
      p.slice(2);

  }

  return p;
}


// =====================================================
// NORMALIZE CODE
// =====================================================

function normalizeCode(v) {

  return String(v || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

}


// =====================================================
// ESCAPE HTML
// =====================================================

function esc(v = "") {

  return String(v).replace(
    /[&<>"']/g,
    m =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[m])
  );

}


// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(v) {

  if (!v) {
    return "-";
  }

  return new Date(
    v + "T00:00:00"
  ).toLocaleDateString(
    "id-ID",
    {
      day: "2-digit",
      month: "long",
      year: "numeric"
    }
  );

}


// =====================================================
// FORMAT RUPIAH
// =====================================================

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

// =====================================================
// CUSTOMER INVOICE / NOTA
// =====================================================

function openCustomerInvoice(
  record,
  customer
) {

  if (!record) {

    alert(
      "Data nota tidak ditemukan."
    );

    return;

  }


  if (!record.invoice_no) {

    alert(
      "Nomor nota belum tersedia."
    );

    return;

  }


  // ===================================================
  // DATA NOTA
  // ===================================================

  const invoiceNo =
    record.invoice_no || "-";

  const customerCode =
    customer.wt_code
      ? `WT-${customer.wt_code}`
      : "-";

  const customerName =
    customer.name || "-";

  const customerPhone =
    customer.phone || "-";

  const customerAddress =
    customer.address || "-";

  const formattedDate =
    formatDate(
      record.service_date
    );

  const cost =
    Number(record.cost || 0)
      .toLocaleString("id-ID");


  // ===================================================
  // LOGO
  // ===================================================

  const logoWtUrl =
    new URL(
      "./logo-wt-nota.png",
      window.location.href
    ).href;

  const logoBrandUrl =
    new URL(
      "./logo-brand-nota.png",
      window.location.href
    ).href;


  // ===================================================
  // BUKA WINDOW NOTA
  // ===================================================

  const printWindow =
    window.open(
      "",
      "_blank",
      "width=800,height=900"
    );


  if (!printWindow) {

    alert(
      "Popup diblokir browser. Izinkan popup untuk membuka nota."
    );

    return;

  }


  // ===================================================
  // HTML NOTA
  // ===================================================

  const notaHTML = `
<!doctype html>

<html lang="id">

<head>

<meta charset="utf-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1"
>

<title>
  Nota ${esc(invoiceNo)}
</title>


<style>

* {
  box-sizing: border-box;
}


html,
body {
  margin: 0;
  padding: 0;
}


body {

  font-family:
    Arial,
    Helvetica,
    sans-serif;

  color: #111;

  background: #fff;

  padding: 30px;

  -webkit-print-color-adjust:
    exact !important;

  print-color-adjust:
    exact !important;

}


.nota {

  width: 100%;

  max-width: 750px;

  margin: 0 auto;

}


/* ==============================================
   PRINT BAR
   ============================================== */

.print-bar {

  display: flex;

  justify-content: center;

  align-items: center;

  gap: 10px;

  margin-bottom: 25px;

}


.print-btn,
.close-btn {

  border: none;

  padding:
    12px 22px;

  border-radius: 7px;

  font-size: 15px;

  font-weight: bold;

  cursor: pointer;

  color: #fff;

}


.print-btn {

  background: #111;

}


.print-btn:hover {

  background: #333;

}


.close-btn {

  background: #777;

}


.close-btn:hover {

  background: #555;

}


/* ==============================================
   HEADER
   ============================================== */

.header {

  display: grid;

  grid-template-columns:
    90px 1fr 90px;

  align-items: center;

  gap: 12px;

  background: #fff;

  padding:
    18px 20px;

  margin-bottom: 22px;

  border-bottom:
    2px solid #111;

}


.logo-box {

  width: 90px;

  height: 75px;

  display: flex;

  align-items: center;

  justify-content: center;

  background: #fff;

  overflow: hidden;

}


.logo-box img {

  display: block;

  max-width: 85px;

  max-height: 70px;

  width: auto;

  height: auto;

  object-fit: contain;

}


.brand-center {

  text-align: center;

}


.brand-center h1 {

  margin: 0;

  color: #111;

  font-size: 30px;

  font-weight: 800;

  letter-spacing: 1px;

}


.brand-center p {

  margin:
    6px 0 0;

  color: #444;

  font-size: 13px;

  font-weight: 500;

  letter-spacing: .5px;

}


/* ==============================================
   INVOICE INFO
   ============================================== */

.invoice-info {

  display: grid;

  grid-template-columns:
    1fr 1fr;

  gap: 20px;

  margin-bottom: 22px;

}


.info-box {

  border:
    1px solid #ccc;

  padding: 12px;

  border-radius: 6px;

}


.label {

  font-size: 10px;

  color: #666;

  text-transform: uppercase;

  margin-bottom: 5px;

}


.value {

  font-size: 15px;

  font-weight: bold;

}


/* ==============================================
   TABLE
   ============================================== */

table {

  width: 100%;

  border-collapse:
    collapse;

  margin-top: 10px;

}


td {

  border:
    1px solid #ccc;

  padding: 11px;

  vertical-align: top;

  font-size: 14px;

}


td:first-child {

  width: 170px;

  font-weight: bold;

  background: #f5f5f5;

}


/* ==============================================
   TOTAL
   ============================================== */

.total-box {

  display: flex;

  justify-content: flex-end;

  margin-top: 20px;

}


.total {

  min-width: 240px;

  border:
    2px solid #111;

  padding: 14px;

  text-align: right;

  font-size: 20px;

  font-weight: bold;

}


/* ==============================================
   FOOTER
   ============================================== */

.footer {

  margin-top: 45px;

  padding-top: 15px;

  border-top:
    1px solid #ccc;

  text-align: center;

  font-size: 12px;

  color: #555;

  line-height: 1.6;

}


.footer strong {

  color: #111;

}


/* ==============================================
   MOBILE
   ============================================== */

@media (max-width: 600px) {

  body {

    padding: 15px;

  }


  .print-bar {

    flex-direction: column;

    margin-bottom: 20px;

  }


  .print-btn,
  .close-btn {

    width: 100%;

    max-width: 300px;

  }


  .header {

    grid-template-columns:
      65px 1fr 65px;

    padding:
      12px 8px;

  }


  .logo-box {

    width: 65px;

    height: 60px;

  }


  .logo-box img {

    max-width: 60px;

    max-height: 55px;

  }


  .brand-center h1 {

    font-size: 22px;

  }


  .brand-center p {

    font-size: 10px;

  }


  .invoice-info {

    grid-template-columns:
      1fr;

    gap: 10px;

  }


  td:first-child {

    width: 120px;

  }

}


/* ==============================================
   PRINT
   ============================================== */

@media print {

  html,
  body {

    width: 100%;

    margin:
      0 !important;

    padding:
      0 !important;

    background:
      #fff !important;

  }


  body {

    -webkit-print-color-adjust:
      exact !important;

    print-color-adjust:
      exact !important;

  }


  .print-bar {

    display:
      none !important;

  }


  .nota {

    width:
      100% !important;

    max-width:
      none !important;

    margin:
      0 !important;

  }


  .header {

    background:
      #fff !important;

    color:
      #111 !important;

  }


  .logo-box {

    background:
      #fff !important;

  }


  .brand-center h1 {

    color:
      #111 !important;

  }


  .brand-center p {

    color:
      #444 !important;

  }

}

</style>

</head>


<body>


<div class="nota">


  <!-- ==========================================
       BUTTON
       ========================================== -->

  <div class="print-bar">

    <button
      type="button"
      class="print-btn"
      id="printButton"
    >
      🖨️ Print Nota
    </button>


    <button
      type="button"
      class="close-btn"
      id="closeButton"
    >
      ✕ Tutup
    </button>

  </div>


  <!-- ==========================================
       HEADER
       ========================================== -->

  <div class="header">


    <div class="logo-box">

      <img
        src="${logoWtUrl}"
        alt="Logo WansTeknik"
        onerror="this.style.display='none'"
      >

    </div>


    <div class="brand-center">

      <h1>
        WansTeknik
      </h1>

      <p>
        Service, Maintenance, Repair
      </p>

    </div>


    <div class="logo-box">

      <img
        src="${logoBrandUrl}"
        alt="Brand WansTeknik"
        onerror="this.style.display='none'"
      >

    </div>


  </div>


  <!-- ==========================================
       NOMOR NOTA
       ========================================== -->

  <div class="invoice-info">


    <div class="info-box">

      <div class="label">
        No. Nota
      </div>

      <div class="value">
        ${esc(invoiceNo)}
      </div>

    </div>


    <div class="info-box">

      <div class="label">
        Tanggal Service
      </div>

      <div class="value">
        ${esc(formattedDate)}
      </div>

    </div>


  </div>


  <!-- ==========================================
       DETAIL SERVICE
       ========================================== -->

  <table>


    <tr>

      <td>
        Kode Pelanggan
      </td>

      <td>
        ${esc(customerCode)}
      </td>

    </tr>


    <tr>

      <td>
        Nama Pelanggan
      </td>

      <td>
        ${esc(customerName)}
      </td>

    </tr>


    <tr>

      <td>
        No. HP
      </td>

      <td>
        ${esc(customerPhone)}
      </td>

    </tr>


    <tr>

      <td>
        Alamat
      </td>

      <td>
        ${esc(customerAddress)}
      </td>

    </tr>


    <tr>

      <td>
        Unit / Dicek
      </td>

      <td>
        ${esc(record.checked || "-")}
      </td>

    </tr>


    <tr>

      <td>
        Kendala
      </td>

      <td>
        ${esc(record.problem || "-")}
      </td>

    </tr>


    <tr>

      <td>
        Tindakan / Perbaikan
      </td>

      <td>
        ${esc(record.repair || "-")}
      </td>

    </tr>


    <tr>

      <td>
        Catatan
      </td>

      <td>
        ${esc(record.notes || "-")}
      </td>

    </tr>


  </table>


  <!-- ==========================================
       TOTAL
       ========================================== -->

  <div class="total-box">

    <div class="total">

      Total:
      Rp ${cost}

    </div>

  </div>


  <!-- ==========================================
       FOOTER
       ========================================== -->

  <div class="footer">

    <strong>
      WansTeknik
    </strong>

    <br>

    Terima kasih telah menggunakan
    layanan WansTeknik.

    <br>

    Nota ini merupakan bukti transaksi
    service.

  </div>


</div>


<script>

(function() {


  const printButton =
    document.getElementById(
      "printButton"
    );


  const closeButton =
    document.getElementById(
      "closeButton"
    );


  // ============================================
  // PRINT
  // ============================================

  if (printButton) {

    printButton.addEventListener(
      "click",
      function() {

        window.focus();

        setTimeout(
          function() {

            window.print();

          },
          150
        );

      }
    );

  }


  // ============================================
  // CLOSE
  // ============================================

  if (closeButton) {

    closeButton.addEventListener(
      "click",
      function() {

        window.close();

      }
    );

  }


  // ============================================
  // CTRL + P
  // ============================================

  document.addEventListener(
    "keydown",
    function(e) {

      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "p"
      ) {

        e.preventDefault();

        window.print();

      }

    }
  );


})();

</script>


</body>

</html>
`;


  // =================================================
  // TULIS NOTA KE WINDOW
  // =================================================

  printWindow.document.open();

  printWindow.document.write(
    notaHTML
  );

  printWindow.document.close();


  // =================================================
  // FOCUS WINDOW
  // =================================================

  setTimeout(
    () => {

      try {

        printWindow.focus();

      } catch (e) {

        console.warn(
          "Tidak dapat focus ke window nota:",
          e
        );

      }

    },
    500
  );

}


// =====================================================
// RENDER RIWAYAT
// =====================================================

function renderHistory(
  data,
  customer
) {

  if (!historyEl) {
    return;
  }


  historyEl.innerHTML =
    data.map(
      (r, index) => `

      <article class="service">


        <div class="service-top">


          <div>

            <span class="date">
              ${formatDate(
                r.service_date
              )}
            </span>


            <h3>
              ${esc(
                r.checked ||
                "Service"
              )}
            </h3>


            ${
              r.invoice_no
                ? `
                  <small class="invoice-no">
                    Nota:
                    ${esc(
                      r.invoice_no
                    )}
                  </small>
                `
                : ""
            }


          </div>


          ${
            r.cost
              ? `
                <strong class="cost">
                  ${formatRupiah(
                    r.cost
                  )}
                </strong>
              `
              : ""
          }


        </div>


        <div class="service-grid">


          <div>

            <b>KENDALA</b>

            <span>
              ${esc(
                r.problem || "-"
              )}
            </span>

          </div>


          <div>

            <b>DIPERBAIKI</b>

            <span>
              ${esc(
                r.repair || "-"
              )}
            </span>

          </div>


        </div>


        ${
          r.notes
            ? `
              <p class="notes">
                ${esc(
                  r.notes
                )}
              </p>
            `
            : ""
        }


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
    ).join("");


  // =================================================
  // EVENT TOMBOL NOTA
  // =================================================

  historyEl
    .querySelectorAll(
      ".invoice-button"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const index =
              Number(
                button.dataset.index
              );


            const record =
              data[index];


            openCustomerInvoice(
              record,
              customer
            );

          }
        );

      }
    );

}


// =====================================================
// SUBMIT CUSTOMER
// =====================================================

if (form) {

  form.addEventListener(
    "submit",
    async e => {

      e.preventDefault();


      // ================================================
      // RESET HASIL
      // ================================================

      if (result) {

        result.classList.add(
          "hidden"
        );

      }


      // ================================================
      // LOADING
      // ================================================

      if (statusEl) {

        statusEl.className =
          "status loading";

        statusEl.textContent =
          "Mencari riwayat service...";

      }


      if (submitBtn) {

        submitBtn.disabled =
          true;

        submitBtn.textContent =
          "Mencari...";

      }


      // ================================================
      // INPUT
      // ================================================

      const phoneInput =
        document.querySelector(
          "#phone"
        );


      const codeInput =
        document.querySelector(
          "#code"
        );


      const phone =
        normalizePhone(
          phoneInput
            ? phoneInput.value
            : ""
        );


      const code =
        normalizeCode(
          codeInput
            ? codeInput.value
            : ""
        );


      // ================================================
      // VALIDASI
      // ================================================

      if (!phone || !code) {

        if (statusEl) {

          statusEl.className =
            "status error";

          statusEl.textContent =
            "No. HP dan kode WT wajib diisi.";

        }


        resetSubmitButton();

        return;

      }


      // ================================================
      // RPC
      // ================================================

      const {
        data,
        error
      } =
        await db.rpc(
          "cek_riwayat_konsumen",
          {
            p_wt_code:
              code,

            p_phone:
              phone
          }
        );


      if (error) {

        console.error(
          "Supabase Error:",
          error
        );


        if (statusEl) {

          statusEl.className =
            "status error";

          statusEl.textContent =
            "Sistem belum terhubung atau konfigurasi Supabase belum selesai.";

        }


        resetSubmitButton();

        return;

      }


      // ================================================
      // TIDAK ADA DATA
      // ================================================

      if (
        !data ||
        data.length === 0
      ) {

        if (statusEl) {

          statusEl.className =
            "status error";

          statusEl.textContent =
            "Data tidak ditemukan. Pastikan No. HP dan Kode WT benar.";

        }


        resetSubmitButton();

        return;

      }


      // ================================================
      // DATA CUSTOMER
      // ================================================

      const {
        data: customerData,
        error: customerError
      } =
        await db
          .from("customers")
          .select(
            "wt_code, name, phone, address"
          )
          .eq(
            "wt_code",
            code
          )
          .eq(
            "phone",
            phone
          )
          .maybeSingle();


      if (customerError) {

        console.error(
          "Customer Error:",
          customerError
        );


        if (statusEl) {

          statusEl.className =
            "status error";

          statusEl.textContent =
            "Data pelanggan gagal dimuat.";

        }


        resetSubmitButton();

        return;

      }


      if (!customerData) {

        if (statusEl) {

          statusEl.className =
            "status error";

          statusEl.textContent =
            "Data pelanggan tidak ditemukan.";

        }


        resetSubmitButton();

        return;

      }


      // ================================================
      // CUSTOMER
      // ================================================

      if (customerNameEl) {

        customerNameEl.textContent =
          customerData.name ||
          "Nama belum diisi";

      }


      if (customerAddressEl) {

        customerAddressEl.textContent =
          customerData.address ||
          "Alamat belum diisi";

      }


      if (customerCodeEl) {

        customerCodeEl.textContent =
          customerData.wt_code ||
          code;

      }


      if (historyCountEl) {

        historyCountEl.textContent =
          `${data.length} riwayat service`;

      }


      // ================================================
      // RINGKASAN
      // ================================================

      if (totalServiceEl) {

        totalServiceEl.textContent =
          data.length;

      }


      const latestService =
        data[0];


      if (
        lastServiceEl &&
        latestService
      ) {

        lastServiceEl.textContent =
          formatDate(
            latestService.service_date
          );

      }

      // ================================================
      // RIWAYAT
      // ================================================

      renderHistory(
        data,
        customerData
      );


      // ================================================
      // SUCCESS
      // ================================================

      if (statusEl) {

        statusEl.className =
          "status success";

        statusEl.textContent =
          "Riwayat ditemukan.";

      }


      if (result) {

        result.classList.remove(
          "hidden"
        );


        result.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

      }


      resetSubmitButton();

    }
  );

}


// =====================================================
// RESET BUTTON
// =====================================================

function resetSubmitButton() {

  if (!submitBtn) {
    return;
  }


  submitBtn.disabled =
    false;

  submitBtn.textContent =
    "Lihat Riwayat Service";

}


// =====================================================
// SELESAI
// =====================================================

console.log(
  "WansTeknik Customer Portal siap."
);

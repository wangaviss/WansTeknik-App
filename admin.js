const SUPABASE_URL =
  "https://kxdqviatkjonsfqywgwy.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_cdjpVfFpB7WK36DrVKlr6g_E4b9XM-2";

const db = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

let customers = [];
let serviceRecords = [];

const $ = s => document.querySelector(s);


/* =========================
   HELPER
========================= */

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

function msg(id, text) {
  const el = $(id);

  if (el) {
    el.textContent = text;
  }
}

function formatRupiah(value) {
  return "Rp " +
    Number(value || 0)
      .toLocaleString("id-ID");
}

function formatDate(value) {
  if (!value) return "-";

  return new Date(
    value + "T00:00:00"
  ).toLocaleDateString(
    "id-ID",
    {
      day: "2-digit",
      month: "long",
      year: "numeric"
    }
  );
}


/* =========================
   LOGIN
========================= */

const loginForm = $("#loginForm");

if (loginForm) {

  loginForm.addEventListener(
    "submit",
    async e => {

      e.preventDefault();

      msg(
        "#loginStatus",
        "Memproses login..."
      );

      const email =
        $("#email").value.trim();

      const password =
        $("#password").value;

      if (!email || !password) {

        msg(
          "#loginStatus",
          "Email dan password wajib diisi."
        );

        return;
      }

      const { error } =
        await db.auth.signInWithPassword({
          email,
          password
        });

      if (error) {

        console.error(
          "Login error:",
          error
        );

        msg(
          "#loginStatus",
          "Login gagal: " +
          error.message
        );

        return;
      }

      msg(
        "#loginStatus",
        "Login berhasil..."
      );

      await boot();

    }
  );

}


/* =========================
   LOGOUT
========================= */

const logoutButton = $("#logout");

if (logoutButton) {

  logoutButton.onclick =
    async () => {

      await db.auth.signOut();

      location.reload();

    };

}


/* =========================
   BOOT ADMIN
========================= */

async function boot() {

  const {
    data: { user },
    error
  } = await db.auth.getUser();

  if (error) {

    console.error(
      "Auth error:",
      error
    );

    msg(
      "#loginStatus",
      "Gagal membaca sesi: " +
      error.message
    );

    return;
  }

  if (!user) {

    if ($("#loginCard")) {

      $("#loginCard")
        .classList
        .remove("hidden");

    }

    if ($("#adminApp")) {

      $("#adminApp")
        .classList
        .add("hidden");

    }

    return;
  }

  if ($("#loginCard")) {

    $("#loginCard")
      .classList
      .add("hidden");

  }

  if ($("#adminApp")) {

    $("#adminApp")
      .classList
      .remove("hidden");

  }

  await loadCustomers();

  await loadServiceRecords();

}


/* =========================
   LOAD CUSTOMERS
========================= */

async function loadCustomers() {

  msg(
    "#customerStatus",
    "Memuat data pelanggan..."
  );

  const {
    data,
    error
  } = await db
    .from("customers")
    .select("*")
    .order("name");

  if (error) {

    console.error(
      "Gagal load customers:",
      error
    );

    msg(
      "#customerStatus",
      "Gagal membaca pelanggan: " +
      error.message
    );

    return;
  }

  customers =
    data || [];

  const customerSelect =
    $("#serviceCustomer");

  if (customerSelect) {

    customerSelect.innerHTML =
      "";

    if (customers.length === 0) {

      const option =
        document.createElement(
          "option"
        );

      option.value = "";

      option.textContent =
        "Belum ada pelanggan";

      option.disabled = true;

      option.selected = true;

      customerSelect
        .appendChild(option);

    } else {

      const first =
        document.createElement(
          "option"
        );

      first.value = "";

      first.textContent =
        "— Pilih pelanggan —";

      first.disabled = true;

      first.selected = true;

      customerSelect
        .appendChild(first);

      customers.forEach(c => {

        const option =
          document.createElement(
            "option"
          );

        option.value =
          c.id;

        option.textContent =
          `${c.wt_code} — ${c.name}`;

        customerSelect
          .appendChild(option);

      });

    }

  }

  renderCustomers();

  msg(
    "#customerStatus",
    ""
  );

}


/* =========================
   RENDER CUSTOMER
========================= */

function renderCustomers() {

  const search =
    ($("#search")?.value || "")
      .toLowerCase()
      .trim();

  const filtered =
    customers.filter(c => {

      const text = [
        c.wt_code,
        c.name,
        c.phone,
        c.address
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return !search ||
        text.includes(search);

    });

  const rows =
    $("#customerRows");

  if (rows) {

    rows.innerHTML =
      filtered.map(c => `

        <tr>

          <td>
            ${esc(c.wt_code)}
          </td>

          <td>
            ${esc(c.name)}
          </td>

          <td>
            ${esc(c.phone || "-")}
          </td>

          <td>
            ${esc(c.address || "-")}
          </td>

          <td>

            <button
              type="button"
              class="row-btn"
              onclick="editCustomer('${c.id}')"
            >
              Edit
            </button>

          </td>

        </tr>

      `).join("");

  }

  const status =
    $("#customerFilterStatus");

  if (status) {

    status.textContent =
      search
        ? `${filtered.length} pelanggan ditemukan.`
        : `${customers.length} pelanggan.`;

  }

}


/* =========================
   EDIT CUSTOMER
========================= */

window.editCustomer = id => {

  const c =
    customers.find(
      x => x.id === id
    );

  if (!c) return;

  $("#customerId").value =
    c.id;

  $("#wtCode").value =
    c.wt_code;

  $("#name").value =
    c.name;

  $("#adminPhone").value =
    c.phone || "";

  $("#address").value =
    c.address || "";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

};


/* =========================
   NEW CUSTOMER
========================= */

const newCustomerButton =
  $("#newCustomer");

if (newCustomerButton) {

  newCustomerButton.onclick = () => {

    $("#customerEditor").reset();

    $("#customerId").value = "";

    msg(
      "#customerStatus",
      "Form pelanggan baru."
    );

  };

}


/* =========================
   SAVE CUSTOMER
========================= */

const customerEditor =
  $("#customerEditor");

if (customerEditor) {

  customerEditor.addEventListener(
    "submit",
    async e => {

      e.preventDefault();

      const wtCode =
        $("#wtCode")
          .value
          .trim();

      if (!/^\d{4}$/.test(wtCode)) {

        msg(
          "#customerStatus",
          "Kode WT harus tepat 4 angka. Contoh: 0001"
        );

        return;
      }

      const name =
        $("#name")
          .value
          .trim();

      if (!name) {

        msg(
          "#customerStatus",
          "Nama pelanggan wajib diisi."
        );

        return;
      }

      const payload = {

        wt_code:
          wtCode,

        name:
          name,

        phone:
          $("#adminPhone")
            .value
            .trim() ||
          null,

        address:
          $("#address")
            .value
            .trim() ||
          null

      };

      const id =
        $("#customerId")
          .value
          .trim();

      let result;

      if (id) {

        result =
          await db
            .from("customers")
            .update(payload)
            .eq("id", id);

      } else {

        result =
          await db
            .from("customers")
            .insert(payload);

      }

      if (result.error) {

        console.error(
          "Gagal simpan customer:",
          result.error
        );

        msg(
          "#customerStatus",
          "Gagal menyimpan: " +
          result.error.message
        );

        return;
      }

      msg(
        "#customerStatus",
        "Pelanggan tersimpan."
      );

      $("#customerEditor")
        .reset();

      $("#customerId")
        .value = "";

      await loadCustomers();

    }
  );

}


/* =========================
   SEARCH CUSTOMER
========================= */

const customerSearch =
  $("#search");

if (customerSearch) {

  customerSearch.addEventListener(
    "input",
    renderCustomers
  );

}


/* =========================
   LOAD SERVICE RECORDS
========================= */

async function loadServiceRecords() {

  msg(
    "#serviceListStatus",
    "Memuat riwayat service..."
  );

  const {
    data,
    error
  } = await db
    .from("service_records")
    .select(`
      id,
      customer_id,
      service_date,
      checked,
      problem,
      repair,
      notes,
      cost,
      invoice_no,
      customers (
        wt_code,
        name
      )
    `)
    .order(
      "service_date",
      {
        ascending: false
      }
    );

  if (error) {

    console.error(
      "Gagal memuat service:",
      error
    );

    msg(
      "#serviceListStatus",
      error.message
    );

    return;
  }

  serviceRecords =
    data || [];

  renderServiceRecords();

}


/* =========================
   FILTER SERVICE
========================= */

function renderServiceRecords() {

  const keyword =
    ($("#serviceSearch")?.value || "")
      .toLowerCase()
      .trim();

  const dateFrom =
    $("#serviceDateFrom")?.value ||
    "";

  const dateTo =
    $("#serviceDateTo")?.value ||
    "";

  const type =
    ($("#serviceTypeFilter")?.value || "")
      .toLowerCase()
      .trim();

  const filtered =
    serviceRecords.filter(r => {

      const searchText = [

        r.service_date,
        r.invoice_no,
        r.customers?.wt_code,
        r.customers?.name,
        r.checked,
        r.problem,
        r.repair,
        r.notes

      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (
        keyword &&
        !searchText.includes(keyword)
      ) {

        return false;

      }

      if (
        dateFrom &&
        r.service_date < dateFrom
      ) {

        return false;

      }

      if (
        dateTo &&
        r.service_date > dateTo
      ) {

        return false;

      }

      if (type) {

        const unit =
          String(
            r.checked || ""
          ).toLowerCase();

        if (type === "lainnya") {

          const known = [
            "ac",
            "kulkas",
            "mesin cuci",
            "freezer"
          ];

          const isKnown =
            known.some(
              x => unit.includes(x)
            );

          if (isKnown) {
            return false;
          }

        } else {

          if (
            !unit.includes(type)
          ) {

            return false;

          }

        }

      }

      return true;

    });

  const rows =
    $("#serviceRows");

  if (rows) {

    rows.innerHTML =
      filtered.map(r => `

        <tr>

          <td>
            ${esc(
              formatDate(
                r.service_date
              )
            )}
          </td>

          <td>
            WT-${esc(
              r.customers?.wt_code || "-"
            )}
          </td>

          <td>
            ${esc(
              r.customers?.name || "-"
            )}
          </td>

          <td>
            ${esc(
              r.checked || "-"
            )}
          </td>

          <td>
            ${esc(
              r.invoice_no || "-"
            )}
          </td>

          <td>
            ${esc(
              r.problem || "-"
            )}
          </td>

          <td>
            ${esc(
              r.repair || "-"
            )}
          </td>

          <td>
            ${formatRupiah(r.cost)}
          </td>

          <td>

            <button
              type="button"
              class="row-btn"
              onclick="editService('${r.id}')"
            >
              Edit
            </button>

            <button
              type="button"
              class="row-btn"
              onclick="printInvoice('${r.id}')"
            >
              🧾 Nota
            </button>

            <button
              type="button"
              class="row-btn"
              onclick="deleteService('${r.id}')"
            >
              Hapus
            </button>

          </td>

        </tr>

      `).join("");

  }

  const total =
    filtered.reduce(
      (sum, r) =>
        sum + Number(r.cost || 0),
      0
    );

  if ($("#serviceFilterCount")) {

    $("#serviceFilterCount")
      .textContent =
      filtered.length;

  }

  if ($("#serviceFilterTotal")) {

    $("#serviceFilterTotal")
      .textContent =
      formatRupiah(total);

  }

  msg(
    "#serviceListStatus",
    filtered.length
      ? `${filtered.length} riwayat service ditemukan.`
      : "Tidak ada riwayat yang sesuai filter."
  );

}


/* =========================
   SERVICE FILTER EVENTS
========================= */

const serviceSearch =
  $("#serviceSearch");

if (serviceSearch) {

  serviceSearch.addEventListener(
    "input",
    renderServiceRecords
  );

}

const serviceDateFrom =
  $("#serviceDateFrom");

if (serviceDateFrom) {

  serviceDateFrom.addEventListener(
    "change",
    renderServiceRecords
  );

}

const serviceDateTo =
  $("#serviceDateTo");

if (serviceDateTo) {

  serviceDateTo.addEventListener(
    "change",
    renderServiceRecords
  );

}

const serviceTypeFilter =
  $("#serviceTypeFilter");

if (serviceTypeFilter) {

  serviceTypeFilter.addEventListener(
    "change",
    renderServiceRecords
  );

}


/* =========================
   RESET CUSTOMER SEARCH
========================= */

const clearCustomerSearch =
  $("#clearCustomerSearch");

if (clearCustomerSearch) {

  clearCustomerSearch.onclick = () => {

    $("#search").value = "";

    renderCustomers();

  };

}


/* =========================
   RESET SERVICE FILTER
========================= */

const clearServiceFilters =
  $("#clearServiceFilters");

if (clearServiceFilters) {

  clearServiceFilters.onclick = () => {

    $("#serviceSearch").value = "";

    $("#serviceDateFrom").value = "";

    $("#serviceDateTo").value = "";

    $("#serviceTypeFilter").value = "";

    renderServiceRecords();

  };

}


/* =========================
   EDIT SERVICE
========================= */

window.editService = id => {

  const r =
    serviceRecords.find(
      x => x.id === id
    );

  if (!r) {

    msg(
      "#serviceStatus",
      "Data service tidak ditemukan."
    );

    return;
  }

  $("#serviceId").value =
    r.id;

  $("#serviceCustomer").value =
    r.customer_id || "";

  $("#serviceDate").value =
    r.service_date || "";

  $("#checked").value =
    r.checked || "";

  $("#problem").value =
    r.problem || "";

  $("#repair").value =
    r.repair || "";

  $("#notes").value =
    r.notes || "";

  $("#cost").value =
    r.cost || 0;

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  msg(
    "#serviceStatus",
    "Mode edit riwayat service."
  );

};


/* =========================
   DELETE SERVICE
========================= */

window.deleteService =
  async id => {

    const yakin =
      confirm(
        "Hapus riwayat service ini?"
      );

    if (!yakin) return;

    const { error } =
      await db
        .from("service_records")
        .delete()
        .eq("id", id);

    if (error) {

      console.error(error);

      msg(
        "#serviceListStatus",
        "Gagal menghapus: " +
        error.message
      );

      return;
    }

    msg(
      "#serviceListStatus",
      "Riwayat service berhasil dihapus."
    );

    await loadServiceRecords();

  };


/* =========================
   PRINT INVOICE
========================= */

window.printInvoice = id => {

  const r =
    serviceRecords.find(
      x => x.id === id
    );

  if (!r) {

    msg(
      "#serviceListStatus",
      "Data service tidak ditemukan."
    );

    return;
  }

  const customer =
    r.customers || {};

  const invoiceNo =
    r.invoice_no || "-";

  const customerCode =
    customer.wt_code
      ? `WT-${customer.wt_code}`
      : "-";

  const customerName =
    customer.name || "-";

  const formattedDate =
    formatDate(
      r.service_date
    );

  const cost =
    Number(r.cost || 0)
      .toLocaleString("id-ID");

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


  /* =========================
     HTML NOTA
  ========================= */

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


/* =========================
   PRINT BAR
========================= */

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

  padding: 12px 22px;

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


/* =========================
   HEADER
========================= */

.header {

  display: grid;

  grid-template-columns:
    90px
    1fr
    90px;

  align-items: center;

  gap: 12px;

  background: #fff;

  padding: 18px 20px;

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

  margin: 6px 0 0;

  color: #444;

  font-size: 13px;

  font-weight: 500;

  letter-spacing: .5px;
}


/* =========================
   INVOICE INFO
========================= */

.invoice-info {

  display: grid;

  grid-template-columns:
    1fr
    1fr;

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

  text-transform:
    uppercase;

  margin-bottom: 5px;
}

.value {

  font-size: 15px;

  font-weight: bold;
}


/* =========================
   TABLE
========================= */

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

  vertical-align:
    top;

  font-size: 14px;
}

td:first-child {

  width: 170px;

  font-weight: bold;

  background: #f5f5f5;
}


/* =========================
   TOTAL
========================= */

.total-box {

  display: flex;

  justify-content:
    flex-end;

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


/* =========================
   FOOTER
========================= */

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


/* =========================
   MOBILE
========================= */

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
      65px
      1fr
      65px;

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


/* =========================
   PRINT
========================= */

@media print {

  html,
  body {

    width: 100%;

    margin: 0 !important;

    padding: 0 !important;

    background: #fff !important;
  }

  body {

    -webkit-print-color-adjust:
      exact !important;

    print-color-adjust:
      exact !important;
  }

  .print-bar {

    display: none !important;
  }

  .nota {

    width: 100% !important;

    max-width: none !important;

    margin: 0 !important;
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


  <!-- PRINT BAR -->

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


  <!-- HEADER -->

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


  <!-- INVOICE INFO -->

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


  <!-- DETAIL -->

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
        Unit / Dicek
      </td>

      <td>
        ${esc(r.checked || "-")}
      </td>

    </tr>


    <tr>

      <td>
        Kendala
      </td>

      <td>
        ${esc(r.problem || "-")}
      </td>

    </tr>


    <tr>

      <td>
        Tindakan / Perbaikan
      </td>

      <td>
        ${esc(r.repair || "-")}
      </td>

    </tr>


    <tr>

      <td>
        Catatan
      </td>

      <td>
        ${esc(r.notes || "-")}
      </td>

    </tr>

  </table>


  <!-- TOTAL -->

  <div class="total-box">

    <div class="total">

      Total:
      Rp ${cost}

    </div>

  </div>


  <!-- FOOTER -->

  <div class="footer">

    <strong>
      WansTeknik
    </strong>

    <br>

    Terima kasih telah menggunakan
    layanan WansTeknik.

    <br>

    Nota ini merupakan bukti
    transaksi service.

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


  /* =========================
     PRINT BUTTON
  ========================= */

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


  /* =========================
     CLOSE BUTTON
  ========================= */

  if (closeButton) {

    closeButton.addEventListener(
      "click",
      function() {

        window.close();

      }
    );

  }


  /* =========================
     KEYBOARD CTRL + P
  ========================= */

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


  /* =========================
     WRITE NOTA
  ========================= */

  printWindow.document.open();

  printWindow.document.write(
    notaHTML
  );

  printWindow.document.close();


  /* =========================
     FOCUS NOTA
  ========================= */

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

};


/* =========================
   DATE CHECK
========================= */

const serviceDateInput =
  $("#serviceDate");

if (serviceDateInput) {

  serviceDateInput.addEventListener(
    "change",
    () => {

      console.log(
        "Tanggal dipilih:",
        $("#serviceDate").value
      );

    }
  );

}


/* =========================
   CUSTOMER SELECT CHECK
========================= */

const serviceCustomerSelect =
  $("#serviceCustomer");

if (serviceCustomerSelect) {

  serviceCustomerSelect.addEventListener(
    "change",
    () => {

      console.log(
        "Customer ID:",
        $("#serviceCustomer").value
      );

    }
  );

}


/* =========================
   SAVE SERVICE
========================= */

const serviceEditor =
  $("#serviceEditor");

if (serviceEditor) {

  serviceEditor.addEventListener(
    "submit",
    async e => {

      e.preventDefault();

      const customerId =
        $("#serviceCustomer").value;

      const serviceDate =
        $("#serviceDate").value;

      if (!customerId) {

        msg(
          "#serviceStatus",
          "Pilih pelanggan terlebih dahulu."
        );

        return;
      }

      if (!serviceDate) {

        msg(
          "#serviceStatus",
          "Pilih tanggal service terlebih dahulu."
        );

        return;
      }

      const payload = {

        customer_id:
          customerId,

        service_date:
          serviceDate,

        checked:
          $("#checked")
            .value
            .trim() ||
          null,

        problem:
          $("#problem")
            .value
            .trim() ||
          null,

        repair:
          $("#repair")
            .value
            .trim() ||
          null,

        notes:
          $("#notes")
            .value
            .trim() ||
          null,

        cost:
          Number(
            $("#cost").value || 0
          )

      };

      const id =
        $("#serviceId")
          .value
          .trim();

      let result;

      if (id) {

        result =
          await db
            .from("service_records")
            .update(payload)
            .eq("id", id);

      } else {

        result =
          await db
            .from("service_records")
            .insert(payload);

      }

      if (result.error) {

        console.error(
          "Gagal simpan service:",
          result.error
        );

        msg(
          "#serviceStatus",
          "Gagal menyimpan riwayat: " +
          result.error.message
        );

        return;
      }

      msg(
        "#serviceStatus",
        "Riwayat service berhasil disimpan."
      );

      $("#serviceEditor")
        .reset();

      $("#serviceId")
        .value = "";

      $("#cost")
        .value = 0;

      await loadCustomers();

      await loadServiceRecords();

    }
  );

}


/* =========================
   CSV IMPORT
========================= */

const importCsvButton =
  $("#importCsv");

if (importCsvButton) {

  importCsvButton.onclick =
    async () => {

      const f =
        $("#csvFile")
          .files[0];

      if (!f) {

        msg(
          "#importStatus",
          "Pilih CSV terlebih dahulu."
        );

        return;
      }

      const text =
        await f.text();

      const rows =
        parseCSV(text);

      if (!rows.length) {

        msg(
          "#importStatus",
          "CSV kosong."
        );

        return;
      }

      let ok = 0;

      let fail = 0;

      for (const r of rows) {

        try {

          const wtCode =
            String(
              r.wt_code || ""
            ).trim();

          let c =
            customers.find(
              x =>
                String(
                  x.wt_code
                ) === wtCode
            );

          if (
            !c &&
            wtCode &&
            r.name
          ) {

            const ins =
              await db
                .from("customers")
                .insert({

                  wt_code:
                    wtCode,

                  name:
                    r.name,

                  phone:
                    r.phone || null,

                  address:
                    r.address || null

                })
                .select()
                .single();

            if (ins.error)
              throw ins.error;

            c = ins.data;

          }

          if (!c) {

            throw new Error(
              "Pelanggan WT tidak ditemukan"
            );

          }

          const ins =
            await db
              .from("service_records")
              .insert({

                customer_id:
                  c.id,

                service_date:
                  r.service_date,

                checked:
                  r.checked || null,

                problem:
                  r.problem || null,

                repair:
                  r.repair || null,

                notes:
                  r.notes || null,


/* =========================
   CSV IMPORT - FIXED
========================= */

const importCsvButton = $("#importCsv");

if (importCsvButton) {
  importCsvButton.onclick = async () => {
    const status = $("#importStatus");
    const fileInput = $("#csvFile");
    const file = fileInput?.files?.[0];

    if (!file) {
      msg("#importStatus", "Pilih file CSV terlebih dahulu.");
      return;
    }

    if (!/\.csv$/i.test(file.name)) {
      msg("#importStatus", "File harus berformat .csv.");
      return;
    }

    importCsvButton.disabled = true;
    msg("#importStatus", "Memeriksa file CSV...");

    let ok = 0;
    let fail = 0;
    const errors = [];

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (!rows.length) {
        throw new Error("CSV tidak memiliki baris data.");
      }

      // Periksa nama kolom
      const required = [
        "wt_code",
        "service_date"
      ];

      const headers = Object.keys(rows[0] || {});

      const missing = required.filter(
        h => !headers.includes(h)
      );

      if (missing.length) {
        throw new Error(
          "Kolom wajib tidak ditemukan: " +
          missing.join(", ") +
          ". Periksa nama header CSV."
        );
      }

      // Ambil data pelanggan terbaru dari database
      msg("#importStatus", "Memuat data pelanggan...");

      const { data, error: customerError } = await db
        .from("customers")
        .select("id, wt_code, name, phone, address");

      if (customerError) {
        throw new Error(
          "Gagal membaca pelanggan: " +
          customerError.message
        );
      }

      // Cache pelanggan agar kode yang sama tidak dibuat berulang
      const customerMap = new Map();

      (data || []).forEach(c => {
        customerMap.set(
          String(c.wt_code || "").trim(),
          c
        );
      });

      msg(
        "#importStatus",
        `Mulai mengimpor ${rows.length} baris...`
      );

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const rowNumber = i + 2;

        try {
          // Kode pelanggan harus 4 digit
          const wtCode = String(r.wt_code || "").trim();

          if (!/^\d{4}$/.test(wtCode)) {
            throw new Error(
              "wt_code wajib tepat 4 angka, contoh 0001."
            );
          }

          // Validasi tanggal
          const date = String(r.service_date || "").trim();

          if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            throw new Error(
              "Tanggal wajib berformat YYYY-MM-DD."
            );
          }

          const parsedDate = new Date(date + "T00:00:00Z");

          if (
            Number.isNaN(parsedDate.getTime()) ||
            parsedDate.toISOString().slice(0, 10) !== date
          ) {
            throw new Error("Tanggal tidak valid.");
          }

          // Cari pelanggan yang sudah ada
          let customer = customerMap.get(wtCode);

          // Buat pelanggan baru jika belum ada
          if (!customer) {
            const name = String(r.name || "").trim();

            if (!name) {
              throw new Error(
                "Pelanggan belum terdaftar dan kolom name kosong."
              );
            }

            const { data: newCustomer, error: insertCustomerError } =
              await db
                .from("customers")
                .insert({
                  wt_code: wtCode,
                  name,
                  phone: String(r.phone || "").trim() || null,
                  address: String(r.address || "").trim() || null
                })
                .select("id, wt_code, name, phone, address")
                .single();

            if (insertCustomerError) {
              throw new Error(
                "Gagal membuat pelanggan: " +
                insertCustomerError.message
              );
            }

            customer = newCustomer;

            // Simpan ke cache untuk baris berikutnya
            customerMap.set(wtCode, customer);
          }

          // Biaya: menerima 75000, 75.000, atau Rp 75.000
          const rawCost = String(r.cost ?? "0")
            .trim()
            .replace(/^Rp\s*/i, "")
            .replace(/[\s.,]/g, "");

          if (rawCost && !/^\d+$/.test(rawCost)) {
            throw new Error(
              "Biaya tidak valid. Gunakan angka, contoh 75000."
            );
          }

          const cost = rawCost ? Number(rawCost) : 0;

          if (!Number.isSafeInteger(cost)) {
            throw new Error("Nilai biaya terlalu besar.");
          }

          // Simpan riwayat servis
          const { error: serviceError } = await db
            .from("service_records")
            .insert({
              customer_id: customer.id,
              service_date: date,
              checked: String(r.checked || "").trim() || null,
              problem: String(r.problem || "").trim() || null,
              repair: String(r.repair || "").trim() || null,
              notes: String(r.notes || "").trim() || null,
              cost
            });

          if (serviceError) {
            throw new Error(
              "Gagal menyimpan servis: " +
              serviceError.message
            );
          }

          ok++;

        } catch (err) {
          fail++;

          const detail =
            err?.message || String(err);

          errors.push(
            `Baris ${rowNumber}: ${detail}`
          );

          console.error(
            `Import CSV baris ${rowNumber} gagal:`,
            err
          );
        }
      }

      let summary =
        `Import selesai: ${ok} berhasil, ${fail} gagal.`;

      if (errors.length) {
        summary += "\n\nDetail kegagalan:\n" +
          errors.slice(0, 10).join("\n");

        if (errors.length > 10) {
          summary +=
            `\n...dan ${errors.length - 10} error lainnya.`;
        }
      }

      msg("#importStatus", summary);

      await loadCustomers();
      await loadServiceRecords();

    } catch (err) {
      console.error("Import CSV error:", err);

      msg(
        "#importStatus",
        "Import gagal: " +
        (err?.message || String(err))
      );

    } finally {
      importCsvButton.disabled = false;
    }
  };
}


/* =========================
   CSV PARSER
========================= */

function parseCSV(text) {
  text = String(text || "").replace(/^\uFEFF/, "");

  const firstLine = text.split(/\r\n|\n|\r/)[0] || "";
  let comma = 0;
  let semicolon = 0;
  let quoted = false;

  for (let i = 0; i < firstLine.length; i++) {
    const c = firstLine[i];

    if (c === '"') {
      if (quoted && firstLine[i + 1] === '"') {
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (!quoted && c === ",") {
      comma++;
    } else if (!quoted && c === ";") {
      semicolon++;
    }
  }

  const delimiter = semicolon > comma ? ";" : ",";

  const rows = [];
  let row = [];
  let cell = "";
  quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (!quoted && c === delimiter) {
      row.push(cell);
      cell = "";
    } else if (!quoted && (c === "\n" || c === "\r")) {
      if (c === "\r" && text[i + 1] === "\n") i++;

      row.push(cell);
      if (row.some(v => v.trim() !== "")) rows.push(row);

      row = [];
      cell = "";
    } else {
      cell += c;
    }
  }

  if (quoted) {
    throw new Error("CSV memiliki tanda kutip yang tidak berpasangan.");
  }

  row.push(cell);
  if (row.some(v => v.trim() !== "")) rows.push(row);

  if (rows.length < 2) {
    throw new Error("CSV kosong atau tidak memiliki baris data.");
  }

  const headers = rows.shift().map(h =>
    h.trim().toLowerCase().replace(/^\uFEFF/, "")
  );

  if (new Set(headers).size !== headers.length) {
    throw new Error("Ada nama kolom CSV yang duplikat.");
  }

  return rows.map((values, index) => {
    if (values.length !== headers.length) {
      throw new Error(
        `Baris CSV ${index + 2}: jumlah kolom tidak sesuai header.`
      );
    }

    return Object.fromEntries(
      headers.map((header, i) => [header, values[i].trim()])
    );
  });
}

/* =========================
   START
========================= */

boot();

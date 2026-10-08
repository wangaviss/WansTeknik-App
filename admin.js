const SUPABASE_URL = "https://kxdqviatkjonsfqywgwy.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_cdjpVfFpB7WK36DrVKlr6g_E4b9XM-2";

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
  return String(v).replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

function msg(id, text) {
  const el = $(id);
  if (el) el.textContent = text;
}

function formatRupiah(value) {
  return "Rp " + Number(value || 0).toLocaleString("id-ID");
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

$("#loginForm").addEventListener(
  "submit",
  async e => {

    e.preventDefault();

    msg(
      "#loginStatus",
      "Memproses login..."
    );

    const { error } =
      await db.auth.signInWithPassword({

        email:
          $("#email").value.trim(),

        password:
          $("#password").value

      });

    if (error) {

      console.error(
        "Login error:",
        error
      );

      msg(
        "#loginStatus",
        error.message
      );

      return;
    }

    await boot();

  }
);


/* =========================
   LOGOUT
========================= */

$("#logout").onclick = async () => {

  await db.auth.signOut();

  location.reload();

};


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
      error.message
    );

    return;
  }

  if (!user) return;

  $("#loginCard")
    .classList
    .add("hidden");

  $("#adminApp")
    .classList
    .remove("hidden");

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

  customerSelect.innerHTML = "";


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

      option.value = c.id;

      option.textContent =
        `${c.wt_code} — ${c.name}`;

      customerSelect
        .appendChild(option);

    });

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


  $("#customerRows").innerHTML =
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

$("#newCustomer").onclick = () => {

  $("#customerEditor").reset();

  $("#customerId").value = "";

  msg(
    "#customerStatus",
    "Form pelanggan baru."
  );

};


/* =========================
   SAVE CUSTOMER
========================= */

$("#customerEditor")
  .addEventListener(
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


/* =========================
   SEARCH CUSTOMER
========================= */

$("#search").addEventListener(
  "input",
  renderCustomers
);


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
    $("#serviceDateFrom")?.value || "";


  const dateTo =
    $("#serviceDateTo")?.value || "";


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


  $("#serviceRows").innerHTML =
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

$("#serviceSearch").addEventListener(
  "input",
  renderServiceRecords
);

$("#serviceDateFrom").addEventListener(
  "change",
  renderServiceRecords
);

$("#serviceDateTo").addEventListener(
  "change",
  renderServiceRecords
);

$("#serviceTypeFilter").addEventListener(
  "change",
  renderServiceRecords
);


/* =========================
   RESET CUSTOMER SEARCH
========================= */

$("#clearCustomerSearch").onclick = () => {

  $("#search").value = "";

  renderCustomers();

};


/* =========================
   RESET SERVICE FILTER
========================= */

$("#clearServiceFilters").onclick = () => {

  $("#serviceSearch").value = "";

  $("#serviceDateFrom").value = "";

  $("#serviceDateTo").value = "";

  $("#serviceTypeFilter").value = "";

  renderServiceRecords();

};


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

window.deleteService = async id => {

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
      "./logo-wt.png",
      window.location.href
    ).href;


  const logoBrandUrl =
    new URL(
      "./logo-brand.png",
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
      "Popup diblokir browser. Izinkan popup untuk mencetak nota."
    );

    return;
  }


  printWindow.document.write(`

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


        body {

          font-family:
            Arial,
            Helvetica,
            sans-serif;

          margin: 0;

          padding: 30px;

          color: #111;

          background: #fff;

        }


        .nota {

          max-width: 750px;

          margin: auto;

        }

.header {
  display: grid;
  grid-template-columns: 90px 1fr 90px;
  align-items: center;
  gap: 12px;

  background: #000;
  padding: 18px 20px;
  border-radius: 10px;
  margin-bottom: 20px;
}

.logo-box {
  width: 90px;
  height: 75px;

  display: flex;
  align-items: center;
  justify-content: center;

  background: #000;
  overflow: hidden;
}

.logo-box img {
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
  color: #1683ff;
  font-size: 30px;
  font-weight: 800;
  letter-spacing: 1px;
}

.brand-center p {
  margin: 6px 0 0;
  color: #ffffff;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.5px;
}
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

          text-transform:
            uppercase;

          margin-bottom: 5px;

        }


        .value {

          font-size: 15px;

          font-weight: bold;

        }


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


        @media print {

          body {
            padding: 0;
          }

          .nota {
            max-width: none;
          }

        }

      </style>

    </head>


    <body>

      <div class="nota">


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


        <div class="total-box">

          <div class="total">

            Total:
            Rp ${cost}

          </div>

        </div>


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

        window.onload = function() {
          window.print();
        };

      <\/script>


    </body>

    </html>

  `);


  printWindow.document.close();

};


/* =========================
   DATE CHECK
========================= */

$("#serviceDate").addEventListener(
  "change",
  () => {

    console.log(
      "Tanggal dipilih:",
      $("#serviceDate").value
    );

  }
);


/* =========================
   CUSTOMER SELECT CHECK
========================= */

$("#serviceCustomer").addEventListener(
  "change",
  () => {

    console.log(
      "Customer ID:",
      $("#serviceCustomer").value
    );

  }
);


/* =========================
   SAVE SERVICE
========================= */

$("#serviceEditor")
  .addEventListener(
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


/* =========================
   CSV IMPORT
========================= */

$("#importCsv").onclick =
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

              cost:
                Number(
                  r.cost || 0
                )

            });


        if (ins.error)
          throw ins.error;


        ok++;


      } catch (e) {

        console.error(
          "Import gagal:",
          e
        );

        fail++;

      }

    }


    msg(
      "#importStatus",
      `Selesai: ${ok} berhasil, ${fail} gagal.`
    );


    await loadCustomers();

    await loadServiceRecords();

  };


/* =========================
   CSV PARSER
========================= */

function parseCSV(text) {

  const lines =
    text
      .split(/\r?\n/)
      .filter(
        x => x.trim()
      );


  if (!lines.length)
    return [];


  const parse = s => {

    let a = [];

    let cur = "";

    let q = false;


    for (
      let i = 0;
      i < s.length;
      i++
    ) {

      const ch = s[i];


      if (ch === '"') {

        if (
          q &&
          s[i + 1] === '"'
        ) {

          cur += '"';

          i++;

        } else {

          q = !q;

        }


      } else if (
        ch === "," &&
        !q
      ) {

        a.push(cur);

        cur = "";

      } else {

        cur += ch;

      }

    }


    a.push(cur);


    return a.map(
      x => x.trim()
    );

  };


  const h =
    parse(lines[0])
      .map(
        x => x.toLowerCase()
      );


  return lines
    .slice(1)
    .map(line => {

      const v =
        parse(line);

      const o = {};


      h.forEach(
        (k, i) => {

          o[k] =
            v[i] || "";

        }
      );


      return o;

    });

}


/* =========================
   START
========================= */

boot();

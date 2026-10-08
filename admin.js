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


/* =========================
   LOGIN
========================= */

$("#loginForm").addEventListener("submit", async e => {

  e.preventDefault();

  msg("#loginStatus", "Memproses login...");

  const { error } = await db.auth.signInWithPassword({
    email: $("#email").value.trim(),
    password: $("#password").value
  });

  if (error) {
    msg("#loginStatus", error.message);
    return;
  }

  await boot();

});


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

    msg("#loginStatus", error.message);

    return;
  }

  if (!user) return;

  $("#loginCard").classList.add("hidden");
  $("#adminApp").classList.remove("hidden");

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

  const { data, error } = await db
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

  customers = data || [];


  /* =========================
     DROPDOWN PELANGGAN
  ========================= */

  const customerSelect =
    $("#serviceCustomer");

  customerSelect.innerHTML = "";


  if (customers.length === 0) {

    const option =
      document.createElement("option");

    option.value = "";

    option.textContent =
      "Belum ada pelanggan";

    option.disabled = true;

    option.selected = true;

    customerSelect.appendChild(option);

  } else {

    const first =
      document.createElement("option");

    first.value = "";

    first.textContent =
      "— Pilih pelanggan —";

    first.disabled = true;

    first.selected = true;

    customerSelect.appendChild(first);


    customers.forEach(c => {

      const option =
        document.createElement("option");

      option.value = c.id;

      option.textContent =
        `${c.wt_code} — ${c.name}`;

      customerSelect.appendChild(option);

    });

  }


  /* =========================
     TABEL PELANGGAN
  ========================= */

  renderCustomers();

  msg("#customerStatus", "");

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

      return !search || text.includes(search);

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
            onclick="editCustomer('${c.id}')">
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
    customers.find(x => x.id === id);

  if (!c) return;

  $("#customerId").value = c.id;

  $("#wtCode").value = c.wt_code;

  $("#name").value = c.name;

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
  .addEventListener("submit", async e => {

    e.preventDefault();

    const wtCode =
      $("#wtCode").value.trim();


    if (!/^\d{4}$/.test(wtCode)) {

      msg(
        "#customerStatus",
        "Kode WT harus tepat 4 angka. Contoh: 0001"
      );

      return;
    }


    const name =
      $("#name").value.trim();


    if (!name) {

      msg(
        "#customerStatus",
        "Nama pelanggan wajib diisi."
      );

      return;
    }


    const payload = {

      wt_code: wtCode,

      name: name,

      phone:
        $("#adminPhone").value.trim() ||
        null,

      address:
        $("#address").value.trim() ||
        null

    };


    const id =
      $("#customerId").value.trim();


    let result;


    if (id) {

      result = await db
        .from("customers")
        .update(payload)
        .eq("id", id);

    } else {

      result = await db
        .from("customers")
        .insert(payload);

    }


    if (result.error) {

      console.error(result.error);

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


    $("#customerEditor").reset();

    $("#customerId").value = "";


    await loadCustomers();

  });


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


  const { data, error } = await db
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


      /* SEARCH */

      const searchText = [

        r.service_date,

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


      /* DATE FROM */

      if (
        dateFrom &&
        r.service_date < dateFrom
      ) {
        return false;
      }


      /* DATE TO */

      if (
        dateTo &&
        r.service_date > dateTo
      ) {
        return false;
      }


      /* TYPE */

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
            known.some(x =>
              unit.includes(x)
            );

          if (isKnown) {
            return false;
          }

        } else {

          if (!unit.includes(type)) {
            return false;
          }

        }

      }


      return true;

    });


  /* =========================
     RENDER TABLE
  ========================== */

  $("#serviceRows").innerHTML =
    filtered.map(r => `

      <tr>

        <td>
          ${esc(r.service_date || "-")}
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
          ${esc(r.checked || "-")}
        </td>

        <td>
          ${esc(r.problem || "-")}
        </td>

        <td>
          ${esc(r.repair || "-")}
        </td>

        <td>
          Rp ${Number(
            r.cost || 0
          ).toLocaleString("id-ID")}
        </td>

        <td>

          <button
            type="button"
            class="row-btn"
            onclick="editService('${r.id}')">
            Edit
          </button>

          <button
            type="button"
            class="row-btn"
            onclick="deleteService('${r.id}')">
            Hapus
          </button>

        </td>

      </tr>

    `).join("");


  /* =========================
     TOTAL FILTER
  ========================== */

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
      "Rp " +
      total.toLocaleString("id-ID");

  }


  msg(
    "#serviceListStatus",
    filtered.length
      ? `${filtered.length} riwayat service ditemukan.`
      : "Tidak ada riwayat yang sesuai filter."
  );

}


/* =========================
   SERVICE SEARCH
========================= */

$("#serviceSearch").addEventListener(
  "input",
  renderServiceRecords
);


/* =========================
   SERVICE DATE FROM
========================= */

$("#serviceDateFrom").addEventListener(
  "change",
  renderServiceRecords
);


/* =========================
   SERVICE DATE TO
========================= */

$("#serviceDateTo").addEventListener(
  "change",
  renderServiceRecords
);


/* =========================
   SERVICE TYPE
========================= */

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


  const { error } = await db
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
   DATE CHECK
========================= */

$("#serviceDate").addEventListener(
  "change",
  () => {

    const value =
      $("#serviceDate").value;

    console.log(
      "Tanggal dipilih:",
      value
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
  .addEventListener("submit", async e => {

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
        $("#checked").value.trim() ||
        null,

      problem:
        $("#problem").value.trim() ||
        null,

      repair:
        $("#repair").value.trim() ||
        null,

      notes:
        $("#notes").value.trim() ||
        null,

      cost:
        Number(
          $("#cost").value || 0
        )

    };


    const id =
      $("#serviceId").value.trim();


    console.log(
      "SERVICE ID:",
      id
    );


    let result;


    if (id) {

      result = await db
        .from("service_records")
        .update(payload)
        .eq("id", id);

    } else {

      result = await db
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


    $("#serviceEditor").reset();

    $("#serviceId").value = "";

    $("#cost").value = 0;


    await loadCustomers();

    await loadServiceRecords();

  });


/* =========================
   CSV IMPORT
========================= */

$("#importCsv").onclick = async () => {

  const f =
    $("#csvFile").files[0];


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
            String(x.wt_code) ===
            wtCode
        );


      if (!c && wtCode && r.name) {

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
      .filter(x => x.trim());


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

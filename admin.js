const SUPABASE_URL = "https://kxdqviatkjonsfqywgwy.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_cdjpVfFpB7WK36DrVKlr6g_E4b9XM-2";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let customers = [];

const $ = s => document.querySelector(s);

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
}


/* =========================
   LOAD CUSTOMERS
========================= */

async function loadCustomers() {

  msg("#customerStatus", "Memuat data pelanggan...");

  const { data, error } = await db
    .from("customers")
    .select("*")
    .order("name");

  if (error) {
    console.error("Gagal load customers:", error);
    msg("#customerStatus", "Gagal membaca pelanggan: " + error.message);
    return;
  }

  customers = data || [];

  /* Dropdown pelanggan */

  const customerSelect = $("#serviceCustomer");

  customerSelect.innerHTML = "";

  if (customers.length === 0) {

    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Belum ada pelanggan";
    option.disabled = true;
    option.selected = true;

    customerSelect.appendChild(option);

  } else {

    const first = document.createElement("option");
    first.value = "";
    first.textContent = "— Pilih pelanggan —";
    first.disabled = true;
    first.selected = true;

    customerSelect.appendChild(first);

    customers.forEach(c => {

      const option = document.createElement("option");

      option.value = c.id;
      option.textContent =
        `${c.wt_code} — ${c.name}`;

      customerSelect.appendChild(option);

    });
  }


  /* Tabel pelanggan */

  $("#customerRows").innerHTML = customers.map(c => `
    <tr>
      <td>${esc(c.wt_code)}</td>
      <td>${esc(c.name)}</td>
      <td>${esc(c.phone || "-")}</td>
      <td>${esc(c.address || "-")}</td>
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

  msg("#customerStatus", "");
}


/* =========================
   EDIT CUSTOMER
========================= */

window.editCustomer = id => {

  const c = customers.find(x => x.id === id);

  if (!c) return;

  $("#customerId").value = c.id;
  $("#wtCode").value = c.wt_code;
  $("#name").value = c.name;
  $("#adminPhone").value = c.phone || "";
  $("#address").value = c.address || "";

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

};


/* =========================
   SAVE CUSTOMER
========================= */

$("#customerEditor").addEventListener("submit", async e => {

  e.preventDefault();

  const wtCode = $("#wtCode").value.trim();

  if (!/^\d{4}$/.test(wtCode)) {

    msg(
      "#customerStatus",
      "Kode WT harus tepat 4 angka. Contoh: 0001"
    );

    return;
  }

  const name = $("#name").value.trim();

  if (!name) {

    msg("#customerStatus", "Nama pelanggan wajib diisi.");

    return;
  }

  const payload = {
    wt_code: wtCode,
    name: name,
    phone: $("#adminPhone").value.trim() || null,
    address: $("#address").value.trim() || null
  };

  const id = $("#customerId").value;

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
      "Gagal menyimpan: " + result.error.message
    );

    return;
  }

  msg("#customerStatus", "Pelanggan tersimpan.");

  $("#customerEditor").reset();
  $("#customerId").value = "";

  await loadCustomers();
});


/* =========================
   DATE CHECK
========================= */

$("#serviceDate").addEventListener("change", () => {

  const value = $("#serviceDate").value;

  console.log("Tanggal dipilih:", value);

  if (value) {
    msg("#serviceStatus", "Tanggal service: " + value);
  }

});


/* =========================
   CUSTOMER SELECT CHECK
========================= */

$("#serviceCustomer").addEventListener("change", () => {

  const customerId = $("#serviceCustomer").value;

  console.log("Customer ID:", customerId);

});


/* =========================
   SAVE SERVICE
========================= */

$("#serviceEditor").addEventListener("submit", async e => {

  e.preventDefault();

  const customerId = $("#serviceCustomer").value;
  const serviceDate = $("#serviceDate").value;

  if (!customerId) {

    msg("#serviceStatus", "Pilih pelanggan terlebih dahulu.");

    return;
  }

  if (!serviceDate) {

    msg("#serviceStatus", "Pilih tanggal service terlebih dahulu.");

    return;
  }

  const payload = {

    customer_id: customerId,

    service_date: serviceDate,

    checked:
      $("#checked").value.trim() || null,

    problem:
      $("#problem").value.trim() || null,

    repair:
      $("#repair").value.trim() || null,

    notes:
      $("#notes").value.trim() || null,

    cost:
      Number($("#cost").value || 0)

  };


  console.log("Data service:", payload);


  const id = $("#serviceId").value;

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

    console.error(result.error);

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

});


/* =========================
   SEARCH
========================= */

$("#search").addEventListener("input", () => {

  const q = $("#search").value.toLowerCase();

  document
    .querySelectorAll("#customerRows tr")
    .forEach(tr => {

      tr.style.display =
        tr.textContent
          .toLowerCase()
          .includes(q)
          ? ""
          : "none";

    });

});


/* =========================
   CSV IMPORT
========================= */

$("#importCsv").onclick = async () => {

  const f = $("#csvFile").files[0];

  if (!f) {

    msg("#importStatus", "Pilih CSV terlebih dahulu.");

    return;
  }

  const text = await f.text();

  const rows = parseCSV(text);

  if (!rows.length) {

    msg("#importStatus", "CSV kosong.");

    return;
  }

  let ok = 0;
  let fail = 0;


  for (const r of rows) {

    try {

      const wtCode =
        String(r.wt_code || "").trim();

      let c =
        customers.find(
          x => String(x.wt_code) === wtCode
        );


      if (!c && wtCode && r.name) {

        const ins = await db
          .from("customers")
          .insert({
            wt_code: wtCode,
            name: r.name,
            phone: r.phone || null,
            address: r.address || null
          })
          .select()
          .single();

        if (ins.error) throw ins.error;

        c = ins.data;
      }


      if (!c) {
        throw new Error(
          "Pelanggan WT tidak ditemukan"
        );
      }


      const ins = await db
        .from("service_records")
        .insert({

          customer_id: c.id,

          service_date: r.service_date,

          checked: r.checked || null,

          problem: r.problem || null,

          repair: r.repair || null,

          notes: r.notes || null,

          cost: Number(r.cost || 0)

        });


      if (ins.error) throw ins.error;

      ok++;

    } catch (e) {

      console.error("Import gagal:", e);

      fail++;

    }

  }


  msg(
    "#importStatus",
    `Selesai: ${ok} berhasil, ${fail} gagal.`
  );

  await loadCustomers();

};


/* =========================
   CSV PARSER
========================= */

function parseCSV(text) {

  const lines =
    text
      .split(/\r?\n/)
      .filter(x => x.trim());

  if (!lines.length) return [];


  const parse = s => {

    let a = [];
    let cur = "";
    let q = false;

    for (let i = 0; i < s.length; i++) {

      const ch = s[i];

      if (ch === '"') {

        if (q && s[i + 1] === '"') {

          cur += '"';
          i++;

        } else {

          q = !q;

        }

      } else if (ch === "," && !q) {

        a.push(cur);
        cur = "";

      } else {

        cur += ch;

      }

    }

    a.push(cur);

    return a.map(x => x.trim());

  };


  const h =
    parse(lines[0])
      .map(x => x.toLowerCase());


  return lines
    .slice(1)
    .map(line => {

      const v = parse(line);
      const o = {};

      h.forEach((k, i) => {
        o[k] = v[i] || "";
      });

      return o;

    });

}


/* =========================
   START
========================= */

boot();

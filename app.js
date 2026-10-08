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
// KONFIGURASI WANSTEKNIK
// =====================================================

const WANSTEKNIK_PHONE =
  "085384577964";


// Nomor WhatsApp harus format internasional
const WANSTEKNIK_WA =
  "6285384577964";


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

const whatsappBtn =
  document.querySelector("#whatsappBtn");

const bookingBtn =
  document.querySelector("#bookingBtn");


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
// WHATSAPP
// =====================================================

function setupWhatsApp(
  customerName,
  customerCode,
  phone
) {

  const message =
`Halo WansTeknik.

Saya pelanggan WansTeknik.

Nama: ${customerName}
Kode WT: ${customerCode}
No. HP: ${phone}

Saya ingin menanyakan layanan service.`;

  const url =
    "https://wa.me/" +
    WANSTEKNIK_WA +
    "?text=" +
    encodeURIComponent(message);


  if (whatsappBtn) {

    whatsappBtn.href = url;

  }


  const bookingMessage =
`Halo WansTeknik.

Saya ingin melakukan booking service.

Nama: ${customerName}
Kode WT: ${customerCode}
No. HP: ${phone}

Alamat:
Jenis Unit:
Keluhan:
Tanggal/Jam yang diinginkan:`;


  const bookingUrl =
    "https://wa.me/" +
    WANSTEKNIK_WA +
    "?text=" +
    encodeURIComponent(
      bookingMessage
    );


  if (bookingBtn) {

    bookingBtn.href =
      bookingUrl;

  }

}


// =====================================================
// SIMPAN DATA NOTA CUSTOMER
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


  /*
    Data disimpan sementara di localStorage
    agar nota.html yang sama bisa digunakan
    oleh Customer maupun Admin.
  */

  const notaData = {

    source: "customer",

    invoice_no:
      record.invoice_no || "",

    service_date:
      record.service_date || "",

    checked:
      record.checked || "",

    problem:
      record.problem || "",

    repair:
      record.repair || "",

    notes:
      record.notes || "",

    cost:
      record.cost || 0,


    customer: {

      wt_code:
        customer.wt_code || "",

      name:
        customer.name || "",

      phone:
        customer.phone || "",

      address:
        customer.address || ""

    }

  };


  try {

    localStorage.setItem(
      "wansTeknikNota",
      JSON.stringify(notaData)
    );

  } catch (error) {

    console.error(
      "Gagal menyimpan data nota:",
      error
    );

    alert(
      "Nota gagal dibuka. Silakan coba lagi."
    );

    return;

  }


  /*
    Buka halaman nota yang sama
    dengan yang digunakan Admin.
  */

  window.open(
    "nota.html",
    "_blank"
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


  /*
    Event tombol nota
  */

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


      // Sembunyikan hasil sebelumnya
      if (result) {

        result.classList.add(
          "hidden"
        );

      }


      // Status loading
      if (statusEl) {

        statusEl.className =
          "status loading";

        statusEl.textContent =
          "Mencari riwayat service...";

      }


      // Tombol loading
      if (submitBtn) {

        submitBtn.disabled =
          true;

        submitBtn.textContent =
          "Mencari...";

      }


      // Ambil input
      const phone =
        normalizePhone(
          document.querySelector(
            "#phone"
          ).value
        );


      const code =
        normalizeCode(
          document.querySelector(
            "#code"
          ).value
        );


      // Validasi
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


      // =================================================
      // RPC RIWAYAT
      // =================================================

      const {
        data,
        error
      } =
        await db.rpc(
          "cek_riwayat_konsumen",
          {
            p_wt_code: code,
            p_phone: phone
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


      // Tidak ditemukan
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


      // =================================================
      // DATA CUSTOMER
      // =================================================

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


      // =================================================
      // TAMPILKAN DATA CUSTOMER
      // =================================================

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


      // =================================================
      // RINGKASAN
      // =================================================

      if (totalServiceEl) {

        totalServiceEl.textContent =
          data.length;

      }


      // Data RPC sudah diurutkan:
      // service_date desc

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


      // =================================================
      // WHATSAPP
      // =================================================

      setupWhatsApp(
        customerData.name ||
          "Pelanggan",

        customerData.wt_code ||
          code,

        customerData.phone ||
          phone
      );


      // =================================================
      // RIWAYAT
      // =================================================

      renderHistory(
        data,
        customerData
      );


      // =================================================
      // SUCCESS
      // =================================================

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

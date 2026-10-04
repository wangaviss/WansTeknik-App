WANSTEKNIK APP V2.2
====================

Isi:
- index.html
- style.css
- apps.js
- logo-wt.png
- logo-brand.png
- README.txt
- supabase-v2.2.sql

Yang sudah:
1. Home membuka website utama.
2. Pemasukan membuka Google Form.
3. Jadwal tersimpan ke Supabase.
4. Daftar jadwal + hapus.
5. Notifikasi browser sebagai fallback.
6. Pengajuan memakai Supabase Auth, bukan password hardcoded.
7. Galeri & Arsip sudah disiapkan untuk Supabase Storage.

CATATAN ALARM ANDROID
---------------------
JavaScript setTimeout tidak bisa menjamin alarm ketika WebView/app benar-benar tertutup.
Untuk alarm yang tetap berbunyi saat app ditutup, APK perlu bridge native Android:
- AlarmManager
- BroadcastReceiver
- Notification channel
- permission POST_NOTIFICATIONS (Android 13+)

Web V2.2 sudah menyiapkan bagian database dan fallback notifikasi. Native AlarmManager menjadi tahap APK berikutnya.

CARA PASANG
-----------
Upload semua 5 file utama ke root repository:
WansTeknik-App/
  index.html
  style.css
  apps.js
  logo-wt.png
  logo-brand.png

Lalu buka GitHub Pages.

SUPABASE ADMIN
--------------
Buat user admin di Supabase Authentication > Users.
Jangan masukkan password admin ke apps.js.

-- WANSTEKNIK V2.2
-- Jalankan setelah schema V1 yang sudah ada.

create table if not exists public.pengajuan (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  tanggal date default current_date,
  judul text not null,
  keterangan text,
  jumlah numeric default 0,
  status text default 'menunggu',
  created_at timestamptz default now()
);

alter table public.pengajuan enable row level security;

drop policy if exists "pengajuan_admin_select" on public.pengajuan;
create policy "pengajuan_admin_select"
on public.pengajuan for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "pengajuan_admin_insert" on public.pengajuan;
create policy "pengajuan_admin_insert"
on public.pengajuan for insert
to authenticated
with check (auth.uid() = user_id);

-- Bucket arsip untuk file WansTeknik.
-- Buat bucket bernama "arsip" melalui Supabase Dashboard > Storage.
-- Jangan jadikan bucket public bila dokumen bersifat rahasia.

-- Untuk tahap berikutnya, RLS Storage akan dibuat lebih ketat berdasarkan auth.uid().

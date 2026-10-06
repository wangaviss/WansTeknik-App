-- Contoh. Ganti dengan pelanggan asli sebelum produksi.
insert into public.customers (wt_code,name,phone,address)
values ('WT-000001','Pak Anwar','081234567890','Dempo Dalam')
on conflict (wt_code) do nothing;

insert into public.service_records(customer_id,service_date,checked,problem,repair,notes,cost)
select id,'2025-01-30','AC/Split',null,'Isi Freon R22; Cuci AC Split 2 Unit; Pergantian Kapasitor','Contoh data — sesuaikan dengan rekap',280000
from public.customers where wt_code='WT-000001';

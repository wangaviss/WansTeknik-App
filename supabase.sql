-- WansTeknik customer portal
create extension if not exists pgcrypto;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  wt_code text not null unique,
  name text not null,
  phone text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_records (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  service_date date not null,
  checked text,
  problem text,
  repair text,
  notes text,
  cost numeric(14,2) default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customers_phone on public.customers(phone);
create index if not exists idx_service_customer_date on public.service_records(customer_id, service_date desc);

alter table public.customers enable row level security;
alter table public.service_records enable row level security;

-- Customer frontend never gets direct table access.
revoke all on public.customers from anon, authenticated;
revoke all on public.service_records from anon, authenticated;

-- Admin users can manage records.
create policy "admin read customers" on public.customers for select to authenticated
using (auth.role() = 'authenticated');

create policy "admin insert customers" on public.customers for insert to authenticated
with check (auth.role() = 'authenticated');

create policy "admin update customers" on public.customers for update to authenticated
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "admin read services" on public.service_records for select to authenticated
using (auth.role() = 'authenticated');

create policy "admin insert services" on public.service_records for insert to authenticated
with check (auth.role() = 'authenticated');

create policy "admin update services" on public.service_records for update to authenticated
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "admin delete services" on public.service_records for delete to authenticated
using (auth.role() = 'authenticated');

-- Public customer lookup.
-- SECURITY DEFINER is intentionally limited to matching phone + WT code.
create or replace function public.customer_service_history(p_phone text, p_code text)
returns table (
  customer_name text,
  customer_address text,
  wt_code text,
  service_date date,
  checked text,
  problem text,
  repair text,
  notes text,
  cost numeric
)
language sql
security definer
set search_path = public
as $$
  select c.name, c.address, c.wt_code,
         s.service_date, s.checked, s.problem, s.repair, s.notes, s.cost
  from public.customers c
  join public.service_records s on s.customer_id = c.id
  where c.phone = regexp_replace(p_phone, '[^0-9]', '', 'g')
    and upper(c.wt_code) = upper(trim(p_code))
  order by s.service_date desc, s.created_at desc;
$$;

revoke all on function public.customer_service_history(text,text) from public;
grant execute on function public.customer_service_history(text,text) to anon, authenticated;

-- Normalize stored phone values on insert/update.
create or replace function public.normalize_customer_phone()
returns trigger language plpgsql as $$
begin
  if new.phone is not null then
    new.phone := regexp_replace(new.phone, '[^0-9]', '', 'g');
  end if;
  new.wt_code := upper(trim(new.wt_code));
  return new;
end $$;

drop trigger if exists trg_normalize_customer on public.customers;
create trigger trg_normalize_customer
before insert or update on public.customers
for each row execute function public.normalize_customer_phone();

-- Optional: make sure WT code format is consistent.
alter table public.customers
  drop constraint if exists wt_code_format;
alter table public.customers
  add constraint wt_code_format check (wt_code ~ '^WT-[0-9]{6}$');

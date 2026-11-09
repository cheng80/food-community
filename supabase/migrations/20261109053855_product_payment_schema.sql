create table public.product (
  id uuid primary key default gen_random_uuid(),
  name text not null check (btrim(name) <> ''),
  description text not null,
  event_at timestamptz not null,
  address text not null check (btrim(address) <> ''),
  capacity integer not null check (capacity > 0),
  price integer not null check (price >= 0),
  publication_status text not null default 'DRAFT'
    check (publication_status in ('DRAFT', 'PUBLIC', 'HIDDEN', 'ARCHIVED')),
  cancel_policy text not null,
  sponsor_disclosure text not null,
  created_at timestamptz not null default now()
);

create table public.product_image (
  product_id uuid not null references public.product(id) on delete restrict,
  variant text not null check (variant in ('banner_mobile', 'banner_desktop', 'hero_mobile', 'hero_desktop')),
  image_path text not null check (btrim(image_path) <> '' and image_path !~ '(^/|://|(^|/)\.\.?(/|$))'),
  primary key (product_id, variant)
);

create table public.payment_snapshot (
  id uuid primary key default gen_random_uuid(),
  payment_snapshot jsonb not null check (jsonb_typeof(payment_snapshot) = 'object'),
  product_snapshot jsonb not null check (jsonb_typeof(product_snapshot) = 'object'),
  created_at timestamptz not null default now()
);

create table public.payment (
  id uuid primary key default gen_random_uuid(),
  transaction_key text not null check (btrim(transaction_key) <> ''),
  provider_event_key text not null unique check (btrim(provider_event_key) <> ''),
  status text not null,
  amount integer not null,
  product_id uuid not null references public.product(id) on delete restrict,
  user_id uuid not null references public.profile(user_id) on delete restrict,
  payment_snapshot_id uuid not null unique references public.payment_snapshot(id) on delete restrict,
  created_at timestamptz not null default now(),
  check ((status = 'PAID' and amount > 0) or (status = 'CANCELLED' and amount < 0))
);
create index payment_transaction_key_idx on public.payment(transaction_key);
create unique index payment_one_approval_per_transaction_idx on public.payment(transaction_key) where status = 'PAID';
create index payment_product_id_idx on public.payment(product_id);
create index payment_user_id_idx on public.payment(user_id, created_at desc);

-- 이력과 스냅샷은 관리자 SQL에서도 덮어쓰지 않는다.
create function public.reject_payment_history_mutation() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'Payment history is append-only' using errcode = '55000';
end;
$$;
revoke execute on function public.reject_payment_history_mutation() from public, anon, authenticated, service_role;
create trigger payment_append_only before update or delete or truncate on public.payment
  for each statement execute function public.reject_payment_history_mutation();
create trigger payment_snapshot_append_only before update or delete or truncate on public.payment_snapshot
  for each statement execute function public.reject_payment_history_mutation();

alter table public.product enable row level security;
alter table public.product_image enable row level security;
alter table public.payment_snapshot enable row level security;
alter table public.payment enable row level security;

revoke all on public.product, public.product_image, public.payment_snapshot, public.payment
  from public, anon, authenticated, service_role;
grant select on public.product, public.product_image to anon, authenticated;
grant select on public.payment_snapshot, public.payment to authenticated;
grant select, insert, update on public.product, public.product_image to service_role;
grant select, insert on public.payment_snapshot, public.payment to service_role;

create policy product_read_public on public.product
  for select to anon, authenticated using (publication_status = 'PUBLIC');
create policy product_image_read_public on public.product_image
  for select to anon, authenticated using (
    exists (select 1 from public.product p where p.id = product_id and p.publication_status = 'PUBLIC')
  );
create policy payment_read_own on public.payment
  for select to authenticated using (user_id = (select auth.uid()));
create policy payment_snapshot_read_own on public.payment_snapshot
  for select to authenticated using (
    exists (select 1 from public.payment p where p.payment_snapshot_id = payment_snapshot.id and p.user_id = (select auth.uid()))
  );

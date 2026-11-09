create table public.payment_checkout (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.product(id) on delete restrict,
  user_id uuid not null references public.profile(user_id) on delete cascade,
  amount integer not null check (amount > 0),
  product_snapshot jsonb not null check (jsonb_typeof(product_snapshot) = 'object'),
  created_at timestamptz not null default now()
);
create index payment_checkout_user_id_idx on public.payment_checkout(user_id);
create index payment_checkout_product_id_idx on public.payment_checkout(product_id);
alter table public.payment_checkout enable row level security;
revoke all on public.payment_checkout from public, anon, authenticated, service_role;
grant select, insert, update on public.payment_checkout to service_role;

-- 행 잠금은 같은 결제의 승인 확인 요청을 직렬화한다.
create function public.record_portone_payment(p_checkout_id uuid, p_user_id uuid, p_paid_at timestamptz)
returns uuid language plpgsql set search_path = '' as $$
declare
  checkout public.payment_checkout%rowtype;
  snapshot_id uuid;
  event_id uuid;
begin
  select * into strict checkout from public.payment_checkout
  where id = p_checkout_id and user_id = p_user_id for update;

  select id into event_id from public.payment
  where transaction_key = checkout.id::text and status = 'PAID'
    and user_id = checkout.user_id and product_id = checkout.product_id;
  if found then return event_id; end if;

  insert into public.payment_snapshot (payment_snapshot, product_snapshot)
  values (jsonb_build_object('provider', 'PORTONE', 'environment', 'TEST', 'payMethod', 'CARD', 'paidAt', p_paid_at),
    checkout.product_snapshot)
  returning id into snapshot_id;
  insert into public.payment (transaction_key, provider_event_key, status, amount, product_id, user_id, payment_snapshot_id)
  values (checkout.id::text, 'portone:paid:' || checkout.id::text, 'PAID', checkout.amount,
    checkout.product_id, checkout.user_id, snapshot_id)
  returning id into event_id;
  return event_id;
end;
$$;
revoke execute on function public.record_portone_payment(uuid, uuid, timestamptz)
  from public, anon, authenticated, service_role;
grant execute on function public.record_portone_payment(uuid, uuid, timestamptz) to service_role;

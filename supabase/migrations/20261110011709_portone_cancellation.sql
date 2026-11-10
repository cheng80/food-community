create function public.record_portone_cancellations(p_checkout_id uuid, p_paid_at timestamptz, p_cancellations jsonb)
returns void language plpgsql set search_path = '' as $$
declare
  checkout public.payment_checkout%rowtype;
  cancellation record;
  event_key text;
  existing public.payment%rowtype;
  balance bigint;
  snapshot_id uuid;
  approval_id uuid;
  approved_product jsonb;
begin
  -- 승인 확인과 같은 행을 잠가 두 경로의 저장 순서를 보장한다.
  select * into strict checkout from public.payment_checkout where id = p_checkout_id for update;
  if p_cancellations is null or jsonb_typeof(p_cancellations) <> 'array' then
    raise exception 'Invalid cancellations' using errcode = '22023';
  end if;
  if jsonb_array_length(p_cancellations) = 0 then
    raise exception 'Empty cancellations' using errcode = '22023';
  end if;

  select * into existing from public.payment where transaction_key = checkout.id::text and status = 'PAID';
  if not found then
    if p_paid_at is null then raise exception 'Missing approval time' using errcode = '22023'; end if;
    approval_id := public.record_portone_payment(checkout.id, checkout.user_id, p_paid_at);
  else
    if existing.user_id <> checkout.user_id or existing.product_id <> checkout.product_id or existing.amount <> checkout.amount then
      raise exception 'Approval conflicts with checkout' using errcode = '23514';
    end if;
    approval_id := existing.id;
  end if;

  select s.product_snapshot into strict approved_product
  from public.payment p join public.payment_snapshot s on s.id = p.payment_snapshot_id where p.id = approval_id;

  select sum(amount) into balance from public.payment
  where transaction_key = checkout.id::text and user_id = checkout.user_id and product_id = checkout.product_id;

  for cancellation in
    select * from jsonb_to_recordset(p_cancellations) as c(id text, amount integer, cancelled_at timestamptz)
  loop
    if cancellation.id is null or btrim(cancellation.id) = '' or cancellation.amount is null or cancellation.amount <= 0 then
      raise exception 'Invalid cancellation' using errcode = '22023';
    end if;
    event_key := 'portone:cancel:' || checkout.id::text || ':' || cancellation.id;
    select * into existing from public.payment where provider_event_key = event_key;
    if found then
      if existing.transaction_key <> checkout.id::text or existing.status <> 'CANCELLED'
        or existing.amount <> -cancellation.amount or existing.user_id <> checkout.user_id
        or existing.product_id <> checkout.product_id then
        raise exception 'Cancellation conflicts with history' using errcode = '23514';
      end if;
      continue;
    end if;
    if cancellation.amount > balance then
      raise exception 'Cancellation exceeds remaining amount' using errcode = '23514';
    end if;

    insert into public.payment_snapshot (payment_snapshot, product_snapshot)
    values (jsonb_build_object('provider', 'PORTONE', 'environment', 'TEST', 'payMethod', 'CARD',
      'cancelledAt', cancellation.cancelled_at), approved_product)
    returning id into snapshot_id;

    insert into public.payment (transaction_key, provider_event_key, status, amount, product_id, user_id, payment_snapshot_id)
    values (checkout.id::text, event_key, 'CANCELLED', -cancellation.amount, checkout.product_id, checkout.user_id, snapshot_id);
    balance := balance - cancellation.amount;
  end loop;
end;
$$;
revoke execute on function public.record_portone_cancellations(uuid, timestamptz, jsonb)
  from public, anon, authenticated, service_role;
grant execute on function public.record_portone_cancellations(uuid, timestamptz, jsonb) to service_role;

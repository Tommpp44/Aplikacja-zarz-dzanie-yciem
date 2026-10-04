-- Personal finance: accounts, categories, transactions, budgets, recurring transactions.
--
-- Source of truth for balances:
--   balance = accounts.opening_balance_minor + signed sum of non-deleted transactions
-- exposed through the account_balances view. Balances are never stored separately,
-- so they can never drift from the transaction history. Corrections are recorded
-- explicitly as 'adjustment' transactions (signed amount), which documents why a
-- balance differs from the plain income/expense history.

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  account_type text not null default 'checking'
    check (account_type in ('checking', 'savings', 'cash', 'credit_card', 'investment', 'loan', 'other')),
  currency char(3) not null default 'PLN' check (currency ~ '^[A-Z]{3}$'),
  opening_balance_minor bigint not null default 0,
  institution text check (institution is null or char_length(institution) <= 80),
  color text not null default 'slate' check (char_length(color) <= 32),
  active boolean not null default true,
  include_in_net_worth boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);
create index accounts_user_idx on public.accounts (user_id, position);
select public.attach_updated_at('public.accounts');

create table public.transaction_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  kind text not null check (kind in ('expense', 'income')),
  color text not null default 'slate' check (char_length(color) <= 32),
  icon text check (icon is null or char_length(icon) <= 40),
  position integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, kind, name)
);
select public.attach_updated_at('public.transaction_categories');

create table public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  account_id uuid not null,
  txn_type text not null check (txn_type in ('income', 'expense', 'transfer')),
  amount_minor bigint not null check (amount_minor > 0),
  category_id uuid,
  transfer_account_id uuid,
  merchant text check (merchant is null or char_length(merchant) <= 120),
  description text check (description is null or char_length(description) <= 500),
  repeat_rule jsonb not null check (jsonb_typeof(repeat_rule) = 'object'),
  next_date date not null,
  end_date date,
  auto_post boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (account_id, user_id) references public.accounts (id, user_id) on delete cascade,
  foreign key (transfer_account_id, user_id) references public.accounts (id, user_id) on delete cascade,
  foreign key (category_id, user_id) references public.transaction_categories (id, user_id) on delete set null (category_id),
  check ((txn_type = 'transfer') = (transfer_account_id is not null)),
  check (transfer_account_id is null or transfer_account_id <> account_id),
  check (end_date is null or end_date >= next_date)
);
create index recurring_transactions_user_next_idx on public.recurring_transactions (user_id, next_date) where active;
select public.attach_updated_at('public.recurring_transactions');

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  account_id uuid not null,
  txn_type text not null check (txn_type in ('income', 'expense', 'transfer', 'adjustment')),
  -- Positive for income/expense/transfer; signed for adjustment.
  amount_minor bigint not null,
  -- Always equal to the account currency (enforced by trigger, never trusted from client).
  currency char(3) not null default 'PLN' check (currency ~ '^[A-Z]{3}$'),
  occurred_on date not null default current_date,
  category_id uuid,
  merchant text check (merchant is null or char_length(merchant) <= 120),
  description text check (description is null or char_length(description) <= 500),
  tags text[] not null default '{}',
  transfer_account_id uuid,
  -- Amount credited to the destination account (differs only across currencies).
  transfer_amount_minor bigint check (transfer_amount_minor is null or transfer_amount_minor > 0),
  recurring_id uuid,
  source text not null default 'manual' check (source in ('manual', 'import', 'recurring', 'ai', 'api')),
  created_by uuid default auth.uid(),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (account_id, user_id) references public.accounts (id, user_id) on delete cascade,
  foreign key (transfer_account_id, user_id) references public.accounts (id, user_id) on delete cascade,
  foreign key (category_id, user_id) references public.transaction_categories (id, user_id) on delete set null (category_id),
  foreign key (recurring_id, user_id) references public.recurring_transactions (id, user_id) on delete set null (recurring_id),
  check (
    (txn_type = 'adjustment' and amount_minor <> 0)
    or (txn_type <> 'adjustment' and amount_minor > 0)
  ),
  check ((txn_type = 'transfer') = (transfer_account_id is not null)),
  check (transfer_account_id is null or transfer_account_id <> account_id),
  check (category_id is null or txn_type in ('income', 'expense')),
  check (cardinality(tags) <= 20)
);
create index transactions_user_date_idx on public.transactions (user_id, occurred_on desc, created_at desc) where deleted_at is null;
create index transactions_account_idx on public.transactions (account_id) where deleted_at is null;
create index transactions_transfer_account_idx on public.transactions (transfer_account_id) where transfer_account_id is not null;
create index transactions_category_idx on public.transactions (category_id);
create index transactions_recurring_idx on public.transactions (recurring_id) where recurring_id is not null;
create index transactions_merchant_trgm_idx on public.transactions using gin (merchant extensions.gin_trgm_ops);
select public.attach_updated_at('public.transactions');

-- Currency comes from the account; category kind must match the transaction type.
create or replace function public.transactions_enforce_integrity()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_currency char(3);
  v_dest_currency char(3);
  v_kind text;
begin
  select currency into v_currency from public.accounts where id = new.account_id;
  new.currency := v_currency;

  if new.txn_type = 'transfer' then
    select currency into v_dest_currency from public.accounts where id = new.transfer_account_id;
    if v_dest_currency = v_currency then
      new.transfer_amount_minor := new.amount_minor;
    elsif new.transfer_amount_minor is null then
      raise exception 'Cross-currency transfers require transfer_amount_minor' using errcode = '23514';
    end if;
  else
    new.transfer_amount_minor := null;
  end if;

  if new.category_id is not null then
    select kind into v_kind from public.transaction_categories where id = new.category_id;
    if v_kind is distinct from new.txn_type then
      raise exception 'Category kind does not match transaction type' using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

create trigger transactions_enforce_integrity
before insert or update on public.transactions
for each row execute function public.transactions_enforce_integrity();

-- Balance view (security_invoker so RLS of the caller applies).
create view public.account_balances
with (security_invoker = true)
as
select
  a.id as account_id,
  a.user_id,
  a.currency,
  a.opening_balance_minor
    + coalesce((
        select sum(
          case
            when t.account_id = a.id and t.txn_type = 'income' then t.amount_minor
            when t.account_id = a.id and t.txn_type = 'expense' then -t.amount_minor
            when t.account_id = a.id and t.txn_type = 'adjustment' then t.amount_minor
            when t.account_id = a.id and t.txn_type = 'transfer' then -t.amount_minor
            when t.transfer_account_id = a.id and t.txn_type = 'transfer' then t.transfer_amount_minor
            else 0
          end
        )
        from public.transactions t
        where (t.account_id = a.id or t.transfer_account_id = a.id)
          and t.deleted_at is null
      ), 0)::bigint as balance_minor
from public.accounts a;

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  amount_minor bigint not null check (amount_minor > 0),
  currency char(3) not null default 'PLN' check (currency ~ '^[A-Z]{3}$'),
  period text not null default 'monthly' check (period in ('monthly')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);
select public.attach_updated_at('public.budgets');

create table public.budget_categories (
  budget_id uuid not null,
  category_id uuid not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (budget_id, category_id),
  foreign key (budget_id, user_id) references public.budgets (id, user_id) on delete cascade,
  foreign key (category_id, user_id) references public.transaction_categories (id, user_id) on delete cascade
);
create index budget_categories_category_idx on public.budget_categories (category_id);

-- Audit financial operations.
create trigger audit_accounts after insert or update or delete on public.accounts
for each row execute function public.write_audit_log();
create trigger audit_transactions after insert or update or delete on public.transactions
for each row execute function public.write_audit_log();
create trigger audit_budgets after insert or update or delete on public.budgets
for each row execute function public.write_audit_log();
create trigger audit_recurring_transactions after insert or update or delete on public.recurring_transactions
for each row execute function public.write_audit_log();

-- Row Level Security tests: users can never read, modify or reference other
-- users' data. Run with `npx supabase test db` (uses pgTAP, local stack only).
begin;
create extension if not exists pgtap with schema extensions;
select plan(23);

-- Two users (the bootstrap trigger creates profiles, preferences, categories).
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'alice@test.local', '{"display_name":"Alice"}'),
  ('22222222-2222-2222-2222-222222222222', 'bob@test.local', '{"display_name":"Bob"}');

select is((select count(*)::int from public.transaction_categories where user_id = '11111111-1111-1111-1111-111111111111'), 16, 'new users get default categories');

-- Alice creates data
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

insert into public.projects (id, name) values ('aaaaaaaa-0000-0000-0000-000000000001', 'Alice project');
insert into public.tasks (id, title, project_id) values ('aaaaaaaa-0000-0000-0000-000000000002', 'Alice task', 'aaaaaaaa-0000-0000-0000-000000000001');
insert into public.accounts (id, name, currency, opening_balance_minor) values ('aaaaaaaa-0000-0000-0000-000000000003', 'Alice bank', 'PLN', 100000);
insert into public.transactions (account_id, txn_type, amount_minor, currency) values ('aaaaaaaa-0000-0000-0000-000000000003', 'expense', 5400, 'EUR');

select is((select count(*)::int from public.tasks), 1, 'alice sees her task');
select is((select currency from public.transactions limit 1), 'PLN', 'transaction currency comes from the account, not the client');
select is((select balance_minor from public.account_balances where account_id = 'aaaaaaaa-0000-0000-0000-000000000003'), 94600::bigint, 'balance is derived from opening balance and transactions');
select is((select count(*)::int from public.audit_log where entity_type = 'transactions'), 1, 'financial operations are audited');

-- Bob cannot see or touch Alice's data
set local request.jwt.claims to '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

select is((select count(*)::int from public.tasks), 0, 'bob cannot read alice tasks');
select is((select count(*)::int from public.projects), 0, 'bob cannot read alice projects');
select is((select count(*)::int from public.transactions), 0, 'bob cannot read alice transactions');
select is((select count(*)::int from public.account_balances), 0, 'bob cannot read alice balances through the view');
select is((select count(*)::int from public.profiles), 1, 'bob only sees his own profile');
select is((select count(*)::int from public.audit_log), 0, 'bob cannot read alice audit log');

update public.tasks set title = 'hacked' where id = 'aaaaaaaa-0000-0000-0000-000000000002';
delete from public.projects where id = 'aaaaaaaa-0000-0000-0000-000000000001';

select throws_ok(
  $$ insert into public.tasks (title, user_id) values ('spoof', '11111111-1111-1111-1111-111111111111') $$,
  '42501', null, 'bob cannot insert rows owned by alice'
);
select throws_ok(
  $$ insert into public.tasks (title, project_id) values ('link', 'aaaaaaaa-0000-0000-0000-000000000001') $$,
  '23503', null, 'bob cannot link his task to alice project (composite FK)'
);
select throws_ok(
  $$ insert into public.transactions (account_id, txn_type, amount_minor) values ('aaaaaaaa-0000-0000-0000-000000000003', 'income', 100) $$,
  '23503', null, 'bob cannot post into alice account'
);
select throws_ok(
  $$ update public.profiles set role = 'admin' where id = '22222222-2222-2222-2222-222222222222' $$,
  '42501', null, 'users cannot make themselves admin'
);
select throws_ok(
  $$ insert into public.audit_log (user_id, action, entity_type) values ('22222222-2222-2222-2222-222222222222', 'insert', 'x') $$,
  '42501', null, 'users cannot forge audit entries'
);

-- Back to Alice: her data is intact
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select is((select title from public.tasks where id = 'aaaaaaaa-0000-0000-0000-000000000002'), 'Alice task', 'bob could not modify alice task');
select is((select count(*)::int from public.projects), 1, 'bob could not delete alice project');

-- New users get their interface language and localized default categories.
reset role;
insert into auth.users (id, email, raw_user_meta_data) values
  ('33333333-3333-3333-3333-333333333333', 'ola@test.local', '{"display_name":"Ola","language":"pl"}'),
  ('44444444-4444-4444-4444-444444444444', 'eve@test.local', '{"language":"xx"}');
select is((select language from public.user_preferences where user_id = '33333333-3333-3333-3333-333333333333'), 'pl', 'polish sign-up stores the language');
select ok(exists(select 1 from public.transaction_categories where user_id = '33333333-3333-3333-3333-333333333333' and name = 'Jedzenie'), 'polish users get polish category names');
select is((select language from public.user_preferences where user_id = '44444444-4444-4444-4444-444444444444'), 'en', 'unknown languages fall back to english');

-- Push subscriptions are private to their owner.
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
insert into public.push_subscriptions (endpoint, p256dh, auth)
  values ('https://push.example.com/alice', 'p256dh-key-alice', 'auth-alice');
set local request.jwt.claims to '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select is((select count(*)::int from public.push_subscriptions), 0, 'bob cannot see alice push subscriptions');
select throws_ok(
  $$insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
    values ('11111111-1111-1111-1111-111111111111', 'https://push.example.com/x', 'p256dh-key-x', 'auth-xxxx')$$,
  '42501', null, 'bob cannot register a device for alice');

select * from finish();
rollback;

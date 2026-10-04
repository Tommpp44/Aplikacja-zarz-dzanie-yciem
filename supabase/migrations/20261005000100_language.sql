-- Interface language (English / Polish). New users get it from sign-up
-- metadata, and their default life areas and categories are named in it.

alter table public.user_preferences
  add column language text not null default 'en' check (language in ('en', 'pl'));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tz text := new.raw_user_meta_data ->> 'timezone';
  v_name text := nullif(trim(new.raw_user_meta_data ->> 'display_name'), '');
  v_lang text := coalesce(new.raw_user_meta_data ->> 'language', 'en');
  v_pl boolean;
begin
  if v_tz is null or not public.is_valid_timezone(v_tz) then
    v_tz := 'UTC';
  end if;
  if v_lang not in ('en', 'pl') then
    v_lang := 'en';
  end if;
  v_pl := v_lang = 'pl';

  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, left(coalesce(v_name, split_part(coalesce(new.email, ''), '@', 1)), 80));

  insert into public.user_preferences (user_id, timezone, language)
  values (new.id, v_tz, v_lang);

  insert into public.life_areas (user_id, name, color, icon, position) values
    (new.id, case when v_pl then 'Finanse' else 'Finance' end, 'emerald', 'wallet', 0),
    (new.id, case when v_pl then 'Kariera' else 'Career' end, 'blue', 'briefcase', 1),
    (new.id, case when v_pl then 'Zdrowie' else 'Health' end, 'rose', 'heart-pulse', 2),
    (new.id, case when v_pl then 'Sport' else 'Fitness' end, 'orange', 'dumbbell', 3),
    (new.id, case when v_pl then 'Nauka' else 'Learning' end, 'violet', 'graduation-cap', 4),
    (new.id, case when v_pl then 'Relacje' else 'Relationships' end, 'pink', 'users', 5),
    (new.id, case when v_pl then 'Dom' else 'Home' end, 'amber', 'home', 6),
    (new.id, case when v_pl then 'Podróże' else 'Travel' end, 'cyan', 'plane', 7),
    (new.id, case when v_pl then 'Osobiste' else 'Personal' end, 'slate', 'user', 8);

  insert into public.transaction_categories (user_id, name, kind, color, icon, position) values
    (new.id, case when v_pl then 'Mieszkanie' else 'Housing' end, 'expense', 'blue', 'home', 0),
    (new.id, case when v_pl then 'Jedzenie' else 'Food' end, 'expense', 'emerald', 'utensils', 1),
    (new.id, case when v_pl then 'Transport' else 'Transport' end, 'expense', 'amber', 'car', 2),
    (new.id, case when v_pl then 'Zdrowie' else 'Health' end, 'expense', 'rose', 'heart-pulse', 3),
    (new.id, case when v_pl then 'Rozrywka' else 'Entertainment' end, 'expense', 'violet', 'clapperboard', 4),
    (new.id, case when v_pl then 'Zakupy' else 'Shopping' end, 'expense', 'pink', 'shopping-bag', 5),
    (new.id, case when v_pl then 'Podróże' else 'Travel' end, 'expense', 'cyan', 'plane', 6),
    (new.id, case when v_pl then 'Edukacja' else 'Education' end, 'expense', 'indigo', 'graduation-cap', 7),
    (new.id, case when v_pl then 'Subskrypcje' else 'Subscriptions' end, 'expense', 'orange', 'repeat', 8),
    (new.id, case when v_pl then 'Rachunki' else 'Utilities' end, 'expense', 'teal', 'plug', 9),
    (new.id, case when v_pl then 'Inne' else 'Other' end, 'expense', 'slate', 'circle', 10),
    (new.id, case when v_pl then 'Wynagrodzenie' else 'Salary' end, 'income', 'emerald', 'briefcase', 0),
    (new.id, case when v_pl then 'Zlecenia' else 'Freelance' end, 'income', 'blue', 'laptop', 1),
    (new.id, case when v_pl then 'Inwestycje' else 'Investments' end, 'income', 'violet', 'trending-up', 2),
    (new.id, case when v_pl then 'Prezenty' else 'Gifts' end, 'income', 'pink', 'gift', 3),
    (new.id, case when v_pl then 'Inne przychody' else 'Other income' end, 'income', 'slate', 'circle', 4);

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

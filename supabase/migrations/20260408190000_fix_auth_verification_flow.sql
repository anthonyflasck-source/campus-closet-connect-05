-- Keep profile verification in sync with real Supabase email confirmation state.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, verification_status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    case
      when new.email like '%.edu' and new.email_confirmed_at is not null then 'verified'
      when new.email like '%.edu' then 'pending'
      else 'unverified'
    end
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    email = excluded.email,
    verification_status = excluded.verification_status;

  return new;
end;
$$;

create or replace function public.sync_profile_verification_status_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set
    email = new.email,
    verification_status = case
      when new.email like '%.edu' and new.email_confirmed_at is not null then 'verified'
      when new.email like '%.edu' then 'pending'
      else 'unverified'
    end
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_updated_sync_profile on auth.users;

create trigger on_auth_user_updated_sync_profile
after update of email, email_confirmed_at on auth.users
for each row
execute function public.sync_profile_verification_status_from_auth();

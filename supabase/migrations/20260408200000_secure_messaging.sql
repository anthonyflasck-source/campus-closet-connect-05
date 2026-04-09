create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.dresses(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  constraint conversations_unique_participants_per_listing unique (listing_id, buyer_id, seller_id),
  constraint conversations_distinct_participants check (buyer_id <> seller_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint messages_body_not_blank check (char_length(btrim(body)) > 0),
  constraint messages_body_length check (char_length(body) <= 2000)
);

create index if not exists conversations_buyer_id_idx on public.conversations (buyer_id);
create index if not exists conversations_seller_id_idx on public.conversations (seller_id);
create index if not exists conversations_listing_id_idx on public.conversations (listing_id);
create index if not exists conversations_last_message_at_idx on public.conversations (last_message_at desc);
create index if not exists messages_conversation_id_created_at_idx on public.messages (conversation_id, created_at);
create index if not exists messages_sender_id_idx on public.messages (sender_id);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create or replace function public.is_verified_profile(check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = check_user_id
      and verification_status = 'verified'
  );
$$;

create or replace function public.touch_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set
    updated_at = now(),
    last_message_at = new.created_at
  where id = new.conversation_id;

  return new;
end;
$$;

drop trigger if exists conversations_updated_at on public.conversations;
create trigger conversations_updated_at
before update on public.conversations
for each row execute function public.update_updated_at();

drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation
after insert on public.messages
for each row execute function public.touch_conversation_on_message();

drop policy if exists "Participants can view conversations" on public.conversations;
create policy "Participants can view conversations"
  on public.conversations
  for select
  to authenticated
  using (
    public.is_verified_profile(auth.uid())
    and (auth.uid() = buyer_id or auth.uid() = seller_id)
  );

drop policy if exists "Verified buyers can create conversations" on public.conversations;
create policy "Verified buyers can create conversations"
  on public.conversations
  for insert
  to authenticated
  with check (
    auth.uid() = buyer_id
    and public.is_verified_profile(auth.uid())
    and exists (
      select 1
      from public.dresses d
      where d.id = listing_id
        and d.owner_id = seller_id
        and d.owner_id <> buyer_id
    )
    and exists (
      select 1
      from public.profiles p
      where p.id = seller_id
        and p.verification_status = 'verified'
    )
  );

drop policy if exists "Participants can view messages" on public.messages;
create policy "Participants can view messages"
  on public.messages
  for select
  to authenticated
  using (
    public.is_verified_profile(auth.uid())
    and exists (
      select 1
      from public.conversations c
      where c.id = conversation_id
        and (auth.uid() = c.buyer_id or auth.uid() = c.seller_id)
    )
  );

drop policy if exists "Participants can send messages" on public.messages;
create policy "Participants can send messages"
  on public.messages
  for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and public.is_verified_profile(auth.uid())
    and exists (
      select 1
      from public.conversations c
      where c.id = conversation_id
        and (auth.uid() = c.buyer_id or auth.uid() = c.seller_id)
    )
  );

alter table public.conversations replica identity full;
alter table public.messages replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'conversations'
  ) then
    alter publication supabase_realtime add table public.conversations;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end
$$;

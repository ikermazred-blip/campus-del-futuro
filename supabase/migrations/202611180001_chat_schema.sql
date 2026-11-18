create extension if not exists pgcrypto;

create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  agent_id text not null,
  agent_mode text not null,
  title text not null default 'Nueva conversación',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 16000),
  created_at timestamptz not null default now()
);

create index if not exists chat_conversations_owner_updated on public.chat_conversations(user_id, updated_at desc);
create index if not exists chat_messages_conversation_created on public.chat_messages(conversation_id, created_at asc);

alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;

create policy "Users read their conversations" on public.chat_conversations for select to authenticated using (auth.uid() = user_id);
create policy "Users create their conversations" on public.chat_conversations for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update their conversations" on public.chat_conversations for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete their conversations" on public.chat_conversations for delete to authenticated using (auth.uid() = user_id);
create policy "Users read their messages" on public.chat_messages for select to authenticated using (auth.uid() = user_id);
create policy "Users create their messages" on public.chat_messages for insert to authenticated with check (auth.uid() = user_id);
create policy "Users delete their messages" on public.chat_messages for delete to authenticated using (auth.uid() = user_id);

grant select, insert, update, delete on public.chat_conversations to authenticated;
grant select, insert, delete on public.chat_messages to authenticated;

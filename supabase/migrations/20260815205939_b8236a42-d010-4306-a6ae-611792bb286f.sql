create table if not exists public.multicap_dados (
  codigo text primary key,
  dados jsonb not null default '{}'::jsonb,
  atualizado_por text,
  atualizado_em timestamptz not null default now()
);

grant select, insert, update on public.multicap_dados to anon;
grant all on public.multicap_dados to service_role;

create or replace function public.multicap_dados_set_atualizado_em()
returns trigger as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists multicap_dados_atualizado_em on public.multicap_dados;
create trigger multicap_dados_atualizado_em
  before update on public.multicap_dados
  for each row execute function public.multicap_dados_set_atualizado_em();

alter table public.multicap_dados enable row level security;

drop policy if exists "multicap_dados_select" on public.multicap_dados;
create policy "multicap_dados_select" on public.multicap_dados
  for select using (true);

drop policy if exists "multicap_dados_insert" on public.multicap_dados;
create policy "multicap_dados_insert" on public.multicap_dados
  for insert with check (true);

drop policy if exists "multicap_dados_update" on public.multicap_dados;
create policy "multicap_dados_update" on public.multicap_dados
  for update using (true) with check (true);

alter publication supabase_realtime add table public.multicap_dados;
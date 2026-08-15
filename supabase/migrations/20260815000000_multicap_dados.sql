-- Tabela que guarda todos os dados do app, um registro por "código de acesso"
-- (o mesmo código digitado na tela de entrada). É assim que os mesmos dados
-- aparecem em qualquer aparelho que entre com o mesmo código.
create table if not exists public.multicap_dados (
  codigo text primary key,
  dados jsonb not null default '{}'::jsonb,
  atualizado_por text,
  atualizado_em timestamptz not null default now()
);

-- Mantém "atualizado_em" sempre correto, mesmo se algo gravar sem setá-lo.
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

-- O app não usa login de usuário do Supabase — o "código de acesso" já
-- funciona como a senha do domicílio (verificada no app antes de qualquer
-- leitura/escrita). Por isso liberamos leitura/escrita para a chave pública
-- (anon), do mesmo jeito que hoje o código já protege a entrada no app.
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

-- Habilita o "tempo real": quando um aparelho salva, o outro recebe a
-- atualização na hora, sem precisar recarregar a página.
alter publication supabase_realtime add table public.multicap_dados;

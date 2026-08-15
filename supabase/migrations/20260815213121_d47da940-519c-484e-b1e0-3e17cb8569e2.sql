drop policy if exists "multicap_dados_select" on public.multicap_dados;
drop policy if exists "multicap_dados_insert" on public.multicap_dados;
drop policy if exists "multicap_dados_update" on public.multicap_dados;

revoke all on public.multicap_dados from anon;
revoke all on public.multicap_dados from authenticated;
grant all on public.multicap_dados to service_role;

alter table public.multicap_dados enable row level security;

do $$
begin
  execute 'alter publication supabase_realtime drop table public.multicap_dados';
exception when others then null;
end $$;
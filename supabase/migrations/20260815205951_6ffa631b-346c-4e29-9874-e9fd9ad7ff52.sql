create or replace function public.multicap_dados_set_atualizado_em()
returns trigger as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$ language plpgsql
set search_path = public;
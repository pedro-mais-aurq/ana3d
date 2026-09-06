-- P4: suporte a múltiplos clients (aplicações/sites) sobre a mesma infraestrutura.
--
-- Esta migration introduz `public.clients`, associa os uploads existentes ao
-- client "insight" e prepara a coluna `client_id` em `model_uploads` para ser
-- obrigatória sem quebrar dados históricos.
--
-- `model_analyses` não recebe `client_id` próprio: ela é sempre acessada em
-- relação 1:1 com um `model_uploads`, então o isolamento por client é herdado
-- via `model_upload_id` e não precisa ser duplicado.

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint clients_slug_format
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint clients_name_not_blank
    check (length(btrim(name)) > 0)
);

create trigger clients_set_updated_at
before update on public.clients
for each row
execute function public.insight_set_updated_at();

alter table public.clients enable row level security;

-- Nenhuma policy pública é criada: assim como `model_uploads` e
-- `model_analyses`, o acesso a `clients` acontece somente a partir das Edge
-- Functions com a service role. `anon` e `authenticated` continuam sem
-- nenhuma policy permissiva, portanto sem acesso de leitura ou escrita.

insert into public.clients (slug, name)
values
  ('insight', 'Insight'),
  ('ana-3d', 'Ana 3D')
on conflict (slug) do nothing;

-- Associação segura dos dados existentes do Insight ao client "insight"
-- antes de qualquer constraint NOT NULL.
alter table public.model_uploads
  add column client_id uuid references public.clients(id);

update public.model_uploads
set client_id = (select id from public.clients where slug = 'insight')
where client_id is null;

do $$
begin
  if exists (
    select 1 from public.model_uploads where client_id is null
  ) then
    raise exception using
      errcode = 'check_violation',
      message = 'P4 migration blocked: model_uploads contains rows without client_id after backfill.';
  end if;
end;
$$;

alter table public.model_uploads
  alter column client_id set not null;

create index model_uploads_client_id_idx
  on public.model_uploads (client_id);

create index model_uploads_client_id_status_idx
  on public.model_uploads (client_id, upload_status);

-- Rate limiting (`insight_rate_limits`) permanece sem `client_id`: é controle
-- de abuso por IP/rota, não dado de negócio de um client específico, e as
-- Edge Functions já isolam por IP dentro de cada scope.

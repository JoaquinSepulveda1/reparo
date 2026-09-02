-- Reparo — schema inicial
-- 2 tablas: contratos y findings. Sin multi-tenancy, sin usuarios:
-- una sola biblioteca compartida.
--
-- Aplicar con:
--   supabase db push
-- o pegando este archivo en el SQL Editor del proyecto (tier gratis).

-- gen_random_uuid() viene de pgcrypto, ya habilitada en Supabase.
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- contratos
-- ---------------------------------------------------------------------------
create table if not exists public.contratos (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  nombre_archivo  text,
  texto_original  text not null,
  texto_editado   text,
  score_general   integer,
  resumen         text,

  constraint contratos_score_general_rango
    check (score_general is null or score_general between 0 and 100)
);

comment on table public.contratos is
  'Un contrato analizado y guardado en la biblioteca. texto_editado = texto con las sugerencias aceptadas aplicadas.';

create index if not exists contratos_created_at_idx
  on public.contratos (created_at desc);

-- ---------------------------------------------------------------------------
-- findings
-- ---------------------------------------------------------------------------
create table if not exists public.findings (
  id            uuid primary key default gen_random_uuid(),
  contrato_id   uuid not null references public.contratos (id) on delete cascade,
  excerpt       text not null,
  categoria     text,
  nivel_riesgo  text,
  score_riesgo  integer,
  problema      text,
  sugerencia    text,
  aplicada      boolean not null default false,

  constraint findings_nivel_riesgo_valido
    check (nivel_riesgo is null or nivel_riesgo in ('alto', 'medio', 'bajo')),
  constraint findings_score_riesgo_rango
    check (score_riesgo is null or score_riesgo between 0 and 100)
);

comment on table public.findings is
  'Cláusula riesgosa detectada por el análisis. aplicada = el usuario aceptó la sugerencia.';

create index if not exists findings_contrato_id_idx
  on public.findings (contrato_id);

-- Para armar el digest de precedentes: findings aceptados de los contratos recientes.
create index if not exists findings_aplicada_idx
  on public.findings (contrato_id)
  where aplicada;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
-- Toda la app entra por el backend con la service role key (bypassa RLS).
-- Habilitamos RLS SIN políticas para que las keys anon/authenticated no puedan
-- leer ni escribir estas tablas vía PostgREST.
alter table public.contratos enable row level security;
alter table public.findings  enable row level security;

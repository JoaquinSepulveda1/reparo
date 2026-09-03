-- Reparo — comentarios tipo Figma sobre un contrato.
-- Anclados a un rango de caracteres de texto_original (o "general" si van sin
-- rango). Hilos de un nivel: parent_id apunta al comentario raíz.

create table if not exists public.comentarios (
  id            uuid primary key default gen_random_uuid(),
  contrato_id   uuid not null references public.contratos (id) on delete cascade,
  parent_id     uuid references public.comentarios (id) on delete cascade,
  autor_email   text not null,
  autor_nombre  text,
  cuerpo        text not null,
  rango_inicio  integer,               -- offset en texto_original; null = general
  rango_fin     integer,
  excerpt       text,                  -- snapshot del fragmento anclado
  resuelto      boolean not null default false,
  resuelto_por  text,
  created_at    timestamptz not null default now()
);

comment on table public.comentarios is
  'Comentario colaborativo sobre un contrato. Convive con los findings de la IA.';

create index if not exists comentarios_contrato_idx
  on public.comentarios (contrato_id, created_at);

-- Igual que contratos/findings: RLS ON sin políticas → solo el backend
-- (service role) lee/escribe. El browser nunca toca esta tabla directo.
alter table public.comentarios enable row level security;

-- Reparo — flujo borrador → visto bueno en contratos.
-- estado: 'borrador' (editable, se comenta) | 'aprobado' (visto bueno dado).
-- Reabrir un aprobado lo vuelve a 'borrador'.

alter table public.contratos
  add column if not exists estado text not null default 'borrador',
  add column if not exists creado_por text,
  add column if not exists aprobado_por text,
  add column if not exists aprobado_en timestamptz,
  add column if not exists actualizado_en timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'contratos_estado_valido'
  ) then
    alter table public.contratos
      add constraint contratos_estado_valido
      check (estado in ('borrador', 'aprobado'));
  end if;
end $$;

create index if not exists contratos_estado_idx
  on public.contratos (estado, created_at desc);

comment on column public.contratos.estado is
  'borrador = editable y comentable; aprobado = visto bueno dado (congelado hasta reabrir).';

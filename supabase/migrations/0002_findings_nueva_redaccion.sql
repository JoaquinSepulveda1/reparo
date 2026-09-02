-- Reparo — agrega la redacción de reemplazo por hallazgo.
-- `sugerencia` = consejo en lenguaje llano; `nueva_redaccion` = texto de
-- reemplazo redactado en lenguaje contractual, listo para insertar.

alter table public.findings
  add column if not exists nueva_redaccion text;

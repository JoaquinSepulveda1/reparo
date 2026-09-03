/** "hace 5 min" / "hace 2 h" / "ayer" / "12 sept". Sin dependencias. */
export function hace(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const seg = Math.round((Date.now() - t) / 1000);

  if (seg < 45) return "recién";
  if (seg < 90) return "hace 1 min";
  const min = Math.round(seg / 60);
  if (min < 60) return `hace ${min} min`;
  const hs = Math.round(min / 60);
  if (hs < 24) return `hace ${hs} h`;
  const dias = Math.round(hs / 24);
  if (dias === 1) return "ayer";
  if (dias < 7) return `hace ${dias} días`;

  return new Date(iso).toLocaleDateString("es-CL", { day: "2-digit", month: "short" });
}

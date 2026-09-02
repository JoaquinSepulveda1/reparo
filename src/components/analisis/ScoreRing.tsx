import { scoreColor } from "@/lib/design/tokens";

/** Círculo con el puntaje de riesgo. Reutilizado en resultado y biblioteca. */
export function ScoreRing({ score, size = 72 }: { score: number; size?: number }) {
  const color = scoreColor(score);
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-full font-serif font-semibold"
      style={{
        width: size,
        height: size,
        border: `${size >= 60 ? 2.5 : 2}px solid ${color}`,
        color,
        fontSize: size >= 60 ? 24 : 13,
      }}
    >
      {score}
    </div>
  );
}

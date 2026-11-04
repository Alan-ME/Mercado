import { useId } from 'react';

const VIEW_W = 100;

interface Point {
  x: number;
  y: number;
}

function toPoints(data: number[], height: number): Point[] {
  const min = Math.min(...data);
  const max = Math.max(...data);
  // Mismo colchón del 15% que usaba el MiniChart de fl_chart, así la curva no pega contra los bordes.
  const pad = (max - min) * 0.15 + 0.001;
  const lo = min - pad;
  const span = max + pad - lo;
  const stepX = VIEW_W / (data.length - 1);
  return data.map((v, i) => ({ x: i * stepX, y: height - ((v - lo) / span) * height }));
}

// Curva suave con controles en el punto medio horizontal: se parece al isCurved de fl_chart
// sin meter una librería de gráficos de 200 KB para dibujar una línea.
function smoothPath(pts: Point[]): string {
  return pts.reduce((d, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = pts[i - 1] as Point;
    const mx = (prev.x + p.x) / 2;
    return `${d} C ${mx} ${prev.y}, ${mx} ${p.y}, ${p.x} ${p.y}`;
  }, '');
}

// Sparkline chiquito (port de MiniChart.dart). Toma el color de `currentColor`, así que se tiñe
// con una clase de texto: text-up, text-down o text-brand-accent.
export function Sparkline({
  data,
  height,
  className,
}: {
  data: number[];
  height?: number;
  className?: string;
}) {
  const gradientId = useId();
  const h = height ?? 44;
  if (data.length < 2) return <div style={{ height: h }} className={className} />;

  const pts = toPoints(data, h);
  const line = smoothPath(pts);
  const area = `${line} L ${VIEW_W} ${h} L 0 ${h} Z`;

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${h}`}
      preserveAspectRatio="none"
      className={`w-full ${className ?? ''}`}
      style={{ height: h }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path d={line} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}


interface SparklineProps {
  values: number[];
  className?: string;
  strokeColor?: string;
}

export function Sparkline({ values, className, strokeColor = "currentColor" }: SparklineProps) {
  const width = 100;
  const height = 32;

  if (values.length < 2 || values.every((v) => v === 0)) {
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className={className} preserveAspectRatio="none">
        <line
          x1={0}
          y1={height - 2}
          x2={width}
          y2={height - 2}
          stroke={strokeColor}
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.4}
        />
      </svg>
    );
  }

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const step = width / (values.length - 1);

  const points = values
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

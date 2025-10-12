type Slice = { label: string; value: number };

export default function Donut({
  data,
  title,
  size = 140,
  thickness = 20,
  colors,
  padAngle = 2,        // espaçamento angular entre fatias (graus)
  rounded = true,      // cantos arredondados
}: {
  data: Slice[];
  title?: string;
  size?: number;
  thickness?: number;
  colors?: string[];
  padAngle?: number;
  rounded?: boolean;
}) {
  const safe = data.map((d) => ({
    label: d.label,
    value: isFinite(d.value) && d.value > 0 ? d.value : 0,
  }));
  const total = safe.reduce((s, d) => s + d.value, 0);

  const palette =
    colors && colors.length >= safe.length
      ? colors
      : ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#14B8A6", "#3B82F6"];

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 3; // margem pequena
  const C = 2 * Math.PI * r;

  // gap em pixels ao longo do traçado (convertendo graus -> arco)
  const gapDeg = Math.min(Math.max(padAngle, 0), 12);
  const gapPx = (gapDeg / 360) * C;

  // Construção das “fatias” com stroke-dasharray em <circle>
  // Cada fatia: dasharray = [comprimento_fatia - gapPx, C]
  // offset acumula o comprimento anterior + metade do gap para “fatiar” com espaçamento.
  let acc = 0;
  const slices = safe.map((s, i) => {
    const frac = total > 0 ? s.value / total : 0;
    const rawLen = frac * C;
    const segLen = Math.max(0, rawLen - gapPx); // tira o gap

    const slice = {
      label: s.label,
      value: s.value,
      color: palette[i % palette.length],
      dasharray: `${segLen} ${C}`,
      dashoffset: -(acc + gapPx / 2), // posiciona início da fatia
    };

    acc += rawLen;
    return slice;
  });

  return (
    <figure className="flex flex-col items-center gap-2">
      {title && (
        <figcaption className="text-[14px] text-gray-600">{title}</figcaption>
      )}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={title || "Donut chart"}
        style={{ overflow: "visible" }}
        shapeRendering="geometricPrecision"
      >
        {/* trilha de fundo */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={thickness}
        />

        {/* fatias com dasharray */}
        {slices.map((s, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={20}
            strokeLinecap={rounded ? "round" : "butt"}
            strokeDasharray={s.dasharray}
            strokeDashoffset={s.dashoffset}
          />
        ))}

        {/* “furo” central acima do traço para aspecto donut */}
        <circle cx={cx} cy={cy} r={r - thickness / 2} fill="white" />

        {/* total */}
        <text
          x={cx}
          y={cy - 1}
          textAnchor="middle"
          fontSize="18"
          fontWeight="600"
          fill="#111827"
        >
          {total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="12" fill="#6B7280">
          Total
        </text>
      </svg>

      {/* legenda */}
      <div className="grid grid-cols-1 gap-y-1 text-[12px] text-gray-600">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-1">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: s.color }}
            />
            <span className="truncate">{s.label}</span>
            <b className="ml-auto tabular-nums">{safe[i].value}</b>
          </div>
        ))}
      </div>
    </figure>
  );
}

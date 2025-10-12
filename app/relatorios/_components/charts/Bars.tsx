export default function Bars({
    data,
    title,
    viewWidth = 500,    // sistema de coordenadas horizontal
    barHeight = 12,
    gap = 8,
    fontSize = 16,       // ↓ fonte menor, coesa com os donuts
}: {
    data: { label: string; value: number }[];
    title?: string;
    viewWidth?: number;
    barHeight?: number;
    gap?: number;
    fontSize?: number;
}) {
    const rows = data.map(d => ({
        label: d.label,
        value: isFinite(d.value) ? Math.max(0, d.value) : 0,
    }));
    const max = Math.max(1, ...rows.map(d => d.value));

    // Pads e métricas
    const leftPad = 92;            // espaço p/ rótulo à esquerda
    const rightPad = 36;           // espaço p/ valor fora da barra
    const topPad = 12;
    const bottomPad = 14;
    const lineH = barHeight + gap;
    const viewHeight = topPad + rows.length * lineH + bottomPad; // ← ALTURA DINÂMICA
    const usableW = viewWidth - leftPad - rightPad;

    return (
        <figure className="flex flex-col items-center gap-2 w-full">
            {title && (
                <figcaption className="text-[11px] text-gray-600 text-center">
                    {title}
                </figcaption>
            )}

            {/* SVG fluido (sem criar rolagem) */}
            <svg
                className="block w-[520px] max-w-full mx-auto"  // <= cap 520px; encolhe se o card for menor
                style={{ height: "auto" }}
                viewBox={`0 0 ${viewWidth} ${viewHeight}`}
                preserveAspectRatio="xMidYMid meet"
                role="img"
                aria-label={title || "Bar chart"}
                shapeRendering="geometricPrecision"
            >
                {/* guia vertical à esquerda */}
                <line
                    x1={leftPad}
                    y1={topPad}
                    x2={leftPad}
                    y2={viewHeight - bottomPad + 2}
                    stroke="#E5E7EB"
                    strokeWidth="1"
                />

                {rows.map((d, i) => {
                    const y = topPad + i * lineH + 1;
                    const w = Math.round((d.value / max) * usableW);
                    const valueX = leftPad + w + 6; // valor sempre fora da barra

                    return (
                        <g key={i}>
                            {/* rótulo (mesma família de fonte do app) */}
                            <text
                                x={leftPad - 8}
                                y={y + barHeight * 0.78}
                                textAnchor="end"
                                fontSize={fontSize}
                                fontFamily="inherit"
                                fill="#6B7280"
                            >
                                {d.label}
                            </text>

                            {/* barra */}
                            <rect
                                x={leftPad + 1}
                                y={y}
                                width={w}
                                height={barHeight}
                                rx={6}
                                fill="#6366F1"
                            />

                            {/* valor */}
                            <text
                                x={valueX}
                                y={y + barHeight * 0.78}
                                fontSize={fontSize}
                                fontFamily="inherit"
                                fill="#374151"
                                textAnchor="start"
                            >
                                {d.value}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </figure>
    );
}

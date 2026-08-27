const PALETTE = ['#FFCC99', '#22C55E', '#1C1917', '#57534E', '#EF4444', '#D6B48A']

function polar(cx, cy, r, angle) {
  const rad = ((angle - 90) * Math.PI) / 180
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  }
}

function arcPath(cx, cy, r, start, end) {
  const s = polar(cx, cy, r, end)
  const e = polar(cx, cy, r, start)
  const large = end - start > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y} Z`
}

export default function PieChart({ slices = [] }) {
  const total = slices.reduce((sum, item) => sum + item.count, 0)

  if (!total) {
    return <p className="muted chart-empty">Belum ada data peminjaman untuk ditampilkan.</p>
  }

  let angle = 0
  const arcs = slices.map((slice, index) => {
    const sweep = (slice.count / total) * 360
    const start = angle
    const end = angle + sweep
    angle = end
    return {
      ...slice,
      path: sweep >= 359.99
        ? `M ${100} ${18} A 82 82 0 1 1 99.99 18 Z`
        : arcPath(100, 100, 82, start, end),
      color: PALETTE[index % PALETTE.length],
    }
  })

  return (
    <div className="pie-wrap">
      <svg viewBox="0 0 200 200" className="pie" role="img" aria-label="Grafik kategori peminjaman">
        {arcs.map((arc) => (
          <path key={arc.name} d={arc.path} fill={arc.color} />
        ))}
        <circle cx="100" cy="100" r="42" fill="#FFFFFF" />
      </svg>
      <ul className="pie-legend">
        {arcs.map((arc) => (
          <li key={arc.name}>
            <span className="swatch" style={{ background: arc.color }} />
            {arc.name} ({arc.count})
          </li>
        ))}
      </ul>
    </div>
  )
}

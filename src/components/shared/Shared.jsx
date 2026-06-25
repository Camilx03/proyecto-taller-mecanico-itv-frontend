// ─── ErrorMsg ──
export function ErrorMsg({ msg }) {
  if (!msg) return null
  return <div className="error"><span>⚠</span><span>{msg}</span></div>
}

// ─── Spinner ──
export function Spinner() {
  return <div className="spinner-wrap"><div className="spinner" /></div>
}

// ─── BadgeEstado ──
const ETIQUETAS = {
  RECIBIDO:       'Recibido',
  EN_REVISION:    'En Revisión',
  EN_REPARACION:  'En Reparación',
  LISTO:          'Listo',
  ENTREGADO:      'Entregado',
}
export function BadgeEstado({ estado }) {
  return (
    <span className={`badge badge-${estado}`}>
      {ETIQUETAS[estado] ?? estado}
    </span>
  )
}

// ─── SkeletonCard + SkeletonGrid ──
// Reemplaza al spinner en la carga inicial de listas de órdenes

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div className="skeleton" style={{ width: 40, height: 16 }} />
        <div className="skeleton" style={{ width: 80, height: 16 }} />
        <div className="skeleton" style={{ width: 70, height: 16 }} />
      </div>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 4 }}>
        <div>
          <div className="skeleton" style={{ width: 50, height: 10, marginBottom: 5 }} />
          <div className="skeleton" style={{ width: 120, height: 14 }} />
        </div>
        <div>
          <div className="skeleton" style={{ width: 50, height: 10, marginBottom: 5 }} />
          <div className="skeleton" style={{ width: 80, height: 14 }} />
        </div>
        <div>
          <div className="skeleton" style={{ width: 50, height: 10, marginBottom: 5 }} />
          <div className="skeleton" style={{ width: 100, height: 14 }} />
        </div>
      </div>
      <div className="skeleton" style={{ width: 160, height: 36, marginTop: 4, borderRadius: 6 }} />
    </div>
  )
}

export function SkeletonGrid() {
  return (
    <div className="ordenes-grid">
      {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
    </div>
  )
}

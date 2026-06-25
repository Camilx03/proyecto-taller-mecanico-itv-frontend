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

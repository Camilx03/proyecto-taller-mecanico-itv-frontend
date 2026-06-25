import { useState, useEffect, useCallback } from 'react'
import { ordenApi } from '../services/api'
import TarjetaOrden from '../components/taller/TarjetaOrden'
import { SkeletonGrid } from '../components/shared/Shared'

const TABS = [
  { id: 'RECIBIDO',      etiqueta: 'Recibidos' },
  { id: 'EN_REVISION',   etiqueta: 'En Revisión' },
  { id: 'EN_REPARACION', etiqueta: 'En Reparación' },
  { id: 'LISTO',         etiqueta: 'Listos' },
  { id: 'ENTREGADO',     etiqueta: 'Historial' },
]

const INTERVALO = 30

export default function Taller() {
  const [tabActiva, setTabActiva] = useState('RECIBIDO')
  const [ordenes, setOrdenes] = useState({
    RECIBIDO: [], EN_REVISION: [], EN_REPARACION: [], LISTO: [], ENTREGADO: [],
  })
  // Dos estados de carga separados:
  // cargandoInicial → muestra el spinner (solo la primera vez)
  // refrescando     → refresco silencioso, NO toca la UI
  const [cargandoInicial, setCargandoInicial] = useState(true)
  const [error,    setError]    = useState(null)
  const [contador, setContador] = useState(INTERVALO)

  const cargar = useCallback(async (esInicial = false) => {
    if (esInicial) setCargandoInicial(true)
    setError(null)
    try {
      const [rec, rev, rep, lis, ent] = await Promise.all([
        ordenApi.listar('RECIBIDO'),
        ordenApi.listar('EN_REVISION'),
        ordenApi.listar('EN_REPARACION'),
        ordenApi.listar('LISTO'),
        ordenApi.listar('ENTREGADO'),
      ])
      const porFecha = arr => [...arr].sort((a, b) => new Date(a.fechaEntrada) - new Date(b.fechaEntrada))
      setOrdenes({
        RECIBIDO:      porFecha(rec),
        EN_REVISION:   porFecha(rev),
        EN_REPARACION: porFecha(rep),
        LISTO:         porFecha(lis),
        ENTREGADO:     [...ent].reverse(),
      })
    } catch (e) { setError(e.message) }
    finally {
      if (esInicial) setCargandoInicial(false)
      setContador(INTERVALO)
    }
  }, [])

  useEffect(() => {
    cargar(true) // primera carga: muestra spinner

    // Refresco silencioso: actualiza datos SIN tocar la UI
    const int = setInterval(() => cargar(false), INTERVALO * 1000)
    const cnt = setInterval(() => setContador(n => n <= 1 ? INTERVALO : n - 1), 1000)
    return () => { clearInterval(int); clearInterval(cnt) }
  }, [cargar])

  function handleActualizada(ordenActualizada) {
    setOrdenes(prev => {
      const sig = { ...prev }
      for (const k of Object.keys(sig)) {
        sig[k] = sig[k].filter(o => o.id !== ordenActualizada.id)
      }
      if (sig[ordenActualizada.estado] !== undefined) {
        sig[ordenActualizada.estado] = [ordenActualizada, ...sig[ordenActualizada.estado]]
      }
      return sig
    })
  }

  const totalActivas = ordenes.RECIBIDO.length + ordenes.EN_REVISION.length + ordenes.EN_REPARACION.length + ordenes.LISTO.length
  const listaActual  = ordenes[tabActiva] ?? []

  return (
    <div className="pagina">
      <div className="pagina-cabecera" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>🔩 Taller</h1>
          <p>{totalActivas} órdenes activas · refresco en {contador}s</p>
        </div>
        <button className="btn btn-secundario" onClick={() => cargar(false)}>
          ↻ Actualizar
        </button>
      </div>

      <div className="tabs">
        {TABS.map(t => (
          <button key={t.id} className={`tab ${tabActiva === t.id ? 'activo' : ''}`}
            onClick={() => setTabActiva(t.id)}>
            {t.etiqueta}
            {ordenes[t.id]?.length > 0 && (
              <span className="tab-n"
                style={
                  t.id === 'ENTREGADO' ? { background: 'rgba(85,93,124,.2)', color: 'var(--c-ENTREGADO)' } :
                  t.id === 'LISTO'     ? { background: 'rgba(72,199,116,.18)', color: 'var(--c-LISTO)' } :
                  {}
                }>
                {ordenes[t.id].length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Solo spinner en la carga inicial, nunca en el refresco */}
      {cargandoInicial ? (
        <SkeletonGrid />
      ) : error ? (
        <div className="vacio">
          <div className="vacio-icono">⚠</div>
          <p style={{ color: 'var(--rojo)', marginBottom: 12 }}>{error}</p>
          <button className="btn btn-secundario btn-sm" onClick={() => cargar(true)}>
            ↻ Reintentar
          </button>
        </div>
      ) : listaActual.length === 0 ? (
        <div className="vacio">
          <div className="vacio-icono">{tabActiva === 'ENTREGADO' ? '📋' : '✅'}</div>
          {tabActiva === 'ENTREGADO'
            ? 'No hay órdenes entregadas aún.'
            : `No hay órdenes en "${TABS.find(t => t.id === tabActiva)?.etiqueta}".`}
        </div>
      ) : (
        <div className="ordenes-grid">
          {listaActual.map(o => (
            <TarjetaOrden key={o.id} orden={o} onActualizada={handleActualizada} />
          ))}
        </div>
      )}
    </div>
  )
}

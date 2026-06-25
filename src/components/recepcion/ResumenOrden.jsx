import { useState } from 'react'
import { ordenApi } from '../../services/api'
import { ErrorMsg } from '../shared/Shared'

/**
 * Lista de servicios de la orden activa + total.
 * Props: orden, onActualizada(orden)
 */
export default function ResumenOrden({ orden, onActualizada }) {
  const [quitando, setQuitando] = useState(null)
  const [error, setError]       = useState(null)

  async function quitar(servicioId) {
    setQuitando(servicioId); setError(null)
    try {
      const actualizada = await ordenApi.quitarServicio(orden.id, servicioId)
      onActualizada(actualizada)
    } catch (e) { setError(e.message) }
    finally { setQuitando(null) }
  }

  const lineas = orden.servicios ?? []

  return (
    <div className="resumen">
      <div className="resumen-head">
        <span>Orden <span className="codigo">{orden.codigo}</span></span>
        <span className="color-sub" style={{ fontSize:11 }}>{lineas.length} líneas</span>
      </div>

      <div className="resumen-body">
        {lineas.length === 0
          ? <p className="color-sub" style={{ padding:'12px 0', textAlign:'center', fontSize:13 }}>
              Añade servicios desde el catálogo.
            </p>
          : lineas.map(l => (
            <div key={l.servicioId} className="resumen-linea">
              <div>
                <div className="resumen-linea-nombre">{l.servicioNombre}</div>
                <div className="resumen-linea-sub">{l.cantidad} × {l.precioUnitario?.toFixed(2)} €</div>
              </div>
              <div className="row">
                <span style={{ fontWeight:600 }}>{l.subTotal?.toFixed(2)} €</span>
                <button className="btn-quitar" title="Quitar"
                  onClick={() => quitar(l.servicioId)}
                  disabled={quitando === l.servicioId}>
                  ✕
                </button>
              </div>
            </div>
          ))
        }
      </div>

      <ErrorMsg msg={error} />

      <div className="resumen-foot">
        <span className="color-sub">Total</span>
        <span className="resumen-foot-total">{(orden.total ?? 0).toFixed(2)} €</span>
      </div>
    </div>
  )
}

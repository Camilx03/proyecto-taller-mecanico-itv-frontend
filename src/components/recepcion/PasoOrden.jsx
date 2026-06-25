import { useState, useEffect } from 'react'
import { puestoApi, ordenApi } from '../../services/api'
import { ErrorMsg, Spinner } from '../shared/Shared'

/**
 * Crea la orden de trabajo.
 * Props: vehiculoId, onCreada(orden)
 */
export default function PasoOrden({ vehiculoId, onCreada }) {
  const [puestos, setPuestos]         = useState([])
  const [puestoId, setPuestoId]       = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [cargando, setCargando]       = useState(false)
  const [cargandoP, setCargandoP]     = useState(true)
  const [error, setError]             = useState(null)

  useEffect(() => {
    puestoApi.listar()
      .then(setPuestos)
      .catch(e => setError(e.message))
      .finally(() => setCargandoP(false))
  }, [])

  async function crear(e) {
    e.preventDefault()
    if (!puestoId) { setError('Selecciona un puesto.'); return }
    setCargando(true); setError(null)
    try {
      const orden = await ordenApi.crear({ vehiculoId, puestoId: Number(puestoId), observaciones })
      onCreada(orden)
    } catch (e) { setError(e.message) }
    finally { setCargando(false) }
  }

  if (cargandoP) return <Spinner />

  return (
    <form onSubmit={crear}>
      <div className="campo">
        <label>Puesto de trabajo *</label>
        <select value={puestoId} onChange={e => setPuestoId(e.target.value)} required>
          <option value="">Selecciona un puesto</option>
          {puestos.map(p => (
            <option key={p.id} value={p.id}>{p.nombre} ({p.tipo})</option>
          ))}
        </select>
      </div>
      <div className="campo">
        <label>Observaciones</label>
        <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)}
          placeholder="Ruido al frenar, revisión ITV..." />
      </div>
      <ErrorMsg msg={error} />
      <button type="submit" className="btn btn-primario" disabled={cargando || !puestoId}>
        {cargando ? 'Creando...' : 'Crear orden de trabajo'}
      </button>
    </form>
  )
}

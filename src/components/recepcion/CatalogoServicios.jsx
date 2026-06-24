import { useState, useEffect } from 'react'
import { servicioApi, categoriaApi, ordenApi } from '../../services/api'
import { ErrorMsg, Spinner } from '../shared/Shared'

/**
 * Paso 4: catálogo de servicios filtrable por categoría.
 * Click en una tarjeta → POST /api/ordenes/{id}/servicios
 * Props: ordenId, onActualizada(orden)
 */
export default function CatalogoServicios({ ordenId, onActualizada }) {
  const [servicios, setServicios]   = useState([])
  const [categorias, setCategorias] = useState([])
  const [filtro, setFiltro]         = useState('')
  const [cargando, setCargando]     = useState(true)
  const [error, setError]           = useState(null)
  const [añadiendo, setAñadiendo]   = useState(null) // id del servicio en proceso

  useEffect(() => {
    Promise.all([servicioApi.listar({ activo: true }), categoriaApi.listar()])
      .then(([svcs, cats]) => { setServicios(svcs); setCategorias(cats) })
      .catch(e => setError(e.message))
      .finally(() => setCargando(false))
  }, [])

  async function añadir(servicioId) {
    if (añadiendo === servicioId) return
    setAñadiendo(servicioId); setError(null)
    try {
      const actualizada = await ordenApi.añadirServicio(ordenId, { servicioId, cantidad: 1 })
      onActualizada(actualizada)
    } catch (e) { setError(e.message) }
    finally { setAñadiendo(null) }
  }

  const lista = filtro
    ? servicios.filter(s => String(s.categoriaId) === String(filtro))
    : servicios

  if (cargando) return <Spinner />

  return (
    <div>
      <div className="catalogo-filtro">
        <span className="color-sub">{lista.length} servicios</span>
        <select value={filtro} onChange={e => setFiltro(e.target.value)}
          style={{ padding:'5px 10px', fontSize:'13px', background:'var(--fondo)', border:'1px solid var(--borde)', borderRadius:'6px', color:'var(--texto)' }}>
          <option value="">Todas las categorías</option>
          {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>

      <ErrorMsg msg={error} />

      {lista.length === 0
        ? <div className="vacio"><div className="vacio-icono">🔧</div>Sin servicios en esta categoría.</div>
        : (
          <div className="catalogo-grid">
            {lista.map(s => (
              <div key={s.id} className="servicio-card" onClick={() => añadir(s.id)}>
                <div>
                  <div className="servicio-nombre">{s.nombre}</div>
                  <div className="servicio-cat">{s.categoriaNombre}</div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                  <span className="servicio-precio">{s.precio?.toFixed(2)} €</span>
                  <button className="btn btn-primario btn-sm"
                    onClick={e => { e.stopPropagation(); añadir(s.id) }}
                    disabled={añadiendo === s.id}>
                    {añadiendo === s.id ? '...' : '+'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}

import { useState, useEffect } from 'react'
import { ordenApi, servicioApi, categoriaApi } from '../../services/api'
import { BadgeEstado, ErrorMsg } from '../shared/Shared'

const FLUJO  = ['RECIBIDO', 'EN_REVISION', 'EN_REPARACION', 'LISTO', 'ENTREGADO']
const AVANCE = {
  RECIBIDO:      'Iniciar revisión',
  EN_REVISION:   'Iniciar reparación',
  EN_REPARACION: 'Marcar listo',
  LISTO:         'Marcar entregado',
}
const ETIQUETAS_ESTADO = {
  RECIBIDO: 'Recibido', EN_REVISION: 'En Revisión',
  EN_REPARACION: 'En Reparación', LISTO: 'Listo', ENTREGADO: 'Entregado',
}

function tiempoTranscurrido(fechaEntrada) {
  if (!fechaEntrada) return null
  const diff = Math.floor((Date.now() - new Date(fechaEntrada)) / 60000)
  if (diff < 1)  return 'Ahora mismo'
  if (diff < 60) return `${diff} min`
  const h = Math.floor(diff / 60), m = diff % 60
  return `${h}h${m > 0 ? ` ${m}min` : ''}`
}

function esUrgente(f) {
  return f ? (Date.now() - new Date(f)) > 2 * 60 * 60 * 1000 : false
}

function tipoOrden(codigo) {
  return codigo?.startsWith('ITV') ? 'ITV' : 'TALLER'
}

// ── Editor de observaciones ──

function Observaciones({ orden, puedeEditar, onActualizada }) {
  const [editando,  setEditando]  = useState(false)
  const [texto,     setTexto]     = useState(orden.observaciones ?? '')
  const [guardando, setGuardando] = useState(false)
  const [error,     setError]     = useState(null)

  useEffect(() => { setTexto(orden.observaciones ?? '') }, [orden.observaciones])

  async function guardar() {
    setGuardando(true); setError(null)
    try {
      const actualizada = await ordenApi.actualizarObservaciones(orden.id, texto.trim())
      onActualizada(actualizada)
      setEditando(false)
    } catch (e) { setError(e.message) }
    finally { setGuardando(false) }
  }

  if (!editando) {
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, justifyContent: 'space-between' }}>
        {orden.observaciones ? (
          <p style={{ fontSize: 12, color: 'var(--texto-sub)', flex: 1 }}>💬 {orden.observaciones}</p>
        ) : (
          <p style={{ fontSize: 12, color: 'var(--texto-muted)', fontStyle: 'italic', flex: 1 }}>
            Sin observaciones
          </p>
        )}
        {puedeEditar && (
          <button className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}
            onClick={() => setEditando(true)}>
            {orden.observaciones ? '✎ Editar' : '+ Añadir nota'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div>
      <textarea
        value={texto}
        onChange={e => setTexto(e.target.value)}
        placeholder="Defectos encontrados, piezas a revisar, resultado de la inspección..."
        style={{ width: '100%', minHeight: 60, fontSize: 13 }}
        autoFocus
      />
      {error && <ErrorMsg msg={error} />}
      <div className="row mt-10">
        <button className="btn btn-primario btn-sm" onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar nota'}
        </button>
        <button className="btn btn-ghost btn-sm"
          onClick={() => { setEditando(false); setTexto(orden.observaciones ?? '') }}>
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ── Catálogo inline con selector de cantidad ──

function CatalogoInline({ ordenId, serviciosActuales, onActualizada }) {
  const [servicios,  setServicios]  = useState([])
  const [categorias, setCategorias] = useState([])
  const [filtro,     setFiltro]     = useState('')
  const [cargando,   setCargando]   = useState(true)
  const [añadiendo,  setAñadiendo]  = useState(null)
  const [error,      setError]      = useState(null)
  const [cantidades, setCantidades] = useState({})

  useEffect(() => {
    Promise.all([servicioApi.listar({ activo: true }), categoriaApi.listar()])
      .then(([svcs, cats]) => { setServicios(svcs); setCategorias(cats) })
      .catch(e => setError(e.message))
      .finally(() => setCargando(false))
  }, [])

  function getCantidad(id) { return cantidades[id] ?? 1 }
  function setCantidad(id, val) {
    const n = Math.max(1, Math.min(20, Number(val) || 1))
    setCantidades(p => ({ ...p, [id]: n }))
  }

  async function añadir(servicioId) {
    if (añadiendo === servicioId) return
    const cantidad = getCantidad(servicioId)
    setAñadiendo(servicioId); setError(null)
    try {
      onActualizada(await ordenApi.añadirServicio(ordenId, { servicioId, cantidad }))
    } catch (e) { setError(e.message) }
    finally { setAñadiendo(null) }
  }

  const idsActuales = new Set((serviciosActuales ?? []).map(s => s.servicioId))
  const lista = (filtro
    ? servicios.filter(s => String(s.categoriaId) === filtro)
    : servicios
  ).filter(s => !idsActuales.has(s.id))

  if (cargando) return (
    <p style={{ fontSize: 12, color: 'var(--texto-muted)', padding: '8px 0' }}>Cargando servicios...</p>
  )

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--texto-muted)' }}>
          {lista.length} servicios disponibles
        </span>
        <select value={filtro} onChange={e => setFiltro(e.target.value)}
          style={{ fontSize: 12, padding: '3px 8px', background: 'var(--fondo)',
            border: '1px solid var(--borde)', borderRadius: 5, color: 'var(--texto)' }}>
          <option value="">Todas las categorías</option>
          {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>

      {error && <ErrorMsg msg={error} />}

      {lista.length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--texto-muted)', fontStyle: 'italic' }}>
          No hay más servicios disponibles en esta categoría.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {lista.map(s => (
            <div key={s.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--fondo)', border: '1px solid var(--borde)',
              borderRadius: 6, padding: '7px 10px', gap: 10,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--texto)' }}>{s.nombre}</div>
                <div style={{ fontSize: 11, color: 'var(--texto-muted)' }}>
                  {s.categoriaNombre} · {s.precio?.toFixed(2)} €/ud
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center',
                  border: '1px solid var(--borde)', borderRadius: 6, overflow: 'hidden' }}>
                  <button
                    style={{ background: 'var(--superficie)', border: 'none', color: 'var(--texto)',
                      padding: '3px 8px', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}
                    onClick={() => setCantidad(s.id, getCantidad(s.id) - 1)}>
                    −
                  </button>
                  <span style={{ padding: '3px 8px', fontSize: 13, fontWeight: 700,
                    color: 'var(--texto)', background: 'var(--fondo)', minWidth: 28, textAlign: 'center' }}>
                    {getCantidad(s.id)}
                  </span>
                  <button
                    style={{ background: 'var(--superficie)', border: 'none', color: 'var(--texto)',
                      padding: '3px 8px', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}
                    onClick={() => setCantidad(s.id, getCantidad(s.id) + 1)}>
                    +
                  </button>
                </div>

                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ambar)',
                  minWidth: 52, textAlign: 'right' }}>
                  {(s.precio * getCantidad(s.id)).toFixed(2)} €
                </span>

                <button className="btn btn-primario btn-sm"
                  onClick={() => añadir(s.id)}
                  disabled={añadiendo === s.id}
                  style={{ minWidth: 60 }}>
                  {añadiendo === s.id ? '...' : 'Añadir'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Tarjeta de orden ──
// NOTA: la eliminación de la orden completa no está disponible porque
// el backend no expone DELETE /api/ordenes/{id}. Lo único soportado
// para "quitar" algo es eliminar un servicio individual de la orden,
// lo cual ya está implementado en el catálogo de servicios de abajo.

export default function TarjetaOrden({ orden: ordenInicial, onActualizada }) {
  const [orden,      setOrden]      = useState(ordenInicial)
  const [abierta,    setAbierta]    = useState(false)
  const [verCat,     setVerCat]     = useState(false)
  const [cargando,   setCargando]   = useState(false)
  const [quitando,   setQuitando]   = useState(null)
  const [error,      setError]      = useState(null)
  const [confirmar,  setConfirmar]  = useState(false) // confirmación de cambio de estado

  useEffect(() => { setOrden(ordenInicial) }, [ordenInicial])

  function actualizar(nuevaOrden) {
    setOrden(nuevaOrden)
    onActualizada(nuevaOrden)
  }

  const idx          = FLUJO.indexOf(orden.estado)
  const siguiente    = FLUJO[idx + 1] ?? null
  const tipo         = tipoOrden(orden.codigo)
  const esHistorial  = orden.estado === 'ENTREGADO'
  const urgente      = !esHistorial && esUrgente(orden.fechaEntrada)
  const tiempo       = !esHistorial ? tiempoTranscurrido(orden.fechaEntrada) : null
  const puedeEditar  = orden.estado !== 'ENTREGADO'
  const lineas       = orden.servicios ?? []

  async function avanzar() {
    if (!siguiente) return
    setCargando(true); setError(null)
    try {
      actualizar(await ordenApi.cambiarEstado(orden.id, siguiente))
      setConfirmar(false)
    }
    catch (e) { setError(e.message) }
    finally { setCargando(false) }
  }

  async function quitar(servicioId) {
    setQuitando(servicioId); setError(null)
    try { actualizar(await ordenApi.quitarServicio(orden.id, servicioId)) }
    catch (e) { setError(e.message) }
    finally { setQuitando(null) }
  }

  return (
    <div className="orden-card" style={urgente ? { borderColor: 'var(--rojo)', borderWidth: 2 } : {}}>

      {/* Cabecera */}
      <div className="orden-head">
        <div className="orden-head-izq">
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 100,
            background: tipo === 'ITV' ? 'rgba(75,159,232,.18)' : 'rgba(232,184,75,.15)',
            color: tipo === 'ITV' ? 'var(--azul)' : 'var(--ambar)',
          }}>{tipo}</span>
          <span className="codigo">{orden.codigo}</span>
          <BadgeEstado estado={orden.estado} />
        </div>
        <button className="btn btn-ghost btn-sm"
          onClick={() => { setAbierta(v => !v); if (abierta) setVerCat(false) }}>
          {abierta ? '▲ Cerrar' : '▼ Abrir'}
        </button>
      </div>

      {/* Datos */}
      <div className="orden-datos">
        <div className="dato">
          <span className="dato-label">Vehículo</span>
          <span className="dato-valor">{orden.marcaModelo ?? '—'}</span>
        </div>
        <div className="dato">
          <span className="dato-label">Matrícula</span>
          <span className="dato-valor" style={{ fontFamily: 'var(--fuente-mono)' }}>{orden.matricula ?? '—'}</span>
        </div>
        <div className="dato">
          <span className="dato-label">Cliente</span>
          <span className="dato-valor">{orden.clienteNombre ?? '—'}</span>
        </div>
        <div className="dato">
          <span className="dato-label">Puesto</span>
          <span className="dato-valor">{orden.puestoNombre ?? '—'}</span>
        </div>
        {tiempo && (
          <div className="dato">
            <span className="dato-label">Tiempo</span>
            <span className="dato-valor" style={{ color: urgente ? 'var(--rojo)' : 'var(--verde)' }}>
              {urgente ? '⚠ ' : '⏱ '}{tiempo}
            </span>
          </div>
        )}
        {esHistorial && orden.fechaEntrada && (
          <div className="dato">
            <span className="dato-label">Entrada</span>
            <span className="dato-valor">
              {new Date(orden.fechaEntrada).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
          </div>
        )}
      </div>

      {/* Observaciones — siempre visibles, editables si la orden sigue activa */}
      <Observaciones orden={orden} puedeEditar={puedeEditar} onActualizada={actualizar} />

      {/* Panel expandible: servicios */}
      {abierta && (
        <>
          <div className="separador" />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--texto-sub)',
              textTransform: 'uppercase', letterSpacing: '.04em' }}>
              Servicios {lineas.length > 0 && `(${lineas.length})`}
            </span>
            {puedeEditar && (
              <button className="btn btn-secundario btn-sm" onClick={() => setVerCat(v => !v)}>
                {verCat ? '✕ Cerrar catálogo' : '+ Añadir servicio'}
              </button>
            )}
          </div>

          {lineas.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--texto-muted)', fontStyle: 'italic' }}>
              Sin servicios — añade uno desde el catálogo.
            </p>
          ) : (
            <ul className="servicios-lista">
              {lineas.map(s => (
                <li key={s.servicioId} className="servicio-item">
                  <span className="servicio-item-nombre">{s.servicioNombre}</span>
                  <span className="servicio-item-meta">
                    <span style={{ color: 'var(--texto-muted)' }}>{s.cantidad}×</span>
                    <span style={{ fontWeight: 600 }}>{s.subTotal?.toFixed(2)} €</span>
                    {puedeEditar && (
                      <button
                        style={{ background: 'transparent', border: 'none', color: 'var(--rojo)',
                          cursor: 'pointer', fontSize: 13, padding: '0 4px', opacity: .65 }}
                        onClick={() => quitar(s.servicioId)}
                        disabled={quitando === s.servicioId}
                        title="Quitar servicio">
                        {quitando === s.servicioId ? '...' : '✕'}
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {lineas.length > 0 && (
            <div className="orden-total">Total: {(orden.total ?? 0).toFixed(2)} €</div>
          )}

          {verCat && puedeEditar && (
            <>
              <div className="separador" />
              <CatalogoInline
                ordenId={orden.id}
                serviciosActuales={lineas}
                onActualizada={actualizar}
              />
            </>
          )}
        </>
      )}

      <ErrorMsg msg={error} />

      {siguiente && (
        <div className="orden-acciones">
          {!confirmar ? (
            <button className="btn btn-primario" onClick={() => setConfirmar(true)}>
              {AVANCE[orden.estado]} →
            </button>
          ) : (
            <div className="confirmar-box">
              <span className="confirmar-texto">
                ¿Cambiar a <strong>{ETIQUETAS_ESTADO[siguiente]}</strong>?
              </span>
              <button className="btn btn-primario btn-sm" onClick={avanzar} disabled={cargando}>
                {cargando ? '...' : 'Confirmar'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirmar(false)} disabled={cargando}>
                Cancelar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

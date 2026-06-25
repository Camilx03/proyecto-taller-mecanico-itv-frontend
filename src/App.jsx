import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Recepcion from './pages/Recepcion'
import Taller    from './pages/Taller'
import Pantalla  from './pages/Pantalla'
import { ordenApi } from './services/api'
import { BadgeEstado } from './components/shared/Shared'

// ── Indicador de conexión con el backend ───────────────────

function useConexion() {
  const [conectado, setConectado] = useState(true)
  useEffect(() => {
    async function check() {
      try {
        const res = await fetch('/api/ordenes?estado=LISTO',
          { signal: AbortSignal.timeout(3000) })
        setConectado(res.ok)
      } catch { setConectado(false) }
    }
    check()
    const i = setInterval(check, 15000)
    return () => clearInterval(i)
  }, [])
  return conectado
}

// ── Buscador global por código de orden ────────────────────

const ETIQUETAS_ESTADO = {
  RECIBIDO: 'Recibido — en espera',
  EN_REVISION: 'En revisión',
  EN_REPARACION: 'En reparación',
  LISTO: '¡Listo para recoger!',
  ENTREGADO: 'Entregado',
}

function BuscadorGlobal() {
  const [codigo,    setCodigo]    = useState('')
  const [orden,     setOrden]     = useState(null)
  const [error,     setError]     = useState(null)
  const [cargando,  setCargando]  = useState(false)
  const [abierto,   setAbierto]   = useState(false)

  async function buscar(e) {
    e.preventDefault()
    const c = codigo.trim().toUpperCase()
    if (!c) return
    setCargando(true); setError(null); setOrden(null)
    try {
      setOrden(await ordenApi.buscarCodigo(c))
      setAbierto(true)
    } catch {
      setError('No se encontró ninguna orden con ese código.')
      setAbierto(true)
    } finally { setCargando(false) }
  }

  function cerrar() { setAbierto(false); setOrden(null); setError(null); setCodigo('') }

  return (
    <>
      <form onSubmit={buscar} style={{ display: 'flex', gap: 6, marginLeft: 'auto' }} className="nav-busqueda">
        <input
          value={codigo}
          onChange={e => setCodigo(e.target.value.toUpperCase())}
          placeholder="Buscar código T-0001..."
          style={{
            background: 'var(--fondo)', border: '1px solid var(--borde)',
            borderRadius: 6, padding: '5px 12px', color: 'var(--texto)',
            fontFamily: 'var(--fuente-mono)', fontSize: 13, width: 190,
            outline: 'none',
          }}
        />
        <button className="btn btn-secundario btn-sm" type="submit" disabled={cargando || !codigo.trim()}>
          {cargando ? '...' : '🔍'}
        </button>
      </form>

      {/* Modal resultado */}
      {abierto && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }} onClick={cerrar}>
          <div style={{
            background: 'var(--tarjeta)', border: '1px solid var(--borde)',
            borderRadius: 12, padding: 28, minWidth: 300, maxWidth: 440,
          }} onClick={e => e.stopPropagation()}>
            {error ? (
              <>
                <p style={{ color: 'var(--rojo)', fontSize: 14, marginBottom: 12 }}>⚠ {error}</p>
                <button className="btn btn-ghost btn-sm" onClick={cerrar}>Cerrar</button>
              </>
            ) : orden ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <span className="codigo" style={{ fontSize: 22 }}>{orden.codigo}</span>
                  <BadgeEstado estado={orden.estado} />
                </div>
                <p style={{ fontSize: 14, color: 'var(--ambar)', fontWeight: 600, marginBottom: 14 }}>
                  {ETIQUETAS_ESTADO[orden.estado]}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--texto-sub)' }}>
                  <span>🚗 {orden.marcaModelo} — <span style={{ fontFamily: 'var(--fuente-mono)' }}>{orden.matricula}</span></span>
                  <span>👤 {orden.clienteNombre} · {orden.clienteTelefono}</span>
                  <span>📍 {orden.puestoNombre}</span>
                  {orden.total > 0 && <span>💶 Total: <strong style={{ color: 'var(--ambar)' }}>{orden.total.toFixed(2)} €</strong></span>}
                </div>
                <button className="btn btn-ghost btn-sm" style={{ marginTop: 16 }} onClick={cerrar}>Cerrar</button>
              </>
            ) : null}
          </div>
        </div>
      )}
    </>
  )
}

// ── App principal ──────────────────────────────────────────

export default function App() {
  const conectado = useConexion()

  return (
    <BrowserRouter>
      <div className="app">
        <nav className="nav">
          <span className="nav-marca">Taller Mecánico</span>
          <NavLink to="/"       end className={({ isActive }) => `nav-link${isActive ? ' activo' : ''}`}>🛠 Recepción</NavLink>
          <NavLink to="/taller"     className={({ isActive }) => `nav-link${isActive ? ' activo' : ''}`}>🔩 Taller</NavLink>
          <NavLink to="/pantalla"   className={({ isActive }) => `nav-link${isActive ? ' activo' : ''}`}>🔔 Pantalla</NavLink>
          <BuscadorGlobal />
          <div className="nav-indicator" style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 12, fontSize: 12,
            color: conectado ? 'var(--verde)' : 'var(--rojo)', flexShrink: 0 }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: conectado ? 'var(--verde)' : 'var(--rojo)',
              display: 'inline-block',
              boxShadow: conectado ? '0 0 6px var(--verde)' : '0 0 6px var(--rojo)',
            }} />
            {conectado ? 'Online' : 'Sin conexión'}
          </div>
        </nav>

        <Routes>
          <Route path="/"         element={<Recepcion />} />
          <Route path="/taller"   element={<Taller />} />
          <Route path="/pantalla" element={<Pantalla />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

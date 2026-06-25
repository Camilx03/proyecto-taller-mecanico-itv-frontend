import { useState, useEffect, useRef } from 'react'
import { ordenApi } from '../services/api'
import { BadgeEstado } from '../components/shared/Shared'

const INTERVALO = 30

function horaFormato(fecha) {
  if (!fecha) return ''
  return new Date(fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function reloj() {
  return new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function tipoOrden(codigo) {
  return codigo?.startsWith('ITV') ? 'ITV' : 'TALLER'
}

export default function Pantalla() {
  const [enProceso, setEnProceso] = useState([])
  const [listos,    setListos]    = useState([])
  const [hora,      setHora]      = useState(reloj())
  const [contador,  setContador]  = useState(INTERVALO)
  const [error,     setError]     = useState(null)
  const intRef = useRef(null)
  const cntRef = useRef(null)
  const hrsRef = useRef(null)

  async function cargar() {
    setError(null)
    try {
      const [rec, rev, rep, lis] = await Promise.all([
        ordenApi.listar('RECIBIDO'),
        ordenApi.listar('EN_REVISION'),
        ordenApi.listar('EN_REPARACION'),
        ordenApi.listar('LISTO'),
      ])
      setEnProceso([...rec, ...rev, ...rep].sort((a, b) => new Date(a.fechaEntrada) - new Date(b.fechaEntrada)))
      setListos(lis.sort((a, b) => new Date(a.fechaEntrada) - new Date(b.fechaEntrada)))
    } catch (e) { setError(e.message) }
    setContador(INTERVALO)
  }

  useEffect(() => {
    cargar()
    intRef.current = setInterval(cargar, INTERVALO * 1000)
    cntRef.current = setInterval(() => setContador(n => n <= 1 ? INTERVALO : n - 1), 1000)
    hrsRef.current = setInterval(() => setHora(reloj()), 1000)
    return () => { clearInterval(intRef.current); clearInterval(cntRef.current); clearInterval(hrsRef.current) }
  }, [])

  function pantallaCompleta() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen()
    else document.exitFullscreen()
  }

  const totalVisible = enProceso.length + listos.length

  return (
    <div className="pantalla">
      <div className="pantalla-head">
        <div>
          <div className="pantalla-titulo">🔔 Estado de vehículos</div>
          <div className="pantalla-sub">
            {totalVisible === 0 ? 'Sin vehículos en este momento' : `${totalVisible} vehículo${totalVisible !== 1 ? 's' : ''} en el taller`}
          </div>
        </div>
        <div className="pantalla-reloj">
          <span style={{ fontSize: 22, fontFamily: 'var(--fuente-mono)', fontWeight: 700, color: 'var(--texto)' }}>
            {hora}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
            <span style={{ fontSize: 11, color: 'var(--texto-muted)' }}>↻ en {contador}s</span>
            <div className="row">
              <button className="btn btn-ghost btn-sm" onClick={cargar}>↻</button>
              <button className="btn btn-ghost btn-sm" onClick={pantallaCompleta} title="Pantalla completa">⛶</button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <p style={{ color: 'var(--rojo)', textAlign: 'center', padding: 16, fontSize: 13 }}>
          Error de conexión: {error}
        </p>
      )}

      <div className="pantalla-dos-col" style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, minHeight: 0 }}>

        {/* Columna izquierda: En proceso */}
        <div style={{ borderRight: '1px solid var(--borde)', padding: '24px 24px', overflowY: 'auto' }}>
          <div style={{ marginBottom: 18 }}>
            <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '.06em', color: 'var(--texto-sub)' }}>
              ⚙ En proceso
            </span>
          </div>

          {enProceso.length === 0 ? (
            <div style={{ color: 'var(--texto-muted)', fontSize: 14, textAlign: 'center', paddingTop: 40 }}>
              Sin vehículos en proceso
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {enProceso.map(o => {
                const tipo = tipoOrden(o.codigo)
                return (
                  <div key={o.id} style={{
                    background: 'var(--tarjeta)',
                    border: '1px solid var(--borde)',
                    borderRadius: 10,
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 100,
                            background: tipo === 'ITV' ? 'rgba(75,159,232,.18)' : 'rgba(232,184,75,.15)',
                            color: tipo === 'ITV' ? 'var(--azul)' : 'var(--ambar)',
                          }}>{tipo}</span>
                          <span className="codigo" style={{ fontSize: 18 }}>{o.codigo}</span>
                          <BadgeEstado estado={o.estado} />
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--texto-sub)' }}>
                          {o.marcaModelo} · <span style={{ fontFamily: 'var(--fuente-mono)' }}>{o.matricula}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--texto-muted)', textAlign: 'right', flexShrink: 0 }}>
                        Entrada<br />
                        <strong style={{ color: 'var(--texto-sub)' }}>{horaFormato(o.fechaEntrada)}</strong>
                      </div>
                    </div>
                    {o.observaciones && (
                      <div style={{
                        fontSize: 12, color: 'var(--texto-sub)', background: 'var(--fondo)',
                        border: '1px solid var(--borde)', borderRadius: 6,
                        padding: '6px 10px', lineHeight: 1.5,
                      }}>
                        💬 {o.observaciones}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Columna derecha: Listos */}
        <div style={{ padding: '24px 24px', background: 'rgba(72,199,116,.03)', overflowY: 'auto' }}>
          <div style={{ marginBottom: 18 }}>
            <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '.06em', color: 'var(--c-LISTO)' }}>
              ✓ Listos para recoger
            </span>
          </div>

          {listos.length === 0 ? (
            <div style={{ color: 'var(--texto-muted)', fontSize: 14, textAlign: 'center', paddingTop: 40 }}>
              Ningún vehículo listo aún
            </div>
          ) : (
            <div className="pantalla-grid">
              {listos.map(o => (
                <div key={o.id} className="pantalla-card">
                  <span className="pantalla-card-listo">✓ Listo</span>
                  <span className="pantalla-card-codigo">{o.codigo}</span>
                  <div className="pantalla-card-info">
                    <strong>{o.marcaModelo}</strong><br />
                    <span style={{ fontFamily: 'var(--fuente-mono)' }}>{o.matricula}</span><br />
                    {o.clienteNombre}
                  </div>
                  {o.observaciones && (
                    <div style={{
                      fontSize: 11, color: 'var(--texto-sub)', background: 'var(--fondo)',
                      border: '1px solid var(--borde)', borderRadius: 6,
                      padding: '6px 10px', marginTop: 2, textAlign: 'left', lineHeight: 1.5,
                      maxWidth: '100%', wordBreak: 'break-word',
                    }}>
                      💬 {o.observaciones}
                    </div>
                  )}
                  <span style={{ fontSize: 11, color: 'var(--c-LISTO)', opacity: .7 }}>
                    Listo a las {horaFormato(o.fechaEntrada)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

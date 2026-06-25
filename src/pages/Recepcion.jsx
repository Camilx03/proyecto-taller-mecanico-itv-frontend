import { useState } from 'react'
import BuscarOCrear      from '../components/recepcion/BuscarOCrear'
import PasoOrden         from '../components/recepcion/PasoOrden'
import EntregaVehiculo   from '../components/recepcion/EntregaVehiculo'

const PASOS = ['Vehículo / Cliente', 'Orden', 'Finalizar']

// ── Ticket de impresión ───────────────────────────────────────

function TicketImpresion({ orden }) {
  function imprimir() {
    const w = window.open('', '_blank', 'width=420,height=380')
    w.document.write(`
      <!DOCTYPE html><html lang="es"><head>
        <meta charset="UTF-8">
        <title>Ticket ${orden.codigo}</title>
        <style>
          body { font-family: 'Courier New', monospace; text-align: center;
                 padding: 30px 20px; background: white; color: black; }
          hr { border: 1px dashed #999; margin: 14px 0; }
          .titulo { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
          .sub    { font-size: 12px; color: #666; margin-bottom: 16px; }
          .codigo { font-size: 52px; font-weight: 900; letter-spacing: .1em;
                    margin: 16px 0; border: 3px solid black; padding: 10px 20px;
                    display: inline-block; }
          .info   { font-size: 13px; line-height: 1.9; }
          .pie    { font-size: 11px; color: #888; margin-top: 16px; }
        </style>
      </head><body>
        <div class="titulo">TALLER MECÁNICO</div>
        <div class="sub">Resguardo de entrada</div>
        <hr>
        <div class="codigo">${orden.codigo}</div>
        <hr>
        <div class="info">
          Vehículo: <strong>${orden.marcaModelo ?? ''}</strong><br>
          Matrícula: <strong>${orden.matricula ?? ''}</strong><br>
          Cliente: ${orden.clienteNombre ?? ''}<br>
          Puesto: ${orden.puestoNombre ?? ''}
          ${orden.observaciones ? `<br>Motivo: ${orden.observaciones}` : ''}
        </div>
        <div class="pie">Guarde este código para seguir el estado de su vehículo<br>
          en la pantalla de sala de espera.</div>
      </body></html>
    `)
    w.document.close()
    w.focus()
    w.print()
  }

  function copiar() {
    navigator.clipboard.writeText(orden.codigo)
      .then(() => alert(`Código ${orden.codigo} copiado al portapapeles`))
      .catch(() => alert(`Código: ${orden.codigo} (cópialo manualmente)`))
  }

  return (
    <div className="row" style={{ justifyContent: 'center', flexWrap: 'wrap', gap: 10 }}>
      <button className="btn btn-secundario" onClick={imprimir}>
        🖨 Imprimir ticket
      </button>
      <button className="btn btn-ghost" onClick={copiar}>
        📋 Copiar código
      </button>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────

export default function Recepcion() {
  const [modo,       setModo]       = useState('entrada') // 'entrada' | 'entrega'
  const [paso,       setPaso]       = useState(0)
  const [vehiculoId, setVehiculoId] = useState(null)
  const [orden,      setOrden]      = useState(null)

  function reiniciar() { setPaso(0); setVehiculoId(null); setOrden(null) }

  return (
    <div className="pagina">
      <div className="pagina-cabecera">
        <h1>🛠 Recepción</h1>
        <p>Entrada de vehículos y entrega al cliente</p>
      </div>

      {/* Toggle entrada / entrega */}
      <div className="modo-toggle">
        <button
          className={`modo-btn ${modo === 'entrada' ? 'activo' : ''}`}
          onClick={() => { setModo('entrada'); reiniciar() }}
        >
          + Nueva entrada
        </button>
        <button
          className={`modo-btn ${modo === 'entrega' ? 'activo' : ''}`}
          onClick={() => setModo('entrega')}
        >
          🤝 Entregar vehículo
        </button>
      </div>

      {/* ── Modo entrega ── */}
      {modo === 'entrega' && <EntregaVehiculo />}

      {/* ── Modo entrada ── */}
      {modo === 'entrada' && (
        <>
          {/* Stepper */}
          <div className="stepper">
            {PASOS.map((nombre, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                <div className={`paso ${i === paso ? 'activo' : i < paso ? 'hecho' : ''}`}>
                  <div className="paso-num">{i < paso ? '✓' : i + 1}</div>
                  <span className="paso-texto">{nombre}</span>
                </div>
                {i < PASOS.length - 1 && <span className="paso-flecha">›</span>}
              </div>
            ))}
          </div>

          {/* Paso final — éxito + ticket */}
          {paso === 2 && orden && (
            <div className="card" style={{ maxWidth: 560, margin: '0 auto' }}>
              <div className="exito">
                <div className="exito-icono">✅</div>
                <h2 className="exito-titulo">Orden registrada</h2>
                <div className="exito-codigo">{orden.codigo}</div>
                <p className="exito-info">
                  🚗 {orden.marcaModelo} — {orden.matricula}<br />
                  👤 {orden.clienteNombre}<br />
                  📍 {orden.puestoNombre}<br />
                  {orden.observaciones && <>💬 {orden.observaciones}<br /></>}
                </p>
                <TicketImpresion orden={orden} />
                <button className="btn btn-primario" onClick={reiniciar}>
                  Nueva entrada
                </button>
              </div>
            </div>
          )}

          {/* Pasos 0 y 1 */}
          {paso < 2 && (
            <div style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="card">
                <div className="card-titulo">1. Vehículo / Cliente</div>
                <BuscarOCrear
                  onConfirmado={({ vehiculoId: vid }) => {
                    setVehiculoId(vid)
                    setPaso(Math.max(paso, 1))
                  }}
                />
              </div>

              {paso >= 1 && vehiculoId && (
                <div className="card">
                  <div className="card-titulo">2. Crear orden</div>
                  <PasoOrden
                    vehiculoId={vehiculoId}
                    onCreada={o => { setOrden(o); setPaso(2) }}
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

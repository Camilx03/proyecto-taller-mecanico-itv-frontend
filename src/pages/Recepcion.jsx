import { useState } from 'react'
import BuscarOCrear from '../components/recepcion/BuscarOCrear'
import PasoOrden    from '../components/recepcion/PasoOrden'

// Recepción solo crea la orden — los servicios los añade el mecánico en Taller
const PASOS = ['Vehículo / Cliente', 'Orden', 'Finalizar']

export default function Recepcion() {
  const [paso,       setPaso]       = useState(0)
  const [vehiculoId, setVehiculoId] = useState(null)
  const [orden,      setOrden]      = useState(null)

  function reiniciar() { setPaso(0); setVehiculoId(null); setOrden(null) }

  return (
    <div className="pagina">
      <div className="pagina-cabecera">
        <h1>🛠 Recepción</h1>
        <p>Entrada de vehículos y apertura de órdenes de trabajo</p>
      </div>

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

      {/* Paso final — código generado */}
      {paso === 2 && orden && (
        <div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
          <div className="exito">
            <div className="exito-icono">✅</div>
            <h2 className="exito-titulo">Orden registrada</h2>
            <div className="exito-codigo">{orden.codigo}</div>
            <p className="exito-info">
              Entrega este código al cliente.<br />
              El mecánico añadirá los servicios al revisar el vehículo.<br /><br />
              🚗 {orden.marcaModelo} — {orden.matricula}<br />
              👤 {orden.clienteNombre}<br />
              📍 {orden.puestoNombre}<br />
              {orden.observaciones && <>💬 {orden.observaciones}</>}
            </p>
            <button className="btn btn-primario" onClick={reiniciar}>
              Nueva entrada
            </button>
          </div>
        </div>
      )}

      {/* Pasos 0 y 1 */}
      {paso < 2 && (
        <div style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Paso 0: Vehículo / Cliente */}
          <div className="card">
            <div className="card-titulo">1. Vehículo / Cliente</div>
            <BuscarOCrear
              onConfirmado={({ vehiculoId: vid }) => {
                setVehiculoId(vid)
                setPaso(Math.max(paso, 1))
              }}
            />
          </div>

          {/* Paso 1: Crear orden */}
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
    </div>
  )
}

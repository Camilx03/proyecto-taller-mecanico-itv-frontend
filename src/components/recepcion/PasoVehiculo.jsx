import { useState } from 'react'
import { vehiculoApi } from '../../services/api'
import { ErrorMsg } from '../shared/Shared'

/**
 * Paso 2: busca vehículo por matrícula o registra uno nuevo.
 * Props: clienteId, onConfirmado(vehiculo)
 */
export default function PasoVehiculo({ clienteId, onConfirmado }) {
  const [matricula, setMatricula] = useState('')
  const [modo, setModo]           = useState('buscar')
  const [vehiculo, setVehiculo]   = useState(null)
  const [cargando, setCargando]   = useState(false)
  const [error, setError]         = useState(null)

  const [form, setForm] = useState({ matricula: '', marca: '', modelo: '', anio: '' })
  const editar = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  async function buscar() {
    if (!matricula.trim()) return
    setCargando(true); setError(null); setVehiculo(null)
    try {
      const v = await vehiculoApi.buscarMatricula(matricula.trim())
      setVehiculo(v)
      onConfirmado(v)
    } catch {
      setError(`No existe el vehículo con matrícula "${matricula}". Puedes registrarlo ahora.`)
    } finally { setCargando(false) }
  }

  async function crear(e) {
    e.preventDefault()
    setCargando(true); setError(null)
    try {
      const nuevo = await vehiculoApi.crear({
        matricula: form.matricula || matricula,
        marca:  form.marca,
        modelo: form.modelo,
        anio:   Number(form.anio),
        clienteId,
      })
      setVehiculo(nuevo)
      onConfirmado(nuevo)
      setModo('buscar')
    } catch (e) { setError(e.message) }
    finally { setCargando(false) }
  }

  if (vehiculo) return (
    <div className="resultado-ok">
      <strong>✓ Vehículo: {vehiculo.marca} {vehiculo.modelo} ({vehiculo.anio})</strong><br />
      <span className="color-sub">Matrícula: {vehiculo.matricula}</span><br />
      <button className="btn btn-ghost btn-sm mt-10"
        onClick={() => { setVehiculo(null); setMatricula(''); onConfirmado(null) }}>
        Cambiar vehículo
      </button>
    </div>
  )

  return (
    <>
      {modo === 'buscar' && (
        <>
          <div className="buscador">
            <div className="campo">
              <label>Matrícula</label>
              <input value={matricula} onChange={e => setMatricula(e.target.value)}
                placeholder="1234-ABC"
                onKeyDown={e => e.key === 'Enter' && buscar()} />
            </div>
            <button className="btn btn-primario" onClick={buscar} disabled={cargando || !matricula.trim()}>
              {cargando ? '...' : 'Buscar'}
            </button>
          </div>
          <ErrorMsg msg={error} />
          {error && (
            <button className="btn btn-secundario btn-sm mt-10"
              onClick={() => { setModo('crear'); setForm(p => ({ ...p, matricula })) }}>
              + Registrar vehículo
            </button>
          )}
        </>
      )}

      {modo === 'crear' && (
        <form onSubmit={crear}>
          <div className="fila">
            <div className="campo"><label>Matrícula *</label>
              <input name="matricula" value={form.matricula} onChange={editar}
                placeholder="1234-ABC" required />
            </div>
            <div className="campo"><label>Año</label>
              <input name="anio" type="number" value={form.anio} onChange={editar}
                placeholder="2020" min="1900" max="2030" />
            </div>
          </div>
          <div className="fila">
            <div className="campo"><label>Marca *</label>
              <input name="marca" value={form.marca} onChange={editar} placeholder="Seat" required />
            </div>
            <div className="campo"><label>Modelo *</label>
              <input name="modelo" value={form.modelo} onChange={editar} placeholder="Ibiza" required />
            </div>
          </div>
          <ErrorMsg msg={error} />
          <div className="row mt-10">
            <button type="submit" className="btn btn-primario" disabled={cargando}>
              {cargando ? 'Guardando...' : 'Registrar vehículo'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setModo('buscar')}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </>
  )
}

import { useState } from 'react'
import { clienteApi } from '../../services/api'
import { ErrorMsg } from '../shared/Shared'

/**
 * Paso 1 de Recepción: busca cliente por DNI.
 * Si no existe, ofrece formulario para crearlo.
 * Props: onConfirmado(cliente)
 */
export default function PasoCliente({ onConfirmado }) {
  const [dni, setDni]         = useState('')
  const [modo, setModo]       = useState('buscar')   // 'buscar' | 'crear'
  const [cliente, setCliente] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError]     = useState(null)

  const [form, setForm] = useState({ nombre: '', dni: '', telefono: '', email: '' })
  const editar = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  async function buscar() {
    if (!dni.trim()) return
    setCargando(true); setError(null); setCliente(null)
    try {
      const lista = await clienteApi.listar()
      const encontrado = lista.find(c => c.dni?.toLowerCase() === dni.trim().toLowerCase())
      if (encontrado) {
        setCliente(encontrado)
        onConfirmado(encontrado)
      } else {
        setError(`No existe ningún cliente con DNI "${dni}". Puedes crear uno nuevo.`)
      }
    } catch (e) { setError(e.message) }
    finally { setCargando(false) }
  }

  async function crear(e) {
    e.preventDefault()
    setCargando(true); setError(null)
    try {
      const nuevo = await clienteApi.crear({ ...form, dni: form.dni || dni })
      setCliente(nuevo)
      onConfirmado(nuevo)
      setModo('buscar')
    } catch (e) { setError(e.message) }
    finally { setCargando(false) }
  }

  if (cliente) return (
    <div className="resultado-ok">
      <strong>✓ Cliente: {cliente.nombre}</strong><br />
      <span className="color-sub">DNI: {cliente.dni}  ·  Tel: {cliente.telefono || '—'}</span><br />
      <button className="btn btn-ghost btn-sm mt-10"
        onClick={() => { setCliente(null); setDni(''); onConfirmado(null) }}>
        Cambiar cliente
      </button>
    </div>
  )

  return (
    <>
      {modo === 'buscar' && (
        <>
          <div className="buscador">
            <div className="campo">
              <label>DNI del cliente</label>
              <input value={dni} onChange={e => setDni(e.target.value)}
                placeholder="12345678A"
                onKeyDown={e => e.key === 'Enter' && buscar()} />
            </div>
            <button className="btn btn-primario" onClick={buscar} disabled={cargando || !dni.trim()}>
              {cargando ? '...' : 'Buscar'}
            </button>
          </div>
          <ErrorMsg msg={error} />
          {error && (
            <button className="btn btn-secundario btn-sm mt-10"
              onClick={() => { setModo('crear'); setForm(p => ({ ...p, dni })) }}>
              + Crear cliente nuevo
            </button>
          )}
        </>
      )}

      {modo === 'crear' && (
        <form onSubmit={crear}>
          <div className="fila">
            <div className="campo"><label>Nombre *</label>
              <input name="nombre" value={form.nombre} onChange={editar} required />
            </div>
            <div className="campo"><label>DNI *</label>
              <input name="dni" value={form.dni} onChange={editar} required />
            </div>
          </div>
          <div className="fila">
            <div className="campo"><label>Teléfono</label>
              <input name="telefono" value={form.telefono} onChange={editar} />
            </div>
            <div className="campo"><label>Email</label>
              <input name="email" type="email" value={form.email} onChange={editar} />
            </div>
          </div>
          <ErrorMsg msg={error} />
          <div className="row mt-10">
            <button type="submit" className="btn btn-primario" disabled={cargando}>
              {cargando ? 'Guardando...' : 'Guardar cliente'}
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

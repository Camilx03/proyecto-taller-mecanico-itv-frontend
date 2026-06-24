import { useState, useEffect } from 'react'
import { vehiculoApi, clienteApi } from '../../services/api'
import { ErrorMsg } from '../shared/Shared'

// ── Cálculo automático de la letra del DNI ──────────────────
// La letra es el resto de dividir el número entre 23, según esta tabla oficial.

const TABLA_LETRAS_DNI = 'TRWAGMYFPDXBNJZSQVHLCKE'

// Recibe lo que el usuario va escribiendo y devuelve el DNI formateado:
// mientras no haya 8 dígitos, deja solo los números; al completar el
// octavo dígito, añade la letra calculada automáticamente.
function formatearDNI(valorEscrito) {
  const digitos = valorEscrito.replace(/\D/g, '').slice(0, 8)
  if (digitos.length === 8) {
    const letra = TABLA_LETRAS_DNI[Number(digitos) % 23]
    return digitos + letra
  }
  return digitos
}

// ── Validación ─────────────────────────────────────────────

function validarVehiculo(f) {
  const e = {}
  if (!f.matricula.trim()) {
    e.matricula = 'La matrícula es obligatoria'
  } else if (!/^\d{4}-[A-Za-z]{3}$/.test(f.matricula.trim())) {
    e.matricula = 'Formato incorrecto. Ejemplo: 1234-ABC'
  }
  if (!f.marca.trim())  e.marca  = 'La marca es obligatoria'
  if (!f.modelo.trim()) e.modelo = 'El modelo es obligatorio'
  if (f.anio.trim()) {
    const n = Number(f.anio)
    if (!Number.isInteger(n) || n < 1900 || n > new Date().getFullYear())
      e.anio = `Año entre 1900 y ${new Date().getFullYear()}`
  }
  return e
}

function validarCliente(f) {
  const e = {}
  if (!f.nombre.trim()) {
    e.nombre = 'El nombre es obligatorio'
  } else if (f.nombre.trim().length < 3) {
    e.nombre = 'Mínimo 3 caracteres'
  } else if (/\d/.test(f.nombre)) {
    e.nombre = 'El nombre no puede contener números'
  } else if (!/^[a-záéíóúñüA-ZÁÉÍÓÚÑÜ\s'-]+$/.test(f.nombre.trim())) {
    e.nombre = 'Solo letras y espacios'
  }
  if (!f.dni.trim()) {
    e.dni = 'El DNI es obligatorio'
  } else if (!/^\d{8}[A-Za-z]$/.test(f.dni.trim())) {
    e.dni = 'Introduce los 8 números del DNI'
  }
  if (!f.telefono.trim()) {
    e.telefono = 'El teléfono es obligatorio'
  } else if (!/^[679]\d{8}$/.test(f.telefono.trim())) {
    e.telefono = '9 dígitos, debe empezar por 6, 7 o 9'
  }
  if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) {
    e.email = 'Formato: nombre@dominio.com'
  }
  return e
}

function validarContacto(f) {
  const e = {}
  if (!f.telefono.trim()) {
    e.telefono = 'El teléfono es obligatorio'
  } else if (!/^[679]\d{8}$/.test(f.telefono.trim())) {
    e.telefono = '9 dígitos, debe empezar por 6, 7 o 9'
  }
  if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) {
    e.email = 'Formato: nombre@dominio.com'
  }
  return e
}

// ── Historial de vehículos del mismo cliente ────────────────

function HistorialVehiculos({ clienteId, matriculaActual }) {
  const [vehiculos, setVehiculos] = useState(null)
  const [error, setError]         = useState(null)

  useEffect(() => {
    clienteApi.vehiculos(clienteId)
      .then(setVehiculos)
      .catch(e => setError(e.message))
  }, [clienteId])

  if (error) return null
  if (!vehiculos) return <p style={{ fontSize: 12, color: 'var(--texto-muted)' }}>Consultando otros vehículos...</p>

  const otros = vehiculos.filter(v => v.matricula !== matriculaActual)
  if (otros.length === 0) return null

  return (
    <div style={{ marginTop: 10, fontSize: 12, color: 'var(--texto-sub)' }}>
      <span style={{ color: 'var(--texto-muted)' }}>
        Este cliente tiene {otros.length} vehículo{otros.length !== 1 ? 's' : ''} más registrado{otros.length !== 1 ? 's' : ''}:
      </span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
        {otros.map(v => (
          <span key={v.id} style={{
            fontFamily: 'var(--fuente-mono)', background: 'var(--fondo)',
            border: '1px solid var(--borde)', borderRadius: 5, padding: '3px 9px', fontSize: 11,
          }}>
            {v.matricula} · {v.marca} {v.modelo}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Editor de datos de contacto ─────────────────────────────

function EditorContacto({ vehiculo, onActualizado }) {
  const [editando, setEditando]   = useState(false)
  const [form, setForm]           = useState({ telefono: vehiculo.clienteTelefono ?? '', email: '' })
  const [errores, setErrores]     = useState({})
  const [guardando, setGuardando] = useState(false)
  const [error, setError]         = useState(null)

  function cambiar(e) {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: value }))
    setErrores(p => { const n = { ...p }; delete n[name]; return n })
  }

  async function guardar() {
    const err = validarContacto(form)
    if (Object.keys(err).length > 0) { setErrores(err); return }
    setGuardando(true); setError(null)
    try {
      await clienteApi.actualizar(vehiculo.clienteId, {
        nombre: vehiculo.clienteNombre,
        telefono: form.telefono.trim(),
        email: form.email.trim() || undefined,
      })
      onActualizado({ ...vehiculo, clienteTelefono: form.telefono.trim() })
      setEditando(false)
    } catch (e) { setError(e.message) }
    finally { setGuardando(false) }
  }

  if (!editando) return (
    <button className="btn btn-ghost btn-sm mt-10" onClick={() => setEditando(true)}>
      ✎ Actualizar contacto
    </button>
  )

  return (
    <div className="mt-10" style={{ background: 'var(--fondo)', border: '1px solid var(--borde)', borderRadius: 8, padding: 12 }}>
      <div className="fila">
        <div className="campo">
          <label>Teléfono</label>
          <input name="telefono" value={form.telefono} onChange={cambiar}
            placeholder="612345678" style={errores.telefono ? { borderColor: 'var(--rojo)' } : {}} />
          {errores.telefono && <span style={{ fontSize: 11, color: 'var(--rojo)' }}>{errores.telefono}</span>}
        </div>
        <div className="campo">
          <label>Email</label>
          <input name="email" type="email" value={form.email} onChange={cambiar}
            placeholder="nombre@email.com" style={errores.email ? { borderColor: 'var(--rojo)' } : {}} />
          {errores.email && <span style={{ fontSize: 11, color: 'var(--rojo)' }}>{errores.email}</span>}
        </div>
      </div>
      {error && <ErrorMsg msg={error} />}
      <div className="row mt-10">
        <button className="btn btn-primario btn-sm" onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar'}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => setEditando(false)} disabled={guardando}>
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ── Buscador de cliente existente por DNI ───────────────────
// Permite vincular un vehículo nuevo a un cliente que YA está
// registrado, sin duplicarlo en la base de datos.

function BuscadorClienteExistente({ onEncontrado, onCancelar }) {
  const [dni, setDni]           = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError]       = useState(null)

  async function buscar() {
    const d = dni.trim()
    if (!d) return
    setCargando(true); setError(null)
    try {
      const todos = await clienteApi.listar()
      const encontrado = todos.find(c => c.dni?.toLowerCase() === d.toLowerCase())
      if (encontrado) {
        onEncontrado(encontrado)
      } else {
        setError(`No existe ningún cliente con DNI "${d}". Si es nuevo, vuelve atrás y usa "Cliente nuevo".`)
      }
    } catch (e) { setError(e.message) }
    finally { setCargando(false) }
  }

  return (
    <div style={{ background: 'var(--fondo)', border: '1px solid var(--borde)', borderRadius: 8, padding: 14, marginBottom: 14 }}>
      <p style={{ fontSize: 13, color: 'var(--texto-sub)', marginBottom: 10 }}>
        Busca al propietario por su DNI para vincular este vehículo a su ficha existente.
      </p>
      <div className="buscador">
        <div className="campo">
          <label>DNI del cliente</label>
          <input
            value={dni}
            onChange={e => { setDni(formatearDNI(e.target.value)); setError(null) }}
            onKeyDown={e => e.key === 'Enter' && buscar()}
            placeholder="12345678"
          />
        </div>
        <button className="btn btn-primario" onClick={buscar} disabled={cargando || !dni.trim()}>
          {cargando ? '...' : 'Buscar'}
        </button>
      </div>
      <ErrorMsg msg={error} />
      <button className="btn btn-ghost btn-sm mt-10" onClick={onCancelar}>← Volver</button>
    </div>
  )
}

// ── Componente principal ────────────────────────────────────

export default function BuscarOCrear({ onConfirmado }) {
  // Estados del flujo:
  // buscar              → buscador de matrícula inicial
  // encontrado          → vehículo existe, mostrar y confirmar
  // nuevo                → matrícula no existe, elegir cliente nuevo o existente
  // nuevo-cliente-nuevo  → formulario completo vehículo + cliente
  // nuevo-cliente-existe → buscador de cliente por DNI, luego solo datos del vehículo
  const [estado, setEstado]               = useState('buscar')
  const [matriculaBusq, setMatriculaBusq] = useState('')
  const [vehiculo, setVehiculo]           = useState(null)
  const [cargando, setCargando]           = useState(false)
  const [errorBusq, setErrorBusq]         = useState(null)

  // Cliente ya existente elegido para vincular el vehículo nuevo
  const [clienteExistente, setClienteExistente] = useState(null)

  const [form, setForm] = useState({
    matricula: '', marca: '', modelo: '', anio: '',
    nombre: '', dni: '', telefono: '', email: '',
  })
  const [errores, setErrores]             = useState({})
  const [cargandoCrear, setCargandoCrear] = useState(false)
  const [errorCrear, setErrorCrear]       = useState(null)

  function cambiar(e) {
    const { name, value } = e.target
    // El DNI se autocompleta: el usuario solo escribe números,
    // la letra se calcula y añade sola al llegar al octavo dígito.
    const valorFinal = name === 'dni' ? formatearDNI(value) : value
    setForm(p => ({ ...p, [name]: valorFinal }))
    setErrores(p => { const n = { ...p }; delete n[name]; return n })
  }

  async function buscar() {
    const mat = matriculaBusq.trim().toUpperCase()
    if (!mat) return
    if (!/^\d{4}-[A-Za-z]{3}$/.test(mat)) {
      setErrorBusq('Formato incorrecto. Ejemplo: 1234-ABC')
      return
    }
    setCargando(true); setErrorBusq(null)
    try {
      const v = await vehiculoApi.buscarMatricula(mat)
      setVehiculo(v)
      setEstado('encontrado')
    } catch {
      setClienteExistente(null)
      setForm(p => ({ ...p, matricula: mat }))
      setEstado('nuevo')
    } finally { setCargando(false) }
  }

  // Crea solo el vehículo, vinculado a un cliente que YA existe
  async function crearSoloVehiculo(e) {
    e.preventDefault()
    const encontrados = validarVehiculo(form)
    if (Object.keys(encontrados).length > 0) { setErrores(encontrados); return }

    setCargandoCrear(true); setErrorCrear(null)
    try {
      const veh = await vehiculoApi.crear({
        matricula: form.matricula.trim().toUpperCase(),
        marca:     form.marca.trim(),
        modelo:    form.modelo.trim(),
        anio:      form.anio ? Number(form.anio) : undefined,
        clienteId: clienteExistente.id,
      })
      onConfirmado({ vehiculoId: veh.id })
    } catch (err) { setErrorCrear(err.message) }
    finally { setCargandoCrear(false) }
  }

  // Crea cliente nuevo + vehículo nuevo
  async function crearClienteYVehiculo(e) {
    e.preventDefault()
    const errVeh = validarVehiculo(form)
    const errCli = validarCliente(form)
    const todos = { ...errVeh, ...errCli }
    if (Object.keys(todos).length > 0) { setErrores(todos); return }

    setCargandoCrear(true); setErrorCrear(null)
    try {
      const cliente = await clienteApi.crear({
        nombre:   form.nombre.trim(),
        dni:      form.dni.trim(),
        telefono: form.telefono.trim(),
        email:    form.email.trim() || undefined,
      })
      const veh = await vehiculoApi.crear({
        matricula: form.matricula.trim().toUpperCase(),
        marca:     form.marca.trim(),
        modelo:    form.modelo.trim(),
        anio:      form.anio ? Number(form.anio) : undefined,
        clienteId: cliente.id,
      })
      onConfirmado({ vehiculoId: veh.id })
    } catch (err) { setErrorCrear(err.message) }
    finally { setCargandoCrear(false) }
  }

  function reiniciarFormulario(matriculaPrevia) {
    setEstado('nuevo')
    setErrores({})
    setErrorCrear(null)
    setClienteExistente(null)
    setForm({ matricula: matriculaPrevia ?? '', marca: '', modelo: '', anio: '', nombre: '', dni: '', telefono: '', email: '' })
  }

  // ── Vehículo encontrado ──────────────────────────────────

  if (estado === 'encontrado' && vehiculo) return (
    <div>
      <div className="resultado-ok">
        <strong>✓ Vehículo encontrado</strong><br />
        <span style={{ fontSize: 15, color: 'var(--ambar)', fontFamily: 'var(--fuente-mono)', fontWeight: 700 }}>
          {vehiculo.matricula}
        </span>
        {' — '}{vehiculo.marca} {vehiculo.modelo} {vehiculo.anio && `(${vehiculo.anio})`}<br />
        <span className="color-sub">
          Cliente: {vehiculo.clienteNombre} · Tel: {vehiculo.clienteTelefono || '—'}
        </span>

        <EditorContacto vehiculo={vehiculo} onActualizado={setVehiculo} />

        {vehiculo.clienteId && (
          <HistorialVehiculos clienteId={vehiculo.clienteId} matriculaActual={vehiculo.matricula} />
        )}
      </div>
      <div className="row mt-10">
        <button className="btn btn-primario" onClick={() => onConfirmado({ vehiculoId: vehiculo.id })}>
          Confirmar → crear orden
        </button>
        <button className="btn btn-ghost"
          onClick={() => {
            setEstado('buscar'); setVehiculo(null); setMatriculaBusq('')
            setClienteExistente(null)
            setForm({ matricula: '', marca: '', modelo: '', anio: '', nombre: '', dni: '', telefono: '', email: '' })
          }}>
          Otra matrícula
        </button>
      </div>
    </div>
  )

  // ── Matrícula no encontrada: elegir tipo de alta ─────────

  if (estado === 'nuevo') return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--texto-sub)', marginBottom: 14 }}>
        Matrícula <strong style={{ color: 'var(--ambar)' }}>{form.matricula}</strong> no registrada.
        ¿El propietario ya es cliente del taller?
      </p>
      <div className="row">
        <button className="btn btn-secundario" onClick={() => setEstado('nuevo-cliente-existe')}>
          👤 Cliente ya existente
        </button>
        <button className="btn btn-secundario" onClick={() => setEstado('nuevo-cliente-nuevo')}>
          + Cliente nuevo
        </button>
      </div>
      <button className="btn btn-ghost btn-sm mt-10" onClick={() => setEstado('buscar')}>← Cancelar</button>
    </div>
  )

  // ── Vehículo nuevo para cliente YA existente ─────────────

  if (estado === 'nuevo-cliente-existe') {
    if (!clienteExistente) return (
      <BuscadorClienteExistente
        onEncontrado={setClienteExistente}
        onCancelar={() => setEstado('nuevo')}
      />
    )

    return (
      <form onSubmit={crearSoloVehiculo} noValidate>
        <div className="resultado-ok" style={{ marginBottom: 14 }}>
          <strong>✓ Cliente: {clienteExistente.nombre}</strong><br />
          <span className="color-sub">DNI: {clienteExistente.dni} · Tel: {clienteExistente.telefono || '—'}</span>
        </div>

        <Seccion label="Datos del vehículo" />
        <div className="fila">
          <Campo label="Matrícula *"  name="matricula" value={form.matricula} onChange={cambiar} error={errores.matricula} placeholder="1234-ABC" />
          <Campo label="Año"          name="anio"      value={form.anio}      onChange={cambiar} error={errores.anio}      placeholder="2020" type="number" />
        </div>
        <div className="fila">
          <Campo label="Marca *"  name="marca"  value={form.marca}  onChange={cambiar} error={errores.marca}  placeholder="Seat" />
          <Campo label="Modelo *" name="modelo" value={form.modelo} onChange={cambiar} error={errores.modelo} placeholder="Ibiza" />
        </div>

        {errorCrear && <ErrorMsg msg={errorCrear} />}

        <div className="row mt-10">
          <button type="submit" className="btn btn-primario" disabled={cargandoCrear}>
            {cargandoCrear ? 'Guardando...' : 'Registrar vehículo y continuar →'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setClienteExistente(null)}>
            Cambiar cliente
          </button>
        </div>
      </form>
    )
  }

  // ── Cliente nuevo + vehículo nuevo ────────────────────────

  if (estado === 'nuevo-cliente-nuevo') return (
    <form onSubmit={crearClienteYVehiculo} noValidate>
      <p style={{ fontSize: 13, color: 'var(--texto-sub)', marginBottom: 14 }}>
        Rellena los datos del vehículo y del propietario nuevo.
      </p>

      <Seccion label="Vehículo" />
      <div className="fila">
        <Campo label="Matrícula *"  name="matricula" value={form.matricula} onChange={cambiar} error={errores.matricula} placeholder="1234-ABC" />
        <Campo label="Año"          name="anio"      value={form.anio}      onChange={cambiar} error={errores.anio}      placeholder="2020" type="number" />
      </div>
      <div className="fila">
        <Campo label="Marca *"  name="marca"  value={form.marca}  onChange={cambiar} error={errores.marca}  placeholder="Seat" />
        <Campo label="Modelo *" name="modelo" value={form.modelo} onChange={cambiar} error={errores.modelo} placeholder="Ibiza" />
      </div>

      <Seccion label="Propietario" />
      <div className="fila">
        <Campo label="Nombre *" name="nombre"   value={form.nombre}   onChange={cambiar} error={errores.nombre}   placeholder="María García López" />
        <Campo label="DNI *"    name="dni"      value={form.dni}      onChange={cambiar} error={errores.dni}      placeholder="12345678" />
      </div>
      <div className="fila">
        <Campo label="Teléfono *" name="telefono" value={form.telefono} onChange={cambiar} error={errores.telefono} placeholder="612345678" />
        <Campo label="Email"      name="email"    value={form.email}    onChange={cambiar} error={errores.email}    placeholder="nombre@email.com" type="email" />
      </div>

      <p style={{ fontSize: 11, color: 'var(--texto-muted)', marginTop: 4 }}>
        * Campos obligatorios. El email es opcional.
      </p>

      {errorCrear && <ErrorMsg msg={errorCrear} />}

      <div className="row mt-10">
        <button type="submit" className="btn btn-primario" disabled={cargandoCrear}>
          {cargandoCrear ? 'Guardando...' : 'Registrar y continuar →'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => reiniciarFormulario(form.matricula)}>
          ← Volver
        </button>
      </div>
    </form>
  )

  // ── Buscador inicial ─────────────────────────────────────

  return (
    <>
      <div className="buscador">
        <div className="campo">
          <label>Matrícula del vehículo</label>
          <input
            value={matriculaBusq}
            onChange={e => { setMatriculaBusq(e.target.value.toUpperCase()); setErrorBusq(null) }}
            onKeyDown={e => e.key === 'Enter' && buscar()}
            placeholder="1234-ABC"
            style={{ textTransform: 'uppercase', fontFamily: 'var(--fuente-mono)', letterSpacing: '.06em' }}
          />
        </div>
        <button className="btn btn-primario" onClick={buscar} disabled={cargando || !matriculaBusq.trim()}>
          {cargando ? '...' : 'Buscar'}
        </button>
      </div>
      {errorBusq && <ErrorMsg msg={errorBusq} />}
      <p style={{ fontSize: 12, color: 'var(--texto-muted)', marginTop: 8 }}>
        Si el vehículo no está registrado, podrás darlo de alta tras la búsqueda.
      </p>
    </>
  )
}

// ── Auxiliares ───────────────────────────────────────────────

function Seccion({ label }) {
  return (
    <div style={{ borderBottom: '1px solid var(--borde)', margin: '14px 0 12px', paddingBottom: 4 }}>
      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--texto-sub)' }}>
        {label}
      </span>
    </div>
  )
}

function Campo({ label, name, value, onChange, error, placeholder, type = 'text' }) {
  return (
    <div className="campo">
      <label>{label}</label>
      <input
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
        style={error ? { borderColor: 'var(--rojo)' } : {}}
      />
      {error && (
        <span style={{ fontSize: 11, color: 'var(--rojo)', marginTop: 2 }}>
          {error}
        </span>
      )}
    </div>
  )
}

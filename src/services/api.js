/**
 * api.js — Capa de comunicación con el backend.
 * Todos los fetch del proyecto pasan por aquí.
 * El resto de componentes nunca llama a fetch directamente.
 *
 * Base URL: /api  (redirigida a localhost:8080 por el proxy de Vite)
 */

const URL_BASE = '/api'

// ─── utilidad interna ──

// Tiempo máximo de espera por petición. Si la BD está caída, el backend
// puede tardar mucho en devolver el error de conexión a MySQL — con esto
// el frontend no se queda colgado esperando, avisa antes.
const TIMEOUT_MS = 8000

async function manejarRespuesta(res) {
  if (!res.ok) {
    // El backend devuelve { mensaje, status, timestamp }
    let texto = `Error ${res.status}`
    try {
      const body = await res.json()
      if (body?.mensaje) texto = body.mensaje
      else if (body?.message) texto = body.message
    } catch {
      // la respuesta no era JSON
    }
    throw new Error(texto)
  }
  if (res.status === 204) return null   // DELETE sin cuerpo
  return res.json()
}

async function peticion(url, opciones = {}) {
  try {
    const res = await fetch(url, { ...opciones, signal: AbortSignal.timeout(TIMEOUT_MS) })
    return await manejarRespuesta(res)
  } catch (err) {
    // Timeout — el servidor no respondió a tiempo (p.ej. la BD está caída)
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      throw new Error('El servidor no responde. Comprueba que el backend y la base de datos están en marcha.')
    }
    // Error de red — el backend no está arrancado en absoluto
    if (err.message === 'Failed to fetch' || err.message.includes('NetworkError')) {
      throw new Error('No hay conexión con el servidor. Comprueba que el backend está corriendo en el puerto 8080.')
    }
    // Cualquier otro error (p.ej. el mensaje ya formateado de manejarRespuesta)
    throw err
  }
}

const JSON_HEADERS = { 'Content-Type': 'application/json' }

// ─── CLIENTES ──

export const clienteApi = {
  listar:   ()      => peticion(`${URL_BASE}/clientes`),
  buscar:   (id)    => peticion(`${URL_BASE}/clientes/${id}`),
  vehiculos:(id)    => peticion(`${URL_BASE}/clientes/${id}/vehiculos`),
  crear:    (dto)   => peticion(`${URL_BASE}/clientes`, { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(dto) }),
  actualizar: (id, dto) => peticion(`${URL_BASE}/clientes/${id}`, { method: 'PUT', headers: JSON_HEADERS, body: JSON.stringify(dto) }),
}

// ─── VEHÍCULOS ──

export const vehiculoApi = {
  listar:          ()          => peticion(`${URL_BASE}/vehiculos`),
  buscarMatricula: (matricula) => peticion(`${URL_BASE}/vehiculos/matricula/${encodeURIComponent(matricula)}`),
  crear:           (dto)       => peticion(`${URL_BASE}/vehiculos`, { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(dto) }),
}

// ─── SERVICIOS ──

export const servicioApi = {
  listar: ({ activo, categoriaId } = {}) => {
    const p = new URLSearchParams()
    if (activo !== undefined) p.set('activo', activo)
    if (categoriaId)          p.set('categoria', categoriaId)
    const q = p.toString() ? `?${p}` : ''
    return peticion(`${URL_BASE}/servicios${q}`)
  },
}

// ─── CATEGORÍAS ──

export const categoriaApi = {
  listar: () => peticion(`${URL_BASE}/categorias`),
}

// ─── PUESTOS ──

export const puestoApi = {
  listar: () => peticion(`${URL_BASE}/puestos`),
}

// ─── ÓRDENES ──

export const ordenApi = {
  listar:       (estado)        => peticion(`${URL_BASE}/ordenes${estado ? `?estado=${estado}` : ''}`),
  buscar:       (id)            => peticion(`${URL_BASE}/ordenes/${id}`),
  buscarCodigo: (codigo)        => peticion(`${URL_BASE}/ordenes/codigo/${encodeURIComponent(codigo)}`),
  crear:        (dto)           => peticion(`${URL_BASE}/ordenes`, { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(dto) }),
  añadirServicio: (id, dto)     => peticion(`${URL_BASE}/ordenes/${id}/servicios`, { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(dto) }),
  quitarServicio: (id, svcId)   => peticion(`${URL_BASE}/ordenes/${id}/servicios/${svcId}`, { method: 'DELETE' }),
  cambiarEstado:  (id, estado)  => peticion(`${URL_BASE}/ordenes/${id}/estado`, { method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({ estado }) }),
  actualizarObservaciones: (id, observaciones) => peticion(`${URL_BASE}/ordenes/${id}/observaciones`, { method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({ observaciones }) }),
}

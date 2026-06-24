// Funciones de validación reutilizables

export function validarMatricula(v) {
  return /^\d{4}-[A-Z]{3}$/i.test(v.trim())
}

export function validarDNI(v) {
  return /^\d{8}[A-Za-z]$/.test(v.trim())
}

export function validarNombre(v) {
  return v.trim().length >= 3 && /^[a-záéíóúñüA-ZÁÉÍÓÚÑÜ\s'-]+$/i.test(v.trim())
}

export function validarTelefono(v) {
  return /^[679]\d{8}$/.test(v.trim())
}

export function validarEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
}

export function validarAnio(v) {
  const n = Number(v)
  return Number.isInteger(n) && n >= 1900 && n <= new Date().getFullYear()
}

// Devuelve objeto { campo: 'mensaje de error' } con los errores encontrados
export function validarFormCliente({ nombre, dni, telefono, email }) {
  const e = {}
  if (!validarNombre(nombre))    e.nombre    = 'Mínimo 3 letras, solo letras y espacios'
  if (dni && !validarDNI(dni))   e.dni       = 'Formato: 12345678A (8 números + letra)'
  if (telefono && !validarTelefono(telefono)) e.telefono = 'Debe tener 9 dígitos y empezar por 6, 7 o 9'
  if (email && !validarEmail(email))          e.email    = 'Formato: nombre@dominio.com'
  return e
}

export function validarFormVehiculo({ matricula, marca, modelo, anio }) {
  const e = {}
  if (!validarMatricula(matricula)) e.matricula = 'Formato: 1234-ABC'
  if (!marca || marca.trim().length < 2)  e.marca  = 'Introduce la marca'
  if (!modelo || modelo.trim().length < 1) e.modelo = 'Introduce el modelo'
  if (anio && !validarAnio(anio)) e.anio = `Año entre 1900 y ${new Date().getFullYear()}`
  return e
}

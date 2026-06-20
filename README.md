# Taller Mecánico — Frontend React

Frontend del sistema de gestión de un taller mecánico, desarrollado en **React + Vite**.
Actúa como interfaz visual para los roles del sistema: recepción, taller y sala de espera.
Se limita a consumir la API REST del backend, sin lógica de negocio propia.

---

## Descripción

El frontend no accede a ninguna base de datos ni realiza lógica de negocio.
Su única responsabilidad es mostrar la información devuelta por el backend y
permitir la interacción del usuario mediante llamadas HTTP.

Toda la comunicación con la API está centralizada en `src/services/api.js`.

---

## Vistas implementadas

### 🛠 Recepción (`/`)
Flujo guiado en 5 pasos para dar entrada a un vehículo:

1. Buscar cliente por DNI (o crear uno nuevo)
2. Buscar vehículo por matrícula (o registrarlo)
3. Seleccionar puesto y crear la orden de trabajo
4. Añadir servicios desde el catálogo (filtrable por categoría)
5. Pantalla de éxito con el código de la orden

El resumen con servicios y total se actualiza en tiempo real en el panel lateral.

### 🔩 Taller (`/taller`)
Panel de gestión de órdenes activas, organizado en tres pestañas:

| Pestaña | Estado |
|---------|--------|
| Recibidos | `RECIBIDO` |
| En Revisión | `EN_REVISION` |
| En Reparación | `EN_REPARACION` |

Cada tarjeta muestra código, vehículo, cliente, puesto, servicios y el botón para
avanzar al siguiente estado del flujo.

### 🔔 Pantalla de Recogida (`/pantalla`)
Pantalla para la sala de espera. Muestra los códigos de las órdenes en estado `LISTO`.
Se actualiza automáticamente cada 30 segundos.

---

## Flujo de estados

```
RECIBIDO → EN_REVISION → EN_REPARACION → LISTO → ENTREGADO
                                            ↑
                                    aparece en Pantalla
```

Los estados solo avanzan; nunca retroceden (validado por el backend).

---

## Endpoints consumidos

| Vista | Método | Endpoint | Uso |
|-------|--------|----------|-----|
| Recepción | GET | `/api/clientes` | Buscar cliente por DNI |
| Recepción | POST | `/api/clientes` | Crear cliente |
| Recepción | GET | `/api/vehiculos/matricula/{m}` | Buscar vehículo |
| Recepción | POST | `/api/vehiculos` | Registrar vehículo |
| Recepción | GET | `/api/puestos` | Listar puestos |
| Recepción | GET | `/api/servicios?activo=true` | Catálogo de servicios |
| Recepción | GET | `/api/categorias` | Categorías para filtrar |
| Recepción | POST | `/api/ordenes` | Crear orden |
| Recepción | POST | `/api/ordenes/{id}/servicios` | Añadir servicio |
| Recepción | DELETE | `/api/ordenes/{id}/servicios/{svcId}` | Quitar servicio |
| Taller | GET | `/api/ordenes?estado=RECIBIDO` | Órdenes recibidas |
| Taller | GET | `/api/ordenes?estado=EN_REVISION` | En revisión |
| Taller | GET | `/api/ordenes?estado=EN_REPARACION` | En reparación |
| Taller | PATCH | `/api/ordenes/{id}/estado` | Cambiar estado |
| Pantalla | GET | `/api/ordenes?estado=LISTO` | Órdenes listas |

---

## Flujo de usuario

```
                  ┌── Recepción ───────────────────────────────────┐
                  │  Busca DNI → cliente                           │
                  │  Busca matrícula → vehículo                    │
                  │  Elige puesto → crea orden → código generado   │
                  │  Añade servicios del catálogo                  │
                  └────────────────────────────────────────────────┘
                                       │ orden en RECIBIDO
                  ┌── Taller ──────────▼───────────────────────────┐
                  │  Mecánico ve la orden → pulsa "Iniciar rev."   │
                  │  EN_REVISION → "Iniciar reparación"            │
                  │  EN_REPARACION → "Marcar listo"                │
                  └───────────────────────┬────────────────────────┘
                                          │ orden en LISTO
                  ┌── Pantalla ───────────▼───────────────────────┐
                  │  El código aparece en la pantalla de espera   │
                  │  El cliente acude a recepción a recoger       │
                  └───────────────────────────────────────────────┘
```

---

## Tecnologías

| Tecnología | Uso |
|-----------|-----|
| React 18 | Interfaz declarativa con componentes |
| Vite 5 | Bundler, dev server y proxy de API |
| React Router 6 | Enrutado SPA |
| Fetch API (nativa) | Llamadas HTTP al backend |
| CSS puro | Estilos con variables CSS, sin frameworks |

Sin dependencias externas de UI. Sin llamadas a APIs de terceros.

---

## Estructura del proyecto

```
src/
├── services/
│   └── api.js                   ← toda la comunicación HTTP
├── components/
│   ├── shared/
│   │   └── Shared.jsx           ← ErrorMsg, Spinner, BadgeEstado
│   ├── recepcion/
│   │   ├── PasoCliente.jsx      ← buscar/crear cliente
│   │   ├── PasoVehiculo.jsx     ← buscar/registrar vehículo
│   │   ├── PasoOrden.jsx        ← seleccionar puesto y crear orden
│   │   ├── CatalogoServicios.jsx← catálogo filtrable de servicios
│   │   └── ResumenOrden.jsx     ← panel lateral con total en tiempo real
│   └── taller/
│       └── TarjetaOrden.jsx     ← tarjeta con botón de avance de estado
└── pages/
    ├── Recepcion.jsx            ← flujo de 5 pasos
    ├── Taller.jsx               ← tabs por estado
    └── Pantalla.jsx             ← auto-refresco cada 30s
```

---

## Manejo de errores

- Todos los errores HTTP se centralizan en `api.js → manejarRespuesta`.
- El backend devuelve `{ mensaje, status, timestamp }`; el frontend muestra el campo `mensaje`.
- Los errores de red (backend apagado) muestran: *"No hay conexión con el servidor."*
- Los errores se muestran localmente en el componente que originó la llamada.
- Ningún error rompe la aplicación; el usuario puede reintentar.

---

## Cómo ejecutar

### Requisitos
- Node.js 18+
- Backend Spring Boot corriendo en `http://localhost:8080`
- Base de datos MySQL con la BD `taller_mecanico` creada

### Pasos

```bash
# 1. Instalar dependencias (solo la primera vez)
npm install

# 2. Arrancar en modo desarrollo
npm run dev
```

Abre `http://localhost:5173` en el navegador.

> El proxy de Vite redirige `/api/*` → `http://localhost:8080/api/*` automáticamente.
> No hace falta configurar CORS manualmente.

### Datos iniciales necesarios (via Postman o Swagger)

Antes de usar el frontend, el backend necesita al menos:

```
POST /api/puestos    → { "nombre": "Recepción", "tipo": "TALLER" }
POST /api/categorias → { "nombre": "Mecánica general" }
POST /api/servicios  → { "nombre": "Cambio de aceite", "precio": 49.90, "categoriaId": 1 }
```

---

## Suposiciones y limitaciones

- No hay autenticación (tal como especifica el enunciado).
- La búsqueda de clientes por DNI lista todos los clientes y filtra en el frontend, porque el backend no expone un endpoint de búsqueda por DNI.
- La Vista Taller requiere actualización manual con el botón "↻ Actualizar".
- Solo la Pantalla de Recogida se refresca automáticamente.
- Sin paginación (asumido volumen reducido de datos).

---

## Posibles mejoras

- Búsqueda por DNI en el backend (endpoint dedicado) para evitar traer todos los clientes.
- Auto-refresco también en la Vista Taller (WebSocket o polling).
- Vista de historial: órdenes en estado `ENTREGADO`.
- Campo de búsqueda por código para que el cliente consulte su estado desde recepción.
- Tests con Vitest + React Testing Library.

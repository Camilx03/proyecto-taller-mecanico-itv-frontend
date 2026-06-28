# Taller Mecánico / ITV — Frontend React

Frontend del sistema de gestión de un taller mecánico e ITV, desarrollado en **React + Vite**.
Actúa como interfaz visual para los tres roles implícitos del sistema: recepción, taller y pantalla de sala de espera.

El frontend **no contiene lógica de negocio**. Se limita a consumir los endpoints definidos por el backend, mostrar la información obtenida y permitir la interacción del usuario mediante llamadas HTTP. De este modo se refuerza la separación de responsabilidades entre frontend y backend.

El diseño parte de los endpoints ya implementados en el Proyecto I, adaptándose a su estructura y a los DTOs expuestos por la API, sin asumir conocimiento directo del modelo de persistencia.

---

## Vistas implementadas

El proyecto personaliza el backend para el dominio real de un taller mecánico con línea de ITV. Las vistas del enunciado se adaptan de la siguiente manera:

| Enunciado (ejemplo genérico) | Este proyecto (taller mecánico) |
|------------------------------|----------------------------------|
| 🖥️ Vista Terminal | 🛠 Recepción (`/`) |
| 🍳 Vista Cocina | 🔩 Taller (`/taller`) |
| 📢 Vista Pantalla de recogida | 🔔 Pantalla de Recogida (`/pantalla`) |


---

### 🛠 Recepción — Vista Terminal

Equivale a la Vista Terminal del enunciado. Permite crear una orden de trabajo (equivalente a un pedido) con su código único al finalizar.

Flujo guiado en 3 pasos:

1. **Buscar vehículo por matrícula**
   - Si existe → confirmar datos del cliente, ver historial de vehículos del cliente
   - Si no existe → dar de alta vehículo vinculado a un cliente existente (búsqueda por DNI) o a un cliente nuevo
2. **Seleccionar puesto y observaciones → crear la orden**
3. **Pantalla de éxito con el código único generado** para entregar al cliente

Funcionalidades adicionales:
- Cálculo automático de la letra del DNI al escribir los 8 números
- Validaciones en todos los campos (DNI, nombre, teléfono, email, matrícula, año)
- Opción de actualizar teléfono/email del cliente desde esta misma vista

---

### 🔩 Taller — Vista Cocina

Equivale a la Vista Cocina del enunciado. Gestiona las órdenes activas y permite cambiar su estado.

Panel organizado en cinco pestañas:

| Pestaña | Estado |
|---------|--------|
| Recibidos | `RECIBIDO` |
| En Revisión | `EN_REVISION` |
| En Reparación | `EN_REPARACION` |
| Listos | `LISTO` |
| Historial | `ENTREGADO` |

Cada tarjeta de orden muestra:
- Vehículo, matrícula, cliente, puesto y tiempo de espera en vivo
- Badge visual que distingue órdenes **TALLER** e **ITV**
- Aviso en rojo si la orden lleva más de 2 horas sin avanzar
- Detalle de servicios con cantidades y subtotales (expandible)
- Catálogo de servicios con filtro por categoría y selector de cantidad para añadir
- Botón para quitar servicios de la orden
- Editor de observaciones técnicas del mecánico
- Botón para avanzar al siguiente estado del flujo

La vista se **auto-refresca cada 30 segundos en segundo plano** sin interrumpir la interacción.

---

### 🔔 Pantalla de Recogida — Vista Pantalla

Equivale a la Vista Pantalla de recogida del enunciado. Diseñada para mostrarse en un monitor de sala de espera.

- Se actualiza automáticamente cada 30 segundos
- **Columna izquierda** — vehículos en proceso con su estado actual y observaciones
- **Columna derecha** — vehículos en estado `LISTO` con el código grande y visible, ordenados por fecha de entrada
- Reloj en tiempo real
- Botón de pantalla completa

---

## Endpoints

| Vista | Método | Endpoint | Uso |
|-------|--------|----------|-----|
| Recepción | GET | `/api/clientes` | Buscar cliente por DNI |
| Recepción | POST | `/api/clientes` | Crear cliente nuevo |
| Recepción | PUT | `/api/clientes/{id}` | Actualizar contacto del cliente |
| Recepción | GET | `/api/clientes/{id}/vehiculos` | Ver otros vehículos del cliente |
| Recepción | GET | `/api/vehiculos/matricula/{m}` | Buscar vehículo por matrícula |
| Recepción | POST | `/api/vehiculos` | Registrar vehículo nuevo |
| Recepción | GET | `/api/puestos` | Listar puestos disponibles |
| Recepción | POST | `/api/ordenes` | Crear orden de trabajo |
| Taller | GET | `/api/ordenes?estado=RECIBIDO` | Órdenes recibidas |
| Taller | GET | `/api/ordenes?estado=EN_REVISION` | Órdenes en revisión |
| Taller | GET | `/api/ordenes?estado=EN_REPARACION` | Órdenes en reparación |
| Taller | GET | `/api/ordenes?estado=LISTO` | Órdenes listas para recoger |
| Taller | GET | `/api/ordenes?estado=ENTREGADO` | Historial de órdenes entregadas |
| Taller | PATCH | `/api/ordenes/{id}/estado` | Cambiar estado de la orden |
| Taller | PATCH | `/api/ordenes/{id}/observaciones` | Guardar observaciones del mecánico |
| Taller | GET | `/api/servicios?activo=true` | Catálogo de servicios disponibles |
| Taller | GET | `/api/categorias` | Categorías para filtrar el catálogo |
| Taller | POST | `/api/ordenes/{id}/servicios` | Añadir servicio a la orden |
| Taller | DELETE | `/api/ordenes/{id}/servicios/{sid}` | Quitar servicio de la orden |
| Pantalla | GET | `/api/ordenes?estado=RECIBIDO` | Vehículos en proceso |
| Pantalla | GET | `/api/ordenes?estado=EN_REVISION` | Vehículos en proceso |
| Pantalla | GET | `/api/ordenes?estado=EN_REPARACION` | Vehículos en proceso |
| Pantalla | GET | `/api/ordenes?estado=LISTO` | Vehículos listos para recoger |
| Global (barra nav) | GET | `/api/ordenes/codigo/{codigo}` | Buscador global por código de orden |

---

## Flujo de usuario

```
         ┌── Recepción ───────────────────────────────────────────────┐
         │  Busca matrícula → identifica vehículo y cliente           │
         │  Selecciona puesto → crea orden → entrega código al cliente│
         └────────────────────────────────────────────────────────────┘
                              │ orden en RECIBIDO
         ┌── Taller ──────────▼───────────────────────────────────────┐
         │  Mecánico ve la orden → añade servicios del catálogo       │
         │  Pulsa "Iniciar revisión"   → EN_REVISION                  │
         │  Pulsa "Iniciar reparación" → EN_REPARACION                │
         │  Pulsa "Marcar listo"       → LISTO                        │
         └──────────────────────────┬─────────────────────────────────┘
                                    │ orden en LISTO
         ┌── Pantalla ──────────────▼─────────────────────────────────┐
         │  Código aparece en columna "Listos para recoger"           │
         │  El cliente acude a recepción a recoger su vehículo        │
         └──────────────────────────┬─────────────────────────────────┘
                                    │ recepcionista confirma recogida
         ┌── Taller (pestaña Listos)─▼─────────────────────────────── ┐
         │  Se pulsa "Marcar entregado" → ENTREGADO                   │
         │  La orden pasa al Historial y desaparece de la Pantalla    │
         └────────────────────────────────────────────────────────────┘
```

---

## Tecnologías utilizadas

| Tecnología | Versión | Uso |
|------------|---------|-----|
| React | 18 | Interfaz declarativa con componentes funcionales |
| Vite | 5 | Bundler, dev server y proxy inverso hacia el backend |
| React Router DOM | 6 | Enrutado SPA — tres rutas principales |
| Fetch API (nativa) | — | Llamadas HTTP al backend, sin librerías externas |
| CSS puro | — | Variables CSS, sin frameworks ni dependencias de UI |

Sin dependencias de UI externas. Sin llamadas a APIs de terceros. Sin fuentes externas.

---

## Estructura del proyecto

```
src/
├── services/
│   └── api.js                     ← toda la comunicación HTTP centralizada.
│                                    Ningún componente llama a fetch directamente.
├── utils/
│   └── validaciones.js            ← funciones de validación reutilizables
│                                    (DNI con letra automática, teléfono, email, matrícula...)
├── components/                    ← componentes organizados por responsabilidad
│   ├── shared/
│   │   └── Shared.jsx             ← ErrorMsg, Spinner, BadgeEstado (reutilizables en todas las vistas)
│   ├── recepcion/
│   │   ├── BuscarOCrear.jsx       ← flujo matrícula → cliente → alta si no existe
│   │   ├── CatalogoServicios.jsx  ← catálogo filtrable con selector de cantidad
│   │   ├── PasoOrden.jsx          ← selección de puesto y creación de orden
│   │   └── ResumenOrden.jsx       ← panel lateral con servicios y total en tiempo real
│   └── taller/
│       └── TarjetaOrden.jsx       ← tarjeta con servicios, observaciones y avance de estado
└── pages/                         ← una página por vista, asociada a su ruta
    ├── Recepcion.jsx              ← flujo guiado de 3 pasos  →  /
    ├── Taller.jsx                 ← tabs por estado con auto-refresco  →  /taller
    └── Pantalla.jsx               ← dos columnas, reloj, pantalla completa  →  /pantalla
```

---

## Consideraciones técnicas

- **`fetch` nativo** para toda la comunicación HTTP — sin axios ni dependencias adicionales
- **React Router v6** para el enrutado SPA — tres rutas: `/`, `/taller`, `/pantalla`
- **`useState`** para gestionar el estado local de cada componente: formularios, listas de datos, mensajes de error, modales de confirmación
- **`useEffect`** para efectos secundarios: carga inicial de datos al montar el componente, auto-refresco periódico, sincronización de props con estado local
- **`useCallback`** para memoizar funciones de carga y evitar re-renders innecesarios en el refresco de Taller
- **Separación de componentes por responsabilidad**: cada componente tiene una única función y recibe lo que necesita por props — ninguno mezcla lógica de presentación con llamadas HTTP
- **Sin autenticación** — tal como especifica el enunciado
- **Fácilmente extensible**: añadir un nuevo estado solo requiere una entrada en el array de tabs de `Taller.jsx`; añadir una nueva vista requiere un componente en `pages/` y una ruta en `App.jsx`

---

## Manejo de errores

- Todos los errores HTTP se centralizan en `api.js → manejarRespuesta`
- El backend devuelve `{ mensaje, status, timestamp }` — el frontend extrae y muestra el campo `mensaje` al usuario
- Las peticiones tienen un **timeout de 8 segundos**: si el servidor no responde (por ejemplo cuando MySQL está caído) se avisa inmediatamente en vez de quedarse colgado
- **Error de red** → *"No hay conexión con el servidor. Comprueba que el backend está corriendo en el puerto 8080."*
- **Error de timeout** → *"El servidor no responde. Comprueba que el backend y la base de datos están en marcha."*
- Los errores se muestran localmente junto al componente que los originó — nunca rompen la aplicación entera
- Si la carga inicial de Taller falla, se muestra un botón **"↻ Reintentar"** en vez de dejar la pantalla en blanco

---

## Cómo ejecutar la aplicación

### Requisitos previos
- Node.js 18+
- Backend Spring Boot (Proyecto I) corriendo en `http://localhost:8080`
- Base de datos MySQL con la base de datos `taller_mecanico` creada

### Pasos

```bash
# 1. Instalar dependencias (solo la primera vez)
npm install

# 2. Arrancar en modo desarrollo
npm run dev
```

Abre `http://localhost:5173` en el navegador.

El proxy de Vite redirige automáticamente `/api/*` → `http://localhost:8080/api/*`, por lo que no hace falta configurar CORS en desarrollo.

---

## Solución de problemas frecuentes

### El frontend muestra "Sin conexión" en la barra superior

El backend no está corriendo o MySQL no está arrancado.

1. Abre **XAMPP Control Panel** y pulsa **Start** junto a **MySQL**
2. En la terminal del backend ejecuta `./mvnw spring-boot:run`
3. Espera a ver `Tomcat started on port 8080` antes de usar el frontend

### Error: `Port 8080 was already in use`

El backend ya estaba corriendo de antes. Encuentra y mata el proceso:

```powershell
netstat -ano | findstr :8080
taskkill /PID <numero_de_la_linea_LISTENING> /F
./mvnw spring-boot:run
```

### Error: `Communications link failure`

MySQL no está arrancado o el puerto no coincide. Comprueba que MySQL está en marcha en XAMPP. Si tu instalación usa el puerto **3307**, edita `src/main/resources/application.properties` en el backend:

```properties
spring.datasource.url=jdbc:mysql://localhost:3307/taller_mecanico
```

Y crea la base de datos si no existe desde phpMyAdmin (`http://localhost/phpmyadmin`):

```sql
CREATE DATABASE IF NOT EXISTS taller_mecanico;
```

### Error `ECONNREFUSED` en la terminal de Vite

No es un error del frontend. Significa que intentó hacer una petición con el backend apagado. Arranca el backend y desaparecerá solo.

---

## Posibles mejoras

- Exponer `DELETE /api/ordenes/{id}` en el backend para permitir cancelar órdenes creadas por error desde Recepción
- Endpoint de búsqueda de clientes por DNI en el backend para evitar traer la lista completa
- Vista de búsqueda por código en Recepción para localizar rápido una orden cuando el cliente llega a recoger
- Paginación y búsqueda server-side para escalar con grandes volúmenes de datos
- Notificaciones en tiempo real mediante WebSocket en vez de polling periódico
- Tests con Vitest + React Testing Library
- Modo claro como alternativa al tema oscuro actual

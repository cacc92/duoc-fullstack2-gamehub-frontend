# GameHub Store · Frontend

Interfaz de la tienda con **React 19**, **React Router**, **Bootstrap 5** y **Vite**. Consume la API del backend Spring Boot con JWT y tiene sus pruebas unitarias con **Jasmine + Karma**.

## Requisitos

- Node.js 20.19 o superior (o 22.12+), que es lo que exige Vite 8.
- El backend corriendo: su API Gateway responde en http://localhost:8080 (ver [`../backend/README.md`](../backend/README.md)).
- Google Chrome para las pruebas (Karma abre Chrome sin interfaz).

> Copia el proyecto a una carpeta local antes de `npm install`: dentro de Google Drive, `node_modules` se sincroniza sin parar y la instalación puede quedar corrupta.

## Scripts

```bash
npm install
```

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo en http://localhost:5173 |
| `npm run build` | Compila la versión de producción en `dist/` |
| `npm run preview` | Sirve `dist/` para revisarla |
| `npm run lint` | Revisa el código con oxlint (incluye las reglas de hooks de React) |
| `npm test` | Corre las pruebas una vez con Karma y genera la cobertura |
| `npm run test:watch` | Deja Karma mirando los cambios |

### Variables de entorno

Copia `.env.example` como `.env`. La única variable es la URL del backend:

```
VITE_API_URL=http://localhost:8080
```

Si no existe, en desarrollo se usa `http://localhost:8080`.

## Estructura

```
src/
├── main.jsx              BrowserRouter, AuthProvider, CarritoProvider y estilos
├── App.jsx               Rutas; las protegidas van dentro de <RutaProtegida rol="...">
├── config.js             API_URL desde VITE_API_URL
├── pages/                Una vista por archivo: Inicio, Catalogo, DetalleProducto, Carrito, Checkout,
│                         Confirmacion, MisOrdenes, Acceso, PanelOperador, PanelAdmin, NoEncontrado
├── components/           Piezas reutilizables (TarjetaProducto, ResumenCarrito, FormularioCheckout…)
│   ├── operador/         Bandeja de órdenes, despachos, stock y garantías
│   └── admin/            Productos, categorías, promociones, reseñas y usuarios
├── context/              Sesión (useAuth) y carrito (useCarrito), cada uno con su Provider
├── hooks/useCarga.js     Carga datos y entrega { datos, cargando, error, recargar }
├── services/             Llamadas a la API: api.js (solicitar), sesion.js y un archivo por área
├── logica/               Funciones puras: carrito, validaciones, formatos, estados, rutas por rol, postventa
├── data/                 Regiones y comunas, textos de la portada
├── styles/               tema.css (paleta «Núcleo» sobre Bootstrap) y app.css (componentes)
└── pruebas/              Ayudas para montar componentes y el doble de config.js
```

## Cómo se conecta con el backend

- **Un solo destino**: `VITE_API_URL` apunta al API Gateway, que reparte cada ruta `/api/...` entre los 11 microservicios. El frontend no conoce sus puertos.
- **Vistas que juntan varios microservicios**, como pide el caso: `services/catalogo.js` completa cada producto con su stock (inventory-service) y su puntaje (review-service); `services/ordenes.js` junta la orden con las reseñas y garantías del cliente usando `logica/postventa.js`; `services/operador.js` suma las garantías abiertas, y `services/admin.js`, el stock de cada producto. Las vistas reciben los datos ya combinados.
- **Una sola puerta de salida**: `services/api.js` exporta `solicitar(ruta, { metodo, cuerpo, sesion }, traer = fetch)`. Arma la URL, agrega `Authorization: Bearer <token>` y convierte cada error en un `ErrorApi` con `estado`, `message` y `errores` por campo.
- **Mensajes por código**: si el backend no manda `mensaje`, se usa uno propio para 400, 401, 403, 404, 409 y 500. Sin conexión, el estado es `0` y el mensaje lo explica.
- **Sesión**: al ingresar se guarda `{ token, usuario }` en `localStorage` con la clave `sesion`, por eso la sesión sobrevive a una recarga. `sesion.js` lee el vencimiento (`exp`) del payload del JWT y descarta un token vencido.
- **Renovación y vencimiento**: `AuthProvider` pide un token nuevo (`/api/auth/renovar`) antes de que venza y cierra la sesión justo al vencer. Si la API responde 401 a una petición con token, `solicitar` emite el evento `sesion-expirada` y la cabecera muestra «Tu sesión expiró».
- **Rutas por rol**: `RutaProtegida` envía a `/acceso` cuando no hay sesión (recordando a dónde se quería ir) y muestra un aviso si el rol no corresponde. Después de ingresar, `logica/rutas.js` decide a qué vista va cada rol.

## Pruebas unitarias

```bash
npm test
```

Si Karma no encuentra Chrome, indica dónde está (ejemplo en macOS):

```bash
CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm test
```

El entorno usa **karma**, **karma-jasmine**, **jasmine-core**, **karma-chrome-launcher**, **karma-webpack**, **babel-loader** con `@babel/preset-react` y **karma-coverage** (`karma.conf.cjs` y `babel.config.cjs`). Los componentes se montan con `react-dom/client` dentro de `act()` (`src/pruebas/montar.js`). En las vistas que llaman a la API, `esperarRespuestas()` deja terminar las promesas del `fetch` simulado y aplica sus cambios dentro de `act()`. Como `config.js` usa `import.meta.env` de Vite, en las pruebas webpack lo reemplaza por `src/pruebas/config.prueba.js`.

### Las 10 pruebas obligatorias (sección 9 del caso)

Cada `it` lleva el número del listado para encontrarlo rápido en la salida de Karma.

| N° | Qué verifica | Archivo |
| --- | --- | --- |
| 1 | `calcularSubtotal` suma precio × cantidad de todas las líneas | `src/logica/carrito.spec.js` |
| 2 | `agregarAlCarrito` incrementa la cantidad en vez de duplicar la línea | `src/logica/carrito.spec.js` |
| 3 | `validarStock` impide una cantidad mayor al stock | `src/logica/carrito.spec.js` |
| 4 | `aplicarCupon` calcula el porcentaje y respeta el tope | `src/logica/carrito.spec.js` |
| 5 | `cuponVigente` rechaza un cupón fuera de su rango de fechas | `src/logica/carrito.spec.js` |
| 6 | `calcularTotal` resta el descuento y nunca da un total negativo | `src/logica/carrito.spec.js` |
| 7 | `TarjetaProducto` muestra nombre, precio y el aviso sin stock | `src/components/TarjetaProducto.spec.jsx` |
| 8 | `ResumenCarrito` muestra el mensaje de carrito vacío | `src/components/ResumenCarrito.spec.jsx` |
| 9 | `FormularioCheckout` no deja enviar sin dirección (espía sobre `onConfirmar`) | `src/components/FormularioCheckout.spec.jsx` |
| 10 | `ListaResenas` ordena por fecha descendente y calcula el promedio | `src/components/ListaResenas.spec.jsx` |

### Pruebas adicionales

| Archivo | Qué verifica | Doble de prueba |
| --- | --- | --- |
| `src/services/api.spec.js` | URL, token y cuerpo JSON; errores 400 con campos; 401 que cierra la sesión; sin conexión; el mensaje propio de cada código (`mensajePorEstado`) | `jasmine.createSpy` en lugar de `fetch`, `spyOn(window, 'dispatchEvent')` |
| `src/services/sesion.spec.js` | Lee una sesión vigente y borra un token vencido | Almacén falso en lugar de `localStorage`, hora fija |
| `src/services/catalogo.spec.js` | Cada producto con su stock (inventory-service) y su puntaje (review-service); el catálogo se muestra sin estrellas si review-service no responde | `spyOn(window, 'fetch')` que responde según la ruta |
| `src/components/BotonCopiar.spec.jsx` | «¡Copiado!» dura dos segundos | `jasmine.clock()` y un espía en lugar del portapapeles |
| `src/components/RutaProtegida.spec.jsx` | Redirección sin sesión y bloqueo por rol | Contexto de sesión con un valor fijo |
| `src/context/CarritoProvider.spec.jsx` | El carrito conserva su contenido al navegar entre vistas y al recargar; las acciones `actualizarCantidad`, `quitar`, `vaciar`, `guardarCupon`, `quitarCupon` y `sincronizar` | `MemoryRouter` con dos vistas; una «sonda» que lee el contexto; `localStorage` se limpia entre pruebas |
| `src/context/AuthProvider.spec.jsx` | Lee, guarda y borra la sesión; renueva el token antes de que venza y la cierra al vencer o con un 401 | `jasmine.clock()` y `spyOn(window, 'fetch')`; una «sonda» que lee el contexto |
| `src/hooks/useCarga.spec.jsx` | Los estados cargando, error y datos; recargar sin parpadeo y descartar una respuesta que llega tarde | Servicio falso: un espía o promesas que la prueba resuelve cuando quiere |
| `src/components/FormularioCheckout.spec.jsx` | Además de la prueba 9: cada campo y el método de pago, el cambio de región, el error al salir de un campo y el carrito vacío | Espía sobre `onConfirmar` |
| `src/components/TarjetaProducto.spec.jsx` | Además de la prueba 7: el botón con stock y un producto en oferta con el precio normal tachado | Espía sobre `onAgregar` |
| `src/pages/Carrito.spec.jsx` | La vista completa: revisa el carrito con `POST /api/carrito/validar` al entrar y al pagar, aplica y rechaza cupones, cambia cantidades, quita y vacía | `spyOn(window, 'fetch')` con respuestas como las del API Gateway; `CarritoProvider` real, `MemoryRouter` y una sesión fija |
| `src/pages/Checkout.spec.jsx` | La vista completa: precarga el despacho con el perfil, crea la orden con `POST /api/ordenes`, conserva el carrito si el pago se rechaza y explica un 409 de stock | `spyOn(window, 'fetch')` y `spyOn(window, 'scrollTo')`; `CarritoProvider` real, `MemoryRouter` y una sesión fija |
| `src/logica/carrito.spec.js` | Además de las pruebas 1 a 6: `cambiarCantidad` y `quitarLinea` | — |
| `src/logica/validaciones.spec.js` | Despacho (también teléfono y comuna vacíos), movimientos de stock, promociones, garantía, destino por rol, login, registro, producto, reseña, despacho del operador y categoría (repetida o de más de 60 caracteres) | — |
| `src/logica/formato.spec.js` | Montos en pesos, fechas dd-mm-aaaa, el porcentaje de una oferta y las iniciales de un nombre | — |
| `src/logica/estados.spec.js` | Los pasos de la línea de seguimiento según el estado de la orden | — |
| `src/logica/postventa.spec.js` | Qué se puede reseñar o pedir en garantía en Mis órdenes y el plazo de 6 meses | Fecha de hoy fija |

### Resultado y cobertura

Última ejecución: **111 pruebas, 111 correctas** (Chrome Headless). Cobertura de los archivos que cargan las pruebas:

| Métrica | Cobertura | Umbral mínimo |
| --- | --- | --- |
| Sentencias | 96,2 % | 96 % |
| Ramas | 86,2 % | 86 % |
| Funciones | 96,2 % | 96 % |
| Líneas | 98,1 % | 98 % |

`karma.conf.cjs` define ese umbral en `coverageReporter.check`: si la cobertura baja de cualquiera de esos mínimos, `npm test` falla aunque todas las pruebas pasen. Súbelo cuando agregues pruebas.

Al terminar, Karma deja el detalle en `coverage/html/index.html` (ábrelo en el navegador) y la tabla por archivo en `coverage/por-archivo.txt`. Sirven de base para el documento de cobertura de testing que pide EP2.

## Despliegue en Vercel

1. Importa el repositorio en Vercel y elige **Root Directory** `frontend` (Vercel detecta Vite: build `npm run build`, salida `dist`).
2. Agrega la variable `VITE_API_URL` con la URL pública del API Gateway, por ejemplo `https://gamehub-gateway.onrender.com`.
3. Agrega la URL de Vercel a `CORS_ORIGENES` en el API Gateway; si no, el navegador bloquea las peticiones en el *preflight*.

`vercel.json` reescribe todas las rutas a `index.html`, para que al recargar `/mis-ordenes` o `/producto/3` responda React Router y no un 404 de Vercel.

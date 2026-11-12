import { solicitar } from './api.js'

// Cada producto del catálogo se arma con tres microservicios: sus datos y precio (product-service), su stock
// (inventory-service) y su puntaje (review-service). Las vistas reciben el producto completo, en un solo objeto.
async function completar(productos) {
  if (productos.length === 0) return productos
  const ids = productos.map((p) => p.id).join(',')
  const [stock, resenas] = await Promise.all([
    solicitar(`/api/inventario/stock?productos=${ids}`),
    // El puntaje es un extra: si review-service no responde, el catálogo se muestra igual, sin estrellas
    solicitar(`/api/resenas/resumen?productos=${ids}`).catch(() => []),
  ])
  const stockPorId = new Map(stock.map((s) => [s.productoId, s.stock]))
  const resenasPorId = new Map(resenas.map((r) => [r.productoId, r]))
  return productos.map((p) => ({
    ...p,
    stock: stockPorId.get(p.id) ?? 0,
    puntuacion: resenasPorId.get(p.id)?.puntuacion ?? 0,
    cantidadResenas: resenasPorId.get(p.id)?.cantidad ?? 0,
  }))
}

export const listarProductos = async (categoria) =>
  completar(await solicitar(categoria ? `/api/productos?categoria=${encodeURIComponent(categoria)}` : '/api/productos'))

export const obtenerProducto = async (id) => {
  const [producto] = await completar([await solicitar(`/api/productos/${id}`)])
  return producto
}

export const listarResenas = (productoId) => solicitar(`/api/productos/${productoId}/resenas`)

export const listarCategorias = () => solicitar('/api/categorias')

export const validarCupon = (codigo) => solicitar(`/api/promociones/validar?codigo=${encodeURIComponent(codigo)}`)

// order-service revisa el carrito contra el inventario y el cupón contra promociones antes del checkout
export const validarCarrito = (lineas, cupon) =>
  solicitar('/api/carrito/validar', {
    metodo: 'POST',
    cuerpo: {
      lineas: lineas.map((l) => ({ productoId: l.productoId, cantidad: l.cantidad })),
      cupon: cupon?.codigo ?? null,
    },
  })

import { conPostventa } from '../logica/postventa.js'
import { solicitar } from './api.js'

export const crearOrden = (datos) => solicitar('/api/ordenes', { metodo: 'POST', cuerpo: datos })

export const listarMisOrdenes = () => solicitar('/api/ordenes/mias')

// El detalle junta la orden (order-service, con su pago y su despacho) con las reseñas (review-service)
// y las garantías (warranty-service) del cliente, para saber qué puede hacer con cada producto
export async function obtenerOrden(id) {
  const [orden, resenas, garantias] = await Promise.all([
    solicitar(`/api/ordenes/${id}`),
    solicitar('/api/resenas/mias'),
    solicitar('/api/garantias/mias'),
  ])
  return conPostventa(orden, resenas, garantias)
}

export const crearResena = (datos) => solicitar('/api/resenas', { metodo: 'POST', cuerpo: datos })

export const solicitarGarantia = (datos) => solicitar('/api/garantias', { metodo: 'POST', cuerpo: datos })

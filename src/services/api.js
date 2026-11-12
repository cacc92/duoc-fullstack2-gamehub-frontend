import { API_URL } from '../config.js'
import { borrarSesion, leerSesion } from './sesion.js'

// Mensajes que el usuario entiende cuando el backend no envía uno propio
const MENSAJES = {
  400: 'Revisa los datos del formulario.',
  401: 'Tu sesión no es válida. Vuelve a iniciar sesión.',
  403: 'Tu rol no tiene permiso para realizar esta acción.',
  404: 'No encontramos lo que buscas.',
  409: 'La operación no se puede hacer con el estado actual.',
  500: 'El servidor tuvo un problema. Intenta de nuevo en unos minutos.',
}

export class ErrorApi extends Error {
  constructor(estado, mensaje, errores) {
    super(mensaje)
    this.name = 'ErrorApi'
    this.estado = estado
    this.errores = errores ?? {}
  }
}

export function mensajePorEstado(estado) {
  if (MENSAJES[estado]) return MENSAJES[estado]
  return estado >= 500 ? MENSAJES[500] : 'Ocurrió un error inesperado.'
}

// Única puerta de salida hacia la API: arma la URL, agrega el token y traduce los errores.
// El tercer parámetro permite reemplazar fetch por un espía en las pruebas.
export async function solicitar(ruta, { metodo = 'GET', cuerpo, sesion = leerSesion() } = {}, traer = fetch) {
  const headers = { Accept: 'application/json' }
  if (cuerpo !== undefined) headers['Content-Type'] = 'application/json'
  if (sesion?.token) headers.Authorization = `Bearer ${sesion.token}`

  let respuesta
  try {
    respuesta = await traer(`${API_URL}${ruta}`, {
      method: metodo,
      headers,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    })
  } catch {
    throw new ErrorApi(0, 'No pudimos conectar con el servidor. Revisa tu conexión o que la API esté encendida.')
  }

  if (respuesta.status === 204) return null
  const datos = await respuesta.json().catch(() => null)

  if (!respuesta.ok) {
    // Un 401 con token significa que la sesión venció o dejó de ser válida: se cierra en todas las vistas
    if (respuesta.status === 401 && sesion?.token) {
      borrarSesion()
      window.dispatchEvent(new CustomEvent('sesion-expirada'))
    }
    throw new ErrorApi(respuesta.status, datos?.mensaje ?? mensajePorEstado(respuesta.status), datos?.errores)
  }
  return datos
}

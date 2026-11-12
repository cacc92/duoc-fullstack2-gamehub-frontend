// URL base de la API. Se define con VITE_API_URL en .env (local) o en las variables de Vercel.
// Nunca se escribe en el código: así el mismo build sirve para cada ambiente.
const url = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:8080' : '')

export const API_URL = url.replace(/\/$/, '')

import { startTransition, useCallback, useEffect, useMemo, useState } from 'react'
import { renovarSesion } from '../services/autenticacion.js'
import { borrarSesion, guardarSesion, leerSesion } from '../services/sesion.js'
import { AuthContext } from './useAuth.js'

const QUINCE_MINUTOS = 15 * 60 * 1000

export default function AuthProvider({ children }) {
  // Se lee localStorage una sola vez al montar: por eso la sesión sobrevive a la recarga
  const [sesion, setSesion] = useState(() => leerSesion())
  const [expirada, setExpirada] = useState(false)

  // React Router 8 aplica cada navegación dentro de startTransition. Entrar y salir también se aplican como
  // transición para que React los muestre en el mismo render que el cambio de ruta: si no, al cerrar sesión
  // en /admin, RutaProtegida alcanzaría a ver la ruta sin usuario y mandaría a /acceso recordando /admin.
  const entrar = useCallback((respuesta) => {
    guardarSesion(respuesta)
    startTransition(() => {
      setSesion(leerSesion())
      setExpirada(false)
    })
  }, [])

  const salir = useCallback(() => {
    borrarSesion()
    startTransition(() => setSesion(null))
  }, [])

  const cerrarAviso = useCallback(() => setExpirada(false), [])

  // solicitar() emite este evento cuando la API responde 401 a una petición que llevaba token
  useEffect(() => {
    const alExpirar = () => {
      setSesion(null)
      setExpirada(true)
    }
    window.addEventListener('sesion-expirada', alExpirar)
    return () => window.removeEventListener('sesion-expirada', alExpirar)
  }, [])

  // Renueva el token antes de que venza y, si no se pudo, cierra la sesión justo al vencer
  useEffect(() => {
    if (!sesion) return undefined
    const margen = Math.min(QUINCE_MINUTOS, (sesion.expira - sesion.emitido) / 4)
    const restante = sesion.expira - Date.now()
    const renovar = setTimeout(async () => {
      try {
        entrar(await renovarSesion())
      } catch {
        // Si la API respondió 401, solicitar() ya avisó; si no hay red, se vuelve a intentar al vencer
      }
    }, Math.max(restante - margen, 0))
    const vencer = setTimeout(() => {
      borrarSesion()
      setSesion(null)
      setExpirada(true)
    }, Math.max(restante, 0))
    return () => {
      clearTimeout(renovar)
      clearTimeout(vencer)
    }
  }, [sesion, entrar])

  const valor = useMemo(
    () => ({
      usuario: sesion?.usuario ?? null,
      rol: sesion?.usuario?.rol ?? null,
      entrar,
      salir,
      expirada,
      cerrarAviso,
    }),
    [sesion, entrar, salir, expirada, cerrarAviso],
  )

  // React 19: el contexto se usa directamente como proveedor
  return <AuthContext value={valor}>{children}</AuthContext>
}

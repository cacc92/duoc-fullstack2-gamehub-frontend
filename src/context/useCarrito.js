import { createContext, useContext } from 'react'

// Contexto del carrito: se comparte entre la cabecera, el catálogo, el detalle, el carrito y el checkout
export const CarritoContext = createContext(null)

export function useCarrito() {
  const contexto = useContext(CarritoContext)
  if (!contexto) throw new Error('useCarrito debe usarse dentro de <CarritoProvider>')
  return contexto
}

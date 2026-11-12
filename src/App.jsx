import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router'
import AvisoSesion from './components/AvisoSesion.jsx'
import Cabecera from './components/Cabecera.jsx'
import PieDePagina from './components/PieDePagina.jsx'
import RutaProtegida from './components/RutaProtegida.jsx'
import Acceso from './pages/Acceso.jsx'
import Carrito from './pages/Carrito.jsx'
import Catalogo from './pages/Catalogo.jsx'
import Checkout from './pages/Checkout.jsx'
import Confirmacion from './pages/Confirmacion.jsx'
import DetalleProducto from './pages/DetalleProducto.jsx'
import Inicio from './pages/Inicio.jsx'
import MisOrdenes from './pages/MisOrdenes.jsx'
import NoEncontrado from './pages/NoEncontrado.jsx'
import PanelAdmin from './pages/PanelAdmin.jsx'
import PanelOperador from './pages/PanelOperador.jsx'

// Al cambiar de ruta la página vuelve arriba, como en un sitio de varias páginas
function SubirAlNavegar() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <a className="saltar-contenido" href="#contenido">
        Saltar al contenido
      </a>
      <SubirAlNavegar />
      <Cabecera />
      <AvisoSesion />
      <main id="contenido" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/producto/:id" element={<DetalleProducto />} />
          <Route path="/carrito" element={<Carrito />} />
          <Route path="/acceso" element={<Acceso />} />
          <Route
            path="/checkout"
            element={
              <RutaProtegida rol="CLIENTE">
                <Checkout />
              </RutaProtegida>
            }
          />
          <Route
            path="/ordenes/:id/confirmacion"
            element={
              <RutaProtegida rol="CLIENTE">
                <Confirmacion />
              </RutaProtegida>
            }
          />
          <Route
            path="/mis-ordenes"
            element={
              <RutaProtegida rol="CLIENTE">
                <MisOrdenes />
              </RutaProtegida>
            }
          />
          <Route
            path="/operador"
            element={
              <RutaProtegida rol={['OPERADOR', 'ADMIN']}>
                <PanelOperador />
              </RutaProtegida>
            }
          />
          <Route
            path="/admin"
            element={
              <RutaProtegida rol="ADMIN">
                <PanelAdmin />
              </RutaProtegida>
            }
          />
          <Route path="*" element={<NoEncontrado />} />
        </Routes>
      </main>
      <PieDePagina />
    </>
  )
}

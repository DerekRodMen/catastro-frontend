import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import Login from './pages/Login';
import ActivarCuenta from './pages/ActivarCuenta';
import OlvidePassword from './pages/OlvidePassword';
import RestablecerPassword from './pages/RestablecerPassword';

import Dashboard from './pages/Dashboard';

import Parques from './pages/Parques/Parques';
import Encargados from './pages/Encargados/Encargados';
import Distritos from './pages/Distritos/Distritos';
import Convenios from './pages/Convenios/Convenios';
import DocumentoConvenio from './pages/Convenios/DocumentoConvenio';
import Declaraciones from './pages/Declaraciones/Declaraciones';
import Usuarios from './pages/Usuarios/Usuarios';
import Mantenimientos from './pages/Mantenimientos/Mantenimientos';
import ListadoParques from './pages/ListadoParques/ListadoParques';
import Auditoria from './pages/Auditoria/Auditoria';
import Mapa from './pages/Mapa/Mapa';

import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      {/* INICIO */}

      <Route
        path="/"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

      {/* RUTAS PÚBLICAS */}

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/activar-cuenta"
        element={<ActivarCuenta />}
      />

      <Route
        path="/olvide-password"
        element={<OlvidePassword />}
      />

      <Route
        path="/restablecer-password"
        element={<RestablecerPassword />}
      />

      {/* RUTAS PROTEGIDAS */}

      <Route
        element={<ProtectedRoute />}
      >
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/parques"
          element={<Parques />}
        />

        <Route
          path="/encargados"
          element={<Encargados />}
        />

        <Route
          path="/distritos"
          element={<Distritos />}
        />

        <Route
          path="/convenios"
          element={<Convenios />}
        />

        <Route
          path="/documentos/convenios/:id"
          element={<DocumentoConvenio />}
        />

        <Route
          path="/declaraciones"
          element={<Declaraciones />}
        />

        <Route
          path="/usuarios"
          element={<Usuarios />}
        />

        <Route
          path="/mantenimientos"
          element={<Mantenimientos />}
        />

        {/* MAPA CATASTRAL */}

        <Route
          path="/mapa"
          element={<Mapa />}
        />

        {/* LISTADO DE PARQUES */}

        <Route
          path="/listado-parques"
          element={<ListadoParques />}
        />

        {/* AUDITORÍA */}

        <Route
          path="/auditoria"
          element={<Auditoria />}
        />
      </Route>

      {/* RUTA NO ENCONTRADA */}

      <Route
        path="*"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />
    </Routes>
  );
}

export default App;
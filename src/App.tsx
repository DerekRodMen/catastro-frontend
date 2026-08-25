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
import Declaraciones from './pages/Declaraciones/Declaraciones';
import Usuarios from './pages/Usuarios/Usuarios';

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

      {/* LOGIN */}

      <Route
        path="/login"
        element={<Login />}
      />

      {/* ACTIVAR CUENTA */}

      <Route
        path="/activar-cuenta"
        element={
          <ActivarCuenta />
        }
      />

      {/* OLVIDÉ CONTRASEÑA */}

      <Route
        path="/olvide-password"
        element={
          <OlvidePassword />
        }
      />

      {/* RESTABLECER CONTRASEÑA */}

      <Route
        path="/restablecer-password"
        element={
          <RestablecerPassword />
        }
      />

      {/* DASHBOARD */}

      <Route
        path="/dashboard"
        element={
          <Dashboard />
        }
      />

      {/* PARQUES */}

      <Route
        path="/parques"
        element={
          <Parques />
        }
      />

      {/* ENCARGADOS */}

      <Route
        path="/encargados"
        element={
          <Encargados />
        }
      />

      {/* DISTRITOS */}

      <Route
        path="/distritos"
        element={
          <Distritos />
        }
      />

      {/* CONVENIOS */}

      <Route
        path="/convenios"
        element={
          <Convenios />
        }
      />

      {/* DECLARACIONES */}

      <Route
        path="/declaraciones"
        element={
          <Declaraciones />
        }
      />

      {/* USUARIOS */}

      <Route
        path="/usuarios"
        element={
          <Usuarios />
        }
      />

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
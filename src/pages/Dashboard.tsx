import { useNavigate } from 'react-router-dom';

import './Dashboard.css';

interface Module {
  title: string;
  description: string;
  icon: string;
  route: string;
}

const modules: Module[] = [
  {
    title: 'Parques',
    description:
      'Gestión de los parques registrados y su información catastral.',
    icon: '🏞️',
    route: '/parques',
  },
  {
    title: 'Encargados',
    description:
      'Gestión de asociaciones o personas encargadas de los parques.',
    icon: '👥',
    route: '/encargados',
  },
  {
    title: 'Distritos',
    description:
      'Gestión de los distritos registrados en el sistema.',
    icon: '📍',
    route: '/distritos',
  },
  {
    title: 'Convenios',
    description:
      'Gestión de los convenios asociados a los parques.',
    icon: '📄',
    route: '/convenios',
  },
  {
    title: 'Declaraciones',
    description:
      'Administración de las declaraciones y su vigencia.',
    icon: '📋',
    route: '/declaraciones',
  },
  {
    title: 'Usuarios',
    description:
      'Administración de los usuarios del sistema.',
    icon: '👤',
    route: '/usuarios',
  },
];

export default function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');

    navigate('/login');
  };

  return (
    <div className="dashboard">

      {/* HEADER */}

      <header className="dashboard-header">

        <div>
          <h1>
            Sistema de Catastro
          </h1>

          <span>
            Panel Administrativo
          </span>
        </div>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          Cerrar sesión
        </button>

      </header>

      {/* CONTENIDO */}

      <main className="dashboard-content">

        <div className="dashboard-title">

          <h2>
            Panel Administrativo
          </h2>

          <p>
            Seleccione un módulo para comenzar
            a gestionar la información del sistema.
          </p>

        </div>

        {/* MÓDULOS */}

        <div className="modules-grid">

          {modules.map(
            (module) => (

              <div
                key={module.title}
                className="module-card"
                onClick={() =>
                  navigate(
                    module.route,
                  )
                }
              >

                <div className="module-icon">
                  {module.icon}
                </div>

                <div className="module-info">

                  <h3>
                    {module.title}
                  </h3>

                  <p>
                    {
                      module.description
                    }
                  </p>

                </div>

                <span className="module-arrow">
                  →
                </span>

              </div>

            ),
          )}

        </div>

      </main>

    </div>
  );
}
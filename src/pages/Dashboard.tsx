import {
  useNavigate,
} from 'react-router-dom';

import Header from '../components/Header';

import './Dashboard.css';


interface Module {

  title:
    string;

  description:
    string;

  icon:
    string;

  route:
    string;

  accent:
    | 'blue'
    | 'green'
    | 'red';
}


const modules:
  Module[] = [

  {
    title:
      'Parques',

    description:
      'Gestión de los parques registrados y su información catastral.',

    icon:
      '🏞️',

    route:
      '/parques',

    accent:
      'green',
  },


  {
    title:
      'Encargados',

    description:
      'Gestión de Encargados y Representante legal de los parques.',

    icon:
      '👥',

    route:
      '/encargados',

    accent:
      'blue',
  },


  {
    title:
      'Distritos',

    description:
      'Gestión de los distritos registrados en el sistema.',

    icon:
      '📍',

    route:
      '/distritos',

    accent:
      'red',
  },


  {
    title:
      'Convenios',

    description:
      'Gestión de los convenios asociados a los parques.',

    icon:
      '📄',

    route:
      '/convenios',

    accent:
      'blue',
  },


  {
    title:
      'Declaraciones',

    description:
      'Administración de las declaraciones y su vigencia.',

    icon:
      '📋',

    route:
      '/declaraciones',

    accent:
      'green',
  },


  {
    title:
      'Mantenimientos',

    description:
      'Registro y seguimiento de los mantenimientos realizados en los parques.',

    icon:
      '🛠️',

    route:
      '/mantenimientos',

    accent:
      'blue',
  },


  {
    title:
      'Listado de Parques',

    description:
      'Consulta, filtre y genere el listado de propiedades municipales en Excel.',

    icon:
      '📊',

    route:
      '/listado-parques',

    accent:
      'green',
  },


  {
    title:
      'Auditoría',

    description:
      'Consulta del historial de acciones realizadas por los usuarios del sistema.',

    icon:
      '🕒',

    route:
      '/auditoria',

    accent:
      'blue',
  },


  {
    title:
      'Usuarios',

    description:
      'Administración de los usuarios del sistema.',

    icon:
      '👤',

    route:
      '/usuarios',

    accent:
      'red',
  },

];


export default function Dashboard() {

  const navigate =
    useNavigate();


  return (

    <div
      className="dashboard"
    >

      <Header
        title="Panel Administrativo"
        description="Gestión integral de la información del Departamento de Catastro."
        showBackButton={
          false
        }
      />


      <main
        className="dashboard-content"
      >

        <section
          className="dashboard-welcome"
        >

          <span
            className="dashboard-label"
          >
            MUNICIPALIDAD DE GRECIA
          </span>


          <h2>
            Bienvenido al Sistema de Catastro
          </h2>


          <p>
            Seleccione un módulo para comenzar a consultar o administrar la información del sistema.
          </p>

        </section>


        <div
          className="modules-grid"
        >

          {
            modules.map(
              (
                module,
              ) => (

                <button
                  type="button"
                  key={
                    module.title
                  }
                  className={
                    `module-card module-card--${module.accent}`
                  }
                  onClick={
                    () =>
                      navigate(
                        module.route,
                      )
                  }
                >

                  <div
                    className="module-card__top"
                  >

                    <div
                      className="module-icon"
                    >
                      {
                        module.icon
                      }
                    </div>


                    <span
                      className="module-arrow"
                    >
                      →
                    </span>

                  </div>


                  <div
                    className="module-info"
                  >

                    <h3>
                      {
                        module.title
                      }
                    </h3>


                    <p>
                      {
                        module.description
                      }
                    </p>

                  </div>

                </button>

              ),
            )
          }

        </div>

      </main>


      <footer
        className="dashboard-footer"
      >
        Sistema de Catastro · Municipalidad de Grecia
      </footer>

    </div>

  );
}
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Eye,
  History,
  Search,
  X,
} from 'lucide-react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  api,
} from '../../services/api';

import Header from '../../components/Header';


interface Auditoria {
  id_auditoria: number;

  id_usuario:
    number | null;

  nombre_usuario:
    string | null;

  correo_usuario:
    string | null;

  modulo:
    string;

  accion:
    string;

  id_registro:
    number | null;

  descripcion:
    string;

  datos_anteriores:
    string | null;

  datos_nuevos:
    string | null;

  fecha_hora:
    string;
}


interface DatosAuditoria {
  [key: string]:
    unknown;
}


export default function Auditoria() {

  const navigate =
    useNavigate();


  // ============================================
  // DATOS
  // ============================================

  const [
    registros,
    setRegistros,
  ] = useState<Auditoria[]>([]);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');


  // ============================================
  // FILTROS
  // ============================================

  const [
    filtroUsuario,
    setFiltroUsuario,
  ] = useState('');

  const [
    filtroModulo,
    setFiltroModulo,
  ] = useState('');

  const [
    filtroAccion,
    setFiltroAccion,
  ] = useState('');

  const [
    filtroFechaDesde,
    setFiltroFechaDesde,
  ] = useState('');

  const [
    filtroFechaHasta,
    setFiltroFechaHasta,
  ] = useState('');


  // ============================================
  // PAGINACIÓN
  // ============================================

  const [
    paginaActual,
    setPaginaActual,
  ] = useState(1);

  const [
    registrosPorPagina,
    setRegistrosPorPagina,
  ] = useState(10);


  // ============================================
  // MODAL INFORMACIÓN
  // ============================================

  const [
    modalInformacionAbierto,
    setModalInformacionAbierto,
  ] = useState(false);

  const [
    registroSeleccionado,
    setRegistroSeleccionado,
  ] = useState<Auditoria | null>(
    null,
  );


  // ============================================
  // TOKEN
  // ============================================

  const obtenerToken =
    useCallback(() => {

      const token =
        localStorage.getItem(
          'token',
        );

      if (!token) {

        localStorage.removeItem(
          'usuario',
        );

        navigate(
          '/login',
          {
            replace: true,
          },
        );

        return null;
      }

      return token;

    }, [navigate]);


  // ============================================
  // CARGAR AUDITORÍA
  // ============================================

  const cargarAuditoria =
    useCallback(async () => {

      try {

        setCargando(true);
        setError('');

        const token =
          obtenerToken();

        if (!token) {
          return;
        }

        const response =
          await api.get(
            '/auditoria',
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        const datos =
          Array.isArray(
            response.data,
          )
            ? response.data
            : [];

        setRegistros(
          datos,
        );

      } catch (error: any) {

        console.error(
          'Error cargando auditoría:',
          error,
        );

        if (
          error.response?.status ===
          401
        ) {

          localStorage.removeItem(
            'token',
          );

          localStorage.removeItem(
            'usuario',
          );

          navigate(
            '/login',
            {
              replace: true,
            },
          );

          return;
        }

        setError(
          error.response?.data?.message ||
            'No se pudo cargar el historial de auditoría.',
        );

      } finally {

        setCargando(false);

      }

    }, [
      navigate,
      obtenerToken,
    ]);


  useEffect(() => {

    cargarAuditoria();

  }, [
    cargarAuditoria,
  ]);


  // ============================================
  // FILTROS
  // ============================================

  const registrosFiltrados =
    useMemo(() => {

      return registros.filter(
        (
          registro,
        ) => {

          const usuario =
            `${registro.nombre_usuario ?? ''} ${registro.correo_usuario ?? ''}`
              .toLowerCase();

          const coincideUsuario =
            !filtroUsuario.trim() ||
            usuario.includes(
              filtroUsuario
                .trim()
                .toLowerCase(),
            );


          const coincideModulo =
            !filtroModulo ||
            registro.modulo
              .toUpperCase() ===
              filtroModulo
                .toUpperCase();


          const coincideAccion =
            !filtroAccion ||
            registro.accion
              .toUpperCase() ===
              filtroAccion
                .toUpperCase();


          let coincideFechaDesde =
            true;

          let coincideFechaHasta =
            true;


          if (
            filtroFechaDesde
          ) {

            const fechaRegistro =
              new Date(
                registro.fecha_hora,
              );

            const fechaDesde =
              new Date(
                `${filtroFechaDesde}T00:00:00`,
              );

            coincideFechaDesde =
              fechaRegistro >=
              fechaDesde;
          }


          if (
            filtroFechaHasta
          ) {

            const fechaRegistro =
              new Date(
                registro.fecha_hora,
              );

            const fechaHasta =
              new Date(
                `${filtroFechaHasta}T23:59:59.999`,
              );

            coincideFechaHasta =
              fechaRegistro <=
              fechaHasta;
          }


          return (
            coincideUsuario &&
            coincideModulo &&
            coincideAccion &&
            coincideFechaDesde &&
            coincideFechaHasta
          );

        },
      );

    }, [
      registros,
      filtroUsuario,
      filtroModulo,
      filtroAccion,
      filtroFechaDesde,
      filtroFechaHasta,
    ]);


  // ============================================
  // OPCIONES DE FILTROS
  // ============================================

  const modulos =
    useMemo(() => {

      return Array.from(
        new Set(
          registros
            .map(
              (
                registro,
              ) =>
                registro.modulo,
            )
            .filter(
              Boolean,
            ),
        ),
      ).sort();

    }, [
      registros,
    ]);


  const acciones =
    useMemo(() => {

      return Array.from(
        new Set(
          registros
            .map(
              (
                registro,
              ) =>
                registro.accion,
            )
            .filter(
              Boolean,
            ),
        ),
      ).sort();

    }, [
      registros,
    ]);


  // ============================================
  // PAGINACIÓN
  // ============================================

  const totalRegistros =
    registrosFiltrados.length;

  const totalPaginas =
    Math.max(
      1,
      Math.ceil(
        totalRegistros /
          registrosPorPagina,
      ),
    );

  const indiceInicial =
    (
      paginaActual -
      1
    ) *
    registrosPorPagina;

  const indiceFinal =
    Math.min(
      indiceInicial +
        registrosPorPagina,
      totalRegistros,
    );

  const registrosPaginados =
    registrosFiltrados.slice(
      indiceInicial,
      indiceFinal,
    );


  useEffect(() => {

    setPaginaActual(
      1,
    );

  }, [
    filtroUsuario,
    filtroModulo,
    filtroAccion,
    filtroFechaDesde,
    filtroFechaHasta,
    registrosPorPagina,
  ]);


  useEffect(() => {

    if (
      paginaActual >
      totalPaginas
    ) {

      setPaginaActual(
        totalPaginas,
      );
    }

  }, [
    paginaActual,
    totalPaginas,
  ]);


  const paginasVisibles =
    useMemo(() => {

      const maximoVisible =
        5;

      let inicio =
        Math.max(
          1,
          paginaActual -
            2,
        );

      let fin =
        Math.min(
          totalPaginas,
          inicio +
            maximoVisible -
            1,
        );

      if (
        fin -
          inicio +
          1 <
        maximoVisible
      ) {

        inicio =
          Math.max(
            1,
            fin -
              maximoVisible +
              1,
          );
      }


      return Array.from(
        {
          length:
            fin -
            inicio +
            1,
        },

        (
          _,
          index,
        ) =>
          inicio +
          index,
      );

    }, [
      paginaActual,
      totalPaginas,
    ]);


  // ============================================
  // LIMPIAR FILTROS
  // ============================================

  const limpiarFiltros =
    () => {

      setFiltroUsuario('');
      setFiltroModulo('');
      setFiltroAccion('');
      setFiltroFechaDesde('');
      setFiltroFechaHasta('');

      setPaginaActual(
        1,
      );
    };


  // ============================================
  // MODAL
  // ============================================

  const abrirInformacion =
    (
      registro:
        Auditoria,
    ) => {

      setRegistroSeleccionado(
        registro,
      );

      setModalInformacionAbierto(
        true,
      );
    };


  const cerrarInformacion =
    () => {

      setModalInformacionAbierto(
        false,
      );

      setRegistroSeleccionado(
        null,
      );
    };


  // ============================================
  // ESC
  // ============================================

  useEffect(() => {

    const manejarEscape =
      (
        event:
          KeyboardEvent,
      ) => {

        if (
          event.key ===
            'Escape' &&
          modalInformacionAbierto
        ) {

          cerrarInformacion();
        }
      };


    document.addEventListener(
      'keydown',
      manejarEscape,
    );


    return () => {

      document.removeEventListener(
        'keydown',
        manejarEscape,
      );
    };

  }, [
    modalInformacionAbierto,
  ]);


  // ============================================
  // FORMATEAR FECHA
  // ============================================

  const formatearFechaHora =
    (
      fecha:
        string,
    ) => {

      if (!fecha) {
        return '—';
      }

      const valor =
        new Date(
          fecha,
        );

      if (
        Number.isNaN(
          valor.getTime(),
        )
      ) {
        return fecha;
      }


      return new Intl.DateTimeFormat(
        'es-CR',
        {
          day:
            '2-digit',

          month:
            '2-digit',

          year:
            'numeric',

          hour:
            '2-digit',

          minute:
            '2-digit',

          second:
            '2-digit',
        },
      ).format(
        valor,
      );
    };


  // ============================================
  // PARSEAR JSON
  // ============================================

  const obtenerDatos =
    (
      datos:
        string | null,
    ): DatosAuditoria | null => {

      if (!datos) {
        return null;
      }

      try {

        return JSON.parse(
          datos,
        ) as DatosAuditoria;

      } catch {

        return {
          informacion:
            datos,
        };
      }
    };


  // ============================================
  // ETIQUETAS
  // ============================================

  const formatearCampo =
    (
      campo:
        string,
    ) => {

      const etiquetas:
        Record<
          string,
          string
        > = {

          id_parque:
            'Parque',

          ubicacion:
            'Ubicación',

          numero_finca:
            'Número de finca',

          area:
            'Área',

          numero_plano:
            'Número de plano',

          visado:
            'Visado',

          estado:
            'Estado',

          id_distrito:
            'Distrito',

          distrito:
            'Nombre del distrito',

          id_encargado:
            'Encargado',

          encargado:
            'Entidad encargada',
        };


      if (
        etiquetas[campo]
      ) {
        return etiquetas[
          campo
        ];
      }


      return campo
        .replace(
          /_/g,
          ' ',
        )
        .replace(
          /\b\w/g,
          (
            letra,
          ) =>
            letra.toUpperCase(),
        );
    };


  const formatearValor =
    (
      valor:
        unknown,
    ) => {

      if (
        valor ===
          null ||
        valor ===
          undefined ||
        valor ===
          ''
      ) {
        return '—';
      }

      if (
        typeof valor ===
        'boolean'
      ) {
        return valor
          ? 'Sí'
          : 'No';
      }

      if (
        typeof valor ===
        'object'
      ) {
        return JSON.stringify(
          valor,
        );
      }

      return String(
        valor,
      );
    };


  // ============================================
  // COLOR ACCIÓN
  // ============================================

  const claseAccion =
    (
      accion:
        string,
    ) => {

      switch (
        accion.toUpperCase()
      ) {

        case 'CREAR':

          return 'border-green-200 bg-green-50 text-green-700';


        case 'EDITAR':

          return 'border-blue-200 bg-blue-50 text-blue-700';


        case 'ELIMINAR':

          return 'border-red-200 bg-red-50 text-red-700';


        default:

          return 'border-slate-200 bg-slate-50 text-slate-700';
      }
    };


  // ============================================
  // RENDER DATOS
  // ============================================

  const renderDatos =
    (
      titulo:
        string,

      datos:
        string | null,

      tipo:
        'anterior' |
        'nuevo',
    ) => {

      const contenido =
        obtenerDatos(
          datos,
        );


      return (

        <div
          className="overflow-hidden rounded-xl border border-[#D9E2E7] bg-white"
        >

          <div
            className={
              tipo ===
              'anterior'
                ? 'border-b border-amber-200 bg-amber-50 px-5 py-3'
                : 'border-b border-green-200 bg-green-50 px-5 py-3'
            }
          >

            <h4
              className={
                tipo ===
                'anterior'
                  ? 'font-semibold text-amber-800'
                  : 'font-semibold text-green-800'
              }
            >
              {titulo}
            </h4>

          </div>


          {
            !contenido
              ? (

                <div
                  className="px-5 py-5 text-sm text-slate-500"
                >
                  No aplica para esta acción.
                </div>

              )
              : (

                <div
                  className="divide-y divide-slate-100"
                >

                  {
                    Object.entries(
                      contenido,
                    ).map(
                      ([
                        campo,
                        valor,
                      ]) => (

                        <div
                          key={
                            campo
                          }
                          className="grid gap-1 px-5 py-3 sm:grid-cols-[180px_1fr]"
                        >

                          <span
                            className="text-sm font-semibold text-[#315F73]"
                          >
                            {
                              formatearCampo(
                                campo,
                              )
                            }
                          </span>

                          <span
                            className="break-words text-sm text-[#16313E]"
                          >
                            {
                              formatearValor(
                                valor,
                              )
                            }
                          </span>

                        </div>

                      ),
                    )
                  }

                </div>

              )
          }

        </div>

      );
    };


  return (

    <div
      className="min-h-screen bg-[#F4F7F8]"
    >

      <Header
        title="Auditoría"
        description="Consulte el historial de acciones realizadas dentro del sistema."
      />


      <main
        className="mx-auto max-w-7xl px-8 py-10"
      >

        {/* ====================================== */}
        {/* TÍTULO */}
        {/* ====================================== */}

        <div
          className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >

          <div>

            <div
              className="flex items-center gap-3"
            >

              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F0F4] text-[#315F73]"
              >
                <History
                  size={
                    21
                  }
                />
              </div>

              <div>

                <h2
                  className="text-xl font-semibold text-[#16313E]"
                >
                  Historial de auditoría
                </h2>

                <p
                  className="mt-1 text-sm text-slate-500"
                >
                  Consulte las acciones registradas dentro del Sistema de Catastro.
                </p>

              </div>

            </div>

          </div>


          <div
            className="rounded-xl border border-[#D9E2E7] bg-white px-4 py-3 shadow-sm"
          >

            <p
              className="text-xs font-medium uppercase tracking-wide text-slate-500"
            >
              Registros
            </p>

            <p
              className="mt-1 text-xl font-bold text-[#16313E]"
            >
              {
                registros.length
              }
            </p>

          </div>

        </div>


        {/* ====================================== */}
        {/* FILTROS */}
        {/* ====================================== */}

        <section
          className="mb-6 rounded-xl border border-[#D9E2E7] bg-white p-5 shadow-sm"
        >

          <div
            className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >

            <div>

              <div
                className="flex items-center gap-2"
              >

                <Search
                  size={
                    18
                  }
                  className="text-[#315F73]"
                />

                <h3
                  className="font-semibold text-[#16313E]"
                >
                  Filtros de búsqueda
                </h3>

              </div>

              <p
                className="mt-1 text-sm text-slate-500"
              >
                Utilice uno o varios criterios para localizar acciones específicas.
              </p>

            </div>


            <button
              type="button"
              onClick={
                limpiarFiltros
              }
              className="rounded-lg border border-[#D9E2E7] bg-white px-4 py-2 text-sm font-semibold text-[#315F73] transition hover:bg-[#F4F7F8]"
            >
              Limpiar filtros
            </button>

          </div>


          <div
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"
          >

            {/* USUARIO */}

            <div>

              <label
                className="mb-1.5 block text-sm font-semibold text-[#16313E]"
              >
                Usuario
              </label>

              <input
                type="text"
                value={
                  filtroUsuario
                }
                onChange={
                  (
                    event,
                  ) =>
                    setFiltroUsuario(
                      event.target.value,
                    )
                }
                placeholder="Nombre o correo"
                className="w-full rounded-lg border border-[#D9E2E7] bg-white px-3 py-2.5 text-sm text-[#16313E] outline-none transition focus:border-[#315F73] focus:ring-2 focus:ring-[#315F73]/10"
              />

            </div>


            {/* MÓDULO */}

            <div>

              <label
                className="mb-1.5 block text-sm font-semibold text-[#16313E]"
              >
                Módulo
              </label>

              <select
                value={
                  filtroModulo
                }
                onChange={
                  (
                    event,
                  ) =>
                    setFiltroModulo(
                      event.target.value,
                    )
                }
                className="w-full rounded-lg border border-[#D9E2E7] bg-white px-3 py-2.5 text-sm text-[#16313E] outline-none transition focus:border-[#315F73]"
              >

                <option
                  value=""
                >
                  Todos
                </option>

                {
                  modulos.map(
                    (
                      modulo,
                    ) => (

                      <option
                        key={
                          modulo
                        }
                        value={
                          modulo
                        }
                      >
                        {
                          modulo
                        }
                      </option>

                    ),
                  )
                }

              </select>

            </div>


            {/* ACCIÓN */}

            <div>

              <label
                className="mb-1.5 block text-sm font-semibold text-[#16313E]"
              >
                Acción
              </label>

              <select
                value={
                  filtroAccion
                }
                onChange={
                  (
                    event,
                  ) =>
                    setFiltroAccion(
                      event.target.value,
                    )
                }
                className="w-full rounded-lg border border-[#D9E2E7] bg-white px-3 py-2.5 text-sm text-[#16313E] outline-none transition focus:border-[#315F73]"
              >

                <option
                  value=""
                >
                  Todas
                </option>

                {
                  acciones.map(
                    (
                      accion,
                    ) => (

                      <option
                        key={
                          accion
                        }
                        value={
                          accion
                        }
                      >
                        {
                          accion
                        }
                      </option>

                    ),
                  )
                }

              </select>

            </div>


            {/* DESDE */}

            <div>

              <label
                className="mb-1.5 block text-sm font-semibold text-[#16313E]"
              >
                Fecha desde
              </label>

              <input
                type="date"
                value={
                  filtroFechaDesde
                }
                onChange={
                  (
                    event,
                  ) =>
                    setFiltroFechaDesde(
                      event.target.value,
                    )
                }
                className="w-full rounded-lg border border-[#D9E2E7] bg-white px-3 py-2.5 text-sm text-[#16313E] outline-none transition focus:border-[#315F73]"
              />

            </div>


            {/* HASTA */}

            <div>

              <label
                className="mb-1.5 block text-sm font-semibold text-[#16313E]"
              >
                Fecha hasta
              </label>

              <input
                type="date"
                value={
                  filtroFechaHasta
                }
                min={
                  filtroFechaDesde ||
                  undefined
                }
                onChange={
                  (
                    event,
                  ) =>
                    setFiltroFechaHasta(
                      event.target.value,
                    )
                }
                className="w-full rounded-lg border border-[#D9E2E7] bg-white px-3 py-2.5 text-sm text-[#16313E] outline-none transition focus:border-[#315F73]"
              />

            </div>

          </div>

        </section>


        {/* ====================================== */}
        {/* ERROR */}
        {/* ====================================== */}

        {
          error && (

            <div
              className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            >
              {
                error
              }
            </div>

          )
        }


        {/* ====================================== */}
        {/* TABLA */}
        {/* ====================================== */}

        <section
          className="overflow-hidden rounded-xl border border-[#D9E2E7] bg-white shadow-sm"
        >

          {
            cargando
              ? (

                <div
                  className="px-6 py-14 text-center text-sm text-slate-500"
                >
                  Cargando historial de auditoría...
                </div>

              )
              : registrosFiltrados.length ===
                0
              ? (

                <div
                  className="px-6 py-14 text-center"
                >

                  <History
                    size={
                      34
                    }
                    className="mx-auto mb-3 text-slate-300"
                  />

                  <p
                    className="font-semibold text-[#16313E]"
                  >
                    No se encontraron registros
                  </p>

                  <p
                    className="mt-1 text-sm text-slate-500"
                  >
                    No existen acciones que coincidan con los filtros seleccionados.
                  </p>

                </div>

              )
              : (

                <>

                  <div
                    className="overflow-x-auto"
                  >

                    <table
                      className="w-full min-w-[1100px]"
                    >

                      <thead
                        className="border-b border-[#D9E2E7] bg-[#F4F7F8]"
                      >

                        <tr>

                          <th
                            className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#315F73]"
                          >
                            Fecha y hora
                          </th>

                          <th
                            className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#315F73]"
                          >
                            Usuario
                          </th>

                          <th
                            className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#315F73]"
                          >
                            Módulo
                          </th>

                          <th
                            className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#315F73]"
                          >
                            Acción
                          </th>

                          <th
                            className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#315F73]"
                          >
                            Descripción
                          </th>

                          <th
                            className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-[#315F73]"
                          >
                            Acciones
                          </th>

                        </tr>

                      </thead>


                      <tbody
                        className="divide-y divide-slate-100"
                      >

                        {
                          registrosPaginados.map(
                            (
                              registro,
                            ) => (

                              <tr
                                key={
                                  registro.id_auditoria
                                }
                                className="transition hover:bg-[#F8FAFB]"
                              >

                                <td
                                  className="whitespace-nowrap px-4 py-3 text-sm text-[#16313E]"
                                >
                                  {
                                    formatearFechaHora(
                                      registro.fecha_hora,
                                    )
                                  }
                                </td>


                                <td
                                  className="px-4 py-3"
                                >

                                  <p
                                    className="max-w-[210px] truncate text-sm font-semibold text-[#16313E]"
                                    title={
                                      registro.nombre_usuario ??
                                      'Usuario'
                                    }
                                  >
                                    {
                                      registro.nombre_usuario ||
                                      'Usuario'
                                    }
                                  </p>

                                  <p
                                    className="max-w-[210px] truncate text-xs text-slate-500"
                                    title={
                                      registro.correo_usuario ??
                                      ''
                                    }
                                  >
                                    {
                                      registro.correo_usuario ||
                                      '—'
                                    }
                                  </p>

                                </td>


                                <td
                                  className="px-4 py-3"
                                >

                                  <span
                                    className="inline-flex rounded-md border border-[#D9E2E7] bg-[#F4F7F8] px-2.5 py-1 text-xs font-bold text-[#315F73]"
                                  >
                                    {
                                      registro.modulo
                                    }
                                  </span>

                                </td>


                                <td
                                  className="px-4 py-3"
                                >

                                  <span
                                    className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-bold ${claseAccion(
                                      registro.accion,
                                    )}`}
                                  >
                                    {
                                      registro.accion
                                    }
                                  </span>

                                </td>


                                <td
                                  className="px-4 py-3 text-sm text-slate-600"
                                >

                                  <p
                                    className="max-w-[330px] truncate"
                                    title={
                                      registro.descripcion
                                    }
                                  >
                                    {
                                      registro.descripcion
                                    }
                                  </p>

                                </td>


                                <td
                                  className="px-4 py-3 text-center"
                                >

                                  <button
                                    type="button"
                                    onClick={
                                      () =>
                                        abrirInformacion(
                                          registro,
                                        )
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-md border border-[#BFD2DC] bg-[#E8F0F4] px-3 py-1.5 text-xs font-bold text-[#315F73] transition hover:bg-[#DDE9EE]"
                                  >

                                    <Eye
                                      size={
                                        14
                                      }
                                    />

                                    Información

                                  </button>

                                </td>

                              </tr>

                            ),
                          )
                        }

                      </tbody>

                    </table>

                  </div>


                  {/* ====================================== */}
                  {/* PAGINACIÓN */}
                  {/* ====================================== */}

                  <div
                    className="flex flex-col gap-4 border-t border-[#D9E2E7] bg-[#FAFCFD] px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
                  >

                    <div
                      className="text-sm text-slate-500"
                    >

                      {
                        totalRegistros >
                        0
                          ? (
                            <>
                              Mostrando{' '}
                              <strong
                                className="text-[#16313E]"
                              >
                                {
                                  indiceInicial +
                                  1
                                }
                              </strong>
                              {' '}a{' '}
                              <strong
                                className="text-[#16313E]"
                              >
                                {
                                  indiceFinal
                                }
                              </strong>
                              {' '}de{' '}
                              <strong
                                className="text-[#16313E]"
                              >
                                {
                                  totalRegistros
                                }
                              </strong>
                              {' '}registros
                            </>
                          )
                          : 'Sin registros'
                      }

                    </div>


                    <div
                      className="flex flex-wrap items-center gap-3"
                    >

                      <div
                        className="flex items-center gap-2"
                      >

                        <span
                          className="text-sm text-slate-500"
                        >
                          Mostrar
                        </span>

                        <select
                          value={
                            registrosPorPagina
                          }
                          onChange={
                            (
                              event,
                            ) =>
                              setRegistrosPorPagina(
                                Number(
                                  event.target.value,
                                ),
                              )
                          }
                          className="rounded-lg border border-[#D9E2E7] bg-white px-2.5 py-2 text-sm font-medium text-[#16313E] outline-none focus:border-[#315F73]"
                        >

                          <option
                            value={
                              10
                            }
                          >
                            10
                          </option>

                          <option
                            value={
                              20
                            }
                          >
                            20
                          </option>

                          <option
                            value={
                              50
                            }
                          >
                            50
                          </option>

                        </select>

                      </div>


                      <div
                        className="flex items-center gap-1"
                      >

                        <button
                          type="button"
                          disabled={
                            paginaActual ===
                            1
                          }
                          onClick={
                            () =>
                              setPaginaActual(
                                (
                                  pagina,
                                ) =>
                                  Math.max(
                                    1,
                                    pagina -
                                      1,
                                  ),
                              )
                          }
                          className="rounded-lg border border-[#D9E2E7] bg-white px-3 py-2 text-sm font-semibold text-[#315F73] transition hover:bg-[#F4F7F8] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Anterior
                        </button>


                        {
                          paginasVisibles.map(
                            (
                              pagina,
                            ) => (

                              <button
                                type="button"
                                key={
                                  pagina
                                }
                                onClick={
                                  () =>
                                    setPaginaActual(
                                      pagina,
                                    )
                                }
                                className={
                                  pagina ===
                                  paginaActual
                                    ? 'h-9 min-w-9 rounded-lg bg-[#315F73] px-3 text-sm font-bold text-white'
                                    : 'h-9 min-w-9 rounded-lg border border-[#D9E2E7] bg-white px-3 text-sm font-semibold text-[#315F73] transition hover:bg-[#F4F7F8]'
                                }
                              >
                                {
                                  pagina
                                }
                              </button>

                            ),
                          )
                        }


                        <button
                          type="button"
                          disabled={
                            paginaActual ===
                            totalPaginas
                          }
                          onClick={
                            () =>
                              setPaginaActual(
                                (
                                  pagina,
                                ) =>
                                  Math.min(
                                    totalPaginas,
                                    pagina +
                                      1,
                                  ),
                              )
                          }
                          className="rounded-lg border border-[#D9E2E7] bg-white px-3 py-2 text-sm font-semibold text-[#315F73] transition hover:bg-[#F4F7F8] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Siguiente
                        </button>

                      </div>

                    </div>

                  </div>

                </>

              )
          }

        </section>

      </main>


      {/* ====================================== */}
      {/* MODAL INFORMACIÓN */}
      {/* ====================================== */}

      {
        modalInformacionAbierto &&
        registroSeleccionado && (

          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
            onMouseDown={
              (
                event,
              ) => {

                if (
                  event.target ===
                  event.currentTarget
                ) {
                  cerrarInformacion();
                }
              }
            }
          >

            <div
              className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-[#F4F7F8] shadow-2xl"
            >

              {/* CABECERA */}

              <div
                className="flex items-start justify-between border-b border-[#D9E2E7] bg-white px-6 py-5"
              >

                <div>

                  <p
                    className="text-xs font-bold uppercase tracking-wide text-[#315F73]"
                  >
                    Registro de auditoría
                  </p>

                  <h3
                    className="mt-1 text-xl font-bold text-[#16313E]"
                  >
                    Información de la acción
                  </h3>

                  <p
                    className="mt-1 text-sm text-slate-500"
                  >
                    Consulte la información registrada para esta operación.
                  </p>

                </div>


                <button
                  type="button"
                  onClick={
                    cerrarInformacion
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D9E2E7] bg-white text-slate-500 transition hover:bg-slate-50 hover:text-[#16313E]"
                  aria-label="Cerrar"
                >

                  <X
                    size={
                      18
                    }
                  />

                </button>

              </div>


              {/* CONTENIDO */}

              <div
                className="overflow-y-auto p-6"
              >

                {/* DATOS GENERALES */}

                <div
                  className="mb-5 grid gap-4 md:grid-cols-2"
                >

                  <div
                    className="rounded-xl border border-[#D9E2E7] bg-white p-4"
                  >

                    <p
                      className="text-xs font-bold uppercase tracking-wide text-slate-400"
                    >
                      Usuario
                    </p>

                    <p
                      className="mt-1 font-semibold text-[#16313E]"
                    >
                      {
                        registroSeleccionado.nombre_usuario ||
                        'Usuario'
                      }
                    </p>

                    <p
                      className="mt-0.5 text-sm text-slate-500"
                    >
                      {
                        registroSeleccionado.correo_usuario ||
                        'Correo no disponible'
                      }
                    </p>

                  </div>


                  <div
                    className="rounded-xl border border-[#D9E2E7] bg-white p-4"
                  >

                    <p
                      className="text-xs font-bold uppercase tracking-wide text-slate-400"
                    >
                      Fecha y hora
                    </p>

                    <p
                      className="mt-1 font-semibold text-[#16313E]"
                    >
                      {
                        formatearFechaHora(
                          registroSeleccionado.fecha_hora,
                        )
                      }
                    </p>

                  </div>


                  <div
                    className="rounded-xl border border-[#D9E2E7] bg-white p-4"
                  >

                    <p
                      className="text-xs font-bold uppercase tracking-wide text-slate-400"
                    >
                      Módulo
                    </p>

                    <p
                      className="mt-1 font-semibold text-[#16313E]"
                    >
                      {
                        registroSeleccionado.modulo
                      }
                    </p>

                  </div>


                  <div
                    className="rounded-xl border border-[#D9E2E7] bg-white p-4"
                  >

                    <p
                      className="text-xs font-bold uppercase tracking-wide text-slate-400"
                    >
                      Acción
                    </p>

                    <div
                      className="mt-2"
                    >

                      <span
                        className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-bold ${claseAccion(
                          registroSeleccionado.accion,
                        )}`}
                      >
                        {
                          registroSeleccionado.accion
                        }
                      </span>

                    </div>

                  </div>

                </div>


                {/* DESCRIPCIÓN */}

                <div
                  className="mb-5 rounded-xl border border-[#D9E2E7] bg-white p-5"
                >

                  <p
                    className="text-xs font-bold uppercase tracking-wide text-slate-400"
                  >
                    Descripción
                  </p>

                  <p
                    className="mt-2 text-sm leading-6 text-[#16313E]"
                  >
                    {
                      registroSeleccionado.descripcion
                    }
                  </p>

                </div>


                {/* CAMBIOS */}

                <div
                  className="grid gap-5 lg:grid-cols-2"
                >

                  {
                    renderDatos(
                      'Datos anteriores',
                      registroSeleccionado.datos_anteriores,
                      'anterior',
                    )
                  }


                  {
                    renderDatos(
                      'Datos nuevos',
                      registroSeleccionado.datos_nuevos,
                      'nuevo',
                    )
                  }

                </div>

              </div>


              {/* PIE */}

              <div
                className="flex justify-end border-t border-[#D9E2E7] bg-white px-6 py-4"
              >

                <button
                  type="button"
                  onClick={
                    cerrarInformacion
                  }
                  className="rounded-lg bg-[#315F73] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#244C5F]"
                >
                  Cerrar
                </button>

              </div>

            </div>

          </div>

        )
      }

    </div>
  );
}
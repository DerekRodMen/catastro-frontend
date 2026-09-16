import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';

import { useNavigate } from 'react-router-dom';

import { api } from '../../services/api';
import Header from '../../components/Header';

interface Parque {
  id_parque: number;
  ubicacion: string;
  numero_finca: string;
}

interface Declaracion {
  id_declaracion: number;
  fecha_declaracion: string;
  fecha_vencimiento: string;
  estado_declaracion: string;

  parque?: Parque;
}

const obtenerFechaInput = (
  fecha: string | null | undefined,
) => {
  if (!fecha) {
    return '';
  }

  return fecha.substring(0, 10);
};

const mostrarFecha = (
  fecha: string | null | undefined,
) => {
  if (!fecha) {
    return '-';
  }

  const limpia =
    fecha.substring(0, 10);

  const partes =
    limpia.split('-');

  if (partes.length !== 3) {
    return fecha;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
};


const calcularFechaVencimiento = (
  fechaDeclaracion: string,
) => {
  if (!fechaDeclaracion) {
    return '';
  }

  const partes =
    fechaDeclaracion.split('-');

  if (partes.length !== 3) {
    return '';
  }

  const anio =
    Number(partes[0]);

  const mes =
    Number(partes[1]);

  const dia =
    Number(partes[2]);

  const nuevoAnio =
    anio + 5;

  const ultimoDiaMes =
    new Date(
      nuevoAnio,
      mes,
      0,
    ).getDate();

  const diaAjustado =
    Math.min(
      dia,
      ultimoDiaMes,
    );

  return `${nuevoAnio}-${String(
    mes,
  ).padStart(
    2,
    '0',
  )}-${String(
    diaAjustado,
  ).padStart(
    2,
    '0',
  )}`;
};

export default function Declaraciones() {
  const navigate = useNavigate();

  const [
    declaraciones,
    setDeclaraciones,
  ] = useState<Declaracion[]>([]);

  const [
    parques,
    setParques,
  ] = useState<Parque[]>([]);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  // ============================
  // FILTROS DE BÚSQUEDA
  // ============================

  const [
    filtroParque,
    setFiltroParque,
  ] = useState('');

  const [
    filtroEstado,
    setFiltroEstado,
  ] = useState('');

  const [
    filtroFechaDeclaracion,
    setFiltroFechaDeclaracion,
  ] = useState('');

  const [
    filtroFechaVencimiento,
    setFiltroFechaVencimiento,
  ] = useState('');

  // ============================================
  // PAGINACIÓN
  // ============================================

  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);

  const declaracionesFiltradas =
    declaraciones.filter(
      (declaracion) => {
        const coincideParque =
          !filtroParque ||
          String(
            declaracion.parque
              ?.id_parque ?? '',
          ) === filtroParque;

        const coincideEstado =
          !filtroEstado ||
          declaracion.estado_declaracion ===
            filtroEstado;

        const coincideFechaDeclaracion =
          !filtroFechaDeclaracion ||
          obtenerFechaInput(
            declaracion.fecha_declaracion,
          ) === filtroFechaDeclaracion;

        const coincideFechaVencimiento =
          !filtroFechaVencimiento ||
          obtenerFechaInput(
            declaracion.fecha_vencimiento,
          ) === filtroFechaVencimiento;

        return (
          coincideParque &&
          coincideEstado &&
          coincideFechaDeclaracion &&
          coincideFechaVencimiento
        );
      },
    );

  const totalPaginas = Math.max(1, Math.ceil(declaracionesFiltradas.length / registrosPorPagina));
  const indiceInicial = (paginaActual - 1) * registrosPorPagina;
  const indiceFinal = indiceInicial + registrosPorPagina;
  const declaracionesPaginadas = declaracionesFiltradas.slice(indiceInicial, indiceFinal);

  useEffect(() => {
    setPaginaActual(1);
  }, [
    filtroParque,
    filtroEstado,
    filtroFechaDeclaracion,
    filtroFechaVencimiento,
    registrosPorPagina,
  ]);

  useEffect(() => {
    if (paginaActual > totalPaginas) {
      setPaginaActual(totalPaginas);
    }
  }, [paginaActual, totalPaginas]);

  const hayFiltrosActivos =
    Boolean(
      filtroParque ||
      filtroEstado ||
      filtroFechaDeclaracion ||
      filtroFechaVencimiento,
    );

  const limpiarFiltros = () => {
    setFiltroParque('');
    setFiltroEstado('');
    setFiltroFechaDeclaracion('');
    setFiltroFechaVencimiento('');
  };

  // ============================
  // MODAL CREAR / EDITAR
  // ============================

  const [
    modalAbierto,
    setModalAbierto,
  ] = useState(false);

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    errorFormulario,
    setErrorFormulario,
  ] = useState('');

  const [
    modoEdicion,
    setModoEdicion,
  ] = useState(false);

  const [
    idDeclaracionEditando,
    setIdDeclaracionEditando,
  ] = useState<number | null>(null);

  // ============================
  // MODAL VER INFORMACIÓN
  // ============================

  const [
    modalInformacionAbierto,
    setModalInformacionAbierto,
  ] = useState(false);

  const [
    declaracionVer,
    setDeclaracionVer,
  ] = useState<Declaracion | null>(null);

  // ============================
  // MODAL ELIMINAR
  // ============================

  const [
    modalEliminarAbierto,
    setModalEliminarAbierto,
  ] = useState(false);

  const [
    declaracionEliminar,
    setDeclaracionEliminar,
  ] = useState<Declaracion | null>(
    null,
  );

  const [
    eliminando,
    setEliminando,
  ] = useState(false);

  const [
    errorEliminar,
    setErrorEliminar,
  ] = useState('');

  // ============================
  // FORMULARIO
  // ============================

  const [
    idParque,
    setIdParque,
  ] = useState('');

  const [
    fechaDeclaracion,
    setFechaDeclaracion,
  ] = useState('');

  const [
    fechaVencimiento,
    setFechaVencimiento,
  ] = useState('');

  const [
    estadoDeclaracion,
    setEstadoDeclaracion,
  ] = useState('Vigente');

  // ============================
  // CALCULAR VENCIMIENTO AUTOMÁTICO
  // ============================

  useEffect(() => {
    setFechaVencimiento(
      calcularFechaVencimiento(
        fechaDeclaracion,
      ),
    );
  }, [
    fechaDeclaracion,
  ]);

  // ============================
  // CARGAR DECLARACIONES
  // ============================

  const cargarDeclaraciones =
    async () => {
      try {
        setCargando(true);
        setError('');

        const response =
          await api.get(
            '/declaraciones',
          );

        setDeclaraciones(
          response.data,
        );
      } catch (error) {
        console.error(
          'Error cargando declaraciones:',
          error,
        );

        setError(
          'No se pudieron cargar las declaraciones.',
        );
      } finally {
        setCargando(false);
      }
    };

  // ============================
  // CARGAR PARQUES
  // ============================

  const cargarParques =
    async () => {
      try {
        const response =
          await api.get(
            '/parques',
          );

        setParques(
          response.data,
        );
      } catch (error) {
        console.error(
          'Error cargando parques:',
          error,
        );
      }
    };

  useEffect(() => {
    cargarDeclaraciones();
    cargarParques();
  }, []);

  // ============================
  // LIMPIAR
  // ============================

  const limpiarFormulario =
    () => {
      setIdParque('');
      setFechaDeclaracion('');
      setFechaVencimiento('');
      setEstadoDeclaracion(
        'Vigente',
      );
      setErrorFormulario('');
    };

  // ============================
  // NUEVA DECLARACIÓN
  // ============================

  const abrirModalCrear =
    () => {
      limpiarFormulario();

      setModoEdicion(false);

      setIdDeclaracionEditando(
        null,
      );

      setModalAbierto(true);
    };

  // ============================
  // EDITAR
  // ============================

  const abrirModalEditar = (
    declaracion: Declaracion,
  ) => {
    setIdParque(
      declaracion.parque
        ? String(
            declaracion.parque
              .id_parque,
          )
        : '',
    );

    setFechaDeclaracion(
      obtenerFechaInput(
        declaracion.fecha_declaracion,
      ),
    );

    setFechaVencimiento(
      obtenerFechaInput(
        declaracion.fecha_vencimiento,
      ),
    );

    setEstadoDeclaracion(
      declaracion.estado_declaracion ||
        'Vigente',
    );

    setModoEdicion(true);

    setIdDeclaracionEditando(
      declaracion.id_declaracion,
    );

    setErrorFormulario('');

    setModalAbierto(true);
  };

  // ============================
  // CERRAR MODAL
  // ============================

  const cerrarModal = () => {
    if (guardando) {
      return;
    }

    setModalAbierto(false);

    limpiarFormulario();

    setModoEdicion(false);

    setIdDeclaracionEditando(
      null,
    );
  };

  // ============================
  // GUARDAR
  // ============================

  const guardarDeclaracion =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      setGuardando(true);
      setErrorFormulario('');

      try {
        const token =
          localStorage.getItem(
            'token',
          );

        if (!idParque) {
          setErrorFormulario(
            'Debe seleccionar un parque.',
          );

          return;
        }

        if (!fechaDeclaracion) {
          setErrorFormulario(
            'Debe indicar la fecha de declaración.',
          );

          return;
        }

        if (!estadoDeclaracion) {
          setErrorFormulario(
            'Debe seleccionar el estado de la declaración.',
          );

          return;
        }

        const datosDeclaracion = {
          id_parque:
            Number(idParque),

          fecha_declaracion:
            fechaDeclaracion,

          estado_declaracion:
            estadoDeclaracion,
        };

        if (
          modoEdicion &&
          idDeclaracionEditando !==
            null
        ) {
          await api.patch(
            `/declaraciones/${idDeclaracionEditando}`,
            datosDeclaracion,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );
        } else {
          await api.post(
            '/declaraciones',
            datosDeclaracion,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );
        }

        setModalAbierto(false);

        limpiarFormulario();

        setModoEdicion(false);

        setIdDeclaracionEditando(
          null,
        );

        await cargarDeclaraciones();
      } catch (error: any) {
        console.error(
          'Error guardando declaración:',
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

          navigate('/login');

          return;
        }

        const message =
          error.response?.data
            ?.message;

        if (
          Array.isArray(
            message,
          )
        ) {
          setErrorFormulario(
            message.join(', '),
          );
        } else if (message) {
          setErrorFormulario(
            message,
          );
        } else {
          setErrorFormulario(
            modoEdicion
              ? 'No se pudo actualizar la declaración.'
              : 'No se pudo registrar la declaración.',
          );
        }
      } finally {
        setGuardando(false);
      }
    };

  // ============================
  // VER INFORMACIÓN
  // ============================

  const abrirModalInformacion = (
    declaracion: Declaracion,
  ) => {
    setDeclaracionVer(declaracion);
    setModalInformacionAbierto(true);
  };

  const cerrarModalInformacion = () => {
    setModalInformacionAbierto(false);
    setDeclaracionVer(null);
  };

  // ============================
  // ABRIR ELIMINAR
  // ============================

  const abrirModalEliminar = (
    declaracion: Declaracion,
  ) => {
    setDeclaracionEliminar(
      declaracion,
    );

    setErrorEliminar('');

    setModalEliminarAbierto(
      true,
    );
  };

  // ============================
  // CERRAR ELIMINAR
  // ============================

  const cerrarModalEliminar =
    () => {
      if (eliminando) {
        return;
      }

      setModalEliminarAbierto(
        false,
      );

      setDeclaracionEliminar(
        null,
      );

      setErrorEliminar('');
    };

  // ============================
  // CERRAR MODALES CON ESC
  // ============================

  useEffect(() => {
    const manejarEscape = (
      event: KeyboardEvent,
    ) => {
      if (event.key !== 'Escape') {
        return;
      }

      // Cierra primero el modal que esté visible.
      if (modalInformacionAbierto) {
        cerrarModalInformacion();
        return;
      }

      if (modalEliminarAbierto) {
        cerrarModalEliminar();
        return;
      }

      if (modalAbierto) {
        cerrarModal();
      }
    };

    window.addEventListener(
      'keydown',
      manejarEscape,
    );

    return () => {
      window.removeEventListener(
        'keydown',
        manejarEscape,
      );
    };
  }, [
    modalInformacionAbierto,
    modalEliminarAbierto,
    modalAbierto,
    eliminando,
    guardando,
  ]);

  // ============================
  // CONFIRMAR ELIMINAR
  // ============================

  const confirmarEliminarDeclaracion =
    async () => {
      if (!declaracionEliminar) {
        return;
      }

      try {
        setEliminando(true);
        setErrorEliminar('');

        const token =
          localStorage.getItem(
            'token',
          );

        await api.delete(
          `/declaraciones/${declaracionEliminar.id_declaracion}`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

        setModalEliminarAbierto(
          false,
        );

        setDeclaracionEliminar(
          null,
        );

        await cargarDeclaraciones();
      } catch (error: any) {
        console.error(
          'Error eliminando declaración:',
          error,
        );

        const message =
          error.response?.data
            ?.message;

        if (
          Array.isArray(
            message,
          )
        ) {
          setErrorEliminar(
            message.join(', '),
          );
        } else if (message) {
          setErrorEliminar(
            message,
          );
        } else {
          setErrorEliminar(
            'No se pudo eliminar la declaración.',
          );
        }
      } finally {
        setEliminando(false);
      }
    };

  // ============================
  // COLOR ESTADO
  // ============================

  const obtenerClaseEstado = (
    estado: string,
  ) => {
    switch (estado) {
      case 'Vigente':
        return 'rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700';

      case 'Vencida':
        return 'rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700';

      case 'Finalizada':
        return 'rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700';

      default:
        return 'rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600';
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F8]">

      <Header
        title="Gestión de Declaraciones"
        description="Administración de las declaraciones asociadas a los parques."
      />

      {/* CONTENIDO */}

      <main className="mx-auto max-w-7xl px-8 py-10">

        <div className="mb-6 flex items-center justify-between">

          <div>

            <h2 className="text-xl font-semibold text-[#16313E]">
              Declaraciones registradas
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Consulte y administre las declaraciones registradas.
            </p>

          </div>

          <button
            type="button"
            onClick={
              abrirModalCrear
            }
            className="rounded-lg bg-[#315F73] px-4 py-2 text-sm font-semibold text-white hover:bg-[#244C5F]"
          >
            + Nueva declaración
          </button>

        </div>

        {/* ============================ */}
        {/* FILTROS DE BÚSQUEDA */}
        {/* ============================ */}

        <div className="mb-6 rounded-xl border border-[#D9E2E7] bg-white p-5 shadow-sm">

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h3 className="font-semibold text-[#16313E]">
                Filtros de búsqueda
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Utilice uno o varios criterios para localizar declaraciones específicas.
              </p>
            </div>

            <button
              type="button"
              onClick={limpiarFiltros}
              disabled={!hayFiltrosActivos}
              className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Limpiar filtros
            </button>

          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Parque
              </label>

              <select
                value={filtroParque}
                onChange={(event) =>
                  setFiltroParque(
                    event.target.value,
                  )
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">
                  Todos los parques
                </option>

                {parques.map(
                  (parque) => (
                    <option
                      key={parque.id_parque}
                      value={parque.id_parque}
                    >
                      {parque.ubicacion}
                      {' - Finca '}
                      {parque.numero_finca}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Estado
              </label>

              <select
                value={filtroEstado}
                onChange={(event) =>
                  setFiltroEstado(
                    event.target.value,
                  )
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">
                  Todos los estados
                </option>
                <option value="Vigente">
                  Vigente
                </option>
                <option value="Vencida">
                  Vencida
                </option>
                <option value="Finalizada">
                  Finalizada
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Fecha de declaración
              </label>

              <input
                type="date"
                value={filtroFechaDeclaracion}
                onChange={(event) =>
                  setFiltroFechaDeclaracion(
                    event.target.value,
                  )
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Fecha de vencimiento
              </label>

              <input
                type="date"
                value={filtroFechaVencimiento}
                onChange={(event) =>
                  setFiltroFechaVencimiento(
                    event.target.value,
                  )
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

          </div>

          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-500">
              Mostrando{' '}
              <span className="font-semibold text-[#16313E]">
                {declaracionesFiltradas.length}
              </span>{' '}
              de{' '}
              <span className="font-semibold text-[#16313E]">
                {declaraciones.length}
              </span>{' '}
              declaraciones.
            </p>
          </div>

        </div>

        {cargando && (
          <div className="rounded-xl border border-[#D9E2E7] bg-white p-8 text-center text-slate-500">
            Cargando declaraciones...
          </div>
        )}

        {!cargando &&
          error && (

          <div className="rounded-xl border border-red-200 bg-red-50 p-6">

            <p className="text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={
                cargarDeclaraciones
              }
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white"
            >
              Intentar nuevamente
            </button>

          </div>

        )}

        {!cargando &&
          !error && (

          <div className="overflow-hidden rounded-xl border border-[#D9E2E7] bg-white shadow-sm">

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-slate-50">

                  <tr>

                    <th className="px-4 py-3 text-left">
                      Parque
                    </th>

                    <th className="px-4 py-3 text-left">
                      Fecha de declaración
                    </th>

                    <th className="px-4 py-3 text-left">
                      Fecha de vencimiento
                    </th>

                    <th className="px-4 py-3 text-left">
                      Estado
                    </th>

                    <th className="px-4 py-3 text-left">
                      Acciones
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {declaracionesFiltradas.length ===
                  0 ? (

                    <tr>

                      <td
                        colSpan={5}
                        className="px-4 py-12 text-center text-slate-500"
                      >
                        {hayFiltrosActivos
                          ? 'No se encontraron declaraciones que coincidan con los filtros seleccionados.'
                          : 'No hay declaraciones registradas.'}
                      </td>

                    </tr>

                  ) : (

                    declaracionesPaginadas.map(
                      (declaracion) => (

                        <tr
                          key={
                            declaracion.id_declaracion
                          }
                          className="border-t border-slate-100 hover:bg-slate-50"
                        >

                          <td className="px-4 py-4">

                            <p className="font-medium text-[#16313E]">
                              {
                                declaracion.parque
                                  ?.ubicacion ??
                                'Parque no disponible'
                              }
                            </p>

                            {declaracion.parque
                              ?.numero_finca && (

                              <p className="mt-1 text-xs text-slate-500">
                                Finca:{' '}
                                {
                                  declaracion.parque
                                    .numero_finca
                                }
                              </p>

                            )}

                          </td>

                          <td className="px-4 py-4">
                            {mostrarFecha(
                              declaracion.fecha_declaracion,
                            )}
                          </td>

                          <td className="px-4 py-4">
                            {mostrarFecha(
                              declaracion.fecha_vencimiento,
                            )}
                          </td>

                          <td className="px-4 py-4">

                            <span
                              className={obtenerClaseEstado(
                                declaracion.estado_declaracion,
                              )}
                            >
                              {
                                declaracion.estado_declaracion
                              }
                            </span>

                          </td>

                          <td className="px-4 py-4">

                            <div className="flex gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  abrirModalEditar(
                                    declaracion,
                                  )
                                }
                                className="rounded-md bg-sky-100 px-3 py-1 text-sm font-medium text-sky-700 hover:bg-sky-200"
                              >
                                Editar
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  abrirModalInformacion(
                                    declaracion,
                                  )
                                }
                                className="rounded-md bg-violet-100 px-3 py-1 text-sm font-medium text-violet-700 hover:bg-violet-200"
                              >
                                Ver información
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  abrirModalEliminar(
                                    declaracion,
                                  )
                                }
                                className="rounded-md bg-red-100 px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-200"
                              >
                                Eliminar
                              </button>

                            </div>

                          </td>

                        </tr>

                      ),
                    )

                  )}

                </tbody>

              </table>

              {declaracionesFiltradas.length > 0 && (
                <div className="flex flex-col gap-4 border-t border-[#D9E2E7] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                    <span>
                      Mostrando <strong>{indiceInicial + 1}</strong> a 
                      <strong>{Math.min(indiceFinal, declaracionesFiltradas.length)}</strong> de 
                      <strong>{declaracionesFiltradas.length}</strong> declaraciones
                    </span>

                    <label className="flex items-center gap-2">
                      <span>Registros por página:</span>
                      <select
                        value={registrosPorPagina}
                        onChange={(event) => setRegistrosPorPagina(Number(event.target.value))}
                        className="rounded-lg border border-[#D9E2E7] bg-white px-2 py-1.5 text-sm text-[#16313E] outline-none focus:border-[#315F73]"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPaginaActual((pagina) => Math.max(1, pagina - 1))}
                      disabled={paginaActual === 1}
                      className="rounded-lg border border-[#D9E2E7] px-3 py-2 text-sm font-medium text-[#315F73] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ← Anterior
                    </button>

                    {Array.from({ length: totalPaginas }, (_, indice) => indice + 1).map((pagina) => (
                      <button
                        key={pagina}
                        type="button"
                        onClick={() => setPaginaActual(pagina)}
                        className={`min-w-9 rounded-lg px-3 py-2 text-sm font-semibold ${
                          paginaActual === pagina
                            ? 'bg-[#315F73] text-white'
                            : 'border border-[#D9E2E7] bg-white text-[#315F73] hover:bg-slate-50'
                        }`}
                      >
                        {pagina}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setPaginaActual((pagina) => Math.min(totalPaginas, pagina + 1))}
                      disabled={paginaActual === totalPaginas}
                      className="rounded-lg border border-[#D9E2E7] px-3 py-2 text-sm font-medium text-[#315F73] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Siguiente →
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>

        )}

      </main>

      {/* MODAL VER INFORMACIÓN */}

      {modalInformacionAbierto &&
        declaracionVer && (

        <div
          onClick={cerrarModalInformacion}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
        >

          <div
            onClick={(event) => event.stopPropagation()}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto overflow-x-hidden rounded-2xl bg-white shadow-2xl"
          >

            <div className="flex items-center justify-between border-b border-[#D9E2E7] px-6 py-5">

              <div>
                <h2 className="text-xl font-bold text-[#16313E]">
                  Información de la declaración
                </h2>
                <p className="mt-1 max-w-full break-words text-sm text-slate-500 [overflow-wrap:anywhere]">
                  Información completa de la declaración seleccionada.
                </p>
              </div>

              <button
                type="button"
                onClick={cerrarModalInformacion}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-600 hover:bg-slate-200"
              >
                ×
              </button>

            </div>

            <div className="p-6">

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                <div className="rounded-lg border border-[#D9E2E7] p-4 md:col-span-2">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Parque
                  </p>
                  <p className="mt-1 max-w-full break-words font-medium text-[#16313E] [overflow-wrap:anywhere]">
                    {declaracionVer.parque?.ubicacion ?? 'Parque no disponible'}
                  </p>
                  {declaracionVer.parque?.numero_finca && (
                    <p className="mt-1 max-w-full break-words text-sm text-slate-500 [overflow-wrap:anywhere]">
                      Finca: {declaracionVer.parque.numero_finca}
                    </p>
                  )}
                </div>

                <div className="min-w-0 overflow-hidden rounded-lg border border-[#D9E2E7] p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Fecha de declaración
                  </p>
                  <p className="mt-1 max-w-full break-words font-medium text-[#16313E] [overflow-wrap:anywhere]">
                    {mostrarFecha(declaracionVer.fecha_declaracion)}
                  </p>
                </div>

                <div className="min-w-0 overflow-hidden rounded-lg border border-[#D9E2E7] p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Fecha de vencimiento
                  </p>
                  <p className="mt-1 max-w-full break-words font-medium text-[#16313E] [overflow-wrap:anywhere]">
                    {mostrarFecha(declaracionVer.fecha_vencimiento)}
                  </p>
                </div>

                <div className="rounded-lg border border-[#D9E2E7] p-4 md:col-span-2">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Estado
                  </p>
                  <div className="mt-2">
                    <span className={obtenerClaseEstado(declaracionVer.estado_declaracion)}>
                      {declaracionVer.estado_declaracion}
                    </span>
                  </div>
                </div>

              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={cerrarModalInformacion}
                  className="rounded-lg bg-slate-900 px-5 py-2 font-semibold text-white hover:bg-slate-800"
                >
                  Cerrar
                </button>
              </div>

            </div>

          </div>

        </div>

      )}

      {/* MODAL CREAR / EDITAR */}

      {modalAbierto && (

        <div
          onClick={cerrarModal}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >

          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-[#D9E2E7] px-6 py-5">

              <div>

                <h2 className="text-xl font-bold text-[#16313E]">

                  {modoEdicion
                    ? 'Editar declaración'
                    : 'Nueva declaración'}

                </h2>

              </div>

              <button
                type="button"
                onClick={
                  cerrarModal
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-600"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={
                guardarDeclaracion
              }
              className="p-6"
            >

              {errorFormulario && (

                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {errorFormulario}
                </div>

              )}

              <div className="space-y-5">

                <div>

                  <label className="mb-2 block text-sm font-medium">
                    Parque
                  </label>

                  <select
                    value={
                      idParque
                    }
                    onChange={(
                      event,
                    ) =>
                      setIdParque(
                        event.target.value,
                      )
                    }
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  >

                    <option value="">
                      Seleccione un parque
                    </option>

                    {parques.map(
                      (parque) => (

                        <option
                          key={
                            parque.id_parque
                          }
                          value={
                            parque.id_parque
                          }
                        >
                          {
                            parque.ubicacion
                          }{' '}
                          - Finca{' '}
                          {
                            parque.numero_finca
                          }
                        </option>

                      ),
                    )}

                  </select>

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium">
                    Fecha de declaración
                  </label>

                  <input
                    type="date"
                    value={
                      fechaDeclaracion
                    }
                    onChange={(
                      event,
                    ) =>
                      setFechaDeclaracion(
                        event.target.value,
                      )
                    }
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium">
                    Fecha de vencimiento
                  </label>

                  <input
                    type="date"
                    value={
                      fechaVencimiento
                    }
                    readOnly
                    className="w-full cursor-not-allowed rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-slate-700"
                  />

                  <p className="mt-1 text-xs text-slate-400">
                    Se calcula automáticamente a 5 años de la fecha de declaración.
                  </p>

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium">
                    Estado de la declaración
                  </label>

                  <select
                    value={
                      estadoDeclaracion
                    }
                    onChange={(
                      event,
                    ) =>
                      setEstadoDeclaracion(
                        event.target.value,
                      )
                    }
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  >

                    <option value="Vigente">
                      Vigente
                    </option>

                    <option value="Vencida">
                      Vencida
                    </option>

                    <option value="Finalizada">
                      Finalizada
                    </option>

                  </select>

                </div>

              </div>

              <div className="mt-7 flex justify-end gap-3 border-t border-slate-100 pt-5">

                <button
                  type="button"
                  onClick={
                    cerrarModal
                  }
                  disabled={
                    guardando
                  }
                  className="rounded-lg bg-slate-200 px-5 py-2 font-semibold text-slate-700"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    guardando
                  }
                  className="rounded-lg bg-[#315F73] px-5 py-2 font-semibold text-white"
                >

                  {guardando
                    ? 'Guardando...'
                    : modoEdicion
                      ? 'Guardar cambios'
                      : 'Guardar declaración'}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* MODAL ELIMINAR */}

      {modalEliminarAbierto &&
        declaracionEliminar && (

        <div
          onClick={cerrarModalEliminar}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
        >

          <div
            onClick={(event) => event.stopPropagation()}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto overflow-x-hidden rounded-2xl bg-white shadow-2xl"
          >

            <div className="border-b border-[#D9E2E7] px-6 py-5">

              <h2 className="text-xl font-bold text-[#16313E]">
                Eliminar declaración
              </h2>

              <p className="mt-1 max-w-full break-words text-sm text-slate-500 [overflow-wrap:anywhere]">
                Esta acción eliminará la declaración seleccionada.
              </p>

            </div>

            <div className="p-6">

              <div className="min-w-0 overflow-hidden rounded-xl bg-red-50 p-4">

                <p className="max-w-full break-words text-sm text-red-700 [overflow-wrap:anywhere]">
                  ¿Está seguro de que desea eliminar esta declaración?
                </p>

                <p className="mt-3 max-w-full break-words font-semibold text-[#16313E] [overflow-wrap:anywhere]">

                  {declaracionEliminar
                    .parque?.ubicacion ??
                    'Parque'}

                </p>

                <p className="mt-1 max-w-full break-words text-sm text-slate-500 [overflow-wrap:anywhere]">

                  Fecha de declaración:{' '}

                  {mostrarFecha(
                    declaracionEliminar
                      .fecha_declaracion,
                  )}

                </p>

                <p className="mt-1 max-w-full break-words text-sm text-slate-500 [overflow-wrap:anywhere]">

                  Vence:{' '}

                  {mostrarFecha(
                    declaracionEliminar
                      .fecha_vencimiento,
                  )}

                </p>

              </div>

              {errorEliminar && (

                <div className="mt-4 min-w-0 overflow-hidden rounded-lg border border-red-200 bg-red-50 p-3 break-words text-sm text-red-700 [overflow-wrap:anywhere]">
                  {errorEliminar}
                </div>

              )}

              <div className="mt-6 flex justify-end gap-3">

                <button
                  type="button"
                  onClick={
                    cerrarModalEliminar
                  }
                  disabled={
                    eliminando
                  }
                  className="rounded-lg bg-slate-200 px-5 py-2 font-semibold text-slate-700"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={
                    confirmarEliminarDeclaracion
                  }
                  disabled={
                    eliminando
                  }
                  className="rounded-lg bg-red-600 px-5 py-2 font-semibold text-white"
                >

                  {eliminando
                    ? 'Eliminando...'
                    : 'Sí, eliminar'}

                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}
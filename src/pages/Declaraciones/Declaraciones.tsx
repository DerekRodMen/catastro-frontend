import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';

import { useNavigate } from 'react-router-dom';

import { api } from '../../services/api';

interface Parque {
  id_parque: number;
  ubicacion: string;
  numero_finca: string;
}

interface Declaracion {
  id_declaracion: number;
  fecha_declaracion: string;
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
    estadoDeclaracion,
    setEstadoDeclaracion,
  ] = useState('Vigente');

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

  // ============================
  // LOGOUT
  // ============================

  const handleLogout = () => {
    localStorage.removeItem(
      'token',
    );

    localStorage.removeItem(
      'usuario',
    );

    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-100">

      {/* HEADER */}

      <header className="border-b border-slate-200 bg-white px-8 py-5">

        <div className="mx-auto flex max-w-7xl items-center justify-between">

          <div>

            <h1 className="text-2xl font-bold text-slate-900">
              Gestión de Declaraciones
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Administración de las declaraciones asociadas a los parques.
            </p>

          </div>

          <div className="flex gap-3">

            <button
              type="button"
              onClick={() =>
                navigate(
                  '/dashboard',
                )
              }
              className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300"
            >
              Volver al panel
            </button>

            <button
              type="button"
              onClick={
                handleLogout
              }
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Cerrar sesión
            </button>

          </div>

        </div>

      </header>

      {/* CONTENIDO */}

      <main className="mx-auto max-w-7xl px-8 py-10">

        <div className="mb-6 flex items-center justify-between">

          <div>

            <h2 className="text-xl font-semibold text-slate-900">
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
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Nueva declaración
          </button>

        </div>

        {cargando && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
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

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

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
                      Estado
                    </th>

                    <th className="px-4 py-3 text-left">
                      Acciones
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {declaraciones.length ===
                  0 ? (

                    <tr>

                      <td
                        colSpan={4}
                        className="px-4 py-12 text-center text-slate-500"
                      >
                        No hay declaraciones registradas.
                      </td>

                    </tr>

                  ) : (

                    declaraciones.map(
                      (declaracion) => (

                        <tr
                          key={
                            declaracion.id_declaracion
                          }
                          className="border-t border-slate-100 hover:bg-slate-50"
                        >

                          <td className="px-4 py-4">

                            <p className="font-medium text-slate-900">
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

            </div>

          </div>

        )}

      </main>

      {/* MODAL CREAR / EDITAR */}

      {modalAbierto && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>

                <h2 className="text-xl font-bold text-slate-900">

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
                  className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white"
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

        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

            <div className="border-b border-slate-200 px-6 py-5">

              <h2 className="text-xl font-bold text-slate-900">
                Eliminar declaración
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Esta acción eliminará la declaración seleccionada.
              </p>

            </div>

            <div className="p-6">

              <div className="rounded-xl bg-red-50 p-4">

                <p className="text-sm text-red-700">
                  ¿Está seguro de que desea eliminar esta declaración?
                </p>

                <p className="mt-3 font-semibold text-slate-900">

                  {declaracionEliminar
                    .parque?.ubicacion ??
                    'Parque'}

                </p>

                <p className="mt-1 text-sm text-slate-500">

                  Fecha:{' '}

                  {mostrarFecha(
                    declaracionEliminar
                      .fecha_declaracion,
                  )}

                </p>

              </div>

              {errorEliminar && (

                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
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
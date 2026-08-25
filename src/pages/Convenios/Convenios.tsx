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

interface Convenio {
  id_convenio: number;
  fecha_firma: string;
  plazo: number;
  fecha_renovacion_firmas: string;
  estado_convenio: string;
  parque?: Parque;
}

// ============================
// FUNCIONES PARA FECHAS
// ============================

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

  const fechaLimpia =
    fecha.substring(0, 10);

  const partes =
    fechaLimpia.split('-');

  if (partes.length !== 3) {
    return fecha;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
};

// ============================
// COMPONENTE
// ============================

export default function Convenios() {
  const navigate = useNavigate();

  // ============================
  // DATOS
  // ============================

  const [
    convenios,
    setConvenios,
  ] = useState<Convenio[]>([]);

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
    idConvenioEditando,
    setIdConvenioEditando,
  ] = useState<number | null>(null);

  // ============================
  // MODAL ELIMINAR
  // ============================

  const [
    modalEliminarAbierto,
    setModalEliminarAbierto,
  ] = useState(false);

  const [
    convenioEliminar,
    setConvenioEliminar,
  ] = useState<Convenio | null>(null);

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
    fechaFirma,
    setFechaFirma,
  ] = useState('');

  const [
    plazo,
    setPlazo,
  ] = useState('');

  const [
    fechaRenovacion,
    setFechaRenovacion,
  ] = useState('');

  const [
    estadoConvenio,
    setEstadoConvenio,
  ] = useState('Vigente');

  // ============================
  // CARGAR CONVENIOS
  // ============================

  const cargarConvenios =
    async () => {
      try {
        setCargando(true);
        setError('');

        const response =
          await api.get(
            '/convenios',
          );

        setConvenios(
          response.data,
        );
      } catch (error) {
        console.error(
          'Error cargando convenios:',
          error,
        );

        setError(
          'No se pudieron cargar los convenios.',
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

  // ============================
  // USE EFFECT
  // ============================

  useEffect(() => {
    cargarConvenios();
    cargarParques();
  }, []);

  // ============================
  // LIMPIAR FORMULARIO
  // ============================

  const limpiarFormulario =
    () => {
      setIdParque('');
      setFechaFirma('');
      setPlazo('');
      setFechaRenovacion('');
      setEstadoConvenio(
        'Vigente',
      );
      setErrorFormulario('');
    };

  // ============================
  // NUEVO CONVENIO
  // ============================

  const abrirModalCrear =
    () => {
      limpiarFormulario();

      setModoEdicion(false);

      setIdConvenioEditando(
        null,
      );

      setModalAbierto(true);
    };

  // ============================
  // EDITAR CONVENIO
  // ============================

  const abrirModalEditar = (
    convenio: Convenio,
  ) => {
    setIdParque(
      convenio.parque
        ? String(
            convenio.parque
              .id_parque,
          )
        : '',
    );

    setFechaFirma(
      obtenerFechaInput(
        convenio.fecha_firma,
      ),
    );

    setPlazo(
      String(
        convenio.plazo ?? '',
      ),
    );

    setFechaRenovacion(
      obtenerFechaInput(
        convenio
          .fecha_renovacion_firmas,
      ),
    );

    setEstadoConvenio(
      convenio.estado_convenio ||
        'Vigente',
    );

    setModoEdicion(true);

    setIdConvenioEditando(
      convenio.id_convenio,
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

    setIdConvenioEditando(
      null,
    );
  };

  // ============================
  // GUARDAR CONVENIO
  // ============================

  const guardarConvenio = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setGuardando(true);
    setErrorFormulario('');

    try {
      const token =
        localStorage.getItem(
          'token',
        );

      // ============================
      // VALIDACIONES
      // ============================

      if (!idParque) {
        setErrorFormulario(
          'Debe seleccionar un parque.',
        );

        return;
      }

      if (!fechaFirma) {
        setErrorFormulario(
          'Debe indicar la fecha de firma.',
        );

        return;
      }

      if (
        !plazo ||
        Number(plazo) <= 0
      ) {
        setErrorFormulario(
          'El plazo debe ser mayor que 0.',
        );

        return;
      }

      if (!fechaRenovacion) {
        setErrorFormulario(
          'Debe indicar la fecha de renovación.',
        );

        return;
      }

      if (!estadoConvenio) {
        setErrorFormulario(
          'Debe seleccionar el estado del convenio.',
        );

        return;
      }

      if (
        fechaRenovacion <
        fechaFirma
      ) {
        setErrorFormulario(
          'La fecha de renovación no puede ser anterior a la fecha de firma.',
        );

        return;
      }

      // ============================
      // DATOS
      // ============================

      const datosConvenio = {
        id_parque:
          Number(idParque),

        fecha_firma:
          fechaFirma,

        plazo:
          Number(plazo),

        fecha_renovacion_firmas:
          fechaRenovacion,

        estado_convenio:
          estadoConvenio,
      };

      // ============================
      // EDITAR
      // ============================

      if (
        modoEdicion &&
        idConvenioEditando !==
          null
      ) {
        await api.patch(
          `/convenios/${idConvenioEditando}`,
          datosConvenio,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );
      }

      // ============================
      // CREAR
      // ============================

      else {
        await api.post(
          '/convenios',
          datosConvenio,
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

      setIdConvenioEditando(
        null,
      );

      await cargarConvenios();
    } catch (error: any) {
      console.error(
        'Error guardando convenio:',
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
            ? 'No se pudo actualizar el convenio.'
            : 'No se pudo registrar el convenio.',
        );
      }
    } finally {
      setGuardando(false);
    }
  };

  // ============================
  // ABRIR MODAL ELIMINAR
  // ============================

  const abrirModalEliminar = (
    convenio: Convenio,
  ) => {
    setConvenioEliminar(
      convenio,
    );

    setErrorEliminar('');

    setModalEliminarAbierto(
      true,
    );
  };

  // ============================
  // CERRAR MODAL ELIMINAR
  // ============================

  const cerrarModalEliminar =
    () => {
      if (eliminando) {
        return;
      }

      setModalEliminarAbierto(
        false,
      );

      setConvenioEliminar(
        null,
      );

      setErrorEliminar('');
    };

  // ============================
  // ELIMINAR CONVENIO
  // ============================

  const confirmarEliminarConvenio =
    async () => {
      if (!convenioEliminar) {
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
          `/convenios/${convenioEliminar.id_convenio}`,
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

        setConvenioEliminar(
          null,
        );

        await cargarConvenios();
      } catch (error: any) {
        console.error(
          'Error eliminando convenio:',
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
          setErrorEliminar(
            message.join(', '),
          );
        } else if (message) {
          setErrorEliminar(
            message,
          );
        } else {
          setErrorEliminar(
            'No se pudo eliminar el convenio.',
          );
        }
      } finally {
        setEliminando(false);
      }
    };

  // ============================
  // CERRAR SESIÓN
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

  // ============================
  // COLOR DEL ESTADO
  // ============================

  const obtenerClaseEstado = (
    estado: string,
  ) => {
    switch (estado) {
      case 'Vigente':
        return 'rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700';

      case 'En renovación':
        return 'rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700';

      case 'Vencido':
        return 'rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700';

      case 'Finalizado':
        return 'rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700';

      default:
        return 'rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600';
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">

      {/* ============================ */}
      {/* HEADER */}
      {/* ============================ */}

      <header className="border-b border-slate-200 bg-white px-8 py-5">

        <div className="mx-auto flex max-w-7xl items-center justify-between">

          <div>

            <h1 className="text-2xl font-bold text-slate-900">
              Gestión de Convenios
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Administración de los convenios asociados a los parques.
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

      {/* ============================ */}
      {/* CONTENIDO */}
      {/* ============================ */}

      <main className="mx-auto max-w-7xl px-8 py-10">

        <div className="mb-6 flex items-center justify-between">

          <div>

            <h2 className="text-xl font-semibold text-slate-900">
              Convenios registrados
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Consulte y administre los convenios registrados en el sistema.
            </p>

          </div>

          <button
            type="button"
            onClick={
              abrirModalCrear
            }
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Nuevo convenio
          </button>

        </div>

        {/* CARGANDO */}

        {cargando && (

          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            Cargando convenios...
          </div>

        )}

        {/* ERROR */}

        {!cargando &&
          error && (

          <div className="rounded-xl border border-red-200 bg-red-50 p-6">

            <p className="text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={
                cargarConvenios
              }
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white"
            >
              Intentar nuevamente
            </button>

          </div>

        )}

        {/* TABLA */}

        {!cargando &&
          !error && (

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-slate-50">

                  <tr>

                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                      Parque
                    </th>

                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                      Fecha de firma
                    </th>

                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                      Plazo
                    </th>

                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                      Renovación
                    </th>

                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                      Estado
                    </th>

                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                      Acciones
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {convenios.length ===
                  0 ? (

                    <tr>

                      <td
                        colSpan={6}
                        className="px-4 py-12 text-center text-slate-500"
                      >
                        No hay convenios registrados.
                      </td>

                    </tr>

                  ) : (

                    convenios.map(
                      (convenio) => (

                        <tr
                          key={
                            convenio.id_convenio
                          }
                          className="border-t border-slate-100 hover:bg-slate-50"
                        >

                          {/* PARQUE */}

                          <td className="px-4 py-4">

                            <p className="font-medium text-slate-900">

                              {convenio.parque
                                ?.ubicacion ??
                                'Parque no disponible'}

                            </p>

                            {convenio.parque
                              ?.numero_finca && (

                              <p className="mt-1 text-xs text-slate-500">

                                Finca:{' '}
                                {
                                  convenio.parque
                                    .numero_finca
                                }

                              </p>

                            )}

                          </td>

                          {/* FECHA FIRMA */}

                          <td className="px-4 py-4 text-sm text-slate-700">

                            {mostrarFecha(
                              convenio.fecha_firma,
                            )}

                          </td>

                          {/* PLAZO */}

                          <td className="px-4 py-4 text-sm text-slate-700">

                            {convenio.plazo}

                          </td>

                          {/* RENOVACIÓN */}

                          <td className="px-4 py-4 text-sm text-slate-700">

                            {mostrarFecha(
                              convenio
                                .fecha_renovacion_firmas,
                            )}

                          </td>

                          {/* ESTADO */}

                          <td className="px-4 py-4">

                            <span
                              className={obtenerClaseEstado(
                                convenio.estado_convenio,
                              )}
                            >
                              {
                                convenio.estado_convenio
                              }
                            </span>

                          </td>

                          {/* ACCIONES */}

                          <td className="px-4 py-4">

                            <div className="flex gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  abrirModalEditar(
                                    convenio,
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
                                    convenio,
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

      {/* ============================ */}
      {/* MODAL CREAR / EDITAR */}
      {/* ============================ */}

      {modalAbierto && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">

            {/* HEADER MODAL */}

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>

                <h2 className="text-xl font-bold text-slate-900">

                  {modoEdicion
                    ? 'Editar convenio'
                    : 'Nuevo convenio'}

                </h2>

                <p className="mt-1 text-sm text-slate-500">

                  {modoEdicion
                    ? 'Modifique la información del convenio.'
                    : 'Complete la información para registrar el convenio.'}

                </p>

              </div>

              <button
                type="button"
                onClick={
                  cerrarModal
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-600 hover:bg-slate-200"
              >
                ×
              </button>

            </div>

            {/* FORMULARIO */}

            <form
              onSubmit={
                guardarConvenio
              }
              className="p-6"
            >

              {errorFormulario && (

                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {errorFormulario}
                </div>

              )}

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                {/* PARQUE */}

                <div className="md:col-span-2">

                  <label className="mb-2 block text-sm font-medium text-slate-700">
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

                {/* FECHA FIRMA */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Fecha de firma
                  </label>

                  <input
                    type="date"
                    value={
                      fechaFirma
                    }
                    onChange={(
                      event,
                    ) =>
                      setFechaFirma(
                        event.target.value,
                      )
                    }
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />

                </div>

                {/* PLAZO */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Plazo
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={plazo}
                    onChange={(
                      event,
                    ) =>
                      setPlazo(
                        event.target.value,
                      )
                    }
                    required
                    placeholder="Ej: 5"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />

                  <p className="mt-1 text-xs text-slate-400">
                    Ejemplo: 5 años.
                  </p>

                </div>

                {/* FECHA RENOVACIÓN */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Fecha de renovación de firmas
                  </label>

                  <input
                    type="date"
                    value={
                      fechaRenovacion
                    }
                    min={
                      fechaFirma ||
                      undefined
                    }
                    onChange={(
                      event,
                    ) =>
                      setFechaRenovacion(
                        event.target.value,
                      )
                    }
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />

                </div>

                {/* ESTADO */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Estado del convenio
                  </label>

                  <select
                    value={
                      estadoConvenio
                    }
                    onChange={(
                      event,
                    ) =>
                      setEstadoConvenio(
                        event.target.value,
                      )
                    }
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  >

                    <option value="Vigente">
                      Vigente
                    </option>

                    <option value="En renovación">
                      En renovación
                    </option>

                    <option value="Finalizado">
                      Finalizado
                    </option>

                    <option value="Vencido">
                      Vencido
                    </option>

                  </select>

                  <p className="mt-1 text-xs text-slate-400">
                    Si la fecha de renovación ya pasó y el convenio continúa vigente, el sistema lo cambiará automáticamente a "En renovación".
                  </p>

                </div>

              </div>

              {/* BOTONES */}

              <div className="mt-7 flex justify-end gap-3 border-t border-slate-100 pt-5">

                <button
                  type="button"
                  onClick={
                    cerrarModal
                  }
                  disabled={
                    guardando
                  }
                  className="rounded-lg bg-slate-200 px-5 py-2 font-semibold text-slate-700 hover:bg-slate-300 disabled:opacity-60"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    guardando
                  }
                  className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >

                  {guardando
                    ? 'Guardando...'
                    : modoEdicion
                      ? 'Guardar cambios'
                      : 'Guardar convenio'}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* ============================ */}
      {/* MODAL ELIMINAR */}
      {/* ============================ */}

      {modalEliminarAbierto &&
        convenioEliminar && (

        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

            <div className="border-b border-slate-200 px-6 py-5">

              <h2 className="text-xl font-bold text-slate-900">
                Eliminar convenio
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Esta acción eliminará el convenio seleccionado.
              </p>

            </div>

            <div className="p-6">

              <div className="rounded-xl bg-red-50 p-4">

                <p className="text-sm text-red-700">
                  ¿Está seguro de que desea eliminar este convenio?
                </p>

                <p className="mt-3 font-semibold text-slate-900">

                  {convenioEliminar
                    .parque
                    ?.ubicacion ??
                    'Parque'}

                </p>

                {convenioEliminar
                  .parque
                  ?.numero_finca && (

                  <p className="mt-1 text-sm text-slate-500">

                    Finca:{' '}
                    {
                      convenioEliminar
                        .parque
                        .numero_finca
                    }

                  </p>

                )}

                <p className="mt-1 text-sm text-slate-500">

                  Fecha de firma:{' '}

                  {mostrarFecha(
                    convenioEliminar
                      .fecha_firma,
                  )}

                </p>

                <div className="mt-3">

                  <span
                    className={obtenerClaseEstado(
                      convenioEliminar
                        .estado_convenio,
                    )}
                  >
                    {
                      convenioEliminar
                        .estado_convenio
                    }
                  </span>

                </div>

              </div>

              {/* ERROR ELIMINAR */}

              {errorEliminar && (

                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {errorEliminar}
                </div>

              )}

              {/* BOTONES */}

              <div className="mt-6 flex justify-end gap-3">

                <button
                  type="button"
                  onClick={
                    cerrarModalEliminar
                  }
                  disabled={
                    eliminando
                  }
                  className="rounded-lg bg-slate-200 px-5 py-2 font-semibold text-slate-700 hover:bg-slate-300 disabled:opacity-60"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={
                    confirmarEliminarConvenio
                  }
                  disabled={
                    eliminando
                  }
                  className="rounded-lg bg-red-600 px-5 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
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
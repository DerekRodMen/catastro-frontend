import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';

import { useNavigate } from 'react-router-dom';

import { api } from '../../services/api';

interface Distrito {
  id_distrito: number;
  nombre_distrito: string;
  numero_distrito: number;
}

export default function Distritos() {
  const navigate = useNavigate();

  const [
    distritos,
    setDistritos,
  ] = useState<Distrito[]>([]);

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
    filtroNombre,
    setFiltroNombre,
  ] = useState('');

  const [
    filtroNumero,
    setFiltroNumero,
  ] = useState('');

  const normalizarTexto = (
    valor: string | null | undefined,
  ) =>
    (valor ?? '')
      .toLowerCase()
      .trim();

  const distritosFiltrados =
    distritos.filter(
      (distrito) => {
        const coincideNombre =
          normalizarTexto(
            distrito.nombre_distrito,
          ).includes(
            normalizarTexto(
              filtroNombre,
            ),
          );

        const coincideNumero =
          !filtroNumero ||
          String(
            distrito.numero_distrito,
          ).includes(
            filtroNumero.trim(),
          );

        return (
          coincideNombre &&
          coincideNumero
        );
      },
    );

  const hayFiltrosActivos =
    Boolean(
      filtroNombre ||
      filtroNumero,
    );

  const limpiarFiltros = () => {
    setFiltroNombre('');
    setFiltroNumero('');
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
    idDistritoEditando,
    setIdDistritoEditando,
  ] = useState<number | null>(null);

  // ============================
  // MODAL ELIMINAR
  // ============================

  const [
    modalEliminarAbierto,
    setModalEliminarAbierto,
  ] = useState(false);

  const [
    distritoEliminar,
    setDistritoEliminar,
  ] = useState<Distrito | null>(null);

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
    nombreDistrito,
    setNombreDistrito,
  ] = useState('');

  const [
    numeroDistrito,
    setNumeroDistrito,
  ] = useState('');

  // ============================
  // CARGAR DISTRITOS
  // ============================

  const cargarDistritos =
    async () => {
      try {
        setCargando(true);
        setError('');

        const response =
          await api.get(
            '/distritos',
          );

        setDistritos(
          response.data,
        );
      } catch (error) {
        console.error(
          'Error cargando distritos:',
          error,
        );

        setError(
          'No se pudieron cargar los distritos.',
        );
      } finally {
        setCargando(false);
      }
    };

  useEffect(() => {
    cargarDistritos();
  }, []);

  // ============================
  // LIMPIAR FORMULARIO
  // ============================

  const limpiarFormulario =
    () => {
      setNombreDistrito('');
      setNumeroDistrito('');
      setErrorFormulario('');
    };

  // ============================
  // NUEVO DISTRITO
  // ============================

  const abrirModalCrear =
    () => {
      limpiarFormulario();

      setModoEdicion(false);
      setIdDistritoEditando(null);

      setModalAbierto(true);
    };

  // ============================
  // EDITAR DISTRITO
  // ============================

  const abrirModalEditar = (
    distrito: Distrito,
  ) => {
    setNombreDistrito(
      distrito.nombre_distrito ?? '',
    );

    setNumeroDistrito(
      String(
        distrito.numero_distrito ?? '',
      ),
    );

    setModoEdicion(true);

    setIdDistritoEditando(
      distrito.id_distrito,
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
    setIdDistritoEditando(null);
  };

  // ============================
  // GUARDAR / EDITAR
  // ============================

  const guardarDistrito = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setGuardando(true);
    setErrorFormulario('');

    try {
      const token =
        localStorage.getItem('token');

      const datosDistrito = {
        nombre_distrito:
          nombreDistrito,

        numero_distrito:
          Number(numeroDistrito),
      };

      if (
        modoEdicion &&
        idDistritoEditando !== null
      ) {
        await api.patch(
          `/distritos/${idDistritoEditando}`,
          datosDistrito,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );
      } else {
        await api.post(
          '/distritos',
          datosDistrito,
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
      setIdDistritoEditando(null);

      await cargarDistritos();
    } catch (error: any) {
      console.error(
        'Error guardando distrito:',
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
        error.response?.data?.message;

      if (Array.isArray(message)) {
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
            ? 'No se pudo actualizar el distrito.'
            : 'No se pudo registrar el distrito.',
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
    distrito: Distrito,
  ) => {
    setDistritoEliminar(
      distrito,
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

      setDistritoEliminar(
        null,
      );

      setErrorEliminar('');
    };

  // ============================
  // CONFIRMAR ELIMINAR
  // ============================

  const confirmarEliminarDistrito =
    async () => {
      if (!distritoEliminar) {
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
          `/distritos/${distritoEliminar.id_distrito}`,
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

        setDistritoEliminar(
          null,
        );

        await cargarDistritos();
      } catch (error: any) {
        console.error(
          'Error eliminando distrito:',
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
            'No se pudo eliminar el distrito.',
          );
        }
      } finally {
        setEliminando(false);
      }
    };

  // ============================
  // LOGOUT
  // ============================

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');

    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-100">

      {/* HEADER */}

      <header className="border-b border-slate-200 bg-white px-8 py-5">

        <div className="mx-auto flex max-w-7xl items-center justify-between">

          <div>

            <h1 className="text-2xl font-bold text-slate-900">
              Gestión de Distritos
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Administración de los distritos registrados en el sistema.
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
              onClick={handleLogout}
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
              Distritos registrados
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Consulte y administre los distritos registrados en el sistema.
            </p>

          </div>

          <button
            type="button"
            onClick={
              abrirModalCrear
            }
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Nuevo distrito
          </button>

        </div>

        {/* ============================ */}
        {/* FILTROS DE BÚSQUEDA */}
        {/* ============================ */}

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h3 className="font-semibold text-slate-900">
                Filtros de búsqueda
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Utilice uno o ambos criterios para localizar distritos específicos.
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Nombre del distrito
              </label>

              <input
                type="text"
                value={filtroNombre}
                onChange={(event) =>
                  setFiltroNombre(
                    event.target.value,
                  )
                }
                placeholder="Ej: Grecia"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Número de distrito
              </label>

              <input
                type="number"
                min="1"
                value={filtroNumero}
                onChange={(event) =>
                  setFiltroNumero(
                    event.target.value,
                  )
                }
                placeholder="Ej: 1"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

          </div>

          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-500">
              Mostrando{' '}
              <span className="font-semibold text-slate-900">
                {distritosFiltrados.length}
              </span>{' '}
              de{' '}
              <span className="font-semibold text-slate-900">
                {distritos.length}
              </span>{' '}
              distritos.
            </p>
          </div>

        </div>

        {cargando && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            Cargando distritos...
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
                cargarDistritos
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
                      Nombre del distrito
                    </th>

                    <th className="px-4 py-3 text-left">
                      Número de distrito
                    </th>

                    <th className="px-4 py-3 text-left">
                      Acciones
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {distritosFiltrados.length ===
                  0 ? (

                    <tr>

                      <td
                        colSpan={3}
                        className="px-4 py-12 text-center text-slate-500"
                      >
                        {hayFiltrosActivos
                          ? 'No se encontraron distritos que coincidan con los filtros seleccionados.'
                          : 'No hay distritos registrados.'}
                      </td>

                    </tr>

                  ) : (

                    distritosFiltrados.map(
                      (distrito) => (

                        <tr
                          key={
                            distrito.id_distrito
                          }
                          className="border-t border-slate-100 hover:bg-slate-50"
                        >

                          <td className="px-4 py-4 font-medium">
                            {
                              distrito.nombre_distrito
                            }
                          </td>

                          <td className="px-4 py-4">
                            {
                              distrito.numero_distrito
                            }
                          </td>

                          <td className="px-4 py-4">

                            <div className="flex gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  abrirModalEditar(
                                    distrito,
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
                                    distrito,
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
                    ? 'Editar distrito'
                    : 'Nuevo distrito'}

                </h2>

                <p className="mt-1 text-sm text-slate-500">

                  {modoEdicion
                    ? 'Modifique la información del distrito.'
                    : 'Complete la información para registrar el distrito.'}

                </p>

              </div>

              <button
                type="button"
                onClick={cerrarModal}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-600 hover:bg-slate-200"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={
                guardarDistrito
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
                    Nombre del distrito
                  </label>

                  <input
                    type="text"
                    value={
                      nombreDistrito
                    }
                    onChange={(
                      event,
                    ) =>
                      setNombreDistrito(
                        event.target.value,
                      )
                    }
                    required
                    placeholder="Ej: Grecia"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium">
                    Número del distrito
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={
                      numeroDistrito
                    }
                    onChange={(
                      event,
                    ) =>
                      setNumeroDistrito(
                        event.target.value,
                      )
                    }
                    required
                    placeholder="Ej: 1"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />

                </div>

              </div>

              <div className="mt-7 flex justify-end gap-3 border-t border-slate-100 pt-5">

                <button
                  type="button"
                  onClick={cerrarModal}
                  disabled={guardando}
                  className="rounded-lg bg-slate-200 px-5 py-2 font-semibold text-slate-700 hover:bg-slate-300 disabled:opacity-60"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >

                  {guardando
                    ? 'Guardando...'
                    : modoEdicion
                      ? 'Guardar cambios'
                      : 'Guardar distrito'}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* MODAL ELIMINAR */}

      {modalEliminarAbierto &&
        distritoEliminar && (

        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

            <div className="border-b border-slate-200 px-6 py-5">

              <h2 className="text-xl font-bold text-slate-900">
                Eliminar distrito
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Esta acción eliminará el registro seleccionado.
              </p>

            </div>

            <div className="p-6">

              <div className="rounded-xl bg-red-50 p-4">

                <p className="text-sm text-red-700">
                  ¿Está seguro de que desea eliminar este distrito?
                </p>

                <p className="mt-3 font-semibold text-slate-900">
                  {
                    distritoEliminar.nombre_distrito
                  }
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Número de distrito: {
                    distritoEliminar.numero_distrito
                  }
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
                  disabled={eliminando}
                  className="rounded-lg bg-slate-200 px-5 py-2 font-semibold text-slate-700 hover:bg-slate-300 disabled:opacity-60"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={
                    confirmarEliminarDistrito
                  }
                  disabled={eliminando}
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
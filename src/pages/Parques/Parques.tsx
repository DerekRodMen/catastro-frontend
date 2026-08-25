import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';

import { useNavigate } from 'react-router-dom';

import { api } from '../../services/api';

type TipoEncargado =
  | 'ASOCIACION'
  | 'PERSONA';

interface Parque {
  id_parque: number;
  ubicacion: string;
  numero_finca: string;
  area: number;
  numero_plano: string;
  visado: string;
  estado: string;

  descripcion_inversion: string;
  inversion: number;
  fecha_inversion: string;

  id_distrito: number;
  id_encargado: number;

  distrito?: {
    id_distrito: number;
    nombre_distrito: string;
    numero_distrito: number;
  };

  encargado?: {
    id_encargado: number;
    tipo_encargado: TipoEncargado;
    nombre_asociacion: string | null;
    nombre_encargado: string;
  };
}

interface Distrito {
  id_distrito: number;
  nombre_distrito: string;
  numero_distrito: number;
}

interface Encargado {
  id_encargado: number;
  tipo_encargado: TipoEncargado;
  nombre_asociacion: string | null;
  cedula_juridica: string | null;
  nombre_encargado: string;
  cedula_fisica: string | null;
  correo_encargado: string;
  telefono_encargado: string;
}

export default function Parques() {
  const navigate = useNavigate();

  const [parques, setParques] =
    useState<Parque[]>([]);

  const [distritos, setDistritos] =
    useState<Distrito[]>([]);

  const [encargados, setEncargados] =
    useState<Encargado[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState('');

  // ============================
  // MODAL CREAR / EDITAR
  // ============================

  const [
    modalAbierto,
    setModalAbierto,
  ] = useState(false);

  const [guardando, setGuardando] =
    useState(false);

  const [
    errorFormulario,
    setErrorFormulario,
  ] = useState('');

  const [
    modoEdicion,
    setModoEdicion,
  ] = useState(false);

  const [
    idParqueEditando,
    setIdParqueEditando,
  ] = useState<number | null>(null);

  // ============================
  // MODAL ELIMINAR
  // ============================

  const [
    modalEliminarAbierto,
    setModalEliminarAbierto,
  ] = useState(false);

  const [
    parqueEliminar,
    setParqueEliminar,
  ] = useState<Parque | null>(null);

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

  const [ubicacion, setUbicacion] =
    useState('');

  const [
    numeroFinca,
    setNumeroFinca,
  ] = useState('');

  const [area, setArea] =
    useState('');

  const [
    numeroPlano,
    setNumeroPlano,
  ] = useState('');

  const [visado, setVisado] =
    useState('');

  const [estado, setEstado] =
    useState('');

  const [
    idDistrito,
    setIdDistrito,
  ] = useState('');

  const [
    idEncargado,
    setIdEncargado,
  ] = useState('');

  // ============================
  // CARGAR PARQUES
  // ============================

  const cargarParques = async () => {
    try {
      setCargando(true);
      setError('');

      const response =
        await api.get('/parques');

      setParques(response.data);
    } catch (error) {
      console.error(
        'Error cargando parques:',
        error,
      );

      setError(
        'No se pudieron cargar los parques.',
      );
    } finally {
      setCargando(false);
    }
  };

  // ============================
  // CARGAR DISTRITOS
  // ============================

  const cargarDistritos = async () => {
    try {
      const response =
        await api.get('/distritos');

      setDistritos(response.data);
    } catch (error) {
      console.error(
        'Error cargando distritos:',
        error,
      );
    }
  };

  // ============================
  // CARGAR ENCARGADOS
  // ============================

  const cargarEncargados = async () => {
    try {
      const response =
        await api.get('/encargados');

      setEncargados(response.data);
    } catch (error) {
      console.error(
        'Error cargando encargados:',
        error,
      );
    }
  };

  useEffect(() => {
    cargarParques();
    cargarDistritos();
    cargarEncargados();
  }, []);

  // ============================
  // LIMPIAR FORMULARIO
  // ============================

  const limpiarFormulario = () => {
    setUbicacion('');
    setNumeroFinca('');
    setArea('');
    setNumeroPlano('');
    setVisado('');
    setEstado('');
    setIdDistrito('');
    setIdEncargado('');
    setErrorFormulario('');
  };

  // ============================
  // NUEVO
  // ============================

  const abrirModalCrear = () => {
    limpiarFormulario();

    setModoEdicion(false);
    setIdParqueEditando(null);
    setModalAbierto(true);
  };

  // ============================
  // EDITAR
  // ============================

  const abrirModalEditar = (
    parque: Parque,
  ) => {
    setUbicacion(
      parque.ubicacion ?? '',
    );

    setNumeroFinca(
      parque.numero_finca ?? '',
    );

    setArea(
      String(parque.area ?? ''),
    );

    setNumeroPlano(
      parque.numero_plano ?? '',
    );

    setVisado(
      parque.visado ?? '',
    );

    setEstado(
      parque.estado ?? '',
    );

    setIdDistrito(
      parque.id_distrito
        ? String(parque.id_distrito)
        : parque.distrito
          ? String(
              parque.distrito
                .id_distrito,
            )
          : '',
    );

    setIdEncargado(
      parque.id_encargado
        ? String(parque.id_encargado)
        : parque.encargado
          ? String(
              parque.encargado
                .id_encargado,
            )
          : '',
    );

    setModoEdicion(true);

    setIdParqueEditando(
      parque.id_parque,
    );

    setErrorFormulario('');
    setModalAbierto(true);
  };

  // ============================
  // CERRAR MODAL CREAR / EDITAR
  // ============================

  const cerrarModal = () => {
    if (guardando) {
      return;
    }

    setModalAbierto(false);

    limpiarFormulario();

    setModoEdicion(false);
    setIdParqueEditando(null);
  };

  // ============================
  // GUARDAR
  // ============================

  const guardarParque = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setGuardando(true);
    setErrorFormulario('');

    try {
      const token =
        localStorage.getItem('token');

      const datosParque = {
        ubicacion,

        numero_finca:
          numeroFinca,

        area:
          Number(area),

        numero_plano:
          numeroPlano,

        visado,

        estado,

        descripcion_inversion:
          'Sin inversión registrada',

        inversion:
          0,

        fecha_inversion:
          '2026-01-01',

        id_distrito:
          Number(idDistrito),

        id_encargado:
          Number(idEncargado),
      };

      if (
        modoEdicion &&
        idParqueEditando !== null
      ) {
        await api.patch(
          `/parques/${idParqueEditando}`,
          datosParque,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );
      } else {
        await api.post(
          '/parques',
          datosParque,
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
      setIdParqueEditando(null);

      await cargarParques();
    } catch (error: any) {
      console.error(
        'Error guardando parque:',
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
            ? 'No se pudo actualizar el parque.'
            : 'No se pudo registrar el parque.',
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
    parque: Parque,
  ) => {
    setParqueEliminar(parque);
    setErrorEliminar('');
    setModalEliminarAbierto(true);
  };

  // ============================
  // CERRAR MODAL ELIMINAR
  // ============================

  const cerrarModalEliminar = () => {
    if (eliminando) {
      return;
    }

    setModalEliminarAbierto(false);
    setParqueEliminar(null);
    setErrorEliminar('');
  };

  // ============================
  // CONFIRMAR ELIMINACIÓN
  // ============================

  const confirmarEliminarParque =
    async () => {
      if (!parqueEliminar) {
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
          `/parques/${parqueEliminar.id_parque}`,
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

        setParqueEliminar(null);

        await cargarParques();
      } catch (error: any) {
        console.error(
          'Error eliminando parque:',
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
            'No se pudo eliminar el parque.',
          );
        }
      } finally {
        setEliminando(false);
      }
    };

  // ============================
  // NOMBRE ENCARGADO
  // ============================

  const obtenerNombreEncargado = (
    encargado: Encargado,
  ) => {
    if (
      encargado.tipo_encargado ===
      'ASOCIACION'
    ) {
      return (
        encargado.nombre_asociacion ||
        encargado.nombre_encargado
      );
    }

    return encargado.nombre_encargado;
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
              Gestión de Parques
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Administración de los parques registrados en el sistema.
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
              Parques registrados
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Consulte y administre la información almacenada en el sistema.
            </p>

          </div>

          <button
            type="button"
            onClick={
              abrirModalCrear
            }
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Nuevo parque
          </button>

        </div>

        {cargando && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            Cargando parques...
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
              onClick={cargarParques}
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
                      Ubicación
                    </th>

                    <th className="px-4 py-3 text-left">
                      Finca
                    </th>

                    <th className="px-4 py-3 text-left">
                      Área
                    </th>

                    <th className="px-4 py-3 text-left">
                      Plano
                    </th>

                    <th className="px-4 py-3 text-left">
                      Visado
                    </th>

                    <th className="px-4 py-3 text-left">
                      Distrito
                    </th>

                    <th className="px-4 py-3 text-left">
                      Encargado
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

                  {parques.length ===
                  0 ? (

                    <tr>

                      <td
                        colSpan={9}
                        className="px-4 py-12 text-center text-slate-500"
                      >
                        No hay parques registrados.
                      </td>

                    </tr>

                  ) : (

                    parques.map(
                      (parque) => (

                        <tr
                          key={
                            parque.id_parque
                          }
                          className="border-t border-slate-100 hover:bg-slate-50"
                        >

                          <td className="px-4 py-4 font-medium">
                            {
                              parque.ubicacion
                            }
                          </td>

                          <td className="px-4 py-4">
                            {
                              parque.numero_finca
                            }
                          </td>

                          <td className="px-4 py-4">
                            {parque.area} m²
                          </td>

                          <td className="px-4 py-4">
                            {
                              parque.numero_plano
                            }
                          </td>

                          <td className="px-4 py-4">
                            {
                              parque.visado
                            }
                          </td>

                          <td className="px-4 py-4">

                            {
                              parque.distrito
                                ?.nombre_distrito ??
                              parque.id_distrito
                            }

                          </td>

                          <td className="px-4 py-4">

                            {parque.encargado
                              ? parque.encargado
                                  .tipo_encargado ===
                                'ASOCIACION'
                                ? parque.encargado
                                    .nombre_asociacion
                                : parque.encargado
                                    .nombre_encargado
                              : parque.id_encargado}

                          </td>

                          <td className="px-4 py-4">

                            <span
                              className={
                                parque.estado ===
                                'Activo'
                                  ? 'rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700'
                                  : 'rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700'
                              }
                            >
                              {parque.estado}
                            </span>

                          </td>

                          <td className="px-4 py-4">

                            <div className="flex gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  abrirModalEditar(
                                    parque,
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
                                    parque,
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

          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>

                <h2 className="text-xl font-bold text-slate-900">

                  {modoEdicion
                    ? 'Editar parque'
                    : 'Nuevo parque'}

                </h2>

                <p className="mt-1 text-sm text-slate-500">

                  {modoEdicion
                    ? 'Modifique la información del parque.'
                    : 'Complete la información para registrar el parque.'}

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

            <form
              onSubmit={guardarParque}
              className="p-6"
            >

              {errorFormulario && (

                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {errorFormulario}
                </div>

              )}

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm font-medium">
                    Ubicación
                  </label>

                  <input
                    type="text"
                    value={ubicacion}
                    onChange={(event) =>
                      setUbicacion(
                        event.target.value,
                      )
                    }
                    required
                    placeholder="Ej: Barrio Latino, Grecia Centro"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium">
                    Número de finca
                  </label>

                  <input
                    type="text"
                    value={numeroFinca}
                    onChange={(event) =>
                      setNumeroFinca(
                        event.target.value,
                      )
                    }
                    required
                    placeholder="Ej: 2-123456-000"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium">
                    Área (m²)
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={area}
                    onChange={(event) =>
                      setArea(
                        event.target.value,
                      )
                    }
                    required
                    placeholder="Ej: 2500.50"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium">
                    Número de plano
                  </label>

                  <input
                    type="text"
                    value={numeroPlano}
                    onChange={(event) =>
                      setNumeroPlano(
                        event.target.value,
                      )
                    }
                    required
                    placeholder="Ej: A-1234567-2026"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium">
                    Visado
                  </label>

                  <input
                    type="text"
                    value={visado}
                    onChange={(event) =>
                      setVisado(
                        event.target.value,
                      )
                    }
                    required
                    placeholder="Ej: Visado municipal aprobado"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium">
                    Estado
                  </label>

                  <select
                    value={estado}
                    onChange={(event) =>
                      setEstado(
                        event.target.value,
                      )
                    }
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  >

                    <option value="">
                      Seleccione el estado
                    </option>

                    <option value="Activo">
                      Activo
                    </option>

                    <option value="Inactivo">
                      Inactivo
                    </option>

                  </select>

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium">
                    Distrito
                  </label>

                  <select
                    value={idDistrito}
                    onChange={(event) =>
                      setIdDistrito(
                        event.target.value,
                      )
                    }
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  >

                    <option value="">
                      Seleccione un distrito
                    </option>

                    {distritos.map(
                      (distrito) => (

                        <option
                          key={
                            distrito.id_distrito
                          }
                          value={
                            distrito.id_distrito
                          }
                        >
                          {
                            distrito.nombre_distrito
                          }
                        </option>

                      ),
                    )}

                  </select>

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium">
                    Encargado
                  </label>

                  <select
                    value={idEncargado}
                    onChange={(event) =>
                      setIdEncargado(
                        event.target.value,
                      )
                    }
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  >

                    <option value="">
                      Seleccione un encargado
                    </option>

                    {encargados.map(
                      (encargado) => (

                        <option
                          key={
                            encargado.id_encargado
                          }
                          value={
                            encargado.id_encargado
                          }
                        >

                          {obtenerNombreEncargado(
                            encargado,
                          )}

                          {' — '}

                          {encargado.tipo_encargado ===
                          'ASOCIACION'
                            ? 'Asociación'
                            : 'Persona'}

                        </option>

                      ),
                    )}

                  </select>

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
                      : 'Guardar parque'}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* MODAL ELIMINAR */}

      {modalEliminarAbierto &&
        parqueEliminar && (

        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

            <div className="border-b border-slate-200 px-6 py-5">

              <h2 className="text-xl font-bold text-slate-900">
                Eliminar parque
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Esta acción eliminará el registro seleccionado.
              </p>

            </div>

            <div className="p-6">

              <div className="rounded-xl bg-red-50 p-4">

                <p className="text-sm text-red-700">
                  ¿Está seguro de que desea eliminar este parque?
                </p>

                <p className="mt-3 font-semibold text-slate-900">
                  {parqueEliminar.ubicacion}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Finca: {parqueEliminar.numero_finca}
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
                    confirmarEliminarParque
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
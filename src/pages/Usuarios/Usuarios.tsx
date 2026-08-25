import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from 'react';

import { useNavigate } from 'react-router-dom';

import { api } from '../../services/api';

interface Usuario {
  id_usuario: number;
  nombre_usuario: string | null;
  correo: string;
  estado: boolean;
}

export default function Usuarios() {
  const navigate = useNavigate();

  // ============================
  // DATOS
  // ============================

  const [usuarios, setUsuarios] =
    useState<Usuario[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState('');

  // ============================
  // MODAL INVITAR
  // ============================

  const [
    modalInvitarAbierto,
    setModalInvitarAbierto,
  ] = useState(false);

  const [
    correoInvitacion,
    setCorreoInvitacion,
  ] = useState('');

  const [
    enviandoInvitacion,
    setEnviandoInvitacion,
  ] = useState(false);

  const [
    errorInvitacion,
    setErrorInvitacion,
  ] = useState('');

  // ============================
  // MODAL INVITACIÓN ENVIADA
  // ============================

  const [
    modalExitoAbierto,
    setModalExitoAbierto,
  ] = useState(false);

  const [
    correoInvitado,
    setCorreoInvitado,
  ] = useState('');

  // ============================
  // MODAL EDITAR
  // ============================

  const [
    modalEditarAbierto,
    setModalEditarAbierto,
  ] = useState(false);

  const [
    usuarioEditando,
    setUsuarioEditando,
  ] = useState<Usuario | null>(null);

  const [
    nombreUsuario,
    setNombreUsuario,
  ] = useState('');

  const [
    correoEditar,
    setCorreoEditar,
  ] = useState('');

  const [
    estado,
    setEstado,
  ] = useState(true);

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    errorEditar,
    setErrorEditar,
  ] = useState('');

  // ============================
  // MODAL ELIMINAR
  // ============================

  const [
    modalEliminarAbierto,
    setModalEliminarAbierto,
  ] = useState(false);

  const [
    usuarioEliminar,
    setUsuarioEliminar,
  ] = useState<Usuario | null>(null);

  const [
    eliminando,
    setEliminando,
  ] = useState(false);

  const [
    errorEliminar,
    setErrorEliminar,
  ] = useState('');

  // ============================
  // TOKEN
  // ============================

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

        navigate('/login');

        return null;
      }

      return token;
    }, [navigate]);

  // ============================
  // CARGAR USUARIOS
  // ============================

  const cargarUsuarios =
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
            '/usuarios',
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        setUsuarios(
          response.data,
        );
      } catch (error: any) {
        console.error(
          'Error cargando usuarios:',
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

        setError(
          'No se pudieron cargar los usuarios.',
        );
      } finally {
        setCargando(false);
      }
    }, [
      navigate,
      obtenerToken,
    ]);

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  // ============================
  // ABRIR INVITACIÓN
  // ============================

  const abrirModalInvitar =
    () => {
      setCorreoInvitacion('');
      setErrorInvitacion('');
      setModalInvitarAbierto(
        true,
      );
    };

  // ============================
  // CERRAR INVITACIÓN
  // ============================

  const cerrarModalInvitar =
    () => {
      if (enviandoInvitacion) {
        return;
      }

      setModalInvitarAbierto(
        false,
      );

      setCorreoInvitacion('');
      setErrorInvitacion('');
    };

  // ============================
  // ENVIAR INVITACIÓN
  // ============================

  const enviarInvitacion =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      setErrorInvitacion('');

      const correo =
        correoInvitacion
          .trim()
          .toLowerCase();

      if (!correo) {
        setErrorInvitacion(
          'Debe ingresar un correo electrónico.',
        );

        return;
      }

      try {
        setEnviandoInvitacion(
          true,
        );

        const token =
          obtenerToken();

        if (!token) {
          return;
        }

        await api.post(
          '/usuarios/invitar',
          {
            correo,
          },
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

        setCorreoInvitado(
          correo,
        );

        setModalInvitarAbierto(
          false,
        );

        setCorreoInvitacion('');

        await cargarUsuarios();

        setModalExitoAbierto(
          true,
        );
      } catch (error: any) {
        console.error(
          'Error enviando invitación:',
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
          Array.isArray(message)
        ) {
          setErrorInvitacion(
            message.join(', '),
          );
        } else if (message) {
          setErrorInvitacion(
            message,
          );
        } else {
          setErrorInvitacion(
            'No se pudo enviar la invitación.',
          );
        }
      } finally {
        setEnviandoInvitacion(
          false,
        );
      }
    };

  // ============================
  // EDITAR
  // ============================

  const abrirModalEditar = (
    usuario: Usuario,
  ) => {
    setUsuarioEditando(
      usuario,
    );

    setNombreUsuario(
      usuario.nombre_usuario ??
        '',
    );

    setCorreoEditar(
      usuario.correo,
    );

    setEstado(
      usuario.estado,
    );

    setErrorEditar('');

    setModalEditarAbierto(
      true,
    );
  };

  const cerrarModalEditar =
    () => {
      if (guardando) {
        return;
      }

      setModalEditarAbierto(
        false,
      );

      setUsuarioEditando(
        null,
      );

      setNombreUsuario('');
      setCorreoEditar('');
      setErrorEditar('');
    };

  const guardarCambios =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      if (!usuarioEditando) {
        return;
      }

      setErrorEditar('');

      if (
        !correoEditar.trim()
      ) {
        setErrorEditar(
          'Debe ingresar el correo electrónico.',
        );

        return;
      }

      try {
        setGuardando(true);

        const token =
          obtenerToken();

        if (!token) {
          return;
        }

        await api.patch(
          `/usuarios/${usuarioEditando.id_usuario}`,
          {
            nombre_usuario:
              nombreUsuario.trim(),

            correo:
              correoEditar
                .trim()
                .toLowerCase(),

            estado,
          },
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

        setModalEditarAbierto(
          false,
        );

        setUsuarioEditando(
          null,
        );

        await cargarUsuarios();
      } catch (error: any) {
        console.error(
          'Error actualizando usuario:',
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
          Array.isArray(message)
        ) {
          setErrorEditar(
            message.join(', '),
          );
        } else if (message) {
          setErrorEditar(
            message,
          );
        } else {
          setErrorEditar(
            'No se pudo actualizar el usuario.',
          );
        }
      } finally {
        setGuardando(false);
      }
    };

  // ============================
  // ELIMINAR
  // ============================

  const abrirModalEliminar = (
    usuario: Usuario,
  ) => {
    setUsuarioEliminar(
      usuario,
    );

    setErrorEliminar('');

    setModalEliminarAbierto(
      true,
    );
  };

  const cerrarModalEliminar =
    () => {
      if (eliminando) {
        return;
      }

      setModalEliminarAbierto(
        false,
      );

      setUsuarioEliminar(
        null,
      );

      setErrorEliminar('');
    };

  const confirmarEliminar =
    async () => {
      if (!usuarioEliminar) {
        return;
      }

      try {
        setEliminando(true);
        setErrorEliminar('');

        const token =
          obtenerToken();

        if (!token) {
          return;
        }

        await api.delete(
          `/usuarios/${usuarioEliminar.id_usuario}`,
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

        setUsuarioEliminar(
          null,
        );

        await cargarUsuarios();
      } catch (error: any) {
        console.error(
          'Error eliminando usuario:',
          error,
        );

        const message =
          error.response?.data
            ?.message;

        setErrorEliminar(
          Array.isArray(message)
            ? message.join(', ')
            : message ||
                'No se pudo eliminar el usuario.',
        );
      } finally {
        setEliminando(false);
      }
    };

  // ============================
  // LOGOUT
  // ============================

  const cerrarSesion = () => {
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
              Gestión de Usuarios
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Administración de los usuarios con acceso al sistema.
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
                cerrarSesion
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
              Usuarios registrados
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Consulte y administre los usuarios del sistema.
            </p>
          </div>

          <button
            type="button"
            onClick={
              abrirModalInvitar
            }
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Nuevo usuario
          </button>

        </div>

        {/* CARGANDO */}

        {cargando && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            Cargando usuarios...
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
                  cargarUsuarios
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
                        Nombre
                      </th>

                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                        Correo
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

                    {usuarios.length ===
                    0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-12 text-center text-slate-500"
                        >
                          No hay usuarios registrados.
                        </td>
                      </tr>
                    ) : (
                      usuarios.map(
                        (usuario) => (
                          <tr
                            key={
                              usuario.id_usuario
                            }
                            className="border-t border-slate-100 hover:bg-slate-50"
                          >

                            <td className="px-4 py-4 font-medium text-slate-900">
                              {usuario.nombre_usuario ||
                                'Pendiente de activación'}
                            </td>

                            <td className="px-4 py-4 text-sm text-slate-700">
                              {
                                usuario.correo
                              }
                            </td>

                            <td className="px-4 py-4">

                              {usuario.estado ? (
                                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                  Activo
                                </span>
                              ) : usuario.nombre_usuario ===
                                null ? (
                                <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                                  Invitación pendiente
                                </span>
                              ) : (
                                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                                  Inactivo
                                </span>
                              )}

                            </td>

                            <td className="px-4 py-4">
                              <div className="flex gap-2">

                                <button
                                  type="button"
                                  onClick={() =>
                                    abrirModalEditar(
                                      usuario,
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
                                      usuario,
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
      {/* MODAL INVITAR */}
      {/* ============================ */}

      {modalInvitarAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

            <div className="border-b border-slate-200 px-6 py-5">

              <h2 className="text-xl font-bold text-slate-900">
                Nuevo usuario
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Se enviará una invitación para que la persona cree su propia contraseña.
              </p>

            </div>

            <form
              onSubmit={
                enviarInvitacion
              }
              className="p-6"
            >

              {errorInvitacion && (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {errorInvitacion}
                </div>
              )}

              <label className="mb-2 block text-sm font-medium text-slate-700">
                Correo electrónico
              </label>

              <input
                type="email"
                value={
                  correoInvitacion
                }
                onChange={(event) =>
                  setCorreoInvitacion(
                    event.target.value,
                  )
                }
                required
                autoFocus
                placeholder="funcionario@correo.com"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />

              <div className="mt-7 flex justify-end gap-3">

                <button
                  type="button"
                  onClick={
                    cerrarModalInvitar
                  }
                  disabled={
                    enviandoInvitacion
                  }
                  className="rounded-lg bg-slate-200 px-5 py-2 font-semibold text-slate-700 hover:bg-slate-300 disabled:opacity-60"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    enviandoInvitacion
                  }
                  className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {enviandoInvitacion
                    ? 'Enviando...'
                    : 'Enviar invitación'}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* ============================ */}
      {/* MODAL ÉXITO */}
      {/* ============================ */}

      {modalExitoAbierto && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700">
              ✓
            </div>

            <h2 className="mt-4 text-center text-xl font-bold text-slate-900">
              Invitación enviada
            </h2>

            <p className="mt-3 text-center text-sm text-slate-600">
              Se envió correctamente la invitación a:
            </p>

            <p className="mt-2 break-all text-center font-semibold text-slate-900">
              {correoInvitado}
            </p>

            <p className="mt-4 text-center text-sm text-slate-500">
              La persona deberá abrir el enlace recibido para crear su contraseña y activar su cuenta.
            </p>

            <button
              type="button"
              onClick={() =>
                setModalExitoAbierto(
                  false,
                )
              }
              className="mt-6 w-full rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700"
            >
              Aceptar
            </button>

          </div>

        </div>
      )}

      {/* ============================ */}
      {/* MODAL EDITAR */}
      {/* ============================ */}

      {modalEditarAbierto &&
        usuarioEditando && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

              <div className="border-b border-slate-200 px-6 py-5">
                <h2 className="text-xl font-bold text-slate-900">
                  Editar usuario
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Modifique la información del usuario.
                </p>
              </div>

              <form
                onSubmit={
                  guardarCambios
                }
                className="p-6"
              >

                {errorEditar && (
                  <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {errorEditar}
                  </div>
                )}

                <div className="space-y-5">

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Nombre
                    </label>

                    <input
                      type="text"
                      value={
                        nombreUsuario
                      }
                      onChange={(event) =>
                        setNombreUsuario(
                          event.target.value,
                        )
                      }
                      disabled={
                        usuarioEditando.nombre_usuario ===
                        null
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-100"
                    />

                    {usuarioEditando.nombre_usuario ===
                      null && (
                      <p className="mt-1 text-xs text-slate-500">
                        El nombre será establecido por el usuario al activar su cuenta.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Correo electrónico
                    </label>

                    <input
                      type="email"
                      value={
                        correoEditar
                      }
                      onChange={(event) =>
                        setCorreoEditar(
                          event.target.value,
                        )
                      }
                      required
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Estado
                    </label>

                    <select
                      value={
                        estado
                          ? 'activo'
                          : 'inactivo'
                      }
                      onChange={(event) =>
                        setEstado(
                          event.target.value ===
                            'activo',
                        )
                      }
                      disabled={
                        usuarioEditando.nombre_usuario ===
                        null
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-100"
                    >

                      <option value="activo">
                        Activo
                      </option>

                      <option value="inactivo">
                        Inactivo
                      </option>

                    </select>
                  </div>

                </div>

                <div className="mt-7 flex justify-end gap-3">

                  <button
                    type="button"
                    onClick={
                      cerrarModalEditar
                    }
                    disabled={
                      guardando
                    }
                    className="rounded-lg bg-slate-200 px-5 py-2 font-semibold text-slate-700 hover:bg-slate-300"
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
                      : 'Guardar cambios'}
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
        usuarioEliminar && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">

            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

              <div className="border-b border-slate-200 px-6 py-5">

                <h2 className="text-xl font-bold text-slate-900">
                  Eliminar usuario
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Esta acción eliminará el usuario seleccionado.
                </p>

              </div>

              <div className="p-6">

                <div className="rounded-xl bg-red-50 p-4">

                  <p className="text-sm text-red-700">
                    ¿Está seguro de que desea eliminar este usuario?
                  </p>

                  <p className="mt-3 font-semibold text-slate-900">
                    {usuarioEliminar.nombre_usuario ||
                      'Invitación pendiente'}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {
                      usuarioEliminar.correo
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
                    disabled={
                      eliminando
                    }
                    className="rounded-lg bg-slate-200 px-5 py-2 font-semibold text-slate-700 hover:bg-slate-300"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={
                      confirmarEliminar
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
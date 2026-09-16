import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';

import { useNavigate } from 'react-router-dom';

import { api } from '../../services/api';
import Header from '../../components/Header';

interface Usuario {
  id_usuario: number;
  nombre_usuario: string | null;
  correo: string;
  estado: boolean;
}

interface CambioCorreoPendiente {
  id_usuario: number;
  correo_nuevo: string;
  nombre_usuario: string;
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
  // FILTROS
  // ============================

  const [filtroNombre, setFiltroNombre] =
    useState('');

  const [filtroCorreo, setFiltroCorreo] =
    useState('');

  const [filtroEstado, setFiltroEstado] =
    useState<'todos' | 'activo' | 'inactivo' | 'pendiente'>('todos');

  // ============================
  // PAGINACIÓN
  // ============================

  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);

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
  // VERIFICACIÓN DE CAMBIO DE CORREO
  // ============================

  const [
    modalVerificacionAbierto,
    setModalVerificacionAbierto,
  ] = useState(false);

  const [
    cambioCorreoPendiente,
    setCambioCorreoPendiente,
  ] = useState<CambioCorreoPendiente | null>(
    null,
  );

  const [
    codigoVerificacion,
    setCodigoVerificacion,
  ] = useState('');

  const [
    verificandoCorreo,
    setVerificandoCorreo,
  ] = useState(false);

  const [
    reenviandoCodigo,
    setReenviandoCodigo,
  ] = useState(false);

  const [
    errorVerificacion,
    setErrorVerificacion,
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

  useEffect(() => {
    const guardado =
      localStorage.getItem(
        'cambioCorreoPendienteUsuario',
      );

    if (!guardado) {
      return;
    }

    try {
      const pendiente =
        JSON.parse(
          guardado,
        ) as CambioCorreoPendiente;

      if (
        pendiente?.id_usuario &&
        pendiente?.correo_nuevo
      ) {
        setCambioCorreoPendiente(
          pendiente,
        );
      }
    } catch {
      localStorage.removeItem(
        'cambioCorreoPendienteUsuario',
      );
    }
  }, []);

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

      const nombreLimpio =
        nombreUsuario
          .trim()
          .slice(0, 50);

      const correoLimpio =
        correoEditar
          .trim()
          .toLowerCase();

      if (!correoLimpio) {
        setErrorEditar(
          'Debe ingresar el correo electrónico.',
        );

        return;
      }

      if (
        nombreLimpio.length > 50
      ) {
        setErrorEditar(
          'El nombre no puede superar los 50 caracteres.',
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

        const correoCambio =
          correoLimpio !==
          usuarioEditando.correo
            .trim()
            .toLowerCase();

        // ========================================
        // SI EL CORREO NO CAMBIÓ
        // ========================================
        if (!correoCambio) {
          await api.patch(
            `/usuarios/${usuarioEditando.id_usuario}`,
            {
              nombre_usuario:
                nombreLimpio,

              correo:
                correoLimpio,

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

          return;
        }

        // ========================================
        // SI CAMBIÓ EL CORREO:
        // SOLICITAR CÓDIGO AL NUEVO CORREO
        // ========================================
        await api.post(
          `/usuarios/${usuarioEditando.id_usuario}/solicitar-cambio-correo`,
          {
            nombre_usuario:
              nombreLimpio,

            correo_nuevo:
              correoLimpio,

            estado,
          },
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

        const pendiente:
          CambioCorreoPendiente = {
            id_usuario:
              usuarioEditando.id_usuario,

            correo_nuevo:
              correoLimpio,

            nombre_usuario:
              nombreLimpio,

            estado,
          };

        localStorage.setItem(
          'cambioCorreoPendienteUsuario',
          JSON.stringify(
            pendiente,
          ),
        );

        setCambioCorreoPendiente(
          pendiente,
        );

        setCodigoVerificacion('');
        setErrorVerificacion('');

        setModalEditarAbierto(
          false,
        );

        setUsuarioEditando(
          null,
        );

        setModalVerificacionAbierto(
          true,
        );
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
  // VERIFICAR CAMBIO DE CORREO
  // ============================

  const abrirModalVerificacion =
    (
      usuario?: Usuario,
    ) => {
      if (
        usuario &&
        cambioCorreoPendiente &&
        cambioCorreoPendiente.id_usuario !==
          usuario.id_usuario
      ) {
        return;
      }

      setCodigoVerificacion('');
      setErrorVerificacion('');

      setModalVerificacionAbierto(
        true,
      );
    };

  const cerrarModalVerificacion =
    () => {
      if (
        verificandoCorreo ||
        reenviandoCodigo
      ) {
        return;
      }

      setModalVerificacionAbierto(
        false,
      );

      setCodigoVerificacion('');
      setErrorVerificacion('');
    };

  const verificarCambioCorreo =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      if (!cambioCorreoPendiente) {
        setErrorVerificacion(
          'No hay un cambio de correo pendiente.',
        );
        return;
      }

      const codigo =
        codigoVerificacion
          .replace(/\D/g, '')
          .slice(0, 6);

      if (codigo.length !== 6) {
        setErrorVerificacion(
          'Ingrese el código de verificación de 6 dígitos.',
        );
        return;
      }

      try {
        setVerificandoCorreo(
          true,
        );

        setErrorVerificacion('');

        const token =
          obtenerToken();

        if (!token) {
          return;
        }

        await api.post(
          `/usuarios/${cambioCorreoPendiente.id_usuario}/verificar-cambio-correo`,
          {
            codigo,
          },
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

        localStorage.removeItem(
          'cambioCorreoPendienteUsuario',
        );

        setCambioCorreoPendiente(
          null,
        );

        setCodigoVerificacion('');

        setModalVerificacionAbierto(
          false,
        );

        await cargarUsuarios();
      } catch (error: any) {
        const message =
          error.response?.data
            ?.message;

        setErrorVerificacion(
          Array.isArray(message)
            ? message.join(', ')
            : message ||
                'El código no es válido o ya venció.',
        );
      } finally {
        setVerificandoCorreo(
          false,
        );
      }
    };

  const reenviarCodigoCambioCorreo =
    async () => {
      if (!cambioCorreoPendiente) {
        return;
      }

      try {
        setReenviandoCodigo(
          true,
        );

        setErrorVerificacion('');

        const token =
          obtenerToken();

        if (!token) {
          return;
        }

        await api.post(
          `/usuarios/${cambioCorreoPendiente.id_usuario}/reenviar-codigo-correo`,
          {},
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );
      } catch (error: any) {
        const message =
          error.response?.data
            ?.message;

        setErrorVerificacion(
          Array.isArray(message)
            ? message.join(', ')
            : message ||
                'No se pudo reenviar el código.',
        );
      } finally {
        setReenviandoCodigo(
          false,
        );
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
  // CERRAR MODALES CON ESC
  // ============================

  useEffect(() => {
    const manejarEscape = (
      event: KeyboardEvent,
    ) => {
      if (event.key !== 'Escape') {
        return;
      }

      if (modalVerificacionAbierto) {
        cerrarModalVerificacion();
        return;
      }

      if (modalEliminarAbierto) {
        cerrarModalEliminar();
        return;
      }

      if (modalEditarAbierto) {
        cerrarModalEditar();
        return;
      }

      if (modalInvitarAbierto) {
        cerrarModalInvitar();
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
    modalVerificacionAbierto,
    modalEliminarAbierto,
    modalEditarAbierto,
    modalInvitarAbierto,
    verificandoCorreo,
    reenviandoCodigo,
    eliminando,
    guardando,
    enviandoInvitacion,
  ]);

  const usuariosFiltrados = usuarios.filter((usuario) => {
    const nombre = (usuario.nombre_usuario ?? '').toLowerCase();
    const correo = usuario.correo.toLowerCase();

    const coincideNombre = nombre.includes(
      filtroNombre.trim().toLowerCase(),
    );

    const coincideCorreo = correo.includes(
      filtroCorreo.trim().toLowerCase(),
    );

    let coincideEstado = true;

    if (filtroEstado === 'activo') {
      coincideEstado = usuario.estado === true;
    } else if (filtroEstado === 'inactivo') {
      coincideEstado =
        usuario.estado === false &&
        usuario.nombre_usuario !== null;
    } else if (filtroEstado === 'pendiente') {
      coincideEstado =
        usuario.estado === false &&
        usuario.nombre_usuario === null;
    }

    return (
      coincideNombre &&
      coincideCorreo &&
      coincideEstado
    );
  });

  const limpiarFiltros = () => {
    setFiltroNombre('');
    setFiltroCorreo('');
    setFiltroEstado('todos');
  };

  const hayFiltrosActivos =
    filtroNombre.trim() !== '' ||
    filtroCorreo.trim() !== '' ||
    filtroEstado !== 'todos';

  const totalPaginas = Math.max(
    1,
    Math.ceil(usuariosFiltrados.length / registrosPorPagina),
  );

  const usuariosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * registrosPorPagina;
    return usuariosFiltrados.slice(inicio, inicio + registrosPorPagina);
  }, [usuariosFiltrados, paginaActual, registrosPorPagina]);

  useEffect(() => {
    setPaginaActual(1);
  }, [filtroNombre, filtroCorreo, filtroEstado, registrosPorPagina]);

  useEffect(() => {
    if (paginaActual > totalPaginas) {
      setPaginaActual(totalPaginas);
    }
  }, [paginaActual, totalPaginas]);

  const inicioRegistro = usuariosFiltrados.length === 0
    ? 0
    : (paginaActual - 1) * registrosPorPagina + 1;

  const finRegistro = Math.min(
    paginaActual * registrosPorPagina,
    usuariosFiltrados.length,
  );

  return (
    <div className="min-h-screen bg-[#F4F7F8]">

      <Header
        title="Gestión de Usuarios"
        description="Administración de los usuarios con acceso al sistema."
      />

      {/* CONTENIDO */}

      <main className="mx-auto max-w-7xl px-8 py-10">

        <div className="mb-6 flex items-center justify-between">

          <div>
            <h2 className="text-xl font-semibold text-[#16313E]">
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
            className="rounded-lg bg-[#315F73] px-4 py-2 text-sm font-semibold text-white hover:bg-[#244C5F]"
          >
            + Nuevo usuario
          </button>

        </div>

        {/* FILTROS */}

        <div className="mb-6 rounded-xl border border-[#D9E2E7] bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#16313E]">
                Filtros de búsqueda
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Puede combinar los filtros para encontrar usuarios específicos.
              </p>
            </div>

            {hayFiltrosActivos && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="self-start rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 sm:self-auto"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Nombre
              </label>

              <input
                type="text"
                value={filtroNombre}
                onChange={(event) =>
                  setFiltroNombre(event.target.value)
                }
                placeholder="Buscar por nombre"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[#315F73] focus:ring-2 focus:ring-[#E8F0F4]"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Correo
              </label>

              <input
                type="text"
                value={filtroCorreo}
                onChange={(event) =>
                  setFiltroCorreo(event.target.value)
                }
                placeholder="Buscar por correo"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[#315F73] focus:ring-2 focus:ring-[#E8F0F4]"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Estado
              </label>

              <select
                value={filtroEstado}
                onChange={(event) =>
                  setFiltroEstado(
                    event.target.value as
                      | 'todos'
                      | 'activo'
                      | 'inactivo'
                      | 'pendiente',
                  )
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[#315F73] focus:ring-2 focus:ring-[#E8F0F4]"
              >
                <option value="todos">Todos</option>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="pendiente">Invitación pendiente</option>
              </select>
            </div>
          </div>
        </div>

        {/* CARGANDO */}

        {cargando && (
          <div className="rounded-xl border border-[#D9E2E7] bg-white p-8 text-center text-slate-500">
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
            <div className="overflow-hidden rounded-xl border border-[#D9E2E7] bg-white shadow-sm">

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

                    {usuariosFiltrados.length ===
                    0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-12 text-center text-slate-500"
                        >
                          No se encontraron usuarios con los filtros seleccionados.
                        </td>
                      </tr>
                    ) : (
                      usuariosPaginados.map(
                        (usuario) => (
                          <tr
                            key={
                              usuario.id_usuario
                            }
                            className="border-t border-slate-100 hover:bg-slate-50"
                          >

                            <td className="px-4 py-4 font-medium text-[#16313E]">
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

                                {cambioCorreoPendiente?.id_usuario ===
                                  usuario.id_usuario && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      abrirModalVerificacion(
                                        usuario,
                                      )
                                    }
                                    className="rounded-md bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700 hover:bg-amber-200"
                                  >
                                    Verificar correo
                                  </button>
                                )}

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

              {usuariosFiltrados.length > 0 && (
                <div className="flex flex-col gap-4 border-t border-[#D9E2E7] bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                    <span>
                      Mostrando <strong>{inicioRegistro}</strong>–<strong>{finRegistro}</strong> de{' '}
                      <strong>{usuariosFiltrados.length}</strong> usuarios
                    </span>

                    <label className="flex items-center gap-2">
                      <span>Por página:</span>
                      <select
                        value={registrosPorPagina}
                        onChange={(event) =>
                          setRegistrosPorPagina(Number(event.target.value))
                        }
                        className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-[#315F73] focus:ring-2 focus:ring-[#E8F0F4]"
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
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Anterior
                    </button>

                    {Array.from({ length: totalPaginas }, (_, indice) => indice + 1).map(
                      (pagina) => (
                        <button
                          key={pagina}
                          type="button"
                          onClick={() => setPaginaActual(pagina)}
                          className={`min-w-9 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                            paginaActual === pagina
                              ? 'bg-[#315F73] text-white'
                              : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {pagina}
                        </button>
                      ),
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        setPaginaActual((pagina) => Math.min(totalPaginas, pagina + 1))
                      }
                      disabled={paginaActual === totalPaginas}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

      </main>

      {/* ============================ */}
      {/* MODAL INVITAR */}
      {/* ============================ */}

      {modalInvitarAbierto && (
        <div
          onClick={cerrarModalEditar}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >

          <div
            onClick={(event) => event.stopPropagation()}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto overflow-x-hidden rounded-2xl bg-white shadow-2xl"
          >

            <div className="border-b border-[#D9E2E7] px-6 py-5">

              <h2 className="text-xl font-bold text-[#16313E]">
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
                  className="rounded-lg bg-[#315F73] px-5 py-2 font-semibold text-white hover:bg-[#244C5F] disabled:opacity-60"
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
        <div
            onClick={cerrarModalEliminar}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          >

          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700">
              ✓
            </div>

            <h2 className="mt-4 text-center text-xl font-bold text-[#16313E]">
              Invitación enviada
            </h2>

            <p className="mt-3 text-center text-sm text-slate-600">
              Se envió correctamente la invitación a:
            </p>

            <p className="mt-2 break-all text-center font-semibold text-[#16313E]">
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
              className="mt-6 w-full rounded-lg bg-[#315F73] px-5 py-2 font-semibold text-white hover:bg-[#244C5F]"
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

              <div className="border-b border-[#D9E2E7] px-6 py-5">
                <h2 className="text-xl font-bold text-[#16313E]">
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
                          event.target.value.slice(
                            0,
                            50,
                          ),
                        )
                      }
                      maxLength={50}
                      disabled={
                        usuarioEditando.nombre_usuario ===
                        null
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-100"
                    />

                    {usuarioEditando.nombre_usuario !==
                      null && (
                      <p className="mt-1 text-xs text-slate-500">
                        Máximo 50 caracteres.
                      </p>
                    )}

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
                    className="rounded-lg bg-[#315F73] px-5 py-2 font-semibold text-white hover:bg-[#244C5F] disabled:opacity-60"
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
      {/* MODAL VERIFICACIÓN DE CORREO */}
      {/* ============================ */}

      {modalVerificacionAbierto &&
        cambioCorreoPendiente && (

        <div
          onClick={
            cerrarModalVerificacion
          }
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
        >

          <div
            onClick={(event) =>
              event.stopPropagation()
            }
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto overflow-x-hidden rounded-2xl bg-white shadow-2xl"
          >

            <div className="border-b border-[#D9E2E7] px-6 py-5">

              <h2 className="text-xl font-bold text-[#16313E]">
                Verificación del correo
              </h2>

              <p className="mt-1 max-w-full break-words text-sm text-slate-500 [overflow-wrap:anywhere]">
                Enviamos un código de 6 dígitos a:
              </p>

              <p className="mt-2 max-w-full break-words font-semibold text-[#16313E] [overflow-wrap:anywhere]">
                {
                  cambioCorreoPendiente.correo_nuevo
                }
              </p>

            </div>

            <form
              onSubmit={
                verificarCambioCorreo
              }
              className="p-6"
            >

              {errorVerificacion && (

                <div className="mb-5 min-w-0 overflow-hidden rounded-lg border border-red-200 bg-red-50 p-4">

                  <p className="max-w-full break-words text-sm text-red-700 [overflow-wrap:anywhere]">
                    {errorVerificacion}
                  </p>

                </div>

              )}

              <label className="mb-2 block text-sm font-medium text-slate-700">
                Código de verificación
              </label>

              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={
                  codigoVerificacion
                }
                onChange={(event) =>
                  setCodigoVerificacion(
                    event.target.value
                      .replace(
                        /\D/g,
                        '',
                      )
                      .slice(
                        0,
                        6,
                      ),
                  )
                }
                required
                autoFocus
                placeholder="000000"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-center text-xl font-semibold tracking-[0.35em]"
              />

              <p className="mt-2 text-xs text-slate-500">
                El cambio de correo no se aplicará hasta que el código sea verificado correctamente.
              </p>

              <div className="mt-5">

                <button
                  type="button"
                  onClick={
                    reenviarCodigoCambioCorreo
                  }
                  disabled={
                    reenviandoCodigo ||
                    verificandoCorreo
                  }
                  className="text-sm font-semibold text-[#315F73] hover:text-[#244C5F] disabled:opacity-60"
                >
                  {reenviandoCodigo
                    ? 'Reenviando...'
                    : 'Reenviar código'}
                </button>

              </div>

              <div className="mt-7 flex justify-end gap-3">

                <button
                  type="button"
                  onClick={
                    cerrarModalVerificacion
                  }
                  disabled={
                    verificandoCorreo ||
                    reenviandoCodigo
                  }
                  className="rounded-lg bg-slate-200 px-5 py-2 font-semibold text-slate-700 hover:bg-slate-300 disabled:opacity-60"
                >
                  Cerrar
                </button>

                <button
                  type="submit"
                  disabled={
                    verificandoCorreo
                  }
                  className="rounded-lg bg-[#315F73] px-5 py-2 font-semibold text-white hover:bg-[#244C5F] disabled:opacity-60"
                >
                  {verificandoCorreo
                    ? 'Verificando...'
                    : 'Verificar correo'}
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

            <div
              onClick={(event) => event.stopPropagation()}
              className="max-h-[90vh] w-full max-w-md overflow-y-auto overflow-x-hidden rounded-2xl bg-white shadow-2xl"
            >

              <div className="border-b border-[#D9E2E7] px-6 py-5">

                <h2 className="text-xl font-bold text-[#16313E]">
                  Eliminar usuario
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Esta acción eliminará el usuario seleccionado.
                </p>

              </div>

              <div className="p-6">

                <div className="min-w-0 overflow-hidden rounded-xl bg-red-50 p-4">

                  <p className="text-sm text-red-700">
                    ¿Está seguro de que desea eliminar este usuario?
                  </p>

                  <p className="mt-3 max-w-full break-words font-semibold text-[#16313E] [overflow-wrap:anywhere]">
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
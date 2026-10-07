import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Edit3,
  Mail,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { api } from '../../services/api';
import fondoGrecia from '../../assets/grecia-login.jpg';
import logoMunicipalidad from '../../assets/logo-municipalidad-grecia.webp';
import SidebarCatastro from '../../components/SidebarCatastro';
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
// Componente principal para la gestión de usuarios.
export default function Usuarios() {
  const navigate = useNavigate();
  // ============================
  // DATOS
  // ============================
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  // ============================
  // FILTROS
  // ============================
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroCorreo, setFiltroCorreo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'activo' | 'inactivo' | 'pendiente'>('todos');
  // ============================
  // PAGINACIÓN
  // ============================
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);
  // ============================
  // MODALES Y ESTADOS (ABIERTO/CERRADO)
  // ============================
  const [modalInvitarAbierto, setModalInvitarAbierto] = useState(false);
  const [correoInvitacion, setCorreoInvitacion] = useState('');
  const [enviandoInvitacion, setEnviandoInvitacion] = useState(false);
  const [errorInvitacion, setErrorInvitacion] = useState('');
  const [modalExitoAbierto, setModalExitoAbierto] = useState(false);
  const [correoInvitado, setCorreoInvitado] = useState('');
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [correoEditar, setCorreoEditar] = useState('');
  const [estado, setEstado] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorEditar, setErrorEditar] = useState('');
  const [modalVerificacionAbierto, setModalVerificacionAbierto] = useState(false);
  const [cambioCorreoPendiente, setCambioCorreoPendiente] = useState<CambioCorreoPendiente | null>(null);
  const [codigoVerificacion, setCodigoVerificacion] = useState('');
  const [verificandoCorreo, setVerificandoCorreo] = useState(false);
  const [reenviandoCodigo, setReenviandoCodigo] = useState(false);
  const [errorVerificacion, setErrorVerificacion] = useState('');
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [usuarioEliminar, setUsuarioEliminar] = useState<Usuario | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState('');
  // BLOQUEO DE SCROLL GLOBAL
  // Indica si alguno de los modales está abierto.
  const unModalEstaAbierto = Boolean(
    modalInvitarAbierto ||
    modalExitoAbierto ||
    modalEditarAbierto ||
    modalVerificacionAbierto ||
    modalEliminarAbierto
  );
  useEffect(() => {
    if (unModalEstaAbierto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [unModalEstaAbierto]);
  // ============================
  // TOKEN
  // ============================
  // Obtiene el token de sesión y redirige al login si no existe.
  const obtenerToken = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      localStorage.removeItem('usuario');
      navigate('/login');
      return null;
    }
    return token;
  }, [navigate]);
  // ============================
  // CARGAR USUARIOS
  // ============================
  // Carga los usuarios registrados desde la API.
  const cargarUsuarios = useCallback(async () => {
    try {
      setCargando(true);
      setError('');
      const token = obtenerToken();
      if (!token) {
        return;
      }
      const response = await api.get('/usuarios', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsuarios(response.data);
    } catch (error: any) {
      console.error('Error cargando usuarios:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        navigate('/login');
        return;
      }
      setError('No se pudieron cargar los usuarios.');
    } finally {
      setCargando(false);
    }
  }, [navigate, obtenerToken]);
  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);
  useEffect(() => {
    const guardado = localStorage.getItem('cambioCorreoPendienteUsuario');
    if (!guardado) {
      return;
    }
    try {
      const pendiente = JSON.parse(guardado) as CambioCorreoPendiente;
      if (pendiente?.id_usuario && pendiente?.correo_nuevo) {
        setCambioCorreoPendiente(pendiente);
      }
    } catch {
      localStorage.removeItem('cambioCorreoPendienteUsuario');
    }
  }, []);
  // ============================
  // INVITACIÓN
  // ============================
  // Abre el modal para invitar a un nuevo usuario.
  const abrirModalInvitar = () => {
    setCorreoInvitacion('');
    setErrorInvitacion('');
    setModalInvitarAbierto(true);
  };
  // Cierra el modal de invitación.
  const cerrarModalInvitar = () => {
    if (enviandoInvitacion) return;
    setModalInvitarAbierto(false);
    setCorreoInvitacion('');
    setErrorInvitacion('');
  };
  // Envía una invitación por correo para crear una nueva cuenta.
  const enviarInvitacion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorInvitacion('');
    const correo = correoInvitacion.trim().toLowerCase();
    if (!correo) {
      setErrorInvitacion('Debe ingresar un correo electrónico.');
      return;
    }
    try {
      setEnviandoInvitacion(true);
      const token = obtenerToken();
      if (!token) return;
      await api.post(
        '/usuarios/invitar',
        { correo },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setCorreoInvitado(correo);
      setModalInvitarAbierto(false);
      setCorreoInvitacion('');
      await cargarUsuarios();
      setModalExitoAbierto(true);
    } catch (error: any) {
      console.error('Error enviando invitación:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        navigate('/login');
        return;
      }
      const message = error.response?.data?.message;
      if (Array.isArray(message)) {
        setErrorInvitacion(message.join(', '));
      } else if (message) {
        setErrorInvitacion(message);
      } else {
        setErrorInvitacion('No se pudo enviar la invitación.');
      }
    } finally {
      setEnviandoInvitacion(false);
    }
  };
  // ============================
  // EDITAR
  // ============================
  // Carga los datos del usuario seleccionado para editarlo.
  const abrirModalEditar = (usuario: Usuario) => {
    setUsuarioEditando(usuario);
    setNombreUsuario(usuario.nombre_usuario ?? '');
    setCorreoEditar(usuario.correo);
    setEstado(usuario.estado);
    setErrorEditar('');
    setModalEditarAbierto(true);
  };
  // Cierra el modal de edición.
  const cerrarModalEditar = () => {
    if (guardando) return;
    setModalEditarAbierto(false);
    setUsuarioEditando(null);
    setNombreUsuario('');
    setCorreoEditar('');
    setErrorEditar('');
  };
  // Guarda los cambios realizados al usuario.
  const guardarCambios = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!usuarioEditando) return;
    setErrorEditar('');
    const nombreLimpio = nombreUsuario.trim().slice(0, 50);
    const correoLimpio = correoEditar.trim().toLowerCase();
    if (!correoLimpio) {
      setErrorEditar('Debe ingresar el correo electrónico.');
      return;
    }
    if (nombreLimpio.length > 50) {
      setErrorEditar('El nombre no puede superar los 50 caracteres.');
      return;
    }
    try {
      setGuardando(true);
      const token = obtenerToken();
      if (!token) return;
      const correoCambio = correoLimpio !== usuarioEditando.correo.trim().toLowerCase();
      // ========================================
      // SI EL CORREO NO CAMBIÓ
      // ========================================
      if (!correoCambio) {
        await api.patch(
          `/usuarios/${usuarioEditando.id_usuario}`,
          {
            nombre_usuario: nombreLimpio,
            correo: correoLimpio,
            estado,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setModalEditarAbierto(false);
        setUsuarioEditando(null);
        await cargarUsuarios();
        return;
      }
      // ========================================
      // SI CAMBIÓ EL CORREO: SOLICITAR CÓDIGO
      // ========================================
      await api.post(
        `/usuarios/${usuarioEditando.id_usuario}/solicitar-cambio-correo`,
        {
          nombre_usuario: nombreLimpio,
          correo_nuevo: correoLimpio,
          estado,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const pendiente: CambioCorreoPendiente = {
        id_usuario: usuarioEditando.id_usuario,
        correo_nuevo: correoLimpio,
        nombre_usuario: nombreLimpio,
        estado,
      };
      localStorage.setItem('cambioCorreoPendienteUsuario', JSON.stringify(pendiente));
      setCambioCorreoPendiente(pendiente);
      setCodigoVerificacion('');
      setErrorVerificacion('');
      setModalEditarAbierto(false);
      setUsuarioEditando(null);
      setModalVerificacionAbierto(true);
    } catch (error: any) {
      console.error('Error actualizando usuario:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        navigate('/login');
        return;
      }
      const message = error.response?.data?.message;
      if (Array.isArray(message)) {
        setErrorEditar(message.join(', '));
      } else if (message) {
        setErrorEditar(message);
      } else {
        setErrorEditar('No se pudo actualizar el usuario.');
      }
    } finally {
      setGuardando(false);
    }
  };
  // ============================
  // VERIFICAR CAMBIO DE CORREO
  // ============================
  // Abre el modal para verificar un cambio de correo pendiente.
  const abrirModalVerificacion = (usuario?: Usuario) => {
    if (usuario && cambioCorreoPendiente && cambioCorreoPendiente.id_usuario !== usuario.id_usuario) {
      return;
    }
    setCodigoVerificacion('');
    setErrorVerificacion('');
    setModalVerificacionAbierto(true);
  };
  // Cierra el modal de verificación de correo.
  const cerrarModalVerificacion = () => {
    if (verificandoCorreo || reenviandoCodigo) return;
    setModalVerificacionAbierto(false);
    setCodigoVerificacion('');
    setErrorVerificacion('');
  };
  // Verifica el código enviado para confirmar el cambio de correo.
  const verificarCambioCorreo = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!cambioCorreoPendiente) {
      setErrorVerificacion('No hay un cambio de correo pendiente.');
      return;
    }
    const codigo = codigoVerificacion.replace(/\D/g, '').slice(0, 6);
    if (codigo.length !== 6) {
      setErrorVerificacion('Ingrese el código de verificación de 6 dígitos.');
      return;
    }
    try {
      setVerificandoCorreo(true);
      setErrorVerificacion('');
      const token = obtenerToken();
      if (!token) return;
      await api.post(
        `/usuarios/${cambioCorreoPendiente.id_usuario}/verificar-cambio-correo`,
        { codigo },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      localStorage.removeItem('cambioCorreoPendienteUsuario');
      setCambioCorreoPendiente(null);
      setCodigoVerificacion('');
      setModalVerificacionAbierto(false);
      await cargarUsuarios();
    } catch (error: any) {
      const message = error.response?.data?.message;
      setErrorVerificacion(
        Array.isArray(message)
          ? message.join(', ')
          : message || 'El código no es válido o ya venció.',
      );
    } finally {
      setVerificandoCorreo(false);
    }
  };
  // Reenvía el código de verificación del cambio de correo.
  const reenviarCodigoCambioCorreo = async () => {
    if (!cambioCorreoPendiente) return;
    try {
      setReenviandoCodigo(true);
      setErrorVerificacion('');
      const token = obtenerToken();
      if (!token) return;
      await api.post(
        `/usuarios/${cambioCorreoPendiente.id_usuario}/reenviar-codigo-correo`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch (error: any) {
      const message = error.response?.data?.message;
      setErrorVerificacion(
        Array.isArray(message)
          ? message.join(', ')
          : message || 'No se pudo reenviar el código.',
      );
    } finally {
      setReenviandoCodigo(false);
    }
  };
  // ============================
  // ELIMINAR
  // ============================
  // Abre el modal para confirmar la eliminación del usuario.
  const abrirModalEliminar = (usuario: Usuario) => {
    setUsuarioEliminar(usuario);
    setErrorEliminar('');
    setModalEliminarAbierto(true);
  };
  // Cierra el modal de eliminación.
  const cerrarModalEliminar = () => {
    if (eliminando) return;
    setModalEliminarAbierto(false);
    setUsuarioEliminar(null);
    setErrorEliminar('');
  };
  // Elimina el usuario seleccionado.
  const confirmarEliminar = async () => {
    if (!usuarioEliminar) return;
    try {
      setEliminando(true);
      setErrorEliminar('');
      const token = obtenerToken();
      if (!token) return;
      await api.delete(`/usuarios/${usuarioEliminar.id_usuario}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setModalEliminarAbierto(false);
      setUsuarioEliminar(null);
      await cargarUsuarios();
    } catch (error: any) {
      console.error('Error eliminando usuario:', error);
      const message = error.response?.data?.message;
      setErrorEliminar(
        Array.isArray(message)
          ? message.join(', ')
          : message || 'No se pudo eliminar el usuario.',
      );
    } finally {
      setEliminando(false);
    }
  };
  // ============================
  // ESC CERRAR MODALES
  // ============================
  useEffect(() => {
    // Permite cerrar los modales con la tecla Escape.
    const manejarEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (modalVerificacionAbierto) return cerrarModalVerificacion();
      if (modalEliminarAbierto) return cerrarModalEliminar();
      if (modalEditarAbierto) return cerrarModalEditar();
      if (modalInvitarAbierto) return cerrarModalInvitar();
      if (modalExitoAbierto) setModalExitoAbierto(false);
    };
    window.addEventListener('keydown', manejarEscape);
    return () => window.removeEventListener('keydown', manejarEscape);
  }, [
    modalVerificacionAbierto,
    modalEliminarAbierto,
    modalEditarAbierto,
    modalInvitarAbierto,
    modalExitoAbierto,
    verificandoCorreo,
    reenviandoCodigo,
    eliminando,
    guardando,
    enviandoInvitacion,
  ]);
  // ============================
  // FILTRADO Y PAGINACIÓN
  // ============================
  // Filtra los usuarios según nombre, correo y estado.
  const usuariosFiltrados = usuarios.filter((usuario) => {
    const nombre = (usuario.nombre_usuario ?? '').toLowerCase();
    const correo = usuario.correo.toLowerCase();
    const coincideNombre = nombre.includes(filtroNombre.trim().toLowerCase());
    const coincideCorreo = correo.includes(filtroCorreo.trim().toLowerCase());
    let coincideEstado = true;
    if (filtroEstado === 'activo') {
      coincideEstado = usuario.estado === true;
    } else if (filtroEstado === 'inactivo') {
      coincideEstado = usuario.estado === false && usuario.nombre_usuario !== null;
    } else if (filtroEstado === 'pendiente') {
      coincideEstado = usuario.estado === false && usuario.nombre_usuario === null;
    }
    return coincideNombre && coincideCorreo && coincideEstado;
  });
  // Restablece los filtros de búsqueda.
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
  // Obtiene los usuarios correspondientes a la página actual.
  const usuariosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * registrosPorPagina;
    return usuariosFiltrados.slice(inicio, inicio + registrosPorPagina);
  }, [usuariosFiltrados, paginaActual, registrosPorPagina]);
  // Calcula las páginas visibles en la paginación.
  const paginasVisibles = (() => {
    const paginas: number[] = [];
    const inicio = Math.max(1, paginaActual - 2);
    const fin = Math.min(totalPaginas, inicio + 4);
    const inicioAjustado = Math.max(1, fin - 4);
    for (let pagina = Math.max(1, inicioAjustado); pagina <= fin; pagina += 1) {
      paginas.push(pagina);
    }
    return paginas;
  })();
  useEffect(() => {
    setPaginaActual(1);
  }, [filtroNombre, filtroCorreo, filtroEstado, registrosPorPagina]);
  useEffect(() => {
    if (paginaActual > totalPaginas) {
      setPaginaActual(totalPaginas);
    }
  }, [paginaActual, totalPaginas]);
  const inicioRegistro = usuariosFiltrados.length === 0 ? 0 : (paginaActual - 1) * registrosPorPagina + 1;
  const finRegistro = Math.min(paginaActual * registrosPorPagina, usuariosFiltrados.length);
  return (
    <div className="relative min-h-screen w-full font-sans antialiased text-white flex flex-col overflow-x-hidden lg:pl-[270px]">
      <SidebarCatastro />
      {/* 1. IMAGEN DE FONDO FIJA */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${fondoGrecia})` }}
      />
      {/* 2. OVERLAY OSCURO */}
      <div
        className="fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(circle at 12% 12%, rgba(5, 25, 36, 0.98) 0%, rgba(5, 25, 36, 0.88) 28%, transparent 58%), linear-gradient(180deg, rgba(6, 20, 28, 0.85) 0%, rgba(6, 20, 28, 0.93) 100%)',
        }}
      />
      {/* 3. FRANJA TRICOLOR INSTITUCIONAL */}
      <div className="fixed inset-x-0 top-0 z-50 grid h-1.5 grid-cols-[2.2fr_1fr_.7fr]">
        <span className="bg-[#315F73]" />
        <span className="bg-[#18843B]" />
        <span className="bg-[#D4112E]" />
      </div>
      {/* 4. CABECERA FLOTANTE OSCURA CON BOTÓN VOLVER TEXTUAL */}
      <header className="relative z-30 w-full border-b border-white/10 bg-[#0B212D]/80 backdrop-blur-xl px-6 lg:px-12 py-3.5 shadow-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src={logoMunicipalidad}
              alt="Municipalidad de Grecia"
              className="h-11 w-auto object-contain drop-shadow-md"
            />
            <div className="hidden h-9 w-[1px] bg-white/20 sm:block" />
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#86efac]">
                SISTEMA DE CATASTRO
              </span>
              <h1 className="text-base font-extrabold text-white tracking-tight leading-tight">
                Gestión de Usuarios
              </h1>
              <p className="text-[11px] text-slate-300">
                Administración de los accesos al sistema.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2.5">
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3.5 py-1.5 backdrop-blur-md">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#18843B] text-xs font-bold text-white shadow-sm">
                DR
              </div>
              <div className="text-left leading-tight">
                <p className="text-xs font-bold text-white">Derek</p>
                <p className="text-[10px] text-slate-300">rodriguezderek12@gmail.com</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="rounded-lg border border-white/10 bg-white/10 px-3.5 py-1.5 text-xs font-bold text-slate-200 transition hover:bg-white/20 hover:text-white"
              >
                Volver al panel
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('usuario');
                  navigate('/login');
                }}
                className="flex items-center gap-1.5 rounded-lg bg-[#D4112E] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#b00e26]"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      {/* ====================================== */}
      {/* CONTENIDO PRINCIPAL */}
      {/* ====================================== */}
      <main className="relative z-20 mx-auto w-full max-w-7xl px-6 lg:px-12 py-8 flex-1">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-xl font-bold text-white tracking-tight">
              <Users className="shrink-0 text-[#18843B]" size={22} />
              <span className="truncate">Usuarios registrados</span>
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Consulte y administre las credenciales del sistema.
            </p>
          </div>
          <button
            type="button"
            onClick={abrirModalInvitar}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#18843B] px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-emerald-600 transition-colors"
          >
            <UserPlus size={19} />
            Nuevo usuario
          </button>
        </div>
        {/* ====================================== */}
        {/* FILTROS DE BÚSQUEDA */}
        {/* ====================================== */}
        <section className="mb-8 rounded-2xl border border-white/10 bg-[#0c2330]/85 p-6 shadow-xl backdrop-blur-md">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="flex items-center gap-2 font-bold text-white">
                <Search size={18} />
                Filtros de búsqueda
              </h3>
              <p className="mt-1 text-xs text-slate-300">
                Puede combinar los filtros para encontrar usuarios específicos.
              </p>
            </div>
            {hayFiltrosActivos && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="text-sm font-semibold text-emerald-400 hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="min-w-0">
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Nombre</label>
              <input
                type="text"
                value={filtroNombre}
                onChange={(event) => setFiltroNombre(event.target.value)}
                placeholder="Buscar por nombre"
                className="w-full min-w-0 rounded-xl border border-white/20 bg-[#071923]/50 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="min-w-0">
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Correo</label>
              <input
                type="text"
                value={filtroCorreo}
                onChange={(event) => setFiltroCorreo(event.target.value)}
                placeholder="Buscar por correo"
                className="w-full min-w-0 rounded-xl border border-white/20 bg-[#071923]/50 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="min-w-0">
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Estado</label>
              <select
                value={filtroEstado}
                onChange={(event) => setFiltroEstado(event.target.value as any)}
                className="w-full min-w-0 rounded-xl border border-white/20 bg-[#071923]/50 px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="todos" className="bg-[#0B212D]">Todos</option>
                <option value="activo" className="bg-[#0B212D]">Activos</option>
                <option value="inactivo" className="bg-[#0B212D]">Inactivos</option>
                <option value="pendiente" className="bg-[#0B212D]">Invitaciones pendientes</option>
              </select>
            </div>
          </div>
        </section>
        {/* CARGANDO */}
        {cargando && (
          <div className="rounded-2xl border border-white/10 bg-[#0d222e]/85 p-8 text-center text-slate-300 backdrop-blur-md">
            Cargando usuarios...
          </div>
        )}
        {/* ERROR */}
        {!cargando && error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-900/40 p-6 backdrop-blur-md">
            <p className="font-semibold text-red-300">{error}</p>
            <button
              type="button"
              onClick={cargarUsuarios}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
            >
              Intentar nuevamente
            </button>
          </div>
        )}
        {/* ====================================== */}
        {/* TABLA DE USUARIOS */}
        {/* ====================================== */}
        {!cargando && !error && (
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d222e]/85 shadow-2xl backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] table-fixed">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="w-[30%] px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">
                      Nombre
                    </th>
                    <th className="w-[30%] px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">
                      Correo
                    </th>
                    <th className="w-[15%] px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">
                      Estado
                    </th>
                    <th className="w-[25%] px-6 py-4 pr-10 text-left text-xs font-bold uppercase tracking-wider text-slate-300">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {usuariosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-14 text-center text-sm text-slate-400">
                        {hayFiltrosActivos
                          ? 'No se encontraron usuarios que coincidan con los filtros seleccionados.'
                          : 'No hay usuarios registrados.'}
                      </td>
                    </tr>
                  ) : (
                    usuariosPaginados.map((usuario) => (
                      <tr
                        key={usuario.id_usuario}
                        className="transition-colors hover:bg-white/5"
                      >
                        <td className="min-w-0 px-6 py-4 align-middle">
                          <p className="truncate font-bold text-white" title={usuario.nombre_usuario || 'Pendiente de activación'}>
                            {usuario.nombre_usuario || 'Pendiente de activación'}
                          </p>
                        </td>
                        <td className="min-w-0 px-6 py-4 align-middle">
                          <p className="truncate text-sm text-slate-300" title={usuario.correo}>
                            {usuario.correo}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 align-middle">
                          {usuario.estado ? (
                            <span className="inline-flex rounded-md bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 text-xs font-bold text-emerald-400">
                              Activo
                            </span>
                          ) : usuario.nombre_usuario === null ? (
                            <span className="inline-flex rounded-md bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 text-xs font-bold text-amber-400">
                              Invitación pendiente
                            </span>
                          ) : (
                            <span className="inline-flex rounded-md bg-red-500/20 border border-red-500/30 px-2.5 py-1 text-xs font-bold text-red-400">
                              Inactivo
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 pr-10 align-middle">
                          <div className="flex flex-nowrap items-center gap-2">
                            <button
                              type="button"
                              title="Editar"
                              onClick={() => abrirModalEditar(usuario)}
                              className="inline-flex items-center gap-1.5 rounded-md bg-sky-500/20 border border-sky-500/30 px-3 py-1.5 text-xs font-bold text-sky-300 hover:bg-sky-500/30 transition-colors"
                            >
                              <Edit3 size={15} />
                              Editar
                            </button>
                            {cambioCorreoPendiente?.id_usuario === usuario.id_usuario && (
                              <button
                                type="button"
                                title="Verificar correo"
                                onClick={() => abrirModalVerificacion(usuario)}
                                className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition-colors"
                              >
                                <ShieldCheck size={15} />
                                Verificar
                              </button>
                            )}
                            <button
                              type="button"
                              title="Eliminar"
                              onClick={() => abrirModalEliminar(usuario)}
                              className="inline-flex items-center gap-1.5 rounded-md bg-red-500/20 border border-red-500/30 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/30 transition-colors"
                            >
                              <Trash2 size={15} />
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* PAGINACIÓN */}
            {usuariosFiltrados.length > 0 && (
              <div className="flex flex-col gap-4 bg-[#0B212D]/90 border-t border-white/10 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <p className="text-sm text-slate-400">
                    Mostrando <span className="font-bold text-white">{inicioRegistro}</span> a{' '}
                    <span className="font-bold text-white">{finRegistro}</span> de{' '}
                    <span className="font-bold text-white">{usuariosFiltrados.length}</span> usuarios
                  </p>
                  <div className="flex items-center gap-2">
                    <label htmlFor="registrosPorPagina" className="text-sm text-slate-400">
                      Por página:
                    </label>
                    <select
                      id="registrosPorPagina"
                      value={registrosPorPagina}
                      onChange={(event) => setRegistrosPorPagina(Number(event.target.value))}
                      className="rounded-lg border border-white/20 bg-[#071923] px-2 py-1 text-sm text-white focus:outline-none"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-end">
                  <button
                    type="button"
                    onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                    disabled={paginaActual === 1}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-semibold text-slate-300 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Anterior
                  </button>
                  {paginasVisibles.map((pagina) => (
                    <button
                      key={pagina}
                      type="button"
                      onClick={() => setPaginaActual(pagina)}
                      className={
                        paginaActual === pagina
                          ? 'min-w-9 rounded-lg bg-[#315F73] px-3 py-1.5 text-sm font-bold text-white'
                          : 'min-w-9 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-semibold text-slate-300 hover:bg-white/10 transition-colors'
                      }
                    >
                      {pagina}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                    disabled={paginaActual === totalPaginas}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-semibold text-slate-300 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </main>
      {/* =================================================
          MODAL INVITAR
      ================================================= */}
      {modalInvitarAbierto && (
        <div onClick={cerrarModalInvitar} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-xl flex flex-col rounded-2xl border border-white/10 bg-[#0B212D] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-8 py-6 flex-shrink-0">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tighter">
                  Nuevo usuario
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Se enviará un correo para que la persona active su cuenta.
                </p>
              </div>
              <button
                type="button"
                onClick={cerrarModalInvitar}
                disabled={enviandoInvitacion}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors text-lg font-bold disabled:opacity-50"
              >
                ✕
              </button>
            </div>
            <form onSubmit={enviarInvitacion} className="flex-1 overflow-y-auto p-8">
              {errorInvitacion && (
                <div className="mb-6 rounded-xl border border-red-500/30 bg-red-900/40 p-4 text-sm font-semibold text-red-300">
                  {errorInvitacion}
                </div>
              )}
              <div className="mb-8">
                <label className="mb-2 block text-sm font-bold text-slate-300">
                  Correo electrónico <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={correoInvitacion}
                    onChange={(event) => setCorreoInvitacion(event.target.value)}
                    required
                    autoFocus
                    placeholder="funcionario@correo.com"
                    className="w-full rounded-xl border border-white/20 bg-[#071923] py-3 pl-10 pr-4 text-base text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4 flex-shrink-0">
                <button
                  type="button"
                  onClick={cerrarModalInvitar}
                  disabled={enviandoInvitacion}
                  className="rounded-xl bg-white/10 px-6 py-2.5 text-sm font-bold text-white hover:bg-white/20 disabled:opacity-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviandoInvitacion}
                  className="rounded-xl bg-[#315F73] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#244C5F] disabled:opacity-50 transition-colors"
                >
                  {enviandoInvitacion ? 'Enviando...' : 'Enviar invitación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* =================================================
          MODAL ÉXITO (INVITACIÓN ENVIADA)
      ================================================= */}
      {modalExitoAbierto && (
        <div onClick={() => setModalExitoAbierto(false)} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl border border-emerald-500/30 bg-[#0B212D] p-8 shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="mt-6 text-center text-2xl font-black text-white tracking-tighter">
              Invitación enviada
            </h2>
            <p className="mt-3 text-center text-sm text-slate-300">
              Se envió correctamente la invitación a:
            </p>
            <p className="mt-2 break-all text-center text-lg font-bold text-emerald-400">
              {correoInvitado}
            </p>
            <p className="mt-4 text-center text-xs text-slate-400">
              La persona deberá abrir el enlace recibido para crear su contraseña y activar su cuenta en el sistema.
            </p>
            <button
              type="button"
              onClick={() => setModalExitoAbierto(false)}
              className="mt-8 w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition-colors"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
      {/* =================================================
          MODAL EDITAR USUARIO
      ================================================= */}
      {modalEditarAbierto && usuarioEditando && (
        <div onClick={cerrarModalEditar} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div onClick={(e) => e.stopPropagation()} className="max-h-[85vh] w-full max-w-xl flex flex-col rounded-2xl border border-white/10 bg-[#0B212D] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-8 py-6 flex-shrink-0">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tighter">
                  Editar usuario
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Modifique la información y acceso del usuario.
                </p>
              </div>
              <button
                type="button"
                onClick={cerrarModalEditar}
                disabled={guardando}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors text-lg font-bold disabled:opacity-50"
              >
                ✕
              </button>
            </div>
            <form onSubmit={guardarCambios} className="flex-1 overflow-y-auto p-8">
              {errorEditar && (
                <div className="mb-6 rounded-xl border border-red-500/30 bg-red-900/40 p-4 text-sm font-semibold text-red-300">
                  {errorEditar}
                </div>
              )}
              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-300">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nombreUsuario}
                    onChange={(event) => setNombreUsuario(event.target.value.slice(0, 50))}
                    maxLength={50}
                    disabled={usuarioEditando.nombre_usuario === null}
                    className="w-full rounded-xl border border-white/20 bg-[#071923] px-4 py-3 text-base text-white focus:border-emerald-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {usuarioEditando.nombre_usuario !== null ? (
                    <p className="mt-1 text-right text-xs text-slate-500">Máximo 50 caracteres.</p>
                  ) : (
                    <p className="mt-1 text-xs text-amber-400">El nombre será establecido por el usuario al activar su cuenta.</p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-300">
                    Correo electrónico <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={correoEditar}
                    onChange={(event) => setCorreoEditar(event.target.value)}
                    required
                    className="w-full rounded-xl border border-white/20 bg-[#071923] px-4 py-3 text-base text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-300">
                    Estado de acceso
                  </label>
                  <select
                    value={estado ? 'activo' : 'inactivo'}
                    onChange={(event) => setEstado(event.target.value === 'activo')}
                    disabled={usuarioEditando.nombre_usuario === null}
                    className="w-full rounded-xl border border-white/20 bg-[#071923] px-4 py-3 text-base text-white focus:border-emerald-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="activo" className="bg-[#0B212D]">Activo (Permitir acceso)</option>
                    <option value="inactivo" className="bg-[#0B212D]">Inactivo (Bloquear acceso)</option>
                  </select>
                </div>
              </div>
              <div className="mt-10 flex justify-end gap-4 flex-shrink-0">
                <button
                  type="button"
                  onClick={cerrarModalEditar}
                  disabled={guardando}
                  className="rounded-xl bg-white/10 px-6 py-2.5 text-sm font-bold text-white hover:bg-white/20 disabled:opacity-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="rounded-xl bg-[#315F73] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#244C5F] disabled:opacity-50 transition-colors"
                >
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* =================================================
          MODAL VERIFICACIÓN DE CORREO
      ================================================= */}
      {modalVerificacionAbierto && cambioCorreoPendiente && (
        <div onClick={cerrarModalVerificacion} className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div onClick={(event) => event.stopPropagation()} className="w-full max-w-md flex flex-col rounded-2xl border border-white/10 bg-[#0B212D] shadow-2xl overflow-hidden">
            <div className="border-b border-white/10 px-8 py-6 flex-shrink-0">
              <h2 className="text-2xl font-black text-white tracking-tighter">
                Verificación de correo
              </h2>
              <p className="mt-1 max-w-full break-words text-sm text-slate-400">
                Enviamos un código de 6 dígitos a:
              </p>
              <p className="mt-1 max-w-full break-words font-bold text-emerald-400">
                {cambioCorreoPendiente.correo_nuevo}
              </p>
            </div>
            <form onSubmit={verificarCambioCorreo} className="p-8">
              {errorVerificacion && (
                <div className="mb-6 rounded-xl border border-red-500/30 bg-red-900/40 p-4 text-sm font-semibold text-red-300">
                  <p className="max-w-full break-words">{errorVerificacion}</p>
                </div>
              )}
              <label className="mb-2 block text-sm font-bold text-slate-300 text-center">
                Código de verificación
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={codigoVerificacion}
                onChange={(event) => setCodigoVerificacion(event.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                autoFocus
                placeholder="000000"
                className="mx-auto block w-3/4 rounded-xl border border-emerald-500/50 bg-[#071923] px-4 py-3 text-center text-3xl font-black text-white tracking-[0.35em] focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <p className="mt-4 text-center text-xs text-slate-400">
                El cambio no se aplicará hasta verificar este código.
              </p>
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={reenviarCodigoCambioCorreo}
                  disabled={reenviandoCodigo || verificandoCorreo}
                  className="text-sm font-bold text-sky-400 hover:text-sky-300 hover:underline disabled:opacity-50"
                >
                  {reenviandoCodigo ? 'Reenviando código...' : 'Reenviar código de verificación'}
                </button>
              </div>
              <div className="mt-8 flex justify-end gap-4 flex-shrink-0">
                <button
                  type="button"
                  onClick={cerrarModalVerificacion}
                  disabled={verificandoCorreo || reenviandoCodigo}
                  className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/20 disabled:opacity-50 transition-colors"
                >
                  Más tarde
                </button>
                <button
                  type="submit"
                  disabled={verificandoCorreo || codigoVerificacion.length !== 6}
                  className="rounded-xl bg-[#315F73] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#244C5F] disabled:opacity-50 transition-colors"
                >
                  {verificandoCorreo ? 'Verificando...' : 'Verificar código'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* =================================================
          MODAL ELIMINAR
      ================================================= */}
      {modalEliminarAbierto && usuarioEliminar && (
        <div onClick={cerrarModalEliminar} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div onClick={(event) => event.stopPropagation()} className="w-full max-w-md flex flex-col rounded-2xl border border-white/10 bg-[#0B212D] shadow-2xl overflow-hidden">
            <div className="border-b border-white/10 px-8 py-6 flex-shrink-0">
              <h2 className="text-2xl font-black text-white tracking-tighter">Eliminar usuario</h2>
              <p className="mt-1 text-sm text-slate-400">Esta acción eliminará el acceso de esta persona permanentemente.</p>
            </div>
            <div className="p-8">
              <div className="rounded-2xl border border-red-500/30 bg-red-900/30 p-6 flex flex-col items-center justify-center text-center">
                <p className="text-sm font-semibold text-red-300">
                  ¿Está seguro de que desea eliminar este usuario?
                </p>
                <p className="mt-4 text-2xl font-black text-white tracking-tight break-all">
                  {usuarioEliminar.nombre_usuario || 'Invitación pendiente'}
                </p>
                <p className="mt-1 text-sm text-slate-400 break-all">
                  {usuarioEliminar.correo}
                </p>
              </div>
              {errorEliminar && (
                <div className="mt-6 rounded-xl border border-red-500/30 bg-red-900/50 p-4 text-sm font-semibold text-red-300">
                  {errorEliminar}
                </div>
              )}
              <div className="mt-8 flex justify-end gap-4 flex-shrink-0">
                <button
                  type="button"
                  onClick={cerrarModalEliminar}
                  disabled={eliminando}
                  className="rounded-xl bg-white/10 px-6 py-2.5 text-sm font-bold text-white hover:bg-white/20 disabled:opacity-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmarEliminar}
                  disabled={eliminando}
                  className="rounded-xl bg-red-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

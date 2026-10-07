import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Edit3,
  Eye,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { api } from '../../services/api';
import fondoGrecia from '../../assets/grecia-login.jpg';
import logoMunicipalidad from '../../assets/logo-municipalidad-grecia.webp';
import SidebarCatastro from '../../components/SidebarCatastro';
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
// ============================
// FUNCIONES PARA FECHAS
// ============================
// Obtiene la fecha en formato compatible con los campos de fecha.
const obtenerFechaInput = (fecha: string | null | undefined) => {
  if (!fecha) {
    return '';
  }
  return fecha.substring(0, 10);
};
// Formatea la fecha para mostrarla como día/mes/año.
const mostrarFecha = (fecha: string | null | undefined) => {
  if (!fecha) {
    return '-';
  }
  const limpia = fecha.substring(0, 10);
  const partes = limpia.split('-');
  if (partes.length !== 3) {
    return fecha;
  }
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
};
// Calcula automáticamente la fecha de vencimiento a cinco años.
const calcularFechaVencimiento = (fechaDeclaracion: string) => {
  if (!fechaDeclaracion) {
    return '';
  }
  const partes = fechaDeclaracion.split('-');
  if (partes.length !== 3) {
    return '';
  }
  const anio = Number(partes[0]);
  const mes = Number(partes[1]);
  const dia = Number(partes[2]);
  const nuevoAnio = anio + 5;
  const ultimoDiaMes = new Date(nuevoAnio, mes, 0).getDate();
  const diaAjustado = Math.min(dia, ultimoDiaMes);
  return `${nuevoAnio}-${String(mes).padStart(2, '0')}-${String(
    diaAjustado,
  ).padStart(2, '0')}`;
};
// ============================
// COMPONENTE
// ============================
// Componente principal para la gestión de declaraciones.
export default function Declaraciones() {
  const navigate = useNavigate();
  // ============================
  // DATOS
  // ============================
  const [declaraciones, setDeclaraciones] = useState<Declaracion[]>([]);
  const [parques, setParques] = useState<Parque[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  // ============================
  // FILTROS DE BÚSQUEDA
  // ============================
  const [filtroParque, setFiltroParque] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroFechaDeclaracion, setFiltroFechaDeclaracion] = useState('');
  const [filtroFechaVencimiento, setFiltroFechaVencimiento] = useState('');
  // Filtra las declaraciones según los criterios seleccionados.
  const declaracionesFiltradas = declaraciones.filter((declaracion) => {
    const coincideParque =
      !filtroParque ||
      String(declaracion.parque?.id_parque ?? '') === filtroParque;
    const coincideEstado =
      !filtroEstado || declaracion.estado_declaracion === filtroEstado;
    const coincideFechaDeclaracion =
      !filtroFechaDeclaracion ||
      obtenerFechaInput(declaracion.fecha_declaracion) === filtroFechaDeclaracion;
    const coincideFechaVencimiento =
      !filtroFechaVencimiento ||
      obtenerFechaInput(declaracion.fecha_vencimiento) === filtroFechaVencimiento;
    return (
      coincideParque &&
      coincideEstado &&
      coincideFechaDeclaracion &&
      coincideFechaVencimiento
    );
  });
  // ============================================
  // PAGINACIÓN
  // ============================================
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);
  const totalPaginas = Math.max(1, Math.ceil(declaracionesFiltradas.length / registrosPorPagina));
  const indiceInicial = (paginaActual - 1) * registrosPorPagina;
  const indiceFinal = indiceInicial + registrosPorPagina;
  const declaracionesPaginadas = declaracionesFiltradas.slice(indiceInicial, indiceFinal);
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
  const hayFiltrosActivos = Boolean(
    filtroParque ||
    filtroEstado ||
    filtroFechaDeclaracion ||
    filtroFechaVencimiento,
  );
  // Restablece todos los filtros de búsqueda.
  const limpiarFiltros = () => {
    setFiltroParque('');
    setFiltroEstado('');
    setFiltroFechaDeclaracion('');
    setFiltroFechaVencimiento('');
  };
  // ============================
  // MODALES (ESTADOS)
  // ============================
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idDeclaracionEditando, setIdDeclaracionEditando] = useState<number | null>(null);
  const [modalInformacionAbierto, setModalInformacionAbierto] = useState(false);
  const [declaracionVer, setDeclaracionVer] = useState<Declaracion | null>(null);
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [declaracionEliminar, setDeclaracionEliminar] = useState<Declaracion | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState('');
  // BLOQUEO DE SCROLL EN EL FONDO
  // Indica si alguno de los modales está abierto.
  const unModalEstaAbierto = Boolean(modalAbierto || modalInformacionAbierto || modalEliminarAbierto);
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
  // FORMULARIO
  // ============================
  const [idParque, setIdParque] = useState('');
  const [fechaDeclaracion, setFechaDeclaracion] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [estadoDeclaracion, setEstadoDeclaracion] = useState('Vigente');
  // ============================
  // CALCULAR VENCIMIENTO AUTOMÁTICO
  // ============================
  useEffect(() => {
    setFechaVencimiento(calcularFechaVencimiento(fechaDeclaracion));
  }, [fechaDeclaracion]);
  // ============================
  // CARGAR DATOS (API)
  // ============================
  // Carga las declaraciones registradas desde la API.
  const cargarDeclaraciones = async () => {
    try {
      setCargando(true);
      setError('');
      const response = await api.get('/declaraciones');
      setDeclaraciones(response.data);
    } catch (error) {
      console.error('Error cargando declaraciones:', error);
      setError('No se pudieron cargar las declaraciones.');
    } finally {
      setCargando(false);
    }
  };
  // Carga los parques registrados desde la API.
  const cargarParques = async () => {
    try {
      const response = await api.get('/parques');
      setParques(response.data);
    } catch (error) {
      console.error('Error cargando parques:', error);
    }
  };
  useEffect(() => {
    cargarDeclaraciones();
    cargarParques();
  }, []);
  // ============================
  // LIMPIAR
  // ============================
  // Limpia los campos y errores del formulario.
  const limpiarFormulario = () => {
    setIdParque('');
    setFechaDeclaracion('');
    setFechaVencimiento('');
    setEstadoDeclaracion('Vigente');
    setErrorFormulario('');
  };
  // ============================
  // NUEVA DECLARACIÓN
  // ============================
  // Abre el formulario para registrar una nueva declaración.
  const abrirModalCrear = () => {
    limpiarFormulario();
    setModoEdicion(false);
    setIdDeclaracionEditando(null);
    setModalAbierto(true);
  };
  // ============================
  // EDITAR
  // ============================
  // Carga la declaración seleccionada para editarla.
  const abrirModalEditar = (declaracion: Declaracion) => {
    setIdParque(
      declaracion.parque ? String(declaracion.parque.id_parque) : '',
    );
    setFechaDeclaracion(obtenerFechaInput(declaracion.fecha_declaracion));
    setFechaVencimiento(obtenerFechaInput(declaracion.fecha_vencimiento));
    setEstadoDeclaracion(declaracion.estado_declaracion || 'Vigente');
    setModoEdicion(true);
    setIdDeclaracionEditando(declaracion.id_declaracion);
    setErrorFormulario('');
    setModalAbierto(true);
  };
  // ============================
  // CERRAR MODAL
  // ============================
  // Cierra el formulario y restablece sus datos.
  const cerrarModal = () => {
    if (guardando) return;
    setModalAbierto(false);
    limpiarFormulario();
    setModoEdicion(false);
    setIdDeclaracionEditando(null);
  };
  // ============================
  // GUARDAR
  // ============================
  // Registra o actualiza una declaración.
  const guardarDeclaracion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGuardando(true);
    setErrorFormulario('');
    try {
      const token = localStorage.getItem('token');
      if (!idParque) {
        setErrorFormulario('Debe seleccionar un parque.');
        setGuardando(false);
        return;
      }
      if (!fechaDeclaracion) {
        setErrorFormulario('Debe indicar la fecha de declaración.');
        setGuardando(false);
        return;
      }
      if (!estadoDeclaracion) {
        setErrorFormulario('Debe seleccionar el estado de la declaración.');
        setGuardando(false);
        return;
      }
      const datosDeclaracion = {
        id_parque: Number(idParque),
        fecha_declaracion: fechaDeclaracion,
        estado_declaracion: estadoDeclaracion,
      };
      if (modoEdicion && idDeclaracionEditando !== null) {
        await api.patch(`/declaraciones/${idDeclaracionEditando}`, datosDeclaracion, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await api.post('/declaraciones', datosDeclaracion, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setModalAbierto(false);
      limpiarFormulario();
      setModoEdicion(false);
      setIdDeclaracionEditando(null);
      await cargarDeclaraciones();
    } catch (error: any) {
      console.error('Error guardando declaración:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        navigate('/login');
        return;
      }
      const message = error.response?.data?.message;
      if (Array.isArray(message)) {
        setErrorFormulario(message.join(', '));
      } else if (message) {
        setErrorFormulario(message);
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
  // Abre el modal con la información de la declaración.
  const abrirModalInformacion = (declaracion: Declaracion) => {
    setDeclaracionVer(declaracion);
    setModalInformacionAbierto(true);
  };
  // Cierra el modal de información.
  const cerrarModalInformacion = () => {
    setModalInformacionAbierto(false);
    setDeclaracionVer(null);
  };
  // ============================
  // ABRIR ELIMINAR
  // ============================
  // Abre el modal para confirmar la eliminación.
  const abrirModalEliminar = (declaracion: Declaracion) => {
    setDeclaracionEliminar(declaracion);
    setErrorEliminar('');
    setModalEliminarAbierto(true);
  };
  // ============================
  // CERRAR ELIMINAR
  // ============================
  // Cierra el modal de eliminación.
  const cerrarModalEliminar = () => {
    if (eliminando) return;
    setModalEliminarAbierto(false);
    setDeclaracionEliminar(null);
    setErrorEliminar('');
  };
  // ============================
  // CONFIRMAR ELIMINAR
  // ============================
  // Elimina la declaración seleccionada.
  const confirmarEliminarDeclaracion = async () => {
    if (!declaracionEliminar) return;
    try {
      setEliminando(true);
      setErrorEliminar('');
      const token = localStorage.getItem('token');
      await api.delete(`/declaraciones/${declaracionEliminar.id_declaracion}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setModalEliminarAbierto(false);
      setDeclaracionEliminar(null);
      await cargarDeclaraciones();
    } catch (error: any) {
      console.error('Error eliminando declaración:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        navigate('/login');
        return;
      }
      const message = error.response?.data?.message;
      if (Array.isArray(message)) {
        setErrorEliminar(message.join(', '));
      } else if (message) {
        setErrorEliminar(message);
      } else {
        setErrorEliminar('No se pudo eliminar la declaración.');
      }
    } finally {
      setEliminando(false);
    }
  };
  // ============================
  // CERRAR MODALES CON ESC
  // ============================
  useEffect(() => {
    // Permite cerrar los modales con la tecla Escape.
    const manejarEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (modalInformacionAbierto) return cerrarModalInformacion();
      if (modalEliminarAbierto) return cerrarModalEliminar();
      if (modalAbierto) return cerrarModal();
    };
    window.addEventListener('keydown', manejarEscape);
    return () => window.removeEventListener('keydown', manejarEscape);
  }, [modalInformacionAbierto, modalEliminarAbierto, modalAbierto, eliminando, guardando]);
  // ============================
  // COLOR ESTADO
  // ============================
  // Define el estilo visual según el estado de la declaración.
  const obtenerClaseEstado = (estado: string) => {
    switch (estado) {
      case 'Vigente':
        return 'inline-flex rounded-md bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 text-xs font-bold text-emerald-400';
      case 'Vencida':
        return 'inline-flex rounded-md bg-red-500/20 border border-red-500/30 px-2.5 py-1 text-xs font-bold text-red-400';
      case 'Finalizada':
        return 'inline-flex rounded-md bg-slate-500/20 border border-slate-500/30 px-2.5 py-1 text-xs font-bold text-slate-300';
      default:
        return 'inline-flex rounded-md bg-slate-500/20 border border-slate-500/30 px-2.5 py-1 text-xs font-bold text-slate-300';
    }
  };
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
                Gestión de Declaraciones
              </h1>
              <p className="text-[11px] text-slate-300">
                Administración de las declaraciones de los parques.
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
              <ClipboardList className="shrink-0 text-[#18843B]" size={22} />
              <span className="truncate">Declaraciones registradas</span>
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Consulte y administre las declaraciones registradas.
            </p>
          </div>
          <button
            type="button"
            onClick={abrirModalCrear}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#18843B] px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-emerald-600 transition-colors"
          >
            <Plus size={19} />
            Nueva declaración
          </button>
        </div>
        {/* ====================================== */}
        {/* FILTROS DE BÚSQUEDA */}
        {/* ====================================== */}
        <div className="mb-8 rounded-2xl border border-white/10 bg-[#0c2330]/85 p-6 shadow-xl backdrop-blur-md">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="flex items-center gap-2 font-bold text-white">
                <Search size={18} />
                Filtros de búsqueda
              </h3>
              <p className="mt-1 text-xs text-slate-300">
                Utilice uno o varios criterios para localizar declaraciones específicas.
              </p>
            </div>
            <button
              type="button"
              onClick={limpiarFiltros}
              disabled={!hayFiltrosActivos}
              className="rounded-lg bg-white/10 border border-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              Limpiar filtros
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="min-w-0">
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Parque</label>
              <select
                value={filtroParque}
                onChange={(event) => setFiltroParque(event.target.value)}
                className="w-full min-w-0 rounded-xl border border-white/20 bg-[#071923]/50 px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="" className="bg-[#0B212D]">Todos los parques</option>
                {parques.map((parque) => (
                  <option key={parque.id_parque} value={parque.id_parque} className="bg-[#0B212D]">
                    {parque.ubicacion} {parque.numero_finca ? `- Finca ${parque.numero_finca}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-0">
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Estado</label>
              <select
                value={filtroEstado}
                onChange={(event) => setFiltroEstado(event.target.value)}
                className="w-full min-w-0 rounded-xl border border-white/20 bg-[#071923]/50 px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="" className="bg-[#0B212D]">Todos los estados</option>
                <option value="Vigente" className="bg-[#0B212D]">Vigente</option>
                <option value="Vencida" className="bg-[#0B212D]">Vencida</option>
                <option value="Finalizada" className="bg-[#0B212D]">Finalizada</option>
              </select>
            </div>
            <div className="min-w-0">
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Fecha de declaración</label>
              <input
                type="date"
                value={filtroFechaDeclaracion}
                onChange={(event) => setFiltroFechaDeclaracion(event.target.value)}
                className="w-full min-w-0 rounded-xl border border-white/20 bg-[#071923]/50 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500 [color-scheme:dark]"
              />
            </div>
            <div className="min-w-0">
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Fecha de vencimiento</label>
              <input
                type="date"
                value={filtroFechaVencimiento}
                onChange={(event) => setFiltroFechaVencimiento(event.target.value)}
                className="w-full min-w-0 rounded-xl border border-white/20 bg-[#071923]/50 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500 [color-scheme:dark]"
              />
            </div>
          </div>
          <div className="mt-5 border-t border-white/10 pt-4">
            <p className="text-sm text-slate-400">
              Mostrando <span className="font-bold text-white">{declaracionesFiltradas.length}</span>
              {' '}de <span className="font-bold text-white">{declaraciones.length}</span> declaraciones.
            </p>
          </div>
        </div>
        {/* CARGANDO */}
        {cargando && (
          <div className="rounded-2xl border border-white/10 bg-[#0d222e]/85 p-8 text-center text-slate-300 backdrop-blur-md">
            Cargando declaraciones...
          </div>
        )}
        {/* ERROR */}
        {!cargando && error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-900/40 p-6 backdrop-blur-md">
            <p className="font-semibold text-red-300">{error}</p>
            <button
              type="button"
              onClick={cargarDeclaraciones}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
            >
              Intentar nuevamente
            </button>
          </div>
        )}
        {/* ====================================== */}
        {/* TABLA DE DECLARACIONES (ANCHO AMPLIADO Y ACCIONES AJUSTADAS) */}
        {/* ====================================== */}
        {!cargando && !error && (
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d222e]/85 shadow-2xl backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1250px] table-fixed">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="w-[30%] px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">
                      Parque
                    </th>
                    <th className="w-[15%] px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">
                      Fecha Declaración
                    </th>
                    <th className="w-[15%] px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">
                      Fecha Vencimiento
                    </th>
                    <th className="w-[12%] px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">
                      Estado
                    </th>
                    <th className="w-[28%] px-5 py-4 pr-10 text-left text-xs font-bold uppercase tracking-wider text-slate-300">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {declaracionesFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-14 text-center text-sm text-slate-400">
                        {hayFiltrosActivos
                          ? 'No se encontraron declaraciones que coincidan con los filtros seleccionados.'
                          : 'No hay declaraciones registradas.'}
                      </td>
                    </tr>
                  ) : (
                    declaracionesPaginadas.map((declaracion) => (
                      <tr
                        key={declaracion.id_declaracion}
                        className="transition-colors hover:bg-white/5"
                      >
                        <td className="min-w-0 px-5 py-4 align-middle">
                          <p className="truncate font-bold text-white" title={declaracion.parque?.ubicacion ?? 'Parque no disponible'}>
                            {declaracion.parque?.ubicacion ?? 'Parque no disponible'}
                          </p>
                          {declaracion.parque?.numero_finca && (
                            <p className="mt-0.5 truncate text-xs text-slate-400">
                              Finca: {declaracion.parque.numero_finca}
                            </p>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 align-middle text-sm text-slate-300">
                          {mostrarFecha(declaracion.fecha_declaracion)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 align-middle text-sm text-slate-300">
                          {mostrarFecha(declaracion.fecha_vencimiento)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 align-middle">
                          <span className={obtenerClaseEstado(declaracion.estado_declaracion)}>
                            {declaracion.estado_declaracion}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 pr-10 align-middle">
                          <div className="flex flex-nowrap items-center gap-2">
                            <button
                              type="button"
                              title="Información"
                              onClick={() => abrirModalInformacion(declaracion)}
                              className="inline-flex items-center gap-1.5 rounded-md bg-indigo-500/20 border border-indigo-500/30 px-3 py-1.5 text-xs font-bold text-indigo-300 hover:bg-indigo-500/30 transition-colors"
                            >
                              <Eye size={15} />
                              Info
                            </button>
                            <button
                              type="button"
                              title="Editar"
                              onClick={() => abrirModalEditar(declaracion)}
                              className="inline-flex items-center gap-1.5 rounded-md bg-sky-500/20 border border-sky-500/30 px-3 py-1.5 text-xs font-bold text-sky-300 hover:bg-sky-500/30 transition-colors"
                            >
                              <Edit3 size={15} />
                              Editar
                            </button>
                            <button
                              type="button"
                              title="Eliminar"
                              onClick={() => abrirModalEliminar(declaracion)}
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
            {declaracionesFiltradas.length > 0 && (
              <div className="flex flex-col gap-4 bg-[#0B212D]/90 border-t border-white/10 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <p className="text-sm text-slate-400">
                    Mostrando <span className="font-bold text-white">{indiceInicial + 1}</span> a{' '}
                    <span className="font-bold text-white">{Math.min(indiceFinal, declaracionesFiltradas.length)}</span> de{' '}
                    <span className="font-bold text-white">{declaracionesFiltradas.length}</span> declaraciones
                  </p>
                  <div className="flex items-center gap-2">
                    <label htmlFor="registrosPorPagina" className="text-sm text-slate-400">
                      Registros por página:
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
          MODAL CREAR / EDITAR - SIN DOBLE SCROLL
      ================================================= */}
      {modalAbierto && (
        <div onClick={cerrarModal} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div onClick={(e) => e.stopPropagation()} className="max-h-[85vh] w-full max-w-4xl flex flex-col rounded-2xl border border-white/10 bg-[#0B212D] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-10 py-7 flex-shrink-0">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tighter">
                  {modoEdicion ? 'Editar declaración' : 'Nueva declaración'}
                </h2>
                <p className="mt-2 text-base text-slate-400">
                  {modoEdicion ? 'Modifique la información de la declaración.' : 'Complete la información para registrar la declaración.'}
                </p>
              </div>
              <button
                type="button"
                onClick={cerrarModal}
                disabled={guardando}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors text-xl font-bold disabled:opacity-50"
              >
                ✕
              </button>
            </div>
            <form onSubmit={guardarDeclaracion} className="flex-1 overflow-y-auto p-10">
              {errorFormulario && (
                <div className="mb-10 rounded-xl border border-red-500/30 bg-red-900/40 p-6 text-base font-semibold text-red-300">
                  {errorFormulario}
                </div>
              )}
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-3 block text-base font-bold text-slate-300">Parque <span className="text-red-500">*</span></label>
                  <select
                    value={idParque}
                    onChange={(e) => setIdParque(e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/20 bg-[#071923] p-4 text-base text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="" className="text-slate-400">Seleccione un parque</option>
                    {parques.map((parque) => (
                      <option key={parque.id_parque} value={parque.id_parque} className="py-2 bg-[#0B212D]">
                        {parque.ubicacion} {parque.numero_finca ? `- Finca ${parque.numero_finca}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-3 block text-base font-bold text-slate-300">Fecha de declaración <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={fechaDeclaracion}
                    onChange={(e) => setFechaDeclaracion(e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/20 bg-[#071923] p-4 text-base text-white focus:border-emerald-500 focus:outline-none [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="mb-3 block text-base font-bold text-slate-300">Fecha de vencimiento</label>
                  <input
                    type="date"
                    value={fechaVencimiento}
                    readOnly
                    className="w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/5 p-4 text-base text-slate-400 outline-none [color-scheme:dark]"
                  />
                  <p className="mt-2 text-xs text-slate-400">Se calcula automáticamente a 5 años de la declaración.</p>
                </div>
                <div className="md:col-span-2">
                  <label className="mb-3 block text-base font-bold text-slate-300">Estado de la declaración <span className="text-red-500">*</span></label>
                  <select
                    value={estadoDeclaracion}
                    onChange={(e) => setEstadoDeclaracion(e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/20 bg-[#071923] p-4 text-base text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Vigente" className="bg-[#0B212D]">Vigente</option>
                    <option value="Vencida" className="bg-[#0B212D]">Vencida</option>
                    <option value="Finalizada" className="bg-[#0B212D]">Finalizada</option>
                  </select>
                </div>
              </div>
              <div className="mt-12 flex justify-end gap-5 border-t border-white/10 pt-10 flex-shrink-0">
                <button
                  type="button"
                  onClick={cerrarModal}
                  disabled={guardando}
                  className="rounded-xl bg-white/10 px-8 py-3 text-base font-bold text-white hover:bg-white/20 disabled:opacity-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="rounded-xl bg-[#315F73] px-8 py-3 text-base font-bold text-white hover:bg-[#244C5F] disabled:opacity-50 transition-colors"
                >
                  {guardando ? 'Guardando...' : modoEdicion ? 'Guardar cambios' : 'Guardar declaración'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* =================================================
          MODAL INFORMACIÓN - SIN DOBLE SCROLL
      ================================================= */}
      {modalInformacionAbierto && declaracionVer && (
        <div onClick={cerrarModalInformacion} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-4xl flex flex-col rounded-2xl border border-white/10 bg-[#0B212D] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-10 py-7 flex-shrink-0">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tighter">Información de la declaración</h2>
                <p className="mt-2 text-base text-slate-400">Información completa de la declaración seleccionada.</p>
              </div>
              <button
                type="button"
                onClick={cerrarModalInformacion}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors text-xl font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-10 flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:col-span-2">
                  <p className="text-sm font-bold uppercase tracking-wide text-slate-400">Parque</p>
                  <p className="mt-2 text-xl font-semibold text-white">{declaracionVer.parque?.ubicacion ?? 'Parque no disponible'}</p>
                  {declaracionVer.parque?.numero_finca && (
                    <p className="mt-1 text-sm text-slate-400">Finca: {declaracionVer.parque.numero_finca}</p>
                  )}
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <p className="text-sm font-bold uppercase tracking-wide text-slate-400">Fecha de declaración</p>
                  <p className="mt-2 text-xl font-semibold text-white">{mostrarFecha(declaracionVer.fecha_declaracion)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <p className="text-sm font-bold uppercase tracking-wide text-slate-400">Fecha de vencimiento</p>
                  <p className="mt-2 text-xl font-semibold text-white">{mostrarFecha(declaracionVer.fecha_vencimiento)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:col-span-2">
                  <p className="text-sm font-bold uppercase tracking-wide text-slate-400">Estado</p>
                  <div className="mt-3">
                    <span className={obtenerClaseEstado(declaracionVer.estado_declaracion)}>
                      {declaracionVer.estado_declaracion}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-12 flex justify-end pb-5 flex-shrink-0">
                <button
                  type="button"
                  onClick={cerrarModalInformacion}
                  className="rounded-xl bg-white/10 px-8 py-3 text-base font-bold text-white hover:bg-white/20 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* =================================================
          MODAL ELIMINAR - SIN DOBLE SCROLL
      ================================================= */}
      {modalEliminarAbierto && declaracionEliminar && (
        <div onClick={cerrarModalEliminar} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-2xl flex flex-col rounded-2xl border border-white/10 bg-[#0B212D] shadow-2xl overflow-hidden">
            <div className="border-b border-white/10 px-10 py-7 flex-shrink-0">
              <h2 className="text-3xl font-black text-white tracking-tighter">Eliminar declaración</h2>
              <p className="mt-2 text-base text-slate-400">Esta acción eliminará el registro permanentemente.</p>
            </div>
            <div className="p-10 flex-1 overflow-y-auto">
              <div className="rounded-2xl border border-red-500/30 bg-red-900/30 p-8 flex flex-col items-center justify-center text-center">
                <p className="text-base text-red-300">¿Está seguro de que desea eliminar esta declaración?</p>
                <p className="mt-6 text-3xl font-black text-white tracking-tight break-all">
                  Parque: {declaracionEliminar.parque?.ubicacion ?? 'Desconocido'}
                </p>
                <p className="mt-3 text-lg text-slate-400">Fecha de declaración: {mostrarFecha(declaracionEliminar.fecha_declaracion)}</p>
              </div>
              {errorEliminar && (
                <div className="mt-8 rounded-xl border border-red-500/30 bg-red-900/50 p-6 text-base font-semibold text-red-300">
                  <p className="font-black text-lg text-red-300">No se puede eliminar la declaración</p>
                  <p className="mt-2 text-base text-red-400">{errorEliminar}</p>
                </div>
              )}
              <div className="mt-12 flex justify-end gap-5 flex-shrink-0 pb-5">
                <button
                  type="button"
                  onClick={cerrarModalEliminar}
                  disabled={eliminando}
                  className="rounded-xl bg-white/10 px-8 py-3 text-base font-bold text-white hover:bg-white/20 disabled:opacity-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmarEliminarDeclaracion}
                  disabled={eliminando}
                  className="rounded-xl bg-red-600 px-8 py-3 text-base font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {eliminando ? 'Eliminando...' : 'Sí, eliminar permanentemente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

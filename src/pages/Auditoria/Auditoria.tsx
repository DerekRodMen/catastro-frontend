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

  FilterX,

} from 'lucide-react';

import {

  useNavigate,

} from 'react-router-dom';

import {

  api,

} from '../../services/api';

import fondoGrecia from '../../assets/grecia-login.jpg';

import logoMunicipalidad from '../../assets/logo-municipalidad-grecia.webp';

import SidebarCatastro from '../../components/SidebarCatastro';

interface Auditoria {

  id_auditoria: number;

  id_usuario: number | null;

  nombre_usuario: string | null;

  correo_usuario: string | null;

  modulo: string;

  accion: string;

  id_registro: number | null;

  descripcion: string;

  datos_anteriores: string | null;

  datos_nuevos: string | null;

  fecha_hora: string;

}

interface DatosAuditoria {

  [key: string]: unknown;

}

const MODULOS_SISTEMA: string[] = [

  'PARQUES',

  'DISTRITOS',

  'ENCARGADOS',

  'CONVENIOS',

  'DECLARACIONES',

  'MANTENIMIENTOS',

  'USUARIOS',

];

export default function Auditoria() {

  const navigate = useNavigate();

  // ============================================

  // DATOS

  // ============================================

  const [registros, setRegistros] = useState<Auditoria[]>([]);

  const [cargando, setCargando] = useState(true);

  const [error, setError] = useState('');

  // ============================================

  // FILTROS

  // ============================================

  const [filtroUsuario, setFiltroUsuario] = useState('');

  const [filtroModulo, setFiltroModulo] = useState('');

  const [filtroAccion, setFiltroAccion] = useState('');

  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');

  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');

  // ============================================

  // PAGINACIÓN

  // ============================================

  const [paginaActual, setPaginaActual] = useState(1);

  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);

  // ============================================

  // MODAL INFORMACIÓN

  // ============================================

  const [modalInformacionAbierto, setModalInformacionAbierto] = useState(false);

  const [registroSeleccionado, setRegistroSeleccionado] = useState<Auditoria | null>(null);

  // Bloqueo de scroll

  useEffect(() => {

    if (modalInformacionAbierto) {

      document.body.style.overflow = 'hidden';

    } else {

      document.body.style.overflow = '';

    }

    return () => {

      document.body.style.overflow = '';

    };

  }, [modalInformacionAbierto]);

  // ============================================

  // TOKEN

  // ============================================

  // Obtiene el token de sesión y redirige al login si no existe.

  const obtenerToken = useCallback(() => {

    const token = localStorage.getItem('token');

    if (!token) {

      localStorage.removeItem('usuario');

      navigate('/login', { replace: true });

      return null;

    }

    return token;

  }, [navigate]);

  // ============================================

  // CARGAR AUDITORÍA

  // ============================================

  // Carga el historial de auditoría desde el backend.

  const cargarAuditoria = useCallback(async () => {

    try {

      setCargando(true);

      setError('');

      const token = obtenerToken();

      if (!token) {

        return;

      }

      const response = await api.get('/auditoria', {

        headers: {

          Authorization: `Bearer ${token}`,

        },

      });

      const datos = Array.isArray(response.data) ? response.data : [];

      setRegistros(datos);

    } catch (error: any) {

      console.error('Error cargando auditoría:', error);

      if (error.response?.status === 401) {

        localStorage.removeItem('token');

        localStorage.removeItem('usuario');

        navigate('/login', { replace: true });

        return;

      }

      setError(

        error.response?.data?.message ||

          'No se pudo cargar el historial de auditoría.',

      );

    } finally {

      setCargando(false);

    }

  }, [navigate, obtenerToken]);

  useEffect(() => {

    cargarAuditoria();

  }, [cargarAuditoria]);

  // ============================================

  // FILTROS

  // ============================================

  // Aplica los filtros seleccionados al historial.

  const registrosFiltrados = useMemo(() => {

    return registros.filter((registro) => {

      const usuario = `${registro.nombre_usuario ?? ''} ${registro.correo_usuario ?? ''}`.toLowerCase();

      const coincideUsuario =

        !filtroUsuario.trim() ||

        usuario.includes(filtroUsuario.trim().toLowerCase());

      const coincideModulo =

        !filtroModulo ||

        registro.modulo?.trim().toUpperCase() === filtroModulo.trim().toUpperCase();

      const coincideAccion =

        !filtroAccion ||

        registro.accion.toUpperCase() === filtroAccion.toUpperCase();

      let coincideFechaDesde = true;

      let coincideFechaHasta = true;

      if (filtroFechaDesde) {

        const fechaRegistro = new Date(registro.fecha_hora);

        const fechaDesde = new Date(`${filtroFechaDesde}T00:00:00`);

        coincideFechaDesde = fechaRegistro >= fechaDesde;

      }

      if (filtroFechaHasta) {

        const fechaRegistro = new Date(registro.fecha_hora);

        const fechaHasta = new Date(`${filtroFechaHasta}T23:59:59.999`);

        coincideFechaHasta = fechaRegistro <= fechaHasta;

      }

      return (

        coincideUsuario &&

        coincideModulo &&

        coincideAccion &&

        coincideFechaDesde &&

        coincideFechaHasta

      );

    });

  }, [

    registros,

    filtroUsuario,

    filtroModulo,

    filtroAccion,

    filtroFechaDesde,

    filtroFechaHasta,

  ]);

  const hayFiltrosActivos = Boolean(

    filtroUsuario || filtroModulo || filtroAccion || filtroFechaDesde || filtroFechaHasta

  );

  // ============================================

  // OPCIONES DE FILTROS

  // ============================================

  // Genera las opciones disponibles para el filtro de módulos.

  const modulos = useMemo(() => {

    const modulosRegistrados = registros

      .map((registro) => registro.modulo?.trim().toUpperCase())

      .filter((modulo): modulo is string => Boolean(modulo));

    const modulosAdicionales = Array.from(

      new Set(

        modulosRegistrados.filter(

          (modulo) => !MODULOS_SISTEMA.includes(modulo),

        ),

      ),

    ).sort();

    return [

      ...MODULOS_SISTEMA,

      ...modulosAdicionales,

    ];

  }, [registros]);

  // Genera las opciones disponibles para el filtro de acciones.

  const acciones = useMemo(() => {

    return Array.from(

      new Set(registros.map((registro) => registro.accion).filter(Boolean)),

    ).sort();

  }, [registros]);

  // ============================================

  // PAGINACIÓN

  // ============================================

  const totalRegistros = registrosFiltrados.length;

  const totalPaginas = Math.max(

    1,

    Math.ceil(totalRegistros / registrosPorPagina),

  );

  const indiceInicial = (paginaActual - 1) * registrosPorPagina;

  const indiceFinal = Math.min(

    indiceInicial + registrosPorPagina,

    totalRegistros,

  );

  const registrosPaginados = registrosFiltrados.slice(

    indiceInicial,

    indiceFinal,

  );

  useEffect(() => {

    setPaginaActual(1);

  }, [

    filtroUsuario,

    filtroModulo,

    filtroAccion,

    filtroFechaDesde,

    filtroFechaHasta,

    registrosPorPagina,

  ]);

  useEffect(() => {

    if (paginaActual > totalPaginas) {

      setPaginaActual(totalPaginas);

    }

  }, [paginaActual, totalPaginas]);

  const paginasVisibles = useMemo(() => {

    const maximoVisible = 5;

    let inicio = Math.max(1, paginaActual - 2);

    let fin = Math.min(totalPaginas, inicio + maximoVisible - 1);

    if (fin - inicio + 1 < maximoVisible) {

      inicio = Math.max(1, fin - maximoVisible + 1);

    }

    return Array.from({ length: fin - inicio + 1 }, (_, index) => inicio + index);

  }, [paginaActual, totalPaginas]);

  // ============================================

  // LIMPIAR FILTROS

  // ============================================

  // Restablece todos los filtros.

  const limpiarFiltros = () => {

    setFiltroUsuario('');

    setFiltroModulo('');

    setFiltroAccion('');

    setFiltroFechaDesde('');

    setFiltroFechaHasta('');

    setPaginaActual(1);

  };

  // ============================================

  // MODAL

  // ============================================

  // Abre el modal con el detalle del registro seleccionado.

  const abrirInformacion = (registro: Auditoria) => {

    setRegistroSeleccionado(registro);

    setModalInformacionAbierto(true);

  };

  // Cierra el modal y limpia el registro seleccionado.

  const cerrarInformacion = () => {

    setModalInformacionAbierto(false);

    setRegistroSeleccionado(null);

  };

  // ============================================

  // ESC

  // ============================================

  useEffect(() => {

    const manejarEscape = (event: KeyboardEvent) => {

      if (event.key === 'Escape' && modalInformacionAbierto) {

        cerrarInformacion();

      }

    };

    document.addEventListener('keydown', manejarEscape);

    return () => {

      document.removeEventListener('keydown', manejarEscape);

    };

  }, [modalInformacionAbierto]);

  // ============================================

  // FORMATEAR FECHA

  // ============================================

  // Formatea la fecha y hora para mostrarla en formato local.

  const formatearFechaHora = (fecha: string) => {

    if (!fecha) {

      return '—';

    }

    const valor = new Date(fecha);

    if (Number.isNaN(valor.getTime())) {

      return fecha;

    }

    return new Intl.DateTimeFormat('es-CR', {

      day: '2-digit',

      month: '2-digit',

      year: 'numeric',

      hour: '2-digit',

      minute: '2-digit',

      second: '2-digit',

    }).format(valor);

  };

  // ============================================

  // PARSEAR JSON

  // ============================================

  // Convierte los datos JSON guardados en auditoría a un objeto.

  const obtenerDatos = (datos: string | null): DatosAuditoria | null => {

    if (!datos) {

      return null;

    }

    try {

      return JSON.parse(datos) as DatosAuditoria;

    } catch {

      return { informacion: datos };

    }

  };

  // ============================================

  // ETIQUETAS

  // ============================================

  // Convierte nombres técnicos de campos en etiquetas legibles.

  const formatearCampo = (campo: string) => {

    const etiquetas: Record<string, string> = {

      id_parque: 'Parque',

      ubicacion: 'Ubicación',

      numero_finca: 'Número de finca',

      area: 'Área',

      numero_plano: 'Número de plano',

      visado: 'Visado',

      estado: 'Estado',

      id_distrito: 'Distrito',

      distrito: 'Nombre del distrito',

      id_encargado: 'Encargado',

      encargado: 'Entidad encargada',

      nombre_mantenimiento: 'Mantenimiento',

      descripcion: 'Descripción',

      inversion: 'Inversión',

      numero_convenio: 'Número de convenio',

      plazo: 'Plazo',

    };

    if (etiquetas[campo]) {

      return etiquetas[campo];

    }

    return campo

      .replace(/_/g, ' ')

      .replace(/\b\w/g, (letra) => letra.toUpperCase());

  };

  // Convierte valores de auditoría a texto legible.

  const formatearValor = (valor: unknown) => {

    if (valor === null || valor === undefined || valor === '') {

      return '—';

    }

    if (typeof valor === 'boolean') {

      return valor ? 'Sí' : 'No';

    }

    if (typeof valor === 'object') {

      return JSON.stringify(valor);

    }

    return String(valor);

  };

  // ============================================

  // COLOR ACCIÓN

  // ============================================

  // Define el estilo visual según el tipo de acción.

  const claseAccion = (accion: string) => {

    switch (accion.toUpperCase()) {

      case 'CREAR':

        return 'inline-flex rounded-md bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 text-xs font-bold text-emerald-400';

      case 'EDITAR':

        return 'inline-flex rounded-md bg-sky-500/20 border border-sky-500/30 px-2.5 py-1 text-xs font-bold text-sky-400';

      case 'ELIMINAR':

        return 'inline-flex rounded-md bg-red-500/20 border border-red-500/30 px-2.5 py-1 text-xs font-bold text-red-400';

      default:

        return 'inline-flex rounded-md bg-slate-500/20 border border-slate-500/30 px-2.5 py-1 text-xs font-bold text-slate-300';

    }

  };

  // ============================================

  // COMPARAR CAMBIOS DEL MODAL

  // ============================================

  type EstadoCampo =

    | 'sin-cambio'

    | 'modificado'

    | 'nuevo'

    | 'eliminado';

  const valoresIguales = (valorA: unknown, valorB: unknown) => {

    try {

      return JSON.stringify(valorA) === JSON.stringify(valorB);

    } catch {

      return String(valorA) === String(valorB);

    }

  };

  const obtenerEstadoCampo = (

    campo: string,

    contenidoActual: DatosAuditoria,

    contenidoComparacion: DatosAuditoria | null,

    tipo: 'anterior' | 'nuevo',

  ): EstadoCampo => {

    if (!contenidoComparacion) {

      return tipo === 'anterior' ? 'eliminado' : 'nuevo';

    }

    if (!Object.prototype.hasOwnProperty.call(contenidoComparacion, campo)) {

      return tipo === 'anterior' ? 'eliminado' : 'nuevo';

    }

    if (

      !valoresIguales(

        contenidoActual[campo],

        contenidoComparacion[campo],

      )

    ) {

      return 'modificado';

    }

    return 'sin-cambio';

  };

  // Detecta qué campos cambiaron entre el estado anterior y el nuevo.

  const obtenerCamposCambiados = (

    datosAnteriores: string | null,

    datosNuevos: string | null,

  ) => {

    const anteriores = obtenerDatos(datosAnteriores);

    const nuevos = obtenerDatos(datosNuevos);

    const campos = Array.from(

      new Set([

        ...Object.keys(anteriores ?? {}),

        ...Object.keys(nuevos ?? {}),

      ]),

    );

    return campos.filter((campo) => {

      const existeAntes = Boolean(

        anteriores && Object.prototype.hasOwnProperty.call(anteriores, campo),

      );

      const existeDespues = Boolean(

        nuevos && Object.prototype.hasOwnProperty.call(nuevos, campo),

      );

      if (existeAntes !== existeDespues) {

        return true;

      }

      if (!existeAntes && !existeDespues) {

        return false;

      }

      return !valoresIguales(

        anteriores?.[campo],

        nuevos?.[campo],

      );

    });

  };

  // Muestra un resumen de los campos afectados por la acción.

  const renderResumenCambios = (

    datosAnteriores: string | null,

    datosNuevos: string | null,

    accion: string,

  ) => {

    const camposCambiados = obtenerCamposCambiados(

      datosAnteriores,

      datosNuevos,

    );

    const accionNormalizada = accion.toUpperCase();

    const titulo =

      accionNormalizada === 'CREAR'

        ? 'Datos registrados al crear'

        : accionNormalizada === 'ELIMINAR'

          ? 'Datos eliminados'

          : 'Campos modificados';

    const detalle =

      camposCambiados.length === 0

        ? 'No se detectaron diferencias entre el antes y el después.'

        : `${camposCambiados.length} ${

            camposCambiados.length === 1 ? 'campo afectado' : 'campos afectados'

          }`;

    return (

      <div className="mb-6 rounded-2xl border border-sky-400/20 bg-sky-500/10 px-6 py-5">

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <p className="text-xs font-bold uppercase tracking-widest text-sky-300">

              {titulo}

            </p>

            <p className="mt-1 text-sm text-slate-300">

              {detalle}

            </p>

          </div>

          {camposCambiados.length > 0 && (

            <span className="inline-flex w-fit rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs font-black text-sky-200">

              {camposCambiados.length}

              {camposCambiados.length === 1 ? ' cambio' : ' cambios'}

            </span>

          )}

        </div>

        {camposCambiados.length > 0 && (

          <div className="mt-4 flex flex-wrap gap-2">

            {camposCambiados.map((campo) => (

              <span

                key={campo}

                className="rounded-lg border border-white/10 bg-[#071923]/70 px-2.5 py-1 text-xs font-bold text-slate-200"

              >

                {formatearCampo(campo)}

              </span>

            ))}

          </div>

        )}

      </div>

    );

  };

  // ============================================

  // RENDER DATOS JSON (MODAL)

  // ============================================

  // Renderiza los datos anteriores o nuevos dentro del modal.

  const renderDatos = (

    titulo: string,

    datos: string | null,

    datosComparacion: string | null,

    tipo: 'anterior' | 'nuevo',

  ) => {

    const contenido = obtenerDatos(datos);

    const contenidoComparacion = obtenerDatos(datosComparacion);

    return (

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#071923] shadow-lg">

        <div

          className={`border-b border-white/10 px-6 py-4 ${

            tipo === 'anterior' ? 'bg-rose-500/10' : 'bg-emerald-500/10'

          }`}

        >

          <div className="flex items-center justify-between gap-3">

            <h4

              className={`font-bold uppercase tracking-wide text-sm ${

                tipo === 'anterior' ? 'text-rose-300' : 'text-emerald-300'

              }`}

            >

              {titulo}

            </h4>

            <span

              className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${

                tipo === 'anterior'

                  ? 'border-rose-400/30 bg-rose-500/10 text-rose-200'

                  : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'

              }`}

            >

              {tipo === 'anterior' ? 'Antes' : 'Después'}

            </span>

          </div>

        </div>

        {!contenido ? (

          <div className="px-6 py-6 text-sm text-slate-400">

            No aplica para esta acción.

          </div>

        ) : (

          <div className="divide-y divide-white/5">

            {Object.entries(contenido).map(([campo, valor]) => {

              const estado = obtenerEstadoCampo(

                campo,

                contenido,

                contenidoComparacion,

                tipo,

              );

              const resaltado = estado !== 'sin-cambio';

              const etiquetaEstado =

                estado === 'nuevo'

                  ? 'NUEVO'

                  : estado === 'eliminado'

                    ? 'ELIMINADO'

                    : estado === 'modificado'

                      ? 'CAMBIÓ'

                      : '';

              const claseFila =

                estado === 'sin-cambio'

                  ? 'bg-transparent'

                  : tipo === 'anterior'

                    ? 'border-l-4 border-rose-500/80 bg-rose-500/10'

                    : 'border-l-4 border-emerald-500/80 bg-emerald-500/10';

              const claseEtiqueta =

                resaltado

                  ? tipo === 'anterior'

                    ? 'text-rose-200'

                    : 'text-emerald-200'

                  : 'text-slate-400';

              const claseValor =

                resaltado

                  ? tipo === 'anterior'

                    ? 'text-rose-100 line-through decoration-rose-400/60 decoration-2'

                    : 'text-emerald-100 font-semibold'

                  : 'text-slate-400';

              return (

                <div

                  key={campo}

                  className={`grid gap-2 px-6 py-4 transition-colors sm:grid-cols-[190px_1fr] ${claseFila}`}

                >

                  <div className="flex flex-wrap items-center gap-2">

                    <span className={`text-sm font-bold ${claseEtiqueta}`}>

                      {formatearCampo(campo)}

                    </span>

                    {resaltado && (

                      <span

                        className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${

                          tipo === 'anterior'

                            ? 'border-rose-400/30 bg-rose-500/15 text-rose-200'

                            : 'border-emerald-400/30 bg-emerald-500/15 text-emerald-200'

                        }`}

                      >

                        {etiquetaEstado}

                      </span>

                    )}

                  </div>

                  <span className={`break-words text-sm ${claseValor}`}>

                    {formatearValor(valor)}

                  </span>

                </div>

              );

            })}

          </div>

        )}

      </div>

    );

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

                Auditoría

              </h1>

              <p className="text-[11px] text-slate-300">

                Historial de acciones del sistema.

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

        {/* TÍTULO Y MÉTRICAS */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="min-w-0">

            <h2 className="flex items-center gap-2 text-xl font-bold text-white tracking-tight">

              <History className="shrink-0 text-[#18843B]" size={22} />

              <span className="truncate">Historial de auditoría</span>

            </h2>

            <p className="mt-1 text-sm text-slate-300">

              Consulte las acciones registradas dentro del Sistema de Catastro.

            </p>

          </div>

          <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 py-3 shadow-sm backdrop-blur-md">

            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">

              Registros totales

            </p>

            <p className="mt-1 text-2xl font-black text-white">

              {registros.length}

            </p>

          </div>

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

                Utilice uno o varios criterios para localizar acciones específicas.

              </p>

            </div>

            <button

              type="button"

              onClick={limpiarFiltros}

              disabled={!hayFiltrosActivos}

              className="inline-flex items-center gap-2 rounded-lg bg-white/10 border border-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 transition-colors disabled:cursor-not-allowed disabled:opacity-40"

            >

              <FilterX size={16} />

              Limpiar filtros

            </button>

          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">

            {/* USUARIO */}

            <div className="min-w-0">

              <label className="mb-1.5 block text-sm font-medium text-slate-300">Usuario</label>

              <input

                type="text"

                value={filtroUsuario}

                onChange={(event) => setFiltroUsuario(event.target.value)}

                placeholder="Nombre o correo"

                className="w-full min-w-0 rounded-xl border border-white/20 bg-[#071923]/50 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"

              />

            </div>

            {/* MÓDULO */}

            <div className="min-w-0">

              <label className="mb-1.5 block text-sm font-medium text-slate-300">Módulo</label>

              <select

                value={filtroModulo}

                onChange={(event) => setFiltroModulo(event.target.value)}

                className="w-full min-w-0 rounded-xl border border-white/20 bg-[#071923]/50 px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"

              >

                <option value="" className="bg-[#0B212D]">Todos</option>

                {modulos.map((modulo) => (

                  <option key={modulo} value={modulo} className="bg-[#0B212D]">

                    {modulo}

                  </option>

                ))}

              </select>

            </div>

            {/* ACCIÓN */}

            <div className="min-w-0">

              <label className="mb-1.5 block text-sm font-medium text-slate-300">Acción</label>

              <select

                value={filtroAccion}

                onChange={(event) => setFiltroAccion(event.target.value)}

                className="w-full min-w-0 rounded-xl border border-white/20 bg-[#071923]/50 px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"

              >

                <option value="" className="bg-[#0B212D]">Todas</option>

                {acciones.map((accion) => (

                  <option key={accion} value={accion} className="bg-[#0B212D]">

                    {accion}

                  </option>

                ))}

              </select>

            </div>

            {/* FECHA DESDE */}

            <div className="min-w-0">

              <label className="mb-1.5 block text-sm font-medium text-slate-300">Fecha desde</label>

              <input

                type="date"

                value={filtroFechaDesde}

                onChange={(event) => setFiltroFechaDesde(event.target.value)}

                className="w-full min-w-0 rounded-xl border border-white/20 bg-[#071923]/50 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500 [color-scheme:dark]"

              />

            </div>

            {/* FECHA HASTA */}

            <div className="min-w-0">

              <label className="mb-1.5 block text-sm font-medium text-slate-300">Fecha hasta</label>

              <input

                type="date"

                value={filtroFechaHasta}

                min={filtroFechaDesde || undefined}

                onChange={(event) => setFiltroFechaHasta(event.target.value)}

                className="w-full min-w-0 rounded-xl border border-white/20 bg-[#071923]/50 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500 [color-scheme:dark]"

              />

            </div>

          </div>

        </section>

        {/* ====================================== */}

        {/* ERROR */}

        {/* ====================================== */}

        {error && (

          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-900/40 p-6 backdrop-blur-md">

            <p className="font-semibold text-red-300">{error}</p>

          </div>

        )}

        {/* ====================================== */}

        {/* TABLA DE AUDITORÍA (ANCHO MÍNIMO AMPLIADO Y PR-10 EN ACCIONES) */}

        {/* ====================================== */}

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d222e]/85 shadow-2xl backdrop-blur-md">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1300px] table-fixed">

              <thead className="bg-white/5 border-b border-white/10">

                <tr>

                  <th className="w-[15%] px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">Fecha y hora</th>

                  <th className="w-[25%] px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">Usuario</th>

                  <th className="w-[15%] px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">Módulo</th>

                  <th className="w-[12%] px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">Acción</th>

                  <th className="w-[22%] px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">Descripción</th>

                  <th className="w-[11%] px-5 py-4 pr-10 text-left text-xs font-bold uppercase tracking-wider text-slate-300">Acciones</th>

                </tr>

              </thead>

              <tbody className="divide-y divide-white/5">

                {cargando ? (

                  <tr>

                    <td colSpan={6} className="px-6 py-14 text-center text-sm text-slate-400">

                      Cargando historial de auditoría...

                    </td>

                  </tr>

                ) : registrosPaginados.length === 0 ? (

                  <tr>

                    <td colSpan={6} className="px-6 py-14 text-center">

                      <History size={34} className="mx-auto mb-3 text-slate-500" />

                      <p className="font-bold text-white">No se encontraron registros</p>

                      <p className="mt-1 text-sm text-slate-400">No existen acciones que coincidan con los filtros seleccionados.</p>

                    </td>

                  </tr>

                ) : (

                  registrosPaginados.map((registro) => (

                    <tr key={registro.id_auditoria} className="transition-colors hover:bg-white/5">

                      <td className="whitespace-nowrap px-5 py-4 align-middle text-sm font-semibold text-white">

                        {formatearFechaHora(registro.fecha_hora)}

                      </td>

                      <td className="min-w-0 px-5 py-4 align-middle">

                        <p className="truncate font-bold text-white" title={registro.nombre_usuario || 'Usuario'}>

                          {registro.nombre_usuario || 'Usuario'}

                        </p>

                        <p className="mt-0.5 truncate text-xs text-slate-400" title={registro.correo_usuario || ''}>

                          {registro.correo_usuario || '—'}

                        </p>

                      </td>

                      <td className="px-5 py-4 align-middle">

                        <span className="inline-flex rounded-md bg-white/10 border border-white/20 px-2.5 py-1 text-xs font-bold text-slate-200">

                          {registro.modulo}

                        </span>

                      </td>

                      <td className="px-5 py-4 align-middle">

                        <span className={claseAccion(registro.accion)}>

                          {registro.accion}

                        </span>

                      </td>

                      <td className="min-w-0 px-5 py-4 align-middle text-sm text-slate-300">

                        <p className="truncate" title={registro.descripcion}>

                          {registro.descripcion}

                        </p>

                      </td>

                      <td className="whitespace-nowrap px-5 py-4 pr-10 align-middle">

                        <button

                          type="button"

                          onClick={() => abrirInformacion(registro)}

                          className="inline-flex items-center gap-1.5 rounded-md bg-sky-500/20 border border-sky-500/30 px-3 py-1.5 text-xs font-bold text-sky-300 hover:bg-sky-500/30 transition-colors"

                        >

                          <Eye size={15} />

                          Detalle

                        </button>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

          {/* PAGINACIÓN */}

          {registrosFiltrados.length > 0 && (

            <div className="flex flex-col gap-4 bg-[#0B212D]/90 border-t border-white/10 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

                <p className="text-sm text-slate-400">

                  Mostrando <span className="font-bold text-white">{indiceInicial + 1}</span> a{' '}

                  <span className="font-bold text-white">{indiceFinal}</span> de{' '}

                  <span className="font-bold text-white">{totalRegistros}</span> registros

                </p>

                <div className="flex items-center gap-2">

                  <label className="text-sm text-slate-400">Mostrar:</label>

                  <select

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

                  disabled={paginaActual === totalPaginas || totalRegistros === 0}

                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-semibold text-slate-300 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"

                >

                  Siguiente →

                </button>

              </div>

            </div>

          )}

        </section>

      </main>

      {/* ====================================== */}

      {/* MODAL INFORMACIÓN - SIN DOBLE SCROLL */}

      {/* ====================================== */}

      {modalInformacionAbierto && registroSeleccionado && (

        <div

          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"

          onMouseDown={(event) => {

            if (event.target === event.currentTarget) {

              cerrarInformacion();

            }

          }}

        >

          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0B212D] shadow-2xl">

            <div className="flex items-center justify-between border-b border-white/10 px-10 py-7 flex-shrink-0">

              <div>

                <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">

                  Registro de auditoría

                </p>

                <h3 className="mt-1 text-3xl font-black text-white tracking-tighter">

                  Información de la acción

                </h3>

                <p className="mt-1 text-base text-slate-400">

                  Consulte la información registrada para esta operación.

                </p>

              </div>

              <button

                type="button"

                onClick={cerrarInformacion}

                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors text-xl font-bold"

              >

                ✕

              </button>

            </div>

            <div className="overflow-y-auto p-10 flex-1">

              <div className="mb-6 grid gap-6 md:grid-cols-2">

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">

                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Usuario</p>

                  <p className="mt-1 text-lg font-bold text-white">

                    {registroSeleccionado.nombre_usuario || 'Usuario'}

                  </p>

                  <p className="mt-0.5 text-sm text-slate-400">

                    {registroSeleccionado.correo_usuario || 'Correo no disponible'}

                  </p>

                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">

                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Fecha y hora</p>

                  <p className="mt-1 text-lg font-bold text-white">

                    {formatearFechaHora(registroSeleccionado.fecha_hora)}

                  </p>

                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">

                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Módulo</p>

                  <p className="mt-1 text-lg font-bold text-white">

                    {registroSeleccionado.modulo}

                  </p>

                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">

                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Acción</p>

                  <div className="mt-2">

                    <span className={claseAccion(registroSeleccionado.accion)}>

                      {registroSeleccionado.accion}

                    </span>

                  </div>

                </div>

              </div>

              <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6">

                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Descripción</p>

                <p className="mt-2 text-base leading-relaxed text-slate-200">

                  {registroSeleccionado.descripcion}

                </p>

              </div>

              {renderResumenCambios(

                registroSeleccionado.datos_anteriores,

                registroSeleccionado.datos_nuevos,

                registroSeleccionado.accion,

              )}

              <div className="grid gap-6 lg:grid-cols-2">

                {renderDatos(

                  'Datos anteriores',

                  registroSeleccionado.datos_anteriores,

                  registroSeleccionado.datos_nuevos,

                  'anterior',

                )}

                {renderDatos(

                  'Datos nuevos',

                  registroSeleccionado.datos_nuevos,

                  registroSeleccionado.datos_anteriores,

                  'nuevo',

                )}

              </div>

            </div>

            <div className="flex justify-end border-t border-white/10 px-10 py-5 flex-shrink-0">

              <button

                type="button"

                onClick={cerrarInformacion}

                className="rounded-xl bg-white/10 px-8 py-3 text-base font-bold text-white hover:bg-white/20 transition-colors"

              >

                Cerrar

              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}

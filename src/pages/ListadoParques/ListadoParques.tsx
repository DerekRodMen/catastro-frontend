import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download,
  FileSpreadsheet,
  FilterX,
  Search,
} from 'lucide-react';
import { api } from '../../services/api';
import fondoGrecia from '../../assets/grecia-login.jpg';
import logoMunicipalidad from '../../assets/logo-municipalidad-grecia.webp';
import SidebarCatastro from '../../components/SidebarCatastro';
interface Distrito {
  id_distrito: number;
  nombre_distrito: string;
  numero_distrito: number;
}
interface Encargado {
  id_encargado: number;
  entidad_encargada: string;
  cedula_juridica?: string | null;
  representante_legal?: string;
  correo_encargado?: string;
  telefono_encargado?: string;
}
interface Convenio {
  id_convenio: number;
  numero_convenio?: string | null;
  fecha_firma?: string | Date | null;
  plazo?: number | null;
  fecha_renovacion_firmas?: string | Date | null;
  estado_convenio?: string | null;
}
interface Declaracion {
  id_declaracion: number;
  fecha_declaracion?: string | Date | null;
  fecha_vencimiento?: string | Date | null;
  estado_declaracion?: string | null;
}
interface MantenimientoInversion {
  id_mantenimiento: number;
  nombre_mantenimiento: string;
  descripcion: string;
  inversion: number;
  descripcion_inversion?: string | null;
  fecha_mantenimiento: string;
}
interface ParqueListado {
  id_parque: number;
  distrito: Distrito | null;
  ubicacion: string;
  numero_finca: string;
  area: number;
  numero_plano: string;
  visado: string;
  estado: string;
  encargado: Encargado | null;
  convenios: Convenio[];
  declaraciones: Declaracion[];
  inversion: {
    total: number;
    cantidad_mantenimientos: number;
    mantenimientos: MantenimientoInversion[];
  };
}
// Componente principal del listado y reporte de parques.
export default function ListadoParques() {
  const navigate = useNavigate();
  // ============================================
  // DATOS
  // ============================================
  const [parques, setParques] = useState<ParqueListado[]>([]);
  const [distritos, setDistritos] = useState<Distrito[]>([]);
  const [encargados, setEncargados] = useState<Encargado[]>([]);
  // ============================================
  // ESTADOS GENERALES
  // ============================================
  const [cargando, setCargando] = useState(true);
  const [generandoExcel, setGenerandoExcel] = useState(false);
  const [error, setError] = useState('');
  // ============================================
  // FILTROS
  // ============================================
  const [filtroDistrito, setFiltroDistrito] = useState('');
  const [filtroEncargado, setFiltroEncargado] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroVisado, setFiltroVisado] = useState('');
  const [filtroEstadoConvenio, setFiltroEstadoConvenio] = useState('');
  const [busqueda, setBusqueda] = useState('');
  // ============================================
  // PAGINACIÓN
  // ============================================
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);
  // ============================================
  // CREAR PARÁMETROS
  // ============================================
  // Construye los parámetros enviados a la API según los filtros activos.
  const construirParametros = useCallback(() => {
    const params: Record<string, string> = {};
    if (filtroDistrito) {
      params.id_distrito = filtroDistrito;
    }
    if (filtroEncargado) {
      params.id_encargado = filtroEncargado;
    }
    if (filtroEstado) {
      params.estado = filtroEstado;
    }
    if (filtroVisado) {
      params.visado = filtroVisado;
    }
    if (filtroEstadoConvenio) {
      params.estado_convenio = filtroEstadoConvenio;
    }
    if (busqueda.trim()) {
      params.busqueda = busqueda.trim();
    }
    return params;
  }, [
    filtroDistrito,
    filtroEncargado,
    filtroEstado,
    filtroVisado,
    filtroEstadoConvenio,
    busqueda,
  ]);
  // ============================================
  // CARGAR CATÁLOGOS
  // ============================================
  // Carga los catálogos de distritos y encargados.
  const cargarCatalogos = useCallback(async () => {
    try {
      const [respuestaDistritos, respuestaEncargados] = await Promise.all([
        api.get('/distritos'),
        api.get('/encargados'),
      ]);
      const datosDistritos = Array.isArray(respuestaDistritos.data)
        ? respuestaDistritos.data
        : [];
      const datosEncargados = Array.isArray(respuestaEncargados.data)
        ? respuestaEncargados.data
        : [];
      setDistritos(datosDistritos);
      setEncargados(datosEncargados);
    } catch (err) {
      console.error('Error cargando catálogos:', err);
    }
  }, []);
  // ============================================
  // CARGAR LISTADO
  // ============================================
  // Carga el listado de parques aplicando los filtros seleccionados.
  const cargarListado = useCallback(async () => {
    try {
      setCargando(true);
      setError('');
      const respuesta = await api.get<ParqueListado[]>('/listado-parques', {
        params: construirParametros(),
      });
      setParques(Array.isArray(respuesta.data) ? respuesta.data : []);
    } catch (err) {
      console.error('Error cargando listado de parques:', err);
      setParques([]);
      setError('No fue posible cargar el listado de parques.');
    } finally {
      setCargando(false);
    }
  }, [construirParametros]);
  // ============================================
  // CARGA INICIAL
  // ============================================
  useEffect(() => {
    void cargarCatalogos();
  }, [cargarCatalogos]);
  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      void cargarListado();
    }, 250);
    return () => {
      window.clearTimeout(temporizador);
    };
  }, [cargarListado]);
  // ============================================
  // REINICIAR PAGINACIÓN
  // ============================================
  useEffect(() => {
    setPaginaActual(1);
  }, [
    filtroDistrito,
    filtroEncargado,
    filtroEstado,
    filtroVisado,
    filtroEstadoConvenio,
    busqueda,
    registrosPorPagina,
  ]);
  // ============================================
  // PAGINACIÓN CALCULADA
  // ============================================
  const totalRegistros = parques.length;
  const totalPaginas = Math.max(
    1,
    Math.ceil(totalRegistros / registrosPorPagina),
  );
  useEffect(() => {
    if (paginaActual > totalPaginas) {
      setPaginaActual(totalPaginas);
    }
  }, [paginaActual, totalPaginas]);
  const indiceInicial = (paginaActual - 1) * registrosPorPagina;
  const indiceFinal = Math.min(
    indiceInicial + registrosPorPagina,
    totalRegistros,
  );
  // Obtiene únicamente los registros correspondientes a la página actual.
  const parquesPaginados = useMemo(() => {
    return parques.slice(indiceInicial, indiceFinal);
  }, [parques, indiceInicial, indiceFinal]);
  // ============================================
  // PÁGINAS VISIBLES
  // ============================================
  // Calcula las páginas que se muestran en la paginación.
  const paginasVisibles = useMemo(() => {
    const maximo = 5;
    let inicio = Math.max(1, paginaActual - 2);
    let fin = Math.min(totalPaginas, inicio + maximo - 1);
    inicio = Math.max(1, fin - maximo + 1);
    const paginas: number[] = [];
    for (let pagina = inicio; pagina <= fin; pagina++) {
      paginas.push(pagina);
    }
    return paginas;
  }, [paginaActual, totalPaginas]);
  // ============================================
  // LIMPIAR FILTROS
  // ============================================
  // Restablece todos los filtros de búsqueda.
  const limpiarFiltros = () => {
    setFiltroDistrito('');
    setFiltroEncargado('');
    setFiltroEstado('');
    setFiltroVisado('');
    setFiltroEstadoConvenio('');
    setBusqueda('');
    setPaginaActual(1);
  };
  const hayFiltrosActivos = Boolean(
    filtroDistrito || filtroEncargado || filtroEstado || filtroVisado || filtroEstadoConvenio || busqueda
  );
  // ============================================
  // GENERAR EXCEL
  // ============================================
  // Genera y descarga el reporte de parques en formato Excel.
  const generarExcel = async () => {
    try {
      setGenerandoExcel(true);
      setError('');
      const respuesta = await api.get('/listado-parques/excel', {
        params: construirParametros(),
        responseType: 'blob',
      });
      const blob = new Blob([respuesta.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const enlace = document.createElement('a');
      enlace.href = url;
      const fecha = new Date().toISOString().substring(0, 10);
      enlace.download = `LISTADO_PARQUES_${fecha}.xlsx`;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generando Excel:', err);
      setError('No fue posible generar el archivo Excel.');
    } finally {
      setGenerandoExcel(false);
    }
  };
  // ============================================
  // FORMATEAR MONEDA
  // ============================================
  // Formatea los valores de inversión en colones.
  const formatearMoneda = (valor: number | null | undefined) => {
    const numero = Number(valor ?? 0);
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 2,
    }).format(numero);
  };
  // ============================================
  // FORMATEAR DISTRITO
  // ============================================
  // Formatea el número y nombre del distrito.
  const formatearDistrito = (distrito: Distrito | null) => {
    if (!distrito) {
      return 'Sin distrito';
    }
    return `${String(distrito.numero_distrito).padStart(2, '0')} - ${distrito.nombre_distrito}`;
  };
  // ============================================
  // VALORES ÚNICOS Y ESTILOS
  // ============================================
  const estadosParque = ['Bueno', 'Regular', 'Malo', 'Vacío'];
  const visados = ['Aprobado', 'Solicitado', 'No tiene'];
  // Obtiene los estados de convenio disponibles en los datos cargados.
  const estadosConvenio = useMemo(() => {
    const valores = new Set<string>();
    parques.forEach((parque) => {
      parque.convenios.forEach((convenio) => {
        const estado = convenio.estado_convenio?.trim();
        if (estado) {
          valores.add(estado);
        }
      });
    });
    return Array.from(valores).sort((a, b) => a.localeCompare(b, 'es'));
  }, [parques]);
  // Define el estilo visual según el estado recibido.
  const obtenerClaseEstado = (estado: string) => {
    switch (estado) {
      case 'Bueno':
      case 'Vigente':
      case 'Aprobado':
        return 'inline-flex rounded-md bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 text-xs font-bold text-emerald-400';
      case 'Regular':
      case 'En renovación':
      case 'Solicitado':
        return 'inline-flex rounded-md bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 text-xs font-bold text-amber-400';
      case 'Malo':
      case 'Vencido':
      case 'Vencida':
      case 'No tiene':
        return 'inline-flex rounded-md bg-red-500/20 border border-red-500/30 px-2.5 py-1 text-xs font-bold text-red-400';
      case 'Vacío':
      case 'Finalizado':
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
        <div className="mx-auto flex max-w-[1800px] items-center justify-between">
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
                Listado de Parques
              </h1>
              <p className="text-[11px] text-slate-300">
                Consulta y generación de reportes.
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
      <main className="relative z-20 mx-auto w-full max-w-[1800px] px-6 lg:px-12 py-8 flex-1">
        {/* ENCABEZADO Y BOTÓN EXCEL */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Propiedades municipales
              </h2>
              <p className="mt-1 text-sm text-slate-300">
                Aplique los filtros deseados y genere el archivo Excel.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={generarExcel}
            disabled={generandoExcel || cargando || parques.length === 0}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#18843B] px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-emerald-600 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={18} />
            {generandoExcel ? 'Generando...' : 'Descargar reporte Excel'}
          </button>
        </div>
        {/* ERROR GENERAL */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-900/40 p-4 text-sm font-bold text-red-300 backdrop-blur-md">
            {error}
          </div>
        )}
        {/* ====================================== */}
        {/* FILTROS DE BÚSQUEDA */}
        {/* ====================================== */}
        <section className="mb-8 rounded-2xl border border-white/10 bg-[#0c2330]/85 p-6 shadow-xl backdrop-blur-md">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="flex items-center gap-2 font-bold text-white">
                <Search size={18} />
                Filtros del listado
              </h3>
              <p className="mt-1 text-xs text-slate-300">
                Los filtros pueden utilizarse de forma individual o combinada.
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {/* BÚSQUEDA GENERAL */}
            <div className="xl:col-span-3 min-w-0">
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Búsqueda general
              </label>
              <div className="relative">
                <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(event) => setBusqueda(event.target.value)}
                  placeholder="Buscar por ubicación, finca, plano, distrito o encargado..."
                  className="w-full min-w-0 rounded-xl border border-white/20 bg-[#071923]/50 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
            {/* DISTRITO */}
            <div className="min-w-0">
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Distrito</label>
              <select
                value={filtroDistrito}
                onChange={(event) => setFiltroDistrito(event.target.value)}
                className="w-full min-w-0 rounded-xl border border-white/20 bg-[#071923]/50 px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="" className="bg-[#0B212D]">Todos los distritos</option>
                {[...distritos]
                  .sort((a, b) => a.numero_distrito - b.numero_distrito)
                  .map((distrito) => (
                    <option key={distrito.id_distrito} value={distrito.id_distrito} className="bg-[#0B212D]">
                      {`${String(distrito.numero_distrito).padStart(2, '0')} - ${distrito.nombre_distrito}`}
                    </option>
                  ))}
              </select>
            </div>
            {/* ENCARGADO */}
            <div className="min-w-0">
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Encargado</label>
              <select
                value={filtroEncargado}
                onChange={(event) => setFiltroEncargado(event.target.value)}
                className="w-full min-w-0 rounded-xl border border-white/20 bg-[#071923]/50 px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="" className="bg-[#0B212D]">Todos los encargados</option>
                {[...encargados]
                  .sort((a, b) => a.entidad_encargada.localeCompare(b.entidad_encargada, 'es'))
                  .map((encargado) => (
                    <option key={encargado.id_encargado} value={encargado.id_encargado} className="bg-[#0B212D]">
                      {encargado.entidad_encargada}
                    </option>
                  ))}
              </select>
            </div>
            {/* ESTADO PARQUE */}
            <div className="min-w-0">
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Estado del parque</label>
              <select
                value={filtroEstado}
                onChange={(event) => setFiltroEstado(event.target.value)}
                className="w-full min-w-0 rounded-xl border border-white/20 bg-[#071923]/50 px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="" className="bg-[#0B212D]">Todos los estados</option>
                {estadosParque.map((estado) => (
                  <option key={estado} value={estado} className="bg-[#0B212D]">
                    {estado}
                  </option>
                ))}
              </select>
            </div>
            {/* VISADO */}
            <div className="min-w-0">
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Visado</label>
              <select
                value={filtroVisado}
                onChange={(event) => setFiltroVisado(event.target.value)}
                className="w-full min-w-0 rounded-xl border border-white/20 bg-[#071923]/50 px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="" className="bg-[#0B212D]">Todos los visados</option>
                {visados.map((visado) => (
                  <option key={visado} value={visado} className="bg-[#0B212D]">
                    {visado}
                  </option>
                ))}
              </select>
            </div>
            {/* ESTADO CONVENIO */}
            <div className="min-w-0">
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Estado del convenio</label>
              <select
                value={filtroEstadoConvenio}
                onChange={(event) => setFiltroEstadoConvenio(event.target.value)}
                className="w-full min-w-0 rounded-xl border border-white/20 bg-[#071923]/50 px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="" className="bg-[#0B212D]">Todos los estados</option>
                {estadosConvenio.map((estado) => (
                  <option key={estado} value={estado} className="bg-[#0B212D]">
                    {estado}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>
        {/* ====================================== */}
        {/* TABLA PRINCIPAL */}
        {/* ====================================== */}
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d222e]/85 shadow-2xl backdrop-blur-md">
          <div className="border-b border-white/10 px-5 py-4 flex items-center justify-between">
            <h3 className="font-bold text-white">
              Resultados del listado
            </h3>
            <p className="text-sm text-slate-400">
              {cargando
                ? 'Consultando información...'
                : `${totalRegistros} registro${totalRegistros === 1 ? '' : 's'} encontrado${totalRegistros === 1 ? '' : 's'}.`
              }
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1800px] table-fixed">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="w-[8%] px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">Distrito</th>
                  <th className="w-[16%] px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">Ubicación</th>
                  <th className="w-[7%] px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">Finca</th>
                  <th className="w-[5%] px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">m²</th>
                  <th className="w-[8%] px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">Plano</th>
                  <th className="w-[7%] px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">Visado</th>
                  <th className="w-[8%] px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">Declaración</th>
                  <th className="w-[13%] px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">Encargado</th>
                  <th className="w-[7%] px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">Convenio</th>
                  <th className="w-[7%] px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">Est. Convenio</th>
                  <th className="w-[6%] px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">Est. Parque</th>
                  <th className="w-[8%] px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">Inversión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {cargando ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-14 text-center text-sm text-slate-400">
                      Cargando listado de parques...
                    </td>
                  </tr>
                ) : parquesPaginados.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-14 text-center text-sm text-slate-400">
                      No se encontraron parques con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  parquesPaginados.map((parque) => {
                    const ultimoConvenio = parque.convenios.length > 0
                      ? parque.convenios[parque.convenios.length - 1]
                      : null;
                    const ultimaDeclaracion = parque.declaraciones.length > 0
                      ? parque.declaraciones[parque.declaraciones.length - 1]
                      : null;
                    return (
                      <tr
                        key={parque.id_parque}
                        className="transition-colors hover:bg-white/5"
                      >
                        {/* DISTRITO */}
                        <td className="min-w-0 px-4 py-4 align-middle">
                          <p className="truncate text-sm font-bold text-white" title={formatearDistrito(parque.distrito)}>
                            {formatearDistrito(parque.distrito)}
                          </p>
                        </td>
                        {/* UBICACIÓN */}
                        <td className="min-w-0 px-4 py-4 align-middle">
                          <p className="truncate text-sm font-semibold text-slate-200" title={parque.ubicacion}>
                            {parque.ubicacion}
                          </p>
                        </td>
                        {/* FINCA */}
                        <td className="whitespace-nowrap px-4 py-4 align-middle text-sm text-slate-300">
                          {parque.numero_finca || '—'}
                        </td>
                        {/* ÁREA m² */}
                        <td className="whitespace-nowrap px-4 py-4 align-middle text-sm text-slate-300">
                          {Number(parque.area).toLocaleString('es-CR', { maximumFractionDigits: 2 })}
                        </td>
                        {/* PLANO */}
                        <td className="whitespace-nowrap px-4 py-4 align-middle text-sm text-slate-300">
                          {parque.numero_plano || '—'}
                        </td>
                        {/* VISADO */}
                        <td className="whitespace-nowrap px-4 py-4 align-middle">
                          <span className={obtenerClaseEstado(parque.visado || '')}>
                            {parque.visado || '—'}
                          </span>
                        </td>
                        {/* DECLARACIÓN */}
                        <td className="whitespace-nowrap px-4 py-4 align-middle">
                          {ultimaDeclaracion?.estado_declaracion ? (
                            <span className={obtenerClaseEstado(ultimaDeclaracion.estado_declaracion)}>
                              {ultimaDeclaracion.estado_declaracion}
                            </span>
                          ) : (
                            <span className="text-sm text-slate-500">Sin declaración</span>
                          )}
                        </td>
                        {/* ENCARGADO */}
                        <td className="min-w-0 px-4 py-4 align-middle">
                          <p className="truncate text-sm font-medium text-sky-300" title={parque.encargado?.entidad_encargada || ''}>
                            {parque.encargado?.entidad_encargada || <span className="text-slate-500">Sin encargado</span>}
                          </p>
                        </td>
                        {/* CONVENIO */}
                        <td className="whitespace-nowrap px-4 py-4 align-middle text-sm text-slate-300">
                          {ultimoConvenio?.numero_convenio || '—'}
                        </td>
                        {/* ESTADO CONVENIO */}
                        <td className="whitespace-nowrap px-4 py-4 align-middle">
                          {ultimoConvenio?.estado_convenio ? (
                            <span className={obtenerClaseEstado(ultimoConvenio.estado_convenio)}>
                              {ultimoConvenio.estado_convenio}
                            </span>
                          ) : (
                            <span className="text-sm text-slate-500">—</span>
                          )}
                        </td>
                        {/* ESTADO PARQUE */}
                        <td className="whitespace-nowrap px-4 py-4 align-middle">
                          {parque.estado ? (
                            <span className={obtenerClaseEstado(parque.estado)}>
                              {parque.estado}
                            </span>
                          ) : (
                            <span className="text-sm text-slate-500">—</span>
                          )}
                        </td>
                        {/* INVERSIÓN */}
                        <td className="whitespace-nowrap px-4 py-4 align-middle text-sm font-bold text-emerald-400">
                          {formatearMoneda(parque.inversion.total)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {/* PAGINACIÓN */}
          {parquesPaginados.length > 0 && (
            <div className="flex flex-col gap-4 bg-[#0B212D]/90 border-t border-white/10 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <p className="text-sm text-slate-400">
                  Mostrando <span className="font-bold text-white">{indiceInicial + 1}</span> a{' '}
                  <span className="font-bold text-white">{indiceFinal}</span> de{' '}
                  <span className="font-bold text-white">{totalRegistros}</span> parques
                </p>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-400">Registros por página:</label>
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
                  disabled={paginaActual === totalPaginas}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-semibold text-slate-300 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

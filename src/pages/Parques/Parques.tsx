import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';

import { api } from '../../services/api';
import fondoGrecia from '../../assets/grecia-login.jpg';
import logoMunicipalidad from '../../assets/logo-municipalidad-grecia.webp';

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

  inversiones?: {
    id_inversion?: number;
    descripcion_inversion: string;
    inversion: number;
    fecha_inversion: string;
  }[];

  id_distrito: number;
  id_encargado: number;

  distrito?: {
    id_distrito: number;
    nombre_distrito: string;
    numero_distrito: number;
  };

  encargado?: {
    id_encargado: number;
    entidad_encargada: string;
    cedula_juridica: string | null;
    representante_legal: string;
    correo_encargado: string;
    telefono_encargado: string;
  };
}

interface Distrito {
  id_distrito: number;
  nombre_distrito: string;
  numero_distrito: number;
}

interface Encargado {
  id_encargado: number;
  entidad_encargada: string;
  cedula_juridica: string | null;
  representante_legal: string;
  correo_encargado: string;
  telefono_encargado: string;
}

interface InversionMantenimiento {
  id_mantenimiento: number;
  nombre_mantenimiento: string;
  descripcion_inversion: string | null;
  inversion: number | string | null;
  fecha_mantenimiento: string;
  id_parque: number;
}

export default function Parques() {
  const navigate = useNavigate();

  // ============================================
  // DATOS
  // ============================================
  const [parques, setParques] = useState<Parque[]>([]);
  const [distritos, setDistritos] = useState<Distrito[]>([]);
  const [encargados, setEncargados] = useState<Encargado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // ============================================
  // FILTROS DE BÚSQUEDA
  // ============================================
  const [filtroUbicacion, setFiltroUbicacion] = useState('');
  const [filtroFinca, setFiltroFinca] = useState('');
  const [filtroPlano, setFiltroPlano] = useState('');
  const [filtroDistrito, setFiltroDistrito] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroEncargado, setFiltroEncargado] = useState('');

  const limpiarFiltros = () => {
    setFiltroUbicacion('');
    setFiltroFinca('');
    setFiltroPlano('');
    setFiltroDistrito('');
    setFiltroEstado('');
    setFiltroEncargado('');
  };

  const normalizarTexto = (valor: string | null | undefined) =>
    (valor ?? '').toLowerCase().trim();

  const limitarTexto = (
    valor: string | number | null | undefined,
    maximo: number,
  ) => {
    const texto = String(valor ?? '');
    if (texto.length <= maximo) {
      return texto;
    }
    return `${texto.slice(0, maximo)}…`;
  };

  const sanitizarSoloNumeros = (valor: string) =>
    valor.replace(/\D/g, '').slice(0, 50);

  const sanitizarArea = (valor: string) => {
    const normalizado = valor.replace(',', '.');
    const limpio = normalizado.replace(/[^0-9.]/g, '');
    const partes = limpio.split('.');
    const enteros = (partes[0] ?? '').slice(0, 10);
    const decimales = partes.slice(1).join('').slice(0, 2);

    if (partes.length > 1) {
      return `${enteros}.${decimales}`;
    }
    return enteros;
  };

  const parquesFiltrados = parques.filter((parque) => {
    const coincideUbicacion = normalizarTexto(parque.ubicacion).includes(normalizarTexto(filtroUbicacion));
    const coincideFinca = normalizarTexto(parque.numero_finca).includes(normalizarTexto(filtroFinca));
    const coincidePlano = normalizarTexto(parque.numero_plano).includes(normalizarTexto(filtroPlano));
    const coincideDistrito =
      !filtroDistrito ||
      String(parque.distrito?.id_distrito ?? parque.id_distrito) === filtroDistrito;
    const coincideEstado = !filtroEstado || parque.estado === filtroEstado;

    const textoEncargado = normalizarTexto(
      [
        parque.encargado?.entidad_encargada,
        parque.encargado?.representante_legal,
        parque.encargado?.cedula_juridica,
      ].filter(Boolean).join(' '),
    );

    const coincideEncargado = textoEncargado.includes(normalizarTexto(filtroEncargado));

    return (
      coincideUbicacion &&
      coincideFinca &&
      coincidePlano &&
      coincideDistrito &&
      coincideEstado &&
      coincideEncargado
    );
  });

  // ============================================
  // PAGINACIÓN
  // ============================================
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);

  const totalRegistrosFiltrados = parquesFiltrados.length;
  const totalPaginas = Math.max(
    1,
    Math.ceil(totalRegistrosFiltrados / registrosPorPagina),
  );

  const indiceInicial = (paginaActual - 1) * registrosPorPagina;
  const indiceFinal = Math.min(
    indiceInicial + registrosPorPagina,
    totalRegistrosFiltrados,
  );

  const parquesPaginados = parquesFiltrados.slice(
    indiceInicial,
    indiceFinal,
  );

  const paginasVisibles = (() => {
    const paginas: number[] = [];
    const inicio = Math.max(1, paginaActual - 2);
    const fin = Math.min(totalPaginas, inicio + 4);
    const inicioAjustado = Math.max(1, fin - 4);

    for (let pagina = inicioAjustado; pagina <= fin; pagina += 1) {
      paginas.push(pagina);
    }
    return paginas;
  })();

  const hayFiltrosActivos = Boolean(
    filtroUbicacion ||
    filtroFinca ||
    filtroPlano ||
    filtroDistrito ||
    filtroEstado ||
    filtroEncargado,
  );

  // ============================================
  // MODALES (Estados y Lógica de Bloqueo de Fondo)
  // ============================================
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idParqueEditando, setIdParqueEditando] = useState<number | null>(null);

  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [parqueEliminar, setParqueEliminar] = useState<Parque | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState('');

  const [modalEncargadoAbierto, setModalEncargadoAbierto] = useState(false);
  const [encargadoVer, setEncargadoVer] = useState<Parque['encargado'] | null>(null);

  const [modalInformacionAbierto, setModalInformacionAbierto] = useState(false);
  const [parqueVer, setParqueVer] = useState<Parque | null>(null);

  const [modalInversionAbierto, setModalInversionAbierto] = useState(false);
  const [parqueInversion, setParqueInversion] = useState<Parque | null>(null);
  const [inversionesParque, setInversionesParque] = useState<InversionMantenimiento[]>([]);
  const [cargandoInversiones, setCargandoInversiones] = useState(false);
  const [errorInversiones, setErrorInversiones] = useState('');

  // Lógica para bloquear el desplazamiento del fondo cuando un modal está abierto
  const unModalEstaAbierto = Boolean(
    modalAbierto ||
    modalEliminarAbierto ||
    modalEncargadoAbierto ||
    modalInformacionAbierto ||
    modalInversionAbierto
  );

  useEffect(() => {
    if (unModalEstaAbierto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = ''; // Restablecer al valor predeterminado
    }

    // Función de limpieza para asegurar que el desplazamiento se restablezca cuando el componente se desmonte o si el estado cambia (por ejemplo, cuando se cierra un modal)
    return () => {
      document.body.style.overflow = '';
    };
  }, [unModalEstaAbierto]);

  // ============================================
  // FORMULARIO
  // ============================================
  const [ubicacion, setUbicacion] = useState('');
  const [numeroFinca, setNumeroFinca] = useState('');
  const [area, setArea] = useState('');
  const [numeroPlano, setNumeroPlano] = useState('');
  const [visado, setVisado] = useState('');
  const [estado, setEstado] = useState('');
  const [idDistrito, setIdDistrito] = useState('');
  const [idEncargado, setIdEncargado] = useState('');

  const [busquedaDistrito, setBusquedaDistrito] = useState('');
  const [busquedaEncargado, setBusquedaEncargado] = useState('');

  const distritosFiltradosFormulario = distritos.filter((distrito) =>
    normalizarTexto(distrito.nombre_distrito).includes(normalizarTexto(busquedaDistrito)) ||
    String(distrito.numero_distrito).includes(busquedaDistrito.trim()),
  );

  const encargadosFiltradosFormulario = encargados.filter((encargado) => {
    const texto = normalizarTexto(
      [
        encargado.entidad_encargada,
        encargado.representante_legal,
        encargado.cedula_juridica,
      ].filter(Boolean).join(' '),
    );
    return texto.includes(normalizarTexto(busquedaEncargado));
  });

  // ============================================
  // CARGAS (API)
  // ============================================
  const cargarParques = async () => {
    try {
      setCargando(true);
      setError('');
      const response = await api.get('/parques');
      setParques(response.data);
    } catch (error) {
      console.error('Error cargando parques:', error);
      setError('No se pudieron cargar los parques.');
    } finally {
      setCargando(false);
    }
  };

  const cargarDistritos = async () => {
    try {
      const response = await api.get('/distritos');
      setDistritos(response.data);
    } catch (error) {
      console.error('Error cargando distritos:', error);
    }
  };

  const cargarEncargados = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        localStorage.removeItem('usuario');
        navigate('/login');
        return;
      }
      const response = await api.get('/encargados', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEncargados(response.data);
    } catch (error: any) {
      console.error('Error cargando encargados:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        navigate('/login');
        return;
      }
    }
  };

  useEffect(() => {
    cargarParques();
    cargarDistritos();
    cargarEncargados();
  }, []);

  useEffect(() => {
    setPaginaActual(1);
  }, [
    filtroUbicacion,
    filtroFinca,
    filtroPlano,
    filtroDistrito,
    filtroEstado,
    filtroEncargado,
    registrosPorPagina,
  ]);

  useEffect(() => {
    if (paginaActual > totalPaginas) {
      setPaginaActual(totalPaginas);
    }
  }, [paginaActual, totalPaginas]);

  // ============================================
  // MANEJO DE MODALES Y FORMULARIOS
  // ============================================
  const limpiarFormulario = () => {
    setUbicacion('');
    setNumeroFinca('');
    setArea('');
    setNumeroPlano('');
    setVisado('');
    setEstado('');
    setIdDistrito('');
    setIdEncargado('');
    setBusquedaDistrito('');
    setBusquedaEncargado('');
    setErrorFormulario('');
  };

  const abrirModalCrear = () => {
    limpiarFormulario();
    setModoEdicion(false);
    setIdParqueEditando(null);
    setModalAbierto(true);
  };

  const abrirModalEditar = (parque: Parque) => {
    setUbicacion(parque.ubicacion ?? '');
    setNumeroFinca(parque.numero_finca ?? '');
    setArea(String(parque.area ?? ''));
    setNumeroPlano(parque.numero_plano ?? '');
    setVisado(parque.visado ?? '');
    setEstado(parque.estado ?? '');
    setIdDistrito(
      parque.id_distrito
        ? String(parque.id_distrito)
        : parque.distrito
          ? String(parque.distrito.id_distrito)
          : '',
    );
    setIdEncargado(
      parque.id_encargado
        ? String(parque.id_encargado)
        : parque.encargado
          ? String(parque.encargado.id_encargado)
          : '',
    );
    setModoEdicion(true);
    setIdParqueEditando(parque.id_parque);
    setErrorFormulario('');
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    if (guardando) return;
    setModalAbierto(false);
    limpiarFormulario();
    setModoEdicion(false);
    setIdParqueEditando(null);
  };

  const guardarParque = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGuardando(true);
    setErrorFormulario('');

    const fincaNormalizada = numeroFinca.trim();
    const planoNormalizado = numeroPlano.trim().toLowerCase();

    const fincaDuplicada = parques.some(
      (parque) =>
        parque.numero_finca.trim() === fincaNormalizada &&
        parque.id_parque !== idParqueEditando,
    );

    if (fincaDuplicada) {
      setErrorFormulario('Ya existe un parque registrado con este número de finca.');
      setGuardando(false);
      return;
    }

    const planoDuplicado = parques.some(
      (parque) =>
        parque.numero_plano.trim().toLowerCase() === planoNormalizado &&
        parque.id_parque !== idParqueEditando,
    );

    if (planoDuplicado) {
      setErrorFormulario('Ya existe un parque registrado con este número de plano.');
      setGuardando(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const datosParque = {
        ubicacion: ubicacion.trim(),
        numero_finca: numeroFinca.trim(),
        area: Number(area),
        numero_plano: numeroPlano.trim(),
        visado: visado.trim(),
        estado,
        descripcion_inversion: 'Sin inversión registrada',
        inversion: 0,
        fecha_inversion: '2026-01-01',
        id_distrito: Number(idDistrito),
        id_encargado: Number(idEncargado),
      };

      if (modoEdicion && idParqueEditando !== null) {
        await api.patch(`/parques/${idParqueEditando}`, datosParque, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await api.post('/parques', datosParque, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setModalAbierto(false);
      limpiarFormulario();
      setModoEdicion(false);
      setIdParqueEditando(null);
      await cargarParques();
    } catch (error: any) {
      console.error('Error guardando parque:', error);
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
          modoEdicion ? 'No se pudo actualizar el parque.' : 'No se pudo registrar el parque.',
        );
      }
    } finally {
      setGuardando(false);
    }
  };

  const abrirModalEliminar = (parque: Parque) => {
    setParqueEliminar(parque);
    setErrorEliminar('');
    setModalEliminarAbierto(true);
  };

  const cerrarModalEliminar = () => {
    if (eliminando) return;
    setModalEliminarAbierto(false);
    setParqueEliminar(null);
    setErrorEliminar('');
  };

  const confirmarEliminarParque = async () => {
    if (!parqueEliminar) return;
    try {
      setEliminando(true);
      setErrorEliminar('');
      const token = localStorage.getItem('token');
      await api.delete(`/parques/${parqueEliminar.id_parque}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setModalEliminarAbierto(false);
      setParqueEliminar(null);
      await cargarParques();
    } catch (error: any) {
      console.error('Error eliminando parque:', error);
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
        setErrorEliminar('No se pudo eliminar el parque.');
      }
    } finally {
      setEliminando(false);
    }
  };

  const abrirModalEncargado = (parque: Parque) => {
    if (!parque.encargado) return;
    setEncargadoVer(parque.encargado);
    setModalEncargadoAbierto(true);
  };

  const cerrarModalEncargado = () => {
    setModalEncargadoAbierto(false);
    setEncargadoVer(null);
  };

  const abrirModalInformacion = (parque: Parque) => {
    setParqueVer(parque);
    setModalInformacionAbierto(true);
  };

  const cerrarModalInformacion = () => {
    setModalInformacionAbierto(false);
    setParqueVer(null);
  };

  const abrirModalInversion = async (parque: Parque) => {
    setParqueInversion(parque);
    setInversionesParque([]);
    setErrorInversiones('');
    setModalInversionAbierto(true);

    try {
      setCargandoInversiones(true);
      const token = localStorage.getItem('token');
      const response = await api.get('/mantenimientos', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const mantenimientos: InversionMantenimiento[] = Array.isArray(response.data) ? response.data : [];
      const inversiones = mantenimientos
        .filter(
          (mantenimiento) =>
            Number(mantenimiento.id_parque) === Number(parque.id_parque) &&
            (Number(mantenimiento.inversion ?? 0) > 0 ||
              Boolean(mantenimiento.descripcion_inversion?.trim())),
        )
        .sort(
          (a, b) =>
            new Date(b.fecha_mantenimiento).getTime() -
            new Date(a.fecha_mantenimiento).getTime(),
        );

      setInversionesParque(inversiones);
    } catch (error: any) {
      console.error('Error cargando inversiones del parque:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        navigate('/login');
        return;
      }
      setErrorInversiones(
        error.response?.data?.message || 'No se pudieron cargar las inversiones de los mantenimientos.',
      );
    } finally {
      setCargandoInversiones(false);
    }
  };

  const cerrarModalInversion = () => {
    setModalInversionAbierto(false);
    setParqueInversion(null);
    setInversionesParque([]);
    setErrorInversiones('');
    setCargandoInversiones(false);
  };

  const formatearColones = (valor: number | string | null | undefined) => {
    const numero = Number(valor ?? 0);
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(numero) ? numero : 0);
  };

  const formatearFechaInversion = (fecha: string | null | undefined) => {
    if (!fecha) return 'Fecha no registrada';
    const partes = fecha.substring(0, 10).split('-');
    if (partes.length !== 3) return fecha;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  const inversionTotalParque = inversionesParque.reduce(
    (total, mantenimiento) => total + Number(mantenimiento.inversion ?? 0),
    0,
  );

  // Cerrar modales con ESC
  useEffect(() => {
    const manejarEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (modalInversionAbierto) return cerrarModalInversion();
      if (modalInformacionAbierto) return cerrarModalInformacion();
      if (modalEncargadoAbierto) return cerrarModalEncargado();
      if (modalEliminarAbierto) return cerrarModalEliminar();
      if (modalAbierto) return cerrarModal();
    };
    document.addEventListener('keydown', manejarEscape);
    return () => document.removeEventListener('keydown', manejarEscape);
  }, [
    modalInversionAbierto,
    modalInformacionAbierto,
    modalEncargadoAbierto,
    modalEliminarAbierto,
    modalAbierto,
    guardando,
    eliminando,
  ]);

  return (
    <div className="relative min-h-screen w-full font-sans antialiased text-white flex flex-col overflow-x-hidden">
      
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
          
          {/* Lado izquierdo */}
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
                Gestión de Parques
              </h1>
              <p className="text-[11px] text-slate-300">
                Administración de los parques registrados en el sistema.
              </p>
            </div>
          </div>

          {/* Lado derecho con Botón Volver Textual (Turn 7) */}
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
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Parques registrados
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Consulte y administre la información almacenada en el sistema.
            </p>
          </div>
          <button
            type="button"
            onClick={abrirModalCrear}
            className="rounded-lg bg-[#18843B] px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-emerald-600 transition-colors"
          >
            + Nuevo parque
          </button>
        </div>

        {/* FILTROS DE BÚSQUEDA */}
        <div className="mb-8 rounded-2xl border border-white/10 bg-[#0c2330]/85 p-6 shadow-xl backdrop-blur-md">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-bold text-white">Filtros de búsqueda</h3>
              <p className="mt-1 text-sm text-slate-300">
                Utilice uno o varios criterios para localizar parques específicos.
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Ubicación</label>
              <input
                type="text"
                value={filtroUbicacion}
                onChange={(event) => setFiltroUbicacion(event.target.value)}
                placeholder="Buscar por ubicación"
                className="w-full rounded-lg border border-white/20 bg-[#071923]/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Número de finca</label>
              <input
                type="text"
                value={filtroFinca}
                onChange={(event) => setFiltroFinca(event.target.value)}
                placeholder="Buscar por finca"
                className="w-full rounded-lg border border-white/20 bg-[#071923]/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Número de plano</label>
              <input
                type="text"
                value={filtroPlano}
                onChange={(event) => setFiltroPlano(event.target.value)}
                placeholder="Buscar por plano"
                className="w-full rounded-lg border border-white/20 bg-[#071923]/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Distrito</label>
              <select
                value={filtroDistrito}
                onChange={(event) => setFiltroDistrito(event.target.value)}
                className="w-full rounded-lg border border-white/20 bg-[#071923]/50 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="" className="bg-[#0B212D]">Todos los distritos</option>
                {distritos.map((distrito) => (
                  <option key={distrito.id_distrito} value={distrito.id_distrito} className="bg-[#0B212D]">
                    {distrito.nombre_distrito}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Estado</label>
              <select
                value={filtroEstado}
                onChange={(event) => setFiltroEstado(event.target.value)}
                className="w-full rounded-lg border border-white/20 bg-[#071923]/50 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="" className="bg-[#0B212D]">Todos los estados</option>
                <option value="Bueno" className="bg-[#0B212D]">Bueno</option>
                <option value="Regular" className="bg-[#0B212D]">Regular</option>
                <option value="Malo" className="bg-[#0B212D]">Malo</option>
                <option value="Vacío" className="bg-[#0B212D]">Vacío</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Entidad encargada</label>
              <input
                type="text"
                value={filtroEncargado}
                onChange={(event) => setFiltroEncargado(event.target.value)}
                placeholder="Entidad, representante o cédula"
                className="w-full rounded-lg border border-white/20 bg-[#071923]/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-5 border-t border-white/10 pt-4">
            <p className="text-sm text-slate-400">
              Mostrando <span className="font-bold text-white">{parquesFiltrados.length}</span>
              {' '}de <span className="font-bold text-white">{parques.length}</span> parques.
            </p>
          </div>
        </div>

        {/* CARGANDO */}
        {cargando && (
          <div className="rounded-2xl border border-white/10 bg-[#0d222e]/85 p-8 text-center text-slate-300 backdrop-blur-md">
            Cargando parques...
          </div>
        )}

        {/* ERROR */}
        {!cargando && error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-900/40 p-6 backdrop-blur-md">
            <p className="font-semibold text-red-300">{error}</p>
            <button
              type="button"
              onClick={cargarParques}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
            >
              Intentar nuevamente
            </button>
          </div>
        )}

        {/* ====================================== */}
        {/* TABLA */}
        {/* ====================================== */}
        {!cargando && !error && (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d222e]/85 shadow-2xl backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1180px]">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    {['Ubicación', 'Finca', 'Área', 'Plano', 'Visado', 'Distrito', 'Entidad encargada', 'Estado', 'Acciones'].map((titulo) => (
                      <th
                        key={titulo}
                        className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300"
                      >
                        {titulo}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {parquesFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                        {hayFiltrosActivos
                          ? 'No se encontraron parques que coincidan con los filtros seleccionados.'
                          : 'No hay parques registrados.'}
                      </td>
                    </tr>
                  ) : (
                    parquesPaginados.map((parque) => (
                      <tr
                        key={parque.id_parque}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        {/* Ubicación */}
                        <td className="max-w-[220px] px-4 py-4 text-sm font-semibold text-white">
                          <p className="truncate" title={parque.ubicacion}>
                            {limitarTexto(parque.ubicacion, 40)}
                          </p>
                        </td>
                        {/* Finca, área, plano, visado y distrito */}
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-300">
                          {parque.numero_finca}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-300">
                          {parque.area} m²
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-300">
                          {parque.numero_plano}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-300">
                          {parque.visado}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-300">
                          {parque.distrito?.nombre_distrito ?? 'Sin distrito'}
                        </td>
                        {/* Entidad encargada */}
                        <td className="max-w-[210px] px-4 py-4 text-sm">
                          {parque.encargado ? (
                            <p
                              className="truncate font-medium text-sky-300"
                              title={parque.encargado.entidad_encargada}
                            >
                              {limitarTexto(parque.encargado.entidad_encargada, 35)}
                            </p>
                          ) : (
                            <span className="text-slate-500">Sin encargado</span>
                          )}
                        </td>
                        {/* Estado */}
                        <td className="whitespace-nowrap px-4 py-4">
                          <span
                            className={
                              parque.estado === 'Bueno'
                                ? 'inline-flex rounded-md bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 text-xs font-bold text-emerald-400'
                                : parque.estado === 'Regular'
                                  ? 'inline-flex rounded-md bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 text-xs font-bold text-amber-400'
                                  : parque.estado === 'Malo'
                                    ? 'inline-flex rounded-md bg-red-500/20 border border-red-500/30 px-2.5 py-1 text-xs font-bold text-red-400'
                                    : 'inline-flex rounded-md bg-slate-500/20 border border-slate-500/30 px-2.5 py-1 text-xs font-bold text-slate-300'
                            }
                          >
                            {parque.estado}
                          </span>
                        </td>
                        {/* Acciones */}
                        <td className="whitespace-nowrap px-4 py-4">
                          <div className="flex flex-nowrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => abrirModalEditar(parque)}
                              className="rounded-md bg-sky-500/20 border border-sky-500/30 px-2.5 py-1.5 text-xs font-bold text-sky-300 hover:bg-sky-500/30 transition-colors"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => abrirModalInformacion(parque)}
                              className="rounded-md bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-1.5 text-xs font-bold text-indigo-300 hover:bg-indigo-500/30 transition-colors"
                            >
                              Info
                            </button>
                            <button
                              type="button"
                              onClick={() => abrirModalInversion(parque)}
                              className="rounded-md bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 transition-colors"
                            >
                              Inversión
                            </button>
                            <button
                              type="button"
                              onClick={() => abrirModalEncargado(parque)}
                              disabled={!parque.encargado}
                              className="rounded-md bg-purple-500/20 border border-purple-500/30 px-2.5 py-1.5 text-xs font-bold text-purple-300 hover:bg-purple-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              Encargado
                            </button>
                            <button
                              type="button"
                              onClick={() => abrirModalEliminar(parque)}
                              className="rounded-md bg-red-500/20 border border-red-500/30 px-2.5 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/30 transition-colors"
                            >
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
            {parquesFiltrados.length > 0 && (
              <div className="flex flex-col gap-4 bg-[#0B212D]/90 border-t border-white/10 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <p className="text-sm text-slate-400">
                    Mostrando <span className="font-bold text-white">{indiceInicial + 1}</span> a{' '}
                    <span className="font-bold text-white">{indiceFinal}</span> de{' '}
                    <span className="font-bold text-white">{totalRegistrosFiltrados}</span> parques
                  </p>

                  <div className="flex items-center gap-2">
                    <label htmlFor="registrosPorPaginaParques" className="text-sm text-slate-400">
                      Registros por página:
                    </label>
                    <select
                      id="registrosPorPaginaParques"
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
          </div>
        )}
      </main>

      {/* ====================================== */}
      {/* MODAL CREAR / EDITAR - SIN DOBLE BARRA */}
      {/* ====================================== */}
      {modalAbierto && (
        <div onClick={cerrarModal} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-7xl h-[85vh] flex flex-col rounded-2xl border border-white/10 bg-[#0B212D] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-10 py-7 flex-shrink-0">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tighter">
                  {modoEdicion ? 'Editar parque' : 'Nuevo parque'}
                </h2>
                <p className="mt-2 text-base text-slate-400">
                  {modoEdicion ? 'Modifique la información detallada del parque seleccionado.' : 'Complete la información completa para registrar el parque en el sistema.'}
                </p>
              </div>
              <button
                type="button"
                onClick={cerrarModal}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={guardarParque} className="p-10 flex-1 overflow-y-auto">
              {errorFormulario && (
                <div className="mb-10 rounded-xl border border-red-500/30 bg-red-900/40 p-6 text-base font-semibold text-red-300">
                  {errorFormulario}
                </div>
              )}

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div>
                  <label className="mb-3 block text-base font-bold text-slate-300">Ubicación</label>
                  <input
                    type="text"
                    value={ubicacion}
                    onChange={(e) => setUbicacion(e.target.value)}
                    required
                    maxLength={200}
                    placeholder="Ej: Barrio Latino, Grecia Centro"
                    className="w-full rounded-xl border border-white/20 bg-[#071923] p-4 text-base text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-3 block text-base font-bold text-slate-300">Número de finca</label>
                  <input
                    type="text"
                    value={numeroFinca}
                    onChange={(e) => setNumeroFinca(sanitizarSoloNumeros(e.target.value))}
                    required
                    maxLength={50}
                    inputMode="numeric"
                    placeholder="Ej: 2123456000"
                    className="w-full rounded-xl border border-white/20 bg-[#071923] p-4 text-base text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-3 block text-base font-bold text-slate-300">Área (m²)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={area}
                    onChange={(e) => setArea(sanitizarArea(e.target.value))}
                    required
                    maxLength={13}
                    placeholder="Ej: 2500.50"
                    className="w-full rounded-xl border border-white/20 bg-[#071923] p-4 text-base text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-3 block text-base font-bold text-slate-300">Número de plano</label>
                  <input
                    type="text"
                    value={numeroPlano}
                    onChange={(e) => setNumeroPlano(e.target.value)}
                    required
                    maxLength={50}
                    placeholder="Ej: A-1234567-2026"
                    className="w-full rounded-xl border border-white/20 bg-[#071923] p-4 text-base text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-3 block text-base font-bold text-slate-300">Visado</label>
                  <select
                    value={visado}
                    onChange={(e) => setVisado(e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/20 bg-[#071923] p-4 text-base text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="" className="bg-[#0B212D]">Seleccione el visado</option>
                    <option value="Aprobado" className="bg-[#0B212D]">Aprobado</option>
                    <option value="Solicitado" className="bg-[#0B212D]">Solicitado</option>
                    <option value="No tiene" className="bg-[#0B212D]">No tiene</option>
                  </select>
                </div>
                <div>
                  <label className="mb-3 block text-base font-bold text-slate-300">Estado</label>
                  <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/20 bg-[#071923] p-4 text-base text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="" className="bg-[#0B212D]">Seleccione el estado</option>
                    <option value="Bueno" className="bg-[#0B212D]">Bueno</option>
                    <option value="Regular" className="bg-[#0B212D]">Regular</option>
                    <option value="Malo" className="bg-[#0B212D]">Malo</option>
                    <option value="Vacío" className="bg-[#0B212D]">Vacío</option>
                  </select>
                </div>
                <div>
                  <label className="mb-3 block text-base font-bold text-slate-300">Distrito</label>
                  <input
                    type="text"
                    value={busquedaDistrito}
                    onChange={(e) => setBusquedaDistrito(e.target.value)}
                    placeholder="Buscar distrito..."
                    className="mb-4 w-full rounded-xl border border-white/20 bg-[#071923] p-4 text-base text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <select
                    value={idDistrito}
                    onChange={(e) => setIdDistrito(e.target.value)}
                    required
                    size={20}
                    className="w-full h-[300px] overflow-y-auto rounded-xl border border-white/20 bg-[#071923] p-4 text-base text-white"
                  >
                    <option value="" className="text-slate-400">Seleccione un distrito</option>
                    {distritosFiltradosFormulario.map((distrito) => (
                      <option key={distrito.id_distrito} value={distrito.id_distrito} className="py-1">
                        {distrito.nombre_distrito}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-3 block text-base font-bold text-slate-300">Entidad encargada</label>
                  <input
                    type="text"
                    value={busquedaEncargado}
                    onChange={(e) => setBusquedaEncargado(e.target.value)}
                    placeholder="Buscar entidad..."
                    className="mb-4 w-full rounded-xl border border-white/20 bg-[#071923] p-4 text-base text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <select
                    value={idEncargado}
                    onChange={(e) => setIdEncargado(e.target.value)}
                    required
                    size={20}
                    className="w-full h-[300px] overflow-y-auto rounded-xl border border-white/20 bg-[#071923] p-4 text-base text-white"
                  >
                    <option value="" className="text-slate-400">Seleccione una entidad</option>
                    {encargadosFiltradosFormulario.map((encargado) => (
                      <option key={encargado.id_encargado} value={encargado.id_encargado} className="py-1">
                        {encargado.entidad_encargada} — {encargado.representante_legal}
                      </option>
                    ))}
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
                  {guardando ? 'Guardando...' : modoEdicion ? 'Guardar cambios' : 'Guardar parque'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================== */}
      {/* MODAL INFORMACIÓN PARQUE - SIN DOBLE BARRA */}
      {/* ====================================== */}
      {modalInformacionAbierto && parqueVer && (
        <div onClick={cerrarModalInformacion} className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-6xl flex flex-col rounded-2xl border border-white/10 bg-[#0B212D] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-10 py-7 flex-shrink-0">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tighter">Información detallada</h2>
                <p className="mt-2 text-base text-slate-400">Consulte la información completa registrada para este parque.</p>
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
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <p className="text-sm font-bold uppercase tracking-wide text-slate-400">Ubicación</p>
                  <p className="mt-2 text-xl font-semibold text-white">{parqueVer.ubicacion}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <p className="text-sm font-bold uppercase tracking-wide text-slate-400">Número de finca</p>
                  <p className="mt-2 text-xl font-semibold text-white">{parqueVer.numero_finca}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <p className="text-sm font-bold uppercase tracking-wide text-slate-400">Área</p>
                  <p className="mt-2 text-xl font-semibold text-white">{parqueVer.area} m²</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <p className="text-sm font-bold uppercase tracking-wide text-slate-400">Número de plano</p>
                  <p className="mt-2 text-xl font-semibold text-white">{parqueVer.numero_plano}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <p className="text-sm font-bold uppercase tracking-wide text-slate-400">Visado</p>
                  <p className="mt-2 text-xl font-semibold text-white">{parqueVer.visado}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <p className="text-sm font-bold uppercase tracking-wide text-slate-400">Estado</p>
                  <p className="mt-2 text-xl font-semibold text-white">{parqueVer.estado}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <p className="text-sm font-bold uppercase tracking-wide text-slate-400">Distrito</p>
                  <p className="mt-2 text-xl font-semibold text-white">{parqueVer.distrito?.nombre_distrito || 'Sin distrito'}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <p className="text-sm font-bold uppercase tracking-wide text-slate-400">Entidad encargada</p>
                  <p className="mt-2 text-xl font-semibold text-white">{parqueVer.encargado?.entidad_encargada || 'Sin encargado'}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:col-span-2">
                  <p className="text-sm font-bold uppercase tracking-wide text-slate-400">Representante legal</p>
                  <p className="mt-2 text-xl font-semibold text-white">{parqueVer.encargado?.representante_legal || 'No registrado'}</p>
                </div>
              </div>
              <div className="mt-12 flex justify-end flex-shrink-0 pb-5">
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

      {/* ====================================== */}
      {/* MODAL INVERSIONES - SIN DOBLE BARRA */}
      {/* ====================================== */}
      {modalInversionAbierto && parqueInversion && (
        <div onClick={cerrarModalInversion} className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div onClick={(e) => e.stopPropagation()} className="max-h-[85vh] h-[85vh] w-full max-w-7xl flex flex-col rounded-2xl border border-white/10 bg-[#0B212D] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-10 py-7 flex-shrink-0">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tighter">Historial completo de inversiones</h2>
                <p className="mt-2 text-base text-slate-400">{parqueInversion.ubicacion}</p>
              </div>
              <button
                type="button"
                onClick={cerrarModalInversion}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors text-xl font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-10 flex-1 overflow-y-auto">
              {cargandoInversiones ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center h-full flex flex-col items-center justify-center">
                  <p className="text-xl font-bold text-white">Cargando historial de inversiones...</p>
                  <p className="mt-2 text-base text-slate-400">Consultando los mantenimientos registrados para este parque.</p>
                </div>
              ) : errorInversiones ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-900/40 p-8 h-full flex flex-col items-center justify-center">
                  <p className="text-xl font-bold text-red-300">No se pudieron cargar las inversiones</p>
                  <p className="mt-2 text-base text-red-400">{errorInversiones}</p>
                  <button
                    type="button"
                    onClick={() => abrirModalInversion(parqueInversion)}
                    className="mt-6 rounded-lg bg-red-600 px-6 py-3 text-base font-bold text-white hover:bg-red-700"
                  >
                    Intentar nuevamente
                  </button>
                </div>
              ) : inversionesParque.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center h-full flex flex-col items-center justify-center">
                  <p className="text-xl font-bold text-white">No hay inversiones registradas</p>
                  <p className="mt-2 text-base text-slate-400">Este parque todavía no tiene mantenimientos con inversión detallada registrada.</p>
                </div>
              ) : (
                <>
                  <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-900/30 p-8 flex flex-col items-center justify-center">
                      <p className="text-sm font-bold uppercase tracking-wide text-emerald-400">Inversión total acumulada</p>
                      <p className="mt-4 text-5xl font-black text-emerald-300">{formatearColones(inversionTotalParque)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-8 flex flex-col items-center justify-center">
                      <p className="text-sm font-bold uppercase tracking-wide text-slate-400">Mantenimientos detallados</p>
                      <p className="mt-4 text-5xl font-black text-white">{inversionesParque.length}</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    {inversionesParque.map((inversionRegistro, index) => (
                      <div key={inversionRegistro.id_mantenimiento} className="rounded-2xl border border-white/10 bg-white/5 p-8">
                        <div className="mb-6 flex flex-col gap-3 border-b border-white/10 pb-6 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-sm font-bold uppercase tracking-wide text-emerald-400">Inversión registrada #{index + 1}</p>
                            <p className="mt-2 text-2xl font-bold text-white tracking-tight">{inversionRegistro.nombre_mantenimiento}</p>
                          </div>
                          <p className="text-base font-medium text-slate-400">
                            {formatearFechaInversion(inversionRegistro.fecha_mantenimiento)}
                          </p>
                        </div>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                          <div className="rounded-xl bg-[#071923]/50 border border-white/10 p-6 flex flex-col items-center justify-center">
                            <p className="text-sm font-bold uppercase tracking-wide text-slate-400">Monto total</p>
                            <p className="mt-3 text-3xl font-bold text-white">{formatearColones(inversionRegistro.inversion)}</p>
                          </div>
                          <div className="rounded-xl bg-[#071923]/50 border border-white/10 p-6 flex flex-col items-center justify-center">
                            <p className="text-sm font-bold uppercase tracking-wide text-slate-400">Fecha de mantenimiento</p>
                            <p className="mt-3 text-3xl font-semibold text-white">{formatearFechaInversion(inversionRegistro.fecha_mantenimiento)}</p>
                          </div>
                        </div>
                        <div className="mt-6 rounded-xl bg-[#071923]/50 border border-white/10 p-6">
                          <p className="text-sm font-bold uppercase tracking-wide text-slate-400">Descripción detallada de la inversión</p>
                          <p className="mt-3 text-base font-semibold text-white leading-relaxed">
                            {inversionRegistro.descripcion_inversion?.trim() || 'Sin detalle registrado'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              <div className="mt-12 flex justify-end flex-shrink-0 pb-5">
                <button
                  type="button"
                  onClick={cerrarModalInversion}
                  className="rounded-xl bg-white/10 px-8 py-3 text-base font-bold text-white hover:bg-white/20 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================== */}
      {/* MODAL INFORMACIÓN ENCARGADO - SIN DOBLE BARRA */}
      {/* ====================================== */}
      {modalEncargadoAbierto && encargadoVer && (
        <div onClick={cerrarModalEncargado} className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-3xl flex flex-col rounded-2xl border border-white/10 bg-[#0B212D] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-10 py-7 flex-shrink-0">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tighter">Detalles del encargado</h2>
                <p className="mt-2 text-base text-slate-400">Consulte los datos detallados de la entidad encargada y su representante legal.</p>
              </div>
              <button
                type="button"
                onClick={cerrarModalEncargado}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors text-xl font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-10 flex-1 overflow-y-auto">
              <div className="mb-8 rounded-2xl border border-sky-500/30 bg-sky-900/30 p-8 flex flex-col items-center justify-center">
                <p className="text-sm font-bold uppercase tracking-wide text-sky-400">Entidad encargada registrada</p>
                <p className="mt-4 text-4xl font-black text-white tracking-tight text-center">{encargadoVer.entidad_encargada}</p>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <p className="text-sm font-bold uppercase tracking-wide text-slate-400">Cédula jurídica</p>
                  <p className="mt-2 text-xl font-semibold text-white">{encargadoVer.cedula_juridica || 'No registrada'}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <p className="text-sm font-bold uppercase tracking-wide text-slate-400">Representante legal</p>
                  <p className="mt-2 text-xl font-semibold text-white">{encargadoVer.representante_legal}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:col-span-2">
                  <p className="text-sm font-bold uppercase tracking-wide text-slate-400">Correo electrónico</p>
                  <p className="mt-2 text-xl font-semibold text-sky-300 break-all">{encargadoVer.correo_encargado}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:col-span-2">
                  <p className="text-sm font-bold uppercase tracking-wide text-slate-400">Teléfono</p>
                  <p className="mt-2 text-xl font-semibold text-white">{encargadoVer.telefono_encargado}</p>
                </div>
              </div>
              <div className="mt-12 flex justify-end flex-shrink-0 pb-5">
                <button
                  type="button"
                  onClick={cerrarModalEncargado}
                  className="rounded-xl bg-white/10 px-8 py-3 text-base font-bold text-white hover:bg-white/20 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================== */}
      {/* MODAL ELIMINAR - SIN DOBLE BARRA */}
      {/* ====================================== */}
      {modalEliminarAbierto && parqueEliminar && (
        <div onClick={cerrarModalEliminar} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-2xl flex flex-col rounded-2xl border border-white/10 bg-[#0B212D] shadow-2xl overflow-hidden">
            <div className="border-b border-white/10 px-10 py-7 flex-shrink-0">
              <h2 className="text-3xl font-black text-white tracking-tighter">Eliminar parque</h2>
              <p className="mt-2 text-base text-slate-400">Esta acción eliminará el registro seleccionado de forma permanente.</p>
            </div>
            <div className="p-10 flex-1 overflow-y-auto">
              <div className="rounded-2xl border border-red-500/30 bg-red-900/30 p-8 flex flex-col items-center justify-center text-center">
                <p className="text-base text-red-300">¿Está seguro de que desea eliminar este parque?</p>
                <p className="mt-6 text-3xl font-black text-white tracking-tight">{parqueEliminar.ubicacion}</p>
                <p className="mt-3 text-lg text-slate-400">Finca: {parqueEliminar.numero_finca}</p>
              </div>
              {errorEliminar && (
                <div className="mt-8 rounded-xl border border-red-500/30 bg-red-900/50 p-6 text-base font-semibold text-red-300">
                  <p className="font-black text-lg text-red-300">No se puede eliminar el parque</p>
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
                  onClick={confirmarEliminarParque}
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
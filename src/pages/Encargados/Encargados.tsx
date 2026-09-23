import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';

import { api } from '../../services/api';
import fondoGrecia from '../../assets/grecia-login.jpg';
import logoMunicipalidad from '../../assets/logo-municipalidad-grecia.webp';

interface Encargado {
  id_encargado: number;
  entidad_encargada: string;
  cedula_juridica: string | null;
  representante_legal: string;
  correo_encargado: string;
  telefono_encargado: string;
}

export default function Encargados() {
  const navigate = useNavigate();

  // ============================================
  // DATOS
  // ============================================
  const [encargados, setEncargados] = useState<Encargado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // ============================================
  // FILTROS DE BÚSQUEDA
  // ============================================
  const [filtroEntidad, setFiltroEntidad] = useState('');
  const [filtroCedula, setFiltroCedula] = useState('');
  const [filtroRepresentante, setFiltroRepresentante] = useState('');
  const [filtroCorreo, setFiltroCorreo] = useState('');
  const [filtroTelefono, setFiltroTelefono] = useState('');

  const normalizarTexto = (valor: string | null | undefined) =>
    (valor ?? '').toLowerCase().trim();

  const normalizarNumeros = (valor: string | null | undefined) =>
    (valor ?? '').replace(/\D/g, '');

  const encargadosFiltrados = encargados.filter((encargado) => {
    const coincideEntidad = normalizarTexto(encargado.entidad_encargada).includes(
      normalizarTexto(filtroEntidad),
    );
    const coincideCedula = normalizarNumeros(encargado.cedula_juridica).includes(
      normalizarNumeros(filtroCedula),
    );
    const coincideRepresentante = normalizarTexto(encargado.representante_legal).includes(
      normalizarTexto(filtroRepresentante),
    );
    const coincideCorreo = normalizarTexto(encargado.correo_encargado).includes(
      normalizarTexto(filtroCorreo),
    );
    const coincideTelefono = normalizarNumeros(encargado.telefono_encargado).includes(
      normalizarNumeros(filtroTelefono),
    );

    return (
      coincideEntidad &&
      coincideCedula &&
      coincideRepresentante &&
      coincideCorreo &&
      coincideTelefono
    );
  });

  // ============================================
  // PAGINACIÓN
  // ============================================
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);

  const totalPaginas = Math.max(1, Math.ceil(encargadosFiltrados.length / registrosPorPagina));
  const indiceInicial = (paginaActual - 1) * registrosPorPagina;
  const indiceFinal = indiceInicial + registrosPorPagina;
  const encargadosPaginados = encargadosFiltrados.slice(indiceInicial, indiceFinal);

  useEffect(() => {
    setPaginaActual(1);
  }, [
    filtroEntidad,
    filtroCedula,
    filtroRepresentante,
    filtroCorreo,
    filtroTelefono,
    registrosPorPagina,
  ]);

  useEffect(() => {
    if (paginaActual > totalPaginas) {
      setPaginaActual(totalPaginas);
    }
  }, [paginaActual, totalPaginas]);

  const hayFiltrosActivos = Boolean(
    filtroEntidad ||
    filtroCedula ||
    filtroRepresentante ||
    filtroCorreo ||
    filtroTelefono,
  );

  const limpiarFiltros = () => {
    setFiltroEntidad('');
    setFiltroCedula('');
    setFiltroRepresentante('');
    setFiltroCorreo('');
    setFiltroTelefono('');
  };

  // ============================================
  // MODALES (ESTADOS)
  // ============================================
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEncargadoEditando, setIdEncargadoEditando] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState('');

  const [modalInformacionAbierto, setModalInformacionAbierto] = useState(false);
  const [encargadoVer, setEncargadoVer] = useState<Encargado | null>(null);

  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [encargadoEliminar, setEncargadoEliminar] = useState<Encargado | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState('');

  // Lógica para bloquear el desplazamiento del fondo cuando un modal está abierto
  const unModalEstaAbierto = Boolean(modalAbierto || modalEliminarAbierto || modalInformacionAbierto);

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

  // ============================================
  // FORMULARIO
  // ============================================
  const [entidadEncargada, setEntidadEncargada] = useState('');
  const [cedulaJuridica, setCedulaJuridica] = useState('');
  const [representanteLegal, setRepresentanteLegal] = useState('');
  const [correoEncargado, setCorreoEncargado] = useState('');
  const [telefonoEncargado, setTelefonoEncargado] = useState('');

  // ============================================
  // FORMATEAR CÉDULA JURÍDICA
  // ============================================
  const formatearCedulaJuridica = (valor: string) => {
    const numeros = valor.replace(/\D/g, '').slice(0, 10);
    if (numeros.length <= 1) return numeros;
    if (numeros.length <= 4) return `${numeros.slice(0, 1)}-${numeros.slice(1)}`;
    return `${numeros.slice(0, 1)}-${numeros.slice(1, 4)}-${numeros.slice(4, 10)}`;
  };

  // ============================================
  // FORMATEAR TELÉFONO
  // ============================================
  const formatearTelefono = (valor: string) => {
    const numeros = valor.replace(/\D/g, '').slice(0, 8);
    if (numeros.length <= 4) return numeros;
    return `${numeros.slice(0, 4)}-${numeros.slice(4)}`;
  };

  // ============================================
  // CARGAR ENCARGADOS
  // ============================================
  const cargarEncargados = async () => {
    try {
      setCargando(true);
      setError('');
      const token = localStorage.getItem('token');

      if (!token) {
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
      setError('No se pudieron cargar los encargados.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEncargados();
  }, []);

  // ============================================
  // LIMPIAR FORMULARIO
  // ============================================
  const limpiarFormulario = () => {
    setEntidadEncargada('');
    setCedulaJuridica('');
    setRepresentanteLegal('');
    setCorreoEncargado('');
    setTelefonoEncargado('');
    setErrorFormulario('');
  };

  // ============================================
  // ABRIR NUEVO ENCARGADO
  // ============================================
  const abrirModalCrear = () => {
    limpiarFormulario();
    setModoEdicion(false);
    setIdEncargadoEditando(null);
    setModalAbierto(true);
  };

  // ============================================
  // ABRIR EDITAR
  // ============================================
  const abrirModalEditar = (encargado: Encargado) => {
    setEntidadEncargada(encargado.entidad_encargada ?? '');
    setCedulaJuridica(encargado.cedula_juridica ?? '');
    setRepresentanteLegal(encargado.representante_legal ?? '');
    setCorreoEncargado(encargado.correo_encargado ?? '');
    setTelefonoEncargado(encargado.telefono_encargado ?? '');

    setModoEdicion(true);
    setIdEncargadoEditando(encargado.id_encargado);
    setErrorFormulario('');
    setModalAbierto(true);
  };

  // ============================================
  // CERRAR MODAL
  // ============================================
  const cerrarModal = () => {
    if (guardando) return;
    setModalAbierto(false);
    setModoEdicion(false);
    setIdEncargadoEditando(null);
    limpiarFormulario();
  };

  // ============================================
  // GUARDAR ENCARGADO
  // ============================================
  const guardarEncargado = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorFormulario('');

    if (!entidadEncargada.trim()) {
      setErrorFormulario('Debe ingresar la entidad encargada.');
      return;
    }
    if (!representanteLegal.trim()) {
      setErrorFormulario('Debe ingresar el representante legal.');
      return;
    }
    if (!correoEncargado.trim()) {
      setErrorFormulario('Debe ingresar el correo electrónico.');
      return;
    }
    if (!telefonoEncargado.trim()) {
      setErrorFormulario('Debe ingresar el número de teléfono.');
      return;
    }

    const entidadNormalizada = normalizarTexto(entidadEncargada);
    const representanteNormalizado = normalizarTexto(representanteLegal);
    const cedulaNormalizada = normalizarNumeros(cedulaJuridica);

    const encargadoDuplicado = encargados.find(
      (encargado) =>
        encargado.id_encargado !== idEncargadoEditando &&
        (normalizarTexto(encargado.entidad_encargada) === entidadNormalizada ||
          normalizarTexto(encargado.representante_legal) === representanteNormalizado ||
          (cedulaNormalizada !== '' &&
            normalizarNumeros(encargado.cedula_juridica) === cedulaNormalizada)),
    );

    if (encargadoDuplicado) {
      if (normalizarTexto(encargadoDuplicado.entidad_encargada) === entidadNormalizada) {
        setErrorFormulario('Ya existe un encargado con la misma entidad encargada.');
        return;
      }
      if (normalizarTexto(encargadoDuplicado.representante_legal) === representanteNormalizado) {
        setErrorFormulario('Ya existe un encargado con el mismo representante legal.');
        return;
      }
      if (
        cedulaNormalizada !== '' &&
        normalizarNumeros(encargadoDuplicado.cedula_juridica) === cedulaNormalizada
      ) {
        setErrorFormulario('Ya existe un encargado con la misma cédula jurídica.');
        return;
      }
    }

    try {
      setGuardando(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const datosEncargado = {
        entidad_encargada: entidadEncargada.trim(),
        cedula_juridica: cedulaJuridica.trim() || null,
        representante_legal: representanteLegal.trim(),
        correo_encargado: correoEncargado.trim().toLowerCase(),
        telefono_encargado: telefonoEncargado.trim(),
      };

      if (modoEdicion && idEncargadoEditando !== null) {
        await api.patch(`/encargados/${idEncargadoEditando}`, datosEncargado, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await api.post('/encargados', datosEncargado, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setModalAbierto(false);
      setModoEdicion(false);
      setIdEncargadoEditando(null);
      limpiarFormulario();
      await cargarEncargados();
    } catch (error: any) {
      console.error('Error guardando encargado:', error);
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
          modoEdicion ? 'No se pudo actualizar el encargado.' : 'No se pudo registrar el encargado.',
        );
      }
    } finally {
      setGuardando(false);
    }
  };

  // ============================================
  // VER INFORMACIÓN
  // ============================================
  const abrirModalInformacion = (encargado: Encargado) => {
    setEncargadoVer(encargado);
    setModalInformacionAbierto(true);
  };

  const cerrarModalInformacion = () => {
    setModalInformacionAbierto(false);
    setEncargadoVer(null);
  };

  // ============================================
  // ABRIR ELIMINAR
  // ============================================
  const abrirModalEliminar = (encargado: Encargado) => {
    setEncargadoEliminar(encargado);
    setErrorEliminar('');
    setModalEliminarAbierto(true);
  };

  // ============================================
  // CERRAR ELIMINAR
  // ============================================
  const cerrarModalEliminar = () => {
    if (eliminando) return;
    setModalEliminarAbierto(false);
    setEncargadoEliminar(null);
    setErrorEliminar('');
  };

  // ============================================
  // CONFIRMAR ELIMINAR
  // ============================================
  const confirmarEliminar = async () => {
    if (!encargadoEliminar) return;

    try {
      setEliminando(true);
      setErrorEliminar('');
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/login');
        return;
      }

      await api.delete(`/encargados/${encargadoEliminar.id_encargado}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setModalEliminarAbierto(false);
      setEncargadoEliminar(null);
      await cargarEncargados();
    } catch (error: any) {
      console.error('Error eliminando encargado:', error);
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
        setErrorEliminar('No se pudo eliminar el encargado.');
      }
    } finally {
      setEliminando(false);
    }
  };

  // ============================================
  // CERRAR MODALES CON ESC
  // ============================================
  useEffect(() => {
    const manejarEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (modalInformacionAbierto) return cerrarModalInformacion();
      if (modalEliminarAbierto) return cerrarModalEliminar();
      if (modalAbierto) return cerrarModal();
    };

    document.addEventListener('keydown', manejarEscape);
    return () => document.removeEventListener('keydown', manejarEscape);
  }, [modalInformacionAbierto, modalEliminarAbierto, modalAbierto, guardando, eliminando]);

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

      {/* 4. CABECERA FLOTANTE OSCURA CON BOTÓN VOLVER */}
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
                Gestión de Encargados
              </h1>
              <p className="text-[11px] text-slate-300">
                Administración de las entidades encargadas registradas.
              </p>
            </div>
          </div>

          {/* Lado derecho */}
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
              Encargados registrados
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Consulte y administre las entidades responsables de los parques.
            </p>
          </div>
          <button
            type="button"
            onClick={abrirModalCrear}
            className="rounded-lg bg-[#18843B] px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-emerald-600 transition-colors"
          >
            + Nuevo encargado
          </button>
        </div>

        {/* ====================================== */}
        {/* FILTROS DE BÚSQUEDA */}
        {/* ====================================== */}
        <div className="mb-8 rounded-2xl border border-white/10 bg-[#0c2330]/85 p-6 shadow-xl backdrop-blur-md">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-bold text-white">Filtros de búsqueda</h3>
              <p className="mt-1 text-sm text-slate-300">
                Utilice uno o varios criterios para localizar encargados específicos.
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
              <label className="mb-2 block text-sm font-medium text-slate-300">Entidad encargada</label>
              <input
                type="text"
                value={filtroEntidad}
                onChange={(event) => setFiltroEntidad(event.target.value)}
                placeholder="Buscar por entidad"
                className="w-full rounded-lg border border-white/20 bg-[#071923]/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Cédula jurídica</label>
              <input
                type="text"
                value={filtroCedula}
                onChange={(event) => setFiltroCedula(event.target.value)}
                placeholder="Ej: 3-002-123456"
                className="w-full rounded-lg border border-white/20 bg-[#071923]/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Representante legal</label>
              <input
                type="text"
                value={filtroRepresentante}
                onChange={(event) => setFiltroRepresentante(event.target.value)}
                placeholder="Buscar por representante"
                className="w-full rounded-lg border border-white/20 bg-[#071923]/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Correo electrónico</label>
              <input
                type="text"
                value={filtroCorreo}
                onChange={(event) => setFiltroCorreo(event.target.value)}
                placeholder="Buscar por correo"
                className="w-full rounded-lg border border-white/20 bg-[#071923]/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Teléfono</label>
              <input
                type="text"
                value={filtroTelefono}
                onChange={(event) => setFiltroTelefono(event.target.value)}
                placeholder="Ej: 8888-8888"
                className="w-full rounded-lg border border-white/20 bg-[#071923]/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-5 border-t border-white/10 pt-4">
            <p className="text-sm text-slate-400">
              Mostrando <span className="font-bold text-white">{encargadosFiltrados.length}</span>
              {' '}de <span className="font-bold text-white">{encargados.length}</span> encargados.
            </p>
          </div>
        </div>

        {/* CARGANDO */}
        {cargando && (
          <div className="rounded-2xl border border-white/10 bg-[#0d222e]/85 p-8 text-center text-slate-300 backdrop-blur-md">
            Cargando encargados...
          </div>
        )}

        {/* ERROR */}
        {!cargando && error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-900/40 p-6 backdrop-blur-md">
            <p className="font-semibold text-red-300">{error}</p>
            <button
              type="button"
              onClick={cargarEncargados}
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
              <table className="w-full min-w-[1000px]">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">Entidad encargada</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">Cédula jurídica</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">Representante legal</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">Correo</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">Teléfono</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {encargadosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        {hayFiltrosActivos
                          ? 'No se encontraron encargados que coincidan con los filtros seleccionados.'
                          : 'No hay encargados registrados.'}
                      </td>
                    </tr>
                  ) : (
                    encargadosPaginados.map((encargado) => (
                      <tr
                        key={encargado.id_encargado}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-white">
                          {encargado.entidad_encargada}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300">
                          {encargado.cedula_juridica || '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300">
                          {encargado.representante_legal}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300">
                          {encargado.correo_encargado}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300">
                          {encargado.telefono_encargado}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => abrirModalEditar(encargado)}
                              className="rounded-md bg-sky-500/20 border border-sky-500/30 px-3 py-1.5 text-xs font-bold text-sky-300 hover:bg-sky-500/30 transition-colors"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => abrirModalInformacion(encargado)}
                              className="rounded-md bg-indigo-500/20 border border-indigo-500/30 px-3 py-1.5 text-xs font-bold text-indigo-300 hover:bg-indigo-500/30 transition-colors"
                            >
                              Info
                            </button>
                            <button
                              type="button"
                              onClick={() => abrirModalEliminar(encargado)}
                              className="rounded-md bg-red-500/20 border border-red-500/30 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/30 transition-colors"
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
            {encargadosFiltrados.length > 0 && (
              <div className="flex flex-col gap-4 bg-[#0B212D]/90 border-t border-white/10 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <p className="text-sm text-slate-400">
                    Mostrando <span className="font-bold text-white">{indiceInicial + 1}</span> a{' '}
                    <span className="font-bold text-white">{Math.min(indiceFinal, encargadosFiltrados.length)}</span> de{' '}
                    <span className="font-bold text-white">{encargadosFiltrados.length}</span> encargados
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
                    onClick={() => setPaginaActual((pagina) => Math.max(1, pagina - 1))}
                    disabled={paginaActual === 1}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-semibold text-slate-300 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Anterior
                  </button>

                  {Array.from({ length: totalPaginas }, (_, indice) => indice + 1).map((pagina) => (
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
                    onClick={() => setPaginaActual((pagina) => Math.min(totalPaginas, pagina + 1))}
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
      {/* MODAL CREAR / EDITAR - GRANDE Y SIN DOBLE SCROLL */}
      {/* ====================================== */}
      {modalAbierto && (
        <div onClick={cerrarModal} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-4xl flex flex-col rounded-2xl border border-white/10 bg-[#0B212D] shadow-2xl overflow-hidden">
            
            <div className="flex items-center justify-between border-b border-white/10 px-10 py-7 flex-shrink-0">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tighter">
                  {modoEdicion ? 'Editar encargado' : 'Nuevo encargado'}
                </h2>
                <p className="mt-2 text-base text-slate-400">
                  {modoEdicion ? 'Modifique los datos de la entidad encargada y su representante legal.' : 'Ingrese los datos de la entidad encargada y su representante legal.'}
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

            <form onSubmit={guardarEncargado} className="p-10 flex-1 overflow-y-auto">
              {errorFormulario && (
                <div className="mb-10 rounded-xl border border-red-500/30 bg-red-900/40 p-6 text-base font-semibold text-red-300">
                  {errorFormulario}
                </div>
              )}

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-3 block text-base font-bold text-slate-300">Entidad encargada</label>
                  <input
                    type="text"
                    value={entidadEncargada}
                    onChange={(e) => setEntidadEncargada(e.target.value)}
                    required
                    maxLength={150}
                    placeholder="Ej: Asociación de Desarrollo de Grecia"
                    className="w-full rounded-xl border border-white/20 bg-[#071923] p-4 text-base text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <p className="mt-2 text-xs text-slate-400">Máximo 150 caracteres.</p>
                </div>

                <div>
                  <label className="mb-3 block text-base font-bold text-slate-300">Cédula jurídica</label>
                  <input
                    type="text"
                    value={cedulaJuridica}
                    onChange={(e) => setCedulaJuridica(formatearCedulaJuridica(e.target.value))}
                    placeholder="Ej: 3-002-123456"
                    maxLength={12}
                    inputMode="numeric"
                    className="w-full rounded-xl border border-white/20 bg-[#071923] p-4 text-base text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <p className="mt-2 text-xs text-slate-400">Solo números. Máximo 10 dígitos; los guiones se colocan automáticamente.</p>
                </div>

                <div>
                  <label className="mb-3 block text-base font-bold text-slate-300">Representante legal</label>
                  <input
                    type="text"
                    value={representanteLegal}
                    onChange={(e) => setRepresentanteLegal(e.target.value)}
                    required
                    maxLength={150}
                    placeholder="Ej: Juan Pérez Rodríguez"
                    className="w-full rounded-xl border border-white/20 bg-[#071923] p-4 text-base text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <p className="mt-2 text-xs text-slate-400">Máximo 150 caracteres.</p>
                </div>

                <div>
                  <label className="mb-3 block text-base font-bold text-slate-300">Correo electrónico</label>
                  <input
                    type="email"
                    value={correoEncargado}
                    onChange={(e) => setCorreoEncargado(e.target.value)}
                    required
                    maxLength={150}
                    placeholder="Ej: encargado@correo.com"
                    className="w-full rounded-xl border border-white/20 bg-[#071923] p-4 text-base text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <p className="mt-2 text-xs text-slate-400">Máximo 150 caracteres.</p>
                </div>

                <div>
                  <label className="mb-3 block text-base font-bold text-slate-300">Teléfono</label>
                  <input
                    type="text"
                    value={telefonoEncargado}
                    onChange={(e) => setTelefonoEncargado(formatearTelefono(e.target.value))}
                    required
                    placeholder="Ej: 8888-8888"
                    maxLength={9}
                    inputMode="numeric"
                    className="w-full rounded-xl border border-white/20 bg-[#071923] p-4 text-base text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <p className="mt-2 text-xs text-slate-400">Solo números. Máximo 8 dígitos; el guion se coloca automáticamente.</p>
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
                  {guardando ? 'Guardando...' : modoEdicion ? 'Guardar cambios' : 'Guardar encargado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================== */}
      {/* MODAL VER INFORMACIÓN - GRANDE Y SIN DOBLE SCROLL */}
      {/* ====================================== */}
      {modalInformacionAbierto && encargadoVer && (
        <div onClick={cerrarModalInformacion} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-3xl flex flex-col rounded-2xl border border-white/10 bg-[#0B212D] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-10 py-7 flex-shrink-0">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tighter">Información del encargado</h2>
                <p className="mt-2 text-base text-slate-400">Información completa de la entidad encargada y su representante legal.</p>
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
              <div className="mb-8 rounded-2xl border border-sky-500/30 bg-sky-900/30 p-8 flex flex-col items-center justify-center">
                <p className="text-sm font-bold uppercase tracking-wide text-sky-400">Entidad encargada</p>
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

      {/* ====================================== */}
      {/* MODAL ELIMINAR - GRANDE Y SIN DOBLE SCROLL */}
      {/* ====================================== */}
      {modalEliminarAbierto && encargadoEliminar && (
        <div onClick={cerrarModalEliminar} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-2xl flex flex-col rounded-2xl border border-white/10 bg-[#0B212D] shadow-2xl overflow-hidden">
            <div className="border-b border-white/10 px-10 py-7 flex-shrink-0">
              <h2 className="text-3xl font-black text-white tracking-tighter">Eliminar encargado</h2>
              <p className="mt-2 text-base text-slate-400">Esta acción eliminará el registro seleccionado de forma permanente.</p>
            </div>
            
            <div className="p-10 flex-1 overflow-y-auto">
              <div className="rounded-2xl border border-red-500/30 bg-red-900/30 p-8 flex flex-col items-center justify-center text-center">
                <p className="text-base text-red-300">¿Está seguro de que desea eliminar este encargado?</p>
                <p className="mt-6 text-3xl font-black text-white tracking-tight">{encargadoEliminar.entidad_encargada}</p>
                <p className="mt-3 text-lg text-slate-400">Representante legal: {encargadoEliminar.representante_legal}</p>
              </div>

              {errorEliminar && (
                <div className="mt-8 rounded-xl border border-red-500/30 bg-red-900/50 p-6 text-base font-semibold text-red-300">
                  <p className="font-black text-lg text-red-300">No se puede eliminar el encargado</p>
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
                  onClick={confirmarEliminar}
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
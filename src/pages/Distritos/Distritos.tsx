import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';

import { api } from '../../services/api';
import fondoGrecia from '../../assets/grecia-login.jpg';
import logoMunicipalidad from '../../assets/logo-municipalidad-grecia.webp';

interface Distrito {
  id_distrito: number;
  nombre_distrito: string;
  numero_distrito: number;
}

export default function Distritos() {
  const navigate = useNavigate();

  // ============================
  // DATOS
  // ============================
  const [distritos, setDistritos] = useState<Distrito[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // ============================
  // FILTROS DE BÚSQUEDA
  // ============================
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroNumero, setFiltroNumero] = useState('');

  const normalizarTexto = (valor: string | null | undefined) =>
    (valor ?? '').toLowerCase().trim();

  const distritosFiltrados = distritos.filter((distrito) => {
    const coincideNombre = normalizarTexto(distrito.nombre_distrito).includes(
      normalizarTexto(filtroNombre),
    );
    const coincideNumero =
      !filtroNumero ||
      String(distrito.numero_distrito).includes(filtroNumero.trim());

    return coincideNombre && coincideNumero;
  });

  const hayFiltrosActivos = Boolean(filtroNombre || filtroNumero);

  const limpiarFiltros = () => {
    setFiltroNombre('');
    setFiltroNumero('');
  };

  // ============================================
  // PAGINACIÓN
  // ============================================
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);

  const totalPaginas = Math.max(1, Math.ceil(distritosFiltrados.length / registrosPorPagina));
  const indiceInicial = (paginaActual - 1) * registrosPorPagina;
  const indiceFinal = indiceInicial + registrosPorPagina;
  const distritosPaginados = distritosFiltrados.slice(indiceInicial, indiceFinal);

  useEffect(() => {
    setPaginaActual(1);
  }, [filtroNombre, filtroNumero, registrosPorPagina]);

  useEffect(() => {
    if (paginaActual > totalPaginas) {
      setPaginaActual(totalPaginas);
    }
  }, [paginaActual, totalPaginas]);

  // ============================
  // MODALES (ESTADOS)
  // ============================
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idDistritoEditando, setIdDistritoEditando] = useState<number | null>(null);

  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [distritoEliminar, setDistritoEliminar] = useState<Distrito | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState('');

  // Lógica para bloquear el desplazamiento del fondo cuando un modal está abierto
  const unModalEstaAbierto = Boolean(modalAbierto || modalEliminarAbierto);

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
  const [nombreDistrito, setNombreDistrito] = useState('');
  const [numeroDistrito, setNumeroDistrito] = useState('');

  // ============================
  // CARGAR DISTRITOS
  // ============================
  const cargarDistritos = async () => {
    try {
      setCargando(true);
      setError('');
      const response = await api.get('/distritos');
      setDistritos(response.data);
    } catch (error) {
      console.error('Error cargando distritos:', error);
      setError('No se pudieron cargar los distritos.');
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
  const limpiarFormulario = () => {
    setNombreDistrito('');
    setNumeroDistrito('');
    setErrorFormulario('');
  };

  // ============================
  // NUEVO DISTRITO
  // ============================
  const abrirModalCrear = () => {
    limpiarFormulario();
    setModoEdicion(false);
    setIdDistritoEditando(null);
    setModalAbierto(true);
  };

  // ============================
  // EDITAR DISTRITO
  // ============================
  const abrirModalEditar = (distrito: Distrito) => {
    setNombreDistrito(distrito.nombre_distrito ?? '');
    setNumeroDistrito(String(distrito.numero_distrito ?? ''));
    setModoEdicion(true);
    setIdDistritoEditando(distrito.id_distrito);
    setErrorFormulario('');
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    if (guardando) return;
    setModalAbierto(false);
    limpiarFormulario();
    setModoEdicion(false);
    setIdDistritoEditando(null);
  };

  // ============================
  // GUARDAR / EDITAR
  // ============================
  const guardarDistrito = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGuardando(true);
    setErrorFormulario('');

    try {
      const token = localStorage.getItem('token');
      const datosDistrito = {
        nombre_distrito: nombreDistrito.trim(),
        numero_distrito: Number(numeroDistrito),
      };

      if (modoEdicion && idDistritoEditando !== null) {
        await api.patch(`/distritos/${idDistritoEditando}`, datosDistrito, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await api.post('/distritos', datosDistrito, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setModalAbierto(false);
      limpiarFormulario();
      setModoEdicion(false);
      setIdDistritoEditando(null);
      await cargarDistritos();
    } catch (error: any) {
      console.error('Error guardando distrito:', error);
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
            ? 'No se pudo actualizar el distrito.'
            : 'No se pudo registrar el distrito.',
        );
      }
    } finally {
      setGuardando(false);
    }
  };

  // ============================
  // MODAL ELIMINAR
  // ============================
  const abrirModalEliminar = (distrito: Distrito) => {
    setDistritoEliminar(distrito);
    setErrorEliminar('');
    setModalEliminarAbierto(true);
  };

  const cerrarModalEliminar = () => {
    if (eliminando) return;
    setModalEliminarAbierto(false);
    setDistritoEliminar(null);
    setErrorEliminar('');
  };

  const confirmarEliminarDistrito = async () => {
    if (!distritoEliminar) return;

    try {
      setEliminando(true);
      setErrorEliminar('');
      const token = localStorage.getItem('token');

      await api.delete(`/distritos/${distritoEliminar.id_distrito}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setModalEliminarAbierto(false);
      setDistritoEliminar(null);
      await cargarDistritos();
    } catch (error: any) {
      console.error('Error eliminando distrito:', error);
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
        setErrorEliminar('No se pudo eliminar el distrito.');
      }
    } finally {
      setEliminando(false);
    }
  };

  // Cerrar modales con ESC
  useEffect(() => {
    const manejarEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (modalEliminarAbierto) return cerrarModalEliminar();
      if (modalAbierto) return cerrarModal();
    };
    document.addEventListener('keydown', manejarEscape);
    return () => document.removeEventListener('keydown', manejarEscape);
  }, [modalEliminarAbierto, modalAbierto, guardando, eliminando]);

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
                Gestión de Distritos
              </h1>
              <p className="text-[11px] text-slate-300">
                Administración de los distritos registrados en el sistema.
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
              Distritos registrados
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Consulte y administre los distritos registrados en el sistema.
            </p>
          </div>
          <button
            type="button"
            onClick={abrirModalCrear}
            className="rounded-lg bg-[#18843B] px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-emerald-600 transition-colors"
          >
            + Nuevo distrito
          </button>
        </div>

        {/* FILTROS DE BÚSQUEDA */}
        <div className="mb-8 rounded-2xl border border-white/10 bg-[#0c2330]/85 p-6 shadow-xl backdrop-blur-md">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-bold text-white">Filtros de búsqueda</h3>
              <p className="mt-1 text-sm text-slate-300">
                Utilice uno o ambos criterios para localizar distritos específicos.
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Nombre del distrito</label>
              <input
                type="text"
                value={filtroNombre}
                onChange={(event) => setFiltroNombre(event.target.value)}
                placeholder="Ej: Grecia"
                className="w-full rounded-lg border border-white/20 bg-[#071923]/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Número de distrito</label>
              <input
                type="number"
                min="1"
                value={filtroNumero}
                onChange={(event) => setFiltroNumero(event.target.value)}
                placeholder="Ej: 1"
                className="w-full rounded-lg border border-white/20 bg-[#071923]/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-5 border-t border-white/10 pt-4">
            <p className="text-sm text-slate-400">
              Mostrando <span className="font-bold text-white">{distritosFiltrados.length}</span>
              {' '}de <span className="font-bold text-white">{distritos.length}</span> distritos.
            </p>
          </div>
        </div>

        {/* CARGANDO */}
        {cargando && (
          <div className="rounded-2xl border border-white/10 bg-[#0d222e]/85 p-8 text-center text-slate-300 backdrop-blur-md">
            Cargando distritos...
          </div>
        )}

        {/* ERROR */}
        {!cargando && error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-900/40 p-6 backdrop-blur-md">
            <p className="font-semibold text-red-300">{error}</p>
            <button
              type="button"
              onClick={cargarDistritos}
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
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">
                      Nombre del distrito
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">
                      Número de distrito
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {distritosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                        {hayFiltrosActivos
                          ? 'No se encontraron distritos que coincidan con los filtros seleccionados.'
                          : 'No hay distritos registrados.'}
                      </td>
                    </tr>
                  ) : (
                    distritosPaginados.map((distrito) => (
                      <tr
                        key={distrito.id_distrito}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-white">
                          {distrito.nombre_distrito}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300">
                          {distrito.numero_distrito}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => abrirModalEditar(distrito)}
                              className="rounded-md bg-sky-500/20 border border-sky-500/30 px-3 py-1.5 text-xs font-bold text-sky-300 hover:bg-sky-500/30 transition-colors"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => abrirModalEliminar(distrito)}
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
            {distritosFiltrados.length > 0 && (
              <div className="flex flex-col gap-4 bg-[#0B212D]/90 border-t border-white/10 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <p className="text-sm text-slate-400">
                    Mostrando <span className="font-bold text-white">{indiceInicial + 1}</span> a{' '}
                    <span className="font-bold text-white">{Math.min(indiceFinal, distritosFiltrados.length)}</span> de{' '}
                    <span className="font-bold text-white">{distritosFiltrados.length}</span> distritos
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
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-4xl flex flex-col rounded-2xl border border-white/10 bg-[#0B212D] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-10 py-7 flex-shrink-0">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tighter">
                  {modoEdicion ? 'Editar distrito' : 'Nuevo distrito'}
                </h2>
                <p className="mt-2 text-base text-slate-400">
                  {modoEdicion ? 'Modifique la información del distrito.' : 'Complete la información para registrar el distrito.'}
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

            <form onSubmit={guardarDistrito} className="p-10 flex-1 overflow-y-auto">
              {errorFormulario && (
                <div className="mb-10 rounded-xl border border-red-500/30 bg-red-900/40 p-6 text-base font-semibold text-red-300">
                  {errorFormulario}
                </div>
              )}

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div>
                  <label className="mb-3 block text-base font-bold text-slate-300">Nombre del distrito</label>
                  <input
                    type="text"
                    value={nombreDistrito}
                    onChange={(e) => setNombreDistrito(e.target.value)}
                    required
                    placeholder="Ej: Grecia"
                    className="w-full rounded-xl border border-white/20 bg-[#071923] p-4 text-base text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-3 block text-base font-bold text-slate-300">Número de distrito</label>
                  <input
                    type="number"
                    min="1"
                    value={numeroDistrito}
                    onChange={(e) => setNumeroDistrito(e.target.value)}
                    required
                    placeholder="Ej: 1"
                    className="w-full rounded-xl border border-white/20 bg-[#071923] p-4 text-base text-white focus:border-emerald-500 focus:outline-none"
                  />
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
                  {guardando ? 'Guardando...' : modoEdicion ? 'Guardar cambios' : 'Guardar distrito'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================== */}
      {/* MODAL ELIMINAR - GRANDE Y SIN DOBLE SCROLL */}
      {/* ====================================== */}
      {modalEliminarAbierto && distritoEliminar && (
        <div onClick={cerrarModalEliminar} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-2xl flex flex-col rounded-2xl border border-white/10 bg-[#0B212D] shadow-2xl overflow-hidden">
            <div className="border-b border-white/10 px-10 py-7 flex-shrink-0">
              <h2 className="text-3xl font-black text-white tracking-tighter">Eliminar distrito</h2>
              <p className="mt-2 text-base text-slate-400">Esta acción eliminará el registro seleccionado de forma permanente.</p>
            </div>
            
            <div className="p-10 flex-1 overflow-y-auto">
              <div className="rounded-2xl border border-red-500/30 bg-red-900/30 p-8 flex flex-col items-center justify-center text-center">
                <p className="text-base text-red-300">¿Está seguro de que desea eliminar este distrito?</p>
                <p className="mt-6 text-3xl font-black text-white tracking-tight">{distritoEliminar.nombre_distrito}</p>
                <p className="mt-3 text-lg text-slate-400">Número de distrito: {distritoEliminar.numero_distrito}</p>
              </div>

              {errorEliminar && (
                <div className="mt-8 rounded-xl border border-red-500/30 bg-red-900/50 p-6 text-base font-semibold text-red-300">
                  <p className="font-black text-lg text-red-300">No se puede eliminar el distrito</p>
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
                  onClick={confirmarEliminarDistrito}
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
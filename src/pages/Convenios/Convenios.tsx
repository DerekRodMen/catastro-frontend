import {

  useEffect,

  useState,

  type FormEvent,

} from 'react';

import { useNavigate } from 'react-router-dom';

import {

  Edit3,

  Eye,

  Plus,

  Search,

  Trash2,

  FileText,

  Upload,

  Paperclip,

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

interface Convenio {

  id_convenio: number;

  numero_convenio: string | null;

  fecha_firma: string;

  plazo: number;

  fecha_renovacion_firmas: string;

  estado_convenio: string;

  documento_nombre_original: string | null;

  documento_ruta: string | null;

  documento_mime: string | null;

  documento_tamano: number | null;

  parque?: Parque;

}

// ============================

// FUNCIONES PARA FECHAS

// ============================

const obtenerFechaInput = (fecha: string | null | undefined) => {

  if (!fecha) {

    return '';

  }

  return fecha.substring(0, 10);

};

const mostrarFecha = (fecha: string | null | undefined) => {

  if (!fecha) {

    return '-';

  }

  const fechaLimpia = fecha.substring(0, 10);

  const partes = fechaLimpia.split('-');

  if (partes.length !== 3) {

    return fecha;

  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;

};

const calcularFechaRenovacion = (fechaFirma: string, plazoAnios: string) => {

  if (!fechaFirma || !plazoAnios || Number(plazoAnios) <= 0) {

    return '';

  }

  const partes = fechaFirma.split('-');

  if (partes.length !== 3) {

    return '';

  }

  const anio = Number(partes[0]);

  const mes = Number(partes[1]);

  const dia = Number(partes[2]);

  const nuevosAnios = anio + Number(plazoAnios);

  const ultimoDiaMes = new Date(nuevosAnios, mes, 0).getDate();

  const diaAjustado = Math.min(dia, ultimoDiaMes);

  const anioTexto = String(nuevosAnios);

  const mesTexto = String(mes).padStart(2, '0');

  const diaTexto = String(diaAjustado).padStart(2, '0');

  return `${anioTexto}-${mesTexto}-${diaTexto}`;

};

// ============================

// COMPONENTE

// ============================

export default function Convenios() {

  const navigate = useNavigate();

  // ============================

  // DATOS

  // ============================

  const [convenios, setConvenios] = useState<Convenio[]>([]);

  const [parques, setParques] = useState<Parque[]>([]);

  const [cargando, setCargando] = useState(true);

  const [error, setError] = useState('');

  // ============================

  // FILTROS DE BÚSQUEDA

  // ============================

  const [filtroNumeroConvenio, setFiltroNumeroConvenio] = useState('');

  const [filtroParque, setFiltroParque] = useState('');

  const [filtroEstado, setFiltroEstado] = useState('');

  const [filtroFechaFirma, setFiltroFechaFirma] = useState('');

  const [filtroFechaRenovacion, setFiltroFechaRenovacion] = useState('');

  // Normaliza texto para realizar búsquedas sin distinguir mayúsculas.

  const normalizarTexto = (valor: string | null | undefined) =>

    (valor ?? '').toLowerCase().trim();

  // Aplica los filtros seleccionados a la lista de convenios.

  const conveniosFiltrados = convenios.filter((convenio) => {

    const coincideNumero = normalizarTexto(convenio.numero_convenio).includes(

      normalizarTexto(filtroNumeroConvenio),

    );

    const coincideParque =

      !filtroParque || String(convenio.parque?.id_parque ?? '') === filtroParque;

    const coincideEstado =

      !filtroEstado || convenio.estado_convenio === filtroEstado;

    const coincideFechaFirma =

      !filtroFechaFirma ||

      obtenerFechaInput(convenio.fecha_firma) === filtroFechaFirma;

    const coincideFechaRenovacion =

      !filtroFechaRenovacion ||

      obtenerFechaInput(convenio.fecha_renovacion_firmas) === filtroFechaRenovacion;

    return (

      coincideNumero &&

      coincideParque &&

      coincideEstado &&

      coincideFechaFirma &&

      coincideFechaRenovacion

    );

  });

  // ============================================

  // PAGINACIÓN

  // ============================================

  const [paginaActual, setPaginaActual] = useState(1);

  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);

  const totalPaginas = Math.max(1, Math.ceil(conveniosFiltrados.length / registrosPorPagina));

  const indiceInicial = (paginaActual - 1) * registrosPorPagina;

  const indiceFinal = indiceInicial + registrosPorPagina;

  const conveniosPaginados = conveniosFiltrados.slice(indiceInicial, indiceFinal);

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

    filtroNumeroConvenio,

    filtroParque,

    filtroEstado,

    filtroFechaFirma,

    filtroFechaRenovacion,

    registrosPorPagina,

  ]);

  useEffect(() => {

    if (paginaActual > totalPaginas) {

      setPaginaActual(totalPaginas);

    }

  }, [paginaActual, totalPaginas]);

  const hayFiltrosActivos = Boolean(

    filtroNumeroConvenio ||

    filtroParque ||

    filtroEstado ||

    filtroFechaFirma ||

    filtroFechaRenovacion,

  );

  // Restablece todos los filtros de búsqueda.

  const limpiarFiltros = () => {

    setFiltroNumeroConvenio('');

    setFiltroParque('');

    setFiltroEstado('');

    setFiltroFechaFirma('');

    setFiltroFechaRenovacion('');

  };

  // Permite únicamente valores numéricos de hasta 100 años.

  const sanitizarPlazo = (valor: string) => {

    const soloNumeros = valor.replace(/\D/g, '').slice(0, 3);

    if (!soloNumeros) {

      return '';

    }

    const numero = Number(soloNumeros);

    return String(Math.min(numero, 100));

  };

  // ============================

  // MODALES (ESTADOS)

  // ============================

  const [modalAbierto, setModalAbierto] = useState(false);

  const [guardando, setGuardando] = useState(false);

  const [errorFormulario, setErrorFormulario] = useState('');

  const [modoEdicion, setModoEdicion] = useState(false);

  const [idConvenioEditando, setIdConvenioEditando] = useState<number | null>(null);

  const [modalInformacionAbierto, setModalInformacionAbierto] = useState(false);

  const [convenioVer, setConvenioVer] = useState<Convenio | null>(null);

  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);

  const [convenioEliminar, setConvenioEliminar] = useState<Convenio | null>(null);

  const [eliminando, setEliminando] = useState(false);

  const [errorEliminar, setErrorEliminar] = useState('');

  // Lógica para bloquear el desplazamiento del fondo cuando un modal está abierto

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

  const [numeroConvenio, setNumeroConvenio] = useState('');

  const [idParque, setIdParque] = useState('');

  const [fechaFirma, setFechaFirma] = useState('');

  const [plazo, setPlazo] = useState('');

  const [fechaRenovacion, setFechaRenovacion] = useState('');

  const [estadoConvenio, setEstadoConvenio] = useState('Vigente');

  const [documentoConvenio, setDocumentoConvenio] =

    useState<File | null>(null);

  const [documentoActual, setDocumentoActual] =

    useState<string | null>(null);

  const [procesandoDocumento, setProcesandoDocumento] =

    useState(false);

  // ============================

  // CALCULAR RENOVACIÓN AUTOMÁTICA

  // ============================

  useEffect(() => {

    const fechaCalculada = calcularFechaRenovacion(fechaFirma, plazo);

    setFechaRenovacion(fechaCalculada);

  }, [fechaFirma, plazo]);

  // ============================

  // CARGAR DATOS (API)

  // ============================

  // Carga los convenios registrados desde la API.

  const cargarConvenios = async () => {

    try {

      setCargando(true);

      setError('');

      const response = await api.get('/convenios');

      setConvenios(response.data);

    } catch (error) {

      console.error('Error cargando convenios:', error);

      setError('No se pudieron cargar los convenios.');

    } finally {

      setCargando(false);

    }

  };

  // Carga los parques disponibles para asociarlos a un convenio.

  const cargarParques = async () => {

    try {

      const response = await api.get('/parques');

      setParques(response.data);

    } catch (error) {

      console.error('Error cargando parques:', error);

    }

  };

  useEffect(() => {

    cargarConvenios();

    cargarParques();

  }, []);

  // ============================

  // MANEJO DE MODALES

  // ============================

  // Restablece los campos del formulario.

  const limpiarFormulario = () => {

    setNumeroConvenio('');

    setIdParque('');

    setFechaFirma('');

    setPlazo('');

    setFechaRenovacion('');

    setEstadoConvenio('Vigente');

    setDocumentoConvenio(null);

    setDocumentoActual(null);

    setErrorFormulario('');

  };

  // Abre el formulario para registrar un nuevo convenio.

  const abrirModalCrear = () => {

    limpiarFormulario();

    setModoEdicion(false);

    setIdConvenioEditando(null);

    setModalAbierto(true);

  };

  // Carga los datos del convenio seleccionado para editarlo.

  const abrirModalEditar = (convenio: Convenio) => {

    setNumeroConvenio(convenio.numero_convenio ?? '');

    setIdParque(convenio.parque ? String(convenio.parque.id_parque) : '');

    setFechaFirma(obtenerFechaInput(convenio.fecha_firma));

    setPlazo(String(convenio.plazo ?? ''));

    setFechaRenovacion(obtenerFechaInput(convenio.fecha_renovacion_firmas));

    setEstadoConvenio(convenio.estado_convenio || 'Vigente');

    setDocumentoConvenio(null);

    setDocumentoActual(

      convenio.documento_nombre_original ?? null,

    );

    setModoEdicion(true);

    setIdConvenioEditando(convenio.id_convenio);

    setErrorFormulario('');

    setModalAbierto(true);

  };

  const cerrarModal = () => {

    if (guardando) return;

    setModalAbierto(false);

    limpiarFormulario();

    setModoEdicion(false);

    setIdConvenioEditando(null);

  };

  // Valida el tipo y tamaño del documento adjunto.

  const validarDocumento = (

    archivo: File,

  ) => {

    const maximo =

      15 * 1024 * 1024;

    const permitidos = [

      'application/pdf',

      'application/msword',

      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',

    ];

    if (

      !permitidos.includes(

        archivo.type,

      )

    ) {

      setErrorFormulario(

        'El documento debe ser PDF, DOC o DOCX.',

      );

      return false;

    }

    if (

      archivo.size >

      maximo

    ) {

      setErrorFormulario(

        'El documento no puede superar 15 MB.',

      );

      return false;

    }

    return true;

  };

  // Envía el documento del convenio al backend.

  const subirDocumento = async (

    idConvenio: number,

    archivo: File,

    token: string | null,

  ) => {

    const formulario =

      new FormData();

    formulario.append(

      'documento',

      archivo,

    );

    await api.post(

      `/convenios/${idConvenio}/documento`,

      formulario,

      {

        headers: {

          Authorization:

            `Bearer ${token}`,

        },

      },

    );

  };

  // Obtiene el documento almacenado como Blob.

  const obtenerDocumentoBlob = async (
    convenio: Convenio,
  ) => {
    const token =
      localStorage.getItem(
        'token',
      );

    const response =
      await api.get(
        `/convenios/${convenio.id_convenio}/documento`,
        {
          responseType:
            'blob',

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        },
      );

    return response.data as Blob;
  };

  // Descarga un archivo conservando su nombre original.

  const descargarBlobConNombre = (
    blob: Blob,
    nombre: string,
  ) => {
    const url =
      URL.createObjectURL(
        blob,
      );

    const enlace =
      document.createElement(
        'a',
      );

    enlace.href =
      url;

    enlace.download =
      nombre;

    document.body.appendChild(
      enlace,
    );

    enlace.click();

    document.body.removeChild(
      enlace,
    );

    window.setTimeout(
      () => {
        URL.revokeObjectURL(
          url,
        );
      },
      1000,
    );
  };

  // Abre los PDF en el visor y descarga otros formatos.

  const abrirDocumento = async (
    convenio: Convenio,
  ) => {
    try {
      setProcesandoDocumento(
        true,
      );

      const nombre =
        convenio.documento_nombre_original ||
        `convenio_${convenio.id_convenio}`;

      const mime =
        convenio.documento_mime ||
        '';

      const esPdf =
        mime === 'application/pdf' ||
        nombre
          .toLowerCase()
          .endsWith(
            '.pdf',
          );

      if (esPdf) {
        const parametros =
          new URLSearchParams({
            nombre,
          });

        const urlVisor =
          `/documentos/convenios/${convenio.id_convenio}?${parametros.toString()}`;

        const ventana =
          window.open(
            urlVisor,
            '_blank',
          );

        if (!ventana) {
          throw new Error(
            'El navegador bloqueó la ventana del documento.',
          );
        }

        ventana.opener =
          null;

        return;
      }

      const blob =
        await obtenerDocumentoBlob(
          convenio,
        );

      descargarBlobConNombre(
        blob,
        nombre,
      );
    } catch (error: any) {
      console.error(
        'Error abriendo documento:',
        error,
      );

      setError(
        error.response?.data?.message ||
        error.message ||
        'No se pudo abrir el documento del convenio.',
      );
    } finally {
      setProcesandoDocumento(
        false,
      );
    }
  };

  // Crea o actualiza el convenio y adjunta el documento si corresponde.

  const guardarConvenio = async (event: FormEvent<HTMLFormElement>) => {

    event.preventDefault();

    setGuardando(true);

    setErrorFormulario('');

    try {

      const token = localStorage.getItem('token');

      // Validaciones

      if (!numeroConvenio.trim()) {

        setErrorFormulario('Debe ingresar el número de convenio.');

        setGuardando(false);

        return;

      }

      if (!idParque) {

        setErrorFormulario('Debe seleccionar un parque.');

        setGuardando(false);

        return;

      }

      if (!fechaFirma) {

        setErrorFormulario('Debe indicar la fecha de firma.');

        setGuardando(false);

        return;

      }

      if (!plazo || Number(plazo) <= 0) {

        setErrorFormulario('El plazo debe ser mayor que 0.');

        setGuardando(false);

        return;

      }

      if (Number(plazo) > 100) {

        setErrorFormulario('El plazo no puede ser mayor a 100 años.');

        setGuardando(false);

        return;

      }

      if (!fechaRenovacion) {

        setErrorFormulario('Debe indicar la fecha de renovación.');

        setGuardando(false);

        return;

      }

      if (!estadoConvenio) {

        setErrorFormulario('Debe seleccionar el estado del convenio.');

        setGuardando(false);

        return;

      }

      if (fechaRenovacion < fechaFirma) {

        setErrorFormulario('La fecha de renovación no puede ser anterior a la fecha de firma.');

        setGuardando(false);

        return;

      }

      const datosConvenio = {

        numero_convenio: numeroConvenio.trim(),

        id_parque: Number(idParque),

        fecha_firma: fechaFirma,

        plazo: Number(plazo),

        fecha_renovacion_firmas: fechaRenovacion,

        estado_convenio: estadoConvenio,

      };

      let convenioGuardado:

        Convenio;

      if (modoEdicion && idConvenioEditando !== null) {

        const response =

          await api.patch(

            `/convenios/${idConvenioEditando}`,

            datosConvenio,

            {

              headers: {

                Authorization:

                  `Bearer ${token}`,

              },

            },

          );

        convenioGuardado =

          response.data;

      } else {

        const response =

          await api.post(

            '/convenios',

            datosConvenio,

            {

              headers: {

                Authorization:

                  `Bearer ${token}`,

              },

            },

          );

        convenioGuardado =

          response.data;

      }

      if (

        documentoConvenio

      ) {

        await subirDocumento(

          convenioGuardado.id_convenio,

          documentoConvenio,

          token,

        );

      }

      setModalAbierto(false);

      limpiarFormulario();

      setModoEdicion(false);

      setIdConvenioEditando(null);

      await cargarConvenios();

    } catch (error: any) {

      console.error('Error guardando convenio:', error);

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

          modoEdicion ? 'No se pudo actualizar el convenio.' : 'No se pudo registrar el convenio.',

        );

      }

    } finally {

      setGuardando(false);

    }

  };

  // Abre el modal con la información completa del convenio.

  const abrirModalInformacion = (convenio: Convenio) => {

    setConvenioVer(convenio);

    setModalInformacionAbierto(true);

  };

  const cerrarModalInformacion = () => {

    setModalInformacionAbierto(false);

    setConvenioVer(null);

  };

  // Abre la confirmación para eliminar un convenio.

  const abrirModalEliminar = (convenio: Convenio) => {

    setConvenioEliminar(convenio);

    setErrorEliminar('');

    setModalEliminarAbierto(true);

  };

  const cerrarModalEliminar = () => {

    if (eliminando) return;

    setModalEliminarAbierto(false);

    setConvenioEliminar(null);

    setErrorEliminar('');

  };

  // Elimina el convenio seleccionado.

  const confirmarEliminarConvenio = async () => {

    if (!convenioEliminar) return;

    try {

      setEliminando(true);

      setErrorEliminar('');

      const token = localStorage.getItem('token');

      await api.delete(`/convenios/${convenioEliminar.id_convenio}`, {

        headers: { Authorization: `Bearer ${token}` },

      });

      setModalEliminarAbierto(false);

      setConvenioEliminar(null);

      await cargarConvenios();

    } catch (error: any) {

      console.error('Error eliminando convenio:', error);

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

        setErrorEliminar('No se pudo eliminar el convenio.');

      }

    } finally {

      setEliminando(false);

    }

  };

  // ============================

  // CERRAR MODALES CON ESC

  // ============================

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

  // ============================

  // COLOR DEL ESTADO

  // ============================

  // Define el estilo visual según el estado del convenio.

  const obtenerClaseEstado = (estado: string) => {

    switch (estado) {

      case 'Vigente':

        return 'inline-flex rounded-md bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 text-xs font-bold text-emerald-400';

      case 'En renovación':

        return 'inline-flex rounded-md bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 text-xs font-bold text-amber-400';

      case 'Vencido':

        return 'inline-flex rounded-md bg-red-500/20 border border-red-500/30 px-2.5 py-1 text-xs font-bold text-red-400';

      case 'Finalizado':

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

                Gestión de Convenios

              </h1>

              <p className="text-[11px] text-slate-300">

                Administración de los convenios asociados a los parques.

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

              <FileText className="shrink-0 text-[#18843B]" size={22} />

              <span className="truncate">Convenios registrados</span>

            </h2>

            <p className="mt-1 text-sm text-slate-300">

              Consulte y administre los convenios registrados en el sistema.

            </p>

          </div>

          <button

            type="button"

            onClick={abrirModalCrear}

            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#18843B] px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-emerald-600 transition-colors"

          >

            <Plus size={19} />

            Nuevo convenio

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

                Utilice uno o varios criterios para localizar convenios específicos.

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

            <div className="min-w-0">

              <label className="mb-1.5 block text-sm font-medium text-slate-300">Número de convenio</label>

              <input

                type="text"

                value={filtroNumeroConvenio}

                onChange={(event) => setFiltroNumeroConvenio(event.target.value)}

                placeholder="Ej: CONV-2026-001"

                className="w-full min-w-0 rounded-xl border border-white/20 bg-[#071923]/50 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"

              />

            </div>

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

                <option value="En renovación" className="bg-[#0B212D]">En renovación</option>

                <option value="Finalizado" className="bg-[#0B212D]">Finalizado</option>

                <option value="Vencido" className="bg-[#0B212D]">Vencido</option>

              </select>

            </div>

            <div className="min-w-0">

              <label className="mb-1.5 block text-sm font-medium text-slate-300">Fecha de firma</label>

              <input

                type="date"

                value={filtroFechaFirma}

                onChange={(event) => setFiltroFechaFirma(event.target.value)}

                className="w-full min-w-0 rounded-xl border border-white/20 bg-[#071923]/50 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500 [color-scheme:dark]"

              />

            </div>

            <div className="min-w-0">

              <label className="mb-1.5 block text-sm font-medium text-slate-300">Fecha de renovación</label>

              <input

                type="date"

                value={filtroFechaRenovacion}

                onChange={(event) => setFiltroFechaRenovacion(event.target.value)}

                className="w-full min-w-0 rounded-xl border border-white/20 bg-[#071923]/50 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500 [color-scheme:dark]"

              />

            </div>

          </div>

          <div className="mt-5 border-t border-white/10 pt-4">

            <p className="text-sm text-slate-400">

              Mostrando <span className="font-bold text-white">{conveniosFiltrados.length}</span>

              {' '}de <span className="font-bold text-white">{convenios.length}</span> convenios.

            </p>

          </div>

        </div>

        {/* CARGANDO */}

        {cargando && (

          <div className="rounded-2xl border border-white/10 bg-[#0d222e]/85 p-8 text-center text-slate-300 backdrop-blur-md">

            Cargando convenios...

          </div>

        )}

        {/* ERROR */}

        {!cargando && error && (

          <div className="rounded-2xl border border-red-500/30 bg-red-900/40 p-6 backdrop-blur-md">

            <p className="font-semibold text-red-300">{error}</p>

            <button

              type="button"

              onClick={cargarConvenios}

              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"

            >

              Intentar nuevamente

            </button>

          </div>

        )}

        {/* ====================================== */}

        {/* TABLA DE CONVENIOS (ANCHO AMPLIADO Y COLUMNA ACCIONES AJUSTADA) */}

        {/* ====================================== */}

        {!cargando && !error && (

          <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d222e]/85 shadow-2xl backdrop-blur-md">

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1350px] table-fixed">

                <thead className="bg-white/5 border-b border-white/10">

                  <tr>

                    <th className="w-[14%] px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">

                      Nº Convenio

                    </th>

                    <th className="w-[20%] px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">

                      Parque

                    </th>

                    <th className="w-[11%] px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">

                      Fecha Firma

                    </th>

                    <th className="w-[7%] px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">

                      Plazo

                    </th>

                    <th className="w-[11%] px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">

                      Renovación

                    </th>

                    <th className="w-[10%] px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">

                      Estado

                    </th>

                    <th className="w-[27%] px-5 py-4 pr-10 text-left text-xs font-bold uppercase tracking-wider text-slate-300">

                      Acciones

                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-white/5">

                  {conveniosFiltrados.length === 0 ? (

                    <tr>

                      <td colSpan={7} className="px-6 py-14 text-center text-sm text-slate-400">

                        {hayFiltrosActivos

                          ? 'No se encontraron convenios que coincidan con los filtros seleccionados.'

                          : 'No hay convenios registrados.'}

                      </td>

                    </tr>

                  ) : (

                    conveniosPaginados.map((convenio) => (

                      <tr

                        key={convenio.id_convenio}

                        className="transition-colors hover:bg-white/5"

                      >

                        <td className="min-w-0 px-5 py-4 align-top">

                          <p className="truncate font-bold text-white" title={convenio.numero_convenio || '—'}>

                            {convenio.numero_convenio || '—'}

                          </p>

                        </td>

                        <td className="min-w-0 px-5 py-4 align-top">

                          <p className="truncate font-semibold text-slate-200" title={convenio.parque?.ubicacion ?? 'Parque no disponible'}>

                            {convenio.parque?.ubicacion ?? 'Parque no disponible'}

                          </p>

                          {convenio.parque?.numero_finca && (

                            <p className="mt-0.5 truncate text-xs text-slate-400">

                              Finca: {convenio.parque.numero_finca}

                            </p>

                          )}

                        </td>

                        <td className="whitespace-nowrap px-5 py-4 align-top text-sm text-slate-300">

                          {mostrarFecha(convenio.fecha_firma)}

                        </td>

                        <td className="whitespace-nowrap px-5 py-4 align-top text-sm font-semibold text-emerald-400">

                          {convenio.plazo} {convenio.plazo === 1 ? 'año' : 'años'}

                        </td>

                        <td className="whitespace-nowrap px-5 py-4 align-top text-sm text-slate-300">

                          {mostrarFecha(convenio.fecha_renovacion_firmas)}

                        </td>

                        <td className="whitespace-nowrap px-5 py-4 align-top">

                          <span className={obtenerClaseEstado(convenio.estado_convenio)}>

                            {convenio.estado_convenio}

                          </span>

                        </td>

                        <td className="whitespace-nowrap px-5 py-4 pr-10 align-top">

                          <div className="flex flex-nowrap items-center gap-2">

                            <button

                              type="button"

                              title="Información"

                              onClick={() => abrirModalInformacion(convenio)}

                              className="inline-flex items-center gap-1.5 rounded-md bg-indigo-500/20 border border-indigo-500/30 px-3 py-1.5 text-xs font-bold text-indigo-300 hover:bg-indigo-500/30 transition-colors"

                            >

                              <Eye size={15} />

                              Info

                            </button>

                            <button

                              type="button"

                              title="Editar"

                              onClick={() => abrirModalEditar(convenio)}

                              className="inline-flex items-center gap-1.5 rounded-md bg-sky-500/20 border border-sky-500/30 px-3 py-1.5 text-xs font-bold text-sky-300 hover:bg-sky-500/30 transition-colors"

                            >

                              <Edit3 size={15} />

                              Editar

                            </button>

                            <button

                              type="button"

                              title="Eliminar"

                              onClick={() => abrirModalEliminar(convenio)}

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

            {conveniosFiltrados.length > 0 && (

              <div className="flex flex-col gap-4 bg-[#0B212D]/90 border-t border-white/10 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

                  <p className="text-sm text-slate-400">

                    Mostrando <span className="font-bold text-white">{indiceInicial + 1}</span> a{' '}

                    <span className="font-bold text-white">{Math.min(indiceFinal, conveniosFiltrados.length)}</span> de{' '}

                    <span className="font-bold text-white">{conveniosFiltrados.length}</span> convenios

                  </p>

                  <div className="flex items-center gap-2">

                    <label htmlFor="registrosPorPaginaConvenios" className="text-sm text-slate-400">

                      Registros por página:

                    </label>

                    <select

                      id="registrosPorPaginaConvenios"

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

          MODAL CREAR / EDITAR

      ================================================= */}

      {modalAbierto && (

        <div onClick={cerrarModal} className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">

          <div onClick={(e) => e.stopPropagation()} className="max-h-[85vh] h-auto w-full max-w-5xl flex flex-col rounded-2xl border border-white/10 bg-[#0B212D] shadow-2xl overflow-hidden">

            <div className="flex items-center justify-between border-b border-white/10 px-10 py-7 flex-shrink-0">

              <div>

                <h2 className="text-3xl font-black text-white tracking-tighter">

                  {modoEdicion ? 'Editar convenio' : 'Nuevo convenio'}

                </h2>

                <p className="mt-2 text-base text-slate-400">

                  {modoEdicion ? 'Modifique la información del convenio.' : 'Complete la información para registrar el convenio.'}

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

            <form onSubmit={guardarConvenio} className="flex-1 overflow-y-auto p-10">

              {errorFormulario && (

                <div className="mb-10 rounded-xl border border-red-500/30 bg-red-900/40 p-6 text-base font-semibold text-red-300">

                  {errorFormulario}

                </div>

              )}

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">

                <div className="md:col-span-2">

                  <label className="mb-3 block text-base font-bold text-slate-300">Número de convenio <span className="text-red-500">*</span></label>

                  <input

                    type="text"

                    value={numeroConvenio}

                    onChange={(e) => setNumeroConvenio(e.target.value)}

                    required

                    maxLength={100}

                    placeholder="Ej: CONV-2026-001"

                    className="w-full rounded-xl border border-white/20 bg-[#071923] p-4 text-base text-white focus:border-emerald-500 focus:outline-none"

                  />

                  <p className="mt-2 text-xs text-slate-400">Máximo 100 caracteres.</p>

                </div>

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

                  <p className="mt-2 text-xs text-slate-400">Seleccione uno de los parques registrados.</p>

                </div>

                <div>

                  <label className="mb-3 block text-base font-bold text-slate-300">Fecha de firma <span className="text-red-500">*</span></label>

                  <input

                    type="date"

                    value={fechaFirma}

                    onChange={(e) => setFechaFirma(e.target.value)}

                    required

                    className="w-full rounded-xl border border-white/20 bg-[#071923] p-4 text-base text-white focus:border-emerald-500 focus:outline-none [color-scheme:dark]"

                  />

                  <p className="mt-2 text-xs text-slate-400">Seleccione una fecha válida.</p>

                </div>

                <div>

                  <label className="mb-3 block text-base font-bold text-slate-300">Plazo (años) <span className="text-red-500">*</span></label>

                  <input

                    type="text"

                    inputMode="numeric"

                    pattern="[0-9]*"

                    maxLength={3}

                    value={plazo}

                    onChange={(e) => setPlazo(sanitizarPlazo(e.target.value))}

                    required

                    placeholder="Ej: 5"

                    className="w-full rounded-xl border border-white/20 bg-[#071923] p-4 text-base text-white focus:border-emerald-500 focus:outline-none"

                  />

                  <p className="mt-2 text-xs text-slate-400">Solo números. Máximo 100 años.</p>

                </div>

                <div>

                  <label className="mb-3 block text-base font-bold text-slate-300">Fecha de renovación de firmas</label>

                  <input

                    type="date"

                    value={fechaRenovacion}

                    readOnly

                    required

                    className="w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/5 p-4 text-base text-slate-400 outline-none [color-scheme:dark]"

                  />

                  <p className="mt-2 text-xs text-slate-400">Se calcula automáticamente.</p>

                </div>

                <div>

                  <label className="mb-3 block text-base font-bold text-slate-300">Estado del convenio <span className="text-red-500">*</span></label>

                  <select

                    value={estadoConvenio}

                    onChange={(e) => setEstadoConvenio(e.target.value)}

                    required

                    className="w-full rounded-xl border border-white/20 bg-[#071923] p-4 text-base text-white focus:border-emerald-500 focus:outline-none"

                  >

                    <option value="Vigente" className="bg-[#0B212D]">Vigente</option>

                    <option value="En renovación" className="bg-[#0B212D]">En renovación</option>

                    <option value="Finalizado" className="bg-[#0B212D]">Finalizado</option>

                    <option value="Vencido" className="bg-[#0B212D]">Vencido</option>

                  </select>

                  <p className="mt-2 text-xs text-slate-400">Seleccione el estado actual.</p>

                </div>

                <div className="md:col-span-2">

                  <label className="mb-3 block text-base font-bold text-slate-300">

                    Documento de respaldo

                  </label>

                  <div className="rounded-2xl border border-dashed border-white/20 bg-[#071923]/80 p-5">

                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                      <div className="flex min-w-0 items-center gap-3">

                        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">

                          <Paperclip size={20} />

                        </div>

                        <div className="min-w-0">

                          <p className="truncate text-sm font-bold text-white">

                            {documentoConvenio?.name ||

                              documentoActual ||

                              'Ningún documento seleccionado'}

                          </p>

                          <p className="mt-1 text-xs text-slate-400">

                            PDF, DOC o DOCX · máximo 15 MB. Se almacenará en C:\\\Convenios catastro.

                            {modoEdicion && documentoActual

                              ? ' Si selecciona otro archivo, reemplazará el documento actual.'

                              : ''}

                          </p>

                        </div>

                      </div>

                      <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#315F73] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#244C5F]">

                        <Upload size={16} />

                        {documentoActual ? 'Reemplazar archivo' : 'Seleccionar archivo'}

                        <input

                          type="file"

                          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"

                          className="hidden"

                          onChange={(event) => {

                            const archivo =

                              event.target.files?.[0] ?? null;

                            if (!archivo) {

                              setDocumentoConvenio(null);

                              return;

                            }

                            setErrorFormulario('');

                            if (!validarDocumento(archivo)) {

                              event.currentTarget.value = '';

                              setDocumentoConvenio(null);

                              return;

                            }

                            setDocumentoConvenio(archivo);

                          }}

                        />

                      </label>

                    </div>

                  </div>

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

                  {guardando ? 'Guardando...' : modoEdicion ? 'Guardar cambios' : 'Guardar convenio'}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* =================================================

          MODAL INFORMACIÓN

      ================================================= */}

      {modalInformacionAbierto && convenioVer && (

        <div onClick={cerrarModalInformacion} className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">

          <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-4xl flex flex-col rounded-2xl border border-white/10 bg-[#0B212D] shadow-2xl overflow-hidden">

            <div className="flex items-center justify-between border-b border-white/10 px-10 py-7 flex-shrink-0">

              <div>

                <h2 className="text-3xl font-black text-white tracking-tighter">Información del convenio</h2>

                <p className="mt-2 text-base text-slate-400">Información completa del convenio seleccionado.</p>

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

                <p className="text-sm font-bold uppercase tracking-wide text-sky-400">Número de convenio</p>

                <p className="mt-4 text-4xl font-black text-white tracking-tight text-center">{convenioVer.numero_convenio || 'No registrado'}</p>

              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:col-span-2">

                  <p className="text-sm font-bold uppercase tracking-wide text-slate-400">Parque</p>

                  <p className="mt-2 text-xl font-semibold text-white">{convenioVer.parque?.ubicacion ?? 'Parque no disponible'}</p>

                  {convenioVer.parque?.numero_finca && (

                    <p className="mt-1 text-sm text-slate-400">Finca: {convenioVer.parque.numero_finca}</p>

                  )}

                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">

                  <p className="text-sm font-bold uppercase tracking-wide text-slate-400">Fecha de firma</p>

                  <p className="mt-2 text-xl font-semibold text-white">{mostrarFecha(convenioVer.fecha_firma)}</p>

                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">

                  <p className="text-sm font-bold uppercase tracking-wide text-slate-400">Plazo</p>

                  <p className="mt-2 text-xl font-semibold text-emerald-400">{convenioVer.plazo} {convenioVer.plazo === 1 ? 'año' : 'años'}</p>

                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">

                  <p className="text-sm font-bold uppercase tracking-wide text-slate-400">Fecha de renovación</p>

                  <p className="mt-2 text-xl font-semibold text-white">{mostrarFecha(convenioVer.fecha_renovacion_firmas)}</p>

                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">

                  <p className="text-sm font-bold uppercase tracking-wide text-slate-400">Estado</p>

                  <div className="mt-3">

                    <span className={obtenerClaseEstado(convenioVer.estado_convenio)}>

                      {convenioVer.estado_convenio}

                    </span>

                  </div>

                </div>

              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                  <div className="flex min-w-0 items-center gap-3">

                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">

                      <Paperclip size={21} />

                    </div>

                    <div className="min-w-0">

                      <p className="text-sm font-bold uppercase tracking-wide text-slate-400">

                        Documento de respaldo

                      </p>

                      <p className="mt-1 truncate text-base font-bold text-white">

                        {convenioVer.documento_nombre_original ||

                          'No se ha adjuntado un documento'}

                      </p>

                      {convenioVer.documento_tamano && (

                        <p className="mt-1 text-xs text-slate-500">

                          {(convenioVer.documento_tamano / 1024 / 1024).toFixed(2)} MB

                        </p>

                      )}

                    </div>

                  </div>

                  {convenioVer.documento_nombre_original && (

                    <div className="flex flex-wrap gap-2">

                      <button

                        type="button"

                        disabled={procesandoDocumento}

                        onClick={() => void abrirDocumento(convenioVer)}

                        className="inline-flex items-center gap-2 rounded-xl bg-[#315F73] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#244C5F] disabled:opacity-50"

                      >

                        <Eye size={16} />

                        Ver documento

                      </button>

                    </div>

                  )}

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

          MODAL ELIMINAR

      ================================================= */}

      {modalEliminarAbierto && convenioEliminar && (

        <div onClick={cerrarModalEliminar} className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">

          <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-2xl flex flex-col rounded-2xl border border-white/10 bg-[#0B212D] shadow-2xl overflow-hidden">

            <div className="border-b border-white/10 px-10 py-7 flex-shrink-0">

              <h2 className="text-3xl font-black text-white tracking-tighter">Eliminar convenio</h2>

              <p className="mt-2 text-base text-slate-400">Esta acción eliminará el registro seleccionado permanentemente.</p>

            </div>

            <div className="p-10 flex-1 overflow-y-auto">

              <div className="rounded-2xl border border-red-500/30 bg-red-900/30 p-8 flex flex-col items-center justify-center text-center">

                <p className="text-base text-red-300">¿Está seguro de que desea eliminar este convenio?</p>

                <p className="mt-6 text-3xl font-black text-white tracking-tight break-all">

                  {convenioEliminar.numero_convenio || 'Sin número de convenio'}

                </p>

                <p className="mt-3 text-lg text-slate-400">Parque: {convenioEliminar.parque?.ubicacion ?? 'Desconocido'}</p>

              </div>

              {errorEliminar && (

                <div className="mt-8 rounded-xl border border-red-500/30 bg-red-900/50 p-6 text-base font-semibold text-red-300">

                  <p className="font-black text-lg text-red-300">No se puede eliminar el convenio</p>

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

                  onClick={confirmarEliminarConvenio}

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

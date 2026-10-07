import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import axios from 'axios';
import type { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  ImageIcon,
  Plus,
  Search,
  Trash2,
  Upload,
  Wrench,
  X,
} from 'lucide-react';
import fondoGrecia from '../../assets/grecia-login.jpg';
import logoMunicipalidad from '../../assets/logo-municipalidad-grecia.webp';
import SidebarCatastro from '../../components/SidebarCatastro';
// ======================================================
// AXIOS
// ======================================================
// Configura la instancia de Axios utilizada por el módulo.
const api = axios.create({
  baseURL: '/api',
});
// Agrega automáticamente el token JWT a cada solicitud.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
// ======================================================
// INTERFACES
// ======================================================
interface Parque {
  id_parque: number;
  ubicacion: string;
  numero_finca?: string | null;
  numero_plano?: string | null;
  distrito?: {
    id_distrito: number;
    nombre_distrito: string;
  } | null;
}
type TipoImagen = 'ANTES' | 'DESPUES';
interface MantenimientoImagen {
  id_imagen: number;
  id_mantenimiento: number;
  tipo: TipoImagen;
  ruta_imagen: string;
  orden: number;
}
interface Mantenimiento {
  id_mantenimiento: number;
  nombre_mantenimiento: string;
  descripcion: string;
  inversion: number | string | null;
  descripcion_inversion: string | null;
  fecha_mantenimiento: string;
  id_parque: number;
  parque: Parque;
  imagenes: MantenimientoImagen[];
}
interface FormularioMantenimiento {
  id_parque: string;
  nombre_mantenimiento: string;
  descripcion: string;
  inversion: string;
  descripcion_inversion: string;
  fecha_mantenimiento: string;
}
interface ImagenLocal {
  id: string;
  archivo: File;
  preview: string;
}
interface ImagenServidor extends MantenimientoImagen {
  url: string;
}
type TipoEvidencia =
  | 'todas'
  | 'ambas'
  | 'solo_antes'
  | 'solo_despues'
  | 'sin_imagenes';
// ======================================================
// CONSTANTES
// ======================================================
const MAX_IMAGEN = 5 * 1024 * 1024;
const MAX_IMAGENES_POR_TIPO = 20;
const TIPOS_IMAGEN_PERMITIDOS = [
  'image/jpeg',
  'image/png',
  'image/webp',
];
// Obtiene la fecha actual en formato YYYY-MM-DD.
const obtenerFechaActual = () => {
  const hoy = new Date();
  const year = hoy.getFullYear();
  const month = String(hoy.getMonth() + 1).padStart(2, '0');
  const day = String(hoy.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const formularioInicial: FormularioMantenimiento = {
  id_parque: '',
  nombre_mantenimiento: '',
  descripcion: '',
  inversion: '',
  descripcion_inversion: '',
  fecha_mantenimiento: obtenerFechaActual(),
};
// ======================================================
// COMPONENTE PRINCIPAL
// ======================================================
// Componente principal para la gestión de mantenimientos.
export default function Mantenimientos() {
  const navigate = useNavigate();
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [parques, setParques] = useState<Parque[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [modalFormulario, setModalFormulario] = useState(false);
  const [modalInformacion, setModalInformacion] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [mantenimientoSeleccionado, setMantenimientoSeleccionado] =
    useState<Mantenimiento | null>(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [formulario, setFormulario] =
    useState<FormularioMantenimiento>(formularioInicial);
  const [imagenesAntes, setImagenesAntes] = useState<ImagenLocal[]>([]);
  const [imagenesDespues, setImagenesDespues] = useState<ImagenLocal[]>([]);
  const [imagenesServidorAntes, setImagenesServidorAntes] =
    useState<ImagenServidor[]>([]);
  const [imagenesServidorDespues, setImagenesServidorDespues] =
    useState<ImagenServidor[]>([]);
  const [busquedaParque, setBusquedaParque] = useState('');
  const [selectorParqueAbierto, setSelectorParqueAbierto] = useState(false);
  const [filtroParque, setFiltroParque] = useState('');
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroDescripcion, setFiltroDescripcion] = useState('');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  const [filtroEvidencia, setFiltroEvidencia] =
    useState<TipoEvidencia>('todas');
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [galeriaAbierta, setGaleriaAbierta] = useState(false);
  const [galeriaImagenes, setGaleriaImagenes] = useState<ImagenServidor[]>([]);
  const [galeriaIndice, setGaleriaIndice] = useState(0);
  const [galeriaTitulo, setGaleriaTitulo] = useState('');
  // ====================================================
  // BLOQUEO DE SCROLL DE FONDO
  // ====================================================
  // Indica si alguno de los modales o la galería está abierto.
  const unModalEstaAbierto = Boolean(
    modalFormulario || modalInformacion || modalEliminar || galeriaAbierta
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
  // ====================================================
  // CARGA DE DATOS
  // ====================================================
  // Carga mantenimientos y parques desde la API.
  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [respuestaMantenimientos, respuestaParques] = await Promise.all([
        api.get('/mantenimientos'),
        api.get('/parques'),
      ]);
      setMantenimientos(respuestaMantenimientos.data);
      setParques(respuestaParques.data);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los mantenimientos.');
    } finally {
      setCargando(false);
    }
  };
  useEffect(() => {
    cargarDatos();
  }, []);
  // ====================================================
  // LIMPIEZA DE OBJECT URL
  // ====================================================
  // Libera las URL temporales de las imágenes locales.
  const liberarImagenesLocales = (imagenes: ImagenLocal[]) => {
    imagenes.forEach((imagen) => URL.revokeObjectURL(imagen.preview));
  };
  // Libera las URL temporales de las imágenes descargadas del servidor.
  const liberarImagenesServidor = (imagenes: ImagenServidor[]) => {
    imagenes.forEach((imagen) => URL.revokeObjectURL(imagen.url));
  };
  // Limpia las imágenes nuevas seleccionadas por el usuario.
  const limpiarImagenesLocales = () => {
    liberarImagenesLocales(imagenesAntes);
    liberarImagenesLocales(imagenesDespues);
    setImagenesAntes([]);
    setImagenesDespues([]);
  };
  // Limpia las imágenes cargadas desde el servidor.
  const limpiarImagenesServidor = () => {
    liberarImagenesServidor(imagenesServidorAntes);
    liberarImagenesServidor(imagenesServidorDespues);
    setImagenesServidorAntes([]);
    setImagenesServidorDespues([]);
  };
  // ====================================================
  // ESC / FLECHAS DE GALERÍA
  // ====================================================
  useEffect(() => {
    // Gestiona Escape y navegación con flechas dentro de la galería.
    const manejarTeclado = (event: KeyboardEvent) => {
      if (galeriaAbierta) {
        if (event.key === 'Escape') {
          setGaleriaAbierta(false);
          return;
        }
        if (event.key === 'ArrowLeft') {
          setGaleriaIndice((indice) =>
            galeriaImagenes.length
              ? (indice - 1 + galeriaImagenes.length) % galeriaImagenes.length
              : 0,
          );
          return;
        }
        if (event.key === 'ArrowRight') {
          setGaleriaIndice((indice) =>
            galeriaImagenes.length
              ? (indice + 1) % galeriaImagenes.length
              : 0,
          );
          return;
        }
      }
      if (event.key !== 'Escape' || procesando) return;
      if (modalFormulario) cerrarFormulario();
      else if (modalInformacion) cerrarInformacion();
      else if (modalEliminar) cerrarEliminar();
    };
    window.addEventListener('keydown', manejarTeclado);
    return () => window.removeEventListener('keydown', manejarTeclado);
  }, [
    modalFormulario,
    modalInformacion,
    modalEliminar,
    procesando,
    galeriaAbierta,
    galeriaImagenes.length,
  ]);
  // ====================================================
  // SELECTOR DE PARQUE
  // ====================================================
  // Filtra los parques disponibles en el selector.
  const parquesSelector = useMemo(() => {
    const texto = busquedaParque.trim().toLowerCase();
    if (!texto) return parques;
    return parques.filter((parque) => {
      const cadena = [
        parque.ubicacion,
        parque.numero_finca,
        parque.numero_plano,
        parque.distrito?.nombre_distrito,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return cadena.includes(texto);
    });
  }, [parques, busquedaParque]);
  const parqueSeleccionado = parques.find(
    (parque) => String(parque.id_parque) === formulario.id_parque,
  );
  // Selecciona un parque y lo asigna al formulario.
  const seleccionarParque = (parque: Parque) => {
    setFormulario((anterior) => ({
      ...anterior,
      id_parque: String(parque.id_parque),
    }));
    setBusquedaParque(parque.ubicacion);
    setSelectorParqueAbierto(false);
  };
  // ====================================================
  // FILTROS Y PAGINACIÓN
  // ====================================================
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);
  // Aplica los filtros al listado de mantenimientos.
  const mantenimientosFiltrados = useMemo(() => {
    return mantenimientos.filter((mantenimiento) => {
      const parque = mantenimiento.parque;
      const textoParque = [
        parque?.ubicacion,
        parque?.numero_finca,
        parque?.numero_plano,
        parque?.distrito?.nombre_distrito,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (
        filtroParque &&
        !textoParque.includes(filtroParque.trim().toLowerCase())
      ) {
        return false;
      }
      if (
        filtroNombre &&
        !mantenimiento.nombre_mantenimiento
          .toLowerCase()
          .includes(filtroNombre.trim().toLowerCase())
      ) {
        return false;
      }
      if (
        filtroDescripcion &&
        !mantenimiento.descripcion
          .toLowerCase()
          .includes(filtroDescripcion.trim().toLowerCase())
      ) {
        return false;
      }
      if (
        filtroFechaDesde &&
        mantenimiento.fecha_mantenimiento < filtroFechaDesde
      ) {
        return false;
      }
      if (
        filtroFechaHasta &&
        mantenimiento.fecha_mantenimiento > filtroFechaHasta
      ) {
        return false;
      }
      const tieneAntes = mantenimiento.imagenes?.some(
        (imagen) => imagen.tipo === 'ANTES',
      );
      const tieneDespues = mantenimiento.imagenes?.some(
        (imagen) => imagen.tipo === 'DESPUES',
      );
      if (filtroEvidencia === 'ambas' && !(tieneAntes && tieneDespues)) {
        return false;
      }
      if (filtroEvidencia === 'solo_antes' && !(tieneAntes && !tieneDespues)) {
        return false;
      }
      if (
        filtroEvidencia === 'solo_despues' &&
        !(!tieneAntes && tieneDespues)
      ) {
        return false;
      }
      if (filtroEvidencia === 'sin_imagenes' && (tieneAntes || tieneDespues)) {
        return false;
      }
      return true;
    });
  }, [
    mantenimientos,
    filtroParque,
    filtroNombre,
    filtroDescripcion,
    filtroFechaDesde,
    filtroFechaHasta,
    filtroEvidencia,
  ]);
  const totalPaginas = Math.max(1, Math.ceil(mantenimientosFiltrados.length / registrosPorPagina));
  const indiceInicial = (paginaActual - 1) * registrosPorPagina;
  const indiceFinal = indiceInicial + registrosPorPagina;
  const mantenimientosPaginados = mantenimientosFiltrados.slice(indiceInicial, indiceFinal);
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
    filtroNombre,
    filtroDescripcion,
    filtroFechaDesde,
    filtroFechaHasta,
    filtroEvidencia,
    registrosPorPagina,
  ]);
  useEffect(() => {
    if (paginaActual > totalPaginas) {
      setPaginaActual(totalPaginas);
    }
  }, [paginaActual, totalPaginas]);
  const hayFiltrosActivos = Boolean(
    filtroParque ||
      filtroNombre ||
      filtroDescripcion ||
      filtroFechaDesde ||
      filtroFechaHasta ||
      filtroEvidencia !== 'todas',
  );
  // Restablece todos los filtros de búsqueda.
  const limpiarFiltros = () => {
    setFiltroParque('');
    setFiltroNombre('');
    setFiltroDescripcion('');
    setFiltroFechaDesde('');
    setFiltroFechaHasta('');
    setFiltroEvidencia('todas');
  };
  // ====================================================
  // MENSAJES
  // ====================================================
  // Muestra temporalmente un mensaje de operación exitosa.
  const mostrarExito = (mensaje: string) => {
    setError('');
    setExito(mensaje);
    window.setTimeout(() => setExito(''), 3500);
  };
  // Obtiene un mensaje legible a partir de un error de Axios.
  const obtenerMensajeError = (err: unknown) => {
    if (axios.isAxiosError(err)) {
      const axiosError = err as AxiosError<{
        message?: string | string[];
      }>;
      const mensaje = axiosError.response?.data?.message;
      if (Array.isArray(mensaje)) return mensaje.join(' ');
      if (typeof mensaje === 'string') return mensaje;
    }
    return 'Ocurrió un error inesperado.';
  };
  // ====================================================
  // IMÁGENES DEL SERVIDOR
  // ====================================================
  // Descarga una imagen del mantenimiento desde el backend.
  const cargarImagenServidor = async (
    mantenimientoId: number,
    imagen: MantenimientoImagen,
  ): Promise<ImagenServidor | null> => {
    try {
      const respuesta = await api.get(
        `/mantenimientos/${mantenimientoId}/imagenes/${imagen.id_imagen}`,
        { responseType: 'blob' },
      );
      return {
        ...imagen,
        url: URL.createObjectURL(respuesta.data),
      };
    } catch (err) {
      console.error('No se pudo cargar una imagen del mantenimiento.', err);
      return null;
    }
  };
  // Carga y separa las imágenes antes y después del mantenimiento.
  const cargarImagenesServidor = async (mantenimiento: Mantenimiento) => {
    limpiarImagenesServidor();
    const imagenesOrdenadas = [...(mantenimiento.imagenes || [])].sort(
      (a, b) => a.orden - b.orden,
    );
    const cargadas = await Promise.all(
      imagenesOrdenadas.map((imagen) =>
        cargarImagenServidor(mantenimiento.id_mantenimiento, imagen),
      ),
    );
    const validas = cargadas.filter(
      (imagen): imagen is ImagenServidor => imagen !== null,
    );
    setImagenesServidorAntes(
      validas.filter((imagen) => imagen.tipo === 'ANTES'),
    );
    setImagenesServidorDespues(
      validas.filter((imagen) => imagen.tipo === 'DESPUES'),
    );
  };
  // ====================================================
  // ABRIR / CERRAR MODALES
  // ====================================================
  // Prepara el formulario para registrar un mantenimiento nuevo.
  const abrirNuevo = () => {
    limpiarImagenesLocales();
    limpiarImagenesServidor();
    setModoEdicion(false);
    setMantenimientoSeleccionado(null);
    setFormulario({
      ...formularioInicial,
      fecha_mantenimiento: obtenerFechaActual(),
    });
    setBusquedaParque('');
    setSelectorParqueAbierto(false);
    setError('');
    setModalFormulario(true);
  };
  // Carga los datos del mantenimiento seleccionado para editarlo.
  const abrirEditar = async (mantenimiento: Mantenimiento) => {
    limpiarImagenesLocales();
    limpiarImagenesServidor();
    setModoEdicion(true);
    setMantenimientoSeleccionado(mantenimiento);
    setFormulario({
      id_parque: String(mantenimiento.id_parque),
      nombre_mantenimiento: mantenimiento.nombre_mantenimiento,
      descripcion: mantenimiento.descripcion,
      inversion:
        mantenimiento.inversion !== null && mantenimiento.inversion !== undefined
          ? String(mantenimiento.inversion)
          : '',
      descripcion_inversion: mantenimiento.descripcion_inversion || '',
      fecha_mantenimiento: mantenimiento.fecha_mantenimiento.slice(0, 10),
    });
    setBusquedaParque(mantenimiento.parque?.ubicacion || '');
    setSelectorParqueAbierto(false);
    setError('');
    setModalFormulario(true);
    await cargarImagenesServidor(mantenimiento);
  };
  // Abre el modal con la información y evidencias del mantenimiento.
  const abrirInformacion = async (mantenimiento: Mantenimiento) => {
    limpiarImagenesServidor();
    setMantenimientoSeleccionado(mantenimiento);
    setModalInformacion(true);
    await cargarImagenesServidor(mantenimiento);
  };
  // Abre el modal para confirmar la eliminación.
  const abrirEliminar = (mantenimiento: Mantenimiento) => {
    setMantenimientoSeleccionado(mantenimiento);
    setModalEliminar(true);
  };
  // Cierra el formulario y libera las imágenes temporales.
  const cerrarFormulario = () => {
    if (procesando) return;
    setModalFormulario(false);
    setSelectorParqueAbierto(false);
    limpiarImagenesLocales();
    limpiarImagenesServidor();
  };
  // Cierra el modal de información y limpia las imágenes cargadas.
  const cerrarInformacion = () => {
    setModalInformacion(false);
    setGaleriaAbierta(false);
    limpiarImagenesServidor();
  };
  // Cierra el modal de eliminación.
  const cerrarEliminar = () => {
    if (procesando) return;
    setModalEliminar(false);
    setMantenimientoSeleccionado(null);
  };
  // ====================================================
  // FORMULARIO
  // ====================================================
  // Actualiza los campos generales del formulario.
  const manejarCambio = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  };
  // Valida y limita el formato del monto de inversión.
  const manejarCambioInversion = (event: ChangeEvent<HTMLInputElement>) => {
    let valor = event.target.value;
    // Solo números y un punto decimal. No permite e, +, -, letras, etc.
    valor = valor.replace(/[^0-9.]/g, '');
    const partes = valor.split('.');
    if (partes.length > 2) {
      valor = `${partes[0]}.${partes.slice(1).join('')}`;
    }
    let [enteros = '', decimales = ''] = valor.split('.');
    // DECIMAL(12,2) => máximo 10 enteros + 2 decimales.
    enteros = enteros.slice(0, 10);
    decimales = decimales.slice(0, 2);
    valor =
      valor.includes('.')
        ? `${enteros}.${decimales}`
        : enteros;
    setFormulario((anterior) => ({
      ...anterior,
      inversion: valor,
    }));
  };
  // Valida tipo, tamaño y cantidad de imágenes seleccionadas.
  const validarArchivos = (
    archivos: File[],
    cantidadExistentes: number,
  ): File[] => {
    const validos: File[] = [];
    for (const archivo of archivos) {
      if (!TIPOS_IMAGEN_PERMITIDOS.includes(archivo.type)) {
        setError('Solo se permiten imágenes JPG, JPEG, PNG o WEBP.');
        continue;
      }
      if (archivo.size > MAX_IMAGEN) {
        setError(`La imagen "${archivo.name}" supera el máximo de 5 MB.`);
        continue;
      }
      validos.push(archivo);
    }
    const disponibles = Math.max(
      0,
      MAX_IMAGENES_POR_TIPO - cantidadExistentes,
    );
    if (validos.length > disponibles) {
      setError(
        `Solo se permiten hasta ${MAX_IMAGENES_POR_TIPO} imágenes por sección.`,
      );
    }
    return validos.slice(0, disponibles);
  };
  // Agrega varias imágenes a la sección antes o después.
  const manejarVariasImagenes = (
    event: ChangeEvent<HTMLInputElement>,
    tipo: TipoImagen,
  ) => {
    const archivos = Array.from(event.target.files || []);
    if (!archivos.length) return;
    const localesActuales = tipo === 'ANTES' ? imagenesAntes : imagenesDespues;
    const servidorActuales =
      tipo === 'ANTES' ? imagenesServidorAntes : imagenesServidorDespues;
    const validos = validarArchivos(
      archivos,
      localesActuales.length + servidorActuales.length,
    );
    if (!validos.length) {
      event.target.value = '';
      return;
    }
    const nuevas: ImagenLocal[] = validos.map((archivo) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      archivo,
      preview: URL.createObjectURL(archivo),
    }));
    setError('');
    if (tipo === 'ANTES') {
      setImagenesAntes((actuales) => [...actuales, ...nuevas]);
    } else {
      setImagenesDespues((actuales) => [...actuales, ...nuevas]);
    }
    event.target.value = '';
  };
  // Elimina una imagen seleccionada localmente.
  const eliminarImagenLocal = (tipo: TipoImagen, id: string) => {
    const setter = tipo === 'ANTES' ? setImagenesAntes : setImagenesDespues;
    setter((actuales) => {
      const imagen = actuales.find((item) => item.id === id);
      if (imagen) URL.revokeObjectURL(imagen.preview);
      return actuales.filter((item) => item.id !== id);
    });
  };
  // Elimina una imagen ya almacenada en el servidor.
  const eliminarImagenServidor = async (imagen: ImagenServidor) => {
    if (!mantenimientoSeleccionado || procesando) return;
    try {
      setProcesando(true);
      setError('');
      await api.delete(
        `/mantenimientos/${mantenimientoSeleccionado.id_mantenimiento}/imagenes/${imagen.id_imagen}`,
      );
      URL.revokeObjectURL(imagen.url);
      if (imagen.tipo === 'ANTES') {
        setImagenesServidorAntes((actuales) =>
          actuales.filter((item) => item.id_imagen !== imagen.id_imagen),
        );
      } else {
        setImagenesServidorDespues((actuales) =>
          actuales.filter((item) => item.id_imagen !== imagen.id_imagen),
        );
      }
      setMantenimientos((actuales) =>
        actuales.map((mantenimiento) =>
          mantenimiento.id_mantenimiento ===
          mantenimientoSeleccionado.id_mantenimiento
            ? {
                ...mantenimiento,
                imagenes: mantenimiento.imagenes.filter(
                  (item) => item.id_imagen !== imagen.id_imagen,
                ),
              }
            : mantenimiento,
        ),
      );
      mostrarExito('Imagen eliminada correctamente.');
    } catch (err) {
      console.error(err);
      setError(obtenerMensajeError(err));
    } finally {
      setProcesando(false);
    }
  };
  // Valida todos los datos requeridos antes de guardar.
  const validarFormulario = () => {
    if (!formulario.id_parque) {
      setError('Debe seleccionar un parque.');
      return false;
    }
    if (!formulario.nombre_mantenimiento.trim()) {
      setError('Debe ingresar el nombre del mantenimiento.');
      return false;
    }
    if (formulario.nombre_mantenimiento.trim().length > 100) {
      setError('El nombre del mantenimiento no puede superar los 100 caracteres.');
      return false;
    }
    if (!formulario.descripcion.trim()) {
      setError('Debe ingresar una descripción.');
      return false;
    }
    if (formulario.descripcion.trim().length > 500) {
      setError('La descripción no puede superar los 500 caracteres.');
      return false;
    }
    if (!formulario.inversion.trim()) {
      setError('Debe ingresar la inversión realizada.');
      return false;
    }
    const inversionNumero = Number(formulario.inversion);
    if (
      Number.isNaN(inversionNumero) ||
      inversionNumero < 0 ||
      inversionNumero > 9999999999.99
    ) {
      setError('La inversión debe ser un monto válido entre 0 y 9.999.999.999,99.');
      return false;
    }
    if (!formulario.descripcion_inversion.trim()) {
      setError('Debe ingresar la descripción de la inversión.');
      return false;
    }
    if (formulario.descripcion_inversion.trim().length > 500) {
      setError('La descripción de la inversión no puede superar los 500 caracteres.');
      return false;
    }
    if (!formulario.fecha_mantenimiento) {
      setError('Debe seleccionar la fecha del mantenimiento.');
      return false;
    }
    return true;
  };
  // Registra o actualiza un mantenimiento.
  const guardarMantenimiento = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!validarFormulario()) return;
    try {
      setProcesando(true);
      const formData = new FormData();
      formData.append('id_parque', formulario.id_parque);
      formData.append(
        'nombre_mantenimiento',
        formulario.nombre_mantenimiento.trim(),
      );
      formData.append('descripcion', formulario.descripcion.trim());
      formData.append('inversion', formulario.inversion);
      formData.append(
        'descripcion_inversion',
        formulario.descripcion_inversion.trim(),
      );
      formData.append('fecha_mantenimiento', formulario.fecha_mantenimiento);
      imagenesAntes.forEach((imagen) => {
        formData.append('imagenes_antes', imagen.archivo);
      });
      imagenesDespues.forEach((imagen) => {
        formData.append('imagenes_despues', imagen.archivo);
      });
      if (modoEdicion && mantenimientoSeleccionado) {
        await api.patch(
          `/mantenimientos/${mantenimientoSeleccionado.id_mantenimiento}`,
          formData,
        );
        mostrarExito('Mantenimiento actualizado correctamente.');
      } else {
        await api.post('/mantenimientos', formData);
        mostrarExito('Mantenimiento registrado correctamente.');
      }
      setModalFormulario(false);
      limpiarImagenesLocales();
      limpiarImagenesServidor();
      await cargarDatos();
    } catch (err) {
      console.error(err);
      setError(obtenerMensajeError(err));
    } finally {
      setProcesando(false);
    }
  };
  // Elimina el mantenimiento seleccionado.
  const eliminarMantenimiento = async () => {
    if (!mantenimientoSeleccionado) return;
    try {
      setProcesando(true);
      await api.delete(
        `/mantenimientos/${mantenimientoSeleccionado.id_mantenimiento}`,
      );
      setModalEliminar(false);
      setMantenimientoSeleccionado(null);
      mostrarExito('Mantenimiento eliminado correctamente.');
      await cargarDatos();
    } catch (err) {
      console.error(err);
      setError(obtenerMensajeError(err));
    } finally {
      setProcesando(false);
    }
  };
  // ====================================================
  // GALERÍA
  // ====================================================
  // Abre la galería de evidencias en la imagen seleccionada.
  const abrirGaleria = (
    imagenes: ImagenServidor[],
    indice: number,
    titulo: string,
  ) => {
    if (!imagenes.length) return;
    setGaleriaImagenes(imagenes);
    setGaleriaIndice(indice);
    setGaleriaTitulo(titulo);
    setGaleriaAbierta(true);
  };
  // Muestra la imagen anterior de la galería.
  const anteriorGaleria = () => {
    setGaleriaIndice((indice) =>
      galeriaImagenes.length
        ? (indice - 1 + galeriaImagenes.length) % galeriaImagenes.length
        : 0,
    );
  };
  // Muestra la imagen siguiente de la galería.
  const siguienteGaleria = () => {
    setGaleriaIndice((indice) =>
      galeriaImagenes.length
        ? (indice + 1) % galeriaImagenes.length
        : 0,
    );
  };
  // ====================================================
  // FORMATO
  // ====================================================
  // Formatea una fecha para mostrarla como día/mes/año.
  const formatearFecha = (fecha: string) => {
    if (!fecha) return '—';
    const [year, month, day] = fecha.slice(0, 10).split('-');
    return `${day}/${month}/${year}`;
  };
  // Formatea la inversión en colones costarricenses.
  const formatearInversion = (valor: number | string | null | undefined) => {
    if (valor === null || valor === undefined || valor === '') return '—';
    const numero = Number(valor);
    if (Number.isNaN(numero)) return '—';
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numero);
  };
  // ====================================================
  // RENDER
  // ====================================================
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
                Gestión de Mantenimientos
              </h1>
              <p className="text-[11px] text-slate-300">
                Registro y seguimiento de los mantenimientos realizados.
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
        {exito && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-900/40 px-4 py-3 text-sm font-bold text-emerald-300 backdrop-blur-md">
            <CheckCircle2 size={20} />
            {exito}
          </div>
        )}
        {error && !modalFormulario && !modalEliminar && (
          <div className="mb-5 flex min-w-0 items-start justify-between gap-3 rounded-xl border border-red-500/30 bg-red-900/40 px-4 py-3 text-sm text-red-300 backdrop-blur-md">
            <span className="min-w-0 break-words font-bold">{error}</span>
            <button
              type="button"
              className="shrink-0 text-red-300 hover:text-red-100"
              onClick={() => setError('')}
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-xl font-bold text-white tracking-tight">
              <Wrench className="shrink-0 text-[#18843B]" size={22} />
              <span className="truncate">Mantenimientos registrados</span>
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              {mantenimientos.length} mantenimiento{mantenimientos.length !== 1 ? 's' : ''} registrado{mantenimientos.length !== 1 ? 's' : ''}.
            </p>
          </div>
          <button
            type="button"
            onClick={abrirNuevo}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#18843B] px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-emerald-600 transition-colors"
          >
            <Plus size={19} />
            Nuevo mantenimiento
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
                Puede combinar varios filtros.
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
          <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <CampoFiltro
              label="Parque"
              value={filtroParque}
              onChange={setFiltroParque}
              placeholder="Ubicación, finca, distrito..."
            />
            <CampoFiltro
              label="Nombre del mantenimiento"
              value={filtroNombre}
              onChange={setFiltroNombre}
              placeholder="Buscar mantenimiento..."
            />
            <CampoFiltro
              label="Descripción"
              value={filtroDescripcion}
              onChange={setFiltroDescripcion}
              placeholder="Buscar en descripción..."
            />
            <div className="min-w-0">
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Fecha desde
              </label>
              <input
                type="date"
                value={filtroFechaDesde}
                onChange={(e) => setFiltroFechaDesde(e.target.value)}
                className="w-full min-w-0 rounded-xl border border-white/20 bg-[#071923]/50 px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 [color-scheme:dark]"
              />
            </div>
            <div className="min-w-0">
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Fecha hasta
              </label>
              <input
                type="date"
                value={filtroFechaHasta}
                onChange={(e) => setFiltroFechaHasta(e.target.value)}
                className="w-full min-w-0 rounded-xl border border-white/20 bg-[#071923]/50 px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 [color-scheme:dark]"
              />
            </div>
            <div className="min-w-0">
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Evidencias
              </label>
              <select
                value={filtroEvidencia}
                onChange={(e) =>
                  setFiltroEvidencia(e.target.value as TipoEvidencia)
                }
                className="w-full min-w-0 rounded-xl border border-white/20 bg-[#071923]/50 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
              >
                <option value="todas" className="bg-[#0B212D]">Todas</option>
                <option value="ambas" className="bg-[#0B212D]">Antes y después</option>
                <option value="solo_antes" className="bg-[#0B212D]">Solo imágenes antes</option>
                <option value="solo_despues" className="bg-[#0B212D]">Solo imágenes después</option>
                <option value="sin_imagenes" className="bg-[#0B212D]">Sin imágenes</option>
              </select>
            </div>
          </div>
        </section>
        {/* ====================================== */}
        {/* TABLA DE MANTENIMIENTOS (ANCHO AMPLIADO Y COLUMNA ACCIONES AL 22%) */}
        {/* ====================================== */}
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d222e]/85 shadow-2xl backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1400px] table-fixed">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="w-[18%] px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">
                    Parque
                  </th>
                  <th className="w-[14%] px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">
                    Mantenimiento
                  </th>
                  <th className="w-[18%] px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">
                    Descripción
                  </th>
                  <th className="w-[10%] px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">
                    Inversión
                  </th>
                  <th className="w-[8%] px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">
                    Fecha
                  </th>
                  <th className="w-[5%] px-5 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-300">
                    Antes
                  </th>
                  <th className="w-[5%] px-5 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-300">
                    Después
                  </th>
                  <th className="w-[22%] px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {cargando ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-14 text-center text-sm text-slate-400">
                      Cargando mantenimientos...
                    </td>
                  </tr>
                ) : mantenimientosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-14 text-center">
                      <Wrench size={34} className="mx-auto mb-3 text-slate-500" />
                      <p className="font-medium text-slate-400">
                        No se encontraron mantenimientos.
                      </p>
                    </td>
                  </tr>
                ) : (
                  mantenimientosPaginados.map((mantenimiento) => {
                    const cantidadAntes = mantenimiento.imagenes?.filter(
                      (imagen) => imagen.tipo === 'ANTES',
                    ).length || 0;
                    const cantidadDespues = mantenimiento.imagenes?.filter(
                      (imagen) => imagen.tipo === 'DESPUES',
                    ).length || 0;
                    return (
                      <tr
                        key={mantenimiento.id_mantenimiento}
                        className="transition-colors hover:bg-white/5"
                      >
                        <td className="min-w-0 px-5 py-4 align-top">
                          <div className="min-w-0 overflow-hidden">
                            <p
                              className="block max-w-full truncate font-bold text-white"
                              title={mantenimiento.parque?.ubicacion || 'Sin ubicación'}
                            >
                              {mantenimiento.parque?.ubicacion || 'Sin ubicación'}
                            </p>
                            {mantenimiento.parque?.numero_finca && (
                              <p
                                className="mt-0.5 block max-w-full truncate text-xs text-slate-400"
                                title={`Finca: ${mantenimiento.parque.numero_finca}`}
                              >
                                Finca: {mantenimiento.parque.numero_finca}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="min-w-0 px-5 py-4 align-top">
                          <p
                            className="block max-w-full truncate font-semibold text-slate-200"
                            title={mantenimiento.nombre_mantenimiento}
                          >
                            {mantenimiento.nombre_mantenimiento}
                          </p>
                        </td>
                        <td className="min-w-0 px-5 py-4 align-top text-sm text-slate-400">
                          <p
                            className="line-clamp-2 max-w-full break-words"
                            title={mantenimiento.descripcion}
                          >
                            {mantenimiento.descripcion}
                          </p>
                        </td>
                        <td className="min-w-0 px-5 py-4 align-top text-sm font-bold text-emerald-400">
                          <p
                            className="max-w-full truncate"
                            title={formatearInversion(mantenimiento.inversion)}
                          >
                            {formatearInversion(mantenimiento.inversion)}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 align-top text-sm text-slate-300">
                          {formatearFecha(mantenimiento.fecha_mantenimiento)}
                        </td>
                        <td className="px-5 py-4 text-center align-top">
                          <IndicadorCantidad cantidad={cantidadAntes} />
                        </td>
                        <td className="px-5 py-4 text-center align-top">
                          <IndicadorCantidad cantidad={cantidadDespues} />
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 align-top">
                          <div className="flex flex-nowrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => abrirInformacion(mantenimiento)}
                              className="inline-flex items-center gap-1.5 rounded-md bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-1.5 text-xs font-bold text-indigo-300 hover:bg-indigo-500/30 transition-colors"
                            >
                              <Eye size={15} />
                              Info
                            </button>
                            <button
                              type="button"
                              onClick={() => abrirEditar(mantenimiento)}
                              className="inline-flex items-center gap-1.5 rounded-md bg-sky-500/20 border border-sky-500/30 px-2.5 py-1.5 text-xs font-bold text-sky-300 hover:bg-sky-500/30 transition-colors"
                            >
                              <Edit3 size={15} />
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => abrirEliminar(mantenimiento)}
                              className="inline-flex items-center gap-1.5 rounded-md bg-red-500/20 border border-red-500/30 px-2.5 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/30 transition-colors"
                            >
                              <Trash2 size={15} />
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            {mantenimientosFiltrados.length > 0 && (
              <div className="flex flex-col gap-4 bg-[#0B212D]/90 border-t border-white/10 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <p className="text-sm text-slate-400">
                    Mostrando <span className="font-bold text-white">{indiceInicial + 1}</span> a{' '}
                    <span className="font-bold text-white">{Math.min(indiceFinal, mantenimientosFiltrados.length)}</span> de{' '}
                    <span className="font-bold text-white">{mantenimientosFiltrados.length}</span> mantenimientos
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
        </section>
      </main>
      {/* =================================================
          MODAL CREAR / EDITAR - GRANDE Y SIN DOBLE SCROLL
      ================================================= */}
      {modalFormulario && (
        <ModalOverlay onClose={cerrarFormulario}>
          <div
            className="flex h-[85vh] w-full min-w-0 max-w-7xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0B212D] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-10 py-7 flex-shrink-0">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tighter">
                  {modoEdicion ? 'Editar mantenimiento' : 'Nuevo mantenimiento'}
                </h2>
                <p className="mt-2 text-base text-slate-400">
                  Registre la información detallada y las evidencias fotográficas.
                </p>
              </div>
              <button
                type="button"
                onClick={cerrarFormulario}
                disabled={procesando}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors text-xl font-bold disabled:opacity-50"
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={guardarMantenimiento}
              className="flex-1 overflow-y-auto p-10"
            >
              {error && (
                <div className="mb-10 rounded-xl border border-red-500/30 bg-red-900/40 p-6 text-base font-semibold text-red-300">
                  {error}
                </div>
              )}
              <div className="grid min-w-0 gap-8 md:grid-cols-2">
                {/* PARQUE */}
                <div className="relative min-w-0 md:col-span-2">
                  <label className="mb-3 block text-base font-bold text-slate-300">
                    Parque <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setSelectorParqueAbierto((anterior) => !anterior)}
                    className="flex w-full min-w-0 items-center justify-between gap-3 overflow-hidden rounded-xl border border-white/20 bg-[#071923] p-4 text-left text-base outline-none text-white focus:border-emerald-500"
                  >
                    <span
                      className={`min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap ${
                        parqueSeleccionado ? 'text-white font-bold' : 'text-slate-500'
                      }`}
                      title={parqueSeleccionado?.ubicacion || ''}
                    >
                      {parqueSeleccionado
                        ? parqueSeleccionado.ubicacion
                        : 'Seleccione un parque'}
                    </span>
                    <ChevronDown size={20} className="shrink-0 text-slate-400" />
                  </button>
                  {selectorParqueAbierto && (
                    <div className="absolute z-30 mt-2 w-full min-w-0 overflow-hidden rounded-xl border border-white/10 bg-[#0B212D] shadow-2xl">
                      <div className="border-b border-white/10 p-4">
                        <div className="flex min-w-0 items-center gap-2 rounded-xl border border-white/20 bg-[#071923] px-3">
                          <Search size={18} className="shrink-0 text-slate-400" />
                          <input
                            autoFocus
                            type="text"
                            value={busquedaParque}
                            onChange={(e) => setBusquedaParque(e.target.value)}
                            placeholder="Buscar parque por ubicación, finca, plano..."
                            className="w-full min-w-0 py-3 text-base text-white bg-transparent outline-none placeholder-slate-500"
                          />
                        </div>
                      </div>
                      <div className="max-h-64 min-w-0 overflow-x-hidden overflow-y-auto p-2">
                        {parquesSelector.length === 0 ? (
                          <p className="p-4 text-center text-sm text-slate-400">
                            No se encontraron parques.
                          </p>
                        ) : (
                          parquesSelector.map((parque) => (
                            <button
                              key={parque.id_parque}
                              type="button"
                              onClick={() => seleccionarParque(parque)}
                              className="block w-full min-w-0 overflow-hidden rounded-lg px-4 py-3 text-left hover:bg-white/10 transition-colors"
                            >
                              <p className="max-w-full break-all font-bold text-white">
                                {parque.ubicacion}
                              </p>
                              <p className="mt-1 max-w-full break-all text-xs text-slate-400">
                                {parque.numero_finca
                                  ? `Finca ${parque.numero_finca}`
                                  : 'Sin número de finca'}
                                {parque.distrito?.nombre_distrito
                                  ? ` · ${parque.distrito.nombre_distrito}`
                                  : ''}
                              </p>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <label className="mb-3 block text-base font-bold text-slate-300">
                    Nombre del mantenimiento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nombre_mantenimiento"
                    value={formulario.nombre_mantenimiento}
                    onChange={manejarCambio}
                    maxLength={100}
                    className="w-full min-w-0 rounded-xl border border-white/20 bg-[#071923] p-4 text-base text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="Ej. Reparación de malla"
                  />
                  <p className="mt-2 text-right text-xs text-slate-500">
                    {formulario.nombre_mantenimiento.length}/100
                  </p>
                </div>
                <div className="min-w-0">
                  <label className="mb-3 block text-base font-bold text-slate-300">
                    Fecha <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="fecha_mantenimiento"
                    value={formulario.fecha_mantenimiento}
                    onChange={manejarCambio}
                    className="w-full min-w-0 rounded-xl border border-white/20 bg-[#071923] p-4 text-base text-white focus:border-emerald-500 focus:outline-none [color-scheme:dark]"
                  />
                </div>
                <div className="min-w-0 md:col-span-2">
                  <label className="mb-3 block text-base font-bold text-slate-300">
                    Descripción <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="descripcion"
                    value={formulario.descripcion}
                    onChange={manejarCambio}
                    maxLength={500}
                    rows={4}
                    className="w-full min-w-0 resize-none rounded-xl border border-white/20 bg-[#071923] p-4 text-base text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="Describa el mantenimiento realizado..."
                  />
                  <p className="mt-2 text-right text-xs text-slate-500">
                    {formulario.descripcion.length}/500
                  </p>
                </div>
                <div className="min-w-0">
                  <label className="mb-3 block text-base font-bold text-slate-300">
                    Inversión realizada (₡) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    name="inversion"
                    value={formulario.inversion}
                    onChange={manejarCambioInversion}
                    maxLength={13}
                    className="w-full min-w-0 rounded-xl border border-white/20 bg-[#071923] p-4 text-base text-white font-bold focus:border-emerald-500 focus:outline-none"
                    placeholder="Ej. 125000.00"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Máximo 10 enteros y 2 decimales.
                  </p>
                </div>
                <div className="min-w-0 md:col-span-2">
                  <label className="mb-3 block text-base font-bold text-slate-300">
                    Descripción de la inversión <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="descripcion_inversion"
                    value={formulario.descripcion_inversion}
                    onChange={manejarCambio}
                    maxLength={500}
                    rows={3}
                    className="w-full min-w-0 resize-none rounded-xl border border-white/20 bg-[#071923] p-4 text-base text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="Ej. Compra de pintura, materiales y mano de obra..."
                  />
                  <p className="mt-2 text-right text-xs text-slate-500">
                    {formulario.descripcion_inversion.length}/500
                  </p>
                </div>
                <div className="min-w-0 md:col-span-2">
                  <div className="mb-4 flex min-w-0 flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-xl font-bold text-white">
                        Evidencias fotográficas
                      </h3>
                      <p className="mt-1 text-sm text-slate-400">
                        Puede agregar varias imágenes antes y después. Máximo {MAX_IMAGENES_POR_TIPO} por sección y 5 MB por imagen.
                      </p>
                    </div>
                  </div>
                  <div className="grid min-w-0 gap-6 lg:grid-cols-2">
                    <SelectorVariasImagenes
                      titulo="Antes del mantenimiento"
                      tipo="ANTES"
                      imagenesLocales={imagenesAntes}
                      imagenesServidor={imagenesServidorAntes}
                      procesando={procesando}
                      onChange={(e) => manejarVariasImagenes(e, 'ANTES')}
                      onEliminarLocal={(id) => eliminarImagenLocal('ANTES', id)}
                      onEliminarServidor={eliminarImagenServidor}
                      onAbrirServidor={(indice) =>
                        abrirGaleria(
                          imagenesServidorAntes,
                          indice,
                          'Imágenes antes del mantenimiento',
                        )
                      }
                    />
                    <SelectorVariasImagenes
                      titulo="Después del mantenimiento"
                      tipo="DESPUES"
                      imagenesLocales={imagenesDespues}
                      imagenesServidor={imagenesServidorDespues}
                      procesando={procesando}
                      onChange={(e) => manejarVariasImagenes(e, 'DESPUES')}
                      onEliminarLocal={(id) => eliminarImagenLocal('DESPUES', id)}
                      onEliminarServidor={eliminarImagenServidor}
                      onAbrirServidor={(indice) =>
                        abrirGaleria(
                          imagenesServidorDespues,
                          indice,
                          'Imágenes después del mantenimiento',
                        )
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="mt-12 flex justify-end gap-5 border-t border-white/10 pt-10 flex-shrink-0">
                <button
                  type="button"
                  onClick={cerrarFormulario}
                  disabled={procesando}
                  className="rounded-xl bg-white/10 px-8 py-3 text-base font-bold text-white hover:bg-white/20 disabled:opacity-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={procesando}
                  className="rounded-xl bg-[#315F73] px-8 py-3 text-base font-bold text-white hover:bg-[#244C5F] disabled:opacity-50 transition-colors"
                >
                  {procesando
                    ? 'Guardando...'
                    : modoEdicion
                      ? 'Guardar cambios'
                      : 'Registrar mantenimiento'}
                </button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      )}
      {/* =================================================
          MODAL INFORMACIÓN - GRANDE Y SIN DOBLE SCROLL
      ================================================= */}
      {modalInformacion && mantenimientoSeleccionado && (
        <ModalOverlay onClose={cerrarInformacion}>
          <div
            className="flex h-[85vh] w-full min-w-0 max-w-7xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0B212D] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-10 py-7 flex-shrink-0">
              <div className="min-w-0 flex-1 pr-4">
                <h2 className="truncate text-3xl font-black text-white tracking-tighter">
                  Información del mantenimiento
                </h2>
                <p className="mt-2 max-w-full truncate text-base text-slate-400" title={mantenimientoSeleccionado.nombre_mantenimiento}>
                  {mantenimientoSeleccionado.nombre_mantenimiento}
                </p>
              </div>
              <button
                type="button"
                onClick={cerrarInformacion}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors text-xl font-bold"
              >
                ✕
              </button>
            </div>
            <div className="min-w-0 flex-1 overflow-y-auto p-10">
              <div className="grid min-w-0 gap-6 md:grid-cols-2">
                <InfoCard label="Parque">
                  <p className="max-w-full break-all font-bold text-white">
                    {mantenimientoSeleccionado.parque?.ubicacion || 'Sin ubicación'}
                  </p>
                </InfoCard>
                <InfoCard label="Distrito">
                  <p className="max-w-full break-all text-slate-300">
                    {mantenimientoSeleccionado.parque?.distrito?.nombre_distrito || '—'}
                  </p>
                </InfoCard>
                <InfoCard label="Nombre del mantenimiento">
                  <p className="max-w-full break-all font-bold text-white">
                    {mantenimientoSeleccionado.nombre_mantenimiento}
                  </p>
                </InfoCard>
                <InfoCard label="Fecha">
                  <p className="font-semibold text-slate-300">
                    {formatearFecha(mantenimientoSeleccionado.fecha_mantenimiento)}
                  </p>
                </InfoCard>
                <InfoCard label="Inversión realizada">
                  <p className="text-2xl font-black text-emerald-400">
                    {formatearInversion(mantenimientoSeleccionado.inversion)}
                  </p>
                </InfoCard>
                <InfoCard label="Descripción de la inversión" className="md:col-span-2">
                  <p className="max-w-full whitespace-pre-wrap break-all text-base leading-relaxed text-slate-300">
                    {mantenimientoSeleccionado.descripcion_inversion || '—'}
                  </p>
                </InfoCard>
                <InfoCard label="Descripción del mantenimiento" className="md:col-span-2">
                  <p className="max-w-full whitespace-pre-wrap break-all text-base leading-relaxed text-slate-300">
                    {mantenimientoSeleccionado.descripcion}
                  </p>
                </InfoCard>
              </div>
              <div className="mt-10 grid min-w-0 gap-6 lg:grid-cols-2">
                <GaleriaMiniaturas
                  titulo="Antes del mantenimiento"
                  imagenes={imagenesServidorAntes}
                  onAbrir={(indice) =>
                    abrirGaleria(
                      imagenesServidorAntes,
                      indice,
                      'Imágenes antes del mantenimiento',
                    )
                  }
                />
                <GaleriaMiniaturas
                  titulo="Después del mantenimiento"
                  imagenes={imagenesServidorDespues}
                  onAbrir={(indice) =>
                    abrirGaleria(
                      imagenesServidorDespues,
                      indice,
                      'Imágenes después del mantenimiento',
                    )
                  }
                />
              </div>
              <div className="mt-12 flex justify-end flex-shrink-0 pb-5">
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
        </ModalOverlay>
      )}
      {/* =================================================
          MODAL ELIMINAR - GRANDE Y SIN DOBLE SCROLL
      ================================================= */}
      {modalEliminar && mantenimientoSeleccionado && (
        <ModalOverlay onClose={cerrarEliminar}>
          <div
            className="flex max-h-[90vh] w-full min-w-0 max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0B212D] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-10 py-7 flex-shrink-0">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tighter">
                  Eliminar mantenimiento
                </h2>
                <p className="mt-2 text-base text-slate-400">
                  Esta acción no se puede deshacer.
                </p>
              </div>
              <button
                type="button"
                onClick={cerrarEliminar}
                disabled={procesando}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors text-xl font-bold disabled:opacity-50"
              >
                ✕
              </button>
            </div>
            <div className="min-w-0 overflow-y-auto px-10 py-10">
              <div className="rounded-2xl border border-red-500/30 bg-red-900/30 p-8 text-center flex flex-col items-center justify-center">
                <p className="text-base text-red-300">
                  ¿Está seguro de que desea eliminar permanentemente el mantenimiento?
                </p>
                <p className="mt-6 text-3xl font-black text-white tracking-tight break-all">
                  {mantenimientoSeleccionado.nombre_mantenimiento}
                </p>
                <p className="mt-3 text-lg text-slate-400 break-all">
                  del parque <strong className="text-white">{mantenimientoSeleccionado.parque?.ubicacion || 'Sin ubicación'}</strong>
                </p>
              </div>
              <p className="mt-8 text-center text-sm font-semibold text-slate-400">
                También se eliminarán todas las imágenes asociadas a este mantenimiento.
              </p>
            </div>
            <div className="flex justify-end gap-5 border-t border-white/10 px-10 py-7 flex-shrink-0">
              <button
                type="button"
                onClick={cerrarEliminar}
                disabled={procesando}
                className="rounded-xl bg-white/10 px-8 py-3 text-base font-bold text-white hover:bg-white/20 disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={eliminarMantenimiento}
                disabled={procesando}
                className="rounded-xl bg-red-600 px-8 py-3 text-base font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {procesando ? 'Eliminando...' : 'Sí, eliminar permanentemente'}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
      {/* =================================================
          GALERÍA GRANDE
      ================================================= */}
      {galeriaAbierta && galeriaImagenes.length > 0 && (
        <div
          className="fixed inset-0 z-[100] flex min-w-0 items-center justify-center overflow-hidden bg-black/95 backdrop-blur-md p-3 sm:p-6"
          onClick={() => setGaleriaAbierta(false)}
        >
          <div
            className="flex h-full w-full min-w-0 max-w-7xl flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex min-w-0 items-center justify-between gap-4 pb-4 text-white">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xl font-bold tracking-tight">
                  {galeriaTitulo}
                </p>
                <p className="text-sm text-white/60 font-semibold mt-1">
                  Imagen {galeriaIndice + 1} de {galeriaImagenes.length}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGaleriaAbierta(false)}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <X size={26} />
              </button>
            </div>
            <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-2xl bg-black/40 border border-white/10">
              <img
                src={galeriaImagenes[galeriaIndice].url}
                alt={`${galeriaTitulo} ${galeriaIndice + 1}`}
                className="max-h-full max-w-full object-contain"
              />
              {galeriaImagenes.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={anteriorGaleria}
                    className="absolute left-4 rounded-full bg-black/60 p-4 text-white hover:bg-black/80 transition-colors backdrop-blur-md"
                  >
                    <ChevronLeft size={30} />
                  </button>
                  <button
                    type="button"
                    onClick={siguienteGaleria}
                    className="absolute right-4 rounded-full bg-black/60 p-4 text-white hover:bg-black/80 transition-colors backdrop-blur-md"
                  >
                    <ChevronRight size={30} />
                  </button>
                </>
              )}
            </div>
            {galeriaImagenes.length > 1 && (
              <div className="mt-4 flex max-w-full gap-3 overflow-x-auto pb-2 custom-scrollbar">
                {galeriaImagenes.map((imagen, indice) => (
                  <button
                    key={imagen.id_imagen}
                    type="button"
                    onClick={() => setGaleriaIndice(indice)}
                    className={`h-24 w-32 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                      indice === galeriaIndice
                        ? 'border-emerald-500 scale-105 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                        : 'border-transparent opacity-50 hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    <img
                      src={imagen.url}
                      alt="Miniatura"
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
// ======================================================
// COMPONENTES AUXILIARES (CON DISEÑO DARK GLASSMORPHISM)
// ======================================================
function ModalOverlay({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex min-w-0 items-center justify-center overflow-hidden bg-black/60 backdrop-blur-sm p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {children}
    </div>
  );
}
function CampoFiltro({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="min-w-0">
      <label className="mb-1.5 block text-sm font-medium text-slate-300">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full min-w-0 rounded-xl border border-white/20 bg-[#071923]/50 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
      />
    </div>
  );
}
function IndicadorCantidad({ cantidad }: { cantidad: number }) {
  return (
    <span
      className={`inline-flex min-w-8 items-center justify-center rounded-md border px-2.5 py-1 text-xs font-bold ${
        cantidad > 0
          ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
          : 'bg-slate-500/20 border-slate-500/30 text-slate-300'
      }`}
      title={`${cantidad} imagen${cantidad === 1 ? '' : 'es'}`}
    >
      {cantidad}
    </span>
  );
}
function SelectorVariasImagenes({
  titulo,
  tipo,
  imagenesLocales,
  imagenesServidor,
  procesando,
  onChange,
  onEliminarLocal,
  onEliminarServidor,
  onAbrirServidor,
}: {
  titulo: string;
  tipo: TipoImagen;
  imagenesLocales: ImagenLocal[];
  imagenesServidor: ImagenServidor[];
  procesando: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onEliminarLocal: (id: string) => void;
  onEliminarServidor: (imagen: ImagenServidor) => void;
  onAbrirServidor: (indice: number) => void;
}) {
  const total = imagenesLocales.length + imagenesServidor.length;
  const inputId = `imagenes-${tipo.toLowerCase()}`;
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-white">{titulo}</p>
          <p className="text-sm font-semibold text-emerald-400 mt-0.5">
            {total}/{MAX_IMAGENES_POR_TIPO} imágenes agregadas
          </p>
        </div>
        <Camera size={26} className="shrink-0 text-[#18843B]" />
      </div>
      <label
        htmlFor={inputId}
        className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/20 bg-[#071923]/50 px-4 py-6 text-sm font-bold text-slate-300 transition hover:border-emerald-500 hover:text-emerald-400 hover:bg-white/5"
      >
        <Upload size={20} />
        Subir imágenes
      </label>
      <input
        id={inputId}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={onChange}
        disabled={procesando || total >= MAX_IMAGENES_POR_TIPO}
        className="hidden"
      />
      {total === 0 ? (
        <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-8 text-center">
          <ImageIcon size={36} className="mx-auto mb-3 text-slate-500" />
          <p className="text-sm font-medium text-slate-400">No hay imágenes agregadas en esta sección.</p>
        </div>
      ) : (
        <div className="mt-5 grid min-w-0 grid-cols-2 gap-4 sm:grid-cols-3">
          {imagenesServidor.map((imagen, indice) => (
            <div
              key={`server-${imagen.id_imagen}`}
              className="group relative aspect-square min-w-0 overflow-hidden rounded-xl border border-white/10 bg-black"
            >
              <button
                type="button"
                onClick={() => onAbrirServidor(indice)}
                className="h-full w-full"
                title="Ver imagen en grande"
              >
                <img
                  src={imagen.url}
                  alt={`${titulo} ${indice + 1}`}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                />
              </button>
              <button
                type="button"
                onClick={() => onEliminarServidor(imagen)}
                disabled={procesando}
                className="absolute right-2 top-2 rounded-full bg-red-600 p-2 text-white shadow-lg transition-transform hover:scale-110 hover:bg-red-700 disabled:opacity-50"
                title="Eliminar imagen guardada"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {imagenesLocales.map((imagen, indice) => (
            <div
              key={imagen.id}
              className="relative aspect-square min-w-0 overflow-hidden rounded-xl border border-white/10 bg-black"
            >
              <img
                src={imagen.preview}
                alt={`Nueva ${titulo.toLowerCase()} ${indice + 1}`}
                className="h-full w-full object-cover opacity-90"
              />
              <button
                type="button"
                onClick={() => onEliminarLocal(imagen.id)}
                disabled={procesando}
                className="absolute right-2 top-2 rounded-full bg-red-600 p-2 text-white shadow-lg transition-transform hover:scale-110 hover:bg-red-700 disabled:opacity-50"
                title="Quitar imagen"
              >
                <X size={16} />
              </button>
              <span className="absolute bottom-2 left-2 rounded-md bg-emerald-500/90 px-2 py-1 text-xs font-bold text-white shadow-md backdrop-blur-sm">
                NUEVA
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function GaleriaMiniaturas({
  titulo,
  imagenes,
  onAbrir,
}: {
  titulo: string;
  imagenes: ImagenServidor[];
  onAbrir: (indice: number) => void;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="mb-5 flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold text-white">
            {titulo}
          </h3>
          <p className="text-sm font-semibold text-emerald-400 mt-1">
            {imagenes.length} imagen{imagenes.length === 1 ? '' : 'es'} registrada{imagenes.length === 1 ? '' : 's'}
          </p>
        </div>
        <Camera size={26} className="shrink-0 text-[#18843B]" />
      </div>
      {imagenes.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-black/20 p-10 text-center">
          <ImageIcon size={36} className="mx-auto mb-3 text-slate-500" />
          <p className="text-sm font-medium text-slate-400">No se adjuntaron imágenes en esta etapa.</p>
        </div>
      ) : (
        <div className="grid min-w-0 grid-cols-2 gap-4 sm:grid-cols-3">
          {imagenes.map((imagen, indice) => (
            <button
              key={imagen.id_imagen}
              type="button"
              onClick={() => onAbrir(indice)}
              className="group relative aspect-square min-w-0 overflow-hidden rounded-xl border border-white/10 bg-black"
              title="Ver imagen en grande"
            >
              <img
                src={imagen.url}
                alt={`${titulo} ${indice + 1}`}
                className="h-full w-full object-cover opacity-80 transition-all duration-300 group-hover:scale-110 group-hover:opacity-100"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/30">
                <Eye className="text-white opacity-0 drop-shadow-lg transition-opacity duration-300 group-hover:opacity-100" size={32} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
function InfoCard({
  label,
  children,
  className = '',
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 ${className}`}
    >
      <p className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <div className="min-w-0 max-w-full overflow-hidden text-lg">{children}</div>
    </div>
  );
}

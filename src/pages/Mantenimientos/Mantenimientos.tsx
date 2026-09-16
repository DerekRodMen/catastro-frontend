import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import axios from 'axios';
import type { AxiosError } from 'axios';
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

import Header from '../../components/Header';

// ======================================================
// AXIOS
// ======================================================

const api = axios.create({
  baseURL: '/api',
});

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

export default function Mantenimientos() {
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
  // CARGA DE DATOS
  // ====================================================

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

  const liberarImagenesLocales = (imagenes: ImagenLocal[]) => {
    imagenes.forEach((imagen) => URL.revokeObjectURL(imagen.preview));
  };

  const liberarImagenesServidor = (imagenes: ImagenServidor[]) => {
    imagenes.forEach((imagen) => URL.revokeObjectURL(imagen.url));
  };

  const limpiarImagenesLocales = () => {
    liberarImagenesLocales(imagenesAntes);
    liberarImagenesLocales(imagenesDespues);
    setImagenesAntes([]);
    setImagenesDespues([]);
  };

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

  const seleccionarParque = (parque: Parque) => {
    setFormulario((anterior) => ({
      ...anterior,
      id_parque: String(parque.id_parque),
    }));
    setBusquedaParque(parque.ubicacion);
    setSelectorParqueAbierto(false);
  };

  // ====================================================
  // FILTROS
  // ====================================================

  // ============================================
  // PAGINACIÓN
  // ============================================

  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);

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

  const mostrarExito = (mensaje: string) => {
    setError('');
    setExito(mensaje);
    window.setTimeout(() => setExito(''), 3500);
  };

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

  const abrirInformacion = async (mantenimiento: Mantenimiento) => {
    limpiarImagenesServidor();
    setMantenimientoSeleccionado(mantenimiento);
    setModalInformacion(true);
    await cargarImagenesServidor(mantenimiento);
  };

  const abrirEliminar = (mantenimiento: Mantenimiento) => {
    setMantenimientoSeleccionado(mantenimiento);
    setModalEliminar(true);
  };

  const cerrarFormulario = () => {
    if (procesando) return;
    setModalFormulario(false);
    setSelectorParqueAbierto(false);
    limpiarImagenesLocales();
    limpiarImagenesServidor();
  };

  const cerrarInformacion = () => {
    setModalInformacion(false);
    setGaleriaAbierta(false);
    limpiarImagenesServidor();
  };

  const cerrarEliminar = () => {
    if (procesando) return;
    setModalEliminar(false);
    setMantenimientoSeleccionado(null);
  };

  // ====================================================
  // FORMULARIO
  // ====================================================

  const manejarCambio = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  };

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

  const eliminarImagenLocal = (tipo: TipoImagen, id: string) => {
    const setter = tipo === 'ANTES' ? setImagenesAntes : setImagenesDespues;

    setter((actuales) => {
      const imagen = actuales.find((item) => item.id === id);
      if (imagen) URL.revokeObjectURL(imagen.preview);
      return actuales.filter((item) => item.id !== id);
    });
  };

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

  const anteriorGaleria = () => {
    setGaleriaIndice((indice) =>
      galeriaImagenes.length
        ? (indice - 1 + galeriaImagenes.length) % galeriaImagenes.length
        : 0,
    );
  };

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

  const formatearFecha = (fecha: string) => {
    if (!fecha) return '—';
    const [year, month, day] = fecha.slice(0, 10).split('-');
    return `${day}/${month}/${year}`;
  };

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
    <div className="min-h-screen bg-[#F4F7F8]">
      <Header
        title="Mantenimientos"
        description="Registro y seguimiento de los mantenimientos realizados en los parques municipales."
      />

      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        {exito && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
            <CheckCircle2 size={20} />
            {exito}
          </div>
        )}

        {error && !modalFormulario && !modalEliminar && (
          <div className="mb-5 flex min-w-0 items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <span className="min-w-0 break-words">{error}</span>
            <button
              type="button"
              className="shrink-0"
              onClick={() => setError('')}
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-2xl font-bold text-[#16313E]">
              <Wrench className="shrink-0 text-[#315F73]" />
              <span className="truncate">Gestión de mantenimientos</span>
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {mantenimientos.length} mantenimiento
              {mantenimientos.length !== 1 ? 's' : ''} registrado
              {mantenimientos.length !== 1 ? 's' : ''}.
            </p>
          </div>

          <button
            type="button"
            onClick={abrirNuevo}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#315F73] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#244C5F]"
          >
            <Plus size={19} />
            Nuevo mantenimiento
          </button>
        </div>

        {/* FILTROS */}
        <section className="mb-6 rounded-2xl border border-[#D9E2E7] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 font-semibold text-[#16313E]">
                <Search size={18} />
                Filtros de búsqueda
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Puede combinar varios filtros.
              </p>
            </div>

            {hayFiltrosActivos && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="text-sm font-semibold text-[#315F73] hover:underline"
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
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Fecha desde
              </label>
              <input
                type="date"
                value={filtroFechaDesde}
                onChange={(e) => setFiltroFechaDesde(e.target.value)}
                className="w-full min-w-0 rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#315F73] focus:ring-2 focus:ring-[#315F73]/10"
              />
            </div>

            <div className="min-w-0">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Fecha hasta
              </label>
              <input
                type="date"
                value={filtroFechaHasta}
                onChange={(e) => setFiltroFechaHasta(e.target.value)}
                className="w-full min-w-0 rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#315F73] focus:ring-2 focus:ring-[#315F73]/10"
              />
            </div>

            <div className="min-w-0">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Evidencias
              </label>
              <select
                value={filtroEvidencia}
                onChange={(e) =>
                  setFiltroEvidencia(e.target.value as TipoEvidencia)
                }
                className="w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#315F73]"
              >
                <option value="todas">Todas</option>
                <option value="ambas">Antes y después</option>
                <option value="solo_antes">Solo imágenes antes</option>
                <option value="solo_despues">Solo imágenes después</option>
                <option value="sin_imagenes">Sin imágenes</option>
              </select>
            </div>
          </div>
        </section>

        {/* TABLA */}
        <section className="overflow-hidden rounded-2xl border border-[#D9E2E7] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] table-fixed divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="w-[21%] px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                    Parque
                  </th>
                  <th className="w-[14%] px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                    Mantenimiento
                  </th>
                  <th className="w-[17%] px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                    Descripción
                  </th>
                  <th className="w-[12%] px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                    Inversión
                  </th>
                  <th className="w-[10%] px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                    Fecha
                  </th>
                  <th className="w-[7%] px-5 py-3.5 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
                    Antes
                  </th>
                  <th className="w-[7%] px-5 py-3.5 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
                    Después
                  </th>
                  <th className="w-[12%] px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {cargando ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-14 text-center text-sm text-slate-500">
                      Cargando mantenimientos...
                    </td>
                  </tr>
                ) : mantenimientosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-14 text-center">
                      <Wrench size={34} className="mx-auto mb-3 text-slate-300" />
                      <p className="font-medium text-slate-600">
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
                        className="transition hover:bg-slate-50"
                      >
                        <td className="min-w-0 px-5 py-4 align-top">
                          <div className="min-w-0 overflow-hidden">
                            <p
                              className="block max-w-full truncate font-semibold text-[#16313E]"
                              title={mantenimiento.parque?.ubicacion || 'Sin ubicación'}
                            >
                              {mantenimiento.parque?.ubicacion || 'Sin ubicación'}
                            </p>

                            {mantenimiento.parque?.numero_finca && (
                              <p
                                className="mt-0.5 block max-w-full truncate text-xs text-slate-500"
                                title={`Finca: ${mantenimiento.parque.numero_finca}`}
                              >
                                Finca: {mantenimiento.parque.numero_finca}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="min-w-0 px-5 py-4 align-top">
                          <p
                            className="block max-w-full truncate font-medium text-slate-800"
                            title={mantenimiento.nombre_mantenimiento}
                          >
                            {mantenimiento.nombre_mantenimiento}
                          </p>
                        </td>

                        <td className="min-w-0 px-5 py-4 align-top text-sm text-slate-600">
                          <p
                            className="line-clamp-2 max-w-full break-words"
                            title={mantenimiento.descripcion}
                          >
                            {mantenimiento.descripcion}
                          </p>
                        </td>

                        <td className="min-w-0 px-5 py-4 align-top text-sm font-semibold text-slate-700">
                          <p
                            className="max-w-full truncate"
                            title={formatearInversion(mantenimiento.inversion)}
                          >
                            {formatearInversion(mantenimiento.inversion)}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 align-top text-sm text-slate-700">
                          {formatearFecha(mantenimiento.fecha_mantenimiento)}
                        </td>

                        <td className="px-5 py-4 text-center align-top">
                          <IndicadorCantidad cantidad={cantidadAntes} />
                        </td>

                        <td className="px-5 py-4 text-center align-top">
                          <IndicadorCantidad cantidad={cantidadDespues} />
                        </td>

                        <td className="px-5 py-4 align-top">
                          <div className="flex flex-col items-start gap-2">
                            <button
                              type="button"
                              title="Información"
                              onClick={() => abrirInformacion(mantenimiento)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-100"
                            >
                              <Eye size={15} />
                              Información
                            </button>

                            <button
                              type="button"
                              title="Editar"
                              onClick={() => abrirEditar(mantenimiento)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                            >
                              <Edit3 size={15} />
                              Editar
                            </button>

                            <button
                              type="button"
                              title="Eliminar"
                              onClick={() => abrirEliminar(mantenimiento)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
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
                <div className="flex flex-col gap-4 border-t border-[#D9E2E7] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                    <span>
                      Mostrando <strong>{indiceInicial + 1}</strong> a 
                      <strong>{Math.min(indiceFinal, mantenimientosFiltrados.length)}</strong> de 
                      <strong>{mantenimientosFiltrados.length}</strong> mantenimientos
                    </span>

                    <label className="flex items-center gap-2">
                      <span>Registros por página:</span>
                      <select
                        value={registrosPorPagina}
                        onChange={(event) => setRegistrosPorPagina(Number(event.target.value))}
                        className="rounded-lg border border-[#D9E2E7] bg-white px-2 py-1.5 text-sm text-[#16313E] outline-none focus:border-[#315F73]"
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
                      className="rounded-lg border border-[#D9E2E7] px-3 py-2 text-sm font-medium text-[#315F73] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ← Anterior
                    </button>

                    {Array.from({ length: totalPaginas }, (_, indice) => indice + 1).map((pagina) => (
                      <button
                        key={pagina}
                        type="button"
                        onClick={() => setPaginaActual(pagina)}
                        className={`min-w-9 rounded-lg px-3 py-2 text-sm font-semibold ${
                          paginaActual === pagina
                            ? 'bg-[#315F73] text-white'
                            : 'border border-[#D9E2E7] bg-white text-[#315F73] hover:bg-slate-50'
                        }`}
                      >
                        {pagina}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setPaginaActual((pagina) => Math.min(totalPaginas, pagina + 1))}
                      disabled={paginaActual === totalPaginas}
                      className="rounded-lg border border-[#D9E2E7] px-3 py-2 text-sm font-medium text-[#315F73] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
          MODAL CREAR / EDITAR
      ================================================= */}
      {modalFormulario && (
        <ModalOverlay onClose={cerrarFormulario}>
          <div
            className="flex max-h-[90vh] w-full min-w-0 max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex min-w-0 items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-xl font-bold text-[#16313E]">
                  {modoEdicion ? 'Editar mantenimiento' : 'Nuevo mantenimiento'}
                </h2>
                <p className="mt-1 break-words text-sm text-slate-500">
                  Registre la información y las evidencias fotográficas.
                </p>
              </div>

              <button
                type="button"
                onClick={cerrarFormulario}
                disabled={procesando}
                className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={21} />
              </button>
            </div>

            <form
              onSubmit={guardarMantenimiento}
              className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-6 py-5"
            >
              {error && (
                <div className="mb-5 min-w-0 overflow-hidden rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <p className="break-words">{error}</p>
                </div>
              )}

              <div className="grid min-w-0 gap-5 md:grid-cols-2">
                {/* PARQUE */}
                <div className="relative min-w-0 md:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Parque <span className="text-red-500">*</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setSelectorParqueAbierto((anterior) => !anterior)}
                    className="flex w-full min-w-0 items-center justify-between gap-3 overflow-hidden rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-left text-sm outline-none"
                  >
                    <span
                      className={`min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap ${
                        parqueSeleccionado ? 'text-slate-800' : 'text-slate-400'
                      }`}
                      title={parqueSeleccionado?.ubicacion || ''}
                    >
                      {parqueSeleccionado
                        ? parqueSeleccionado.ubicacion
                        : 'Seleccione un parque'}
                    </span>
                    <ChevronDown size={18} className="shrink-0 text-slate-400" />
                  </button>

                  {selectorParqueAbierto && (
                    <div className="absolute z-30 mt-2 w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                      <div className="border-b border-slate-200 p-3">
                        <div className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-300 px-3">
                          <Search size={16} className="shrink-0 text-slate-400" />
                          <input
                            autoFocus
                            type="text"
                            value={busquedaParque}
                            onChange={(e) => setBusquedaParque(e.target.value)}
                            placeholder="Buscar parque..."
                            className="w-full min-w-0 py-2.5 text-sm outline-none"
                          />
                        </div>
                      </div>

                      <div className="max-h-64 min-w-0 overflow-x-hidden overflow-y-auto p-2">
                        {parquesSelector.length === 0 ? (
                          <p className="p-4 text-center text-sm text-slate-500">
                            No se encontraron parques.
                          </p>
                        ) : (
                          parquesSelector.map((parque) => (
                            <button
                              key={parque.id_parque}
                              type="button"
                              onClick={() => seleccionarParque(parque)}
                              className="block w-full min-w-0 overflow-hidden rounded-lg px-3 py-2.5 text-left hover:bg-slate-50"
                            >
                              <p className="max-w-full break-all font-medium text-slate-800">
                                {parque.ubicacion}
                              </p>
                              <p className="mt-0.5 max-w-full break-all text-xs text-slate-500">
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
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Nombre del mantenimiento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nombre_mantenimiento"
                    value={formulario.nombre_mantenimiento}
                    onChange={manejarCambio}
                    maxLength={100}
                    className="w-full min-w-0 rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#315F73] focus:ring-2 focus:ring-[#315F73]/10"
                    placeholder="Ej. Reparación de malla"
                  />
                  <p className="mt-1 text-right text-xs text-slate-400">
                    {formulario.nombre_mantenimiento.length}/100
                  </p>
                </div>

                <div className="min-w-0">
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Fecha <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="fecha_mantenimiento"
                    value={formulario.fecha_mantenimiento}
                    onChange={manejarCambio}
                    className="w-full min-w-0 rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#315F73] focus:ring-2 focus:ring-[#315F73]/10"
                  />
                </div>

                <div className="min-w-0 md:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Descripción <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="descripcion"
                    value={formulario.descripcion}
                    onChange={manejarCambio}
                    maxLength={500}
                    rows={4}
                    className="w-full min-w-0 resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#315F73] focus:ring-2 focus:ring-[#315F73]/10"
                    placeholder="Describa el mantenimiento realizado..."
                  />
                  <p className="mt-1 text-right text-xs text-slate-400">
                    {formulario.descripcion.length}/500
                  </p>
                </div>

                <div className="min-w-0">
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Inversión realizada (₡) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    name="inversion"
                    value={formulario.inversion}
                    onChange={manejarCambioInversion}
                    maxLength={13}
                    className="w-full min-w-0 rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#315F73] focus:ring-2 focus:ring-[#315F73]/10"
                    placeholder="Ej. 125000.00"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Máximo 10 enteros y 2 decimales.
                  </p>
                </div>

                <div className="min-w-0 md:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Descripción de la inversión <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="descripcion_inversion"
                    value={formulario.descripcion_inversion}
                    onChange={manejarCambio}
                    maxLength={500}
                    rows={3}
                    className="w-full min-w-0 resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#315F73] focus:ring-2 focus:ring-[#315F73]/10"
                    placeholder="Ej. Compra de pintura, materiales y mano de obra..."
                  />
                  <p className="mt-1 text-right text-xs text-slate-400">
                    {formulario.descripcion_inversion.length}/500
                  </p>
                </div>

                <div className="min-w-0 md:col-span-2">
                  <div className="mb-3 flex min-w-0 flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-[#16313E]">
                        Evidencias fotográficas
                      </h3>
                      <p className="text-xs text-slate-500">
                        Puede agregar varias imágenes antes y después. Máximo {MAX_IMAGENES_POR_TIPO} por sección y 5 MB por imagen.
                      </p>
                    </div>
                  </div>

                  <div className="grid min-w-0 gap-5 lg:grid-cols-2">
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

              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={cerrarFormulario}
                  disabled={procesando}
                  className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={procesando}
                  className="rounded-xl bg-[#315F73] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#244C5F] disabled:cursor-not-allowed disabled:opacity-60"
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
          MODAL INFORMACIÓN
      ================================================= */}
      {modalInformacion && mantenimientoSeleccionado && (
        <ModalOverlay onClose={cerrarInformacion}>
          <div
            className="flex max-h-[90vh] w-full min-w-0 max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex min-w-0 items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-xl font-bold text-[#16313E]">
                  Información del mantenimiento
                </h2>
                <p className="mt-1 max-w-full truncate text-sm text-slate-500" title={mantenimientoSeleccionado.nombre_mantenimiento}>
                  {mantenimientoSeleccionado.nombre_mantenimiento}
                </p>
              </div>

              <button
                type="button"
                onClick={cerrarInformacion}
                className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={21} />
              </button>
            </div>

            <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-6 py-5">
              <div className="grid min-w-0 gap-4 md:grid-cols-2">
                <InfoCard label="Parque">
                  <p className="max-w-full break-all font-medium text-[#16313E]">
                    {mantenimientoSeleccionado.parque?.ubicacion || 'Sin ubicación'}
                  </p>
                </InfoCard>

                <InfoCard label="Distrito">
                  <p className="max-w-full break-all text-slate-700">
                    {mantenimientoSeleccionado.parque?.distrito?.nombre_distrito || '—'}
                  </p>
                </InfoCard>

                <InfoCard label="Nombre del mantenimiento">
                  <p className="max-w-full break-all font-medium text-slate-800">
                    {mantenimientoSeleccionado.nombre_mantenimiento}
                  </p>
                </InfoCard>

                <InfoCard label="Fecha">
                  <p className="text-slate-700">
                    {formatearFecha(mantenimientoSeleccionado.fecha_mantenimiento)}
                  </p>
                </InfoCard>

                <InfoCard label="Inversión realizada">
                  <p className="font-semibold text-green-700">
                    {formatearInversion(mantenimientoSeleccionado.inversion)}
                  </p>
                </InfoCard>

                <InfoCard label="Descripción de la inversión" className="md:col-span-2">
                  <p className="max-w-full whitespace-pre-wrap break-all text-sm leading-6 text-slate-700">
                    {mantenimientoSeleccionado.descripcion_inversion || '—'}
                  </p>
                </InfoCard>

                <InfoCard label="Descripción del mantenimiento" className="md:col-span-2">
                  <p className="max-w-full whitespace-pre-wrap break-all text-sm leading-6 text-slate-700">
                    {mantenimientoSeleccionado.descripcion}
                  </p>
                </InfoCard>
              </div>

              <div className="mt-6 grid min-w-0 gap-5 lg:grid-cols-2">
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
            </div>

            <div className="flex justify-end border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={cerrarInformacion}
                className="rounded-xl bg-[#315F73] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#244C5F]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* =================================================
          MODAL ELIMINAR
      ================================================= */}
      {modalEliminar && mantenimientoSeleccionado && (
        <ModalOverlay onClose={cerrarEliminar}>
          <div
            className="w-full min-w-0 max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex min-w-0 items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-xl font-bold text-[#16313E]">
                  Eliminar mantenimiento
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Esta acción no se puede deshacer.
                </p>
              </div>
              <button
                type="button"
                onClick={cerrarEliminar}
                disabled={procesando}
                className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={21} />
              </button>
            </div>

            <div className="min-w-0 overflow-x-hidden px-6 py-5">
              <div className="min-w-0 overflow-hidden rounded-xl border border-red-100 bg-red-50 p-4">
                <p className="text-sm text-red-800">
                  ¿Está seguro de que desea eliminar el mantenimiento
                  <strong className="mx-1 break-all">
                    {mantenimientoSeleccionado.nombre_mantenimiento}
                  </strong>
                  del parque
                  <strong className="ml-1 break-all">
                    {mantenimientoSeleccionado.parque?.ubicacion || 'Sin ubicación'}
                  </strong>
                  ?
                </p>
              </div>

              <p className="mt-4 text-sm text-slate-500">
                También se eliminarán las imágenes asociadas a este mantenimiento.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cerrarEliminar}
                disabled={procesando}
                className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={eliminarMantenimiento}
                disabled={procesando}
                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {procesando ? 'Eliminando...' : 'Eliminar'}
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
          className="fixed inset-0 z-[100] flex min-w-0 items-center justify-center overflow-hidden bg-black/90 p-3 sm:p-6"
          onClick={() => setGaleriaAbierta(false)}
        >
          <div
            className="flex h-full w-full min-w-0 max-w-6xl flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex min-w-0 items-center justify-between gap-4 pb-3 text-white">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold sm:text-base">
                  {galeriaTitulo}
                </p>
                <p className="text-xs text-white/70">
                  {galeriaIndice + 1} de {galeriaImagenes.length}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setGaleriaAbierta(false)}
                className="shrink-0 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              >
                <X size={24} />
              </button>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-xl bg-black/30">
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
                    className="absolute left-3 rounded-full bg-black/50 p-2.5 text-white hover:bg-black/70"
                  >
                    <ChevronLeft size={26} />
                  </button>

                  <button
                    type="button"
                    onClick={siguienteGaleria}
                    className="absolute right-3 rounded-full bg-black/50 p-2.5 text-white hover:bg-black/70"
                  >
                    <ChevronRight size={26} />
                  </button>
                </>
              )}
            </div>

            {galeriaImagenes.length > 1 && (
              <div className="mt-3 flex max-w-full gap-2 overflow-x-auto pb-1">
                {galeriaImagenes.map((imagen, indice) => (
                  <button
                    key={imagen.id_imagen}
                    type="button"
                    onClick={() => setGaleriaIndice(indice)}
                    className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${
                      indice === galeriaIndice
                        ? 'border-white'
                        : 'border-transparent opacity-60 hover:opacity-100'
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
// COMPONENTES AUXILIARES
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
      className="fixed inset-0 z-50 flex min-w-0 items-center justify-center overflow-hidden bg-black/50 p-4"
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
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full min-w-0 rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#315F73] focus:ring-2 focus:ring-[#315F73]/10"
      />
    </div>
  );
}

function IndicadorCantidad({ cantidad }: { cantidad: number }) {
  return (
    <span
      className={`inline-flex min-w-7 items-center justify-center rounded-full px-2 py-1 text-xs font-semibold ${
        cantidad > 0
          ? 'bg-green-50 text-green-700'
          : 'bg-slate-100 text-slate-500'
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
    <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
      <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800">{titulo}</p>
          <p className="text-xs text-slate-500">
            {total}/{MAX_IMAGENES_POR_TIPO} imágenes
          </p>
        </div>
        <Camera size={20} className="shrink-0 text-[#315F73]" />
      </div>

      <label
        htmlFor={inputId}
        className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-[#315F73] transition hover:border-[#315F73] hover:bg-slate-50"
      >
        <Upload size={18} />
        Agregar imágenes
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
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 text-center">
          <ImageIcon size={28} className="mx-auto mb-2 text-slate-300" />
          <p className="text-xs text-slate-500">No hay imágenes agregadas.</p>
        </div>
      ) : (
        <div className="mt-4 grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3">
          {imagenesServidor.map((imagen, indice) => (
            <div
              key={`server-${imagen.id_imagen}`}
              className="group relative aspect-square min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white"
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
                  className="h-full w-full object-cover"
                />
              </button>

              <button
                type="button"
                onClick={() => onEliminarServidor(imagen)}
                disabled={procesando}
                className="absolute right-1.5 top-1.5 rounded-full bg-red-600 p-1.5 text-white shadow hover:bg-red-700 disabled:opacity-50"
                title="Eliminar imagen guardada"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {imagenesLocales.map((imagen, indice) => (
            <div
              key={imagen.id}
              className="relative aspect-square min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              <img
                src={imagen.preview}
                alt={`Nueva ${titulo.toLowerCase()} ${indice + 1}`}
                className="h-full w-full object-cover"
              />

              <button
                type="button"
                onClick={() => onEliminarLocal(imagen.id)}
                disabled={procesando}
                className="absolute right-1.5 top-1.5 rounded-full bg-red-600 p-1.5 text-white shadow hover:bg-red-700 disabled:opacity-50"
                title="Quitar imagen"
              >
                <X size={14} />
              </button>

              <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                Nueva
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
    <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
      <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-[#16313E]">
            {titulo}
          </h3>
          <p className="text-xs text-slate-500">
            {imagenes.length} imagen{imagenes.length === 1 ? '' : 'es'}
          </p>
        </div>
        <Camera size={20} className="shrink-0 text-[#315F73]" />
      </div>

      {imagenes.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
          <ImageIcon size={30} className="mx-auto mb-2 text-slate-300" />
          <p className="text-xs text-slate-500">No hay imágenes registradas.</p>
        </div>
      ) : (
        <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3">
          {imagenes.map((imagen, indice) => (
            <button
              key={imagen.id_imagen}
              type="button"
              onClick={() => onAbrir(indice)}
              className="group relative aspect-square min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white"
              title="Ver imagen en grande"
            >
              <img
                src={imagen.url}
                alt={`${titulo} ${indice + 1}`}
                className="h-full w-full object-cover transition group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
                <Eye className="text-white opacity-0 drop-shadow transition group-hover:opacity-100" />
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
      className={`min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/60 p-4 ${className}`}
    >
      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <div className="min-w-0 max-w-full overflow-hidden">{children}</div>
    </div>
  );
}

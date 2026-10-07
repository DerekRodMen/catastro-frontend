import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';
import WebMap from '@arcgis/core/WebMap';
import MapView from '@arcgis/core/views/MapView';
import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import Home from '@arcgis/core/widgets/Home';
import Locate from '@arcgis/core/widgets/Locate';
import LayerList from '@arcgis/core/widgets/LayerList';
import Expand from '@arcgis/core/widgets/Expand';
import '@arcgis/core/assets/esri/themes/light/main.css';
import { api } from '../../services/api';
import fondoGrecia from '../../assets/grecia-login.jpg';
import logoMunicipalidad from '../../assets/logo-municipalidad-grecia.webp';
import SidebarCatastro from '../../components/SidebarCatastro';
interface Parque {
  id_parque: number;
  ubicacion: string;
  latitud: number | string | null;
  longitud: number | string | null;
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
// ID del WebMap municipal utilizado en los visores de ArcGIS.
const WEB_MAP_ID = '3cbc884187ce4abd8cbff1b4f698cd53';
interface SelectorMapaProps {
  latitud: number | null;
  longitud: number | null;
  numeroFinca: string;
  onSeleccionar: (latitud: number, longitud: number) => void;
}
type EstadoBusquedaFinca =
  | { tipo: 'inicial'; mensaje: string }
  | { tipo: 'buscando'; mensaje: string }
  | { tipo: 'encontrada'; mensaje: string }
  | { tipo: 'no-encontrada'; mensaje: string }
  | { tipo: 'error'; mensaje: string };
// Selector de ubicación del parque mediante ArcGIS.
function SelectorMapa({
  latitud,
  longitud,
  numeroFinca,
  onSeleccionar,
}: SelectorMapaProps) {
  const contenedorRef = useRef<HTMLDivElement | null>(null);
  const vistaRef = useRef<MapView | null>(null);
  const marcadorRef = useRef<Graphic | null>(null);
  const onSeleccionarRef = useRef(onSeleccionar);
  const busquedaActualRef = useRef(0);
  const [estadoBusquedaFinca, setEstadoBusquedaFinca] =
    useState<EstadoBusquedaFinca>({
      tipo: 'inicial',
      mensaje:
        'Escriba el número de finca para localizarla automáticamente o haga clic en el mapa.',
    });
  useEffect(() => {
    onSeleccionarRef.current = onSeleccionar;
  }, [onSeleccionar]);
  useEffect(() => {
    if (!contenedorRef.current || vistaRef.current) return;
    // Carga el WebMap municipal en el selector.
    const mapa = new WebMap({
      portalItem: { id: WEB_MAP_ID },
    });
    // Crea la vista interactiva del mapa.
    const vista = new MapView({
      container: contenedorRef.current,
      map: mapa,
      center: [-84.3123, 10.0731],
      zoom: 14,
      popupEnabled: false,
      constraints: {
        snapToZoom: false,
      },
    });
    vistaRef.current = vista;
    const home = new Home({ view: vista });
    const locate = new Locate({ view: vista });
    const layerList = new LayerList({ view: vista });
    const expandCapas = new Expand({
      view: vista,
      content: layerList,
      expandTooltip: 'Capas',
      collapseTooltip: 'Cerrar capas',
    });
    vista.ui.add(home, 'top-left');
    vista.ui.add(locate, 'top-left');
    vista.ui.add(expandCapas, 'top-right');
    // Permite seleccionar manualmente una ubicación en el mapa.
    const manejarClick = vista.on('click', (event) => {
      const punto = vista.toMap({ x: event.x, y: event.y });
      if (!punto) return;
      const latitudPunto = punto.latitude;
      const longitudPunto = punto.longitude;
      if (
        latitudPunto == null ||
        longitudPunto == null
      ) {
        return;
      }
      onSeleccionarRef.current(
        Number(latitudPunto.toFixed(7)),
        Number(longitudPunto.toFixed(7)),
      );
      setEstadoBusquedaFinca({
        tipo: 'inicial',
        mensaje: 'Ubicación seleccionada manualmente en el mapa.',
      });
    });
    return () => {
      manejarClick.remove();
      vista.destroy();
      vistaRef.current = null;
      marcadorRef.current = null;
    };
  }, []);
  useEffect(() => {
    // Toma el número de finca ingresado para buscarlo en el mapa catastral.
    const valor = numeroFinca.trim();
    if (!valor) {
      setEstadoBusquedaFinca({
        tipo: 'inicial',
        mensaje:
          'Escriba el número de finca para localizarla automáticamente o haga clic en el mapa.',
      });
      return;
    }
    const idBusqueda = ++busquedaActualRef.current;
    const temporizador = window.setTimeout(async () => {
      const vista = vistaRef.current;
      if (!vista) return;
      setEstadoBusquedaFinca({
        tipo: 'buscando',
        mensaje: `Buscando finca ${valor} en el mapa catastral...`,
      });
      try {
        await vista.when();
        const webMap = vista.map as WebMap;
        await webMap.loadAll();
        // Localiza la capa catastral dentro del WebMap.
        const capaMapaCatastral = webMap.allLayers.find((capa: any) =>
          String(capa.title ?? '')
            .trim()
            .toUpperCase()
            .startsWith('MAPA CATASTRAL'),
        ) as any;
        if (!capaMapaCatastral) {
          if (idBusqueda !== busquedaActualRef.current) return;
          setEstadoBusquedaFinca({
            tipo: 'error',
            mensaje: 'No se encontró la capa MAPA CATASTRAL en el WebMap.',
          });
          return;
        }
        await capaMapaCatastral.load();
        const valorSeguro = valor.replace(/'/g, "''");
        // Campos utilizados para localizar la finca en la capa catastral.
        const camposBusqueda = [
          'PRM_FINCA',
          'PRM_IDENTIFICA',
          'FOLIO',
        ];
        let featureEncontrada: any = null;
        let campoEncontrado = '';
        for (const campo of camposBusqueda) {
          const query = capaMapaCatastral.createQuery();
          query.where = `${campo} = '${valorSeguro}'`;
          query.outFields = [
            'PRM_FINCA',
            'PRM_IDENTIFICA',
            'PRM_PLANO',
            'FOLIO',
          ];
          query.returnGeometry = true;
          query.num = 1;
          query.outSpatialReference = vista.spatialReference;
          const resultado = await capaMapaCatastral.queryFeatures(query);
          if (resultado.features.length > 0) {
            featureEncontrada = resultado.features[0];
            campoEncontrado = campo;
            break;
          }
        }
        if (idBusqueda !== busquedaActualRef.current) return;
        if (!featureEncontrada?.geometry) {
          setEstadoBusquedaFinca({
            tipo: 'no-encontrada',
            mensaje: `No se encontró ${valor} en PRM_FINCA, PRM_IDENTIFICA ni FOLIO. Puede seleccionar la ubicación manualmente.`,
          });
          return;
        }
        // Obtiene la geometría encontrada para calcular su centro.
        const geometria: any = featureEncontrada.geometry;
        const centro: Point | null =
          geometria.type === 'polygon'
            ? geometria.centroid
            : geometria.type === 'point'
              ? geometria
              : geometria.extent?.center ?? null;
        if (!centro) {
          setEstadoBusquedaFinca({
            tipo: 'error',
            mensaje:
              'La finca fue encontrada, pero no fue posible calcular su ubicación.',
          });
          return;
        }
        const latitudCentro = centro.latitude;
        const longitudCentro = centro.longitude;
        if (
          latitudCentro == null ||
          longitudCentro == null
        ) {
          setEstadoBusquedaFinca({
            tipo: 'error',
            mensaje:
              'La finca fue encontrada, pero sus coordenadas no son válidas.',
          });
          return;
        }
        const latitudEncontrada = Number(latitudCentro.toFixed(7));
        const longitudEncontrada = Number(longitudCentro.toFixed(7));
        onSeleccionarRef.current(
          latitudEncontrada,
          longitudEncontrada,
        );
        await vista.goTo(
          {
            target: featureEncontrada.geometry,
          },
          {
            animate: true,
            duration: 700,
          },
        ).catch(() => undefined);
        const atributos = featureEncontrada.attributes ?? {};
        const finca =
          atributos.PRM_FINCA ??
          atributos.FOLIO ??
          valor;
        setEstadoBusquedaFinca({
          tipo: 'encontrada',
          mensaje: `Finca ${finca} localizada automáticamente (${campoEncontrado}). El marcador se colocó en el centro de la propiedad y puede cambiarlo haciendo clic en el mapa.`,
        });
      } catch (error) {
        console.error('Error localizando la finca en ArcGIS:', error);
        if (idBusqueda !== busquedaActualRef.current) return;
        setEstadoBusquedaFinca({
          tipo: 'error',
          mensaje:
            'No fue posible consultar el mapa catastral. Puede seleccionar la ubicación manualmente.',
        });
      }
    }, 700);
    return () => {
      window.clearTimeout(temporizador);
    };
  }, [numeroFinca]);
  useEffect(() => {
    const vista = vistaRef.current;
    if (!vista) return;
    if (marcadorRef.current) {
      vista.graphics.remove(marcadorRef.current);
      marcadorRef.current = null;
    }
    if (latitud === null || longitud === null) return;
    // Crea el punto utilizado para mostrar el marcador.
    const punto = new Point({
      latitude: latitud,
      longitude: longitud,
    });
    const marcador = new Graphic({
      geometry: punto,
      symbol: new SimpleMarkerSymbol({
        style: 'circle',
        size: 18,
        color: [24, 132, 59, 255],
        outline: {
          color: [255, 255, 255, 255],
          width: 3,
        },
      }),
    });
    vista.graphics.add(marcador);
    marcadorRef.current = marcador;
    vista.goTo(
      {
        target: punto,
        zoom: 17,
      },
      { animate: true },
    ).catch(() => undefined);
  }, [latitud, longitud]);
  const claseEstado =
    estadoBusquedaFinca.tipo === 'encontrada'
      ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200'
      : estadoBusquedaFinca.tipo === 'no-encontrada' ||
          estadoBusquedaFinca.tipo === 'error'
        ? 'border-amber-500/25 bg-amber-500/10 text-amber-200'
        : estadoBusquedaFinca.tipo === 'buscando'
          ? 'border-cyan-500/25 bg-cyan-500/10 text-cyan-200'
          : 'border-white/10 bg-white/5 text-slate-300';
  return (
    <div>
      <div
        ref={contenedorRef}
        className="h-[300px] w-full sm:h-[340px]"
      />
      <div
        className={`border-t px-4 py-3 text-xs font-medium leading-5 ${claseEstado}`}
      >
        {estadoBusquedaFinca.mensaje}
      </div>
    </div>
  );
}
interface MapaInformacionArcgisProps {
  latitud: number;
  longitud: number;
  solicitudRecentrar: number;
}
// Muestra la ubicación del parque dentro del modal de información.
function MapaInformacionArcgis({
  latitud,
  longitud,
  solicitudRecentrar,
}: MapaInformacionArcgisProps) {
  const contenedorRef = useRef<HTMLDivElement | null>(null);
  const vistaRef = useRef<MapView | null>(null);
  const marcadorRef = useRef<Graphic | null>(null);
  useEffect(() => {
    if (!contenedorRef.current) return;
    const webMap = new WebMap({
      portalItem: {
        id: WEB_MAP_ID,
      },
    });
    const vista = new MapView({
      container: contenedorRef.current,
      map: webMap,
      center: [longitud, latitud],
      zoom: 17,
      popupEnabled: false,
    });
    vistaRef.current = vista;
    const home = new Home({ view: vista });
    const layerList = new LayerList({ view: vista });
    const expandCapas = new Expand({
      view: vista,
      content: layerList,
      expandTooltip: 'Capas',
      collapseTooltip: 'Cerrar capas',
    });
    vista.ui.add(home, 'top-left');
    vista.ui.add(expandCapas, 'top-right');
    vista.when(() => {
      const punto = new Point({
        longitude: longitud,
        latitude: latitud,
      });
      const marcador = new Graphic({
        geometry: punto,
        symbol: new SimpleMarkerSymbol({
          style: 'circle',
          color: [24, 132, 59, 255],
          size: 16,
          outline: {
            color: [255, 255, 255, 255],
            width: 2,
          },
        }),
      });
      marcadorRef.current = marcador;
      vista.graphics.add(marcador);
    });
    return () => {
      vista.destroy();
      vistaRef.current = null;
      marcadorRef.current = null;
    };
  }, []);
  useEffect(() => {
    const vista = vistaRef.current;
    if (!vista) return;
    const punto = new Point({
      longitude: longitud,
      latitude: latitud,
    });
    if (marcadorRef.current) {
      marcadorRef.current.geometry = punto;
    }
    vista.goTo(
      {
        center: [longitud, latitud],
        zoom: 17,
      },
      {
        animate: true,
        duration: 500,
      },
    ).catch(() => undefined);
  }, [latitud, longitud, solicitudRecentrar]);
  return (
    <div
      ref={contenedorRef}
      className="h-[340px] w-full"
    />
  );
}
// Componente principal para la gestión de parques.
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
  // Restablece todos los filtros de búsqueda.
  const limpiarFiltros = () => {
    setFiltroUbicacion('');
    setFiltroFinca('');
    setFiltroPlano('');
    setFiltroDistrito('');
    setFiltroEstado('');
    setFiltroEncargado('');
  };
  // Normaliza texto para facilitar comparaciones y búsquedas.
  const normalizarTexto = (valor: string | null | undefined) =>
    (valor ?? '').toLowerCase().trim();
  // Limita textos largos para mostrarlos en la tabla.
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
  // Conserva únicamente números en los campos correspondientes.
  const sanitizarSoloNumeros = (valor: string) =>
    valor.replace(/\D/g, '').slice(0, 50);
  // Valida y limita el formato del área del parque.
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
  // Aplica los filtros seleccionados al listado de parques.
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
  const [solicitudRecentrarMapa, setSolicitudRecentrarMapa] = useState(0);
  const [modalInversionAbierto, setModalInversionAbierto] = useState(false);
  const [parqueInversion, setParqueInversion] = useState<Parque | null>(null);
  const [inversionesParque, setInversionesParque] = useState<InversionMantenimiento[]>([]);
  const [cargandoInversiones, setCargandoInversiones] = useState(false);
  const [errorInversiones, setErrorInversiones] = useState('');
  // Lógica para bloquear el desplazamiento del fondo cuando un modal está abierto
  // Indica si alguno de los modales está abierto.
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
  const [latitud, setLatitud] = useState<number | null>(null);
  const [longitud, setLongitud] = useState<number | null>(null);
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
  // Carga los parques registrados desde la API.
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
  // Carga los distritos registrados desde la API.
  const cargarDistritos = async () => {
    try {
      const response = await api.get('/distritos');
      setDistritos(response.data);
    } catch (error) {
      console.error('Error cargando distritos:', error);
    }
  };
  // Carga los encargados registrados desde la API.
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
  // Limpia todos los campos del formulario de parque.
  const limpiarFormulario = () => {
    setUbicacion('');
    setLatitud(null);
    setLongitud(null);
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
  // Abre el formulario para registrar un nuevo parque.
  const abrirModalCrear = () => {
    limpiarFormulario();
    setModoEdicion(false);
    setIdParqueEditando(null);
    setModalAbierto(true);
  };
  // Carga los datos del parque seleccionado para editarlo.
  const abrirModalEditar = (parque: Parque) => {
    setUbicacion(parque.ubicacion ?? '');
    setLatitud(parque.latitud !== null && parque.latitud !== undefined ? Number(parque.latitud) : null);
    setLongitud(parque.longitud !== null && parque.longitud !== undefined ? Number(parque.longitud) : null);
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
  // Cierra el formulario y restablece sus datos.
  const cerrarModal = () => {
    if (guardando) return;
    setModalAbierto(false);
    limpiarFormulario();
    setModoEdicion(false);
    setIdParqueEditando(null);
  };
  // Registra o actualiza un parque.
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
        latitud,
        longitud,
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
  // Abre el modal para confirmar la eliminación.
  const abrirModalEliminar = (parque: Parque) => {
    setParqueEliminar(parque);
    setErrorEliminar('');
    setModalEliminarAbierto(true);
  };
  // Cierra el modal de eliminación.
  const cerrarModalEliminar = () => {
    if (eliminando) return;
    setModalEliminarAbierto(false);
    setParqueEliminar(null);
    setErrorEliminar('');
  };
  // Elimina el parque seleccionado.
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
  // Abre el modal con la información del encargado.
  const abrirModalEncargado = (parque: Parque) => {
    if (!parque.encargado) return;
    setEncargadoVer(parque.encargado);
    setModalEncargadoAbierto(true);
  };
  // Cierra el modal de información del encargado.
  const cerrarModalEncargado = () => {
    setModalEncargadoAbierto(false);
    setEncargadoVer(null);
  };
  // Abre el modal con la información completa del parque.
  const abrirModalInformacion = (parque: Parque) => {
    setParqueVer(parque);
    setSolicitudRecentrarMapa(0);
    setModalInformacionAbierto(true);
  };
  // Cierra el modal de información del parque.
  const cerrarModalInformacion = () => {
    setModalInformacionAbierto(false);
    setParqueVer(null);
  };
  // Carga y muestra las inversiones asociadas al parque.
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
  // Cierra el modal de inversiones.
  const cerrarModalInversion = () => {
    setModalInversionAbierto(false);
    setParqueInversion(null);
    setInversionesParque([]);
    setErrorInversiones('');
    setCargandoInversiones(false);
  };
  // Formatea montos en colones costarricenses.
  const formatearColones = (valor: number | string | null | undefined) => {
    const numero = Number(valor ?? 0);
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(numero) ? numero : 0);
  };
  // Formatea las fechas de inversión para mostrarlas.
  const formatearFechaInversion = (fecha: string | null | undefined) => {
    if (!fecha) return 'Fecha no registrada';
    const partes = fecha.substring(0, 10).split('-');
    if (partes.length !== 3) return fecha;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };
  // Calcula el total invertido en mantenimientos del parque.
  const inversionTotalParque = inversionesParque.reduce(
    (total, mantenimiento) => total + Number(mantenimiento.inversion ?? 0),
    0,
  );
  // Cerrar modales con ESC
  useEffect(() => {
    // Permite cerrar los modales con la tecla Escape.
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
                              Información
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
      {/* MODAL CREAR / EDITAR */}
      {/* ====================================== */}
      {modalAbierto && (
        <div
          onClick={cerrarModal}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm sm:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0B212D] shadow-2xl"
          >
            {/* Encabezado */}
            <div className="flex flex-shrink-0 items-start justify-between border-b border-white/10 px-6 py-5 sm:px-8">
              <div className="pr-6">
                <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-emerald-400">
                  Gestión de parques
                </p>
                <h2 className="text-2xl font-black tracking-tight text-white">
                  {modoEdicion ? 'Editar parque' : 'Nuevo parque'}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {modoEdicion
                    ? 'Modifique los datos del parque y actualice su ubicación geográfica.'
                    : 'Complete los datos y seleccione la ubicación del parque en el mapa.'}
                </p>
              </div>
              <button
                type="button"
                onClick={cerrarModal}
                disabled={guardando}
                aria-label="Cerrar"
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg font-bold text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                ✕
              </button>
            </div>
            <form onSubmit={guardarParque} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8">
                {errorFormulario && (
                  <div className="mb-6 rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm font-semibold text-red-300">
                    {errorFormulario}
                  </div>
                )}
                {/* Datos generales */}
                <section>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/15 text-sm font-black text-sky-300">
                      1
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Información general</h3>
                      <p className="text-xs text-slate-400">Datos principales de identificación del parque.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-slate-300">
                        Ubicación
                      </label>
                      <input
                        type="text"
                        value={ubicacion}
                        onChange={(e) => setUbicacion(e.target.value)}
                        required
                        maxLength={200}
                        placeholder="Ej: Barrio Latino, Grecia Centro"
                        className="w-full rounded-xl border border-white/15 bg-[#071923] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-300">
                        Número de finca
                      </label>
                      <input
                        type="text"
                        value={numeroFinca}
                        onChange={(e) => setNumeroFinca(sanitizarSoloNumeros(e.target.value))}
                        required
                        maxLength={50}
                        inputMode="numeric"
                        placeholder="Ej: 2123456000"
                        className="w-full rounded-xl border border-white/15 bg-[#071923] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-300">
                        Área (m²)
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={area}
                        onChange={(e) => setArea(sanitizarArea(e.target.value))}
                        required
                        maxLength={13}
                        placeholder="Ej: 2500.50"
                        className="w-full rounded-xl border border-white/15 bg-[#071923] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-300">
                        Número de plano
                      </label>
                      <input
                        type="text"
                        value={numeroPlano}
                        onChange={(e) => setNumeroPlano(e.target.value)}
                        required
                        maxLength={50}
                        placeholder="Ej: A-1234567-2026"
                        className="w-full rounded-xl border border-white/15 bg-[#071923] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-300">
                        Visado
                      </label>
                      <select
                        value={visado}
                        onChange={(e) => setVisado(e.target.value)}
                        required
                        className="w-full rounded-xl border border-white/15 bg-[#071923] px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-500"
                      >
                        <option value="" className="bg-[#0B212D]">Seleccione el visado</option>
                        <option value="Aprobado" className="bg-[#0B212D]">Aprobado</option>
                        <option value="Solicitado" className="bg-[#0B212D]">Solicitado</option>
                        <option value="No tiene" className="bg-[#0B212D]">No tiene</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-300">
                        Estado
                      </label>
                      <select
                        value={estado}
                        onChange={(e) => setEstado(e.target.value)}
                        required
                        className="w-full rounded-xl border border-white/15 bg-[#071923] px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-500"
                      >
                        <option value="" className="bg-[#0B212D]">Seleccione el estado</option>
                        <option value="Bueno" className="bg-[#0B212D]">Bueno</option>
                        <option value="Regular" className="bg-[#0B212D]">Regular</option>
                        <option value="Malo" className="bg-[#0B212D]">Malo</option>
                        <option value="Vacío" className="bg-[#0B212D]">Vacío</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-300">
                        Distrito
                      </label>
                      <input
                        type="text"
                        value={busquedaDistrito}
                        onChange={(e) => setBusquedaDistrito(e.target.value)}
                        placeholder="Buscar distrito..."
                        className="mb-2 w-full rounded-xl border border-white/15 bg-[#071923] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500"
                      />
                      <select
                        value={idDistrito}
                        onChange={(e) => setIdDistrito(e.target.value)}
                        required
                        className="w-full rounded-xl border border-white/15 bg-[#071923] px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-500"
                      >
                        <option value="" className="bg-[#0B212D]">Seleccione un distrito</option>
                        {distritosFiltradosFormulario.map((distrito) => (
                          <option
                            key={distrito.id_distrito}
                            value={distrito.id_distrito}
                            className="bg-[#0B212D]"
                          >
                            {distrito.nombre_distrito}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-300">
                        Entidad encargada
                      </label>
                      <input
                        type="text"
                        value={busquedaEncargado}
                        onChange={(e) => setBusquedaEncargado(e.target.value)}
                        placeholder="Buscar entidad o representante..."
                        className="mb-2 w-full rounded-xl border border-white/15 bg-[#071923] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500"
                      />
                      <select
                        value={idEncargado}
                        onChange={(e) => setIdEncargado(e.target.value)}
                        required
                        className="w-full rounded-xl border border-white/15 bg-[#071923] px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-500"
                      >
                        <option value="" className="bg-[#0B212D]">Seleccione una entidad</option>
                        {encargadosFiltradosFormulario.map((encargado) => (
                          <option
                            key={encargado.id_encargado}
                            value={encargado.id_encargado}
                            className="bg-[#0B212D]"
                          >
                            {encargado.entidad_encargada} — {encargado.representante_legal}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </section>
                {/* Ubicación geográfica */}
                <section className="mt-7 border-t border-white/10 pt-6">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-sm font-black text-emerald-300">
                        2
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">Ubicación geográfica</h3>
                        <p className="text-xs text-slate-400">
                          Escriba el número de finca para localizarla automáticamente o haga clic en el mapa para ajustar el punto.
                        </p>
                      </div>
                    </div>
                    {latitud !== null && longitud !== null && (
                      <button
                        type="button"
                        onClick={() => {
                          setLatitud(null);
                          setLongitud(null);
                        }}
                        className="self-start rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 transition hover:bg-red-500/20 sm:self-auto"
                      >
                        Quitar ubicación
                      </button>
                    )}
                  </div>
                  <div className="overflow-hidden rounded-xl border border-white/15 bg-[#071923] shadow-inner">
                    <SelectorMapa
                      latitud={latitud}
                      longitud={longitud}
                      numeroFinca={numeroFinca}
                      onSeleccionar={(lat, lng) => {
                        setLatitud(lat);
                        setLongitud(lng);
                      }}
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Latitud</span>
                      <span className="font-mono text-sm font-bold text-white">
                        {latitud !== null ? latitud.toFixed(7) : 'Sin seleccionar'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Longitud</span>
                      <span className="font-mono text-sm font-bold text-white">
                        {longitud !== null ? longitud.toFixed(7) : 'Sin seleccionar'}
                      </span>
                    </div>
                  </div>
                </section>
              </div>
              {/* Acciones fijas */}
              <div className="flex flex-shrink-0 items-center justify-end gap-3 border-t border-white/10 bg-[#091D27] px-6 py-4 sm:px-8">
                <button
                  type="button"
                  onClick={cerrarModal}
                  disabled={guardando}
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-bold text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="rounded-xl bg-[#315F73] px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-[#244C5F] disabled:opacity-50"
                >
                  {guardando
                    ? 'Guardando...'
                    : modoEdicion
                      ? 'Guardar cambios'
                      : 'Guardar parque'}
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
                {parqueVer.latitud !== null &&
                  parqueVer.latitud !== undefined &&
                  parqueVer.longitud !== null &&
                  parqueVer.longitud !== undefined && (
                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 md:col-span-2">
                      <div className="border-b border-white/10 p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-bold uppercase tracking-wide text-slate-400">
                              Ubicación en el mapa
                            </p>
                            <p className="mt-2 text-sm text-slate-300">
                              Latitud {Number(parqueVer.latitud).toFixed(7)} · Longitud {Number(parqueVer.longitud).toFixed(7)}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setSolicitudRecentrarMapa((valor) => valor + 1)
                              }
                              className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/20"
                            >
                              Retomar punto
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const latitudGoogle = Number(parqueVer.latitud);
                                const longitudGoogle = Number(parqueVer.longitud);
                                const urlGoogleMaps =
                                  `https://www.google.com/maps/search/?api=1&query=${latitudGoogle},${longitudGoogle}`;
                                window.open(
                                  urlGoogleMaps,
                                  '_blank',
                                  'noopener,noreferrer',
                                );
                              }}
                              className="rounded-lg bg-[#18843B] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-600"
                            >
                              Ir a Google Maps
                            </button>
                          </div>
                        </div>
                      </div>
                      <MapaInformacionArcgis
                        latitud={Number(parqueVer.latitud)}
                        longitud={Number(parqueVer.longitud)}
                        solicitudRecentrar={solicitudRecentrarMapa}
                      />
                    </div>
                  )}
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

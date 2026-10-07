import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ElementType,
} from 'react';
import { useNavigate } from 'react-router-dom';
import WebMap from '@arcgis/core/WebMap.js';
import MapView from '@arcgis/core/views/MapView.js';
import Graphic from '@arcgis/core/Graphic.js';
import Point from '@arcgis/core/geometry/Point.js';
import Extent from '@arcgis/core/geometry/Extent.js';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol.js';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol.js';
import HomeWidget from '@arcgis/core/widgets/Home.js';
import Locate from '@arcgis/core/widgets/Locate.js';
import LayerList from '@arcgis/core/widgets/LayerList.js';
import Expand from '@arcgis/core/widgets/Expand.js';
import '@arcgis/core/assets/esri/themes/light/main.css';
import {
  TreePine,
  Users,
  MapPin,
  FileText,
  ClipboardList,
  Wrench,
  FileSpreadsheet,
  History,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Search,
  MapPinned,
  Navigation,
  Home,
  ChevronRight,
  RotateCcw,
  Building2,
  Info,
} from 'lucide-react';
import { api } from '../services/api';
import fondoGrecia from '../assets/grecia-login.jpg';
import logoMunicipalidad from '../assets/logo-municipalidad-grecia.webp';
interface Module {
  title: string;
  description: string;
  icon: ElementType;
  route: string;
  accentHex: string;
}
interface Distrito {
  id_distrito: number;
  nombre_distrito: string;
  numero_distrito: number;
}
interface Encargado {
  id_encargado: number;
  entidad_encargada: string;
  representante_legal: string;
}
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
  id_distrito: number;
  id_encargado: number;
  distrito?: Distrito;
  encargado?: Encargado;
}
interface UsuarioLocal {
  nombre_usuario?: string | null;
  correo?: string;
}
// Coordenadas utilizadas como centro inicial del mapa de Grecia.
const CENTRO_GRECIA: [number, number] = [
  10.0731,
  -84.3123,
];
// Define los módulos disponibles en el menú lateral.
const modules: Module[] = [
  {
    title: 'Inicio',
    description: 'Mapa territorial y resumen general.',
    icon: Home,
    route: '/dashboard',
    accentHex: '#315F73',
  },
  {
    title: 'Parques',
    description: 'Gestión de parques e información catastral.',
    icon: TreePine,
    route: '/parques',
    accentHex: '#18843B',
  },
  {
    title: 'Distritos',
    description: 'Gestión de distritos.',
    icon: MapPin,
    route: '/distritos',
    accentHex: '#18843B',
  },
  {
    title: 'Encargados',
    description: 'Entidades y representantes legales.',
    icon: Users,
    route: '/encargados',
    accentHex: '#315F73',
  },
  {
    title: 'Mantenimientos',
    description: 'Seguimiento de mantenimientos.',
    icon: Wrench,
    route: '/mantenimientos',
    accentHex: '#18843B',
  },
  {
    title: 'Convenios',
    description: 'Convenios asociados a parques.',
    icon: FileText,
    route: '/convenios',
    accentHex: '#315F73',
  },
  {
    title: 'Declaraciones',
    description: 'Declaraciones y vigencia.',
    icon: ClipboardList,
    route: '/declaraciones',
    accentHex: '#315F73',
  },
  {
    title: 'Listado de Parques',
    description: 'Consulta y exportación del inventario.',
    icon: FileSpreadsheet,
    route: '/listado-parques',
    accentHex: '#315F73',
  },
  {
    title: 'Auditoría',
    description: 'Historial de acciones.',
    icon: History,
    route: '/auditoria',
    accentHex: '#D4112E',
  },
  {
    title: 'Usuarios',
    description: 'Administración de usuarios.',
    icon: ShieldCheck,
    route: '/usuarios',
    accentHex: '#D4112E',
  },
];
// Devuelve el color del marcador según el estado del parque.
const colorEstado = (
  estado: string,
) => {
  switch (estado) {
    case 'Bueno':
      return '#18843B';
    case 'Regular':
      return '#EAB308';
    case 'Malo':
      return '#D4112E';
    case 'Vacío':
      return '#64748B';
    default:
      return '#315F73';
  }
};
interface ArcgisMapaParquesProps {
  parques: Parque[];
  solicitudRecentrar: number;
  onSeleccionarParque: (parque: Parque) => void;
  onElegirVistaParque: (
    parque: Parque,
    abrirDatosMapa: () => void,
  ) => void;
}
// ID del WebMap municipal utilizado por ArcGIS.
const WEB_MAP_ID = '3cbc884187ce4abd8cbff1b4f698cd53';
// Componente encargado de mostrar los parques sobre el mapa de ArcGIS.
function ArcgisMapaParques({
  parques,
  solicitudRecentrar,
  onSeleccionarParque,
  onElegirVistaParque,
}: ArcgisMapaParquesProps) {
  const contenedorRef = useRef<HTMLDivElement | null>(null);
  const vistaRef = useRef<MapView | null>(null);
  const parquesRef = useRef<Parque[]>(parques);
  const graficosRef = useRef<Graphic[]>([]);
  const resaltadoFincaRef = useRef<Graphic | null>(null);
  const mapaListoRef = useRef(false);
  const seleccionarParqueRef = useRef(onSeleccionarParque);
  const elegirVistaParqueRef = useRef(onElegirVistaParque);
  useEffect(() => {
    parquesRef.current = parques;
  }, [parques]);
  useEffect(() => {
    seleccionarParqueRef.current = onSeleccionarParque;
  }, [onSeleccionarParque]);
  useEffect(() => {
    elegirVistaParqueRef.current = onElegirVistaParque;
  }, [onElegirVistaParque]);
  // Crea los marcadores de los parques que tienen coordenadas válidas.
  const crearGraficosParques = (listaParques: Parque[]) =>
    listaParques
      .filter((parque) => {
        const latitud = Number(parque.latitud);
        const longitud = Number(parque.longitud);
        return Number.isFinite(latitud) && Number.isFinite(longitud);
      })
      .map((parque) => {
        const latitud = Number(parque.latitud);
        const longitud = Number(parque.longitud);
        return new Graphic({
          geometry: new Point({
            longitude: longitud,
            latitude: latitud,
            spatialReference: { wkid: 4326 },
          }),
          symbol: new SimpleMarkerSymbol({
            style: 'circle',
            color: colorEstado(parque.estado),
            size: 22,
            outline: {
              color: '#ffffff',
              width: 3,
            },
          }),
          attributes: {
            id_parque: parque.id_parque,
            ubicacion: parque.ubicacion,
            estado: parque.estado,
            distrito: parque.distrito?.nombre_distrito ?? 'Sin distrito',
            finca: parque.numero_finca,
          },
          popupTemplate: {
            title: '{ubicacion}',
            content: `
              <div style="min-width:220px">
                <p><strong>Distrito:</strong> {distrito}</p>
                <p><strong>Estado:</strong> {estado}</p>
                <p><strong>Número de finca:</strong> {finca}</p>
              </div>
            `,
          },
        });
      });
  // Actualiza los marcadores visibles en el mapa.
  const actualizarMarcadores = (listaParques: Parque[]) => {
    const vista = vistaRef.current;
    if (!vista) return;
    if (graficosRef.current.length > 0) {
      vista.graphics.removeMany(graficosRef.current);
    }
    const graficos = crearGraficosParques(listaParques);
    graficosRef.current = graficos;
    if (graficos.length > 0) {
      vista.graphics.addMany(graficos);
    }
  };
  // Ajusta la extensión del mapa según los parques visibles.
  const ajustarVista = async (
    listaParques: Parque[],
    animar = true,
  ) => {
    const vista = vistaRef.current;
    if (!vista || !mapaListoRef.current) return;
    const puntos = listaParques
      .map((parque) => ({
        latitud: Number(parque.latitud),
        longitud: Number(parque.longitud),
      }))
      .filter(
        (punto) =>
          Number.isFinite(punto.latitud) &&
          Number.isFinite(punto.longitud),
      );
    try {
      if (puntos.length === 0) {
        await vista.goTo(
          {
            center: [CENTRO_GRECIA[1], CENTRO_GRECIA[0]],
            zoom: 13,
          },
          { animate: animar },
        );
        return;
      }
      if (puntos.length === 1) {
        await vista.goTo(
          {
            center: [puntos[0].longitud, puntos[0].latitud],
            zoom: 16,
          },
          { animate: animar },
        );
        return;
      }
      const longitudes = puntos.map((punto) => punto.longitud);
      const latitudes = puntos.map((punto) => punto.latitud);
      const extension = new Extent({
        xmin: Math.min(...longitudes),
        ymin: Math.min(...latitudes),
        xmax: Math.max(...longitudes),
        ymax: Math.max(...latitudes),
        spatialReference: { wkid: 4326 },
      });
      await vista.goTo(
        extension.expand(1.35),
        { animate: animar },
      );
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        console.error('Error ajustando la vista del mapa:', error);
      }
    }
  };
  useEffect(() => {
    if (!contenedorRef.current) return;
    let desmontado = false;
    const webMap = new WebMap({
      portalItem: { id: WEB_MAP_ID },
    });
    const vista = new MapView({
      container: contenedorRef.current,
      map: webMap,
      center: [CENTRO_GRECIA[1], CENTRO_GRECIA[0]],
      zoom: 13,
      popupEnabled: false,
    });
    vistaRef.current = vista;
    // Inicializa la vista, widgets, buscador y eventos del mapa.
    const configurarVista = async () => {
      try {
        await vista.when();
        if (desmontado) return;
        mapaListoRef.current = true;
        actualizarMarcadores(parquesRef.current);
        await ajustarVista(parquesRef.current, false);
        const capaMapaCatastral = webMap.allLayers.find(
          (capa: any) =>
            String(capa.title ?? '')
              .trim()
              .toUpperCase()
              .startsWith('MAPA CATASTRAL'),
        ) as any;
        if (capaMapaCatastral) {
          try {
            await capaMapaCatastral.load();
          } catch (error) {
            console.error('No se pudo cargar MAPA CATASTRAL:', error);
          }
        }
        // Elimina el resaltado de una finca previamente seleccionada.
        const limpiarResaltado = () => {
          if (resaltadoFincaRef.current) {
            vista.graphics.remove(resaltadoFincaRef.current);
            resaltadoFincaRef.current = null;
          }
        };
        // Construye la condición de consulta según el tipo de campo ArcGIS.
        const construirWhere = (
          capa: any,
          campo: string,
          valor: string,
        ) => {
          const definicionCampo = capa?.fields?.find(
            (item: any) => item.name === campo,
          );
          const tipo = String(definicionCampo?.type ?? '').toLowerCase();
          const valorLimpio = valor.trim();
          if (
            tipo.includes('integer') ||
            tipo.includes('double') ||
            tipo.includes('single') ||
            tipo.includes('small-integer') ||
            tipo.includes('oid')
          ) {
            const numero = Number(valorLimpio);
            if (!Number.isFinite(numero)) {
              return '1=0';
            }
            return `${campo} = ${numero}`;
          }
          const escapado = valorLimpio.replace(/'/g, "''");
          return `${campo} = '${escapado}'`;
        };
        // Consulta una capa de ArcGIS usando el campo y valor indicados.
        const consultarCapa = async (
          capa: any,
          campo: string,
          valor: string,
        ) => {
          if (!capa) return null;
          try {
            const consulta = capa.createQuery();
            consulta.where = construirWhere(capa, campo, valor);
            consulta.outFields = ['*'];
            consulta.returnGeometry = true;
            consulta.num = 1;
            const respuesta = await capa.queryFeatures(consulta);
            if (respuesta.features.length > 0) {
              return {
                feature: respuesta.features[0],
                campo,
                capa: String(capa.title ?? ''),
              };
            }
          } catch (error) {
            console.error(
              `Error buscando ${valor} en ${String(capa.title ?? campo)}:`,
              error,
            );
          }
          return null;
        };
        // Resalta y enfoca en el mapa la finca encontrada.
        const enfocarResultado = async (resultado: any) => {
          const feature = resultado?.feature;
          if (!feature?.geometry) return;
          limpiarResaltado();
          const resaltado = new Graphic({
            geometry: feature.geometry,
            attributes: {
              ...feature.attributes,
              __tipo: 'resaltado_finca',
            },
            symbol: new SimpleFillSymbol({
              style: 'solid',
              color: [0, 255, 255, 0.18],
              outline: {
                color: [0, 255, 255, 1],
                width: 4,
              },
            }),
          });
          resaltadoFincaRef.current = resaltado;
          vista.graphics.add(resaltado);
          try {
            const geometria: any = feature.geometry;
            const destino = geometria.extent
              ? geometria.extent.expand(1.8)
              : geometria;
            await vista.goTo(destino, {
              animate: true,
              duration: 800,
            });
          } catch (error: any) {
            if (error?.name !== 'AbortError') {
              console.error('No se pudo enfocar la finca:', error);
            }
          }
        };
        /*
         * Buscador catastral propio.
         *
         * No usamos SearchWidget para esta búsqueda porque FOLIO/N_FILIAL
         * pueden ser campos numéricos. En su lugar consultamos directamente
         * las capas con queryFeatures.
         *
         * Orden:
         * 1. FINCAS_SI -> FOLIO
         * 2. NUMERO FILIAL -> N_FILIAL
         */
        // Crea el buscador catastral personalizado.
        const buscadorContenedor = document.createElement('div');
        buscadorContenedor.className = 'esri-widget';
        buscadorContenedor.style.display = 'flex';
        buscadorContenedor.style.alignItems = 'stretch';
        buscadorContenedor.style.background = '#ffffff';
        buscadorContenedor.style.boxShadow = '0 1px 2px rgba(0,0,0,.3)';
        buscadorContenedor.style.width = '290px';
        buscadorContenedor.style.maxWidth = 'calc(100vw - 80px)';
        const inputBusqueda = document.createElement('input');
        inputBusqueda.type = 'text';
        inputBusqueda.placeholder = 'Buscar finca: 0556728';
        inputBusqueda.autocomplete = 'off';
        inputBusqueda.setAttribute('aria-label', 'Buscar número de finca');
        inputBusqueda.style.flex = '1';
        inputBusqueda.style.minWidth = '0';
        inputBusqueda.style.height = '40px';
        inputBusqueda.style.padding = '0 12px';
        inputBusqueda.style.border = 'none';
        inputBusqueda.style.outline = 'none';
        inputBusqueda.style.fontSize = '14px';
        inputBusqueda.style.color = '#2b2b2b';
        const botonBusqueda = document.createElement('button');
        botonBusqueda.type = 'button';
        botonBusqueda.title = 'Buscar finca';
        botonBusqueda.setAttribute('aria-label', 'Buscar finca');
        botonBusqueda.innerHTML = '🔍';
        botonBusqueda.style.width = '44px';
        botonBusqueda.style.border = 'none';
        botonBusqueda.style.borderLeft = '1px solid #d8d8d8';
        botonBusqueda.style.background = '#ffffff';
        botonBusqueda.style.cursor = 'pointer';
        botonBusqueda.style.fontSize = '16px';
        const mensajeBusqueda = document.createElement('div');
        mensajeBusqueda.style.position = 'absolute';
        mensajeBusqueda.style.top = '44px';
        mensajeBusqueda.style.left = '0';
        mensajeBusqueda.style.right = '0';
        mensajeBusqueda.style.display = 'none';
        mensajeBusqueda.style.padding = '10px 12px';
        mensajeBusqueda.style.background = '#ffffff';
        mensajeBusqueda.style.borderTop = '1px solid #e5e7eb';
        mensajeBusqueda.style.boxShadow = '0 2px 4px rgba(0,0,0,.25)';
        mensajeBusqueda.style.fontSize = '13px';
        mensajeBusqueda.style.color = '#374151';
        mensajeBusqueda.style.zIndex = '2';
        buscadorContenedor.style.position = 'relative';
        buscadorContenedor.appendChild(inputBusqueda);
        buscadorContenedor.appendChild(botonBusqueda);
        buscadorContenedor.appendChild(mensajeBusqueda);
        let buscando = false;
        const mostrarMensaje = (
          texto: string,
          esError = false,
        ) => {
          mensajeBusqueda.textContent = texto;
          mensajeBusqueda.style.display = 'block';
          mensajeBusqueda.style.color = esError ? '#b91c1c' : '#374151';
        };
        const ocultarMensaje = () => {
          mensajeBusqueda.style.display = 'none';
        };
        // Ejecuta la búsqueda de finca dentro de la capa catastral.
        const ejecutarBusqueda = async () => {
          const valor = inputBusqueda.value.trim();
          if (!valor || buscando) return;
          buscando = true;
          botonBusqueda.disabled = true;
          botonBusqueda.style.cursor = 'wait';
          mostrarMensaje(`Buscando finca ${valor}...`);
          try {
            if (!capaMapaCatastral) {
              limpiarResaltado();
              mostrarMensaje(
                'No se encontró la capa MAPA CATASTRAL en el mapa.',
                true,
              );
              return;
            }
            let resultado = await consultarCapa(
              capaMapaCatastral,
              'PRM_FINCA',
              valor,
            );
            // Los números dibujados sobre las parcelas usan FOLIO.
            // Si no coincide con el número registral de finca, probamos FOLIO.
            if (!resultado) {
              resultado = await consultarCapa(
                capaMapaCatastral,
                'FOLIO',
                valor,
              );
            }
            if (!resultado) {
              limpiarResaltado();
              mostrarMensaje(
                `No se encontró ${valor} en PRM_FINCA ni FOLIO.`,
                true,
              );
              return;
            }
            await enfocarResultado(resultado);
            const atributos = resultado.feature?.attributes ?? {};
            const finca = atributos.PRM_FINCA ?? '';
            const folio = atributos.FOLIO ?? '';
            const identifica = atributos.PRM_IDENTIFICA ?? '';
            const plano = atributos.PRM_PLANO ?? '';
            const detalles = [
              finca ? `Finca: ${finca}` : '',
              folio ? `Folio: ${folio}` : '',
              identifica ? `Identifica: ${identifica}` : '',
              plano ? `Plano: ${plano}` : '',
            ]
              .filter(Boolean)
              .join(' · ');
            mostrarMensaje(detalles);
            window.setTimeout(() => {
              ocultarMensaje();
            }, 5000);
          } catch (error) {
            console.error('Error buscando en MAPA CATASTRAL:', error);
            limpiarResaltado();
            mostrarMensaje(
              `No se pudo consultar la finca ${valor}.`,
              true,
            );
          } finally {
            buscando = false;
            botonBusqueda.disabled = false;
            botonBusqueda.style.cursor = 'pointer';
          }
        };
        botonBusqueda.addEventListener('click', ejecutarBusqueda);
        inputBusqueda.addEventListener('keydown', (evento) => {
          if (evento.key === 'Enter') {
            evento.preventDefault();
            ejecutarBusqueda();
          }
          if (evento.key === 'Escape') {
            inputBusqueda.value = '';
            limpiarResaltado();
            ocultarMensaje();
          }
        });
        inputBusqueda.addEventListener('input', () => {
          ocultarMensaje();
          if (!inputBusqueda.value.trim()) {
            limpiarResaltado();
          }
        });
        const inicio = new HomeWidget({
          view: vista,
        });
        const ubicacion = new Locate({
          view: vista,
        });
        const listaCapas = new LayerList({
          view: vista,
        });
        const expandirCapas = new Expand({
          view: vista,
          content: listaCapas,
          expanded: false,
          expandTooltip: 'Capas del mapa',
          collapseTooltip: 'Cerrar capas',
        });
        vista.ui.add(inicio, 'top-left');
        vista.ui.add(ubicacion, 'top-left');
        vista.ui.add(buscadorContenedor, 'top-right');
        vista.ui.add(expandirCapas, 'top-right');
        vista.on('click', async (evento) => {
          const respuesta = await vista.hitTest(evento);
          const resultadoParque = respuesta.results.find(
            (resultado: any) =>
              resultado?.type === 'graphic' &&
              graficosRef.current.includes(resultado.graphic),
          ) as any;
          const idParque =
            resultadoParque?.graphic?.attributes?.id_parque;
          if (idParque === undefined || idParque === null) {
            return;
          }
          const parque = parquesRef.current.find(
            (item) =>
              Number(item.id_parque) === Number(idParque),
          );
          if (parque && resultadoParque?.graphic) {
            try {
              vista.closePopup();
            } catch {
              // No había un popup abierto.
            }
            const graficoParque = resultadoParque.graphic;
            elegirVistaParqueRef.current(
              parque,
              () => {
                vista.openPopup({
                  features: [graficoParque],
                  location: graficoParque.geometry as Point,
                });
              },
            );
          }
        });
      } catch (error) {
        console.error('Error inicializando el mapa de ArcGIS:', error);
      }
    };
    configurarVista();
    return () => {
      desmontado = true;
      mapaListoRef.current = false;
      if (resaltadoFincaRef.current) {
        vista.graphics.remove(resaltadoFincaRef.current);
        resaltadoFincaRef.current = null;
      }
      graficosRef.current = [];
      vistaRef.current = null;
      vista.destroy();
    };
  }, []);
  useEffect(() => {
    if (!mapaListoRef.current) return;
    actualizarMarcadores(parques);
    ajustarVista(parques, true);
  }, [parques]);
  useEffect(() => {
    if (!mapaListoRef.current || solicitudRecentrar === 0) {
      return;
    }
    ajustarVista(parquesRef.current, true);
  }, [solicitudRecentrar]);
  return (
    <div
      ref={contenedorRef}
      className="h-full w-full"
    />
  );
}
// Componente principal del panel administrativo.
export default function Dashboard() {
  const navigate = useNavigate();
  const [
    menuMovilAbierto,
    setMenuMovilAbierto,
  ] = useState(false);
  const [
    parques,
    setParques,
  ] = useState<Parque[]>([]);
  const [
    distritos,
    setDistritos,
  ] = useState<Distrito[]>([]);
  const [
    cargando,
    setCargando,
  ] = useState(true);
  const [
    error,
    setError,
  ] = useState('');
  const [
    busqueda,
    setBusqueda,
  ] = useState('');
  const [
    filtroDistrito,
    setFiltroDistrito,
  ] = useState('');
  const [
    filtroEstado,
    setFiltroEstado,
  ] = useState('');
  const [
    parqueSeleccionado,
    setParqueSeleccionado,
  ] = useState<Parque | null>(
    null,
  );
  const [
    selectorParque,
    setSelectorParque,
  ] = useState<{
    parque: Parque;
    abrirDatosMapa: () => void;
  } | null>(null);
  useEffect(() => {
    // Permite cerrar selectores y modales con la tecla Escape.
    const manejarEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (selectorParque) {
        setSelectorParque(null);
        return;
      }
      if (parqueSeleccionado) {
        setParqueSeleccionado(null);
      }
    };
    window.addEventListener('keydown', manejarEscape);
    return () => {
      window.removeEventListener('keydown', manejarEscape);
    };
  }, [selectorParque, parqueSeleccionado]);
  const [
    solicitudRecentrar,
    setSolicitudRecentrar,
  ] = useState(0);
  // Obtiene la información del usuario almacenada localmente.
  const usuario =
    useMemo<UsuarioLocal>(
      () => {
        try {
          return JSON.parse(
            localStorage.getItem(
              'usuario',
            ) ?? '{}',
          );
        } catch {
          return {};
        }
      },
      [],
    );
  const nombreUsuario =
    usuario.nombre_usuario?.trim() ||
    usuario.correo?.split('@')[0] ||
    'Usuario';
  const iniciales =
    nombreUsuario
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (parte) =>
          parte[0]?.toUpperCase(),
      )
      .join('');
  // Carga parques y distritos desde la API.
  const cargarDatos =
    async () => {
      try {
        setCargando(true);
        setError('');
        const [
          respuestaParques,
          respuestaDistritos,
        ] = await Promise.all([
          api.get('/parques'),
          api.get('/distritos'),
        ]);
        setParques(
          Array.isArray(
            respuestaParques.data,
          )
            ? respuestaParques.data
            : [],
        );
        setDistritos(
          Array.isArray(
            respuestaDistritos.data,
          )
            ? respuestaDistritos.data
            : [],
        );
      } catch (errorCarga) {
        console.error(
          'Error cargando dashboard:',
          errorCarga,
        );
        setError(
          'No se pudo cargar la información territorial.',
        );
      } finally {
        setCargando(false);
      }
    };
  useEffect(() => {
    cargarDatos();
  }, []);
  // Cierra la sesión actual y regresa al login.
  const cerrarSesion = () => {
    localStorage.removeItem(
      'token',
    );
    localStorage.removeItem(
      'usuario',
    );
    navigate(
      '/login',
      {
        replace: true,
      },
    );
  };
  // Filtra los parques según búsqueda, distrito y estado.
  const parquesFiltrados =
    useMemo(
      () => {
        const termino =
          busqueda
            .trim()
            .toLowerCase();
        return parques.filter(
          (parque) => {
            const coincideBusqueda =
              !termino ||
              parque.ubicacion
                ?.toLowerCase()
                .includes(
                  termino,
                ) ||
              parque.numero_finca
                ?.toLowerCase()
                .includes(
                  termino,
                ) ||
              parque.numero_plano
                ?.toLowerCase()
                .includes(
                  termino,
                ) ||
              parque.encargado
                ?.entidad_encargada
                ?.toLowerCase()
                .includes(
                  termino,
                );
            const idDistritoParque =
              String(
                parque.distrito
                  ?.id_distrito ??
                  parque.id_distrito ??
                  '',
              );
            const coincideDistrito =
              !filtroDistrito ||
              idDistritoParque ===
                filtroDistrito;
            const coincideEstado =
              !filtroEstado ||
              parque.estado ===
                filtroEstado;
            return (
              coincideBusqueda &&
              coincideDistrito &&
              coincideEstado
            );
          },
        );
      },
      [
        parques,
        busqueda,
        filtroDistrito,
        filtroEstado,
      ],
    );
  // Conserva únicamente los parques con coordenadas válidas.
  const parquesGeolocalizados =
    parquesFiltrados.filter(
      (parque) => {
        if (
          parque.latitud === null ||
          parque.latitud === undefined ||
          parque.longitud === null ||
          parque.longitud === undefined
        ) {
          return false;
        }
        return (
          Number.isFinite(
            Number(
              parque.latitud,
            ),
          ) &&
          Number.isFinite(
            Number(
              parque.longitud,
            ),
          )
        );
      },
    );
  // Calcula cuántos parques tienen ubicación registrada.
  const totalGeolocalizados =
    parques.filter(
      (parque) =>
        parque.latitud !== null &&
        parque.latitud !== undefined &&
        parque.longitud !== null &&
        parque.longitud !== undefined &&
        Number.isFinite(
          Number(
            parque.latitud,
          ),
        ) &&
        Number.isFinite(
          Number(
            parque.longitud,
          ),
        ),
    ).length;
  // Calcula cuántos parques aún no tienen ubicación registrada.
  const pendientesUbicacion =
    parques.length -
    totalGeolocalizados;
  // Restablece los filtros del dashboard.
  const limpiarFiltros =
    () => {
      setBusqueda('');
      setFiltroDistrito('');
      setFiltroEstado('');
    };
  // Construye el contenido del menú lateral del sistema.
  const sidebar = (
    <aside className="flex h-full flex-col bg-[#071923] text-white">
      <div className="border-b border-white/10 px-5 pb-5 pt-6">
        <img
          src={
            logoMunicipalidad
          }
          alt="Municipalidad de Grecia"
          className="h-12 w-auto object-contain"
        />
        <div className="mt-4">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-emerald-400">
            Gobierno Local
          </p>
          <h1 className="mt-1 text-lg font-black tracking-tight text-white">
            Sistema de Catastro
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Gestión Territorial
          </p>
        </div>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
          Navegación
        </p>
        <div className="space-y-1">
          {modules.map(
            (module) => {
              const Icon =
                module.icon;
              const activo =
                module.route ===
                '/dashboard';
              return (
                <button
                  key={
                    module.title
                  }
                  type="button"
                  onClick={() => {
                    navigate(
                      module.route,
                    );
                    setMenuMovilAbierto(
                      false,
                    );
                  }}
                  className={
                    activo
                      ? 'group flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 text-left shadow-sm'
                      : 'group flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left transition hover:border-white/5 hover:bg-white/5'
                  }
                >
                  <span
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor:
                        `${module.accentHex}20`,
                      color:
                        module.accentHex,
                    }}
                  >
                    <Icon
                      size={18}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={
                        activo
                          ? 'truncate text-sm font-bold text-white'
                          : 'truncate text-sm font-semibold text-slate-300 group-hover:text-white'
                      }
                    >
                      {
                        module.title
                      }
                    </p>
                  </div>
                  <ChevronRight
                    size={15}
                    className="flex-shrink-0 text-slate-600 transition group-hover:text-slate-300"
                  />
                </button>
              );
            },
          )}
        </div>
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#18843B] text-xs font-black text-white">
            {
              iniciales ||
              'U'
            }
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-white">
              {
                nombreUsuario
              }
            </p>
            <p className="truncate text-[10px] text-slate-400">
              {
                usuario.correo ||
                'Sesión activa'
              }
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={
            cerrarSesion
          }
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs font-bold text-red-300 transition hover:bg-red-500/20"
        >
          <LogOut
            size={15}
          />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#071923] font-sans text-white antialiased">
      {/* Fondo institucional oscuro */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            `url(${fondoGrecia})`,
        }}
      />
      <div
        className="fixed inset-0 z-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(4,17,24,.94) 0%, rgba(5,24,33,.97) 55%, rgba(4,18,26,.98) 100%)',
        }}
      />
      {/* Franja institucional */}
      <div className="fixed inset-x-0 top-0 z-[2000] grid h-1.5 grid-cols-[2.2fr_1fr_.7fr]">
        <span className="bg-[#315F73]" />
        <span className="bg-[#18843B]" />
        <span className="bg-[#D4112E]" />
      </div>
      {/* Sidebar escritorio */}
      <div className="fixed bottom-0 left-0 top-1.5 z-[1000] hidden w-[270px] border-r border-white/10 shadow-2xl lg:block">
        {sidebar}
      </div>
      {/* Sidebar móvil */}
      {menuMovilAbierto && (
        <div
          className="fixed inset-0 lg:hidden"
          style={{
            zIndex: 6000,
          }}
        >
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() =>
              setMenuMovilAbierto(
                false,
              )
            }
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />
          <div className="absolute bottom-0 left-0 top-0 w-[285px] shadow-2xl">
            {sidebar}
          </div>
        </div>
      )}
      <div className="relative z-10 min-h-screen lg:pl-[270px]">
        {/* Cabecera */}
        <header className="sticky top-1.5 z-[900] border-b border-white/10 bg-[#0B212D]/90 px-4 py-3 shadow-xl backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setMenuMovilAbierto(
                    true,
                  )
                }
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white lg:hidden"
              >
                <Menu
                  size={20}
                />
              </button>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-emerald-400">
                  Panel Administrativo
                </p>
                <h2 className="truncate text-lg font-black tracking-tight text-white">
                  Mapa territorial de parques
                </h2>
              </div>
            </div>
            <div className="hidden items-center gap-3 sm:flex">
              <div className="text-right">
                <p className="text-xs font-bold text-white">
                  {
                    nombreUsuario
                  }
                </p>
                <p className="text-[10px] text-slate-400">
                  Municipalidad de Grecia
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#18843B] text-xs font-black text-white shadow-lg">
                {
                  iniciales ||
                  'U'
                }
              </div>
            </div>
          </div>
        </header>
        <main className="px-4 py-5 sm:px-6 lg:px-8">
          {/* Introducción */}
          <section className="mb-5 overflow-hidden rounded-2xl border border-white/10 bg-[#0C2330]/85 shadow-2xl backdrop-blur-xl">
            <div className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
                  <Building2
                    size={15}
                  />
                  Departamento de Gestión Territorial
                </div>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-white">
                  Vista territorial de los parques municipales
                </h3>
                <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-300">
                  Consulte la ubicación de los parques registrados en el sistema.
                  Seleccione un marcador para revisar la información del parque.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  navigate(
                    '/parques',
                  )
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#18843B] px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-emerald-600"
              >
                <TreePine
                  size={17}
                />
                Gestionar parques
              </button>
            </div>
          </section>
          {/* Resumen */}
          <section className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#0D222E]/88 p-4 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Total de parques
                  </p>
                  <p className="mt-1 text-3xl font-black text-white">
                    {
                      parques.length
                    }
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                  <TreePine
                    size={22}
                  />
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0D222E]/88 p-4 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Geolocalizados
                  </p>
                  <p className="mt-1 text-3xl font-black text-white">
                    {
                      totalGeolocalizados
                    }
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-sky-500/20 bg-sky-500/10 text-sky-300">
                  <MapPinned
                    size={22}
                  />
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0D222E]/88 p-4 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Pendientes de ubicación
                  </p>
                  <p className="mt-1 text-3xl font-black text-white">
                    {
                      pendientesUbicacion
                    }
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-300">
                  <MapPin
                    size={22}
                  />
                </div>
              </div>
            </div>
          </section>
          {/* Filtros */}
          <section className="mb-5 rounded-2xl border border-white/10 bg-[#0C2330]/85 p-4 shadow-xl backdrop-blur-xl">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.5fr_1fr_1fr_auto]">
              <div className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="text"
                  value={
                    busqueda
                  }
                  onChange={(
                    event,
                  ) =>
                    setBusqueda(
                      event.target.value,
                    )
                  }
                  placeholder="Buscar parque, finca, plano o encargado..."
                  className="h-11 w-full rounded-xl border border-white/15 bg-[#071923]/80 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-500"
                />
              </div>
              <select
                value={
                  filtroDistrito
                }
                onChange={(
                  event,
                ) =>
                  setFiltroDistrito(
                    event.target.value,
                  )
                }
                className="h-11 w-full rounded-xl border border-white/15 bg-[#071923] px-3 text-sm text-white outline-none transition focus:border-emerald-500"
              >
                <option value="">
                  Todos los distritos
                </option>
                {distritos.map(
                  (
                    distrito,
                  ) => (
                    <option
                      key={
                        distrito.id_distrito
                      }
                      value={
                        distrito.id_distrito
                      }
                    >
                      {
                        distrito.nombre_distrito
                      }
                    </option>
                  ),
                )}
              </select>
              <select
                value={
                  filtroEstado
                }
                onChange={(
                  event,
                ) =>
                  setFiltroEstado(
                    event.target.value,
                  )
                }
                className="h-11 w-full rounded-xl border border-white/15 bg-[#071923] px-3 text-sm text-white outline-none transition focus:border-emerald-500"
              >
                <option value="">
                  Todos los estados
                </option>
                <option value="Bueno">
                  Bueno
                </option>
                <option value="Regular">
                  Regular
                </option>
                <option value="Malo">
                  Malo
                </option>
                <option value="Vacío">
                  Vacío
                </option>
              </select>
              <button
                type="button"
                onClick={
                  limpiarFiltros
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <RotateCcw
                  size={15}
                />
                Limpiar
              </button>
            </div>
          </section>
          {/* Mapa */}
          <section className="relative z-0 overflow-hidden rounded-2xl border border-white/10 bg-[#0B212D] shadow-2xl">
            <div className="flex flex-col gap-3 border-b border-white/10 bg-[#0C2330] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <MapPinned
                    size={18}
                    className="text-emerald-400"
                  />
                  <h3 className="font-black text-white">
                    Mapa de parques
                  </h3>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Mostrando {
                    parquesGeolocalizados.length
                  } parque{
                    parquesGeolocalizados.length === 1
                      ? ''
                      : 's'
                  } con ubicación dentro de los filtros aplicados.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <i className="h-2.5 w-2.5 rounded-full bg-[#18843B]" />
                  Bueno
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <i className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                  Regular
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <i className="h-2.5 w-2.5 rounded-full bg-[#D4112E]" />
                  Malo
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <i className="h-2.5 w-2.5 rounded-full bg-slate-500" />
                  Vacío
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setSolicitudRecentrar(
                      (
                        valor,
                      ) =>
                        valor +
                        1,
                    )
                  }
                  className="ml-1 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-sky-300 transition hover:bg-white/10"
                >
                  <Navigation
                    size={13}
                  />
                  Retomar vista
                </button>
              </div>
            </div>
            {cargando ? (
              <div className="flex h-[560px] items-center justify-center bg-[#071923]">
                <p className="text-sm font-semibold text-slate-400">
                  Cargando mapa territorial...
                </p>
              </div>
            ) : error ? (
              <div className="flex h-[560px] flex-col items-center justify-center bg-[#071923] px-6 text-center">
                <p className="font-bold text-red-300">
                  {error}
                </p>
                <button
                  type="button"
                  onClick={
                    cargarDatos
                  }
                  className="mt-4 rounded-xl bg-[#315F73] px-4 py-2 text-sm font-bold text-white"
                >
                  Intentar nuevamente
                </button>
              </div>
            ) : (
              <div
                className="relative z-0 h-[560px] w-full"
                style={{
                  isolation:
                    'isolate',
                }}
              >
                <ArcgisMapaParques
                  parques={parquesGeolocalizados}
                  solicitudRecentrar={solicitudRecentrar}
                  onSeleccionarParque={setParqueSeleccionado}
                  onElegirVistaParque={(parque, abrirDatosMapa) => {
                    setSelectorParque({
                      parque,
                      abrirDatosMapa,
                    });
                  }}
                />
                {parquesGeolocalizados.length === 0 && (
                  <div className="pointer-events-none absolute inset-x-4 bottom-4 z-[500] rounded-xl border border-amber-500/20 bg-[#0B212D]/95 p-4 text-center shadow-xl backdrop-blur">
                    <p className="text-sm font-bold text-amber-300">
                      No hay parques geolocalizados que coincidan con los filtros actuales.
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>
        </main>
        <footer className="border-t border-white/10 bg-[#071923]/95 px-6 py-4 text-center text-xs text-slate-500">
          Sistema de Catastro Municipal · Municipalidad de Grecia, Gobierno Local
        </footer>
      </div>
      {/* Selector de vista del parque */}
      {selectorParque && (
        <div
          onClick={() => setSelectorParque(null)}
          className="fixed inset-0 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          style={{ zIndex: 10000 }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0B212D] text-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-white/10 px-6 py-5">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-emerald-400">
                  Parque municipal
                </p>
                <h3 className="mt-1 text-xl font-black">
                  {selectorParque.parque.ubicacion}
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  ¿Qué información desea consultar?
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectorParque(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid gap-3 p-6">
              <button
                type="button"
                onClick={() => {
                  const abrir = selectorParque.abrirDatosMapa;
                  setSelectorParque(null);
                  window.setTimeout(() => abrir(), 0);
                }}
                className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4 text-left transition hover:border-cyan-400/40 hover:bg-cyan-400/10"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="font-extrabold text-white">Ver datos del mapa</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Muestra el cuadro de ArcGIS con distrito, estado y número de finca.
                    </p>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  const parque = selectorParque.parque;
                  setSelectorParque(null);
                  setParqueSeleccionado(parque);
                }}
                className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-left transition hover:border-emerald-400/40 hover:bg-emerald-400/10"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                    <Info size={20} />
                  </div>
                  <div>
                    <p className="font-extrabold text-white">Ver información completa</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Muestra área, plano, encargado, coordenadas y los demás datos del parque.
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de información del marcador */}
      {parqueSeleccionado && (
        <div
          onClick={() =>
            setParqueSeleccionado(
              null,
            )
          }
          className="fixed inset-0 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          style={{
            zIndex: 9999,
          }}
        >
          <div
            onClick={(
              event,
            ) =>
              event.stopPropagation()
            }
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0B212D] text-white shadow-2xl"
          >
            <div className="flex flex-shrink-0 items-start justify-between border-b border-white/10 px-6 py-5">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-emerald-400">
                  Parque municipal
                </p>
                <h3 className="mt-1 text-xl font-black text-white">
                  Información del parque
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  Consulte los datos principales del parque seleccionado.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setParqueSeleccionado(
                    null,
                  )
                }
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <X
                  size={18}
                />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-sky-300">
                  Ubicación
                </p>
                <p className="mt-1 text-lg font-black text-white">
                  {
                    parqueSeleccionado.ubicacion
                  }
                </p>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  [
                    'Distrito',
                    parqueSeleccionado
                      .distrito
                      ?.nombre_distrito ??
                      'Sin distrito',
                  ],
                  [
                    'Estado',
                    parqueSeleccionado
                      .estado,
                  ],
                  [
                    'Número de finca',
                    parqueSeleccionado
                      .numero_finca,
                  ],
                  [
                    'Área',
                    `${parqueSeleccionado.area} m²`,
                  ],
                  [
                    'Número de plano',
                    parqueSeleccionado
                      .numero_plano,
                  ],
                  [
                    'Visado',
                    parqueSeleccionado
                      .visado,
                  ],
                ].map(
                  ([
                    etiqueta,
                    valor,
                  ]) => (
                    <div
                      key={
                        etiqueta
                      }
                      className="rounded-xl border border-white/10 bg-white/5 p-3"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {
                          etiqueta
                        }
                      </p>
                      <p className="mt-1 text-sm font-bold text-white">
                        {
                          valor
                        }
                      </p>
                    </div>
                  ),
                )}
              </div>
              <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Entidad encargada
                </p>
                <p className="mt-1 text-sm font-bold text-white">
                  {
                    parqueSeleccionado
                      .encargado
                      ?.entidad_encargada ??
                    'Sin entidad encargada'
                  }
                </p>
                {parqueSeleccionado
                  .encargado
                  ?.representante_legal && (
                  <p className="mt-1 text-xs text-slate-400">
                    Representante:{' '}
                    {
                      parqueSeleccionado
                        .encargado
                        .representante_legal
                    }
                  </p>
                )}
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Latitud
                  </p>
                  <p className="mt-1 font-mono text-sm font-bold text-white">
                    {
                      Number(
                        parqueSeleccionado.latitud,
                      ).toFixed(
                        7,
                      )
                    }
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Longitud
                  </p>
                  <p className="mt-1 font-mono text-sm font-bold text-white">
                    {
                      Number(
                        parqueSeleccionado.longitud,
                      ).toFixed(
                        7,
                      )
                    }
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-shrink-0 flex-col gap-2 border-t border-white/10 bg-[#091D27] px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  const lat =
                    Number(
                      parqueSeleccionado.latitud,
                    );
                  const lng =
                    Number(
                      parqueSeleccionado.longitud,
                    );
                  window.open(
                    `https\://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
                    '_blank',
                    'noopener,noreferrer',
                  );
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#18843B] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600"
              >
                <Navigation
                  size={16}
                />
                Abrir en Google Maps
              </button>
              <button
                type="button"
                onClick={() =>
                  navigate(
                    '/parques',
                  )
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#315F73] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#244C5F]"
              >
                <TreePine
                  size={16}
                />
                Ir a Parques
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

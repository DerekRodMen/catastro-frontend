import { useEffect, useRef, useState } from 'react';

import WebMap from '@arcgis/core/WebMap';
import MapView from '@arcgis/core/views/MapView';

import Home from '@arcgis/core/widgets/Home';
import Locate from '@arcgis/core/widgets/Locate';
import Search from '@arcgis/core/widgets/Search';
import Expand from '@arcgis/core/widgets/Expand';
import LayerList from '@arcgis/core/widgets/LayerList';

import '@arcgis/core/assets/esri/themes/light/main.css';

import SidebarCatastro from '../../components/SidebarCatastro';

// ID del WebMap publicado en ArcGIS Online.
const WEB_MAP_ID = '3cbc884187ce4abd8cbff1b4f698cd53';

// Componente principal del visor de mapa catastral.
export default function Mapa() {
  // Referencia al contenedor HTML donde ArcGIS renderiza el mapa.
  const mapaRef = useRef<HTMLDivElement | null>(null);

  // Estados generales de carga y error.
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Inicializa el mapa cuando el componente se monta.
  useEffect(() => {
    if (!mapaRef.current) {
      return;
    }

    let view: MapView | null = null;
    let desmontado = false;

    // Carga el WebMap municipal y configura el MapView.
    const cargarMapa = async () => {
      try {
        setCargando(true);
        setError('');

        // Carga el mapa publicado en ArcGIS Online.
        const webMap = new WebMap({
          portalItem: {
            id: WEB_MAP_ID,
          },
        });

        // Crea la vista interactiva del mapa.
        view = new MapView({
          container: mapaRef.current as HTMLDivElement,
          map: webMap,
          padding: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
          },
          popup: {
            dockEnabled: false,
            dockOptions: {
              buttonEnabled: true,
              position: 'top-right',
            },
          },
        });

        // Espera a que ArcGIS termine de inicializar la vista.
        await view.when();

        if (desmontado) {
          return;
        }

        // Widget de búsqueda geográfica.
        const search = new Search({
          view,
        });

        view.ui.add(search, 'top-right');

        // Widget para regresar a la vista inicial del mapa.
        const home = new Home({
          view,
        });

        view.ui.add(home, 'top-left');

        // Widget para localizar al usuario en el mapa.
        const locate = new Locate({
          view,
        });

        view.ui.add(locate, 'top-left');

        // Lista de capas disponibles en el WebMap.
        const layerList = new LayerList({
          view,
        });

        // Contenedor desplegable para mostrar u ocultar las capas.
        const expandLayers = new Expand({
          view,
          content: layerList,
          expanded: false,
          expandTooltip: 'Capas del mapa',
          collapseTooltip: 'Cerrar capas',
        });

        view.ui.add(expandLayers, 'top-right');

        setCargando(false);
      } catch (err) {
        console.error('Error cargando el mapa de ArcGIS:', err);

        if (!desmontado) {
          setError(
            'No fue posible cargar el mapa catastral de la Municipalidad de Grecia.',
          );

          setCargando(false);
        }
      }
    };

    cargarMapa();

    // Destruye la vista de ArcGIS cuando el componente se desmonta.
    return () => {
      desmontado = true;

      if (view) {
        view.destroy();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Menú lateral principal del sistema */}
      <SidebarCatastro />

      <main className="min-h-screen lg:pl-[270px]">
        <div className="flex h-screen flex-col">
          {/* Encabezado de la página */}
          <header className="flex-shrink-0 border-b border-slate-200 bg-white px-5 py-4 shadow-sm sm:px-6">
            <div className="mx-auto flex w-full max-w-[1800px] items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#18843B]">
                  Gestión Territorial
                </p>

                <h1 className="mt-1 text-xl font-black tracking-tight text-[#071923] sm:text-2xl">
                  Mapa Catastral
                </h1>

                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  Visor geográfico de la Municipalidad de Grecia
                </p>
              </div>

              {/* Identificación del proveedor del mapa */}
              <div className="hidden rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2 sm:block">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  ArcGIS
                </p>

                <p className="text-xs font-semibold text-slate-700">
                  Mapa Web Municipal
                </p>
              </div>
            </div>
          </header>

          {/* Contenedor principal del mapa */}
          <section className="relative min-h-0 flex-1 p-3 sm:p-4">
            <div className="relative h-full w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {/* ArcGIS utiliza este div como contenedor del MapView */}
              <div
                ref={mapaRef}
                className="h-full w-full"
              />

              {/* Pantalla mostrada mientras se carga el mapa */}
              {cargando && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-white">
                  <div className="text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#18843B]" />

                    <p className="mt-4 text-sm font-bold text-[#071923]">
                      Cargando mapa catastral...
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Obteniendo información geográfica
                    </p>
                  </div>
                </div>
              )}

              {/* Pantalla mostrada si ArcGIS no puede cargar el mapa */}
              {error && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-50 p-6">
                  <div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-lg">
                    <h2 className="text-lg font-black text-[#071923]">
                      Error al cargar el mapa
                    </h2>

                    <p className="mt-2 text-sm text-slate-600">
                      {error}
                    </p>

                    {/* Recarga la página para intentar inicializar ArcGIS nuevamente */}
                    <button
                      type="button"
                      onClick={() =>
                        window.location.reload()
                      }
                      className="mt-5 rounded-xl bg-[#18843B] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#146f32]"
                    >
                      Intentar nuevamente
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
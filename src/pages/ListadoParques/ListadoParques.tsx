import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Download,
  FileSpreadsheet,
  FilterX,
  Search,
} from 'lucide-react';

import { api } from '../../services/api';
import Header from '../../components/Header';


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


export default function ListadoParques() {

  // ============================================
  // DATOS
  // ============================================

  const [
    parques,
    setParques,
  ] =
    useState<
      ParqueListado[]
    >([]);


  const [
    distritos,
    setDistritos,
  ] =
    useState<
      Distrito[]
    >([]);


  const [
    encargados,
    setEncargados,
  ] =
    useState<
      Encargado[]
    >([]);


  // ============================================
  // ESTADOS GENERALES
  // ============================================

  const [
    cargando,
    setCargando,
  ] =
    useState(
      true,
    );


  const [
    generandoExcel,
    setGenerandoExcel,
  ] =
    useState(
      false,
    );


  const [
    error,
    setError,
  ] =
    useState(
      '',
    );


  // ============================================
  // FILTROS
  // ============================================

  const [
    filtroDistrito,
    setFiltroDistrito,
  ] =
    useState(
      '',
    );


  const [
    filtroEncargado,
    setFiltroEncargado,
  ] =
    useState(
      '',
    );


  const [
    filtroEstado,
    setFiltroEstado,
  ] =
    useState(
      '',
    );


  const [
    filtroVisado,
    setFiltroVisado,
  ] =
    useState(
      '',
    );


  const [
    filtroEstadoConvenio,
    setFiltroEstadoConvenio,
  ] =
    useState(
      '',
    );


  const [
    busqueda,
    setBusqueda,
  ] =
    useState(
      '',
    );


  // ============================================
  // PAGINACIÓN
  // ============================================

  const [
    paginaActual,
    setPaginaActual,
  ] =
    useState(
      1,
    );


  const [
    registrosPorPagina,
    setRegistrosPorPagina,
  ] =
    useState(
      10,
    );


  // ============================================
  // CREAR PARÁMETROS
  // ============================================

  const construirParametros =
    useCallback(
      () => {

        const params:
          Record<
            string,
            string
          > = {};


        if (
          filtroDistrito
        ) {
          params.id_distrito =
            filtroDistrito;
        }


        if (
          filtroEncargado
        ) {
          params.id_encargado =
            filtroEncargado;
        }


        if (
          filtroEstado
        ) {
          params.estado =
            filtroEstado;
        }


        if (
          filtroVisado
        ) {
          params.visado =
            filtroVisado;
        }


        if (
          filtroEstadoConvenio
        ) {
          params.estado_convenio =
            filtroEstadoConvenio;
        }


        if (
          busqueda.trim()
        ) {
          params.busqueda =
            busqueda.trim();
        }


        return params;
      },
      [
        filtroDistrito,
        filtroEncargado,
        filtroEstado,
        filtroVisado,
        filtroEstadoConvenio,
        busqueda,
      ],
    );


  // ============================================
  // CARGAR CATÁLOGOS
  // ============================================

  const cargarCatalogos =
    useCallback(
      async () => {

        try {

          const [
            respuestaDistritos,
            respuestaEncargados,
          ] =
            await Promise.all(
              [
                api.get(
                  '/distritos',
                ),

                api.get(
                  '/encargados',
                ),
              ],
            );


          const datosDistritos =
            Array.isArray(
              respuestaDistritos.data,
            )
              ? respuestaDistritos.data
              : [];


          const datosEncargados =
            Array.isArray(
              respuestaEncargados.data,
            )
              ? respuestaEncargados.data
              : [];


          setDistritos(
            datosDistritos,
          );


          setEncargados(
            datosEncargados,
          );

        } catch (
          err
        ) {

          console.error(
            'Error cargando catálogos:',
            err,
          );

        }

      },
      [],
    );


  // ============================================
  // CARGAR LISTADO
  // ============================================

  const cargarListado =
    useCallback(
      async () => {

        try {

          setCargando(
            true,
          );

          setError(
            '',
          );


          const respuesta =
            await api.get<
              ParqueListado[]
            >(
              '/listado-parques',
              {
                params:
                  construirParametros(),
              },
            );


          setParques(
            Array.isArray(
              respuesta.data,
            )
              ? respuesta.data
              : [],
          );

        } catch (
          err
        ) {

          console.error(
            'Error cargando listado de parques:',
            err,
          );


          setParques(
            [],
          );


          setError(
            'No fue posible cargar el listado de parques.',
          );

        } finally {

          setCargando(
            false,
          );

        }

      },
      [
        construirParametros,
      ],
    );


  // ============================================
  // CARGA INICIAL
  // ============================================

  useEffect(
    () => {

      void cargarCatalogos();

    },
    [
      cargarCatalogos,
    ],
  );


  useEffect(
    () => {

      const temporizador =
        window.setTimeout(
          () => {

            void cargarListado();

          },
          250,
        );


      return () => {

        window.clearTimeout(
          temporizador,
        );

      };

    },
    [
      cargarListado,
    ],
  );


  // ============================================
  // REINICIAR PAGINACIÓN
  // ============================================

  useEffect(
    () => {

      setPaginaActual(
        1,
      );

    },
    [
      filtroDistrito,
      filtroEncargado,
      filtroEstado,
      filtroVisado,
      filtroEstadoConvenio,
      busqueda,
      registrosPorPagina,
    ],
  );


  // ============================================
  // PAGINACIÓN CALCULADA
  // ============================================

  const totalRegistros =
    parques.length;


  const totalPaginas =
    Math.max(
      1,
      Math.ceil(
        totalRegistros /
        registrosPorPagina,
      ),
    );


  useEffect(
    () => {

      if (
        paginaActual >
        totalPaginas
      ) {
        setPaginaActual(
          totalPaginas,
        );
      }

    },
    [
      paginaActual,
      totalPaginas,
    ],
  );


  const indiceInicial =
    (
      paginaActual -
      1
    ) *
    registrosPorPagina;


  const indiceFinal =
    Math.min(
      indiceInicial +
      registrosPorPagina,
      totalRegistros,
    );


  const parquesPaginados =
    useMemo(
      () => {

        return parques.slice(
          indiceInicial,
          indiceFinal,
        );

      },
      [
        parques,
        indiceInicial,
        indiceFinal,
      ],
    );


  // ============================================
  // PÁGINAS VISIBLES
  // ============================================

  const paginasVisibles =
    useMemo(
      () => {

        const maximo =
          5;


        let inicio =
          Math.max(
            1,
            paginaActual -
            2,
          );


        let fin =
          Math.min(
            totalPaginas,
            inicio +
            maximo -
            1,
          );


        inicio =
          Math.max(
            1,
            fin -
            maximo +
            1,
          );


        const paginas:
          number[] = [];


        for (
          let pagina =
            inicio;
          pagina <= fin;
          pagina++
        ) {
          paginas.push(
            pagina,
          );
        }


        return paginas;

      },
      [
        paginaActual,
        totalPaginas,
      ],
    );


  // ============================================
  // LIMPIAR FILTROS
  // ============================================

  const limpiarFiltros =
    () => {

      setFiltroDistrito(
        '',
      );

      setFiltroEncargado(
        '',
      );

      setFiltroEstado(
        '',
      );

      setFiltroVisado(
        '',
      );

      setFiltroEstadoConvenio(
        '',
      );

      setBusqueda(
        '',
      );

      setPaginaActual(
        1,
      );

    };


  // ============================================
  // GENERAR EXCEL
  // ============================================

  const generarExcel =
    async () => {

      try {

        setGenerandoExcel(
          true,
        );

        setError(
          '',
        );


        const respuesta =
          await api.get(
            '/listado-parques/excel',
            {
              params:
                construirParametros(),

              responseType:
                'blob',
            },
          );


        const blob =
          new Blob(
            [
              respuesta.data,
            ],
            {
              type:
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
          );


        const url =
          window.URL.createObjectURL(
            blob,
          );


        const enlace =
          document.createElement(
            'a',
          );


        enlace.href =
          url;


        const fecha =
          new Date()
            .toISOString()
            .substring(
              0,
              10,
            );


        enlace.download =
          `LISTADO_PARQUES_${fecha}.xlsx`;


        document.body.appendChild(
          enlace,
        );


        enlace.click();


        enlace.remove();


        window.URL.revokeObjectURL(
          url,
        );

      } catch (
        err
      ) {

        console.error(
          'Error generando Excel:',
          err,
        );


        setError(
          'No fue posible generar el archivo Excel.',
        );

      } finally {

        setGenerandoExcel(
          false,
        );

      }

    };


  // ============================================
  // FORMATEAR MONEDA
  // ============================================

  const formatearMoneda =
    (
      valor:
        number |
        null |
        undefined,
    ) => {

      const numero =
        Number(
          valor ??
          0,
        );


      return new Intl.NumberFormat(
        'es-CR',
        {
          style:
            'currency',

          currency:
            'CRC',

          minimumFractionDigits:
            2,
        },
      ).format(
        numero,
      );

    };


  // ============================================
  // FORMATEAR DISTRITO
  // ============================================

  const formatearDistrito =
    (
      distrito:
        Distrito |
        null,
    ) => {

      if (
        !distrito
      ) {
        return 'Sin distrito';
      }


      return (
        `${String(
          distrito.numero_distrito,
        ).padStart(
          2,
          '0',
        )} - ${distrito.nombre_distrito}`
      );

    };


  // ============================================
  // VALORES ÚNICOS
  // ============================================

  const estadosParque =
    [
      'Bueno',
      'Regular',
      'Malo',
      'Vacío',
    ];


  const visados =
    [
      'Aprobado',
      'Solicitado',
      'No tiene',
    ];


  const estadosConvenio =
    useMemo(
      () => {

        const valores =
          new Set<
            string
          >();


        parques.forEach(
          (
            parque,
          ) => {

            parque.convenios.forEach(
              (
                convenio,
              ) => {

                const estado =
                  convenio
                    .estado_convenio
                    ?.trim();


                if (
                  estado
                ) {
                  valores.add(
                    estado,
                  );
                }

              },
            );

          },
        );


        return Array.from(
          valores,
        ).sort(
          (
            a,
            b,
          ) =>
            a.localeCompare(
              b,
              'es',
            ),
        );

      },
      [
        parques,
      ],
    );


  return (

    <div
      className="min-h-screen bg-[#F4F7F8]"
    >

      <Header
        title="Listado de Parques"
        description="Consulta, filtre y genere el listado de propiedades municipales."
      />


      <main
        className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-6 lg:px-8"
      >

        {/* ===================================== */}
        {/* ENCABEZADO DEL MÓDULO */}
        {/* ===================================== */}

        <section
          className="mb-6 rounded-2xl border border-[#D9E2E7] bg-white p-5 shadow-sm"
        >

          <div
            className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
          >

            <div>

              <div
                className="mb-2 flex items-center gap-3"
              >

                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F4EC] text-[#18843B]"
                >
                  <FileSpreadsheet
                    size={
                      23
                    }
                  />
                </div>


                <div>

                  <h2
                    className="text-xl font-bold text-[#16313E]"
                  >
                    Listado de propiedades municipales
                  </h2>


                  <p
                    className="text-sm text-slate-500"
                  >
                    Aplique los filtros deseados y genere el archivo Excel.
                  </p>

                </div>

              </div>

            </div>


            <button
              type="button"
              onClick={
                generarExcel
              }
              disabled={
                generandoExcel
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#18843B] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#126D31] disabled:cursor-not-allowed disabled:opacity-60"
            >

              <Download
                size={
                  18
                }
              />


              {
                generandoExcel
                  ? 'Generando...'
                  : 'Generar Excel'
              }

            </button>

          </div>

        </section>


        {/* ===================================== */}
        {/* FILTROS */}
        {/* ===================================== */}

        <section
          className="mb-6 rounded-2xl border border-[#D9E2E7] bg-white p-5 shadow-sm"
        >

          <div
            className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >

            <div>

              <h3
                className="text-base font-bold text-[#16313E]"
              >
                Filtros del listado
              </h3>


              <p
                className="mt-1 text-sm text-slate-500"
              >
                Los filtros pueden utilizarse de forma individual o combinada.
              </p>

            </div>


            <button
              type="button"
              onClick={
                limpiarFiltros
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#D9E2E7] bg-white px-4 py-2 text-sm font-semibold text-[#315F73] transition hover:bg-[#F4F7F8]"
            >

              <FilterX
                size={
                  16
                }
              />

              Limpiar filtros

            </button>

          </div>


          <div
            className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
          >

            {/* BÚSQUEDA */}

            <div
              className="xl:col-span-3"
            >

              <label
                className="mb-1.5 block text-sm font-semibold text-[#16313E]"
              >
                Buscar parque
              </label>


              <div
                className="relative"
              >

                <Search
                  size={
                    17
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />


                <input
                  type="text"
                  value={
                    busqueda
                  }
                  onChange={
                    (
                      event,
                    ) =>
                      setBusqueda(
                        event.target.value,
                      )
                  }
                  placeholder="Buscar por ubicación, finca, plano, distrito o encargado..."
                  className="w-full rounded-xl border border-[#D9E2E7] bg-white py-2.5 pl-10 pr-3 text-sm text-[#16313E] outline-none transition focus:border-[#315F73] focus:ring-2 focus:ring-[#315F73]/10"
                />

              </div>

            </div>


            {/* DISTRITO */}

            <div>

              <label
                className="mb-1.5 block text-sm font-semibold text-[#16313E]"
              >
                Distrito
              </label>


              <select
                value={
                  filtroDistrito
                }
                onChange={
                  (
                    event,
                  ) =>
                    setFiltroDistrito(
                      event.target.value,
                    )
                }
                className="w-full rounded-xl border border-[#D9E2E7] bg-white px-3 py-2.5 text-sm text-[#16313E] outline-none focus:border-[#315F73]"
              >

                <option
                  value=""
                >
                  Todos los distritos
                </option>


                {
                  [...distritos]
                    .sort(
                      (
                        a,
                        b,
                      ) =>
                        a.numero_distrito -
                        b.numero_distrito,
                    )
                    .map(
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
                            `${String(
                              distrito.numero_distrito,
                            ).padStart(
                              2,
                              '0',
                            )} - ${distrito.nombre_distrito}`
                          }
                        </option>

                      ),
                    )
                }

              </select>

            </div>


            {/* ENCARGADO */}

            <div>

              <label
                className="mb-1.5 block text-sm font-semibold text-[#16313E]"
              >
                Encargado
              </label>


              <select
                value={
                  filtroEncargado
                }
                onChange={
                  (
                    event,
                  ) =>
                    setFiltroEncargado(
                      event.target.value,
                    )
                }
                className="w-full rounded-xl border border-[#D9E2E7] bg-white px-3 py-2.5 text-sm text-[#16313E] outline-none focus:border-[#315F73]"
              >

                <option
                  value=""
                >
                  Todos los encargados
                </option>


                {
                  [...encargados]
                    .sort(
                      (
                        a,
                        b,
                      ) =>
                        a.entidad_encargada.localeCompare(
                          b.entidad_encargada,
                          'es',
                        ),
                    )
                    .map(
                      (
                        encargado,
                      ) => (

                        <option
                          key={
                            encargado.id_encargado
                          }
                          value={
                            encargado.id_encargado
                          }
                        >
                          {
                            encargado.entidad_encargada
                          }
                        </option>

                      ),
                    )
                }

              </select>

            </div>


            {/* ESTADO PARQUE */}

            <div>

              <label
                className="mb-1.5 block text-sm font-semibold text-[#16313E]"
              >
                Estado del parque
              </label>


              <select
                value={
                  filtroEstado
                }
                onChange={
                  (
                    event,
                  ) =>
                    setFiltroEstado(
                      event.target.value,
                    )
                }
                className="w-full rounded-xl border border-[#D9E2E7] bg-white px-3 py-2.5 text-sm text-[#16313E] outline-none focus:border-[#315F73]"
              >

                <option
                  value=""
                >
                  Todos los estados
                </option>


                {
                  estadosParque.map(
                    (
                      estado,
                    ) => (

                      <option
                        key={
                          estado
                        }
                        value={
                          estado
                        }
                      >
                        {
                          estado
                        }
                      </option>

                    ),
                  )
                }

              </select>

            </div>


            {/* VISADO */}

            <div>

              <label
                className="mb-1.5 block text-sm font-semibold text-[#16313E]"
              >
                Visado
              </label>


              <select
                value={
                  filtroVisado
                }
                onChange={
                  (
                    event,
                  ) =>
                    setFiltroVisado(
                      event.target.value,
                    )
                }
                className="w-full rounded-xl border border-[#D9E2E7] bg-white px-3 py-2.5 text-sm text-[#16313E] outline-none focus:border-[#315F73]"
              >

                <option
                  value=""
                >
                  Todos los visados
                </option>


                {
                  visados.map(
                    (
                      visado,
                    ) => (

                      <option
                        key={
                          visado
                        }
                        value={
                          visado
                        }
                      >
                        {
                          visado
                        }
                      </option>

                    ),
                  )
                }

              </select>

            </div>


            {/* ESTADO CONVENIO */}

            <div>

              <label
                className="mb-1.5 block text-sm font-semibold text-[#16313E]"
              >
                Estado del convenio
              </label>


              <select
                value={
                  filtroEstadoConvenio
                }
                onChange={
                  (
                    event,
                  ) =>
                    setFiltroEstadoConvenio(
                      event.target.value,
                    )
                }
                className="w-full rounded-xl border border-[#D9E2E7] bg-white px-3 py-2.5 text-sm text-[#16313E] outline-none focus:border-[#315F73]"
              >

                <option
                  value=""
                >
                  Todos los estados
                </option>


                {
                  estadosConvenio.map(
                    (
                      estado,
                    ) => (

                      <option
                        key={
                          estado
                        }
                        value={
                          estado
                        }
                      >
                        {
                          estado
                        }
                      </option>

                    ),
                  )
                }

              </select>

            </div>

          </div>

        </section>


        {/* ===================================== */}
        {/* ERROR */}
        {/* ===================================== */}

        {
          error && (

            <div
              className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            >
              {
                error
              }
            </div>

          )
        }


        {/* ===================================== */}
        {/* TABLA */}
        {/* ===================================== */}

        <section
          className="overflow-hidden rounded-2xl border border-[#D9E2E7] bg-white shadow-sm"
        >

          <div
            className="border-b border-[#D9E2E7] px-5 py-4"
          >

            <h3
              className="font-bold text-[#16313E]"
            >
              Propiedades encontradas
            </h3>


            <p
              className="mt-1 text-sm text-slate-500"
            >
              {
                cargando
                  ? 'Consultando información...'
                  : `${totalRegistros} registro${totalRegistros === 1 ? '' : 's'} encontrado${totalRegistros === 1 ? '' : 's'}.`
              }
            </p>

          </div>


          <div
            className="overflow-x-auto"
          >

            <table
              className="w-full min-w-[1500px]"
            >

              <thead
                className="bg-[#F4F7F8]"
              >

                <tr
                  className="border-b border-[#D9E2E7]"
                >

                  {
                    [
                      'Distrito',
                      'Ubicación',
                      'Finca',
                      'm²',
                      'Plano',
                      'Visado',
                      'Declaración',
                      'Encargado',
                      'Convenio',
                      'Estado convenio',
                      'Estado parque',
                      'Inversión',
                    ].map(
                      (
                        encabezado,
                      ) => (

                        <th
                          key={
                            encabezado
                          }
                          className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#315F73]"
                        >
                          {
                            encabezado
                          }
                        </th>

                      ),
                    )
                  }

                </tr>

              </thead>


              <tbody>

                {
                  cargando ? (

                    <tr>

                      <td
                        colSpan={
                          12
                        }
                        className="px-4 py-12 text-center text-sm text-slate-500"
                      >
                        Cargando listado de parques...
                      </td>

                    </tr>

                  ) : parquesPaginados.length === 0 ? (

                    <tr>

                      <td
                        colSpan={
                          12
                        }
                        className="px-4 py-12 text-center text-sm text-slate-500"
                      >
                        No se encontraron parques con los filtros seleccionados.
                      </td>

                    </tr>

                  ) : (

                    parquesPaginados.map(
                      (
                        parque,
                      ) => {

                        const ultimoConvenio =
                          parque.convenios.length >
                          0
                            ? parque.convenios[
                                parque.convenios.length -
                                1
                              ]
                            : null;


                        const ultimaDeclaracion =
                          parque.declaraciones.length >
                          0
                            ? parque.declaraciones[
                                parque.declaraciones.length -
                                1
                              ]
                            : null;


                        return (

                          <tr
                            key={
                              parque.id_parque
                            }
                            className="border-b border-[#E7EDF0] transition last:border-b-0 hover:bg-[#F8FAFB]"
                          >

                            <td
                              className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-[#16313E]"
                            >
                              {
                                formatearDistrito(
                                  parque.distrito,
                                )
                              }
                            </td>


                            <td
                              className="max-w-[300px] px-4 py-3 text-sm text-slate-700"
                              title={
                                parque.ubicacion
                              }
                            >
                              <div
                                className="truncate"
                              >
                                {
                                  parque.ubicacion
                                }
                              </div>
                            </td>


                            <td
                              className="whitespace-nowrap px-4 py-3 text-sm text-slate-700"
                            >
                              {
                                parque.numero_finca ||
                                '—'
                              }
                            </td>


                            <td
                              className="whitespace-nowrap px-4 py-3 text-sm text-slate-700"
                            >
                              {
                                Number(
                                  parque.area,
                                ).toLocaleString(
                                  'es-CR',
                                  {
                                    maximumFractionDigits:
                                      2,
                                  },
                                )
                              }
                            </td>


                            <td
                              className="whitespace-nowrap px-4 py-3 text-sm text-slate-700"
                            >
                              {
                                parque.numero_plano ||
                                '—'
                              }
                            </td>


                            <td
                              className="whitespace-nowrap px-4 py-3 text-sm text-slate-700"
                            >
                              {
                                parque.visado ||
                                '—'
                              }
                            </td>


                            <td
                              className="whitespace-nowrap px-4 py-3 text-sm text-slate-700"
                            >
                              {
                                ultimaDeclaracion
                                  ?.estado_declaracion ||
                                'Sin declaración'
                              }
                            </td>


                            <td
                              className="max-w-[300px] px-4 py-3 text-sm text-slate-700"
                              title={
                                parque.encargado
                                  ?.entidad_encargada ||
                                ''
                              }
                            >
                              <div
                                className="truncate"
                              >
                                {
                                  parque.encargado
                                    ?.entidad_encargada ||
                                  'Sin encargado'
                                }
                              </div>
                            </td>


                            <td
                              className="whitespace-nowrap px-4 py-3 text-sm text-slate-700"
                            >
                              {
                                ultimoConvenio
                                  ?.numero_convenio ||
                                'Sin convenio'
                              }
                            </td>


                            <td
                              className="whitespace-nowrap px-4 py-3 text-sm text-slate-700"
                            >
                              {
                                ultimoConvenio
                                  ?.estado_convenio ||
                                'Sin convenio'
                              }
                            </td>


                            <td
                              className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-slate-700"
                            >
                              {
                                parque.estado ||
                                '—'
                              }
                            </td>


                            <td
                              className="whitespace-nowrap px-4 py-3 text-sm font-bold text-[#18843B]"
                            >
                              {
                                formatearMoneda(
                                  parque.inversion
                                    .total,
                                )
                              }
                            </td>

                          </tr>

                        );

                      },
                    )

                  )
                }

              </tbody>

            </table>

          </div>


          {/* =================================== */}
          {/* PAGINACIÓN */}
          {/* =================================== */}

          <div
            className="flex flex-col gap-4 border-t border-[#D9E2E7] bg-white px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
          >

            <div
              className="text-sm text-slate-500"
            >

              {
                totalRegistros === 0
                  ? 'Mostrando 0 registros'
                  : (
                    <>
                      Mostrando{' '}
                      <strong
                        className="text-[#16313E]"
                      >
                        {
                          indiceInicial +
                          1
                        }
                      </strong>
                      {' '}a{' '}
                      <strong
                        className="text-[#16313E]"
                      >
                        {
                          indiceFinal
                        }
                      </strong>
                      {' '}de{' '}
                      <strong
                        className="text-[#16313E]"
                      >
                        {
                          totalRegistros
                        }
                      </strong>
                      {' '}parques
                    </>
                  )
              }

            </div>


            <div
              className="flex flex-col gap-3 sm:flex-row sm:items-center"
            >

              <div
                className="flex items-center gap-2"
              >

                <span
                  className="text-sm text-slate-500"
                >
                  Mostrar
                </span>


                <select
                  value={
                    registrosPorPagina
                  }
                  onChange={
                    (
                      event,
                    ) =>
                      setRegistrosPorPagina(
                        Number(
                          event.target.value,
                        ),
                      )
                  }
                  className="rounded-lg border border-[#D9E2E7] bg-white px-2 py-1.5 text-sm font-semibold text-[#16313E] outline-none"
                >

                  <option
                    value={
                      10
                    }
                  >
                    10
                  </option>

                  <option
                    value={
                      20
                    }
                  >
                    20
                  </option>

                  <option
                    value={
                      50
                    }
                  >
                    50
                  </option>

                </select>

              </div>


              <div
                className="flex items-center gap-1"
              >

                <button
                  type="button"
                  disabled={
                    paginaActual ===
                    1
                  }
                  onClick={
                    () =>
                      setPaginaActual(
                        (
                          pagina,
                        ) =>
                          Math.max(
                            1,
                            pagina -
                            1,
                          ),
                      )
                  }
                  className="rounded-lg border border-[#D9E2E7] px-3 py-1.5 text-sm font-semibold text-[#315F73] transition hover:bg-[#F4F7F8] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Anterior
                </button>


                {
                  paginasVisibles.map(
                    (
                      pagina,
                    ) => (

                      <button
                        type="button"
                        key={
                          pagina
                        }
                        onClick={
                          () =>
                            setPaginaActual(
                              pagina,
                            )
                        }
                        className={
                          paginaActual ===
                          pagina
                            ? 'h-8 min-w-8 rounded-lg bg-[#315F73] px-2 text-sm font-bold text-white'
                            : 'h-8 min-w-8 rounded-lg border border-[#D9E2E7] bg-white px-2 text-sm font-semibold text-[#315F73] transition hover:bg-[#F4F7F8]'
                        }
                      >
                        {
                          pagina
                        }
                      </button>

                    ),
                  )
                }


                <button
                  type="button"
                  disabled={
                    paginaActual ===
                    totalPaginas ||
                    totalRegistros ===
                    0
                  }
                  onClick={
                    () =>
                      setPaginaActual(
                        (
                          pagina,
                        ) =>
                          Math.min(
                            totalPaginas,
                            pagina +
                            1,
                          ),
                      )
                  }
                  className="rounded-lg border border-[#D9E2E7] px-3 py-1.5 text-sm font-semibold text-[#315F73] transition hover:bg-[#F4F7F8] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Siguiente
                </button>

              </div>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}
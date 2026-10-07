import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  useParams,
  useSearchParams,
} from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import { api } from '../../services/api';
// Configura el worker que utiliza PDF.js.
const pdfWorker =
  new Worker(
    new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url,
    ),
    {
      type: 'module',
    },
  );
pdfjsLib.GlobalWorkerOptions.workerPort =
  pdfWorker;
// Tipo del documento PDF cargado.
type PdfDocument =
  Awaited<
    ReturnType<
      typeof pdfjsLib.getDocument
    >['promise']
  >;
// Visor personalizado de documentos PDF de convenios.
function DocumentoConvenio() {
  const {
    id,
  } = useParams();
  const [
    searchParams,
  ] = useSearchParams();
  const paginasRef =
    useRef<HTMLDivElement | null>(
      null,
    );
  const renderTaskRef =
    useRef<any>(
      null,
    );
  const blobRef =
    useRef<Blob | null>(
      null,
    );
  const [
    pdf,
    setPdf,
  ] = useState<PdfDocument | null>(
    null,
  );
  const [
    pagina,
    setPagina,
  ] = useState(
    1,
  );
  const [
    totalPaginas,
    setTotalPaginas,
  ] = useState(
    0,
  );
  const [
    zoom,
    setZoom,
  ] = useState(
    100,
  );
  const [
    rotacion,
    setRotacion,
  ] = useState(
    0,
  );
  const [
    cargando,
    setCargando,
  ] = useState(
    true,
  );
  const [
    error,
    setError,
  ] = useState(
    '',
  );
  const [
    panelAbierto,
    setPanelAbierto,
  ] = useState(
    false,
  );
  const [
    menuAbierto,
    setMenuAbierto,
  ] = useState(
    false,
  );
  const nombre =
    searchParams.get(
      'nombre',
    ) ||
    `convenio_${id}.pdf`;
  useEffect(
    () => {
      document.title =
        nombre;
      let cancelado =
        false;
      let documento:
        PdfDocument | null =
        null;
      // Carga el PDF desde el backend.
      const cargarDocumento =
        async () => {
          try {
            setCargando(
              true,
            );
            setError(
              '',
            );
            const token =
              localStorage.getItem(
                'token',
              );
            const response =
              await api.get(
                `/convenios/${id}/documento`,
                {
                  responseType:
                    'blob',
                  headers: {
                    Authorization:
                      `Bearer ${token}`,
                  },
                },
              );
            if (cancelado) {
              return;
            }
            const blob =
              new Blob(
                [
                  response.data,
                ],
                {
                  type:
                    'application/pdf',
                },
              );
            blobRef.current =
              blob;
            const bytes =
              new Uint8Array(
                await blob.arrayBuffer(),
              );
            const tarea =
              pdfjsLib.getDocument({
                data:
                  bytes,
              });
            documento =
              await tarea.promise;
            if (cancelado) {
              return;
            }
            setPdf(
              documento,
            );
            setTotalPaginas(
              documento.numPages,
            );
            setPagina(
              1,
            );
          } catch (error: any) {
            console.error(
              'Error cargando documento:',
              error,
            );
            if (!cancelado) {
              setError(
                error.response?.data?.message ||
                error.message ||
                'No se pudo cargar el documento.',
              );
            }
          } finally {
            if (!cancelado) {
              setCargando(
                false,
              );
            }
          }
        };
      void cargarDocumento();
      return () => {
        cancelado =
          true;
        if (
          renderTaskRef.current
        ) {
          try {
            renderTaskRef.current.cancel();
          } catch {
            // Sin acción.
          }
        }
        blobRef.current =
          null;
      };
    },
    [
      id,
      nombre,
    ],
  );
  // Renderiza todas las páginas del PDF.
  const renderizarPaginas =
    useCallback(
      async () => {
        if (
          !pdf ||
          !paginasRef.current
        ) {
          return;
        }
        const contenedor =
          paginasRef.current;
        contenedor.innerHTML =
          '';
        for (
          let numero = 1;
          numero <= pdf.numPages;
          numero += 1
        ) {
          const paginaPdf =
            await pdf.getPage(
              numero,
            );
          const escala =
            zoom /
            100;
          const viewport =
            paginaPdf.getViewport({
              scale:
                escala * 1.35,
              rotation:
                rotacion,
            });
          const envoltorio =
            document.createElement(
              'div',
            );
          envoltorio.dataset.page =
            String(
              numero,
            );
          envoltorio.style.display =
            'flex';
          envoltorio.style.justifyContent =
            'center';
          envoltorio.style.width =
            '100%';
          envoltorio.style.marginBottom =
            '12px';
          const canvas =
            document.createElement(
              'canvas',
            );
          const contexto =
            canvas.getContext(
              '2d',
            );
          if (!contexto) {
            continue;
          }
          const pixelRatio =
            window.devicePixelRatio ||
            1;
          canvas.width =
            Math.floor(
              viewport.width *
              pixelRatio,
            );
          canvas.height =
            Math.floor(
              viewport.height *
              pixelRatio,
            );
          canvas.style.width =
            `${viewport.width}px`;
          canvas.style.height =
            `${viewport.height}px`;
          canvas.style.display =
            'block';
          canvas.style.background =
            '#fff';
          canvas.style.boxShadow =
            '0 2px 10px rgba(0,0,0,.55)';
          contexto.setTransform(
            pixelRatio,
            0,
            0,
            pixelRatio,
            0,
            0,
          );
          envoltorio.appendChild(
            canvas,
          );
          contenedor.appendChild(
            envoltorio,
          );
          const tarea =
            paginaPdf.render({
              canvas,
              canvasContext:
                contexto,
              viewport,
            });
          renderTaskRef.current =
            tarea;
          try {
            await tarea.promise;
          } catch (error: any) {
            if (
              error?.name !==
              'RenderingCancelledException'
            ) {
              console.error(
                `Error renderizando página ${numero}:`,
                error,
              );
            }
          }
        }
        renderTaskRef.current =
          null;
      },
      [
        pdf,
        zoom,
        rotacion,
      ],
    );
  useEffect(
    () => {
      void renderizarPaginas();
    },
    [
      renderizarPaginas,
    ],
  );
  // Desplaza el visor hasta una página específica.
  const irAPagina =
    (
      numero: number,
    ) => {
      const destino =
        paginasRef.current?.querySelector(
          `[data-page="${numero}"]`,
        ) as HTMLElement | null;
      if (destino) {
        destino.scrollIntoView({
          behavior:
            'smooth',
          block:
            'start',
        });
      }
      setPagina(
        numero,
      );
    };
  useEffect(
    () => {
      const contenedor =
        paginasRef.current;
      if (!contenedor) {
        return;
      }
      // Detecta qué página está visible durante el desplazamiento.
      const observador =
        new IntersectionObserver(
          (
            entradas,
          ) => {
            const visibles =
              entradas
                .filter(
                  (
                    entrada,
                  ) =>
                    entrada.isIntersecting,
                )
                .sort(
                  (
                    a,
                    b,
                  ) =>
                    b.intersectionRatio -
                    a.intersectionRatio,
                );
            if (
              visibles.length >
              0
            ) {
              const numero =
                Number(
                  (
                    visibles[0]
                      .target as HTMLElement
                  ).dataset.page,
                );
              if (
                Number.isInteger(
                  numero,
                )
              ) {
                setPagina(
                  numero,
                );
              }
            }
          },
          {
            threshold: [
              0.25,
              0.5,
              0.75,
            ],
          },
        );
      const paginas =
        contenedor.querySelectorAll(
          '[data-page]',
        );
      paginas.forEach(
        (
          elemento,
        ) =>
          observador.observe(
            elemento,
          ),
      );
      return () => {
        observador.disconnect();
      };
    },
    [
      pdf,
      zoom,
      rotacion,
    ],
  );
  // Descarga el PDF conservando su nombre original.
  const descargarDocumento =
    () => {
      const blob =
        blobRef.current;
      if (!blob) {
        return;
      }
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
  // Imprime el documento mediante un iframe temporal.
  const imprimirDocumento =
    () => {
      const blob =
        blobRef.current;
      if (!blob) {
        return;
      }
      const url =
        URL.createObjectURL(
          blob,
        );
      const iframe =
        document.createElement(
          'iframe',
        );
      iframe.style.position =
        'fixed';
      iframe.style.right =
        '0';
      iframe.style.bottom =
        '0';
      iframe.style.width =
        '1px';
      iframe.style.height =
        '1px';
      iframe.style.border =
        '0';
      iframe.style.opacity =
        '0';
      iframe.src =
        url;
      document.body.appendChild(
        iframe,
      );
      const limpiar =
        () => {
          window.setTimeout(
            () => {
              if (
                iframe.parentNode
              ) {
                iframe.parentNode.removeChild(
                  iframe,
                );
              }
              URL.revokeObjectURL(
                url,
              );
            },
            1000,
          );
        };
      iframe.onload =
        () => {
          try {
            const ventanaImpresion =
              iframe.contentWindow;
            if (!ventanaImpresion) {
              limpiar();
              return;
            }
            ventanaImpresion.focus();
            ventanaImpresion.print();
            limpiar();
          } catch (error) {
            console.error(
              'Error imprimiendo documento:',
              error,
            );
            limpiar();
          }
        };
    };
  // Activa o desactiva el modo de pantalla completa.
  const pantallaCompleta =
    async () => {
      if (
        !document.fullscreenElement
      ) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    };
  // Navega a la página anterior.
  const paginaAnterior =
    () => {
      irAPagina(
        Math.max(
          1,
          pagina - 1,
        ),
      );
    };
  // Navega a la página siguiente.
  const paginaSiguiente =
    () => {
      irAPagina(
        Math.min(
          totalPaginas,
          pagina + 1,
        ),
      );
    };
  // Reduce el nivel de zoom.
  const reducirZoom =
    () => {
      setZoom(
        (
          actual,
        ) =>
          Math.max(
            25,
            actual - 25,
          ),
      );
    };
  // Aumenta el nivel de zoom.
  const aumentarZoom =
    () => {
      setZoom(
        (
          actual,
        ) =>
          Math.min(
            300,
            actual + 25,
          ),
      );
    };
  // Restablece el zoom al 100%.
  const ajustarPagina =
    () => {
      setZoom(
        100,
      );
    };
  // Rota el documento 90 grados.
  const rotarDocumento =
    () => {
      setRotacion(
        (
          actual,
        ) =>
          (
            actual + 90
          ) %
          360,
      );
    };
  // Valida el número ingresado y navega a esa página.
  const irPagina =
    (
      valor: string,
    ) => {
      const numero =
        Number(
          valor,
        );
      if (
        Number.isInteger(
          numero,
        ) &&
        numero >= 1 &&
        numero <=
          totalPaginas
      ) {
        irAPagina(
          numero,
        );
      }
    };
  // Estilo compartido de los botones de la barra superior.
  const iconButtonStyle:
    React.CSSProperties = {
      width:
        '40px',
      height:
        '40px',
      border:
        0,
      borderRadius:
        '50%',
      padding:
        0,
      background:
        'transparent',
      color:
        '#f1f3f4',
      cursor:
        'pointer',
      display:
        'inline-flex',
      alignItems:
        'center',
      justifyContent:
        'center',
      flex:
        '0 0 40px',
    };
  // Separador visual entre los controles del visor.
  const separador = (
    <div
      style={{
        width:
          '1px',
        height:
          '24px',
        background:
          '#5f6368',
        margin:
          '0 4px',
        flex:
          '0 0 1px',
      }}
    />
  );
  return (
    <div
      style={{
        position:
          'fixed',
        inset:
          0,
        display:
          'flex',
        flexDirection:
          'column',
        background:
          '#202124',
        overflow:
          'hidden',
        fontFamily:
          'Arial, Helvetica, sans-serif',
      }}
    >
      <div
        style={{
          height:
            '60px',
          minHeight:
            '60px',
          display:
            'flex',
          alignItems:
            'center',
          gap:
            '2px',
          padding:
            '0 12px',
          boxSizing:
            'border-box',
          background:
            '#3c4043',
          color:
            '#f1f3f4',
          boxShadow:
            '0 1px 2px rgba(0,0,0,.45)',
          zIndex:
            20,
        }}
      >
        <button
          type="button"
          style={
            iconButtonStyle
          }
          title="Panel lateral"
          onClick={
            () =>
              setPanelAbierto(
                (
                  actual,
                ) =>
                  !actual,
              )
          }
        >
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div
          title={nombre}
          style={{
            width:
              '200px',
            minWidth:
              '120px',
            overflow:
              'hidden',
            textOverflow:
              'ellipsis',
            whiteSpace:
              'nowrap',
            fontSize:
              '14px',
            fontWeight:
              600,
            marginRight:
              '8px',
          }}
        >
          {nombre}
        </div>
        {separador}
        <button
          type="button"
          style={
            iconButtonStyle
          }
          title="Página anterior"
          disabled={
            pagina <= 1
          }
          onClick={
            paginaAnterior
          }
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <input
          value={pagina}
          onChange={
            (
              event,
            ) =>
              irPagina(
                event.target.value,
              )
          }
          aria-label="Página actual"
          style={{
            width:
              '42px',
            height:
              '30px',
            border:
              0,
            borderRadius:
              '2px',
            background:
              '#202124',
            color:
              '#fff',
            textAlign:
              'center',
            fontSize:
              '14px',
            outline:
              'none',
          }}
        />
        <span
          style={{
            fontSize:
              '14px',
            minWidth:
              '42px',
          }}
        >
          / {totalPaginas || 0}
        </span>
        <button
          type="button"
          style={
            iconButtonStyle
          }
          title="Página siguiente"
          disabled={
            pagina >=
            totalPaginas
          }
          onClick={
            paginaSiguiente
          }
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
        {separador}
        <button
          type="button"
          style={
            iconButtonStyle
          }
          title="Alejar"
          onClick={
            reducirZoom
          }
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M8 11h6M16 16l4 4" />
          </svg>
        </button>
        <button
          type="button"
          onClick={
            ajustarPagina
          }
          title="Restablecer zoom"
          style={{
            height:
              '30px',
            minWidth:
              '54px',
            border:
              0,
            borderRadius:
              '2px',
            background:
              '#202124',
            color:
              '#fff',
            cursor:
              'pointer',
            fontSize:
              '13px',
            fontWeight:
              600,
          }}
        >
          {zoom}%
        </button>
        <button
          type="button"
          style={
            iconButtonStyle
          }
          title="Acercar"
          onClick={
            aumentarZoom
          }
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M11 8v6M8 11h6M16 16l4 4" />
          </svg>
        </button>
        {separador}
        <button
          type="button"
          style={
            iconButtonStyle
          }
          title="Ajustar página"
          onClick={
            ajustarPagina
          }
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="6" y="3" width="12" height="18" rx="1" />
            <path d="m9 8 3-3 3 3M9 16l3 3 3-3" />
          </svg>
        </button>
        <button
          type="button"
          style={
            iconButtonStyle
          }
          title="Rotar"
          onClick={
            rotarDocumento
          }
        >
          <svg
            viewBox="0 0 24 24"
            width="21"
            height="21"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20 11a8 8 0 1 1-2.3-5.7L20 8" />
            <path d="M20 3v5h-5" />
          </svg>
        </button>
        <div
          style={{
            flex:
              1,
          }}
        />
        <button
          type="button"
          style={
            iconButtonStyle
          }
          title="Descargar"
          onClick={
            descargarDocumento
          }
        >
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3v12" />
            <path d="m7 10 5 5 5-5" />
            <path d="M5 20h14" />
          </svg>
        </button>
        <button
          type="button"
          style={
            iconButtonStyle
          }
          title="Imprimir"
          onClick={
            imprimirDocumento
          }
        >
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="7" />
          </svg>
        </button>
        <button
          type="button"
          style={
            iconButtonStyle
          }
          title="Pantalla completa"
          onClick={
            () =>
              void pantallaCompleta()
          }
        >
          <svg
            viewBox="0 0 24 24"
            width="21"
            height="21"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" />
          </svg>
        </button>
        <div
          style={{
            position:
              'relative',
          }}
        >
          <button
            type="button"
            style={
              iconButtonStyle
            }
            title="Más opciones"
            onClick={
              () =>
                setMenuAbierto(
                  (
                    actual,
                  ) =>
                    !actual,
                )
            }
          >
            <svg
              viewBox="0 0 24 24"
              width="21"
              height="21"
              fill="currentColor"
            >
              <circle cx="12" cy="5" r="1.7" />
              <circle cx="12" cy="12" r="1.7" />
              <circle cx="12" cy="19" r="1.7" />
            </svg>
          </button>
          {menuAbierto && (
            <div
              style={{
                position:
                  'absolute',
                top:
                  '44px',
                right:
                  0,
                width:
                  '190px',
                padding:
                  '6px',
                borderRadius:
                  '4px',
                background:
                  '#fff',
                color:
                  '#202124',
                boxShadow:
                  '0 4px 18px rgba(0,0,0,.35)',
                zIndex:
                  50,
              }}
            >
              <button
                type="button"
                onClick={
                  descargarDocumento
                }
                style={{
                  width:
                    '100%',
                  border:
                    0,
                  background:
                    'transparent',
                  padding:
                    '10px 12px',
                  textAlign:
                    'left',
                  cursor:
                    'pointer',
                }}
              >
                Descargar
              </button>
              <button
                type="button"
                onClick={
                  imprimirDocumento
                }
                style={{
                  width:
                    '100%',
                  border:
                    0,
                  background:
                    'transparent',
                  padding:
                    '10px 12px',
                  textAlign:
                    'left',
                  cursor:
                    'pointer',
                }}
              >
                Imprimir
              </button>
              <button
                type="button"
                onClick={
                  () =>
                    void pantallaCompleta()
                }
                style={{
                  width:
                    '100%',
                  border:
                    0,
                  background:
                    'transparent',
                  padding:
                    '10px 12px',
                  textAlign:
                    'left',
                  cursor:
                    'pointer',
                }}
              >
                Pantalla completa
              </button>
            </div>
          )}
        </div>
      </div>
      <div
        style={{
          minHeight:
            0,
          flex:
            1,
          display:
            'flex',
          overflow:
            'hidden',
        }}
      >
        {panelAbierto && (
          <aside
            style={{
              width:
                '220px',
              minWidth:
                '220px',
              padding:
                '18px',
              boxSizing:
                'border-box',
              overflow:
                'auto',
              background:
                '#292a2d',
              color:
                '#e8eaed',
              borderRight:
                '1px solid #3c4043',
            }}
          >
            <div
              style={{
                marginBottom:
                  '14px',
                fontSize:
                  '13px',
                fontWeight:
                  700,
              }}
            >
              Documento
            </div>
            {Array.from(
              {
                length:
                  totalPaginas,
              },
              (
                _,
                indice,
              ) =>
                indice + 1,
            ).map(
              (
                numero,
              ) => (
                <button
                  key={
                    numero
                  }
                  type="button"
                  onClick={
                    () =>
                      irAPagina(
                        numero,
                      )
                  }
                  style={{
                    width:
                      '100%',
                    marginBottom:
                      '6px',
                    padding:
                      '9px 10px',
                    border:
                      numero ===
                      pagina
                        ? '1px solid #8ab4f8'
                        : '1px solid transparent',
                    borderRadius:
                      '4px',
                    background:
                      numero ===
                      pagina
                        ? '#3c4043'
                        : 'transparent',
                    color:
                      '#e8eaed',
                    textAlign:
                      'left',
                    cursor:
                      'pointer',
                  }}
                >
                  Página {numero}
                </button>
              ),
            )}
          </aside>
        )}
        <main
          style={{
            position:
              'relative',
            flex:
              1,
            overflow:
              'auto',
            background:
              '#202124',
          }}
        >
          {cargando && (
            <div
              style={{
                height:
                  '100%',
                display:
                  'flex',
                alignItems:
                  'center',
                justifyContent:
                  'center',
                color:
                  '#f1f3f4',
              }}
            >
              Cargando documento...
            </div>
          )}
          {!cargando &&
            error && (
              <div
                style={{
                  height:
                    '100%',
                  display:
                    'flex',
                  flexDirection:
                    'column',
                  alignItems:
                    'center',
                  justifyContent:
                    'center',
                  gap:
                    '10px',
                  padding:
                    '24px',
                  boxSizing:
                    'border-box',
                  color:
                    '#f1f3f4',
                  textAlign:
                    'center',
                }}
              >
                <strong>
                  No se pudo abrir el documento
                </strong>
                <span>
                  {error}
                </span>
              </div>
            )}
          {!cargando &&
            !error &&
            pdf && (
              <div
                style={{
                  minWidth:
                    '100%',
                  minHeight:
                    '100%',
                  display:
                    'flex',
                  alignItems:
                    'flex-start',
                  justifyContent:
                    'center',
                  padding:
                    '18px 28px 40px',
                  boxSizing:
                    'border-box',
                }}
              >
                <div
                  ref={
                    paginasRef
                  }
                  style={{
                    width:
                      '100%',
                  }}
                />
              </div>
            )}
        </main>
      </div>
    </div>
  );
}
export default DocumentoConvenio;

import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';

import { useNavigate } from 'react-router-dom';

import { api } from '../../services/api';
import Header from '../../components/Header';

interface Parque {
  id_parque: number;
  ubicacion: string;
  numero_finca: string;
  area: number;
  numero_plano: string;
  visado: string;
  estado: string;

  descripcion_inversion: string;
  inversion: number;
  fecha_inversion: string;

  // Historial futuro de inversiones.
  // El backend actual todavía maneja los tres campos anteriores,
  // por eso se mantienen como compatibilidad.
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

export default function Parques() {
  const navigate = useNavigate();

  // ============================================
  // DATOS
  // ============================================

  const [
    parques,
    setParques,
  ] = useState<Parque[]>([]);

  const [
    distritos,
    setDistritos,
  ] = useState<Distrito[]>([]);

  const [
    encargados,
    setEncargados,
  ] = useState<Encargado[]>([]);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  // ============================================
  // FILTROS DE BÚSQUEDA
  // ============================================

  const [filtroUbicacion, setFiltroUbicacion] = useState('');
  const [filtroFinca, setFiltroFinca] = useState('');
  const [filtroPlano, setFiltroPlano] = useState('');
  const [filtroDistrito, setFiltroDistrito] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroEncargado, setFiltroEncargado] = useState('');

  const limpiarFiltros = () => {
    setFiltroUbicacion('');
    setFiltroFinca('');
    setFiltroPlano('');
    setFiltroDistrito('');
    setFiltroEstado('');
    setFiltroEncargado('');
  };

  const normalizarTexto = (valor: string | null | undefined) =>
    (valor ?? '').toLowerCase().trim();

  // Limita únicamente lo que se muestra en la tabla.
  // El valor completo permanece guardado y se puede consultar en los modales.
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

  const sanitizarSoloNumeros = (valor: string) =>
    valor.replace(/\D/g, '').slice(0, 50);

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
  // MODAL CREAR / EDITAR
  // ============================================

  const [
    modalAbierto,
    setModalAbierto,
  ] = useState(false);

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    errorFormulario,
    setErrorFormulario,
  ] = useState('');

  const [
    modoEdicion,
    setModoEdicion,
  ] = useState(false);

  const [
    idParqueEditando,
    setIdParqueEditando,
  ] = useState<number | null>(null);

  // ============================================
  // MODAL ELIMINAR
  // ============================================

  const [
    modalEliminarAbierto,
    setModalEliminarAbierto,
  ] = useState(false);

  const [
    parqueEliminar,
    setParqueEliminar,
  ] = useState<Parque | null>(null);

  const [
    eliminando,
    setEliminando,
  ] = useState(false);

  const [
    errorEliminar,
    setErrorEliminar,
  ] = useState('');

  // ============================================
  // MODAL INFORMACIÓN ENCARGADO
  // ============================================

  const [
    modalEncargadoAbierto,
    setModalEncargadoAbierto,
  ] = useState(false);

  const [
    encargadoVer,
    setEncargadoVer,
  ] = useState<Parque['encargado'] | null>(
    null,
  );

  // ============================================
  // MODAL INFORMACIÓN DEL PARQUE
  // ============================================

  const [
    modalInformacionAbierto,
    setModalInformacionAbierto,
  ] = useState(false);

  const [
    parqueVer,
    setParqueVer,
  ] = useState<Parque | null>(
    null,
  );

  // ============================================
  // MODAL INVERSIONES
  // ============================================

  const [
    modalInversionAbierto,
    setModalInversionAbierto,
  ] = useState(false);

  const [
    parqueInversion,
    setParqueInversion,
  ] = useState<Parque | null>(
    null,
  );

  const [
    inversionesParque,
    setInversionesParque,
  ] = useState<InversionMantenimiento[]>([]);

  const [
    cargandoInversiones,
    setCargandoInversiones,
  ] = useState(false);

  const [
    errorInversiones,
    setErrorInversiones,
  ] = useState('');

  // ============================================
  // FORMULARIO
  // ============================================

  const [
    ubicacion,
    setUbicacion,
  ] = useState('');

  const [
    numeroFinca,
    setNumeroFinca,
  ] = useState('');

  const [
    area,
    setArea,
  ] = useState('');

  const [
    numeroPlano,
    setNumeroPlano,
  ] = useState('');

  const [
    visado,
    setVisado,
  ] = useState('');

  const [
    estado,
    setEstado,
  ] = useState('');

  const [
    idDistrito,
    setIdDistrito,
  ] = useState('');

  const [
    idEncargado,
    setIdEncargado,
  ] = useState('');

  const [busquedaDistrito, setBusquedaDistrito] = useState('');
  const [busquedaEncargado, setBusquedaEncargado] = useState('');

  const distritosFiltradosFormulario = distritos.filter((distrito) =>
    normalizarTexto(distrito.nombre_distrito).includes(
      normalizarTexto(busquedaDistrito),
    ) ||
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
  // CARGAR PARQUES
  // ============================================

  const cargarParques =
    async () => {
      try {
        setCargando(true);
        setError('');

        const response =
          await api.get(
            '/parques',
          );

        setParques(
          response.data,
        );
      } catch (error) {
        console.error(
          'Error cargando parques:',
          error,
        );

        setError(
          'No se pudieron cargar los parques.',
        );
      } finally {
        setCargando(false);
      }
    };

  // ============================================
  // CARGAR DISTRITOS
  // ============================================

  const cargarDistritos =
    async () => {
      try {
        const response =
          await api.get(
            '/distritos',
          );

        setDistritos(
          response.data,
        );
      } catch (error) {
        console.error(
          'Error cargando distritos:',
          error,
        );
      }
    };

  // ============================================
  // CARGAR ENCARGADOS
  // ============================================

  const cargarEncargados =
    async () => {
      try {
        const token =
          localStorage.getItem(
            'token',
          );

        if (!token) {
          localStorage.removeItem(
            'usuario',
          );

          navigate(
            '/login',
          );

          return;
        }

        const response =
          await api.get(
            '/encargados',
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        setEncargados(
          response.data,
        );
      } catch (error: any) {
        console.error(
          'Error cargando encargados:',
          error,
        );

        if (
          error.response?.status ===
          401
        ) {
          localStorage.removeItem(
            'token',
          );

          localStorage.removeItem(
            'usuario',
          );

          navigate(
            '/login',
          );

          return;
        }

        console.error(
          'No se pudieron cargar las entidades encargadas.',
        );
      }
    };

  // ============================================
  // CARGA INICIAL
  // ============================================

  useEffect(() => {
    cargarParques();
    cargarDistritos();
    cargarEncargados();
  }, []);

  // Regresar a la primera página cuando cambie un filtro.
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

  // Si se elimina el último registro de una página, evita quedar en una página inexistente.
  useEffect(() => {
    if (paginaActual > totalPaginas) {
      setPaginaActual(totalPaginas);
    }
  }, [paginaActual, totalPaginas]);

  // ============================================
  // LIMPIAR FORMULARIO
  // ============================================

  const limpiarFormulario =
    () => {
      setUbicacion('');
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

  // ============================================
  // NUEVO PARQUE
  // ============================================

  const abrirModalCrear =
    () => {
      limpiarFormulario();

      setModoEdicion(
        false,
      );

      setIdParqueEditando(
        null,
      );

      setModalAbierto(
        true,
      );
    };

  // ============================================
  // EDITAR PARQUE
  // ============================================

  const abrirModalEditar = (
    parque: Parque,
  ) => {
    setUbicacion(
      parque.ubicacion ??
        '',
    );

    setNumeroFinca(
      parque.numero_finca ??
        '',
    );

    setArea(
      String(
        parque.area ?? '',
      ),
    );

    setNumeroPlano(
      parque.numero_plano ??
        '',
    );

    setVisado(
      parque.visado ??
        '',
    );

    setEstado(
      parque.estado ??
        '',
    );

    setIdDistrito(
      parque.id_distrito
        ? String(
            parque.id_distrito,
          )
        : parque.distrito
          ? String(
              parque.distrito
                .id_distrito,
            )
          : '',
    );

    setIdEncargado(
      parque.id_encargado
        ? String(
            parque.id_encargado,
          )
        : parque.encargado
          ? String(
              parque.encargado
                .id_encargado,
            )
          : '',
    );

    setModoEdicion(
      true,
    );

    setIdParqueEditando(
      parque.id_parque,
    );

    setErrorFormulario(
      '',
    );

    setModalAbierto(
      true,
    );
  };

  // ============================================
  // CERRAR MODAL
  // ============================================

  const cerrarModal =
    () => {
      if (guardando) {
        return;
      }

      setModalAbierto(
        false,
      );

      limpiarFormulario();

      setModoEdicion(
        false,
      );

      setIdParqueEditando(
        null,
      );
    };

  // ============================================
  // GUARDAR PARQUE
  // ============================================

  const guardarParque =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      setGuardando(
        true,
      );

      setErrorFormulario(
        '',
      );

      const fincaNormalizada = numeroFinca.trim();
      const planoNormalizado = numeroPlano.trim().toLowerCase();

      const fincaDuplicada = parques.some(
        (parque) =>
          parque.numero_finca.trim() === fincaNormalizada &&
          parque.id_parque !== idParqueEditando,
      );

      if (fincaDuplicada) {
        setErrorFormulario(
          'Ya existe un parque registrado con este número de finca.',
        );
        setGuardando(false);
        return;
      }

      const planoDuplicado = parques.some(
        (parque) =>
          parque.numero_plano.trim().toLowerCase() === planoNormalizado &&
          parque.id_parque !== idParqueEditando,
      );

      if (planoDuplicado) {
        setErrorFormulario(
          'Ya existe un parque registrado con este número de plano.',
        );
        setGuardando(false);
        return;
      }

      try {
        const token =
          localStorage.getItem(
            'token',
          );

        const datosParque = {
          ubicacion:
            ubicacion.trim(),

          numero_finca:
            numeroFinca.trim(),

          area:
            Number(area),

          numero_plano:
            numeroPlano.trim(),

          visado:
            visado.trim(),

          estado,

          descripcion_inversion:
            'Sin inversión registrada',

          inversion:
            0,

          fecha_inversion:
            '2026-01-01',

          id_distrito:
            Number(
              idDistrito,
            ),

          id_encargado:
            Number(
              idEncargado,
            ),
        };

        // ========================================
        // EDITAR
        // ========================================

        if (
          modoEdicion &&
          idParqueEditando !==
            null
        ) {
          await api.patch(
            `/parques/${idParqueEditando}`,
            datosParque,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );
        }

        // ========================================
        // CREAR
        // ========================================

        else {
          await api.post(
            '/parques',
            datosParque,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );
        }

        setModalAbierto(
          false,
        );

        limpiarFormulario();

        setModoEdicion(
          false,
        );

        setIdParqueEditando(
          null,
        );

        await cargarParques();
      } catch (error: any) {
        console.error(
          'Error guardando parque:',
          error,
        );

        if (
          error.response
            ?.status ===
          401
        ) {
          localStorage.removeItem(
            'token',
          );

          localStorage.removeItem(
            'usuario',
          );

          navigate(
            '/login',
          );

          return;
        }

        const message =
          error.response
            ?.data
            ?.message;

        if (
          Array.isArray(
            message,
          )
        ) {
          setErrorFormulario(
            message.join(
              ', ',
            ),
          );
        } else if (
          message
        ) {
          setErrorFormulario(
            message,
          );
        } else {
          setErrorFormulario(
            modoEdicion
              ? 'No se pudo actualizar el parque.'
              : 'No se pudo registrar el parque.',
          );
        }
      } finally {
        setGuardando(
          false,
        );
      }
    };

  // ============================================
  // ABRIR MODAL ELIMINAR
  // ============================================

  const abrirModalEliminar = (
    parque: Parque,
  ) => {
    setParqueEliminar(
      parque,
    );

    setErrorEliminar(
      '',
    );

    setModalEliminarAbierto(
      true,
    );
  };

  // ============================================
  // CERRAR MODAL ELIMINAR
  // ============================================

  const cerrarModalEliminar =
    () => {
      if (eliminando) {
        return;
      }

      setModalEliminarAbierto(
        false,
      );

      setParqueEliminar(
        null,
      );

      setErrorEliminar(
        '',
      );
    };

  // ============================================
  // CONFIRMAR ELIMINACIÓN
  // ============================================

  const confirmarEliminarParque =
    async () => {
      if (!parqueEliminar) {
        return;
      }

      try {
        setEliminando(
          true,
        );

        setErrorEliminar(
          '',
        );

        const token =
          localStorage.getItem(
            'token',
          );

        await api.delete(
          `/parques/${parqueEliminar.id_parque}`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

        setModalEliminarAbierto(
          false,
        );

        setParqueEliminar(
          null,
        );

        await cargarParques();
      } catch (error: any) {
        console.error(
          'Error eliminando parque:',
          error,
        );

        if (
          error.response
            ?.status ===
          401
        ) {
          localStorage.removeItem(
            'token',
          );

          localStorage.removeItem(
            'usuario',
          );

          navigate(
            '/login',
          );

          return;
        }

        const message =
          error.response
            ?.data
            ?.message;

        if (
          Array.isArray(
            message,
          )
        ) {
          setErrorEliminar(
            message.join(
              ', ',
            ),
          );
        } else if (
          message
        ) {
          setErrorEliminar(
            message,
          );
        } else {
          setErrorEliminar(
            'No se pudo eliminar el parque.',
          );
        }
      } finally {
        setEliminando(
          false,
        );
      }
    };

  // ============================================
  // VER INFORMACIÓN DEL ENCARGADO
  // ============================================

  const abrirModalEncargado = (
    parque: Parque,
  ) => {
    if (!parque.encargado) {
      return;
    }

    setEncargadoVer(
      parque.encargado,
    );

    setModalEncargadoAbierto(
      true,
    );
  };

  const cerrarModalEncargado =
    () => {
      setModalEncargadoAbierto(
        false,
      );

      setEncargadoVer(
        null,
      );
    };

  // ============================================
  // VER INFORMACIÓN DEL PARQUE
  // ============================================

  const abrirModalInformacion = (
    parque: Parque,
  ) => {
    setParqueVer(
      parque,
    );

    setModalInformacionAbierto(
      true,
    );
  };

  const cerrarModalInformacion =
    () => {
      setModalInformacionAbierto(
        false,
      );

      setParqueVer(
        null,
      );
    };

  // ============================================
  // VER INVERSIONES DEL PARQUE
  // ============================================

  const abrirModalInversion = async (
    parque: Parque,
  ) => {
    setParqueInversion(
      parque,
    );

    setInversionesParque(
      [],
    );

    setErrorInversiones(
      '',
    );

    setModalInversionAbierto(
      true,
    );

    try {
      setCargandoInversiones(
        true,
      );

      const token =
        localStorage.getItem(
          'token',
        );

      const response =
        await api.get(
          '/mantenimientos',
          {
            headers: token
              ? {
                  Authorization:
                    `Bearer ${token}`,
                }
              : undefined,
          },
        );

      const mantenimientos:
        InversionMantenimiento[] =
        Array.isArray(
          response.data,
        )
          ? response.data
          : [];

      const inversiones =
        mantenimientos
          .filter(
            (
              mantenimiento,
            ) =>
              Number(
                mantenimiento.id_parque,
              ) ===
                Number(
                  parque.id_parque,
                ) &&
              (
                Number(
                  mantenimiento.inversion ??
                  0,
                ) > 0 ||
                Boolean(
                  mantenimiento.descripcion_inversion
                    ?.trim(),
                )
              ),
          )
          .sort(
            (
              a,
              b,
            ) =>
              new Date(
                b.fecha_mantenimiento,
              ).getTime() -
              new Date(
                a.fecha_mantenimiento,
              ).getTime(),
          );

      setInversionesParque(
        inversiones,
      );
    } catch (error: any) {
      console.error(
        'Error cargando inversiones del parque:',
        error,
      );

      if (
        error.response?.status ===
        401
      ) {
        localStorage.removeItem(
          'token',
        );

        localStorage.removeItem(
          'usuario',
        );

        navigate(
          '/login',
        );

        return;
      }

      setErrorInversiones(
        error.response?.data?.message ||
        'No se pudieron cargar las inversiones de los mantenimientos.',
      );
    } finally {
      setCargandoInversiones(
        false,
      );
    }
  };

  const cerrarModalInversion =
    () => {
      setModalInversionAbierto(
        false,
      );

      setParqueInversion(
        null,
      );

      setInversionesParque(
        [],
      );

      setErrorInversiones(
        '',
      );

      setCargandoInversiones(
        false,
      );
    };

  const formatearColones = (
    valor:
      | number
      | string
      | null
      | undefined,
  ) => {
    const numero =
      Number(
        valor ?? 0,
      );

    return new Intl.NumberFormat(
      'es-CR',
      {
        style:
          'currency',

        currency:
          'CRC',

        minimumFractionDigits:
          0,

        maximumFractionDigits:
          2,
      },
    ).format(
      Number.isFinite(
        numero,
      )
        ? numero
        : 0,
    );
  };

  const formatearFechaInversion = (
    fecha:
      | string
      | null
      | undefined,
  ) => {
    if (!fecha) {
      return 'Fecha no registrada';
    }

    const partes =
      fecha
        .substring(
          0,
          10,
        )
        .split(
          '-',
        );

    if (
      partes.length !== 3
    ) {
      return fecha;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  const inversionTotalParque =
    inversionesParque.reduce(
      (
        total,
        mantenimiento,
      ) =>
        total +
        Number(
          mantenimiento.inversion ??
          0,
        ),
      0,
    );

  // ============================================
  // CERRAR MODALES CON ESC
  // ============================================

  useEffect(() => {
    const manejarEscape = (
      event: KeyboardEvent,
    ) => {
      if (event.key !== 'Escape') {
        return;
      }

      if (modalInversionAbierto) {
        cerrarModalInversion();
        return;
      }

      if (modalInformacionAbierto) {
        cerrarModalInformacion();
        return;
      }

      if (modalEncargadoAbierto) {
        cerrarModalEncargado();
        return;
      }

      if (modalEliminarAbierto) {
        cerrarModalEliminar();
        return;
      }

      if (modalAbierto) {
        cerrarModal();
      }
    };

    document.addEventListener(
      'keydown',
      manejarEscape,
    );

    return () => {
      document.removeEventListener(
        'keydown',
        manejarEscape,
      );
    };
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
    <div className="min-h-screen bg-[#F4F7F8]">

      {/* ====================================== */}

      <Header
        title="Gestión de Parques"
        description="Administración de los parques registrados en el sistema."
      />

      {/* ====================================== */}
      {/* CONTENIDO */}
      {/* ====================================== */}

      <main className="mx-auto max-w-7xl px-8 py-10">

        <div className="mb-6 flex items-center justify-between">

          <div>

            <h2 className="text-xl font-semibold text-[#16313E]">
              Parques registrados
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Consulte y administre la información almacenada en el sistema.
            </p>

          </div>

          <button
            type="button"
            onClick={
              abrirModalCrear
            }
            className="rounded-lg bg-[#315F73] px-4 py-2 text-sm font-semibold text-white hover:bg-[#244C5F]"
          >
            + Nuevo parque
          </button>

        </div>

        {/* FILTROS DE BÚSQUEDA */}

        <div className="mb-6 rounded-xl border border-[#D9E2E7] bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-[#16313E]">Filtros de búsqueda</h3>
              <p className="mt-1 text-sm text-slate-500">
                Utilice uno o varios criterios para localizar parques específicos.
              </p>
            </div>

            <button
              type="button"
              onClick={limpiarFiltros}
              disabled={!hayFiltrosActivos}
              className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Limpiar filtros
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Ubicación</label>
              <input
                type="text"
                value={filtroUbicacion}
                onChange={(event) => setFiltroUbicacion(event.target.value)}
                placeholder="Buscar por ubicación"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Número de finca</label>
              <input
                type="text"
                value={filtroFinca}
                onChange={(event) => setFiltroFinca(event.target.value)}
                placeholder="Buscar por finca"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Número de plano</label>
              <input
                type="text"
                value={filtroPlano}
                onChange={(event) => setFiltroPlano(event.target.value)}
                placeholder="Buscar por plano"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Distrito</label>
              <select
                value={filtroDistrito}
                onChange={(event) => setFiltroDistrito(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Todos los distritos</option>
                {distritos.map((distrito) => (
                  <option key={distrito.id_distrito} value={distrito.id_distrito}>
                    {distrito.nombre_distrito}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Estado</label>
              <select
                value={filtroEstado}
                onChange={(event) => setFiltroEstado(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Todos los estados</option>
                <option value="Bueno">Bueno</option>
                <option value="Regular">Regular</option>
                <option value="Malo">Malo</option>
                <option value="Vacío">Vacío</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Entidad encargada</label>
              <input
                type="text"
                value={filtroEncargado}
                onChange={(event) => setFiltroEncargado(event.target.value)}
                placeholder="Entidad, representante o cédula"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-500">
              Mostrando <span className="font-semibold text-[#16313E]">{parquesFiltrados.length}</span>
              {' '}de <span className="font-semibold text-[#16313E]">{parques.length}</span> parques.
            </p>
          </div>
        </div>

        {/* CARGANDO */}

        {cargando && (
          <div className="rounded-xl border border-[#D9E2E7] bg-white p-8 text-center text-slate-500">
            Cargando parques...
          </div>
        )}

        {/* ERROR */}

        {!cargando &&
          error && (

          <div className="rounded-xl border border-red-200 bg-red-50 p-6">

            <p className="text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={
                cargarParques
              }
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white"
            >
              Intentar nuevamente
            </button>

          </div>

        )}

        {/* ====================================== */}
        {/* TABLA */}
        {/* ====================================== */}

        {!cargando && !error && (
          <div className="overflow-hidden rounded-xl border border-[#D9E2E7] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1180px]">
                <thead className="bg-slate-50">
                  <tr>
                    {['Ubicación', 'Finca', 'Área', 'Plano', 'Visado', 'Distrito', 'Entidad encargada', 'Estado', 'Acciones'].map((titulo) => (
                      <th
                        key={titulo}
                        className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                      >
                        {titulo}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {parquesFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                        {hayFiltrosActivos
                          ? 'No se encontraron parques que coincidan con los filtros seleccionados.'
                          : 'No hay parques registrados.'}
                      </td>
                    </tr>
                  ) : (
                    parquesPaginados.map((parque) => (
                      <tr
                        key={parque.id_parque}
                        className="border-t border-slate-100 hover:bg-slate-50"
                      >
                        {/* Ubicación: se limita únicamente en la tabla */}
                        <td className="max-w-[220px] px-3 py-3 text-sm font-medium text-[#16313E]">
                          <p className="truncate" title={parque.ubicacion}>
                            {limitarTexto(parque.ubicacion, 40)}
                          </p>
                        </td>

                        {/* Finca, área, plano, visado y distrito se muestran completos */}
                        <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-700">
                          {parque.numero_finca}
                        </td>

                        <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-700">
                          {parque.area} m²
                        </td>

                        <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-700">
                          {parque.numero_plano}
                        </td>

                        <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-700">
                          {parque.visado}
                        </td>

                        <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-700">
                          {parque.distrito?.nombre_distrito ?? 'Sin distrito'}
                        </td>

                        {/* Entidad encargada: se limita únicamente en la tabla */}
                        <td className="max-w-[210px] px-3 py-3 text-sm">
                          {parque.encargado ? (
                            <p
                              className="truncate font-medium text-[#16313E]"
                              title={parque.encargado.entidad_encargada}
                            >
                              {limitarTexto(parque.encargado.entidad_encargada, 35)}
                            </p>
                          ) : (
                            <span className="text-slate-400">Sin encargado</span>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-3 py-3">
                          <span
                            className={
                              parque.estado === 'Bueno'
                                ? 'inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700'
                                : parque.estado === 'Regular'
                                  ? 'inline-flex rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-700'
                                  : parque.estado === 'Malo'
                                    ? 'inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700'
                                    : 'inline-flex rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700'
                            }
                          >
                            {parque.estado}
                          </span>
                        </td>

                        {/* Acciones siempre en una sola línea */}
                        <td className="whitespace-nowrap px-3 py-3">
                          <div className="flex flex-nowrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => abrirModalEditar(parque)}
                              className="rounded-md bg-sky-100 px-2.5 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-200"
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              onClick={() => abrirModalInformacion(parque)}
                              className="rounded-md bg-indigo-100 px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-200"
                            >
                              Información
                            </button>

                            <button
                              type="button"
                              onClick={() => abrirModalInversion(parque)}
                              className="rounded-md bg-amber-100 px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-200"
                            >
                              Inversión
                            </button>

                            <button
                              type="button"
                              onClick={() => abrirModalEncargado(parque)}
                              disabled={!parque.encargado}
                              className="rounded-md bg-violet-100 px-2.5 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-200 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Encargado
                            </button>

                            <button
                              type="button"
                              onClick={() => abrirModalEliminar(parque)}
                              className="rounded-md bg-red-100 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200"
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

            {parquesFiltrados.length > 0 && (
              <div className="flex flex-col gap-4 border-t border-[#D9E2E7] bg-white px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <p className="text-sm text-slate-500">
                    Mostrando{' '}
                    <span className="font-semibold text-[#16313E]">
                      {indiceInicial + 1}
                    </span>{' '}
                    a{' '}
                    <span className="font-semibold text-[#16313E]">
                      {indiceFinal}
                    </span>{' '}
                    de{' '}
                    <span className="font-semibold text-[#16313E]">
                      {totalRegistrosFiltrados}
                    </span>{' '}
                    parques
                  </p>

                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="registrosPorPaginaParques"
                      className="text-sm text-slate-500"
                    >
                      Registros por página:
                    </label>
                    <select
                      id="registrosPorPaginaParques"
                      value={registrosPorPagina}
                      onChange={(event) =>
                        setRegistrosPorPagina(Number(event.target.value))
                      }
                      className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-1.5 lg:justify-end">
                  <button
                    type="button"
                    onClick={() => setPaginaActual((pagina) => Math.max(1, pagina - 1))}
                    disabled={paginaActual === 1}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ← Anterior
                  </button>

                  {paginasVisibles.map((pagina) => (
                    <button
                      key={pagina}
                      type="button"
                      onClick={() => setPaginaActual(pagina)}
                      aria-current={paginaActual === pagina ? 'page' : undefined}
                      className={
                        paginaActual === pagina
                          ? 'min-w-10 rounded-lg bg-[#315F73] px-3 py-2 text-sm font-semibold text-white'
                          : 'min-w-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50'
                      }
                    >
                      {pagina}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() =>
                      setPaginaActual((pagina) => Math.min(totalPaginas, pagina + 1))
                    }
                    disabled={paginaActual === totalPaginas}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >

          <div
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl"
          >

            <div className="flex items-center justify-between border-b border-[#D9E2E7] px-6 py-5">

              <div>

                <h2 className="text-xl font-bold text-[#16313E]">

                  {modoEdicion
                    ? 'Editar parque'
                    : 'Nuevo parque'}

                </h2>

                <p className="mt-1 text-sm text-slate-500">

                  {modoEdicion
                    ? 'Modifique la información del parque.'
                    : 'Complete la información para registrar el parque.'}

                </p>

              </div>

              <button
                type="button"
                onClick={
                  cerrarModal
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-600 hover:bg-slate-200"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={
                guardarParque
              }
              className="p-6"
            >

              {errorFormulario && (

                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {
                    errorFormulario
                  }
                </div>

              )}

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                {/* UBICACIÓN */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Ubicación
                  </label>

                  <input
                    type="text"
                    value={
                      ubicacion
                    }
                    onChange={(
                      event,
                    ) =>
                      setUbicacion(
                        event.target.value,
                      )
                    }
                    required
                    maxLength={200}
                    placeholder="Ej: Barrio Latino, Grecia Centro"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Máximo 200 caracteres.
                  </p>

                </div>

                {/* FINCA */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Número de finca
                  </label>

                  <input
                    type="text"
                    value={
                      numeroFinca
                    }
                    onChange={(
                      event,
                    ) =>
                      setNumeroFinca(
                        sanitizarSoloNumeros(event.target.value),
                      )
                    }
                    required
                    maxLength={50}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Ej: 2123456000"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Solo números. Máximo 50 dígitos.
                  </p>

                </div>

                {/* ÁREA */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Área (m²)
                  </label>

                  <input
                    type="text"
                    inputMode="decimal"
                    value={
                      area
                    }
                    onChange={(
                      event,
                    ) =>
                      setArea(
                        sanitizarArea(event.target.value),
                      )
                    }
                    required
                    maxLength={13}
                    placeholder="Ej: 2500.50"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Solo números. Máximo 10 enteros y 2 decimales.
                  </p>

                </div>

                {/* PLANO */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Número de plano
                  </label>

                  <input
                    type="text"
                    value={
                      numeroPlano
                    }
                    onChange={(
                      event,
                    ) =>
                      setNumeroPlano(
                        event.target.value,
                      )
                    }
                    required
                    maxLength={50}
                    placeholder="Ej: A-1234567-2026"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Máximo 50 caracteres. Debe ser único.
                  </p>

                </div>

                {/* VISADO */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Visado
                  </label>

                  <select
                    value={visado}
                    onChange={(event) => setVisado(event.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    <option value="">Seleccione el visado</option>
                    <option value="Aprobado">Aprobado</option>
                    <option value="Solicitado">Solicitado</option>
                    <option value="No tiene">No tiene</option>
                  </select>

                </div>

                {/* ESTADO */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Estado
                  </label>

                  <select
                    value={
                      estado
                    }
                    onChange={(
                      event,
                    ) =>
                      setEstado(
                        event.target.value,
                      )
                    }
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  >

                    <option value="">
                      Seleccione el estado
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

                </div>

                {/* DISTRITO */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Distrito
                  </label>

                  <input
                    type="text"
                    value={busquedaDistrito}
                    onChange={(event) => setBusquedaDistrito(event.target.value)}
                    placeholder="Buscar distrito..."
                    className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />

                  <select
                    value={idDistrito}
                    onChange={(event) => setIdDistrito(event.target.value)}
                    required
                    size={Math.min(Math.max(distritosFiltradosFormulario.length + 1, 2), 6)}
                    className="w-full overflow-y-auto rounded-lg border border-slate-300 px-3 py-2"
                  >
                    <option value="">Seleccione un distrito</option>

                    {distritosFiltradosFormulario.map((distrito) => (
                      <option
                        key={distrito.id_distrito}
                        value={distrito.id_distrito}
                      >
                        {distrito.nombre_distrito}
                      </option>
                    ))}
                  </select>

                  {busquedaDistrito && distritosFiltradosFormulario.length === 0 && (
                    <p className="mt-2 text-xs text-slate-500">
                      No se encontraron distritos.
                    </p>
                  )}
                </div>

                {/* ENTIDAD ENCARGADA */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Entidad encargada
                  </label>

                  <input
                    type="text"
                    value={busquedaEncargado}
                    onChange={(event) => setBusquedaEncargado(event.target.value)}
                    placeholder="Buscar entidad, representante o cédula..."
                    className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />

                  <select
                    value={idEncargado}
                    onChange={(event) => setIdEncargado(event.target.value)}
                    required
                    size={Math.min(Math.max(encargadosFiltradosFormulario.length + 1, 2), 6)}
                    className="w-full overflow-y-auto rounded-lg border border-slate-300 px-3 py-2"
                  >
                    <option value="">Seleccione una entidad encargada</option>

                    {encargadosFiltradosFormulario.map((encargado) => (
                      <option
                        key={encargado.id_encargado}
                        value={encargado.id_encargado}
                      >
                        {encargado.entidad_encargada} — {encargado.representante_legal}
                      </option>
                    ))}
                  </select>

                  {busquedaEncargado && encargadosFiltradosFormulario.length === 0 && (
                    <p className="mt-2 text-xs text-slate-500">
                      No se encontraron entidades encargadas.
                    </p>
                  )}
                </div>

              </div>

              {/* BOTONES */}

              <div className="mt-7 flex justify-end gap-3 border-t border-slate-100 pt-5">

                <button
                  type="button"
                  onClick={
                    cerrarModal
                  }
                  disabled={
                    guardando
                  }
                  className="rounded-lg bg-slate-200 px-5 py-2 font-semibold text-slate-700 hover:bg-slate-300 disabled:opacity-60"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    guardando
                  }
                  className="rounded-lg bg-[#315F73] px-5 py-2 font-semibold text-white hover:bg-[#244C5F] disabled:opacity-60"
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
      {/* MODAL INFORMACIÓN DEL PARQUE */}
      {/* ====================================== */}

      {modalInformacionAbierto &&
        parqueVer && (

        <div
          onClick={cerrarModalInformacion}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
        >

          <div
            onClick={(event) => event.stopPropagation()}
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto overflow-x-hidden rounded-2xl bg-white shadow-2xl"
          >

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-[#D9E2E7] px-6 py-5">

              <div>

                <h2 className="text-xl font-bold text-[#16313E]">
                  Información del parque
                </h2>

                <p className="mt-1 max-w-full break-words text-sm text-slate-500 [overflow-wrap:anywhere]">
                  Información completa del parque seleccionado.
                </p>

              </div>

              <button
                type="button"
                onClick={
                  cerrarModalInformacion
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-600 hover:bg-slate-200"
              >
                ×
              </button>

            </div>

            {/* CONTENIDO */}

            <div className="p-6">

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                <div className="min-w-0 overflow-hidden rounded-lg border border-[#D9E2E7] p-4">

                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Ubicación
                  </p>

                  <p className="mt-1 max-w-full break-words font-medium text-[#16313E] [overflow-wrap:anywhere]">
                    {
                      parqueVer.ubicacion
                    }
                  </p>

                </div>

                <div className="min-w-0 overflow-hidden rounded-lg border border-[#D9E2E7] p-4">

                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Número de finca
                  </p>

                  <p className="mt-1 max-w-full break-words font-medium text-[#16313E] [overflow-wrap:anywhere]">
                    {
                      parqueVer.numero_finca
                    }
                  </p>

                </div>

                <div className="min-w-0 overflow-hidden rounded-lg border border-[#D9E2E7] p-4">

                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Área
                  </p>

                  <p className="mt-1 max-w-full break-words font-medium text-[#16313E] [overflow-wrap:anywhere]">
                    {
                      parqueVer.area
                    }{' '}
                    m²
                  </p>

                </div>

                <div className="min-w-0 overflow-hidden rounded-lg border border-[#D9E2E7] p-4">

                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Número de plano
                  </p>

                  <p className="mt-1 max-w-full break-words font-medium text-[#16313E] [overflow-wrap:anywhere]">
                    {
                      parqueVer.numero_plano
                    }
                  </p>

                </div>

                <div className="min-w-0 overflow-hidden rounded-lg border border-[#D9E2E7] p-4">

                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Visado
                  </p>

                  <p className="mt-1 max-w-full break-words font-medium text-[#16313E] [overflow-wrap:anywhere]">
                    {
                      parqueVer.visado
                    }
                  </p>

                </div>

                <div className="min-w-0 overflow-hidden rounded-lg border border-[#D9E2E7] p-4">

                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Estado
                  </p>

                  <p className="mt-1 max-w-full break-words font-medium text-[#16313E] [overflow-wrap:anywhere]">
                    {
                      parqueVer.estado
                    }
                  </p>

                </div>

                <div className="min-w-0 overflow-hidden rounded-lg border border-[#D9E2E7] p-4">

                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Distrito
                  </p>

                  <p className="mt-1 max-w-full break-words font-medium text-[#16313E] [overflow-wrap:anywhere]">
                    {
                      parqueVer.distrito
                        ?.nombre_distrito ||
                      'Sin distrito'
                    }
                  </p>

                </div>

                <div className="min-w-0 overflow-hidden rounded-lg border border-[#D9E2E7] p-4">

                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Entidad encargada
                  </p>

                  <p className="mt-1 max-w-full break-words font-medium text-[#16313E] [overflow-wrap:anywhere]">
                    {
                      parqueVer.encargado
                        ?.entidad_encargada ||
                      'Sin encargado'
                    }
                  </p>

                </div>

                <div className="min-w-0 overflow-hidden rounded-lg border border-[#D9E2E7] p-4">

                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Representante legal
                  </p>

                  <p className="mt-1 max-w-full break-words font-medium text-[#16313E] [overflow-wrap:anywhere]">
                    {
                      parqueVer.encargado
                        ?.representante_legal ||
                      'No registrado'
                    }
                  </p>

                </div>
</div>

              <div className="mt-6 flex justify-end">

                <button
                  type="button"
                  onClick={
                    cerrarModalInformacion
                  }
                  className="rounded-lg bg-slate-900 px-5 py-2 font-semibold text-white hover:bg-slate-800"
                >
                  Cerrar
                </button>

              </div>

            </div>

          </div>

        </div>

      )}


      {/* ====================================== */}
      {/* MODAL INVERSIONES */}
      {/* ====================================== */}

      {modalInversionAbierto &&
        parqueInversion && (

        <div
          onClick={cerrarModalInversion}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4"
        >

          <div
            onClick={(event) => event.stopPropagation()}
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto overflow-x-hidden rounded-2xl bg-white shadow-2xl"
          >

            <div className="flex items-center justify-between border-b border-[#D9E2E7] px-6 py-5">

              <div className="min-w-0 pr-4">

                <h2 className="text-xl font-bold text-[#16313E]">
                  Historial de inversiones
                </h2>

                <p className="mt-1 max-w-full break-words text-sm text-slate-500 [overflow-wrap:anywhere]">
                  {parqueInversion.ubicacion}
                </p>

              </div>

              <button
                type="button"
                onClick={cerrarModalInversion}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-600 hover:bg-slate-200"
              >
                ×
              </button>

            </div>

            <div className="p-6">

              {cargandoInversiones ? (

                <div className="rounded-xl border border-[#D9E2E7] bg-slate-50 p-8 text-center">

                  <p className="font-semibold text-[#16313E]">
                    Cargando inversiones...
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Consultando los mantenimientos registrados para este parque.
                  </p>

                </div>

              ) : errorInversiones ? (

                <div className="rounded-xl border border-red-200 bg-red-50 p-5">

                  <p className="font-semibold text-red-700">
                    No se pudieron cargar las inversiones
                  </p>

                  <p className="mt-1 break-words text-sm text-red-600">
                    {errorInversiones}
                  </p>

                  <button
                    type="button"
                    onClick={() => abrirModalInversion(parqueInversion)}
                    className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                  >
                    Intentar nuevamente
                  </button>

                </div>

              ) : inversionesParque.length === 0 ? (

                <div className="rounded-xl border border-[#D9E2E7] bg-slate-50 p-6 text-center">

                  <p className="font-semibold text-[#16313E]">
                    No hay inversiones registradas
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Este parque todavía no tiene mantenimientos con inversión registrada.
                  </p>

                </div>

              ) : (

                <>

                  <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">

                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">

                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                        Inversión total
                      </p>

                      <p className="mt-2 break-words text-2xl font-bold text-emerald-800">
                        {formatearColones(
                          inversionTotalParque,
                        )}
                      </p>

                    </div>

                    <div className="rounded-xl border border-[#D9E2E7] bg-slate-50 p-5">

                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Mantenimientos con inversión
                      </p>

                      <p className="mt-2 text-2xl font-bold text-[#16313E]">
                        {inversionesParque.length}
                      </p>

                    </div>

                  </div>

                  <div className="space-y-4">

                    {inversionesParque.map(
                      (
                        inversionRegistro,
                        index,
                      ) => (

                      <div
                        key={inversionRegistro.id_mantenimiento}
                        className="min-w-0 overflow-hidden rounded-xl border border-[#D9E2E7] p-5"
                      >

                        <div className="mb-4 flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">

                          <div className="min-w-0">

                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Inversión {index + 1}
                            </p>

                            <p className="mt-1 max-w-full break-words font-semibold text-[#16313E] [overflow-wrap:anywhere]">
                              {inversionRegistro.nombre_mantenimiento}
                            </p>

                          </div>

                          <p className="shrink-0 text-sm font-medium text-slate-600">
                            {formatearFechaInversion(
                              inversionRegistro.fecha_mantenimiento,
                            )}
                          </p>

                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                          <div className="min-w-0 rounded-lg bg-slate-50 p-4">

                            <p className="text-xs font-semibold uppercase text-slate-500">
                              Monto
                            </p>

                            <p className="mt-1 max-w-full break-words text-lg font-semibold text-[#16313E] [overflow-wrap:anywhere]">
                              {formatearColones(
                                inversionRegistro.inversion,
                              )}
                            </p>

                          </div>

                          <div className="min-w-0 rounded-lg bg-slate-50 p-4">

                            <p className="text-xs font-semibold uppercase text-slate-500">
                              Fecha del mantenimiento
                            </p>

                            <p className="mt-1 max-w-full break-words font-medium text-[#16313E] [overflow-wrap:anywhere]">
                              {formatearFechaInversion(
                                inversionRegistro.fecha_mantenimiento,
                              )}
                            </p>

                          </div>

                        </div>

                        <div className="mt-4 min-w-0 rounded-lg bg-slate-50 p-4">

                          <p className="text-xs font-semibold uppercase text-slate-500">
                            Descripción de la inversión
                          </p>

                          <p className="mt-1 max-w-full break-words font-medium text-[#16313E] [overflow-wrap:anywhere]">
                            {inversionRegistro.descripcion_inversion?.trim() ||
                              'Sin detalle registrado'}
                          </p>

                        </div>

                      </div>

                      ),
                    )}

                  </div>

                </>

              )}

              <div className="mt-6 flex justify-end">

                <button
                  type="button"
                  onClick={cerrarModalInversion}
                  className="rounded-lg bg-slate-900 px-5 py-2 font-semibold text-white hover:bg-slate-800"
                >
                  Cerrar
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

      {/* ====================================== */}
      {/* MODAL INFORMACIÓN ENCARGADO */}
      {/* ====================================== */}

      {modalEncargadoAbierto &&
        encargadoVer && (

        <div
          onClick={cerrarModalEncargado}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
        >

          <div
            onClick={(event) => event.stopPropagation()}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto overflow-x-hidden rounded-2xl bg-white shadow-2xl"
          >

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-[#D9E2E7] px-6 py-5">

              <div>

                <h2 className="text-xl font-bold text-[#16313E]">
                  Información del encargado
                </h2>

                <p className="mt-1 max-w-full break-words text-sm text-slate-500 [overflow-wrap:anywhere]">
                  Datos de la entidad encargada y su representante legal.
                </p>

              </div>

              <button
                type="button"
                onClick={
                  cerrarModalEncargado
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-600 hover:bg-slate-200"
              >
                ×
              </button>

            </div>

            {/* CONTENIDO */}

            <div className="p-6">

              <div className="mb-5 min-w-0 overflow-hidden rounded-xl bg-slate-50 p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Entidad encargada
                </p>

                <p className="mt-1 max-w-full break-words text-lg font-semibold text-[#16313E] [overflow-wrap:anywhere]">
                  {
                    encargadoVer.entidad_encargada
                  }
                </p>

              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                <div className="min-w-0 overflow-hidden rounded-lg border border-[#D9E2E7] p-4">

                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Cédula jurídica
                  </p>

                  <p className="mt-1 max-w-full break-words font-medium text-[#16313E] [overflow-wrap:anywhere]">
                    {
                      encargadoVer.cedula_juridica ||
                      'No registrada'
                    }
                  </p>

                </div>

                <div className="min-w-0 overflow-hidden rounded-lg border border-[#D9E2E7] p-4">

                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Representante legal
                  </p>

                  <p className="mt-1 max-w-full break-words font-medium text-[#16313E] [overflow-wrap:anywhere]">
                    {
                      encargadoVer.representante_legal
                    }
                  </p>

                </div>

                <div className="min-w-0 overflow-hidden rounded-lg border border-[#D9E2E7] p-4">

                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Correo electrónico
                  </p>

                  <p className="mt-1 max-w-full break-words font-medium text-[#16313E] [overflow-wrap:anywhere]">
                    {
                      encargadoVer.correo_encargado
                    }
                  </p>

                </div>

                <div className="min-w-0 overflow-hidden rounded-lg border border-[#D9E2E7] p-4">

                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Teléfono
                  </p>

                  <p className="mt-1 max-w-full break-words font-medium text-[#16313E] [overflow-wrap:anywhere]">
                    {
                      encargadoVer.telefono_encargado
                    }
                  </p>

                </div>

              </div>

              <div className="mt-6 flex justify-end">

                <button
                  type="button"
                  onClick={
                    cerrarModalEncargado
                  }
                  className="rounded-lg bg-slate-900 px-5 py-2 font-semibold text-white hover:bg-slate-800"
                >
                  Cerrar
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

      {/* ====================================== */}
      {/* MODAL ELIMINAR */}
      {/* ====================================== */}

      {modalEliminarAbierto &&
        parqueEliminar && (

        <div
          onClick={cerrarModalEliminar}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
        >

          <div
            onClick={(event) => event.stopPropagation()}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto overflow-x-hidden rounded-2xl bg-white shadow-2xl"
          >

            <div className="border-b border-[#D9E2E7] px-6 py-5">

              <h2 className="text-xl font-bold text-[#16313E]">
                Eliminar parque
              </h2>

              <p className="mt-1 max-w-full break-words text-sm text-slate-500 [overflow-wrap:anywhere]">
                Esta acción eliminará el registro seleccionado.
              </p>

            </div>

            <div className="p-6">

              <div className="min-w-0 overflow-hidden rounded-xl bg-red-50 p-4">

                <p className="max-w-full break-words text-sm text-red-700 [overflow-wrap:anywhere]">
                  ¿Está seguro de que desea eliminar este parque?
                </p>

                <p className="mt-3 max-w-full break-words font-semibold text-[#16313E] [overflow-wrap:anywhere]">
                  {
                    parqueEliminar.ubicacion
                  }
                </p>

                <p className="mt-1 max-w-full break-words text-sm text-slate-500 [overflow-wrap:anywhere]">
                  Finca:{' '}
                  {
                    parqueEliminar.numero_finca
                  }
                </p>

              </div>

              {errorEliminar && (

                <div className="mt-4 min-w-0 overflow-hidden rounded-lg border border-red-300 bg-red-50 p-4">

                  <p className="text-sm font-semibold text-red-800">
                    No se puede eliminar el parque
                  </p>

                  <p className="mt-1 max-w-full break-words text-sm text-red-700 [overflow-wrap:anywhere]">
                    {
                      errorEliminar
                    }
                  </p>

                </div>

              )}

              <div className="mt-6 flex justify-end gap-3">

                <button
                  type="button"
                  onClick={
                    cerrarModalEliminar
                  }
                  disabled={
                    eliminando
                  }
                  className="rounded-lg bg-slate-200 px-5 py-2 font-semibold text-slate-700 hover:bg-slate-300 disabled:opacity-60"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={
                    confirmarEliminarParque
                  }
                  disabled={
                    eliminando
                  }
                  className="rounded-lg bg-red-600 px-5 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >

                  {eliminando
                    ? 'Eliminando...'
                    : 'Sí, eliminar'}

                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}
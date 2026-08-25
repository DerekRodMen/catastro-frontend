import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';

import { useNavigate } from 'react-router-dom';

import { api } from '../../services/api';

type TipoEncargado =
  | 'ASOCIACION'
  | 'PERSONA';

interface Encargado {
  id_encargado: number;
  tipo_encargado: TipoEncargado;
  nombre_asociacion: string | null;
  cedula_juridica: string | null;
  nombre_encargado: string;
  cedula_fisica: string | null;
  correo_encargado: string;
  telefono_encargado: string;
}

export default function Encargados() {
  const navigate = useNavigate();

  const [
    encargados,
    setEncargados,
  ] = useState<Encargado[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState('');

  // ============================
  // MODAL CREAR / EDITAR
  // ============================

  const [
    modalAbierto,
    setModalAbierto,
  ] = useState(false);

  const [
    seleccionandoTipo,
    setSeleccionandoTipo,
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
    idEncargadoEditando,
    setIdEncargadoEditando,
  ] = useState<number | null>(null);

  // ============================
  // MODAL ELIMINAR
  // ============================

  const [
    modalEliminarAbierto,
    setModalEliminarAbierto,
  ] = useState(false);

  const [
    encargadoEliminar,
    setEncargadoEliminar,
  ] = useState<Encargado | null>(
    null,
  );

  const [
    eliminando,
    setEliminando,
  ] = useState(false);

  const [
    errorEliminar,
    setErrorEliminar,
  ] = useState('');

  // ============================
  // TIPO
  // ============================

  const [
    tipoEncargado,
    setTipoEncargado,
  ] = useState<TipoEncargado | null>(
    null,
  );

  // ============================
  // FORMULARIO
  // ============================

  const [
    nombreAsociacion,
    setNombreAsociacion,
  ] = useState('');

  const [
    cedulaJuridica,
    setCedulaJuridica,
  ] = useState('');

  const [
    nombreEncargado,
    setNombreEncargado,
  ] = useState('');

  const [
    cedulaFisica,
    setCedulaFisica,
  ] = useState('');

  const [
    correoEncargado,
    setCorreoEncargado,
  ] = useState('');

  const [
    telefonoEncargado,
    setTelefonoEncargado,
  ] = useState('');

  // ============================
  // CÉDULA JURÍDICA
  // ============================

  const formatearCedulaJuridica = (
    valor: string,
  ) => {
    const numeros = valor
      .replace(/\D/g, '')
      .slice(0, 10);

    if (numeros.length <= 1) {
      return numeros;
    }

    if (numeros.length <= 4) {
      return `${numeros.slice(
        0,
        1,
      )}-${numeros.slice(1)}`;
    }

    return `${numeros.slice(
      0,
      1,
    )}-${numeros.slice(
      1,
      4,
    )}-${numeros.slice(
      4,
      10,
    )}`;
  };

  // ============================
  // CÉDULA FÍSICA
  // ============================

  const formatearCedulaFisica = (
    valor: string,
  ) => {
    const numeros = valor
      .replace(/\D/g, '')
      .slice(0, 9);

    if (numeros.length <= 1) {
      return numeros;
    }

    if (numeros.length <= 5) {
      return `${numeros.slice(
        0,
        1,
      )}-${numeros.slice(1)}`;
    }

    return `${numeros.slice(
      0,
      1,
    )}-${numeros.slice(
      1,
      5,
    )}-${numeros.slice(
      5,
      9,
    )}`;
  };

  // ============================
  // TELÉFONO
  // ============================

  const formatearTelefono = (
    valor: string,
  ) => {
    const numeros = valor
      .replace(/\D/g, '')
      .slice(0, 8);

    if (numeros.length <= 4) {
      return numeros;
    }

    return `${numeros.slice(
      0,
      4,
    )}-${numeros.slice(4)}`;
  };

  // ============================
  // CARGAR ENCARGADOS
  // ============================

  const cargarEncargados =
    async () => {
      try {
        setCargando(true);
        setError('');

        const response =
          await api.get(
            '/encargados',
          );

        setEncargados(
          response.data,
        );
      } catch (error) {
        console.error(
          'Error cargando encargados:',
          error,
        );

        setError(
          'No se pudieron cargar los encargados.',
        );
      } finally {
        setCargando(false);
      }
    };

  useEffect(() => {
    cargarEncargados();
  }, []);

  // ============================
  // LIMPIAR
  // ============================

  const limpiarFormulario =
    () => {
      setTipoEncargado(null);
      setNombreAsociacion('');
      setCedulaJuridica('');
      setNombreEncargado('');
      setCedulaFisica('');
      setCorreoEncargado('');
      setTelefonoEncargado('');
      setErrorFormulario('');
    };

  // ============================
  // NUEVO
  // ============================

  const abrirNuevo = () => {
    limpiarFormulario();

    setModoEdicion(false);
    setIdEncargadoEditando(null);

    setSeleccionandoTipo(true);
    setModalAbierto(true);
  };

  // ============================
  // SELECCIONAR TIPO
  // ============================

  const seleccionarTipo = (
    tipo: TipoEncargado,
  ) => {
    setTipoEncargado(tipo);
    setSeleccionandoTipo(false);
  };

  // ============================
  // EDITAR
  // ============================

  const abrirEditar = (
    encargado: Encargado,
  ) => {
    setTipoEncargado(
      encargado.tipo_encargado,
    );

    setNombreAsociacion(
      encargado.nombre_asociacion ??
        '',
    );

    setCedulaJuridica(
      encargado.cedula_juridica ??
        '',
    );

    setNombreEncargado(
      encargado.nombre_encargado ??
        '',
    );

    setCedulaFisica(
      encargado.cedula_fisica ??
        '',
    );

    setCorreoEncargado(
      encargado.correo_encargado ??
        '',
    );

    setTelefonoEncargado(
      encargado.telefono_encargado ??
        '',
    );

    setModoEdicion(true);

    setIdEncargadoEditando(
      encargado.id_encargado,
    );

    setSeleccionandoTipo(false);
    setModalAbierto(true);
    setErrorFormulario('');
  };

  // ============================
  // CERRAR MODAL
  // ============================

  const cerrarModal = () => {
    if (guardando) {
      return;
    }

    setModalAbierto(false);
    setSeleccionandoTipo(false);

    limpiarFormulario();

    setModoEdicion(false);
    setIdEncargadoEditando(null);
  };

  // ============================
  // GUARDAR
  // ============================

  const guardarEncargado = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!tipoEncargado) {
      return;
    }

    setGuardando(true);
    setErrorFormulario('');

    try {
      const token =
        localStorage.getItem('token');

      if (
        tipoEncargado ===
          'ASOCIACION' &&
        !/^\d-\d{3}-\d{6}$/.test(
          cedulaJuridica,
        )
      ) {
        setErrorFormulario(
          'La cédula jurídica debe tener el formato 3-002-123456.',
        );

        setGuardando(false);

        return;
      }

      if (
        tipoEncargado ===
          'PERSONA' &&
        !/^\d-\d{4}-\d{4}$/.test(
          cedulaFisica,
        )
      ) {
        setErrorFormulario(
          'La cédula física debe tener el formato 1-1234-5678.',
        );

        setGuardando(false);

        return;
      }

      if (
        !/^\d{4}-\d{4}$/.test(
          telefonoEncargado,
        )
      ) {
        setErrorFormulario(
          'El teléfono debe tener el formato 8888-8888.',
        );

        setGuardando(false);

        return;
      }

      const datosEncargado = {
        tipo_encargado:
          tipoEncargado,

        nombre_asociacion:
          tipoEncargado ===
          'ASOCIACION'
            ? nombreAsociacion
            : undefined,

        cedula_juridica:
          tipoEncargado ===
          'ASOCIACION'
            ? cedulaJuridica
            : undefined,

        nombre_encargado:
          nombreEncargado,

        cedula_fisica:
          tipoEncargado ===
          'PERSONA'
            ? cedulaFisica
            : undefined,

        correo_encargado:
          correoEncargado,

        telefono_encargado:
          telefonoEncargado,
      };

      if (
        modoEdicion &&
        idEncargadoEditando !==
          null
      ) {
        await api.patch(
          `/encargados/${idEncargadoEditando}`,
          datosEncargado,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );
      } else {
        await api.post(
          '/encargados',
          datosEncargado,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );
      }

      setModalAbierto(false);

      limpiarFormulario();

      setModoEdicion(false);
      setIdEncargadoEditando(null);

      await cargarEncargados();
    } catch (error: any) {
      console.error(
        'Error guardando encargado:',
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

        navigate('/login');

        return;
      }

      const message =
        error.response?.data?.message;

      if (Array.isArray(message)) {
        setErrorFormulario(
          message.join(', '),
        );
      } else if (message) {
        setErrorFormulario(
          message,
        );
      } else {
        setErrorFormulario(
          modoEdicion
            ? 'No se pudo actualizar el encargado.'
            : 'No se pudo registrar el encargado.',
        );
      }
    } finally {
      setGuardando(false);
    }
  };

  // ============================
  // ABRIR ELIMINAR
  // ============================

  const abrirModalEliminar = (
    encargado: Encargado,
  ) => {
    setEncargadoEliminar(
      encargado,
    );

    setErrorEliminar('');

    setModalEliminarAbierto(
      true,
    );
  };

  // ============================
  // CERRAR ELIMINAR
  // ============================

  const cerrarModalEliminar =
    () => {
      if (eliminando) {
        return;
      }

      setModalEliminarAbierto(
        false,
      );

      setEncargadoEliminar(
        null,
      );

      setErrorEliminar('');
    };

  // ============================
  // CONFIRMAR ELIMINAR
  // ============================

  const confirmarEliminarEncargado =
    async () => {
      if (!encargadoEliminar) {
        return;
      }

      try {
        setEliminando(true);
        setErrorEliminar('');

        const token =
          localStorage.getItem(
            'token',
          );

        await api.delete(
          `/encargados/${encargadoEliminar.id_encargado}`,
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

        setEncargadoEliminar(
          null,
        );

        await cargarEncargados();
      } catch (error: any) {
        console.error(
          'Error eliminando encargado:',
          error,
        );

        const message =
          error.response?.data
            ?.message;

        if (
          Array.isArray(
            message,
          )
        ) {
          setErrorEliminar(
            message.join(', '),
          );
        } else if (message) {
          setErrorEliminar(
            message,
          );
        } else {
          setErrorEliminar(
            'No se pudo eliminar el encargado.',
          );
        }
      } finally {
        setEliminando(false);
      }
    };

  // ============================
  // NOMBRE
  // ============================

  const obtenerNombreEncargado = (
    encargado: Encargado,
  ) => {
    if (
      encargado.tipo_encargado ===
      'ASOCIACION'
    ) {
      return (
        encargado.nombre_asociacion ||
        encargado.nombre_encargado
      );
    }

    return encargado.nombre_encargado;
  };

  // ============================
  // IDENTIFICACIÓN
  // ============================

  const obtenerIdentificacion = (
    encargado: Encargado,
  ) => {
    if (
      encargado.tipo_encargado ===
      'ASOCIACION'
    ) {
      return (
        encargado.cedula_juridica ||
        '-'
      );
    }

    return (
      encargado.cedula_fisica ||
      '-'
    );
  };

  // ============================
  // LOGOUT
  // ============================

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');

    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-100">

      {/* HEADER */}

      <header className="border-b border-slate-200 bg-white px-8 py-5">

        <div className="mx-auto flex max-w-7xl items-center justify-between">

          <div>

            <h1 className="text-2xl font-bold text-slate-900">
              Gestión de Encargados
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Administración de asociaciones y personas encargadas de los parques.
            </p>

          </div>

          <div className="flex gap-3">

            <button
              type="button"
              onClick={() =>
                navigate(
                  '/dashboard',
                )
              }
              className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300"
            >
              Volver al panel
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Cerrar sesión
            </button>

          </div>

        </div>

      </header>

      {/* CONTENIDO */}

      <main className="mx-auto max-w-7xl px-8 py-10">

        <div className="mb-6 flex items-center justify-between">

          <div>

            <h2 className="text-xl font-semibold text-slate-900">
              Encargados registrados
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Consulte y administre los encargados registrados en el sistema.
            </p>

          </div>

          <button
            type="button"
            onClick={abrirNuevo}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Nuevo encargado
          </button>

        </div>

        {cargando && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            Cargando encargados...
          </div>
        )}

        {!cargando &&
          error && (

          <div className="rounded-xl border border-red-200 bg-red-50 p-6">

            <p className="text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={
                cargarEncargados
              }
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white"
            >
              Intentar nuevamente
            </button>

          </div>

        )}

        {!cargando &&
          !error && (

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-slate-50">

                  <tr>

                    <th className="px-4 py-3 text-left">
                      Tipo
                    </th>

                    <th className="px-4 py-3 text-left">
                      Nombre
                    </th>

                    <th className="px-4 py-3 text-left">
                      Identificación
                    </th>

                    <th className="px-4 py-3 text-left">
                      Correo
                    </th>

                    <th className="px-4 py-3 text-left">
                      Teléfono
                    </th>

                    <th className="px-4 py-3 text-left">
                      Acciones
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {encargados.length ===
                  0 ? (

                    <tr>

                      <td
                        colSpan={6}
                        className="px-4 py-12 text-center text-slate-500"
                      >
                        No hay encargados registrados.
                      </td>

                    </tr>

                  ) : (

                    encargados.map(
                      (encargado) => (

                        <tr
                          key={
                            encargado.id_encargado
                          }
                          className="border-t border-slate-100 hover:bg-slate-50"
                        >

                          <td className="px-4 py-4">

                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">

                              {encargado.tipo_encargado ===
                              'ASOCIACION'
                                ? 'Asociación'
                                : 'Persona'}

                            </span>

                          </td>

                          <td className="px-4 py-4 font-medium">

                            {obtenerNombreEncargado(
                              encargado,
                            )}

                          </td>

                          <td className="px-4 py-4">

                            {obtenerIdentificacion(
                              encargado,
                            )}

                          </td>

                          <td className="px-4 py-4">
                            {
                              encargado.correo_encargado
                            }
                          </td>

                          <td className="px-4 py-4">
                            {
                              encargado.telefono_encargado
                            }
                          </td>

                          <td className="px-4 py-4">

                            <div className="flex gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  abrirEditar(
                                    encargado,
                                  )
                                }
                                className="rounded-md bg-sky-100 px-3 py-1 text-sm font-medium text-sky-700 hover:bg-sky-200"
                              >
                                Editar
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  abrirModalEliminar(
                                    encargado,
                                  )
                                }
                                className="rounded-md bg-red-100 px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-200"
                              >
                                Eliminar
                              </button>

                            </div>

                          </td>

                        </tr>

                      ),
                    )

                  )}

                </tbody>

              </table>

            </div>

          </div>

        )}

      </main>

      {/* MODAL CREAR / EDITAR */}

      {modalAbierto && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">

            {seleccionandoTipo && (

              <div className="p-8">

                <h2 className="text-center text-2xl font-bold text-slate-900">
                  Nuevo encargado
                </h2>

                <p className="mt-2 text-center text-slate-500">
                  Seleccione el tipo de encargado que desea registrar.
                </p>

                <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">

                  <button
                    type="button"
                    onClick={() =>
                      seleccionarTipo(
                        'ASOCIACION',
                      )
                    }
                    className="rounded-xl border border-slate-200 p-8 text-center transition hover:border-blue-500 hover:bg-blue-50"
                  >

                    <div className="text-4xl">
                      🤝
                    </div>

                    <h3 className="mt-3 text-lg font-bold">
                      Asociación
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                      Organización identificada mediante cédula jurídica.
                    </p>

                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      seleccionarTipo(
                        'PERSONA',
                      )
                    }
                    className="rounded-xl border border-slate-200 p-8 text-center transition hover:border-blue-500 hover:bg-blue-50"
                  >

                    <div className="text-4xl">
                      👤
                    </div>

                    <h3 className="mt-3 text-lg font-bold">
                      Persona
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                      Persona física encargada directamente del parque.
                    </p>

                  </button>

                </div>

                <div className="mt-7 flex justify-center">

                  <button
                    type="button"
                    onClick={cerrarModal}
                    className="rounded-lg bg-slate-200 px-5 py-2 font-semibold text-slate-700 hover:bg-slate-300"
                  >
                    Cancelar
                  </button>

                </div>

              </div>

            )}

            {!seleccionandoTipo &&
              tipoEncargado && (

              <>

                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

                  <div>

                    <h2 className="text-xl font-bold text-slate-900">

                      {modoEdicion
                        ? 'Editar encargado'
                        : tipoEncargado ===
                            'ASOCIACION'
                          ? 'Nueva asociación'
                          : 'Nueva persona encargada'}

                    </h2>

                    <p className="mt-1 text-sm text-slate-500">

                      {tipoEncargado ===
                      'ASOCIACION'
                        ? 'Ingrese los datos de la asociación y de su encargado.'
                        : 'Ingrese los datos de la persona encargada.'}

                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={cerrarModal}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-600 hover:bg-slate-200"
                  >
                    ×
                  </button>

                </div>

                <form
                  onSubmit={guardarEncargado}
                  className="p-6"
                >

                  {errorFormulario && (

                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      {errorFormulario}
                    </div>

                  )}

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                    {tipoEncargado ===
                      'ASOCIACION' && (
                      <>

                        <div>

                          <label className="mb-2 block text-sm font-medium">
                            Nombre de la asociación
                          </label>

                          <input
                            type="text"
                            value={
                              nombreAsociacion
                            }
                            onChange={(
                              event,
                            ) =>
                              setNombreAsociacion(
                                event.target.value,
                              )
                            }
                            required
                            placeholder="Ej: Asociación de Desarrollo de Grecia"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2"
                          />

                        </div>

                        <div>

                          <label className="mb-2 block text-sm font-medium">
                            Cédula jurídica
                          </label>

                          <input
                            type="text"
                            inputMode="numeric"
                            value={
                              cedulaJuridica
                            }
                            onChange={(
                              event,
                            ) =>
                              setCedulaJuridica(
                                formatearCedulaJuridica(
                                  event.target.value,
                                ),
                              )
                            }
                            required
                            maxLength={12}
                            placeholder="Ej: 3-002-123456"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2"
                          />

                          <p className="mt-1 text-xs text-slate-500">
                            Digite únicamente números. Los guiones se colocan automáticamente.
                          </p>

                        </div>

                      </>
                    )}

                    <div>

                      <label className="mb-2 block text-sm font-medium">

                        {tipoEncargado ===
                        'PERSONA'
                          ? 'Nombre completo'
                          : 'Nombre del encargado'}

                      </label>

                      <input
                        type="text"
                        value={
                          nombreEncargado
                        }
                        onChange={(
                          event,
                        ) =>
                          setNombreEncargado(
                            event.target.value,
                          )
                        }
                        required
                        placeholder="Ej: Juan Pérez Rodríguez"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      />

                    </div>

                    {tipoEncargado ===
                      'PERSONA' && (

                      <div>

                        <label className="mb-2 block text-sm font-medium">
                          Cédula física
                        </label>

                        <input
                          type="text"
                          inputMode="numeric"
                          value={
                            cedulaFisica
                          }
                          onChange={(
                            event,
                          ) =>
                            setCedulaFisica(
                              formatearCedulaFisica(
                                event.target.value,
                              ),
                            )
                          }
                          required
                          maxLength={11}
                          placeholder="Ej: 1-1234-5678"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        />

                        <p className="mt-1 text-xs text-slate-500">
                          Digite únicamente números. Los guiones se colocan automáticamente.
                        </p>

                      </div>

                    )}

                    <div>

                      <label className="mb-2 block text-sm font-medium">
                        Correo
                      </label>

                      <input
                        type="email"
                        value={
                          correoEncargado
                        }
                        onChange={(
                          event,
                        ) =>
                          setCorreoEncargado(
                            event.target.value,
                          )
                        }
                        required
                        placeholder="Ej: encargado@correo.com"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      />

                    </div>

                    <div>

                      <label className="mb-2 block text-sm font-medium">
                        Teléfono
                      </label>

                      <input
                        type="text"
                        inputMode="numeric"
                        value={
                          telefonoEncargado
                        }
                        onChange={(
                          event,
                        ) =>
                          setTelefonoEncargado(
                            formatearTelefono(
                              event.target.value,
                            ),
                          )
                        }
                        required
                        maxLength={9}
                        placeholder="Ej: 8888-8888"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      />

                    </div>

                  </div>

                  <div className="mt-7 flex justify-end gap-3 border-t border-slate-100 pt-5">

                    <button
                      type="button"
                      onClick={cerrarModal}
                      disabled={guardando}
                      className="rounded-lg bg-slate-200 px-5 py-2 font-semibold text-slate-700 hover:bg-slate-300 disabled:opacity-60"
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      disabled={guardando}
                      className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >

                      {guardando
                        ? 'Guardando...'
                        : modoEdicion
                          ? 'Guardar cambios'
                          : 'Guardar encargado'}

                    </button>

                  </div>

                </form>

              </>

            )}

          </div>

        </div>

      )}

      {/* MODAL ELIMINAR */}

      {modalEliminarAbierto &&
        encargadoEliminar && (

        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

            <div className="border-b border-slate-200 px-6 py-5">

              <h2 className="text-xl font-bold text-slate-900">
                Eliminar encargado
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Esta acción eliminará el registro seleccionado.
              </p>

            </div>

            <div className="p-6">

              <div className="rounded-xl bg-red-50 p-4">

                <p className="text-sm text-red-700">
                  ¿Está seguro de que desea eliminar este encargado?
                </p>

                <p className="mt-3 font-semibold text-slate-900">

                  {obtenerNombreEncargado(
                    encargadoEliminar,
                  )}

                </p>

                <p className="mt-1 text-sm text-slate-500">

                  {encargadoEliminar.tipo_encargado ===
                  'ASOCIACION'
                    ? 'Asociación'
                    : 'Persona'}

                  {' · '}

                  {obtenerIdentificacion(
                    encargadoEliminar,
                  )}

                </p>

              </div>

              {errorEliminar && (

                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {errorEliminar}
                </div>

              )}

              <div className="mt-6 flex justify-end gap-3">

                <button
                  type="button"
                  onClick={
                    cerrarModalEliminar
                  }
                  disabled={eliminando}
                  className="rounded-lg bg-slate-200 px-5 py-2 font-semibold text-slate-700 hover:bg-slate-300 disabled:opacity-60"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={
                    confirmarEliminarEncargado
                  }
                  disabled={eliminando}
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
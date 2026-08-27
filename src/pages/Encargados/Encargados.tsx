import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';

import { useNavigate } from 'react-router-dom';

import { api } from '../../services/api';

interface Encargado {
  id_encargado: number;
  entidad_encargada: string;
  cedula_juridica: string | null;
  representante_legal: string;
  correo_encargado: string;
  telefono_encargado: string;
}

export default function Encargados() {
  const navigate = useNavigate();

  // ============================================
  // DATOS
  // ============================================

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
  // MODAL CREAR / EDITAR
  // ============================================

  const [
    modalAbierto,
    setModalAbierto,
  ] = useState(false);

  const [
    modoEdicion,
    setModoEdicion,
  ] = useState(false);

  const [
    idEncargadoEditando,
    setIdEncargadoEditando,
  ] = useState<number | null>(null);

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    errorFormulario,
    setErrorFormulario,
  ] = useState('');

  // ============================================
  // MODAL VER INFORMACIÓN
  // ============================================

  const [
    modalInformacionAbierto,
    setModalInformacionAbierto,
  ] = useState(false);

  const [
    encargadoVer,
    setEncargadoVer,
  ] = useState<Encargado | null>(
    null,
  );

  // ============================================
  // MODAL ELIMINAR
  // ============================================

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

  // ============================================
  // FORMULARIO
  // ============================================

  const [
    entidadEncargada,
    setEntidadEncargada,
  ] = useState('');

  const [
    cedulaJuridica,
    setCedulaJuridica,
  ] = useState('');

  const [
    representanteLegal,
    setRepresentanteLegal,
  ] = useState('');

  const [
    correoEncargado,
    setCorreoEncargado,
  ] = useState('');

  const [
    telefonoEncargado,
    setTelefonoEncargado,
  ] = useState('');

  // ============================================
  // FORMATEAR CÉDULA JURÍDICA
  // ============================================

  const formatearCedulaJuridica = (
    valor: string,
  ) => {
    const numeros =
      valor.replace(/\D/g, '');

    if (
      numeros.length <= 1
    ) {
      return numeros;
    }

    if (
      numeros.length <= 4
    ) {
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

  // ============================================
  // FORMATEAR TELÉFONO
  // ============================================

  const formatearTelefono = (
    valor: string,
  ) => {
    const numeros =
      valor
        .replace(/\D/g, '')
        .slice(0, 8);

    if (
      numeros.length <= 4
    ) {
      return numeros;
    }

    return `${numeros.slice(
      0,
      4,
    )}-${numeros.slice(4)}`;
  };

  // ============================================
  // CARGAR ENCARGADOS
  // ============================================

  const cargarEncargados =
    async () => {
      try {
        setCargando(true);
        setError('');

        const token =
          localStorage.getItem(
            'token',
          );

        if (!token) {
          navigate('/login');
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

          navigate('/login');

          return;
        }

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

  // ============================================
  // LIMPIAR FORMULARIO
  // ============================================

  const limpiarFormulario =
    () => {
      setEntidadEncargada('');
      setCedulaJuridica('');
      setRepresentanteLegal('');
      setCorreoEncargado('');
      setTelefonoEncargado('');
      setErrorFormulario('');
    };

  // ============================================
  // ABRIR NUEVO ENCARGADO
  // ============================================

  const abrirModalCrear =
    () => {
      limpiarFormulario();

      setModoEdicion(
        false,
      );

      setIdEncargadoEditando(
        null,
      );

      setModalAbierto(
        true,
      );
    };

  // ============================================
  // ABRIR EDITAR
  // ============================================

  const abrirModalEditar = (
    encargado: Encargado,
  ) => {
    setEntidadEncargada(
      encargado.entidad_encargada ??
        '',
    );

    setCedulaJuridica(
      encargado.cedula_juridica ??
        '',
    );

    setRepresentanteLegal(
      encargado.representante_legal ??
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

    setModoEdicion(
      true,
    );

    setIdEncargadoEditando(
      encargado.id_encargado,
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

      setModoEdicion(
        false,
      );

      setIdEncargadoEditando(
        null,
      );

      limpiarFormulario();
    };

  // ============================================
  // GUARDAR ENCARGADO
  // ============================================

  const guardarEncargado =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      setErrorFormulario(
        '',
      );

      if (
        !entidadEncargada.trim()
      ) {
        setErrorFormulario(
          'Debe ingresar la entidad encargada.',
        );

        return;
      }

      if (
        !representanteLegal.trim()
      ) {
        setErrorFormulario(
          'Debe ingresar el representante legal.',
        );

        return;
      }

      if (
        !correoEncargado.trim()
      ) {
        setErrorFormulario(
          'Debe ingresar el correo electrónico.',
        );

        return;
      }

      if (
        !telefonoEncargado.trim()
      ) {
        setErrorFormulario(
          'Debe ingresar el número de teléfono.',
        );

        return;
      }

      try {
        setGuardando(true);

        const token =
          localStorage.getItem(
            'token',
          );

        if (!token) {
          navigate('/login');
          return;
        }

        const datosEncargado = {
          entidad_encargada:
            entidadEncargada.trim(),

          cedula_juridica:
            cedulaJuridica.trim() ||
            null,

          representante_legal:
            representanteLegal.trim(),

          correo_encargado:
            correoEncargado
              .trim()
              .toLowerCase(),

          telefono_encargado:
            telefonoEncargado.trim(),
        };

        // ========================================
        // EDITAR
        // ========================================

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
        }

        // ========================================
        // CREAR
        // ========================================

        else {
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

        setModalAbierto(
          false,
        );

        setModoEdicion(
          false,
        );

        setIdEncargadoEditando(
          null,
        );

        limpiarFormulario();

        await cargarEncargados();
      } catch (error: any) {
        console.error(
          'Error guardando encargado:',
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
              ? 'No se pudo actualizar el encargado.'
              : 'No se pudo registrar el encargado.',
          );
        }
      } finally {
        setGuardando(
          false,
        );
      }
    };

  // ============================================
  // VER INFORMACIÓN
  // ============================================

  const abrirModalInformacion = (
    encargado: Encargado,
  ) => {
    setEncargadoVer(
      encargado,
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

      setEncargadoVer(
        null,
      );
    };

  // ============================================
  // ABRIR ELIMINAR
  // ============================================

  const abrirModalEliminar = (
    encargado: Encargado,
  ) => {
    setEncargadoEliminar(
      encargado,
    );

    setErrorEliminar(
      '',
    );

    setModalEliminarAbierto(
      true,
    );
  };

  // ============================================
  // CERRAR ELIMINAR
  // ============================================

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

      setErrorEliminar(
        '',
      );
    };

  // ============================================
  // CONFIRMAR ELIMINAR
  // ============================================

  const confirmarEliminar =
    async () => {
      if (
        !encargadoEliminar
      ) {
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

        if (!token) {
          navigate('/login');
          return;
        }

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
            'No se pudo eliminar el encargado.',
          );
        }
      } finally {
        setEliminando(
          false,
        );
      }
    };

  // ============================================
  // CERRAR SESIÓN
  // ============================================

  const handleLogout =
    () => {
      localStorage.removeItem(
        'token',
      );

      localStorage.removeItem(
        'usuario',
      );

      navigate(
        '/login',
      );
    };

  return (
    <div className="min-h-screen bg-slate-100">

      {/* ====================================== */}
      {/* HEADER */}
      {/* ====================================== */}

      <header className="border-b border-slate-200 bg-white px-8 py-5">

        <div className="mx-auto flex max-w-7xl items-center justify-between">

          <div>

            <h1 className="text-2xl font-bold text-slate-900">
              Gestión de Encargados
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Administración de las entidades encargadas registradas en el sistema.
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
              onClick={
                handleLogout
              }
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Cerrar sesión
            </button>

          </div>

        </div>

      </header>

      {/* ====================================== */}
      {/* CONTENIDO */}
      {/* ====================================== */}

      <main className="mx-auto max-w-7xl px-8 py-10">

        <div className="mb-6 flex items-center justify-between">

          <div>

            <h2 className="text-xl font-semibold text-slate-900">
              Encargados registrados
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Consulte y administre las entidades responsables de los parques.
            </p>

          </div>

          <button
            type="button"
            onClick={
              abrirModalCrear
            }
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Nuevo encargado
          </button>

        </div>

        {/* CARGANDO */}

        {cargando && (

          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            Cargando encargados...
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
                cargarEncargados
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

        {!cargando &&
          !error && (

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-slate-50">

                  <tr>

                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                      Entidad encargada
                    </th>

                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                      Cédula jurídica
                    </th>

                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                      Representante legal
                    </th>

                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                      Correo
                    </th>

                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                      Teléfono
                    </th>

                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
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
                      (
                        encargado,
                      ) => (

                        <tr
                          key={
                            encargado.id_encargado
                          }
                          className="border-t border-slate-100 hover:bg-slate-50"
                        >

                          <td className="px-4 py-4 font-medium text-slate-900">
                            {
                              encargado.entidad_encargada
                            }
                          </td>

                          <td className="px-4 py-4 text-slate-700">
                            {
                              encargado.cedula_juridica ||
                              '—'
                            }
                          </td>

                          <td className="px-4 py-4 text-slate-700">
                            {
                              encargado.representante_legal
                            }
                          </td>

                          <td className="px-4 py-4 text-slate-700">
                            {
                              encargado.correo_encargado
                            }
                          </td>

                          <td className="px-4 py-4 text-slate-700">
                            {
                              encargado.telefono_encargado
                            }
                          </td>

                          <td className="px-4 py-4">

                            <div className="flex gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  abrirModalEditar(
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
                                  abrirModalInformacion(
                                    encargado,
                                  )
                                }
                                className="rounded-md bg-violet-100 px-3 py-1 text-sm font-medium text-violet-700 hover:bg-violet-200"
                              >
                                Ver información
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

      {/* ====================================== */}
      {/* MODAL CREAR / EDITAR */}
      {/* ====================================== */}

      {modalAbierto && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">

            {/* HEADER MODAL */}

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>

                <h2 className="text-xl font-bold text-slate-900">

                  {modoEdicion
                    ? 'Editar encargado'
                    : 'Nuevo encargado'}

                </h2>

                <p className="mt-1 text-sm text-slate-500">

                  {modoEdicion
                    ? 'Modifique los datos de la entidad encargada y su representante legal.'
                    : 'Ingrese los datos de la entidad encargada y su representante legal.'}

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

            {/* FORMULARIO */}

            <form
              onSubmit={
                guardarEncargado
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

                {/* ENTIDAD ENCARGADA */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Entidad encargada
                  </label>

                  <input
                    type="text"
                    value={
                      entidadEncargada
                    }
                    onChange={(
                      event,
                    ) =>
                      setEntidadEncargada(
                        event.target.value,
                      )
                    }
                    required
                    placeholder="Ej: Asociación de Desarrollo de Grecia"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />

                </div>

                {/* CÉDULA JURÍDICA */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Cédula jurídica
                  </label>

                  <input
                    type="text"
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
                    placeholder="Ej: 3-002-123456"
                    maxLength={12}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />

                  <p className="mt-1 text-xs text-slate-500">
                    Digite únicamente números. Los guiones se colocan automáticamente.
                  </p>

                </div>

                {/* REPRESENTANTE LEGAL */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Representante legal
                  </label>

                  <input
                    type="text"
                    value={
                      representanteLegal
                    }
                    onChange={(
                      event,
                    ) =>
                      setRepresentanteLegal(
                        event.target.value,
                      )
                    }
                    required
                    placeholder="Ej: Juan Pérez Rodríguez"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />

                </div>

                {/* CORREO */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700">
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

                {/* TELÉFONO */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Teléfono
                  </label>

                  <input
                    type="text"
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
                    placeholder="Ej: 8888-8888"
                    maxLength={9}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />

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

          </div>

        </div>

      )}

      {/* ====================================== */}
      {/* MODAL VER INFORMACIÓN */}
      {/* ====================================== */}

      {modalInformacionAbierto &&
        encargadoVer && (

        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  Información del encargado
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Información completa de la entidad encargada y su representante legal.
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

            <div className="p-6">

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                <div className="rounded-lg border border-slate-200 p-4">

                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Entidad encargada
                  </p>

                  <p className="mt-1 font-medium text-slate-900">
                    {
                      encargadoVer.entidad_encargada
                    }
                  </p>

                </div>

                <div className="rounded-lg border border-slate-200 p-4">

                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Cédula jurídica
                  </p>

                  <p className="mt-1 font-medium text-slate-900">
                    {
                      encargadoVer.cedula_juridica ||
                      'No registrada'
                    }
                  </p>

                </div>

                <div className="rounded-lg border border-slate-200 p-4">

                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Representante legal
                  </p>

                  <p className="mt-1 font-medium text-slate-900">
                    {
                      encargadoVer.representante_legal
                    }
                  </p>

                </div>

                <div className="rounded-lg border border-slate-200 p-4">

                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Correo
                  </p>

                  <p className="mt-1 break-all font-medium text-slate-900">
                    {
                      encargadoVer.correo_encargado
                    }
                  </p>

                </div>

                <div className="rounded-lg border border-slate-200 p-4">

                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Teléfono
                  </p>

                  <p className="mt-1 font-medium text-slate-900">
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
      {/* MODAL ELIMINAR */}
      {/* ====================================== */}

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
                  {
                    encargadoEliminar.entidad_encargada
                  }
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Representante legal:{' '}
                  {
                    encargadoEliminar.representante_legal
                  }
                </p>

              </div>

              {errorEliminar && (

                <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-4">

                  <p className="text-sm font-semibold text-red-800">
                    No se puede eliminar el encargado
                  </p>

                  <p className="mt-1 text-sm text-red-700">
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
                    confirmarEliminar
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
import {
  useState,
  type FormEvent,
} from 'react';

import {
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import { api } from '../services/api';

export default function ActivarCuenta() {
  const navigate = useNavigate();

  const [searchParams] =
    useSearchParams();

  const token =
    searchParams.get('token');

  const [
    nombreUsuario,
    setNombreUsuario,
  ] = useState('');

  const [
    password,
    setPassword,
  ] = useState('');

  const [
    confirmarPassword,
    setConfirmarPassword,
  ] = useState('');

  const [
    mostrarPassword,
    setMostrarPassword,
  ] = useState(false);

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  const [
    cuentaActivada,
    setCuentaActivada,
  ] = useState(false);

  // ============================
  // ACTIVAR CUENTA
  // ============================

  const activarCuenta =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      setError('');

      if (!token) {
        setError(
          'El enlace de activación no es válido.',
        );

        return;
      }

      if (
        nombreUsuario.trim() ===
        ''
      ) {
        setError(
          'Debe ingresar su nombre.',
        );

        return;
      }

      if (
        password.length < 8
      ) {
        setError(
          'La contraseña debe tener al menos 8 caracteres.',
        );

        return;
      }

      if (
        password !==
        confirmarPassword
      ) {
        setError(
          'Las contraseñas no coinciden.',
        );

        return;
      }

      try {
        setGuardando(true);

        await api.post(
          '/usuarios/activar',
          {
            token,

            nombre_usuario:
              nombreUsuario.trim(),

            password,
          },
        );

        setCuentaActivada(
          true,
        );
      } catch (error: any) {
        console.error(
          'Error activando cuenta:',
          error,
        );

        const message =
          error.response?.data
            ?.message;

        if (
          Array.isArray(message)
        ) {
          setError(
            message.join(', '),
          );
        } else if (message) {
          setError(message);
        } else {
          setError(
            'No se pudo activar la cuenta.',
          );
        }
      } finally {
        setGuardando(false);
      }
    };

  // ============================
  // TOKEN NO EXISTE
  // ============================

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">

        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl text-red-600">
            !
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Enlace inválido
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            El enlace de activación no contiene
            un token válido.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate('/login')
            }
            className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Ir a iniciar sesión
          </button>

        </div>

      </div>
    );
  }

  // ============================
  // CUENTA ACTIVADA
  // ============================

  if (cuentaActivada) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">

        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl font-bold text-green-600">
            ✓
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Cuenta activada
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            Su contraseña fue creada correctamente.
            Ya puede ingresar al sistema.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate('/login')
            }
            className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Iniciar sesión
          </button>

        </div>

      </div>
    );
  }

  // ============================
  // FORMULARIO
  // ============================

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">

      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">

        {/* HEADER */}

        <div className="border-b border-slate-200 px-8 py-6">

          <h1 className="text-2xl font-bold text-slate-900">
            Activar cuenta
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Complete la información para finalizar
            la creación de su cuenta.
          </p>

        </div>

        {/* FORMULARIO */}

        <form
          onSubmit={activarCuenta}
          className="p-8"
        >

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* NOMBRE */}

          <div className="mb-5">

            <label className="mb-2 block text-sm font-medium text-slate-700">
              Nombre
            </label>

            <input
              type="text"
              value={nombreUsuario}
              onChange={(event) =>
                setNombreUsuario(
                  event.target.value,
                )
              }
              required
              autoFocus
              placeholder="Ingrese su nombre"
              className="w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

          </div>

          {/* CONTRASEÑA */}

          <div className="mb-5">

            <label className="mb-2 block text-sm font-medium text-slate-700">
              Nueva contraseña
            </label>

            <input
              type={
                mostrarPassword
                  ? 'text'
                  : 'password'
              }
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value,
                )
              }
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              className="w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

          </div>

          {/* CONFIRMAR CONTRASEÑA */}

          <div className="mb-4">

            <label className="mb-2 block text-sm font-medium text-slate-700">
              Confirmar contraseña
            </label>

            <input
              type={
                mostrarPassword
                  ? 'text'
                  : 'password'
              }
              value={
                confirmarPassword
              }
              onChange={(event) =>
                setConfirmarPassword(
                  event.target.value,
                )
              }
              required
              placeholder="Repita su contraseña"
              className="w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

          </div>

          {/* MOSTRAR CONTRASEÑA */}

          <label className="mb-6 flex cursor-pointer items-center gap-2 text-sm text-slate-600">

            <input
              type="checkbox"
              checked={
                mostrarPassword
              }
              onChange={(event) =>
                setMostrarPassword(
                  event.target.checked,
                )
              }
            />

            Mostrar contraseñas

          </label>

          {/* INFORMACIÓN */}

          <div className="mb-6 rounded-lg bg-blue-50 p-4">

            <p className="text-sm text-blue-700">
              Su contraseña será almacenada de forma
              segura y no será visible para los
              administradores del sistema.
            </p>

          </div>

          {/* BOTÓN */}

          <button
            type="submit"
            disabled={guardando}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {guardando
              ? 'Activando cuenta...'
              : 'Crear contraseña y activar cuenta'}
          </button>

        </form>

      </div>

    </div>
  );
}
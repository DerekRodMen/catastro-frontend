import {
  useState,
  type FormEvent,
} from 'react';

import {
  Lock,
  Mail,
  LogIn,
} from 'lucide-react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  api,
} from '../services/api';

export default function Login() {
  const navigate =
    useNavigate();

  const [
    correo,
    setCorreo,
  ] = useState('');

  const [
    password,
    setPassword,
  ] = useState('');

  const [
    error,
    setError,
  ] = useState('');

  const [
    cargando,
    setCargando,
  ] = useState(false);

  // ============================
  // INICIAR SESIÓN
  // ============================

  const handleSubmit =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      setError('');
      setCargando(true);

      try {
        const response =
          await api.post(
            '/auth/login',
            {
              correo:
                correo
                  .trim()
                  .toLowerCase(),

              password,
            },
          );

        const {
          access_token,
          usuario,
        } = response.data;

        // Guardar token
        localStorage.setItem(
          'token',
          access_token,
        );

        // Guardar información
        // del usuario
        localStorage.setItem(
          'usuario',
          JSON.stringify(
            usuario,
          ),
        );

        // Ir al dashboard
        navigate(
          '/dashboard',
        );
      } catch (error: any) {
        if (
          error.response?.data
            ?.message
        ) {
          const message =
            error.response.data
              .message;

          setError(
            Array.isArray(
              message,
            )
              ? message.join(', ')
              : message,
          );
        } else {
          setError(
            'No se pudo conectar con el servidor.',
          );
        }
      } finally {
        setCargando(false);
      }
    };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">

      <div className="w-full max-w-md">

        {/* ENCABEZADO */}

        <div className="mb-8 text-center">

          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <Lock size={30} />
          </div>

          <h1 className="text-3xl font-bold text-slate-900">
            Sistema de Catastro
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Panel Administrativo
          </p>

        </div>

        {/* TARJETA */}

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">

          <div className="mb-6">

            <h2 className="text-xl font-semibold text-slate-900">
              Iniciar sesión
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Ingrese sus credenciales para continuar.
            </p>

          </div>

          {/* ERROR */}

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form
            onSubmit={
              handleSubmit
            }
            className="space-y-5"
          >

            {/* CORREO */}

            <div>

              <label className="mb-2 block text-sm font-medium text-slate-700">
                Correo electrónico
              </label>

              <div className="relative">

                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="email"
                  value={correo}
                  onChange={(
                    event,
                  ) =>
                    setCorreo(
                      event.target.value,
                    )
                  }
                  placeholder="correo@ejemplo.com"
                  required
                  disabled={
                    cargando
                  }
                  autoComplete="email"
                  className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                />

              </div>

            </div>

            {/* CONTRASEÑA */}

            <div>

              <div className="mb-2 flex items-center justify-between">

                <label className="block text-sm font-medium text-slate-700">
                  Contraseña
                </label>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      '/olvide-password',
                    )
                  }
                  disabled={
                    cargando
                  }
                  className="text-sm font-medium text-blue-600 transition hover:text-blue-700 hover:underline disabled:opacity-60"
                >
                  ¿Olvidó su contraseña?
                </button>

              </div>

              <div className="relative">

                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="password"
                  value={password}
                  onChange={(
                    event,
                  ) =>
                    setPassword(
                      event.target.value,
                    )
                  }
                  placeholder="••••••••"
                  required
                  disabled={
                    cargando
                  }
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                />

              </div>

            </div>

            {/* BOTÓN LOGIN */}

            <button
              type="submit"
              disabled={
                cargando
              }
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >

              <LogIn size={18} />

              {cargando
                ? 'Iniciando sesión...'
                : 'Iniciar sesión'}

            </button>

          </form>

        </div>

      </div>

    </div>
  );
}
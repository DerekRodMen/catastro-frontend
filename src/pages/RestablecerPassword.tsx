import {
  useState,
  type FormEvent,
} from 'react';

import {
  Lock,
  ArrowLeft,
} from 'lucide-react';

import {
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import {
  api,
} from '../services/api';

export default function RestablecerPassword() {
  const navigate =
    useNavigate();

  const [
    searchParams,
  ] = useSearchParams();

  const token =
    searchParams.get('token');

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
    cargando,
    setCargando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  const [
    completado,
    setCompletado,
  ] = useState(false);

  // ============================
  // RESTABLECER CONTRASEÑA
  // ============================

  const handleSubmit =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      setError('');

      if (!token) {
        setError(
          'El enlace de recuperación no es válido.',
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
        setCargando(true);

        await api.post(
          '/usuarios/restablecer-password',
          {
            token,
            password,
          },
        );

        setCompletado(
          true,
        );
      } catch (error: any) {
        console.error(
          'Error restableciendo contraseña:',
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
          setError(
            message,
          );
        } else {
          setError(
            'No se pudo restablecer la contraseña.',
          );
        }
      } finally {
        setCargando(false);
      }
    };

  // ============================
  // TOKEN NO EXISTE
  // ============================

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">

        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl text-red-600">
            !
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Enlace inválido
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            El enlace de recuperación no contiene
            un token válido.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate('/login')
            }
            className="mt-6 w-full rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Volver al login
          </button>

        </div>

      </div>
    );
  }

  // ============================
  // COMPLETADO
  // ============================

  if (completado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">

        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl font-bold text-green-700">
            ✓
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Contraseña actualizada
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            Su contraseña fue restablecida correctamente.
            Ya puede iniciar sesión con la nueva contraseña.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate('/login')
            }
            className="mt-6 w-full rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Iniciar sesión
          </button>

        </div>

      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">

      <div className="w-full max-w-md">

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">

          <button
            type="button"
            onClick={() =>
              navigate('/login')
            }
            className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft size={17} />
            Volver
          </button>

          <div className="mb-6">

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <Lock size={26} />
            </div>

            <h1 className="text-center text-2xl font-bold text-slate-900">
              Restablecer contraseña
            </h1>

            <p className="mt-2 text-center text-sm text-slate-500">
              Ingrese una nueva contraseña para su cuenta.
            </p>

          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            <div>

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
                className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              />

            </div>

            <div>

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
                placeholder="Repita la contraseña"
                className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              />

            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">

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

            <button
              type="submit"
              disabled={cargando}
              className="w-full rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cargando
                ? 'Actualizando...'
                : 'Restablecer contraseña'}
            </button>

          </form>

        </div>

      </div>

    </div>
  );
}
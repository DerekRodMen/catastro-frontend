import {
  useState,
  type FormEvent,
} from 'react';
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Lock,
  TriangleAlert,
} from 'lucide-react';
import {
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import {
  api,
} from '../services/api';
import AuthLayout
  from '../components/AuthLayout';
// Componente principal para restablecer la contraseña mediante un token de recuperación.
export default function RestablecerPassword() {
  // Permite redirigir al usuario entre las rutas de autenticación.
  const navigate =
    useNavigate();
  // Estados utilizados por el formulario de restablecimiento.
  const [
    searchParams,
  ] =
    useSearchParams();
  // Obtiene el token de recuperación desde los parámetros de la URL.
  const token =
    searchParams.get(
      'token',
    );
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
  // Valida y envía la nueva contraseña al backend.
  const handleSubmit =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();
      setError('');
      // Verifica que exista un token válido antes de continuar.
      if (!token) {
        setError(
          'El enlace de recuperación no es válido.',
        );
        return;
      }
      if (
        password.length <
        8
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
        // Envía la nueva contraseña al endpoint de recuperación.
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
          error.response
            ?.data
            ?.message;
        if (
          Array.isArray(
            message,
          )
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
  if (!token) {
    return (
      <AuthLayout>
        <section className="auth-card">
          <div className="auth-card__body text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
              <TriangleAlert
                size={29}
              />
            </div>
            <h2 className="mt-5 text-2xl font-bold text-[#16313E]">
              Enlace inválido
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              El enlace de recuperación no contiene un token válido.
            </p>
            <button
              type="button"
              onClick={() =>
                navigate(
                  '/login',
                )
              }
              className="mt-6 w-full rounded-lg bg-[#315F73] py-3 text-sm font-semibold text-white transition hover:bg-[#244C5F]"
            >
              Volver al inicio de sesión
            </button>
          </div>
        </section>
      </AuthLayout>
    );
  }
  // Muestra la confirmación cuando la contraseña se actualiza correctamente.
  if (completado) {
    return (
      <AuthLayout>
        <section className="auth-card">
          <div className="auth-card__body text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
              <Check
                size={30}
                strokeWidth={3}
              />
            </div>
            <h2 className="mt-5 text-2xl font-bold text-[#16313E]">
              Contraseña actualizada
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Su contraseña fue restablecida correctamente.
              Ya puede iniciar sesión con la nueva contraseña.
            </p>
            <button
              type="button"
              onClick={() =>
                navigate(
                  '/login',
                )
              }
              className="mt-6 w-full rounded-lg bg-[#315F73] py-3 text-sm font-semibold text-white transition hover:bg-[#244C5F]"
            >
              Iniciar sesión
            </button>
          </div>
        </section>
      </AuthLayout>
    );
  }
  return (
    <AuthLayout>
      <section className="auth-card">
        <div className="auth-card__body">
          <button
            type="button"
            onClick={() =>
              navigate(
                '/login',
              )
            }
            className="mb-6 flex items-center gap-2 text-sm font-semibold text-[#315F73] transition hover:text-[#244C5F]"
          >
            <ArrowLeft size={17} />
            Volver
          </button>
          <div className="auth-card__icon">
            <Lock size={22} />
          </div>
          <div className="auth-card__header">
            <h2>
              Restablecer contraseña
            </h2>
            <p>
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
              <label className="mb-2 block text-sm font-semibold text-[#16313E]">
                Nueva contraseña
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
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
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-12 text-sm outline-none transition focus:border-[#315F73] focus:ring-2 focus:ring-[#E8F0F4]"
                />
                <button
                  type="button"
                  onClick={() =>
                    setMostrarPassword(
                      !mostrarPassword,
                    )
                  }
                  aria-label={
                    mostrarPassword
                      ? 'Ocultar contraseñas'
                      : 'Mostrar contraseñas'
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-[#315F73]"
                >
                  {mostrarPassword
                    ? (
                      <EyeOff size={19} />
                    )
                    : (
                      <Eye size={19} />
                    )}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#16313E]">
                Confirmar contraseña
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
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
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Repita la contraseña"
                  className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#315F73] focus:ring-2 focus:ring-[#E8F0F4]"
                />
              </div>
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
                className="accent-[#315F73]"
              />
              Mostrar contraseñas
            </label>
            <button
              type="submit"
              disabled={cargando}
              className="w-full rounded-lg bg-[#315F73] py-3 text-sm font-semibold text-white transition hover:bg-[#244C5F] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cargando
                ? 'Actualizando...'
                : 'Restablecer contraseña'}
            </button>
          </form>
        </div>
      </section>
    </AuthLayout>
  );
}

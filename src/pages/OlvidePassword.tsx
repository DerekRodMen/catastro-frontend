import {
  useState,
  type FormEvent,
} from 'react';
import {
  ArrowLeft,
  Check,
  Mail,
} from 'lucide-react';
import {
  useNavigate,
} from 'react-router-dom';
import {
  api,
} from '../services/api';
import AuthLayout
  from '../components/AuthLayout';
// Componente principal para solicitar la recuperación de contraseña.
export default function OlvidePassword() {
  // Permite redirigir al usuario entre las rutas de autenticación.
  const navigate =
    useNavigate();
  // Estados utilizados por el formulario de recuperación.
  const [
    correo,
    setCorreo,
  ] = useState('');
  const [
    cargando,
    setCargando,
  ] = useState(false);
  const [
    error,
    setError,
  ] = useState('');
  const [
    enviado,
    setEnviado,
  ] = useState(false);
  // Envía la solicitud de recuperación al backend.
  const handleSubmit =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();
      setError('');
      // Verifica que el usuario haya ingresado un correo electrónico.
      if (!correo.trim()) {
        setError(
          'Debe ingresar su correo electrónico.',
        );
        return;
      }
      try {
        setCargando(true);
        // Solicita al backend el envío del enlace de recuperación.
        await api.post(
          '/usuarios/solicitar-recuperacion',
          {
            correo:
              correo
                .trim()
                .toLowerCase(),
          },
        );
        setEnviado(true);
      } catch (error: any) {
        console.error(
          'Error solicitando recuperación:',
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
            'No se pudo procesar la solicitud.',
          );
        }
      } finally {
        setCargando(false);
      }
    };
  // Muestra la confirmación después de enviar la solicitud correctamente.
  if (enviado) {
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
              Revise su correo
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Si existe una cuenta asociada a ese correo,
              recibirá un enlace para restablecer su contraseña.
            </p>
            <button
              type="button"
              onClick={() =>
                navigate(
                  '/login',
                )
              }
              className="mt-7 w-full rounded-lg bg-[#315F73] py-3 text-sm font-semibold text-white transition hover:bg-[#244C5F]"
            >
              Volver al inicio de sesión
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
            <Mail size={21} />
          </div>
          <div className="auth-card__header">
            <h2>
              Recuperar contraseña
            </h2>
            <p>
              Ingrese su correo electrónico y le enviaremos
              un enlace para crear una nueva contraseña.
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
                  onChange={(event) =>
                    setCorreo(
                      event.target.value,
                    )
                  }
                  required
                  disabled={cargando}
                  autoFocus
                  autoComplete="email"
                  placeholder="correo@ejemplo.com"
                  className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#315F73] focus:ring-2 focus:ring-[#E8F0F4] disabled:bg-slate-100"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={cargando}
              className="w-full rounded-lg bg-[#315F73] py-3 text-sm font-semibold text-white transition hover:bg-[#244C5F] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cargando
                ? 'Enviando...'
                : 'Enviar enlace de recuperación'}
            </button>
          </form>
        </div>
      </section>
    </AuthLayout>
  );
}

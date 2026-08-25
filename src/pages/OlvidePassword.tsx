import {
  useState,
  type FormEvent,
} from 'react';

import {
  Mail,
  ArrowLeft,
} from 'lucide-react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  api,
} from '../services/api';

export default function OlvidePassword() {
  const navigate =
    useNavigate();

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

  const handleSubmit =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      setError('');

      if (!correo.trim()) {
        setError(
          'Debe ingresar su correo electrónico.',
        );

        return;
      }

      try {
        setCargando(true);

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
            'No se pudo procesar la solicitud.',
          );
        }
      } finally {
        setCargando(false);
      }
    };

  if (enviado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">

        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl font-bold text-green-700">
            ✓
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Revise su correo
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Si existe una cuenta asociada a ese correo,
            recibirá un enlace para restablecer su contraseña.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate('/login')
            }
            className="mt-7 w-full rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Volver al inicio de sesión
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
            className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft size={17} />
            Volver
          </button>

          <div className="mb-6">

            <h1 className="text-2xl font-bold text-slate-900">
              Recuperar contraseña
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
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
                  onChange={(event) =>
                    setCorreo(
                      event.target.value,
                    )
                  }
                  required
                  disabled={cargando}
                  autoFocus
                  placeholder="correo@ejemplo.com"
                  className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                />

              </div>

            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cargando
                ? 'Enviando...'
                : 'Enviar enlace de recuperación'}
            </button>

          </form>

        </div>

      </div>

    </div>
  );
}
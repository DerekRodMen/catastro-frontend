import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, Lock, Mail, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import logoMunicipalidad from '../assets/logo-municipalidad-grecia.webp';
export default function Login() {
  const navigate = useNavigate();

  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError('');
    setCargando(true);

    try {
      const response = await api.post('/auth/login', {
        correo: correo.trim().toLowerCase(),
        password,
      });

      const { access_token, usuario } = response.data;

      localStorage.setItem(
        'token',
        access_token,
      );

      localStorage.setItem(
        'usuario',
        JSON.stringify(usuario),
      );

      navigate('/dashboard', {
        replace: true,
      });
    } catch (error: any) {
      const message =
        error.response?.data?.message;

      if (message) {
        setError(
          Array.isArray(message)
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F4F7F8] px-4 py-10">

      {/* FRANJA SUPERIOR INSTITUCIONAL */}

      <div className="absolute inset-x-0 top-0 grid h-2 grid-cols-[2.2fr_1fr_.7fr]">
        <span className="bg-[#315F73]" />
        <span className="bg-[#18843B]" />
        <span className="bg-[#D4112E]" />
      </div>

      {/* DECORACIÓN DE FONDO */}

      <div className="absolute -left-28 -top-28 h-72 w-72 rounded-full bg-[#315F73]/10" />

      <div className="absolute -bottom-28 -right-20 h-72 w-72 rounded-full bg-[#18843B]/10" />

      {/* CONTENIDO */}

      <div className="relative w-full max-w-md">

        {/* LOGO Y TÍTULO */}

        <div className="mb-7 text-center">

          <img
            src={logoMunicipalidad}
            alt="Municipalidad de Grecia - Gobierno Local"
            className="mx-auto w-64 max-w-full object-contain"
          />

          <div className="mt-5">

            <h1 className="text-2xl font-extrabold text-[#16313E]">
              Sistema de Catastro
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Panel Administrativo
            </p>

          </div>

        </div>

        {/* TARJETA LOGIN */}

        <div className="rounded-2xl border border-[#D9E2E7] bg-white p-8 shadow-[0_18px_45px_rgba(22,49,62,0.10)]">

          <div className="mb-6">

            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F0F4] text-[#315F73]">
              <Lock size={22} />
            </div>

            <h2 className="text-xl font-bold text-[#16313E]">
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

          {/* FORMULARIO */}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* CORREO */}

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
                  onChange={(e) =>
                    setCorreo(e.target.value)
                  }
                  placeholder="correo@ejemplo.com"
                  required
                  disabled={cargando}
                  autoComplete="email"
                  className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#315F73] focus:ring-2 focus:ring-[#E8F0F4] disabled:bg-slate-100"
                />

              </div>

            </div>

            {/* CONTRASEÑA */}

            <div>

              <div className="mb-2 flex items-center justify-between gap-3">

                <label className="block text-sm font-semibold text-[#16313E]">
                  Contraseña
                </label>

                <button
                  type="button"
                  onClick={() =>
                    navigate('/olvide-password')
                  }
                  disabled={cargando}
                  className="text-sm font-semibold text-[#315F73] hover:text-[#244C5F] hover:underline disabled:opacity-60"
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
                  type={
                    mostrarPassword
                      ? 'text'
                      : 'password'
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="••••••••"
                  required
                  disabled={cargando}
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-12 text-sm outline-none transition focus:border-[#315F73] focus:ring-2 focus:ring-[#E8F0F4] disabled:bg-slate-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setMostrarPassword(
                      !mostrarPassword,
                    )
                  }
                  disabled={cargando}
                  aria-label={
                    mostrarPassword
                      ? 'Ocultar contraseña'
                      : 'Mostrar contraseña'
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-[#315F73]"
                >
                  {mostrarPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>

              </div>

            </div>

            {/* BOTÓN */}

            <button
              type="submit"
              disabled={cargando}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#315F73] py-3 text-sm font-bold text-white transition hover:bg-[#244C5F] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogIn size={18} />

              {cargando
                ? 'Iniciando sesión...'
                : 'Iniciar sesión'}
            </button>

          </form>

        </div>

        {/* PIE */}

        <p className="mt-5 text-center text-xs text-slate-400">
          Municipalidad de Grecia · Gobierno Local
        </p>

      </div>

    </div>
  );
}
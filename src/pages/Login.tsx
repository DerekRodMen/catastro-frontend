import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, Lock, Mail, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import './Login.css';



export default function Login() {
  const navigate = useNavigate();

  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError('');
    setCargando(true);

    try {
      const response = await api.post('/auth/login', {
        correo: correo.trim().toLowerCase(),
        password,
      });

      const { access_token, usuario } = response.data;

      localStorage.setItem('token', access_token);
      localStorage.setItem('usuario', JSON.stringify(usuario));

      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      const message = error.response?.data?.message;

      if (message) {
        setError(Array.isArray(message) ? message.join(', ') : message);
      } else {
        setError('No se pudo conectar con el servidor.');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-background" />
      <div className="login-overlay" />

      <main className="login-container">
        {/* LOGO Y TÍTULO */}
        <section className="login-brand">
          <h1>Sistema de Catastro</h1>
          <p>Panel Administrativo</p>
        </section>

        {/* TARJETA LOGIN */}
        <section className="login-card">
          <div className="login-icon">
            <Lock size={20} />
          </div>

          <div className="login-card-header">
            <h2>Iniciar sesión</h2>
            <p>Ingrese sus credenciales para continuar.</p>
          </div>

          {/* MENSAJE DE ERROR */}
          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* FORMULARIO */}
          <form onSubmit={handleSubmit} className="space-y-5">
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
                  onChange={(e) => setCorreo(e.target.value)}
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
                  onClick={() => navigate('/olvide-password')}
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
                  type={mostrarPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={cargando}
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-12 text-sm outline-none transition focus:border-[#315F73] focus:ring-2 focus:ring-[#E8F0F4] disabled:bg-slate-100"
                />

                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  disabled={cargando}
                  aria-label={
                    mostrarPassword
                      ? 'Ocultar contraseña'
                      : 'Mostrar contraseña'
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-[#315F73]"
                >
                  {mostrarPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            {/* BOTÓN SUBMIT */}
            <button
              type="submit"
              disabled={cargando}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#315F73] py-3 text-sm font-bold text-white transition hover:bg-[#244C5F] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogIn size={18} />
              {cargando ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>
        </section>

        {/* PIE */}
        <p className="login-footer">
          Municipalidad de Grecia · Gobierno Local
        </p>
      </main>
    </div>
  );
}
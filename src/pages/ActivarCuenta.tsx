import {
  useState,
  type FormEvent,
} from 'react';
import {
  Check,
  Eye,
  EyeOff,
  Lock,
  TriangleAlert,
  User,
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
// Componente principal para activar una cuenta mediante el enlace recibido.
export default function ActivarCuenta() {
  const navigate =
    useNavigate();
  const [
    searchParams,
  ] =
    useSearchParams();
  const token =
    searchParams.get(
      'token',
    );
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
  // ============================================
  // VALIDACIONES DE CONTRASEÑA
  // ============================================
  // Valida que la contraseña tenga al menos ocho caracteres.
  const tieneMinimoCaracteres =
    password.length >= 8;
  // Valida que la contraseña contenga una letra mayúscula.
  const tieneMayuscula =
    /[A-Z]/.test(
      password,
    );
  // Valida que la contraseña contenga una letra minúscula.
  const tieneMinuscula =
    /[a-z]/.test(
      password,
    );
  // Valida que la contraseña contenga al menos un número.
  const tieneNumero =
    /\d/.test(
      password,
    );
  // Valida que la contraseña contenga un carácter especial.
  const tieneEspecial =
    /[^A-Za-z0-9]/.test(
      password,
    );
  // Indica si la contraseña cumple todos los requisitos definidos.
  const passwordValida =
    tieneMinimoCaracteres &&
    tieneMayuscula &&
    tieneMinuscula &&
    tieneNumero &&
    tieneEspecial;
  // Comprueba que ambas contraseñas ingresadas coincidan.
  const passwordsCoinciden =
    confirmarPassword.length > 0 &&
    password ===
      confirmarPassword;
  // ============================================
  // ACTIVAR CUENTA
  // ============================================
  // Envía los datos al backend para activar la cuenta.
  const activarCuenta =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();
      setError('');
      // Muestra el estado de enlace inválido cuando no existe token.
      if (!token) {
        setError(
          'El enlace de activación no es válido.',
        );
        return;
      }
      const nombreLimpio =
        nombreUsuario.trim();
      // Evalúa estados especiales antes de mostrar el formulario principal.
      if (
        nombreLimpio === ''
      ) {
        setError(
          'Debe ingresar su nombre.',
        );
        return;
      }
      if (
        nombreLimpio.length >
        50
      ) {
        setError(
          'El nombre no puede superar los 50 caracteres.',
        );
        return;
      }
      if (!passwordValida) {
        setError(
          'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.',
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
        setGuardando(
          true,
        );
        await api.post(
          '/usuarios/activar',
          {
            token,
            nombre_usuario:
              nombreLimpio,
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
            'No se pudo activar la cuenta.',
          );
        }
      } finally {
        setGuardando(
          false,
        );
      }
    };
  // ============================================
  // TOKEN NO EXISTE
  // ============================================
  if (!token) {
    return (
      <AuthLayout>
        <section
          className="auth-card"
        >
          <div
            className="auth-card__body text-center"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
              <TriangleAlert
                size={30}
              />
            </div>
            <h2 className="mt-5 text-2xl font-bold text-[#16313E]">
              Enlace inválido
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              El enlace de activación
              no contiene un token válido.
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
              Ir a iniciar sesión
            </button>
          </div>
        </section>
      </AuthLayout>
    );
  }
  // ============================================
  // CUENTA ACTIVADA
  // ============================================
  if (
    cuentaActivada
  ) {
    return (
      <AuthLayout>
        <section
          className="auth-card"
        >
          <div
            className="auth-card__body text-center"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
              <Check
                size={31}
                strokeWidth={3}
              />
            </div>
            <h2 className="mt-5 text-2xl font-bold text-[#16313E]">
              Cuenta activada
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Su contraseña fue creada
              correctamente.
              <br />
              Ya puede ingresar al sistema.
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
  // ============================================
  // FORMULARIO
  // ============================================
  return (
    <AuthLayout ancho="amplio">
      <section
        className="auth-card"
      >
        <div
          className="auth-card__body"
        >
          {/* ICONO */}
          <div
            className="auth-card__icon"
          >
            <User
              size={22}
            />
          </div>
          {/* ENCABEZADO */}
          <div
            className="auth-card__header"
          >
            <h2>
              Activar cuenta
            </h2>
            <p>
              Complete la información
              para finalizar la creación
              de su cuenta.
            </p>
          </div>
          {/* ERROR */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {/* FORMULARIO */}
          <form
            onSubmit={
              activarCuenta
            }
            className="space-y-5"
          >
            {/* NOMBRE */}
            <div>
              <div className="mb-2 flex items-center justify-between gap-4">
                <label className="block text-sm font-semibold text-[#16313E]">
                  Nombre
                </label>
                <span
                  className={
                    `text-xs ${
                      nombreUsuario.length >=
                      50
                        ? 'font-semibold text-red-600'
                        : 'text-slate-400'
                    }`
                  }
                >
                  {
                    nombreUsuario.length
                  }
                  /50
                </span>
              </div>
              <div
                className="relative"
              >
                <User
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={
                    nombreUsuario
                  }
                  onChange={(
                    event,
                  ) =>
                    setNombreUsuario(
                      event.target.value.slice(
                        0,
                        50,
                      ),
                    )
                  }
                  required
                  maxLength={50}
                  autoFocus
                  autoComplete="name"
                  placeholder="Ingrese su nombre"
                  className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#315F73] focus:ring-2 focus:ring-[#E8F0F4]"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                Máximo 50 caracteres.
              </p>
            </div>
            {/* CONTRASEÑA */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#16313E]">
                Nueva contraseña
              </label>
              <div
                className="relative"
              >
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
                    password
                  }
                  onChange={(
                    event,
                  ) =>
                    setPassword(
                      event.target.value,
                    )
                  }
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Ingrese su contraseña"
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
                  {
                    mostrarPassword
                      ? (
                        <EyeOff
                          size={19}
                        />
                      )
                      : (
                        <Eye
                          size={19}
                        />
                      )
                  }
                </button>
              </div>
              {/* REQUISITOS */}
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-3 text-xs font-semibold text-[#16313E]">
                  La contraseña debe contener:
                </p>
                <div className="space-y-1.5 text-xs">
                  <p
                    className={
                      tieneMinimoCaracteres
                        ? 'font-medium text-green-600'
                        : 'text-slate-500'
                    }
                  >
                    {
                      tieneMinimoCaracteres
                        ? '✓'
                        : '○'
                    }{' '}
                    Mínimo 8 caracteres
                  </p>
                  <p
                    className={
                      tieneMayuscula
                        ? 'font-medium text-green-600'
                        : 'text-slate-500'
                    }
                  >
                    {
                      tieneMayuscula
                        ? '✓'
                        : '○'
                    }{' '}
                    Una letra mayúscula
                  </p>
                  <p
                    className={
                      tieneMinuscula
                        ? 'font-medium text-green-600'
                        : 'text-slate-500'
                    }
                  >
                    {
                      tieneMinuscula
                        ? '✓'
                        : '○'
                    }{' '}
                    Una letra minúscula
                  </p>
                  <p
                    className={
                      tieneNumero
                        ? 'font-medium text-green-600'
                        : 'text-slate-500'
                    }
                  >
                    {
                      tieneNumero
                        ? '✓'
                        : '○'
                    }{' '}
                    Un número
                  </p>
                  <p
                    className={
                      tieneEspecial
                        ? 'font-medium text-green-600'
                        : 'text-slate-500'
                    }
                  >
                    {
                      tieneEspecial
                        ? '✓'
                        : '○'
                    }{' '}
                    Un carácter especial
                  </p>
                </div>
              </div>
            </div>
            {/* CONFIRMAR CONTRASEÑA */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#16313E]">
                Confirmar contraseña
              </label>
              <div
                className="relative"
              >
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
                  onChange={(
                    event,
                  ) =>
                    setConfirmarPassword(
                      event.target.value,
                    )
                  }
                  required
                  autoComplete="new-password"
                  placeholder="Repita su contraseña"
                  className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#315F73] focus:ring-2 focus:ring-[#E8F0F4]"
                />
              </div>
              {
                confirmarPassword &&
                (
                  <p
                    className={
                      `mt-2 text-xs font-medium ${
                        passwordsCoinciden
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`
                    }
                  >
                    {
                      passwordsCoinciden
                        ? '✓ Las contraseñas coinciden.'
                        : 'Las contraseñas no coinciden.'
                    }
                  </p>
                )
              }
            </div>
            {/* MOSTRAR CONTRASEÑAS */}
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={
                  mostrarPassword
                }
                onChange={(
                  event,
                ) =>
                  setMostrarPassword(
                    event.target.checked,
                  )
                }
                className="accent-[#315F73]"
              />
              Mostrar contraseñas
            </label>
            {/* INFORMACIÓN */}
            <div className="rounded-xl border border-[#D9E2E7] bg-[#F4F7F8] p-4">
              <p className="text-sm leading-6 text-[#315F73]">
                Su contraseña será almacenada
                de forma segura y no será visible
                para los administradores del sistema.
              </p>
            </div>
            {/* BOTÓN */}
            <button
              type="submit"
              disabled={
                guardando ||
                !passwordValida ||
                !passwordsCoinciden ||
                nombreUsuario
                  .trim()
                  .length === 0
              }
              className="w-full rounded-lg bg-[#315F73] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#244C5F] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {
                guardando
                  ? 'Activando cuenta...'
                  : 'Crear contraseña y activar cuenta'
              }
            </button>
          </form>
        </div>
      </section>
    </AuthLayout>
  );
}

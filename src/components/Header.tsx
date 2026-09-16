import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logoMunicipalidad from '../assets/logo-municipalidad-grecia.webp';

interface HeaderProps {
  title: string;
  description: string;
  showBackButton?: boolean;
}

interface UsuarioSesion {
  id_usuario?: number;
  nombre_usuario?: string | null;
  correo?: string;
  estado?: boolean;
}

export default function Header({
  title,
  description,
  showBackButton = true,
}: HeaderProps) {
  const navigate = useNavigate();

  const obtenerUsuario = (): UsuarioSesion | null => {
    try {
      const usuarioGuardado = localStorage.getItem('usuario');

      if (!usuarioGuardado) {
        return null;
      }

      return JSON.parse(usuarioGuardado);
    } catch {
      return null;
    }
  };

  const usuario = obtenerUsuario();

  const nombreUsuario =
    usuario?.nombre_usuario?.trim() || 'Usuario';

  const correoUsuario =
    usuario?.correo?.trim() || 'Correo no disponible';

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');

    navigate('/login', {
      replace: true,
    });
  };

  return (
    <header className="municipal-header">
      <div className="municipal-header__inner">

        {/* LOGO Y TÍTULO */}
        <div className="municipal-header__brand">
          <img
            src={logoMunicipalidad}
            alt="Municipalidad de Grecia - Gobierno Local"
            className="municipal-header__logo"
          />

          <div className="municipal-header__divider" />

          <div className="min-w-0">
            <p className="municipal-header__system">
              Sistema de Catastro
            </p>

            <h1 className="municipal-header__title">
              {title}
            </h1>

            <p className="municipal-header__description">
              {description}
            </p>
          </div>
        </div>

        {/* USUARIO Y BOTONES */}
        <div className="flex flex-col items-end gap-2">

          {/* INFORMACIÓN DEL USUARIO */}
          <div className="flex items-center gap-3 rounded-xl border border-[#D9E2E7] bg-[#F4F7F8] px-4 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8F0F4] text-[#315F73]">
              <User size={18} />
            </div>

            <div className="min-w-0 text-left">
              <p
                className="max-w-[220px] truncate text-sm font-bold text-[#16313E]"
                title={nombreUsuario}
              >
                {nombreUsuario}
              </p>

              <p
                className="max-w-[220px] truncate text-xs text-slate-500"
                title={correoUsuario}
              >
                {correoUsuario}
              </p>
            </div>
          </div>

          {/* BOTONES */}
          <div className="municipal-header__actions">

            {showBackButton && (
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="municipal-button municipal-button--secondary"
              >
                Volver al panel
              </button>
            )}

            <button
              type="button"
              onClick={cerrarSesion}
              className="municipal-button municipal-button--danger flex items-center gap-2"
            >
              <LogOut size={16} />
              Cerrar sesión
            </button>

          </div>

        </div>
      </div>

      <div className="municipal-header__stripe">
        <span />
        <span />
        <span />
      </div>
    </header>
  );
}
import { useMemo, useState } from 'react';
import {
  ClipboardList,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  History,
  Home,
  LogOut,
  MapPin,
  Menu,
  ShieldCheck,
  TreePine,
  Users,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import logoMunicipalidad from '../assets/logo-municipalidad-grecia.webp';

// Estructura de cada opción del menú lateral.
interface ModuloNavegacion {
  titulo: string;
  ruta: string;
  icono: LucideIcon;
  color: string;
}

// Módulos disponibles en la navegación principal.
const modulos: ModuloNavegacion[] = [
  {
    titulo: 'Inicio',
    ruta: '/dashboard',
    icono: Home,
    color: '#315F73',
  },
  {
    titulo: 'Parques',
    ruta: '/parques',
    icono: TreePine,
    color: '#18843B',
  },
  {
    titulo: 'Distritos',
    ruta: '/distritos',
    icono: MapPin,
    color: '#18843B',
  },
  {
    titulo: 'Encargados',
    ruta: '/encargados',
    icono: Users,
    color: '#315F73',
  },
  {
    titulo: 'Mantenimientos',
    ruta: '/mantenimientos',
    icono: Wrench,
    color: '#18843B',
  },
  {
    titulo: 'Convenios',
    ruta: '/convenios',
    icono: FileText,
    color: '#315F73',
  },
  {
    titulo: 'Declaraciones',
    ruta: '/declaraciones',
    icono: ClipboardList,
    color: '#315F73',
  },
  {
    titulo: 'Listado de Parques',
    ruta: '/listado-parques',
    icono: FileSpreadsheet,
    color: '#315F73',
  },
  {
    titulo: 'Auditoría',
    ruta: '/auditoria',
    icono: History,
    color: '#D4112E',
  },
  {
    titulo: 'Usuarios',
    ruta: '/usuarios',
    icono: ShieldCheck,
    color: '#D4112E',
  },
];

// Datos básicos del usuario almacenados en localStorage.
interface UsuarioLocal {
  nombre_usuario?: string | null;
  correo?: string | null;
}

export default function SidebarCatastro() {
  const navigate = useNavigate();
  const location = useLocation();

  // Controla la apertura del menú en dispositivos móviles.
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  // Recupera los datos del usuario guardados al iniciar sesión.
  const usuario = useMemo<UsuarioLocal>(() => {
    try {
      return JSON.parse(
        localStorage.getItem('usuario') ?? '{}',
      );
    } catch {
      return {};
    }
  }, []);

  // Define el nombre que se mostrará en el panel del usuario.
  const nombreUsuario =
    usuario.nombre_usuario?.trim() ||
    usuario.correo?.split('@')[0] ||
    'Usuario';

  // Obtiene las iniciales para el avatar.
  const iniciales = nombreUsuario
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('');

  // Navega al módulo seleccionado y cierra el menú móvil.
  const irA = (ruta: string) => {
    navigate(ruta);
    setMenuMovilAbierto(false);
  };

  // Elimina los datos de sesión y vuelve al login.
  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');

    navigate('/login', {
      replace: true,
    });
  };

  // Contenido compartido entre la versión de escritorio y móvil.
  const contenido = (
    <aside className="flex h-full flex-col bg-[#071923] text-white">
      {/* Encabezado del sistema */}
      <div className="border-b border-white/10 px-5 pb-5 pt-6">
        <img
          src={logoMunicipalidad}
          alt="Municipalidad de Grecia"
          className="h-12 w-auto object-contain"
        />

        <div className="mt-4">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-emerald-400">
            Gobierno Local
          </p>

          <h2 className="mt-1 text-lg font-black tracking-tight text-white">
            Sistema de Catastro
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Gestión Territorial
          </p>
        </div>
      </div>

      {/* Navegación principal */}
      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
          Navegación
        </p>

        <div className="space-y-1">
          {modulos.map((modulo) => {
            const Icono = modulo.icono;

            // Determina qué módulo está activo según la ruta actual.
            const activo =
              location.pathname === modulo.ruta ||
              (
                modulo.ruta !== '/dashboard' &&
                location.pathname.startsWith(
                  `${modulo.ruta}/`,
                )
              );

            return (
              <button
                key={modulo.ruta}
                type="button"
                onClick={() => irA(modulo.ruta)}
                className={
                  activo
                    ? 'group flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 text-left shadow-sm'
                    : 'group flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left transition hover:border-white/5 hover:bg-white/5'
                }
              >
                <span
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border"
                  style={{
                    backgroundColor: `${modulo.color}18`,
                    color: modulo.color,
                    borderColor: `${modulo.color}32`,
                  }}
                >
                  <Icono
                    size={18}
                    strokeWidth={2.2}
                  />
                </span>

                <span
                  className={
                    activo
                      ? 'min-w-0 flex-1 truncate text-sm font-bold text-white'
                      : 'min-w-0 flex-1 truncate text-sm font-semibold text-slate-300 transition group-hover:text-white'
                  }
                >
                  {modulo.titulo}
                </span>

                <ChevronRight
                  size={15}
                  className={
                    activo
                      ? 'flex-shrink-0 text-slate-300'
                      : 'flex-shrink-0 text-slate-600 transition group-hover:text-slate-300'
                  }
                />
              </button>
            );
          })}
        </div>
      </nav>

      {/* Información del usuario y cierre de sesión */}
      <div className="border-t border-white/10 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#18843B] text-xs font-black text-white">
            {iniciales || 'U'}
          </div>

          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-white">
              {nombreUsuario}
            </p>

            <p className="truncate text-[10px] text-slate-400">
              {usuario.correo || 'Sesión activa'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={cerrarSesion}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs font-bold text-red-300 transition hover:bg-red-500/20"
        >
          <LogOut size={15} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Sidebar para pantallas grandes */}
      <div className="fixed bottom-0 left-0 top-1.5 z-40 hidden w-[270px] border-r border-white/10 shadow-2xl lg:block">
        {contenido}
      </div>

      {/* Botón para abrir el menú en móvil */}
      <button
        type="button"
        onClick={() => setMenuMovilAbierto(true)}
        aria-label="Abrir menú"
        className="fixed left-3 top-4 z-[55] flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#0B212D]/95 text-white shadow-xl backdrop-blur lg:hidden"
      >
        <Menu size={20} />
      </button>

      {/* Menú lateral para dispositivos móviles */}
      {menuMovilAbierto && (
        <div className="fixed inset-0 z-[65] lg:hidden">
          <button
            type="button"
            onClick={() => setMenuMovilAbierto(false)}
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <div className="absolute bottom-0 left-0 top-0 w-[285px] shadow-2xl">
            {contenido}

            <button
              type="button"
              onClick={() => setMenuMovilAbierto(false)}
              aria-label="Cerrar menú"
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
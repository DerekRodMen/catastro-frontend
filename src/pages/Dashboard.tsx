import { useNavigate } from 'react-router-dom';
import type { ElementType } from 'react';
import {
  TreePine,
  Users,
  MapPin,
  FileText,
  ClipboardList,
  Wrench,
  FileSpreadsheet,
  History,
  ShieldCheck,
  ArrowUpRight,
  LogOut,
  Building2,
  Layers,
} from 'lucide-react';

import fondoGrecia from '../assets/grecia-login.jpg';
import logoMunicipalidad from '../assets/logo-municipalidad-grecia.webp';

interface Module {
  title: string;
  description: string;
  icon: ElementType;
  route: string;
  accentHex: string;
  borderHover: string;
}

const modules: Module[] = [
  // Fila 1
  {
    title: 'Parques',
    description: 'Gestión de los parques registrados y su información catastral.',
    icon: TreePine,
    route: '/parques',
    accentHex: '#18843B',
    borderHover: 'hover:border-emerald-500/80',
  },
  {
    title: 'Distritos',
    description: 'Gestión de los distritos registrados en el sistema.',
    icon: MapPin,
    route: '/distritos',
    accentHex: '#18843B',
    borderHover: 'hover:border-emerald-500/80',
  },
  {
    title: 'Encargados',
    description: 'Gestión de Encargados y Representante legal de los parques.',
    icon: Users,
    route: '/encargados',
    accentHex: '#38bdf8',
    borderHover: 'hover:border-sky-500/80',
  },

  // Fila 2
  {
    title: 'Mantenimientos',
    description: 'Registro y seguimiento de los mantenimientos realizados en los parques.',
    icon: Wrench,
    route: '/mantenimientos',
    accentHex: '#18843B',
    borderHover: 'hover:border-emerald-500/80',
  },
  {
    title: 'Convenios',
    description: 'Gestión de los convenios asociados a los parques.',
    icon: FileText,
    route: '/convenios',
    accentHex: '#38bdf8',
    borderHover: 'hover:border-sky-500/80',
  },
  {
    title: 'Declaraciones',
    description: 'Administración de las declaraciones y su vigencia.',
    icon: ClipboardList,
    route: '/declaraciones',
    accentHex: '#38bdf8',
    borderHover: 'hover:border-sky-500/80',
  },

  // Fila 3
  {
    title: 'Listado de Parques',
    description: 'Consulta, filtre y genere el listado de propiedades municipales en Excel.',
    icon: FileSpreadsheet,
    route: '/listado-parques',
    accentHex: '#94a3b8',
    borderHover: 'hover:border-slate-400',
  },
  {
    title: 'Auditoría',
    description: 'Consulta del historial de acciones realizadas por los usuarios del sistema.',
    icon: History,
    route: '/auditoria',
    accentHex: '#D4112E',
    borderHover: 'hover:border-rose-500/80',
  },
  {
    title: 'Usuarios',
    description: 'Administración de los usuarios del sistema.',
    icon: ShieldCheck,
    route: '/usuarios',
    accentHex: '#D4112E',
    borderHover: 'hover:border-rose-500/80',
  },
];

export default function Dashboard() {
  const navigate = useNavigate();

  const handleCerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/login', { replace: true });
  };

  return (
    <div className="relative min-h-screen w-full font-sans antialiased text-white flex flex-col justify-between overflow-x-hidden">
      {/* 1. IMAGEN DE FONDO FIJA */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${fondoGrecia})` }}
      />

      {/* 2. OVERLAY OSCURO */}
      <div
        className="fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(circle at 12% 12%, rgba(5, 25, 36, 0.98) 0%, rgba(5, 25, 36, 0.88) 28%, transparent 58%), linear-gradient(180deg, rgba(6, 20, 28, 0.85) 0%, rgba(6, 20, 28, 0.93) 100%)',
        }}
      />

      {/* 3. FRANJA TRICOLOR INSTITUCIONAL */}
      <div className="fixed inset-x-0 top-0 z-50 grid h-1.5 grid-cols-[2.2fr_1fr_.7fr]">
        <span className="bg-[#315F73]" />
        <span className="bg-[#18843B]" />
        <span className="bg-[#D4112E]" />
      </div>

      {/* 4. CABECERA FLOTANTE */}
      <header className="relative z-30 w-full border-b border-white/10 bg-[#0B212D]/80 backdrop-blur-xl px-6 lg:px-12 py-3.5 shadow-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          
          <div className="flex items-center gap-4">
            <img
              src={logoMunicipalidad}
              alt="Municipalidad de Grecia"
              className="h-11 w-auto object-contain drop-shadow-md"
            />
            <div className="hidden h-9 w-[1px] bg-white/20 sm:block" />
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="inline-block rounded bg-[#18843B]/30 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-[#86efac]">
                  Gobierno Local
                </span>
                <span className="text-[11px] text-slate-300">· Cantón de Grecia</span>
              </div>
              <h1 className="text-base font-extrabold text-white tracking-tight">
                Sistema de Catastro Municipal
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3.5 py-1.5 backdrop-blur-md">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#18843B] text-xs font-bold text-white shadow-sm">
                DR
              </div>
              <div className="text-left leading-tight">
                <p className="text-xs font-bold text-white">Derek Rodríguez</p>
                <p className="text-[10px] text-slate-300">Administrador de Catastro</p>
              </div>
            </div>

            <button
              onClick={handleCerrarSesion}
              title="Cerrar sesión"
              className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-600/80 px-3.5 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-md transition-all hover:bg-red-600 hover:border-red-500 active:scale-95"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* 5. CONTENIDO PRINCIPAL */}
      <main className="relative z-20 mx-auto w-full max-w-7xl px-6 lg:px-12 py-8 flex-1">
        
        {/* BANNER DE BIENVENIDA */}
        <div className="mb-8 rounded-2xl border border-white/10 bg-[#0c2330]/85 p-6 lg:p-7 text-white shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
              <Building2 size={16} />
              <span>Departamento de Gestión Territorial</span>
            </div>
            <h2 className="mt-2 text-2xl lg:text-3xl font-black tracking-tight text-white">
              Panel Administrativo de Catastro
            </h2>
            <p className="mt-1.5 text-sm text-slate-300 leading-relaxed">
              Consulte y gestione el inventario cantonal de parques, convenios interinstitucionales y el registro de bienes públicos municipales.
            </p>
          </div>

          <div className="pointer-events-none absolute -right-12 -bottom-12 h-44 w-44 rounded-full bg-[#18843B]/20 blur-2xl" />
        </div>

        {/* TÍTULO DE SECCIÓN */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-300">
            <Layers size={15} className="text-[#18843B]" />
            <span>Módulos de Administración</span>
          </div>
          <span className="text-xs text-slate-400">Seleccione un área para gestionar</span>
        </div>

        {/* CUADRÍCULA DE MÓDULOS */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <button
                type="button"
                key={module.title}
                onClick={() => navigate(module.route)}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#0d222e]/85 p-6 text-left shadow-xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:bg-[#102b3b]/90 ${module.borderHover}`}
              >
                {/* Acento superior de color */}
                <div
                  className="absolute inset-x-0 top-0 h-1.5 transition-all duration-300 group-hover:h-2"
                  style={{ backgroundColor: module.accentHex }}
                />

                <div>
                  {/* Icono */}
                  <div className="mb-4">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl shadow-inner transition-transform duration-300 group-hover:scale-105"
                      style={{
                        backgroundColor: `${module.accentHex}20`,
                        color: module.accentHex,
                        border: `1px solid ${module.accentHex}40`,
                      }}
                    >
                      <Icon size={24} strokeWidth={2.2} />
                    </div>
                  </div>

                  {/* Título y tu descripción original intacta */}
                  <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-emerald-300 transition-colors">
                    {module.title}
                  </h3>

                  <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                    {module.description}
                  </p>
                </div>

                {/* Pie de tarjeta */}
                <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3 text-xs font-semibold text-slate-400 group-hover:text-white transition-colors">
                  <span>Abrir panel</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 border border-white/10 group-hover:bg-[#18843B] group-hover:border-[#18843B] group-hover:text-white transition-all">
                    <ArrowUpRight size={14} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </main>

      {/* 6. PIE DE PÁGINA */}
      <footer className="relative z-20 border-t border-white/10 bg-[#071923]/90 py-4 px-6 text-center text-xs text-slate-400 backdrop-blur-md">
        Sistema de Catastro Municipal · Municipalidad de Grecia, Gobierno Local
      </footer>
    </div>
  );
}
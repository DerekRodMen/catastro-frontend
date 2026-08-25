import type { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';

interface ModuleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
}

export default function ModuleCard({
  title,
  description,
  icon: Icon,
  onClick,
}: ModuleCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg"
    >
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-colors group-hover:bg-slate-900 group-hover:text-white">
        <Icon size={24} />
      </div>

      <h2 className="mb-2 text-lg font-semibold text-slate-900">
        {title}
      </h2>

      <p className="mb-5 min-h-12 text-sm leading-6 text-slate-500">
        {description}
      </p>

      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
        Ver módulo
        <ArrowRight
          size={16}
          className="transition-transform group-hover:translate-x-1"
        />
      </div>
    </button>
  );
}
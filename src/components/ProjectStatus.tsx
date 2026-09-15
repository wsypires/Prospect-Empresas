import { ReactNode } from 'react';
import { CheckCircle2, Layers, Cpu, FileCode, Zap } from 'lucide-react';
import { ENVIRONMENT_SPECS } from '../data/starterTemplates.ts';

const ICONS_MAP: Record<string, ReactNode> = {
  React: <Zap className="w-4 h-4 text-sky-600" />,
  TypeScript: <FileCode className="w-4 h-4 text-blue-600" />,
  'Tailwind CSS': <Layers className="w-4 h-4 text-teal-600" />,
  Vite: <Cpu className="w-4 h-4 text-amber-600" />,
};

export function ProjectStatus() {
  return (
    <section id="project-status-section" className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-zinc-100">
        <div>
          <h2 id="status-heading" className="text-base font-semibold text-zinc-900">
            Pilha Tecnológica Verificada
          </h2>
          <p id="status-description" className="text-sm text-zinc-500">
            Todas as dependências e compiladores estão configurados e ativos no contêiner.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-md font-medium w-fit">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>4 de 4 módulos integrados</span>
        </div>
      </div>

      <div id="tech-stack-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {ENVIRONMENT_SPECS.map((spec) => (
          <div
            key={spec.name}
            id={`spec-card-${spec.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
            className="rounded-lg border border-zinc-200/80 bg-zinc-50/50 p-3.5 transition-colors hover:border-zinc-300"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-white border border-zinc-200 flex items-center justify-center shadow-2xs">
                  {ICONS_MAP[spec.name] ?? <Zap className="w-4 h-4 text-zinc-600" />}
                </div>
                <span className="font-medium text-sm text-zinc-900">{spec.name}</span>
              </div>
              <span className="text-xs font-mono text-zinc-500 bg-white px-2 py-0.5 rounded border border-zinc-200">
                v{spec.version}
              </span>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              {spec.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

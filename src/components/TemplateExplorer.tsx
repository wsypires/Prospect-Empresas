import { useState } from 'react';
import { STARTER_TEMPLATES } from '../data/starterTemplates.ts';
import { ProjectTemplate } from '../types.ts';
import { ArrowRight, Copy, Check, Sparkles } from 'lucide-react';

export function TemplateExplorer() {
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate>(STARTER_TEMPLATES[0]);
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="template-explorer-section" className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs">
      <div className="pb-4 mb-4 border-b border-zinc-100">
        <h2 id="templates-heading" className="text-base font-semibold text-zinc-900">
          O que você deseja desenvolver a seguir?
        </h2>
        <p id="templates-description" className="text-sm text-zinc-500">
          Selecione um modelo de arquitetura para visualizar uma sugestão de prompt pronta para enviar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Template List */}
        <div id="templates-list-column" className="md:col-span-1 space-y-2">
          {STARTER_TEMPLATES.map((tmpl) => {
            const isSelected = selectedTemplate.id === tmpl.id;
            return (
              <button
                key={tmpl.id}
                id={`template-item-${tmpl.id}`}
                type="button"
                onClick={() => setSelectedTemplate(tmpl)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-zinc-900 bg-zinc-900 text-white shadow-xs'
                    : 'border-zinc-200 bg-zinc-50/60 hover:bg-zinc-100/80 text-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-2xs font-medium px-1.5 py-0.5 rounded ${
                      isSelected
                        ? 'bg-zinc-800 text-zinc-300'
                        : 'bg-zinc-200/80 text-zinc-700'
                    }`}
                  >
                    {tmpl.category}
                  </span>
                  {isSelected && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <h3 className="text-sm font-semibold leading-tight line-clamp-1">
                  {tmpl.title}
                </h3>
              </button>
            );
          })}
        </div>

        {/* Template Detail & Prompt Box */}
        <div id="template-detail-column" className="md:col-span-2 flex flex-col justify-between rounded-lg border border-zinc-200 bg-zinc-50/50 p-5">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-200 text-zinc-800">
                {selectedTemplate.category}
              </span>
              <div className="flex items-center gap-1.5">
                {selectedTemplate.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-2xs px-2 py-0.5 rounded-full bg-white border border-zinc-200 text-zinc-600 font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <h3 id="selected-template-title" className="text-lg font-bold text-zinc-900 mb-1">
              {selectedTemplate.title}
            </h3>
            <p id="selected-template-desc" className="text-xs text-zinc-600 mb-4 leading-relaxed">
              {selectedTemplate.description}
            </p>

            <div className="mt-4">
              <label className="text-xs font-semibold text-zinc-700 block mb-1.5">
                Sugestão de comando para solicitar no chat:
              </label>
              <div className="relative rounded-lg border border-zinc-300 bg-white p-3.5 text-xs text-zinc-800 font-mono leading-relaxed">
                {selectedTemplate.suggestedPrompt}
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-zinc-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-zinc-500">
              Copie o texto acima e envie na caixa de mensagem para gerar a aplicação completa.
            </p>
            <button
              id="btn-copy-suggested-prompt"
              type="button"
              onClick={() => handleCopy(selectedTemplate.suggestedPrompt)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-colors shadow-2xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Sugestão</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

import { useState, FormEvent } from 'react';
import { Sparkles, Copy, Check } from 'lucide-react';

export function PromptAssistant() {
  const [userInput, setUserInput] = useState('');
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = (e: FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const refined = `Construa um aplicativo completo de "${userInput.trim()}". Inclua interface limpa e responsiva, navegação intuitiva, listagem de itens, formulário de adição/edição de dados, filtros de busca e persistência em estado local.`;
    setEnhancedPrompt(refined);
  };

  const handleCopy = () => {
    if (!enhancedPrompt) return;
    navigator.clipboard.writeText(enhancedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="prompt-assistant-section" className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs">
      <div className="pb-4 mb-4 border-b border-zinc-100">
        <h2 id="assistant-heading" className="text-base font-semibold text-zinc-900">
          Personalize seu Próximo Passo
        </h2>
        <p id="assistant-description" className="text-sm text-zinc-500">
          Tem uma ideia em mente? Digite brevemente para estruturar um comando claro para a IA.
        </p>
      </div>

      <form id="prompt-builder-form" onSubmit={handleGenerate} className="space-y-4">
        <div>
          <label htmlFor="user-idea-input" className="block text-xs font-medium text-zinc-700 mb-1.5">
            O que você quer criar?
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="user-idea-input"
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ex: Gestor de estoque para cafeteria, Clínica veterinária, Portfólio..."
              className="flex-1 rounded-lg border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
            />
            <button
              id="btn-generate-prompt"
              type="submit"
              disabled={!userInput.trim()}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Estruturar Pedido</span>
            </button>
          </div>
        </div>

        {enhancedPrompt && (
          <div id="enhanced-prompt-container" className="mt-4 p-4 rounded-lg border border-zinc-200 bg-zinc-50/70">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-700">Prompt Estruturado Pronto:</span>
              <button
                id="btn-copy-enhanced"
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-900 font-medium"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar texto</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs font-mono text-zinc-800 bg-white border border-zinc-200 rounded p-3 leading-relaxed">
              {enhancedPrompt}
            </p>
          </div>
        )}
      </form>
    </section>
  );
}

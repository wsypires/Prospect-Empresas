import { useState } from 'react';
import { Plus, Minus, RotateCcw, Check, Sparkles } from 'lucide-react';

export function InteractiveTester() {
  const [count, setCount] = useState<number>(1);
  const [lastAction, setLastAction] = useState<string>('Inicialização');
  const [activeTab, setActiveTab] = useState<'contador' | 'estado'>('contador');

  const handleIncrement = () => {
    setCount((prev) => prev + 1);
    setLastAction(`Incrementado para ${count + 1}`);
  };

  const handleDecrement = () => {
    setCount((prev) => (prev > 0 ? prev - 1 : 0));
    setLastAction(`Decrementado para ${Math.max(0, count - 1)}`);
  };

  const handleReset = () => {
    setCount(0);
    setLastAction('Contador reiniciado para 0');
  };

  return (
    <section id="interactive-tester-section" className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-zinc-100">
        <div>
          <h2 id="tester-heading" className="text-base font-semibold text-zinc-900">
            Teste de Reatividade em Tempo Real
          </h2>
          <p id="tester-description" className="text-sm text-zinc-500">
            Verifique o estado reativo do React e os manipuladores de eventos da aplicação.
          </p>
        </div>

        <div id="tester-tabs-group" className="inline-flex rounded-lg border border-zinc-200 p-0.5 bg-zinc-50">
          <button
            id="tab-btn-contador"
            type="button"
            onClick={() => setActiveTab('contador')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'contador'
                ? 'bg-white text-zinc-900 shadow-2xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Contador
          </button>
          <button
            id="tab-btn-estado"
            type="button"
            onClick={() => setActiveTab('estado')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'estado'
                ? 'bg-white text-zinc-900 shadow-2xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Log de Estado
          </button>
        </div>
      </div>

      {activeTab === 'contador' ? (
        <div id="counter-panel" className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="md:col-span-2 rounded-lg border border-zinc-200/80 bg-zinc-50/50 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs text-zinc-500 block mb-1">Valor do Estado Atual</span>
              <div className="flex items-baseline gap-2">
                <span id="counter-value-display" className="text-3xl font-bold font-mono text-zinc-900">
                  {count}
                </span>
                <span className="text-xs text-zinc-500">unidades registradas</span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Última ação: <span className="font-medium text-zinc-700">{lastAction}</span>
              </p>
            </div>

            <div id="counter-controls-group" className="flex items-center gap-2">
              <button
                id="btn-counter-decrement"
                type="button"
                onClick={handleDecrement}
                className="w-9 h-9 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-100 flex items-center justify-center text-zinc-700 transition-colors shadow-2xs"
                title="Diminuir"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                id="btn-counter-increment"
                type="button"
                onClick={handleIncrement}
                className="w-9 h-9 rounded-lg border border-zinc-900 bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-white transition-colors shadow-2xs"
                title="Aumentar"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                id="btn-counter-reset"
                type="button"
                onClick={handleReset}
                className="w-9 h-9 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-100 flex items-center justify-center text-zinc-600 transition-colors shadow-2xs ml-1"
                title="Reiniciar"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div id="counter-info-box" className="rounded-lg border border-emerald-200/80 bg-emerald-50/40 p-4">
            <div className="flex items-center gap-2 text-emerald-800 text-xs font-semibold mb-1">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Manipulação Reativa OK</span>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              O ciclo de renderização do React 19 está funcionando com precisão e sem erros de ciclo de vida.
            </p>
          </div>
        </div>
      ) : (
        <div id="state-log-panel" className="rounded-lg border border-zinc-200 bg-zinc-900 text-zinc-200 p-4 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800 mb-2 text-zinc-400">
            <span>Snapshot de Memória</span>
            <span className="text-emerald-400 text-2xs">JSON_OBJECT</span>
          </div>
          <pre className="overflow-x-auto text-zinc-300">
            {JSON.stringify(
              {
                project: 'Novo Projeto',
                status: 'operational',
                localTime: new Date().toLocaleTimeString('pt-BR'),
                reactiveState: {
                  count,
                  lastAction,
                  activeTab,
                },
              },
              null,
              2
            )}
          </pre>
        </div>
      )}
    </section>
  );
}

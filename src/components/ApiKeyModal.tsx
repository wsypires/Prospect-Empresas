import React, { useState } from 'react';
import { KeyRound, X, Check, ExternalLink, ShieldCheck } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentApiKey: string;
  onSaveApiKey: (newKey: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  currentApiKey,
  onSaveApiKey,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState(currentApiKey || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveApiKey(apiKeyInput.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#ecebfa] text-[#5c59e8] flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1e1e2f]">
                Chave de API Google Maps Platform
              </h2>
              <p className="text-xs text-[#6e7191]">Configuração de servidor segura</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-5 space-y-4">
          <div>
            <label htmlFor="api-key-input" className="block text-xs font-bold text-[#1e1e2f] uppercase tracking-wider mb-1.5">
              Google Maps API Key (Places API New)
            </label>
            <input
              id="api-key-input"
              type="text"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-4 py-2.5 text-xs font-mono border border-slate-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[#5c59e8]/20 focus:border-[#5c59e8] bg-[#f3f5fa] text-[#1e1e2f]"
            />
            <p className="text-xs text-[#6e7191] mt-1.5 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#10b981] inline" />
              Sua chave é utilizada com segurança através do servidor para consulta do Google Places.
            </p>
          </div>

          <div className="bg-[#edf3ff] border border-blue-100/80 rounded-2xl p-4 text-xs text-[#1e1e2f] space-y-1.5">
            <p className="font-bold text-[#3b82f6]">Requisitos no Google Cloud Console:</p>
            <ul className="list-disc pl-4 space-y-1 text-[#6e7191]">
              <li>API ativada: <strong>Places API (New)</strong></li>
              <li>Faturamento (Billing) ativo no projeto Google Cloud</li>
              <li>Sem restrições de IP que bloqueiem requisições de servidor</li>
            </ul>
            <a
              href="https://console.cloud.google.com/google/maps-apis/overview"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[#5c59e8] hover:underline pt-1 font-bold"
            >
              Abrir Google Cloud Console <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#6e7191] hover:text-[#1e1e2f] bg-transparent rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-[#5c59e8] hover:bg-[#4f4cd9] rounded-2xl shadow-md cursor-pointer transition-colors"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" /> Salvo!
                </>
              ) : (
                'Salvar Chave'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

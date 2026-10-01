import React from 'react';
import { X, MessageSquare, UploadCloud, FileCode2, CheckCircle2 } from 'lucide-react';

interface ChatInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadZipClick: () => void;
}

export const ChatInstructionsModal: React.FC<ChatInstructionsModalProps> = ({
  isOpen,
  onClose,
  onUploadZipClick,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative text-left">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Como Enviar Seus Arquivos
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Você pode carregar o projeto tanto diretamente nesta interface quanto pelo chat.
          </p>
        </div>

        <div className="space-y-4">
          {/* Method 1 */}
          <div className="border border-slate-800 bg-slate-950/60 rounded-xl p-4 flex gap-4 items-start">
            <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Opção 1: Upload Direto no Navegador</h3>
                <span className="text-[11px] text-emerald-400 font-medium">Recomendado</span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Arraste o arquivo <code className="font-mono text-indigo-300">.zip</code> diretamente sobre qualquer parte da janela ou clique no botão abaixo.
                O descompactamento ocorre instantaneamente no seu navegador sem limite de tamanho e sem necessidade de envio a servidores externos.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onUploadZipClick();
                }}
                className="mt-3 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Selecionar Arquivo .ZIP</span>
              </button>
            </div>
          </div>

          {/* Method 2 */}
          <div className="border border-slate-800 bg-slate-950/60 rounded-xl p-4 flex gap-4 items-start">
            <div className="w-10 h-10 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-white">Opção 2: Enviar no Chat</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Você também pode colar os arquivos de código ou enviar trechos diretamente na conversa aqui no chat.
                Eu farei a leitura, organizarei os arquivos no repositório e integrarei diretamente na aplicação.
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Estou pronto para receber seus arquivos!</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <FileCode2 className="w-4 h-4 text-slate-400" />
            <span>Suporta HTML, React, Node.js, Python, TypeScript, etc.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

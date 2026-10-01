import React, { useRef, useState } from 'react';
import { UploadCloud, FolderUp, X, AlertCircle, Loader2 } from 'lucide-react';

interface ZipDropzoneProps {
  isOpen: boolean;
  onClose: () => void;
  onZipSelected: (file: File) => Promise<void>;
  isLoading: boolean;
}

export const ZipDropzone: React.FC<ZipDropzoneProps> = ({
  isOpen,
  onClose,
  onZipSelected,
  isLoading,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setErrorMessage(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await processSelectedFile(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    if (e.target.files && e.target.files[0]) {
      await processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = async (file: File) => {
    try {
      if (!file.name.endsWith('.zip') && !file.type.includes('zip') && !file.type.includes('compressed')) {
        setErrorMessage('Por favor, selecione um arquivo no formato .ZIP compactado.');
        return;
      }
      await onZipSelected(file);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao processar arquivo comprimido.';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-left mb-5">
          <h2 className="text-lg font-bold text-white tracking-tight">
            Carregar Arquivos Compactados
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Envie seu arquivo <span className="font-mono text-indigo-400">.zip</span> para descompactar e navegar no projeto.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-950/40 border border-rose-800/80 rounded-lg flex items-center gap-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Dropzone Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !isLoading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-indigo-500 bg-indigo-500/10'
              : 'border-slate-700 hover:border-slate-600 bg-slate-950/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,application/zip,application/x-zip-compressed"
            className="hidden"
            onChange={handleFileChange}
          />

          {isLoading ? (
            <div className="flex flex-col items-center py-4">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-3" />
              <p className="text-sm font-medium text-slate-200">Descompactando arquivos...</p>
              <p className="text-xs text-slate-500 mt-1">Lendo entradas e gerando árvore de diretórios</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-200">
                Arraste e solte o arquivo .ZIP aqui
              </p>
              <p className="text-xs text-slate-400 mt-1">
                ou clique para procurar em seu computador
              </p>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-4 font-mono">
                <span>Formatos suportados: .ZIP</span>
                <span>·</span>
                <span>Processamento 100% no cliente</span>
              </div>
            </div>
          )}
        </div>

        {/* Secondary option: select folder if supported */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>Tem o projeto em uma pasta local?</span>
          <button
            onClick={() => folderInputRef.current?.click()}
            className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-medium"
          >
            <FolderUp className="w-3.5 h-3.5" />
            <span>Selecionar Pasta</span>
          </button>
          <input
            ref={folderInputRef}
            type="file"
            // @ts-expect-error webkitdirectory is non-standard but widely supported in Chromium/Firefox/Safari
            webkitdirectory=""
            directory=""
            multiple
            className="hidden"
            onChange={async (e) => {
              if (e.target.files && e.target.files.length > 0) {
                // If user selects folder, handle folder upload
                // We'll read the files directly
                onClose();
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

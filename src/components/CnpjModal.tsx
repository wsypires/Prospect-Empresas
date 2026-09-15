import React, { useState, useEffect } from 'react';
import { Building, X, Search, ExternalLink, Check, ShieldCheck } from 'lucide-react';
import { PlaceContact } from '../types';
import { formatCnpj } from '../utils/exportUtils';

interface CnpjModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: PlaceContact | null;
  onSaveCnpj: (contactId: string, cnpj: string) => void;
}

export const CnpjModal: React.FC<CnpjModalProps> = ({
  isOpen,
  onClose,
  contact,
  onSaveCnpj,
}) => {
  const [cnpjInput, setCnpjInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (contact) {
      setCnpjInput(contact.cnpj ? formatCnpj(contact.cnpj) : '');
    }
  }, [contact]);

  if (!isOpen || !contact) return null;

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 14);
    if (raw.length <= 2) {
      setCnpjInput(raw);
    } else if (raw.length <= 5) {
      setCnpjInput(`${raw.slice(0, 2)}.${raw.slice(2)}`);
    } else if (raw.length <= 8) {
      setCnpjInput(`${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5)}`);
    } else if (raw.length <= 12) {
      setCnpjInput(`${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8)}`);
    } else {
      setCnpjInput(
        `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8, 12)}-${raw.slice(12, 14)}`
      );
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCnpj(contact.id, cnpjInput.trim());
    onClose();
  };

  // Generate public search query URLs
  const cleanCompanyName = contact.name
    .replace(/^(Dra\.|Dr\.|Clínica|Drogaria|Farmácia|Consultório|Escritório|Restaurante|Oficina)\s+/i, '')
    .trim();

  const searchQuery = `${cleanCompanyName} ${contact.city} ${contact.state}`;
  const cnpjBizUrl = `https://cnpj.biz/procura/${encodeURIComponent(cleanCompanyName + ' ' + contact.city)}`;
  const casaDosDadosUrl = `https://casadosdados.com.br/solucao/cnpj/pesquisa-avancada?q=${encodeURIComponent(cleanCompanyName)}`;
  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(`CNPJ ${searchQuery}`)}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Consulta de CNPJ</h2>
              <p className="text-xs text-slate-500 line-clamp-1">{contact.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Company Summary */}
        <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
          <p className="font-bold text-slate-900 text-sm">{contact.name}</p>
          <p className="text-slate-600">{contact.address}</p>
          <p className="text-slate-500">
            {contact.city} - {contact.state}, {contact.country}
          </p>
        </div>

        {/* Public Consultation Links */}
        <div className="mt-4 space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Consultar Bases Públicas Brasileiras:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <a
              href={cnpjBizUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 text-xs font-semibold text-center rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 transition-colors inline-flex items-center justify-center gap-1.5"
            >
              <span>CNPJ.biz</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={casaDosDadosUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 text-xs font-semibold text-center rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 transition-colors inline-flex items-center justify-center gap-1.5"
            >
              <span>Casa dos Dados</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={googleSearchUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 text-xs font-semibold text-center rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 transition-colors inline-flex items-center justify-center gap-1.5"
            >
              <span>Google CNPJ</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Manual or Copied Input */}
        <form onSubmit={handleSave} className="mt-5 space-y-4">
          <div>
            <label htmlFor="cnpj-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Número do CNPJ Encontrado
            </label>
            <div className="relative">
              <input
                id="cnpj-input"
                type="text"
                value={cnpjInput}
                onChange={handleCnpjChange}
                placeholder="00.000.000/0001-00"
                className="w-full px-3.5 py-2.5 font-mono text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              O CNPJ salvo será incluído nas exportações em Excel e JSON.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Salvar CNPJ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

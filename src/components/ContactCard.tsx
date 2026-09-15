import React from 'react';
import {
  MessageCircle,
  Phone,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  Building,
  Star,
  Globe,
  Search,
  Tag,
  StickyNote,
} from 'lucide-react';
import { PlaceContact } from '../types';
import { formatCnpj } from '../utils/exportUtils';
import { formatWhatsAppUrl } from '../utils/whatsappUtils';

interface ContactCardProps {
  contact: PlaceContact;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onOpenCnpjModal: (contact: PlaceContact) => void;
  onUpdateStatus?: (id: string, status: 'Enviado' | 'Pendente') => void;
  onToggleFavorite?: (id: string) => void;
  onOpenNoteModal?: (contact: PlaceContact) => void;
  whatsappTemplate?: string;
}

export const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  isSelected,
  onToggleSelect,
  onOpenCnpjModal,
  onUpdateStatus,
  onToggleFavorite,
  onOpenNoteModal,
  whatsappTemplate,
}) => {
  const [copied, setCopied] = React.useState(false);

  const displayPhone = contact.nationalPhone || contact.internationalPhone || 'Sem telefone';
  const hasPhone = Boolean(contact.whatsappPhone || contact.nationalPhone);
  const hasWhatsapp = Boolean(contact.whatsappUrl);

  const handleCopy = () => {
    navigator.clipboard.writeText(displayPhone);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className={`bg-white rounded-3xl border p-5 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover-elevate transition-all flex flex-col justify-between ${
        isSelected
          ? 'border-[#5c59e8] ring-2 ring-[#5c59e8]/20 bg-[#ecebfa]/10'
          : 'border-slate-100 hover:border-slate-200'
      }`}
    >
      <div>
        {/* Top bar: Checkbox, Name & Status Selection Tag */}
        <div className="flex items-start justify-between gap-2.5 mb-2.5">
          <div className="flex items-start gap-2.5">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(contact.id)}
              className="mt-1 rounded text-[#5c59e8] focus:ring-[#5c59e8] w-4 h-4 border-slate-300 cursor-pointer"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-[#1e1e2f] text-sm leading-tight">
                  {contact.name}
                </h3>
                {onToggleFavorite && (
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(contact.id)}
                    className="text-slate-300 hover:text-amber-500 cursor-pointer transition-colors"
                    title={contact.isFavorite ? 'Remover dos favoritos' : 'Marcar como favorito'}
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        contact.isFavorite
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-300 hover:text-amber-400'
                      }`}
                    />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1 mt-1">
                {contact.keyword && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#5c59e8] bg-[#ecebfa] border border-[#5c59e8]/20 px-2 py-0.5 rounded-full">
                    <Tag className="w-2.5 h-2.5" />
                    {contact.keyword}
                  </span>
                )}
                {contact.types && contact.types.length > 0 && (
                  <span className="inline-block text-[10px] font-medium text-[#6e7191] bg-[#f3f5fa] px-2 py-0.5 rounded-full capitalize">
                    {contact.types[0].replace(/_/g, ' ')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status Tag (Enviado / Pendente) */}
          <div className="shrink-0">
            <div className="relative inline-flex items-center">
              <select
                value={contact.outreachStatus || 'Pendente'}
                onChange={(e) =>
                  onUpdateStatus?.(contact.id, e.target.value as 'Enviado' | 'Pendente')
                }
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border cursor-pointer appearance-none pr-5 transition-all shadow-2xs focus:outline-hidden ${
                  contact.outreachStatus === 'Enviado'
                    ? 'bg-[#e8fbf2] text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-[#fef4ea] text-amber-800 border-amber-300 hover:bg-amber-100'
                }`}
                title="Alterar status de envio"
              >
                <option value="Pendente">⏳ Pendente</option>
                <option value="Enviado">✓ Enviado</option>
              </select>
              <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] text-slate-500">
                ▼
              </span>
            </div>
          </div>
        </div>

        {/* Note / Observação badge if present, or button to add note */}
        <div className="mb-2">
          {contact.notes ? (
            <div
              onClick={() => onOpenNoteModal?.(contact)}
              className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-2 text-[11px] text-amber-900 cursor-pointer hover:bg-amber-100/80 transition-colors flex items-start gap-1.5"
              title="Clique para editar a anotação"
            >
              <StickyNote className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <p className="line-clamp-2 leading-relaxed font-medium">{contact.notes}</p>
            </div>
          ) : onOpenNoteModal ? (
            <button
              type="button"
              onClick={() => onOpenNoteModal(contact)}
              className="inline-flex items-center gap-1 text-[11px] text-[#6e7191] hover:text-[#5c59e8] font-medium cursor-pointer"
            >
              <StickyNote className="w-3 h-3 text-[#a0a3bd]" />
              <span>+ Adicionar anotação</span>
            </button>
          ) : null}
        </div>

        {/* Rating */}
        {contact.rating !== null && (
          <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-xl text-xs font-bold text-amber-800 w-fit mb-2">
            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span>{contact.rating.toFixed(1)}</span>
            <span className="text-[10px] text-amber-600 font-normal">({contact.userRatingCount})</span>
          </div>
        )}

        {/* Address */}
        <div className="flex items-start gap-2 text-xs text-[#6e7191] mt-2">
          <MapPin className="w-3.5 h-3.5 text-[#a0a3bd] shrink-0 mt-0.5" />
          <p className="line-clamp-2 leading-relaxed">{contact.address}</p>
        </div>

        {/* CNPJ Info */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-[#6e7191]">
            <Building className="w-3.5 h-3.5 text-[#a0a3bd]" />
            <span className="font-semibold text-[#1e1e2f]">CNPJ:</span>
            {contact.cnpj ? (
              <span className="font-mono text-[#1e1e2f] font-bold">{formatCnpj(contact.cnpj)}</span>
            ) : (
              <span className="text-[#a0a3bd] italic">Pendente</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => onOpenCnpjModal(contact)}
            className="text-[11px] font-bold text-[#5c59e8] hover:text-[#4f4cd9] cursor-pointer inline-flex items-center gap-1"
          >
            <Search className="w-3 h-3" />
            {contact.cnpj ? 'Editar' : 'Localizar'}
          </button>
        </div>

        {/* Phone details & Copy */}
        {hasPhone && (
          <div className="mt-2.5 flex items-center justify-between text-xs font-mono text-[#1e1e2f] bg-[#f3f5fa] px-3 py-2 rounded-2xl border border-slate-200/60">
            <span>{displayPhone}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="text-[#a0a3bd] hover:text-[#5c59e8] p-0.5 cursor-pointer transition-colors"
              title="Copiar telefone"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
        {/* Primary WhatsApp CTA */}
        {hasWhatsapp ? (
          <a
            href={formatWhatsAppUrl(contact, whatsappTemplate) || contact.whatsappUrl!}
            target="_blank"
            rel="noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-xs transition-colors cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Chamar no WhatsApp</span>
          </a>
        ) : hasPhone ? (
          <a
            href={`tel:${contact.nationalPhone || contact.internationalPhone}`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#f3f5fa] hover:bg-[#ecebfa] text-[#1e1e2f] hover:text-[#5c59e8] font-bold text-xs rounded-2xl transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Ligar</span>
          </a>
        ) : (
          <div className="flex-1 text-center py-2 text-xs text-[#a0a3bd] italic">
            Sem telefone
          </div>
        )}

        {/* Website link if available */}
        {contact.website && (
          <a
            href={contact.website}
            target="_blank"
            rel="noreferrer"
            className="p-2 text-[#6e7191] hover:text-[#5c59e8] hover:bg-[#ecebfa] rounded-2xl border border-slate-200 transition-colors cursor-pointer"
            title="Acessar site da empresa"
          >
            <Globe className="w-4 h-4" />
          </a>
        )}

        {/* Google Maps link */}
        <a
          href={contact.googleMapsUrl}
          target="_blank"
          rel="noreferrer"
          className="p-2 text-[#6e7191] hover:text-[#5c59e8] hover:bg-[#ecebfa] rounded-2xl border border-slate-200 transition-colors cursor-pointer"
          title="Ver no Google Maps"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};

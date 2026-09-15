import React, { useState, useEffect } from 'react';
import { StickyNote, X, Save, Trash2 } from 'lucide-react';
import { PlaceContact } from '../types';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: PlaceContact | null;
  onSaveNote: (contactId: string, note: string) => void;
}

export const NoteModal: React.FC<NoteModalProps> = ({
  isOpen,
  onClose,
  contact,
  onSaveNote,
}) => {
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    if (contact) {
      setNoteText(contact.notes || '');
    }
  }, [contact]);

  if (!isOpen || !contact) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveNote(contact.id, noteText);
    onClose();
  };

  const handleClear = () => {
    setNoteText('');
    onSaveNote(contact.id, '');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <StickyNote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1e1e2f]">Anotações do Contato</h3>
              <p className="text-[11px] text-[#6e7191] line-clamp-1">{contact.name}</p>
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

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="contact-notes-input"
              className="block text-xs font-bold text-[#1e1e2f] uppercase tracking-wider mb-1.5"
            >
              Observações / Histórico de Prospecção
            </label>
            <textarea
              id="contact-notes-input"
              rows={4}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Ex: Falei com o gerente Marcelo; enviar proposta na sexta-feira; tem interesse em renovação de site..."
              className="w-full px-3.5 py-2.5 text-xs bg-[#f3f5fa] border border-slate-200 rounded-2xl text-[#1e1e2f] placeholder-[#a0a3bd] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#5c59e8]/20 focus:border-[#5c59e8] transition-all"
              autoFocus
            />
            <p className="text-[11px] text-[#6e7191] mt-1.5">
              As anotações são salvas permanentemente no navegador e preservadas mesmo em novas buscas.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            {contact.notes ? (
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Apagar nota</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#6e7191] hover:text-[#1e1e2f] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#5c59e8] hover:bg-[#4f4cd9] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar Nota</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

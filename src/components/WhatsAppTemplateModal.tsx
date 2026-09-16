import React, { useState, useEffect } from 'react';
import {
  X,
  MessageCircle,
  Sparkles,
  Check,
  RotateCcw,
  Plus,
  Trash2,
  BookmarkPlus,
  Send,
  AlertTriangle,
} from 'lucide-react';
import {
  DEFAULT_WHATSAPP_TEMPLATE,
  PRESET_WHATSAPP_TEMPLATES,
  WhatsAppPresetTemplate,
  getSavedTemplatesList,
  saveTemplatesList,
  formatWhatsAppMessage,
} from '../utils/whatsappUtils';
import { PlaceContact } from '../types';

interface WhatsAppTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTemplate: string;
  onSaveTemplate: (newTemplate: string) => void;
  sampleContact?: PlaceContact | null;
}

export const WhatsAppTemplateModal: React.FC<WhatsAppTemplateModalProps> = ({
  isOpen,
  onClose,
  currentTemplate,
  onSaveTemplate,
  sampleContact,
}) => {
  const [template, setTemplate] = useState<string>(currentTemplate || DEFAULT_WHATSAPP_TEMPLATE);
  const [savedFeedback, setSavedFeedback] = useState<boolean>(false);
  const [templates, setTemplates] = useState<WhatsAppPresetTemplate[]>(() => getSavedTemplatesList());

  // Add template inline form state
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');

  // Delete confirmation state
  const [templateIdToDelete, setTemplateIdToDelete] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTemplate(currentTemplate || DEFAULT_WHATSAPP_TEMPLATE);
      setSavedFeedback(false);
      setIsAddingNew(false);
      setTemplateIdToDelete(null);
      setTemplates(getSavedTemplatesList());
    }
  }, [isOpen, currentTemplate]);

  if (!isOpen) return null;

  // Mock contact for live preview if none provided
  const previewContact: PlaceContact = sampleContact || {
    id: 'sample_preview',
    name: 'Restaurante & Café Sabor Nobre',
    keyword: 'Restaurante',
    cnpj: '12.345.678/0001-90',
    cnpjStatus: 'verified',
    address: 'Av. Paulista, 1578 - Bela Vista',
    neighborhood: 'Bela Vista',
    postalCode: '01310-200',
    city: 'São Paulo',
    state: 'SP',
    country: 'Brasil',
    nationalPhone: '(11) 98765-4321',
    internationalPhone: '+55 11 98765-4321',
    whatsappPhone: '5511987654321',
    whatsappUrl: null,
    isMobile: true,
    website: 'https://exemplo.com.br',
    googleMapsUrl: 'https://maps.google.com',
    rating: 4.8,
    userRatingCount: 342,
    businessStatus: 'OPERATIONAL',
    location: null,
    types: ['restaurant'],
  };

  const previewText = formatWhatsAppMessage(template, previewContact);

  const showTempNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 2500);
  };

  const handleInsertVariable = (variable: string) => {
    setTemplate((prev) => {
      return prev ? `${prev} ${variable}` : variable;
    });
  };

  const handleSave = () => {
    const finalTemplate = template.trim() || DEFAULT_WHATSAPP_TEMPLATE;
    onSaveTemplate(finalTemplate);
    setSavedFeedback(true);
    setTimeout(() => {
      setSavedFeedback(false);
      onClose();
    }, 700);
  };

  const handleResetToDefault = () => {
    setTemplate(DEFAULT_WHATSAPP_TEMPLATE);
    showTempNotification('Texto restaurado para a mensagem padrão.');
  };

  const handleRestoreAllTemplates = () => {
    setTemplates([...PRESET_WHATSAPP_TEMPLATES]);
    saveTemplatesList([...PRESET_WHATSAPP_TEMPLATES]);
    showTempNotification('Modelos originais restaurados com sucesso.');
  };

  const handleAddNewTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTpl: WhatsAppPresetTemplate = {
      id: `custom_${Date.now()}`,
      title: newTitle.trim(),
      description: newDescription.trim() || 'Modelo personalizado criado por você',
      template: template.trim() || DEFAULT_WHATSAPP_TEMPLATE,
    };

    const updated = [newTpl, ...templates];
    setTemplates(updated);
    saveTemplatesList(updated);
    setNewTitle('');
    setNewDescription('');
    setIsAddingNew(false);
    showTempNotification(`Modelo "${newTpl.title}" adicionado!`);
  };

  const handleConfirmDelete = (id: string) => {
    const target = templates.find((t) => t.id === id);
    const updated = templates.filter((t) => t.id !== id);
    setTemplates(updated);
    saveTemplatesList(updated);
    setTemplateIdToDelete(null);
    showTempNotification(`Modelo "${target?.title || ''}" excluído com sucesso.`);
  };

  const variables = [
    { tag: '{empresa}', label: 'Nome da Empresa', desc: 'Ex: Padaria Central' },
    { tag: '{cidade}', label: 'Cidade', desc: 'Ex: Curitiba' },
    { tag: '{nicho}', label: 'Nicho/Segmento', desc: 'Ex: Restaurante' },
    { tag: '{endereco}', label: 'Endereço', desc: 'Ex: Rua XV de Novembro' },
    { tag: '{telefone}', label: 'Telefone', desc: 'Ex: (41) 99999-9999' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto border-modal flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-xs">
              <MessageCircle className="w-5 h-5 fill-emerald-600 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Modelos de Mensagem WhatsApp
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Personalização de texto para envio direto
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Temporary Notification Banner */}
        {notification && (
          <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-2.5 flex items-center gap-2 text-xs font-semibold text-emerald-800 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{notification}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 space-y-5 flex-1">
          {/* Tag insertion toolbar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Variáveis Dinâmicas
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {variables.map((v) => (
                <button
                  key={v.tag}
                  type="button"
                  onClick={() => handleInsertVariable(v.tag)}
                  className="px-2.5 py-1 text-xs font-mono font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/70 rounded-xl transition-all hover:scale-105 cursor-pointer shadow-2xs"
                  title={`Inserir ${v.desc}`}
                >
                  <span className="font-bold text-emerald-600">+</span> {v.tag}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Texto da Mensagem:
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-xl transition-colors cursor-pointer border border-emerald-200/60"
                >
                  <BookmarkPlus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Salvar como Novo</span>
                </button>
                <span className="text-[11px] font-mono text-slate-400">
                  {template.length} caracteres
                </span>
              </div>
            </div>
            <textarea
              rows={4}
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              placeholder="Digite sua mensagem aqui... Use {empresa} para o nome do negócio."
              className="w-full p-3.5 text-sm bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-sans leading-relaxed"
            />
          </div>

          {/* Inline Add New Template Form */}
          {isAddingNew && (
            <form
              onSubmit={handleAddNewTemplate}
              className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-3 animate-fadeIn"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <Plus className="w-4 h-4 text-emerald-700" />
                  <span>Cadastrar Novo Modelo</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Nome do Modelo *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ex: Prospecção Imobiliária"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Descrição Breve (Opcional)
                  </label>
                  <input
                    type="text"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Ex: Para corretores e imobiliárias"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="text-[11px] text-slate-600 bg-white/70 p-2.5 rounded-xl border border-emerald-100">
                <span className="font-semibold text-emerald-800">Texto que será gravado:</span>
                <p className="line-clamp-2 mt-0.5 text-slate-700 italic">
                  "{template.trim() || DEFAULT_WHATSAPP_TEMPLATE}"
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-colors cursor-pointer shadow-2xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Adicionar à Lista</span>
                </button>
              </div>
            </form>
          )}

          {/* Templates List (Modelos Salvos) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Modelos de Mensagem Salvos ({templates.length})
              </span>
              <div className="flex items-center gap-2">
                {!isAddingNew && (
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(true)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-xl transition-colors cursor-pointer border border-emerald-200/60"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Modelo</span>
                  </button>
                )}
                {templates.length === 0 && (
                  <button
                    type="button"
                    onClick={handleRestoreAllTemplates}
                    className="text-xs font-semibold text-[#5c59e8] hover:underline cursor-pointer"
                  >
                    Restaurar Padrões
                  </button>
                )}
              </div>
            </div>

            {/* Template Cards Grid */}
            {templates.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-2xl">
                <p className="text-xs text-slate-500 mb-2">Nenhum modelo cadastrado.</p>
                <button
                  type="button"
                  onClick={handleRestoreAllTemplates}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Modelos Originais</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {templates.map((tpl) => {
                  const isSelected = template.trim() === tpl.template.trim();
                  const isConfirmingDelete = templateIdToDelete === tpl.id;

                  return (
                    <div
                      key={tpl.id}
                      className={`relative p-3.5 text-left rounded-2xl border transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-emerald-50/60 border-emerald-400 shadow-2xs'
                          : 'bg-slate-50/80 hover:bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-xs font-bold text-slate-900 line-clamp-1">
                            {tpl.title}
                          </span>

                          <div className="flex items-center gap-1 shrink-0">
                            {isSelected && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-1.5 py-0.5 rounded-md">
                                Em uso
                              </span>
                            )}

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTemplateIdToDelete(tpl.id);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title={`Excluir modelo "${tpl.title}"`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {tpl.description && (
                          <p className="text-[11px] text-slate-500 font-medium line-clamp-1 mb-1.5">
                            {tpl.description}
                          </p>
                        )}

                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-tight italic bg-white/70 p-2 rounded-xl border border-slate-100">
                          "{tpl.template}"
                        </p>
                      </div>

                      {/* Card Action / Delete Confirmation Overlay */}
                      {isConfirmingDelete ? (
                        <div className="mt-2.5 pt-2 border-t border-rose-100 flex items-center justify-between bg-rose-50/80 p-2 rounded-xl">
                          <span className="text-[11px] font-bold text-rose-800 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            Excluir este modelo?
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setTemplateIdToDelete(null)}
                              className="px-2 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-white rounded-md cursor-pointer"
                            >
                              Não
                            </button>
                            <button
                              type="button"
                              onClick={() => handleConfirmDelete(tpl.id)}
                              className="px-2.5 py-0.5 text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-md cursor-pointer shadow-2xs"
                            >
                              Sim, excluir
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 pt-1 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setTemplate(tpl.template);
                              showTempNotification(`Modelo "${tpl.title}" carregado!`);
                            }}
                            className={`text-xs font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                              isSelected
                                ? 'text-emerald-700 bg-emerald-100 hover:bg-emerald-200/80'
                                : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            {isSelected ? '✓ Selecionado' : 'Usar este modelo'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Live Simulated Preview on WhatsApp */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                Prévia da Conversa (Como a empresa receberá)
              </span>
              <span className="text-[10px] font-medium text-slate-400">
                Exemplo: {previewContact.name}
              </span>
            </div>

            {/* WhatsApp Chat Simulation Bubble */}
            <div className="p-4 rounded-2xl bg-[#eae6df] border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                  {previewContact.name.charAt(0)}
                </div>
                <div className="leading-tight">
                  <div className="text-xs font-bold text-slate-800">
                    {previewContact.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {previewContact.nationalPhone}
                  </div>
                </div>
              </div>

              {/* Message Bubble */}
              <div className="bg-[#dcf8c6] text-slate-900 p-3 rounded-2xl rounded-tr-xs shadow-2xs text-xs leading-relaxed max-w-[88%] ml-auto border border-emerald-200/50 relative">
                <p className="whitespace-pre-wrap break-words">{previewText}</p>
                <div className="text-right mt-1 text-[9px] text-emerald-800 font-mono font-medium">
                  Agora • Enviada ✓✓
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 sticky bottom-0 rounded-b-3xl">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Padrão</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className={`inline-flex items-center gap-2 px-5 py-2.5 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer text-white ${
                savedFeedback
                  ? 'bg-emerald-700 scale-98'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {savedFeedback ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Salvo</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 fill-white" />
                  <span>Salvar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
